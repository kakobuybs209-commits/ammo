/**
 * WEIDIAN BULK SCRAPER
 * 
 * Scraper wielu produktów naraz z kontrolą concurrency.
 * Obsługuje różne formaty wejściowe: URL Weidian, linki przez agentów (kakobuy, acbuy itp.)
 * 
 * Wymaga: npm install axios cheerio
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractItemId, scrapeWeidianProduct } from './scraper-core.js';

const DEFAULT_CONCURRENCY = 4; // ile produktów scrape'ować równolegle
const MAX_CONCURRENCY = 6;

/**
 * Parsuje listę URL/ID i zwraca unikalne itemID
 * Obsługuje: tablicę URL, string z URL oddzielonych spacją/enterem, linki przez agentów
 */
export function parseInputUrls(input) {
  const rawItems = Array.isArray(input) ? input : String(input || '').split(/[\s\n,]+/);
  const unique = new Map();

  for (const raw of rawItems) {
    const src = String(raw || '').trim();
    if (!src) continue;

    const itemId = extractItemId(src);
    if (!itemId || unique.has(itemId)) continue;

    unique.set(itemId, {
      itemId,
      sourceUrl: src,
      weidianUrl: `https://weidian.com/item.html?itemID=${itemId}`,
    });
  }

  return Array.from(unique.values());
}

/**
 * Uruchamia worker z limitem równoległości
 */
async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await worker(items[i], i);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Scrape'uje wiele produktów naraz
 * 
 * @param {string|string[]} input - URL lub lista URL Weidian
 * @param {object} options
 * @param {number} options.concurrency - Ile równolegle (max 6, domyślnie 4)
 * @param {function} options.onProgress - Callback: (done, total, result) => void
 * @returns {Array} - Lista wyników { itemId, status, name, priceUSD, image, error }
 */
export async function scrapeMany(input, options = {}) {
  const items = parseInputUrls(input);
  const concurrency = Math.min(MAX_CONCURRENCY, options.concurrency || DEFAULT_CONCURRENCY);
  let done = 0;

  if (items.length === 0) {
    throw new Error('Brak poprawnych URL Weidian w wejściu');
  }

  const results = await runWithConcurrency(items, concurrency, async (item) => {
    try {
      const product = await scrapeWeidianProduct(item.itemId);
      done++;
      
      const result = {
        itemId: item.itemId,
        weidianUrl: item.weidianUrl,
        status: 'success',
        name: product.name,
        priceUSD: product.priceUSD,
        priceCNY: product.priceCNY,
        image: product.image,
        allImages: product.allImages,
      };

      if (options.onProgress) {
        options.onProgress(done, items.length, result);
      }

      return result;
    } catch (error) {
      done++;
      const result = {
        itemId: item.itemId,
        weidianUrl: item.weidianUrl,
        status: 'error',
        error: error.message,
      };

      if (options.onProgress) {
        options.onProgress(done, items.length, result);
      }

      return result;
    }
  });

  return results;
}

// ─── Przykład użycia ─────────────────────────────────────────────────────────
// (odkomentuj żeby przetestować)
//
// const urls = [
//   'https://weidian.com/item.html?itemID=7400204781',
//   'https://weidian.com/item.html?itemID=5033799479',
//   // Działa też z linkami przez kakobuy:
//   'https://www.kakobuy.com/item/details?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7400204781',
// ];
//
// scrapeMany(urls, {
//   concurrency: 3,
//   onProgress: (done, total, result) => {
//     console.log(`[${done}/${total}] ${result.status}: ${result.name || result.error}`);
//   }
// }).then(results => {
//   const ok = results.filter(r => r.status === 'success');
//   const fail = results.filter(r => r.status === 'error');
//   console.log(`\nGotowe: ${ok.length} sukces, ${fail.length} błąd`);
//   console.log('Przykład zdjęcia:', ok[0]?.image);
// });
