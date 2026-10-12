// Vercel Serverless Function: Scrape Weidian Product
// Endpoint: /api/scrape-weidian
// Based on scraper-core.js documentation

// CRITICAL: iPhone User-Agent required to get product images instead of store logo
const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Extract itemID from URL (supports various formats)
        const itemId = extractItemId(url);
        if (!itemId) {
            return res.status(400).json({ error: 'Invalid Weidian URL - no itemID found' });
        }

        const weidianUrl = `https://weidian.com/item.html?itemID=${itemId}`;

        console.log('🔍 Scraping:', weidianUrl);

        // Fetch with MOBILE User-Agent (critical for getting product images)
        const response = await fetch(weidianUrl, {
            headers: {
                'User-Agent': USER_AGENT,
                'Referer': 'https://weidian.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
        });

        if (!response.ok) {
            console.error('❌ HTTP Error:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        console.log('📄 HTML length:', html.length);

        // Check if blocked
        if (html.includes('请完成安全验证') || html.includes('安全验证') || html.length < 1000) {
            console.error('🚫 Blocked by Weidian anti-bot');
            throw new Error('Blocked by Weidian security');
        }

        // Extract product data from JSON embedded in page
        const productData = extractProductFromHTML(html, itemId);

        console.log('✅ Scraped:', productData);

        return res.status(200).json({
            success: true,
            data: productData
        });

    } catch (error) {
        console.error('❌ Scraping error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Scraping failed'
        });
    }
}

/**
 * Extract itemID from various URL formats
 */
function extractItemId(input) {
    const raw = String(input || '');

    // Decode URL if needed (may be encoded multiple times)
    let decoded = raw;
    for (let i = 0; i < 3; i++) {
        try {
            const next = decodeURIComponent(decoded);
            if (next === decoded) break;
            decoded = next;
        } catch {
            break;
        }
    }

    // Search for itemID in both versions
    for (const value of [raw, decoded]) {
        const match =
            value.match(/itemID=(\d+)/i) ||
            value.match(/itemID%3D(\d+)/i) ||
            value.match(/\/item\/(\d+)/i);
        if (match) return match[1];
    }

    return null;
}

/**
 * Format image URL with protocol and dimensions
 */
function formatImageUrl(imageUrl) {
    if (!imageUrl) return null;
    const absolute = imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`;
    const sep = absolute.includes('?') ? '&' : '?';
    return `${absolute}${sep}w=400&h=400`;
}

/**
 * Extract product data from HTML
 * Uses the #__rocker-render-inject__ script tag with JSON data
 */
function extractProductFromHTML(html, itemId) {
    const data = {
        id: itemId,
        name: '',
        price: 0,
        currency: 'CNY',
        image: null
    };

    console.log('🔎 HTML length:', html.length);
    console.log('🔎 Searching for __rocker-render-inject__...');

    // Find the JSON data in script tag (Weidian mobile site pattern)
    // Pattern: id="__rocker-render-inject__" data-obj="ESCAPED_JSON_HERE"
    const scriptMatch = html.match(/id="__rocker-render-inject__"[^>]*data-obj="([^"]+)"/);
    
    if (scriptMatch) {
        console.log('✅ Found __rocker-render-inject__');
        try {
            // Decode HTML entities
            const jsonStr = scriptMatch[1]
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&#x27;/g, "'");
            
            console.log('📝 JSON string length:', jsonStr.length);
            console.log('📝 JSON preview:', jsonStr.substring(0, 200));
            
            const jsonData = JSON.parse(jsonStr);
            console.log('✅ Parsed JSON successfully');
            
            const itemInfo = jsonData?.result?.default_model?.item_info;
            
            if (itemInfo) {
                console.log('✅ Found item_info');
                data.name = String(itemInfo.item_name || '').trim();
                data.price = parseFloat(itemInfo.origin_price) || 0;
                
                console.log('📦 Product name:', data.name);
                console.log('💰 Product price:', data.price);
                
                // Get main image
                const mainImage = itemInfo.item_head;
                console.log('🖼️ Main image:', mainImage);
                
                // Try to get variant images (better quality, multiple colors)
                const variantImages = [];
                const skuProperties = jsonData?.result?.default_model?.sku_properties;
                
                if (skuProperties?.attr_list) {
                    console.log('🎨 Found attr_list, checking for variant images...');
                    const imageAttr = skuProperties.attr_list.find(attr =>
                        attr.attr_values?.some(v => v.img)
                    );
                    
                    if (imageAttr?.attr_values) {
                        for (const val of imageAttr.attr_values) {
                            if (val.img) {
                                variantImages.push(val.img);
                                console.log('🎨 Found variant image:', val.img);
                            }
                        }
                    }
                }
                
                // Use variant image if available, otherwise main image
                const bestImage = variantImages.length > 0 ? variantImages[0] : mainImage;
                data.image = formatImageUrl(bestImage);
                
                console.log('✅ Final image URL:', data.image);
            } else {
                console.warn('⚠️ No item_info in JSON');
                console.log('📄 JSON structure:', Object.keys(jsonData || {}));
            }
        } catch (e) {
            console.error('❌ Failed to parse JSON from script tag:', e.message);
            console.error('Stack:', e.stack);
        }
    } else {
        console.warn('⚠️ __rocker-render-inject__ not found in HTML');
        console.log('📄 HTML preview (first 1000 chars):', html.substring(0, 1000));
    }

    // Fallback: try meta tags if JSON parsing failed
    if (!data.name || !data.price || !data.image) {
        console.log('🔄 Trying fallback meta tags extraction...');
        const fallbackData = extractFromMetaTags(html);
        if (!data.name) data.name = fallbackData.name;
        if (!data.price) data.price = fallbackData.price;
        if (!data.image) data.image = fallbackData.image;
    }

    // Final fallback for price
    if (data.price === 0) {
        data.price = 299; // Default fallback
    }

    return data;
}

/**
 * Fallback: Extract from meta tags
 */
function extractFromMetaTags(html) {
    const data = { name: '', price: 0, image: null };

    // Extract name
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    data.name = ogTitleMatch ? cleanText(ogTitleMatch[1]) : 
                titleMatch ? cleanText(titleMatch[1].replace(/[-_]微店/, '')) : 
                'Unnamed Product';

    // Extract price
    const pricePatterns = [
        /<meta property="og:price:amount" content="([^"]+)"/,
        /[¥￥][\s]*([0-9]+\.?[0-9]*)/,
        /([0-9]+\.?[0-9]*)[\s]*元/
    ];
    
    for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match) {
            const parsed = parseFloat(match[1]);
            if (parsed > 0 && parsed < 100000) {
                data.price = parsed;
                break;
            }
        }
    }

    // Extract image
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImageMatch) {
        data.image = ogImageMatch[1];
    }

    return data;
}

/**
 * Clean text
 */
function cleanText(text) {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}
