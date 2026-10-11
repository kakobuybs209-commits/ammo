-- =============================================
-- Usuń produkty bez cen (price = 0 lub NULL)
-- Wklej w Supabase -> SQL Editor -> Run
-- =============================================

-- Sprawdź ile produktów zostanie usuniętych
SELECT COUNT(*) as products_to_delete
FROM public.products
WHERE price::numeric = 0 OR price IS NULL OR price = '' OR image IS NULL;

-- Usuń produkty bez cen lub zdjęć
DELETE FROM public.products
WHERE price::numeric = 0 OR price IS NULL OR price = '' OR image IS NULL;

-- Sprawdź ile pozostało
SELECT COUNT(*) as remaining_products
FROM public.products;

-- Pokaż przykładowe pozostałe produkty
SELECT id, name, price, currency, image
FROM public.products
LIMIT 10;
