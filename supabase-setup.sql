-- ============================================================
-- MARIEL'LA — Esquema Supabase (aplicado el 2026-07-16)
--
-- La base vive como "tenant" dentro del proyecto volea-web
-- (ref scftuxrtflfowohiewsc) porque el proyecto original
-- MARIELLA quedó pausado por el límite free de 2 proyectos.
-- Este archivo es DOCUMENTACIÓN del esquema vigente; ya está
-- aplicado como migración `mariella_tenant_setup`.
-- ============================================================

-- 1. TABLAS (prefijo mariella_ para aislar de Volea)
CREATE TABLE IF NOT EXISTS public.mariella_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_uyu numeric NOT NULL DEFAULT 0,
  price_usd numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Carteras',
  images text[] NOT NULL DEFAULT '{}',
  materials text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  dimensions text NOT NULL DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  is_sold_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mariella_fairs (
  id text PRIMARY KEY,
  name text NOT NULL,
  date text NOT NULL,
  city text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text,
  maps_url text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','past')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mariella_history_events (
  id text PRIMARY KEY,
  year text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mariella_blog_posts (
  id text PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT '',
  date text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  read_time text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mariella_categories (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

-- 2. ADMIN: el panel escribe con el usuario de Supabase Auth
--    admin@mariel-la.vercel.app (independiente del admin de Volea)
CREATE TABLE IF NOT EXISTS public.mariella_admins (
  email text PRIMARY KEY
);
INSERT INTO public.mariella_admins (email) VALUES ('admin@mariel-la.vercel.app') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.mariella_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mariella_admins
    WHERE lower(email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
  )
$$;

-- 3. RLS: lectura pública, escritura SOLO admin (nada de escritura anónima)
ALTER TABLE public.mariella_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mariella_fairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mariella_history_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mariella_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mariella_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mariella_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mariella_public_read" ON public.mariella_products FOR SELECT USING (true);
CREATE POLICY "mariella_admin_write" ON public.mariella_products FOR ALL USING (public.mariella_is_admin()) WITH CHECK (public.mariella_is_admin());
CREATE POLICY "mariella_public_read" ON public.mariella_fairs FOR SELECT USING (true);
CREATE POLICY "mariella_admin_write" ON public.mariella_fairs FOR ALL USING (public.mariella_is_admin()) WITH CHECK (public.mariella_is_admin());
CREATE POLICY "mariella_public_read" ON public.mariella_history_events FOR SELECT USING (true);
CREATE POLICY "mariella_admin_write" ON public.mariella_history_events FOR ALL USING (public.mariella_is_admin()) WITH CHECK (public.mariella_is_admin());
CREATE POLICY "mariella_public_read" ON public.mariella_blog_posts FOR SELECT USING (true);
CREATE POLICY "mariella_admin_write" ON public.mariella_blog_posts FOR ALL USING (public.mariella_is_admin()) WITH CHECK (public.mariella_is_admin());
CREATE POLICY "mariella_public_read" ON public.mariella_categories FOR SELECT USING (true);
CREATE POLICY "mariella_admin_write" ON public.mariella_categories FOR ALL USING (public.mariella_is_admin()) WITH CHECK (public.mariella_is_admin());
CREATE POLICY "mariella_admins_self_read" ON public.mariella_admins FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email')::text, '')));

-- 4. STORAGE: bucket propio, lectura pública, escritura solo admin
INSERT INTO storage.buckets (id, name, public) VALUES ('mariella', 'mariella', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "mariella_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'mariella');
CREATE POLICY "mariella_admin_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mariella' AND public.mariella_is_admin());
CREATE POLICY "mariella_admin_update" ON storage.objects FOR UPDATE USING (bucket_id = 'mariella' AND public.mariella_is_admin());
CREATE POLICY "mariella_admin_delete" ON storage.objects FOR DELETE USING (bucket_id = 'mariella' AND public.mariella_is_admin());

-- 5. Seed: categorías + contenido inicial → ver constants.ts (mismo contenido).
--    Las imágenes seed viven en el bucket (carpeta seed/) y en public/fotos/.
