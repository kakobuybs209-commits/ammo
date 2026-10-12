/**
 * Template Import API for Vercel Serverless
 * Endpoint: /api/template-import
 */

const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function detectCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('jordan') || n.includes('dunk') || n.includes('nike') || n.includes('adidas') || n.includes('yeezy')) return 'Shoes';
  if (n.includes('hoodie') || n.includes('sweatshirt')) return 'Hoodies';
  if (n.includes('pants') || n.includes('jeans')) return 'Pants';
  if (n.includes('short')) return 'Shorts';
  if (n.includes('jacket') || n.includes('coat')) return 'Jackets';
  if (n.includes('bag')) return 'Bags';
  if (n.includes('shirt') || n.includes('tee')) return 'T-shirts';
  return 'Shoes';
}

function formatImageUrl(imageUrl) {
  if (!imageUrl) return '';
  let url = imageUrl.replace(/\?.*$/g, '');
  if (!url.startsWith('http')) url = 'https:' + url;
  return url + '?w=800&h=800';
}

async function scrapeWeidianProduct(itemId, customName) {
  const url = `https://weidian.com/item.html?itemID=${itemId}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://weidian.com/',
        'Accept': 'text/html',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const scriptTag = $('#__rocker-render-inject__');

    if (scriptTag.length === 0) {
      throw new Error('No data');
    }

    const data = JSON.parse(scriptTag.attr('data-obj'));
    const itemInfo = data?.result?.default_model?.item_info;
    
    if (!itemInfo) {
      throw new Error('No item info');
    }

    const price = parseFloat(itemInfo.origin_price) || 299;
    const skuProperties = data?.result?.default_model?.sku_properties;
    let image = itemInfo.item_head;

    if (skuProperties?.attr_list) {
      const imageAttr = skuProperties.attr_list.find(attr => attr.attr_values?.some(v => v.img));
      if (imageAttr?.attr_values?.[0]?.img) {
        image = imageAttr.attr_values[0].img;
      }
    }

    return {
      id: itemId,
      name: customName || itemInfo.item_name,
      price,
      image: formatImageUrl(image),
      category: detectCategory(customName || itemInfo.item_name),
      currency: 'CNY',
      seller: 'Weidian',
      link: url
    };
  } catch (error) {
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array required' });
    }

    console.log(`Scraping ${products.length} products...`);

    const results = [];
    for (const product of products) {
      try {
        const scraped = await scrapeWeidianProduct(product.id, product.name);
        results.push({
          success: true,
          data: scraped
        });
        console.log(`✅ ${product.name}`);
      } catch (error) {
        results.push({
          success: false,
          id: product.id,
          name: product.name,
          error: error.message
        });
        console.log(`❌ ${product.name}: ${error.message}`);
      }
      
      await sleep(1500); // Delay to avoid blocking
    }

    return res.status(200).json({
      success: true,
      results,
      summary: {
        total: products.length,
        successes: results.filter(r => r.success).length,
        failures: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Template import error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log('No products provided error');
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }

    // Validate replace mode confirmation
    if (replaceMode !== 'none' && confirm !== 'REPLACE') {
      console.log('Replace confirmation required error');
      return NextResponse.json({ error: 'Replace confirmation required' }, { status: 400 });
    }

    console.log('Starting template import process...');
    
    const results = [];
    let created = 0;
    let updated = 0;
    let failures = 0;
    let deletedCount = 0;

    // Handle replacement modes
    if (replaceMode === 'all') {
      console.log('Deleting all products...');
      const { data, error } = await supabaseAdmin.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');
      if (error) throw error;
      deletedCount = data?.length || 0;
      console.log('Deleted', deletedCount, 'products');
    } else if (replaceMode === 'pinned') {
      console.log('Deleting pinned products...');
      const { data, error } = await supabaseAdmin.from('products').delete().eq('is_pinned', true).select('id');
      if (error) throw error;
      deletedCount = data?.length || 0;
      console.log('Deleted', deletedCount, 'pinned products');
    }

    // Process each product
    console.log(`\n📦 STARTING TEMPLATE IMPORT: ${products.length} products\n`);
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i + 1}/${products.length}] Processing: ${product.name}`);
      
      try {
        // Add delay between requests to avoid rate limiting
        if (i > 0) {
          await sleep(REQUEST_DELAY);
        }
        
        // Extract itemID from Weidian URL
        const itemIdMatch = product.url.match(/itemID[=%](\d+)|\/item\/(\d+)/i);
        if (!itemIdMatch) {
          results.push({
            status: 'error',
            message: `Invalid Weidian URL: ${product.url}`,
            name: product.name
          });
          failures++;
          continue;
        }

        const itemId = itemIdMatch[1] || itemIdMatch[2];
        const weidianUrl = getWeidianUrl(itemId);
        
        // Scrape product data from Weidian (with retry logic)
        const scrapedData = await scrapeWeidianProduct(weidianUrl);

        // Use name from spreadsheet (user's custom name)
        const finalName = product.name;
        
        // Determine category: use manual override if provided, otherwise use scraped/auto-detected
        const finalCategory = category || scrapedData.category;
        
        // Get affiliate link
        const affiliateLink = getAffiliateLink(weidianUrl);
        
        // Check if product with this link already exists
        const { data: existingProducts, error: findError } = await supabaseAdmin
          .from('products')
          .select('*')
          .ilike('link', `%itemID%${itemId}%`)
          .limit(1);
        
        if (findError) throw findError;
        
        const existingProduct = existingProducts && existingProducts.length > 0 ? existingProducts[0] : null;

        if (existingProduct) {
          // Update existing product
          const updates = {
            name: finalName,
            price: scrapedData.price,
            image: scrapedData.image,
            category: finalCategory,
            batch: batch || 'best',
            link: affiliateLink,
            updated_at: new Date().toISOString()
          };
          
          if (pin) {
            updates.is_pinned = true;
            if (startOrder !== undefined) {
              updates.pinned_order = startOrder + i;
            }
          }

          const { data: updated, error: updateError } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', existingProduct.id)
            .select()
            .single();
          
          if (updateError) throw updateError;
          
          results.push({
            status: 'success',
            action: 'updated',
            name: finalName,
            url: product.url,
            itemId: updated.id
          });
          updated++;
          console.log(`✅ [${i + 1}/${products.length}] Updated: ${finalName} (ID: ${updated.id})`);
        } else {
          // Create new product
          const productData = {
            name: finalName,
            price: scrapedData.price,
            image: scrapedData.image,
            category: finalCategory,
            batch: batch || 'best',
            link: affiliateLink,
            clicks: 0,
            is_pinned: pin || false,
            pinned_order: (pin && startOrder !== undefined) ? (startOrder + i) : 999999
          };

          const { data: newProduct, error: insertError } = await supabaseAdmin
            .from('products')
            .insert([productData])
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          results.push({
            status: 'success',
            action: 'created',
            name: finalName,
            url: product.url,
            itemId: newProduct.id
          });
          created++;
          console.log(`✅ [${i + 1}/${products.length}] Created: ${finalName} (ID: ${newProduct.id})`);
        }

      } catch (error) {
        console.error(`❌ [${i + 1}/${products.length}] Error processing ${product.name}:`, error.message);
        results.push({
          status: 'error',
          message: error.message,
          name: product.name,
          url: product.url
        });
        failures++;
      }
    }

    console.log(`\n✨ TEMPLATE IMPORT COMPLETED: Created ${created} | Updated ${updated} | Failed ${failures}\n`);

    return NextResponse.json({
      success: true,
      total: products.length,
      created,
      updated,
      failures,
      deletedCount,
      successes: created + updated,
      results
    });

  } catch (error) {
    console.error('Template import error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
