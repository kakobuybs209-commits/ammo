-- =============================================
-- Napraw typy kolumn (TEXT -> NUMERIC/INTEGER)
-- Wklej w Supabase -> SQL Editor -> Run
-- =============================================

-- 1. Zmień typ kolumny price z TEXT na NUMERIC
ALTER TABLE public.products 
ALTER COLUMN price TYPE NUMERIC USING price::numeric;

-- 2. Zmień typ kolumny clicks z TEXT na INTEGER (jeśli to TEXT)
ALTER TABLE public.products 
ALTER COLUMN clicks TYPE INTEGER USING clicks::integer;

-- 3. Sprawdź nową strukturę
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
AND column_name IN ('price', 'clicks', 'rating')
ORDER BY ordinal_position;

-- 4. Teraz usuń produkty z ceną 0 lub bez zdjęć
DELETE FROM public.products
WHERE price = 0 OR price IS NULL OR image IS NULL;

-- 5. Sprawdź ile pozostało
SELECT COUNT(*) as remaining_products, 
       COUNT(CASE WHEN price > 0 THEN 1 END) as products_with_price,
       COUNT(CASE WHEN image IS NOT NULL THEN 1 END) as products_with_image
FROM public.products;
