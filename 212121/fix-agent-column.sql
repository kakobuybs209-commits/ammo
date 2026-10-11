-- =============================================
-- FIX: Usuń kolumnę 'agent' i odśwież cache
-- Wklej w Supabase -> SQL Editor -> Run
-- =============================================

-- 1. Sprawdź czy kolumna 'agent' istnieje
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
AND column_name = 'agent';

-- 2. Usuń kolumnę 'agent' jeśli istnieje
ALTER TABLE public.products DROP COLUMN IF EXISTS agent;

-- 3. Odśwież schema cache (WAŻNE!)
NOTIFY pgrst, 'reload schema';

-- 4. Sprawdź finalną strukturę tabeli (nie powinno być 'agent')
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;
