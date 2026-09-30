-- =============================================
-- ITEMFINDER - Pełna konfiguracja bazy danych Supabase
-- Wklej cały ten skrypt w Supabase -> SQL Editor -> Run
-- =============================================

-- 1. Tabela produktów (products)
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
    agent TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela analityki (analytics)
CREATE TABLE IF NOT EXISTS public.analytics (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela sprzedawców (sellers)
CREATE TABLE IF NOT EXISTS public.sellers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brands TEXT,
    description TEXT,
    shop_url TEXT,
    top_rated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Włączenie RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- 5. Polityki dostępu (Publiczny odczyt i zapis dla anonimowych użytkowników / aplikacji)
-- Products
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert products" ON public.products;
CREATE POLICY "Public can insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update products" ON public.products;
CREATE POLICY "Public can update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete products" ON public.products;
CREATE POLICY "Public can delete products" ON public.products FOR DELETE USING (true);

-- Analytics
DROP POLICY IF EXISTS "Public can view analytics" ON public.analytics;
CREATE POLICY "Public can view analytics" ON public.analytics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert analytics" ON public.analytics;
CREATE POLICY "Public can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- Sellers
DROP POLICY IF EXISTS "Public can view sellers" ON public.sellers;
CREATE POLICY "Public can view sellers" ON public.sellers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert sellers" ON public.sellers;
CREATE POLICY "Public can insert sellers" ON public.sellers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update sellers" ON public.sellers;
CREATE POLICY "Public can update sellers" ON public.sellers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete sellers" ON public.sellers;
CREATE POLICY "Public can delete sellers" ON public.sellers FOR DELETE USING (true);
