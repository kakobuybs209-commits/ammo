// Vercel Serverless Function: Scrape Weidian Product
// Endpoint: /api/scrape-weidian

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

        // Extract itemID from URL
        const itemIdMatch = url.match(/itemID[=%](\d+)/i);
        if (!itemIdMatch) {
            return res.status(400).json({ error: 'Invalid Weidian URL' });
        }

        const itemId = itemIdMatch[1];
        const weidianUrl = `https://weidian.com/item.html?itemID=${itemId}`;

        console.log('🔍 Scraping:', weidianUrl);

        // Fetch the page with browser-like headers
        const response = await fetch(weidianUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://weidian.com/',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            console.error('❌ HTTP Error:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        // Debug: Log first 500 chars of HTML
        console.log('📄 HTML preview:', html.substring(0, 500));

        // Check if we got blocked
        if (html.includes('请完成安全验证') || html.includes('安全验证') || html.length < 1000) {
            console.error('🚫 Blocked by Weidian anti-bot');
            throw new Error('Blocked by Weidian security. Try again later.');
        }

        // Extract product data from HTML
        const productData = extractProductData(html, itemId);

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
 * Extract product data from Weidian HTML
 */
function extractProductData(html, itemId) {
    const data = {
        id: itemId,
        name: '',
        price: 0,
        currency: 'CNY',
        image: null
    };

    // Method 1: Try to extract from JSON-LD structured data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
        try {
            const jsonData = JSON.parse(jsonLdMatch[1]);
            if (jsonData.name) data.name = cleanText(jsonData.name);
            if (jsonData.offers && jsonData.offers.price) {
                data.price = parseFloat(jsonData.offers.price);
            }
            if (jsonData.image) {
                data.image = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
            }
        } catch (e) {
            console.warn('Failed to parse JSON-LD:', e.message);
        }
    }

    // Method 2: Extract from meta tags
    if (!data.name) {
        const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        data.name = ogTitleMatch ? cleanText(ogTitleMatch[1]) : 
                    titleMatch ? cleanText(titleMatch[1].replace(/[-_]微店/, '')) : 
                    'Unnamed Product';
    }

    if (!data.image) {
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (ogImageMatch) {
            data.image = ogImageMatch[1];
        }
    }

    // Method 3: Extract price from various patterns
    if (data.price === 0) {
        // Try price in meta tags
        const priceMatch = html.match(/<meta property="og:price:amount" content="([^"]+)"/);
        if (priceMatch) {
            data.price = parseFloat(priceMatch[1]);
        }
        
        // Try price in HTML (¥199, ¥199.00, 199元, etc.)
        if (data.price === 0) {
            const pricePatterns = [
                /[¥￥][\s]*([0-9]+\.?[0-9]*)/,
                /price["']?:\s*["']?([0-9]+\.?[0-9]*)/i,
                /([0-9]+\.?[0-9]*)[\s]*元/,
                /"price":\s*"?([0-9]+\.?[0-9]*)"?/
            ];
            
            for (const pattern of pricePatterns) {
                const match = html.match(pattern);
                if (match) {
                    const parsed = parseFloat(match[1]);
                    if (parsed > 0 && parsed < 100000) { // Sanity check
                        data.price = parsed;
                        break;
                    }
                }
            }
        }
    }

    // Method 4: Extract image from common patterns
    if (!data.image) {
        const imagePatterns = [
            /"mainImage":"([^"]+)"/,
            /"img":"([^"]+)"/,
            /"thumb":"([^"]+)"/,
            /data-src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
            /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i
        ];
        
        for (const pattern of imagePatterns) {
            const match = html.match(pattern);
            if (match) {
                data.image = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
                // Convert to HTTPS if needed
                if (data.image.startsWith('//')) {
                    data.image = 'https:' + data.image;
                }
                break;
            }
        }
    }

    // Fallback: If still no price, set default
    if (data.price === 0) {
        data.price = 299; // Default fallback price
    }

    // Clean up name
    data.name = data.name.replace(/[-_]微店.*$/, '').trim() || 'Unnamed Product';

    return data;
}

/**
 * Clean text by removing extra whitespace and HTML entities
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
