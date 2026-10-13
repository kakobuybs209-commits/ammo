-- Zaktualizuj kategorie z polskich na angielskie i z małych liter na właściwe nazwy

-- Mapowanie polskich kategorii na angielskie
UPDATE products SET category = 'Shoes' WHERE category = 'Buty' OR category = 'shoes';
UPDATE products SET category = 'Jackets' WHERE category = 'Kurtki' OR category = 'Puchówki' OR category = 'jackets';
UPDATE products SET category = 'Hoodies' WHERE category = 'Bluzy' OR category = 'hoodies';
UPDATE products SET category = 'Hooded Sweatshirts' WHERE category = 'Bluzy z kapturem';
UPDATE products SET category = 'Sweaters' WHERE category = 'Swetry';
UPDATE products SET category = 'T-shirts' WHERE category = 'T-shirty' OR category = 't-shirts';
UPDATE products SET category = 'Pants' WHERE category = 'Spodnie' OR category = 'pants';
UPDATE products SET category = 'Shorts' WHERE category = 'Spodenki' OR category = 'shorts';
UPDATE products SET category = 'Accessories' WHERE category = 'Akcesoria' OR category = 'accessories';
UPDATE products SET category = 'Electronics' WHERE category = 'Elektronika' OR category = 'electronics';
UPDATE products SET category = 'Watches' WHERE category = 'Zegarki';
UPDATE products SET category = 'Bags' WHERE category = 'Torby i Plecaki' OR category = 'bags-backpacks';
UPDATE products SET category = 'Sportswear' WHERE category = 'Odzież Sportowa';
UPDATE products SET category = 'Underwear' WHERE category = 'Bielizna';
UPDATE products SET category = 'Headwear' WHERE category = 'headwear';
UPDATE products SET category = 'Belts' WHERE category = 'belts';
UPDATE products SET category = 'Sets' WHERE category = 'sets';
UPDATE products SET category = 'Longsleeve' WHERE category = 'longsleeve';

-- Sprawdź wyniki
SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC;
