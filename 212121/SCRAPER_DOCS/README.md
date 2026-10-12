# Weidian Scraper — Dokumentacja

Ten folder zawiera wszystkie pliki potrzebne do zrozumienia jak działa scraper produktów z Weidian.

## Problem który rozwiązuje

Weidian blokuje typowe scrapery — zamiast zdjęcia produktu zwraca **logo sklepu** (czerwone logo 店).

## Rozwiązanie — jak to działa

Scraper używa **mobilnego User-Agent** (iPhone) i czyta dane z ukrytego tagu `<script id="__rocker-render-inject__">`, który zawiera pełny JSON z danymi produktu.

### Kluczowe kroki:
1. Wyciągnij `itemID` z URL weidian
2. Zrób GET na `https://weidian.com/item.html?itemID=XXX` z iPhone User-Agent
3. Znajdź tag `#__rocker-render-inject__` i sparsuj jego atrybut `data-obj` jako JSON
4. Z JSON wyciągnij:
   - `result.default_model.item_info.item_name` → nazwa
   - `result.default_model.item_info.origin_price` → cena CNY (mnożymy × 0.14 = USD)
   - `result.default_model.item_info.item_head` → główne zdjęcie (FALLBACK)
   - `result.default_model.sku_properties.attr_list` → warianty ze zdjęciami

### Dlaczego wychodzi logo zamiast zdjęcia?

Jeśli scrapujesz bez mobilnego User-Agenta lub bez parsowania `data-obj`, Weidian zwraca stronę błędu z logo sklepu jako placeholder.

## Pliki w tym folderze

| Plik | Opis |
|------|------|
| `scraper-core.js` | Główna logika scrapowania — wyciąganie zdjęć, nazw, cen |
| `scraper-bulk.js` | Bulk scraper — obsługa wielu URL naraz z concurrency |
| `categoryHelper.js` | Auto-wykrywanie kategorii produktu z nazwy |
| `README.md` | Ten plik |

## Użycie (przykład standalone)

```js
import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

async function scrapeWeidian(itemId) {
  const url = `https://weidian.com/item.html?itemID=${itemId}`;
  
  const res = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Referer': 'https://weidian.com/'
    },
    timeout: 12000
  });

  const $ = cheerio.load(res.data);
  const scriptTag = $('#__rocker-render-inject__');
  
  if (scriptTag.length === 0) {
    throw new Error('Bot protection — spróbuj ponownie lub użyj proxy');
  }

  const data = JSON.parse(scriptTag.attr('data-obj'));
  const itemInfo = data.result.default_model.item_info;

  // Główne zdjęcie produktu (nie logo!)
  let image = itemInfo.item_head;
  if (!image.startsWith('http')) image = `https:${image}`;
  image = `${image}?w=400&h=400`;

  // Lepsze zdjęcie — z wariantów SKU (jeśli istnieje)
  const skuProps = data.result.default_model.sku_properties;
  if (skuProps?.attr_list) {
    const imgAttr = skuProps.attr_list.find(a => a.attr_values?.some(v => v.img));
    if (imgAttr?.attr_values?.[0]?.img) {
      const variantImg = imgAttr.attr_values[0].img;
      image = variantImg.startsWith('http') 
        ? `${variantImg}?w=400&h=400` 
        : `https:${variantImg}?w=400&h=400`;
    }
  }

  return {
    name: itemInfo.item_name,
    priceUSD: (parseFloat(itemInfo.origin_price) * 0.14).toFixed(2),
    image,
  };
}
```

## Zależności

```
npm install axios cheerio
```
