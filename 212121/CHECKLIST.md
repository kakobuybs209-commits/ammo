# ✅ Checklist - Import Produktów

## Przed rozpoczęciem:

- [ ] Zalogowano do panelu admina
- [ ] Przeglądarką jest Chrome, Firefox lub Edge (najnowsza wersja)
- [ ] Konsola przeglądarki (F12) jest otwarta (opcjonalnie, do debugowania)

## Pobieranie szablonu CSV:

- [ ] Otworzono modal importu (przycisk z ikoną importu)
- [ ] Kliknięto link "Pobierz szablon CSV"
- [ ] Plik `products-template.csv` został pobrany
- [ ] Plik otwiera się poprawnie w Excelu/Notatniku

## Przygotowanie danych:

- [ ] Skopiowano szablon lub otworzono go w edytorze
- [ ] Dodano produkty w kolejnych wierszach
- [ ] Każdy produkt ma wszystkie wymagane kolumny:
  - [ ] `id` - unikalny identyfikator
  - [ ] `name` - nazwa produktu
  - [ ] `price` - cena (liczba)
  - [ ] `currency` - waluta (PLN, EUR, USD, CNY)
  - [ ] `image` - link do obrazka
  - [ ] `category` - kategoria
  - [ ] `link` - link do produktu
  - [ ] `status` - active lub inactive
  - [ ] `clicks` - liczba (zwykle 0)
  - [ ] `popular` - true lub false
- [ ] Plik zapisano jako CSV (UTF-8)
- [ ] Plik nie zawiera pustych wierszy na końcu

## Import:

- [ ] W modalu importu kliknięto "Wybierz plik"
- [ ] Wybrano przygotowany plik CSV
- [ ] System wyświetlił informację o liczbie produktów
- [ ] Liczba produktów jest poprawna
- [ ] Kliknięto "Rozpocznij Import"
- [ ] Pasek postępu działa
- [ ] Import zakończył się sukcesem
- [ ] Wyświetlono liczbę zaimportowanych produktów
- [ ] Nie ma błędów (lub są akceptowalne)

## Weryfikacja:

- [ ] Produkty pojawiły się w tabeli produktów
- [ ] Wszystkie dane są poprawne (nazwy, ceny, obrazki)
- [ ] Linki działają
- [ ] Obrazki się ładują
- [ ] Kategorie są przypisane poprawnie

## W razie problemów:

### Problem: Szablon nie pobiera się
- [ ] Sprawdzono konsolę (F12) czy są błędy
- [ ] Uruchomiono `diagnose-import.js` w konsoli
- [ ] Wyczyszczono cache przeglądarki (Ctrl+Shift+Delete)
- [ ] Odświeżono stronę (Ctrl+F5)
- [ ] Spróbowano w trybie incognito

### Problem: Plik nie parsuje się
- [ ] Sprawdzono format pliku (czy to CSV?)
- [ ] Sprawdzono kodowanie (UTF-8)
- [ ] Sprawdzono separator (przecinek)
- [ ] Porównano z szablonem
- [ ] Usunięto puste wiersze
- [ ] Sprawdzono czy nie ma znaków specjalnych w danych

### Problem: Import kończy się błędem
- [ ] Sprawdzono konsolę (F12) czy są szczegóły błędu
- [ ] Sprawdzono połączenie z bazą danych (Supabase)
- [ ] Sprawdzono czy ID produktów są unikalne
- [ ] Sprawdzono czy wszystkie kolumny są wypełnione
- [ ] Spróbowano zaimportować mniejszą partię (np. 5 produktów)

## Pliki pomocnicze:

Jeśli standardowy import nie działa:

1. **test-import.html** - Otwórz w przeglądarce
   - [ ] Kliknięto "Sprawdź Funkcje" - wszystkie ✓
   - [ ] Test generowania szablonu - działa
   - [ ] Test parsowania CSV - działa
   - [ ] Test importu - działa

2. **diagnose-import.js** - Wklej w konsolę (F12)
   - [ ] Uruchomiono skrypt
   - [ ] Wszystkie funkcje są dostępne (✅)
   - [ ] Wszystkie elementy DOM są dostępne (✅)
   - [ ] Brak błędów w podsumowaniu

3. **test-products.csv** - Użyj jako przykład
   - [ ] Plik otwiera się poprawnie
   - [ ] Ma 3 przykładowe produkty
   - [ ] Import testowych produktów działa

## Kontakt/Support:

Jeśli żaden z powyższych kroków nie pomógł:
- Sprawdź plik `NAPRAWIONO-IMPORT.md` dla szczegółów technicznych
- Sprawdź plik `INSTRUKCJA.txt` dla prostych instrukcji
- Sprawdź konsolę przeglądarki (F12) dla błędów
- Upewnij się, że `bulk-import.js` jest załadowany w `index.html`

---

## Status końcowy:

- [ ] ✅ Wszystko działa poprawnie
- [ ] 📊 Zaimportowano produkty: _____ (liczba)
- [ ] 🎉 Sukces!

Jeśli wszystkie checkboxy są zaznaczone - gratulacje! Import działa. 🎉
