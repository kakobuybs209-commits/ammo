-- =============================================
-- Dodaj brakujące kolumny do tabeli products
-- Wklej w Supabase -> SQL Editor -> Run
-- =============================================

-- Dodaj brakujące kolumny
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS popular BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC;

-- Odśwież schema cache
NOTIFY pgrst, 'reload schema';

-- Sprawdź finalną strukturę
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;
