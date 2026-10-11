-- =============================================
-- ITEMFINDER - Minimalna struktura bazy dla importu
-- Wklej w Supabase -> SQL Editor -> Run
-- =============================================

-- Usuń starą tabelę jeśli istnieje (UWAGA: skasuje dane!)
-- DROP TABLE IF EXISTS public.products CASCADE;

-- Utwórz tabelę products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'PLN',
    image TEXT,
    category TEXT,
    link TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    clicks INTEGER NOT NULL DEFAULT 0,
    popular BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC,
    seller TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Włącz Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Polityki dostępu (pozwalają na publiczny odczyt i zapis)
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert products" ON public.products;
CREATE POLICY "Public can insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update products" ON public.products;
CREATE POLICY "Public can update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete products" ON public.products;
CREATE POLICY "Public can delete products" ON public.products FOR DELETE USING (true);

-- Sprawdź strukturę tabeli
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;
