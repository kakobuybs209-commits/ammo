# 📦 Template Import - Instrukcja dla Ciebie

## 🎯 Co to jest?

Kompletny pakiet z funkcją "Template Import" do masowego importu produktów.

## 📁 Co znajduje się w paczce?

```
TEMPLATE_IMPORT_PACKAGE/
├── README.md                          ← Szybki start (po angielsku)
├── AI_INTEGRATION_INSTRUCTIONS.md     ← Pełna instrukcja dla AI (po angielsku)
├── INSTRUKCJA_PL.md                   ← Ta instrukcja (po polsku)
├── EXAMPLE_TEMPLATE.csv               ← Przykładowy plik CSV
├── TemplateImportModal.jsx            ← Komponent React (frontend)
├── template-helpers.js                ← Narzędzia do parsowania
├── sheets-route.js                    ← API proxy dla Google Sheets
└── template-route.js                  ← API do przetwarzania (backend)
```

## 🚀 Jak użyć tego pakietu?

### Opcja 1: Wyślij całą paczkę do AI

```
1. Spakuj folder TEMPLATE_IMPORT_PACKAGE do ZIP
2. Wyślij do AI z wiadomością:

"Zintegruj Template Import feature z mojej strony.
Przeczytaj AI_INTEGRATION_INSTRUCTIONS.md i wykonaj wszystkie kroki.
Dostosuj do mojej struktury projektu."
```

### Opcja 2: Daj AI instrukcję krok po kroku

```
Krok 1: "Przeczytaj plik AI_INTEGRATION_INSTRUCTIONS.md"
Krok 2: "Skopiuj pliki zgodnie z instrukcją Step 1"
Krok 3: "Dodaj modal do panelu admina (Step 3)"
Krok 4: "Zaimplementuj backend API (sekcja Backend API Requirements)"
Krok 5: "Przetestuj według Testing Checklist"
```

## 📋 Co AI ma zrobić?

### 1. Skopiować pliki

```bash
# Frontend
TemplateImportModal.jsx    → src/components/admin/
template-helpers.js        → src/utils/

# Backend API
sheets-route.js           → src/app/api/admin/scrape/sheets/route.js
template-route.js         → src/app/api/admin/scrape/template/route.js
```

### 2. Dodać do panelu admina

```jsx
// Zaimportować komponent
import TemplateImportModal from '@/components/admin/TemplateImportModal';

// Dodać state
const [showTemplateModal, setShowTemplateModal] = useState(false);

// Dodać przycisk
<button onClick={() => setShowTemplateModal(true)}>
  📋 Template Import
</button>

// Wyrenderować modal
<TemplateImportModal
  isOpen={showTemplateModal}
  onClose={() => setShowTemplateModal(false)}
  onImportComplete={fetchProducts}
  showToast={showToast}
/>
```

### 3. Zaimplementować backend

AI musi stworzyć endpoint `/api/admin/scrape/template` który:

1. **Przyjmuje dane:**
   ```json
   {
     "products": [{"name": "...", "url": "..."}],
     "replaceMode": "none",
     "batch": "best",
     "category": "shoes"
   }
   ```

2. **Dla każdego produktu:**
   - Scrapuje Weidian URL (obraz, cena)
   - Używa nazwy z requesta (NIE scrapuje nazwy)
   - Dodaje do bazy danych

3. **Zwraca wynik:**
   ```json
   {
     "total": 10,
     "created": 8,
     "updated": 2,
     "successes": 10,
     "failures": 0,
     "results": [...]
   }
   ```

## 🎨 Funkcje

### 3 metody importu:
1. **Wklej tekst** - Skopiuj z Google Sheets/Excel
2. **Upload pliku** - Przeciągnij CSV/TXT
3. **URL Google Sheets** - Bezpośredni import

### 3 tryby:
1. **Add/Refresh** - Bezpieczny, dodaje nowe + aktualizuje
2. **Replace Pinned** - Usuwa przypięte, dodaje nowe
3. **Replace All** - Usuwa wszystko, dodaje nowe

### Opcje:
- **Batch**: Best, Budget, Random, Popular
- **Kategoria**: Auto-detekcja lub manualna
- **Progress bar**: Na żywo
- **Logi**: Szczegółowe info o błędach

## 📋 Format Google Sheets

```
| Nazwa (A)         | Link (B)                                      | ID (C) [ignorowane] |
|-------------------|-----------------------------------------------|---------------------|
| Nike AF1          | https://weidian.com/item.html?itemID=123      | 1                   |
| Jordan 1 High     | https://weidian.com/item.html?itemID=456      | 2                   |
```

**Ważne:**
- Kolumna A = Nazwa produktu (wymagana)
- Kolumna B = Link Weidian (wymagany)
- Inne kolumny = Ignorowane
- Udostępnienie: "Każdy kto ma link może przeglądać"

## 🔧 Co AI musi dostosować?

### 1. Baza danych
```javascript
// Twój model produktu może mieć inne pola
// AI musi dopasować mapping:
{
  name: product.name,
  price: scrapedPrice,
  image: scrapedImage,
  category: detectedCategory,
  batch: request.batch,
  link: product.url,
  isPinned: false
}
```

### 2. Scraper Weidian
```javascript
// AI musi zaimplementować lub użyć istniejącego scrapera
async function scrapeWeidian(url) {
  // Pobierz stronę
  // Wyciągnij: obraz, cenę, opis
  // Zwróć dane
}
```

### 3. Replace Mode Logic
```javascript
if (replaceMode === 'pinned') {
  // Po udanym scrapie wszystkich:
  await db.deleteMany({ isPinned: true });
  // Dodaj nowe z isPinned: true
}
```

## ✅ Checklist testowania

Po integracji AI powinien przetestować:

### Frontend:
- [ ] Modal się otwiera i zamyka
- [ ] Wklejanie tekstu działa
- [ ] Upload pliku działa
- [ ] Google Sheets URL działa
- [ ] Progress bar się aktualizuje
- [ ] Komunikaty o błędach działają

### Backend:
- [ ] Pojedynczy produkt się importuje
- [ ] 10+ produktów naraz działa
- [ ] Tryb "Add/Refresh" działa
- [ ] Tryb "Replace Pinned" działa
- [ ] Tryb "Replace All" działa
- [ ] Auto-detekcja kategorii działa

## 🚨 Najczęstsze problemy

### "Google Sheets access denied"
→ Arkusz musi być publiczny ("Każdy kto ma link może przeglądać")

### "No valid template data found"
→ Sprawdź format: Nazwa [TAB] Link

### "Failed to fetch"
→ Backend API nie działa, sprawdź `/api/admin/scrape/template`

## 💡 Wskazówki dla AI

1. **Przeczytaj CAŁĄ instrukcję** (`AI_INTEGRATION_INSTRUCTIONS.md`) zanim zaczniesz
2. **Zachowaj nazwy plików** dokładnie jak w instrukcji
3. **Nie modyfikuj TemplateImportModal.jsx** - działa out-of-the-box
4. **Dostosuj tylko backend** - tam gdzie używasz swojej bazy danych
5. **Testuj krok po kroku** - najpierw frontend, potem backend
6. **Używaj istniejącego scrapera** jeśli już masz scraper Weidian

## 📞 Co powiedzieć AI?

### Wersja krótka:
```
Zintegruj Template Import z mojego pakietu TEMPLATE_IMPORT_PACKAGE.
Przeczytaj AI_INTEGRATION_INSTRUCTIONS.md i zrób wszystko krok po kroku.
```

### Wersja długa:
```
Mam paczkę TEMPLATE_IMPORT_PACKAGE z kompletną funkcją Template Import.

1. Przeczytaj plik AI_INTEGRATION_INSTRUCTIONS.md
2. Skopiuj pliki zgodnie z Step 1 i Step 2
3. Zintegruj modal w panelu admina (Step 3)
4. Zaimplementuj backend API zgodnie z sekcją "Backend API Requirements"
5. Użyj mojego istniejącego scrapera Weidian
6. Dostosuj do mojej struktury bazy danych
7. Przetestuj według "Testing Checklist"

Jeśli coś nie działa, sprawdź sekcję "Common Issues & Solutions".
```

## 🎯 Przykłady użycia

### Przykład 1: Dodaj 50 produktów
```
1. Stwórz Google Sheet z listą
2. Otwórz Template Import
3. Wklej URL Google Sheets
4. Wybierz "Add/Refresh"
5. Batch: "best"
6. Kliknij "Start Import"
```

### Przykład 2: Wymień sezonowy katalog
```
1. Przygotuj nową listę produktów
2. Wybierz "Replace All"
3. Wpisz "REPLACE"
4. Importuj nowy katalog
```

---

**Powodzenia! 🚀**

Jeśli coś nie działa, sprawdź szczegółową instrukcję w `AI_INTEGRATION_INSTRUCTIONS.md`.
