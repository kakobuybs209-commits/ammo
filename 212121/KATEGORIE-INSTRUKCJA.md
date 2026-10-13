# Instrukcja aktualizacji kategorii produktów

## Problem
Produkty w bazie mogą mieć kategorie w starych formatach:
- Polskie nazwy: "Buty", "Kurtki", "Bluzy" itd.
- Małe litery: "shoes", "hoodies", "t-shirts"
- Stare angielskie: "Bags & Backpacks"

## Rozwiązanie

### 1. Sprawdź obecne kategorie
Uruchom w Supabase SQL Editor:
```sql
SELECT category, COUNT(*) as count 
FROM products 
GROUP BY category 
ORDER BY count DESC;
```

### 2. Zaktualizuj kategorie
Uruchom plik: `update-categories-to-english.sql`

Ten skrypt zmieni wszystkie kategorie na nowe angielskie nazwy:
- Buty/shoes → **Shoes**
- Kurtki/Puchówki/jackets → **Jackets**
- Bluzy/hoodies → **Hoodies**
- T-shirty/t-shirts → **T-shirts**
- Spodnie/pants → **Pants**
- Spodenki/shorts → **Shorts**
- Akcesoria/accessories → **Accessories**
- Elektronika/electronics → **Electronics**
- Zegarki → **Watches**
- Torby i Plecaki/bags-backpacks → **Bags**
- Odzież Sportowa → **Sportswear**
- Bielizna → **Underwear**

### 3. Sprawdź wyniki
Po uruchomieniu skryptu ponownie sprawdź kategorie:
```sql
SELECT category, COUNT(*) as count 
FROM products 
GROUP BY category 
ORDER BY count DESC;
```

## Zmiany w kodzie (już wykonane)

✅ Zaktualizowano `categoryhelper.js` - mapowanie slugów na etykiety
✅ Zaktualizowano `index.html` - dropdown kategorii w panelu admin
✅ Zaktualizowano `index.html` - dropdown kategorii w głównym widoku

## Kategorie dostępne w filtrze

1. All Categories
2. Shoes
3. Jackets
4. Hoodies
5. Sweaters
6. T-shirts
7. Pants
8. Shorts
9. Accessories
10. Electronics
11. Watches
12. Bags
13. Sportswear
14. Underwear

## Uwaga

Funkcja `detectCategoryLabel()` w `categoryhelper.js` automatycznie mapuje slugi z małych liter na właściwe nazwy. Nowe produkty będą miały od razu poprawne kategorie.
