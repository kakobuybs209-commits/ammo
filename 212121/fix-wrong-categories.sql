-- Automatycznie napraw kategorie produktów na podstawie ich nazw

-- 1. BUTY (Shoes)
UPDATE products 
SET category = 'Shoes'
WHERE (
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
    LOWER(name) LIKE '%crocs%' OR
    LOWER(name) LIKE '%aj%' OR
    LOWER(name) LIKE '%nb %' OR
    LOWER(name) LIKE '%new balance%' OR
    LOWER(name) LIKE '%nike%' OR
    LOWER(name) LIKE '%adidas%' OR
    LOWER(name) LIKE '%puma%' OR
    LOWER(name) LIKE '%converse%' OR
    LOWER(name) LIKE '%vans%'
)
AND category != 'Shoes';

-- 2. KURTKI (Jackets)
UPDATE products 
SET category = 'Jackets'
WHERE (
    LOWER(name) LIKE '%jacket%' OR
    LOWER(name) LIKE '%coat%' OR
    LOWER(name) LIKE '%puffer%' OR
    LOWER(name) LIKE '%parka%' OR
    LOWER(name) LIKE '%bomber%' OR
    LOWER(name) LIKE '%windbreaker%' OR
    LOWER(name) LIKE '%blazer%' OR
    LOWER(name) LIKE '%vest%' OR
    LOWER(name) LIKE '%nuptse%'
)
AND LOWER(name) NOT LIKE '%hoodie%'
AND category != 'Jackets';

-- 3. BLUZY (Hoodies)
UPDATE products 
SET category = 'Hoodies'
WHERE (
    LOWER(name) LIKE '%hoodie%' OR
    LOWER(name) LIKE '%sweatshirt%' OR
    LOWER(name) LIKE '%fleece%' OR
    LOWER(name) LIKE '%pullover%' OR
    LOWER(name) LIKE '%crewneck%'
)
AND category NOT IN ('Hoodies', 'Sweaters');

-- 4. SWETRY (Sweaters)
UPDATE products 
SET category = 'Sweaters'
WHERE (
    LOWER(name) LIKE '%sweater%' OR
    LOWER(name) LIKE '%jumper%' OR
    LOWER(name) LIKE '%cardigan%' OR
    LOWER(name) LIKE '%knit%'
)
AND LOWER(name) NOT LIKE '%sweatshirt%'
AND category != 'Sweaters';

-- 5. T-SHIRTY (T-shirts)
UPDATE products 
SET category = 'T-shirts'
WHERE (
    LOWER(name) LIKE '%t-shirt%' OR
    LOWER(name) LIKE '%tee %' OR
    LOWER(name) LIKE '% tee' OR
    LOWER(name) LIKE '%shirt%' OR
    LOWER(name) LIKE '%polo%' OR
    LOWER(name) LIKE '%jersey%' OR
    LOWER(name) LIKE '%top%' OR
    LOWER(name) LIKE '%tank%'
)
AND LOWER(name) NOT LIKE '%hoodie%'
AND LOWER(name) NOT LIKE '%sweatshirt%'
AND LOWER(name) NOT LIKE '%jacket%'
AND category != 'T-shirts';

-- 6. SPODNIE (Pants)
UPDATE products 
SET category = 'Pants'
WHERE (
    LOWER(name) LIKE '%pants%' OR
    LOWER(name) LIKE '%jeans%' OR
    LOWER(name) LIKE '%joggers%' OR
    LOWER(name) LIKE '%trousers%' OR
    LOWER(name) LIKE '%cargo%' OR
    LOWER(name) LIKE '%denim%' OR
    LOWER(name) LIKE '%chinos%' OR
    LOWER(name) LIKE '%sweatpants%'
)
AND LOWER(name) NOT LIKE '%shorts%'
AND category != 'Pants';

-- 7. SPODENKI (Shorts)
UPDATE products 
SET category = 'Shorts'
WHERE LOWER(name) LIKE '%shorts%'
AND category != 'Shorts';

-- 8. PERFUMY i AKCESORIA (Accessories)
UPDATE products 
SET category = 'Accessories'
WHERE (
    LOWER(name) LIKE '%perfume%' OR
    LOWER(name) LIKE '%cologne%' OR
    LOWER(name) LIKE '%fragrance%' OR
    LOWER(name) LIKE '%scent%' OR
    LOWER(name) LIKE '%watch%' OR
    LOWER(name) LIKE '%bracelet%' OR
    LOWER(name) LIKE '%necklace%' OR
    LOWER(name) LIKE '%chain%' OR
    LOWER(name) LIKE '%ring%' OR
    LOWER(name) LIKE '%glasses%' OR
    LOWER(name) LIKE '%sunglasses%' OR
    LOWER(name) LIKE '%belt%' OR
    LOWER(name) LIKE '%wallet%' OR
    LOWER(name) LIKE '%scarf%' OR
    LOWER(name) LIKE '%gloves%' OR
    LOWER(name) LIKE '%socks%' OR
    LOWER(name) LIKE '%hat%' OR
    LOWER(name) LIKE '%cap%' OR
    LOWER(name) LIKE '%beanie%'
)
AND LOWER(name) NOT LIKE '%bag%'
AND category != 'Accessories';

-- 9. TORBY (Bags)
UPDATE products 
SET category = 'Bags'
WHERE (
    LOWER(name) LIKE '%bag%' OR
    LOWER(name) LIKE '%backpack%' OR
    LOWER(name) LIKE '%tote%' OR
    LOWER(name) LIKE '%duffle%' OR
    LOWER(name) LIKE '%messenger%'
)
AND category != 'Bags';

-- 10. ELEKTRONIKA (Electronics)
UPDATE products 
SET category = 'Electronics'
WHERE (
    LOWER(name) LIKE '%airpods%' OR
    LOWER(name) LIKE '%speaker%' OR
    LOWER(name) LIKE '%headphones%' OR
    LOWER(name) LIKE '%earbuds%' OR
    LOWER(name) LIKE '%jbl%' OR
    LOWER(name) LIKE '%charging%' OR
    LOWER(name) LIKE '%charger%' OR
    LOWER(name) LIKE '%iphone%' OR
    LOWER(name) LIKE '%ipad%' OR
    LOWER(name) LIKE '%samsung%' OR
    LOWER(name) LIKE '%phone%' OR
    LOWER(name) LIKE '%tablet%'
)
AND category != 'Electronics';

-- 11. ZESTAWY (Sets)
UPDATE products 
SET category = 'Sets'
WHERE (
    LOWER(name) LIKE '%tracksuit%' OR
    LOWER(name) LIKE '%track suit%' OR
    LOWER(name) LIKE '%set %' OR
    LOWER(name) LIKE '% set' OR
    LOWER(name) LIKE '%two piece%' OR
    LOWER(name) LIKE '%2 piece%'
)
AND category != 'Sets';

-- SPRAWDŹ WYNIKI
SELECT 
    category,
    COUNT(*) as count
FROM products
GROUP BY category
ORDER BY count DESC;
