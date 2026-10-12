/**
 * WEIDIAN SCRAPER — Core Logic
 * 
 * Rozwiązuje problem: Weidian zwraca logo sklepu zamiast zdjęcia produktu
 * gdy scraper nie używa mobilnego User-Agenta.
 * 
 * Wymaga: npm install axios cheerio
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// ─── KLUCZOWY ELEMENT: iPhone User-Agent ───────────────────────────────────
// Bez tego Weidian zwróci stronę błędu z logo 店 zamiast danych produktu
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

/**
 * Wyciąga itemID z różnych formatów URL Weidian
 * Obsługuje: bezpośredni URL, link przez agenta (kakobuy/acbuy itp.), zakodowany URL
 */
export function extractItemId(input) {
  const raw = String(input || '');

  // Odkoduj URL jeśli potrzeba (może być wielokrotnie zakodowany)
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

  // Szukaj itemID w obu wersjach (zakodowanej i odkodowanej)
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
 * Formatuje URL zdjęcia — dodaje protokół i wymiary
 */
function formatImageUrl(imageUrl) {
  if (!imageUrl) return '';
  const absolute = imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`;
  const sep = absolute.includes('?') ? '&' : '?';
  return `${absolute}${sep}w=400&h=400`;
}

/**
 * Główna funkcja scrapowania produktu z Weidian
 * 
 * @param {string} itemId - ID produktu na Weidian (np. "7400204781")
 * @returns {object} - { name, priceUSD, priceCNY, image, allImages }
 */
export async function scrapeWeidianProduct(itemId) {
  const weidianUrl = `https://weidian.com/item.html?itemID=${itemId}`;

  const response = await axios.get(weidianUrl, {
    headers: {
      // ─── KLUCZOWE: bez tego dostaniesz logo zamiast zdjęcia ───
      'User-Agent': USER_AGENT,
      'Referer': 'https://weidian.com/',
    },
    timeout: 12000,
  });

  const $ = cheerio.load(response.data);

  // ─── KLUCZOWY TAG: tutaj są wszystkie dane produktu ───────────
  // Weidian wstrzykuje pełny JSON do tego tagu
  const scriptTag = $('#__rocker-render-inject__');

  if (scriptTag.length === 0) {
    throw new Error(
      'Nie znaleziono danych produktu. Weidian może blokować żądanie. ' +
      'Sprawdź: czy User-Agent jest ustawiony poprawnie?'
    );
  }

  let data;
  try {
    data = JSON.parse(scriptTag.attr('data-obj'));
  } catch {
    throw new Error('Nie udało się sparsować JSON z data-obj');
  }

  const itemInfo = data?.result?.default_model?.item_info;
  if (!itemInfo) {
    throw new Error('Brak item_info w odpowiedzi Weidian');
  }

  const priceCNY = parseFloat(itemInfo.origin_price) || 0;
  const priceUSD = parseFloat((priceCNY * 0.14).toFixed(2));

  // ─── ZDJĘCIA ─────────────────────────────────────────────────
  // Główne zdjęcie produktu (fallback gdy nie ma wariantów)
  const mainImage = formatImageUrl(itemInfo.item_head);

  // Lepsze zdjęcia — z wariantów SKU (kolorowe/wielozdjęciowe produkty)
  const variantImages = [];
  const skuProperties = data?.result?.default_model?.sku_properties;

  if (skuProperties?.attr_list) {
    const imageAttr = skuProperties.attr_list.find(attr =>
      attr.attr_values?.some(v => v.img)
    );

    if (imageAttr?.attr_values) {
      for (const val of imageAttr.attr_values) {
        if (val.img) {
          variantImages.push({
            label: val.attr_name || val.name || '',
            image: formatImageUrl(val.img),
          });
        }
      }
    }
  }

  // Wybierz najlepsze zdjęcie:
  // - Jeśli są warianty ze zdjęciami → użyj pierwszego wariantu
  // - Jeśli nie ma wariantów → użyj głównego zdjęcia produktu
  const bestImage = variantImages.length > 0 ? variantImages[0].image : mainImage;

  return {
    name: String(itemInfo.item_name || '').trim(),
    priceCNY,
    priceUSD,
    image: bestImage,       // Najlepsze pojedyncze zdjęcie
    mainImage,              // Główne zdjęcie (item_head)
    allImages: variantImages, // Wszystkie warianty ze zdjęciami
    weidianUrl,
  };
}

// ─── Przykład użycia ─────────────────────────────────────────────────────────
// (odkomentuj żeby przetestować)
//
// const itemId = '7400204781';
// scrapeWeidianProduct(itemId)
//   .then(p => console.log('Scraped:', p))
//   .catch(e => console.error('Error:', e.message));
