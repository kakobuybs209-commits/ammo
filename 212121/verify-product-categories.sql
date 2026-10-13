-- Sprawdź czy produkty mają odpowiednie kategorie na podstawie nazwy

-- BUTY (Shoes) - powinny mieć w nazwie: shoe, sneaker, jordan, yeezy, dunk, force, etc.
SELECT 
    id, name, category, price,
    CASE 
        WHEN category != 'Shoes' THEN '❌ ZŁA KATEGORIA - powinno być Shoes'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    LOWER(name) LIKE '%shoe%' OR
    LOWER(name) LIKE '%sneaker%' OR
    LOWER(name) LIKE '%jordan%' OR
    LOWER(name) LIKE '%yeezy%' OR
    LOWER(name) LIKE '%dunk%' OR
    LOWER(name) LIKE '%force%' OR
    LOWER(name) LIKE '%air max%' OR
    LOWER(name) LIKE '%trainer%' OR
    LOWER(name) LIKE '%boot%' OR
    LOWER(name) LIKE '%slide%' OR
    LOWER(name) LIKE '%foam%' OR
    LOWER(name) LIKE '%crocs%'
ORDER BY 
    CASE WHEN category != 'Shoes' THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- KURTKI (Jackets) - powinny mieć: jacket, coat, puffer, parka
SELECT 
    id, name, category, price,
    CASE 
        WHEN category != 'Jackets' THEN '❌ ZŁA KATEGORIA - powinno być Jackets'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    LOWER(name) LIKE '%jacket%' OR
    LOWER(name) LIKE '%coat%' OR
    LOWER(name) LIKE '%puffer%' OR
    LOWER(name) LIKE '%parka%' OR
    LOWER(name) LIKE '%bomber%' OR
    LOWER(name) LIKE '%windbreaker%'
ORDER BY 
    CASE WHEN category != 'Jackets' THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- BLUZY (Hoodies) - powinny mieć: hoodie, sweatshirt, fleece
SELECT 
    id, name, category, price,
    CASE 
        WHEN category NOT IN ('Hoodies', 'Sweaters') THEN '❌ ZŁA KATEGORIA - powinno być Hoodies lub Sweaters'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    LOWER(name) LIKE '%hoodie%' OR
    LOWER(name) LIKE '%sweatshirt%' OR
    LOWER(name) LIKE '%fleece%' OR
    LOWER(name) LIKE '%sweater%' OR
    LOWER(name) LIKE '%jumper%'
ORDER BY 
    CASE WHEN category NOT IN ('Hoodies', 'Sweaters') THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- T-SHIRTY (T-shirts) - powinny mieć: t-shirt, tee, shirt, polo
SELECT 
    id, name, category, price,
    CASE 
        WHEN category != 'T-shirts' THEN '❌ ZŁA KATEGORIA - powinno być T-shirts'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    (LOWER(name) LIKE '%t-shirt%' OR
    LOWER(name) LIKE '%tee%' OR
    LOWER(name) LIKE '%shirt%' OR
    LOWER(name) LIKE '%polo%' OR
    LOWER(name) LIKE '%jersey%' OR
    LOWER(name) LIKE '%top%')
    AND LOWER(name) NOT LIKE '%hoodie%'
    AND LOWER(name) NOT LIKE '%sweatshirt%'
ORDER BY 
    CASE WHEN category != 'T-shirts' THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- SPODNIE (Pants) - powinny mieć: pants, jeans, joggers, trousers
SELECT 
    id, name, category, price,
    CASE 
        WHEN category != 'Pants' THEN '❌ ZŁA KATEGORIA - powinno być Pants'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    (LOWER(name) LIKE '%pants%' OR
    LOWER(name) LIKE '%jeans%' OR
    LOWER(name) LIKE '%joggers%' OR
    LOWER(name) LIKE '%trousers%' OR
    LOWER(name) LIKE '%cargo%')
    AND LOWER(name) NOT LIKE '%shorts%'
ORDER BY 
    CASE WHEN category != 'Pants' THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- SPODENKI (Shorts) - powinny mieć: shorts
SELECT 
    id, name, category, price,
    CASE 
        WHEN category != 'Shorts' THEN '❌ ZŁA KATEGORIA - powinno być Shorts'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    LOWER(name) LIKE '%shorts%'
ORDER BY 
    CASE WHEN category != 'Shorts' THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- PERFUMY (Accessories) - powinny mieć: perfume, cologne, fragrance
SELECT 
    id, name, category, price,
    CASE 
        WHEN category != 'Accessories' THEN '❌ ZŁA KATEGORIA - powinno być Accessories'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    LOWER(name) LIKE '%perfume%' OR
    LOWER(name) LIKE '%cologne%' OR
    LOWER(name) LIKE '%fragrance%' OR
    LOWER(name) LIKE '%scent%'
ORDER BY 
    CASE WHEN category != 'Accessories' THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- TORBY (Bags) - powinny mieć: bag, backpack
SELECT 
    id, name, category, price,
    CASE 
        WHEN category != 'Bags' THEN '❌ ZŁA KATEGORIA - powinno być Bags'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    LOWER(name) LIKE '%bag%' OR
    LOWER(name) LIKE '%backpack%' OR
    LOWER(name) LIKE '%tote%'
ORDER BY 
    CASE WHEN category != 'Bags' THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- ELEKTRONIKA (Electronics) - powinny mieć: airpods, speaker, headphones
SELECT 
    id, name, category, price,
    CASE 
        WHEN category != 'Electronics' THEN '❌ ZŁA KATEGORIA - powinno być Electronics'
        ELSE '✅ OK'
    END as status
FROM products
WHERE 
    LOWER(name) LIKE '%airpods%' OR
    LOWER(name) LIKE '%speaker%' OR
    LOWER(name) LIKE '%headphones%' OR
    LOWER(name) LIKE '%earbuds%' OR
    LOWER(name) LIKE '%jbl%'
ORDER BY 
    CASE WHEN category != 'Electronics' THEN 0 ELSE 1 END,
    name
LIMIT 50;

-- PODSUMOWANIE - ile produktów ma złą kategorię
SELECT 
    'PODSUMOWANIE' as raport,
    COUNT(*) as total_products,
    SUM(CASE 
        WHEN (LOWER(name) LIKE '%shoe%' OR LOWER(name) LIKE '%sneaker%') AND category != 'Shoes' THEN 1
        WHEN LOWER(name) LIKE '%jacket%' AND category != 'Jackets' THEN 1
        WHEN LOWER(name) LIKE '%hoodie%' AND category NOT IN ('Hoodies', 'Sweaters') THEN 1
        WHEN LOWER(name) LIKE '%t-shirt%' AND category != 'T-shirts' THEN 1
        WHEN LOWER(name) LIKE '%pants%' AND category != 'Pants' THEN 1
        WHEN LOWER(name) LIKE '%shorts%' AND category != 'Shorts' THEN 1
        WHEN LOWER(name) LIKE '%perfume%' AND category != 'Accessories' THEN 1
        WHEN LOWER(name) LIKE '%bag%' AND category != 'Bags' THEN 1
        ELSE 0
    END) as products_with_wrong_category
FROM products;
