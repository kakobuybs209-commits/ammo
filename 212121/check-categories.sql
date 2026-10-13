-- Sprawdź jakie kategorie są używane w bazie danych
SELECT 
    category, 
    COUNT(*) as count 
FROM products 
GROUP BY category 
ORDER BY count DESC;

-- Pokaż przykładowe produkty dla każdej kategorii
SELECT 
    id,
    name,
    category,
    price
FROM products
ORDER BY category, name
LIMIT 100;
