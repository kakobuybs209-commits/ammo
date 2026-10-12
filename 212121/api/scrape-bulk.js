// Vercel Serverless Function: Bulk Scrape Weidian Products
// Endpoint: /api/scrape-bulk
// Scrapes multiple products in parallel with concurrency control

// CRITICAL: iPhone User-Agent required to get product images instead of store logo
const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 6;

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
        const { urls, concurrency } = req.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        console.log(`🚀 Bulk scraping ${urls.length} products...`);

        const limit = Math.min(MAX_CONCURRENCY, concurrency || DEFAULT_CONCURRENCY);
        const results = await scrapeMany(urls, limit);

        const successes = results.filter(r => r.success).length;
        const failures = results.filter(r => !r.success).length;

        console.log(`✅ Bulk scrape complete: ${successes} success, ${failures} failed`);

        return res.status(200).json({
            success: true,
            results,
            summary: {
                total: urls.length,
                successes,
                failures
            }
        });

    } catch (error) {
        console.error('❌ Bulk scraping error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Bulk scraping failed'
        });
    }
}

/**
 * Scrape multiple products with concurrency control
 */
async function scrapeMany(urls, concurrency) {
    const results = new Array(urls.length);
    let nextIndex = 0;

    const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
        while (nextIndex < urls.length) {
            const i = nextIndex++;
            const url = urls[i];
            
            try {
                const itemId = extractItemId(url);
                if (!itemId) {
                    results[i] = {
                        success: false,
                        url,
                        error: 'Invalid Weidian URL'
                    };
                    continue;
                }

                const productData = await scrapeWeidianProduct(itemId);
                results[i] = {
                    success: true,
                    url,
                    data: productData
                };
                console.log(`✅ [${i + 1}/${urls.length}] Scraped: ${productData.name}`);
            } catch (error) {
                results[i] = {
                    success: false,
                    url,
                    error: error.message
                };
                console.error(`❌ [${i + 1}/${urls.length}] Failed: ${error.message}`);
            }
        }
    });

    await Promise.all(workers);
    return results;
}

/**
 * Scrape single Weidian product
 */
async function scrapeWeidianProduct(itemId) {
    const weidianUrl = `https://weidian.com/item.html?itemID=${itemId}`;

    const response = await fetch(weidianUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            'Referer': 'https://weidian.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    if (html.includes('请完成安全验证') || html.includes('安全验证') || html.length < 1000) {
        throw new Error('Blocked by Weidian security');
    }

    return extractProductFromHTML(html, itemId);
}

/**
 * Extract itemID from various URL formats
 */
function extractItemId(input) {
    const raw = String(input || '');

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
 */
function extractProductFromHTML(html, itemId) {
    const data = {
        id: itemId,
        name: '',
        price: 0,
        currency: 'CNY',
        image: null
    };

    const scriptMatch = html.match(/id="__rocker-render-inject__"[^>]*data-obj="([^"]+)"/);
    
    if (scriptMatch) {
        try {
            const jsonStr = scriptMatch[1]
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&#x27;/g, "'");
            
            const jsonData = JSON.parse(jsonStr);
            const itemInfo = jsonData?.result?.default_model?.item_info;
            
            if (itemInfo) {
                data.name = String(itemInfo.item_name || '').trim();
                data.price = parseFloat(itemInfo.origin_price) || 0;
                
                // Get variant images (better quality)
                const variantImages = [];
                const skuProperties = jsonData?.result?.default_model?.sku_properties;
                
                if (skuProperties?.attr_list) {
                    const imageAttr = skuProperties.attr_list.find(attr =>
                        attr.attr_values?.some(v => v.img)
                    );
                    
                    if (imageAttr?.attr_values) {
                        for (const val of imageAttr.attr_values) {
                            if (val.img) {
                                variantImages.push(val.img);
                            }
                        }
                    }
                }
                
                // Use variant image if available, otherwise main image
                const bestImage = variantImages.length > 0 ? variantImages[0] : itemInfo.item_head;
                data.image = formatImageUrl(bestImage);
            }
        } catch (e) {
            console.warn('JSON parse failed:', e.message);
        }
    }

    // Fallback to meta tags
    if (!data.name || !data.price || !data.image) {
        const fallback = extractFromMetaTags(html);
        if (!data.name) data.name = fallback.name;
        if (!data.price) data.price = fallback.price;
        if (!data.image) data.image = fallback.image;
    }

    if (data.price === 0) {
        data.price = 299;
    }

    return data;
}

/**
 * Fallback: Extract from meta tags
 */
function extractFromMetaTags(html) {
    const data = { name: '', price: 0, image: null };

    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    data.name = ogTitleMatch ? cleanText(ogTitleMatch[1]) : 
                titleMatch ? cleanText(titleMatch[1].replace(/[-_]微店/, '')) : 
                'Unnamed Product';

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
