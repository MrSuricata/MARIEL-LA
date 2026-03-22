-- ============================================
-- MARIEL'LA - Supabase Setup
-- Pegar TODO esto en SQL Editor y darle Run
-- ============================================

-- 1. CREAR TABLAS
CREATE TABLE IF NOT EXISTS products (
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
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fairs (
  id text PRIMARY KEY,
  name text NOT NULL,
  date text NOT NULL,
  city text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text,
  maps_url text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS history_events (
  id text PRIMARY KEY,
  year text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
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

CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

-- 2. HABILITAR RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE fairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 3. POLITICAS: lectura publica
CREATE POLICY "Public read" ON products FOR SELECT USING (true);
CREATE POLICY "Public read" ON fairs FOR SELECT USING (true);
CREATE POLICY "Public read" ON history_events FOR SELECT USING (true);
CREATE POLICY "Public read" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Public read" ON categories FOR SELECT USING (true);

-- 4. POLITICAS: escritura con anon key (admin es client-side)
CREATE POLICY "Anon insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update" ON products FOR UPDATE USING (true);
CREATE POLICY "Anon delete" ON products FOR DELETE USING (true);

CREATE POLICY "Anon insert" ON fairs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update" ON fairs FOR UPDATE USING (true);
CREATE POLICY "Anon delete" ON fairs FOR DELETE USING (true);

CREATE POLICY "Anon insert" ON history_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update" ON history_events FOR UPDATE USING (true);
CREATE POLICY "Anon delete" ON history_events FOR DELETE USING (true);

CREATE POLICY "Anon insert" ON blog_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update" ON blog_posts FOR UPDATE USING (true);
CREATE POLICY "Anon delete" ON blog_posts FOR DELETE USING (true);

CREATE POLICY "Anon insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update" ON categories FOR UPDATE USING (true);
CREATE POLICY "Anon delete" ON categories FOR DELETE USING (true);

-- 5. STORAGE: bucket publico para imagenes
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow updates" ON storage.objects FOR UPDATE USING (bucket_id = 'images');
CREATE POLICY "Allow deletes" ON storage.objects FOR DELETE USING (bucket_id = 'images');

-- 6. SEED DATA: Categorias
INSERT INTO categories (name, sort_order) VALUES
  ('Todas', 0),
  ('Carteras', 1),
  ('Billeteras', 2),
  ('Cintos', 3),
  ('Mochilas', 4),
  ('Accesorios', 5)
ON CONFLICT (name) DO NOTHING;

-- 7. SEED DATA: Productos
INSERT INTO products (id, name, description, price_uyu, price_usd, category, images, materials, colors, dimensions, is_featured) VALUES
  ('1', 'Bolso Tote Artesanal "Boho Chic"',
   'Pieza única de estilo bohemio, confeccionada artesanalmente. Combina vibrante cuero azul y gris con dinámicos flecos amarillos. Destaca su medallón central de cuero plateado con incrustación turquesa. Un accesorio audaz y con carácter.',
   5800, 145, 'Carteras',
   ARRAY['https://drive.google.com/file/d/1anp427tiOl9TOxnBmLpendcxQqixPJ5B/view?usp=drive_link'],
   ARRAY['Cuero azul y gris', 'Flecos de cuero amarillo', 'Incrustación turquesa'],
   ARRAY['Azul', 'Gris', 'Amarillo'], '35cm x 30cm x 12cm', true),
  ('2', 'Bolso Tote de Cuero "Serpiente Rosa"',
   'Exclusivo bolso tote elaborado a mano. Impresiona por su cuero de alta calidad con textura estilo piel de serpiente en un intenso color rosa fucsia. Diseño moderno complementado con elegantes herrajes metálicos circulares.',
   6500, 160, 'Carteras',
   ARRAY['https://drive.google.com/file/d/14iwM_Ve8_i570wAU724w2x4W1GRViOVV/view?usp=drive_link'],
   ARRAY['Cuero texturizado serpiente', 'Herrajes metálicos'],
   ARRAY['Rosa Fucsia'], '32cm x 28cm x 10cm', true),
  ('3', 'Bolso Duffel de Cuero Marrón',
   'Espacioso bolso de viaje tipo duffel, confeccionado expertamente en cuero marrón robusto y duradero. Cuenta con asas de mano reforzadas y correa de hombro ajustable con resistentes herrajes de metal envejecido. Estilo rústico y atemporal para tus escapadas.',
   8900, 220, 'Accesorios',
   ARRAY['https://drive.google.com/file/d/1kEYWlpPGrf-mUAK605m00SCbR5kapSLm/view?usp=drive_link'],
   ARRAY['Cuero marrón robusto', 'Metal envejecido'],
   ARRAY['Marrón'], '50cm x 30cm x 25cm', true)
ON CONFLICT (id) DO NOTHING;

-- 8. SEED DATA: Ferias
INSERT INTO fairs (id, name, date, city, location, description, status, image_url, maps_url) VALUES
  ('f1', 'Feria Ideas+', '2025-12-01', 'Montevideo', 'Parque Rodó',
   'Estaremos presentes en el stand 45 con toda la nueva colección de verano.',
   'upcoming', 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800', 'https://goo.gl/maps/xyz'),
  ('f2', 'Fiesta de la Patria Gaucha', '2025-03-10', 'Tacuarembó', 'Laguna de las Lavanderas',
   'Un éxito total, gracias a todos los que pasaron a saludar.',
   'past', 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800', NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. SEED DATA: Historia
INSERT INTO history_events (id, year, title, description, image_url) VALUES
  ('h1', '1998', 'El Comienzo',
   'Todo comenzó en un pequeño taller familiar en el interior de Uruguay. Lo que empezó como un hobby, reparando monturas y aperos viejos, despertó una curiosidad profunda por la nobleza del cuero.',
   'https://images.unsplash.com/photo-1605218427368-35b158650a64?w=800'),
  ('h2', '2010', 'El Oficio',
   'Aprendimos que el cuero tiene memoria, que cada pieza respira. Nos especializamos en la talabartería tradicional, respetando los tiempos que exige el material.',
   'https://images.unsplash.com/photo-1598532163257-52648740d12e?w=800'),
  ('h3', '2024', 'MARIEL''LA Hoy',
   'Hoy, MARIEL''LA es sinónimo de calidad artesanal. No somos una fábrica; somos un taller donde cada cliente se lleva una parte de nuestra historia.',
   'https://images.unsplash.com/photo-1473188588951-e5d7eda7b6ac?w=800')
ON CONFLICT (id) DO NOTHING;

-- 10. SEED DATA: Blog
INSERT INTO blog_posts (id, title, excerpt, content, author, date, read_time, image_url) VALUES
  ('b4', 'MARIEL''LA en AM 770 Oriental',
   'Estuvimos conversando sobre la pasión por la artesanía y nuestras nuevas creaciones en la radio.',
   'Queremos expresar nuestro profundo agradecimiento a AM 770 Oriental por abrirnos las puertas de su estudio. Fue un placer inmenso poder compartir con la audiencia nuestra pasión por el cuero, el proceso creativo detrás de cada pieza única y las historias que dan vida a MARIEL''LA. Gracias por apoyar la artesanía uruguaya y permitirnos difundir nuestro arte. ¡Seguimos creando con más inspiración que nunca!',
   'Mariela Calistro', '20 Mar 2025', 'Escuchar nota',
   'https://drive.google.com/file/d/1p0rhmnjphBl7F9ZVFLl-PagsD1YYysTt/view?usp=drive_link'),
  ('b1', 'El Cuero en la Identidad Uruguaya',
   '¿Sabías que Uruguay tiene una de las tradiciones de cuero más ricas del mundo? Descubre por qué nuestras piezas son únicas.',
   'Desde los tiempos de la colonia, la ganadería ha sido el motor de nuestro país, y con ella, el oficio del guasquero y el talabartero. El cuero uruguayo es reconocido mundialmente no solo por su calidad, sino por el tratamiento natural que se le da. A diferencia de las producciones industriales masivas, en Uruguay todavía valoramos el curtido vegetal, un proceso lento que utiliza taninos naturales de cortezas de árboles en lugar de cromo tóxico. Esto resulta en un cuero que respira, que huele a naturaleza y que desarrolla una pátina única con los años. Al comprar una pieza local, no solo llevás un objeto, llevás siglos de tradición gaucha.',
   'Mariela Calistro', '15 Ene 2025', '3 min lectura',
   'https://drive.google.com/file/d/1qeN28si1WAj_TmotiGxcENBATPK1Ugze/view?usp=drive_link'),
  ('b2', 'Curiosidades: Grano Pleno vs. Cuero Genuino',
   'No todo el cuero es igual. Aprende a distinguir la calidad y por qué elegimos trabajar solo con lo mejor.',
   'En el mundo de la marroquinería existen muchos términos confusos. ''Genuine Leather'' (Cuero Genuino) suena bien, ¿verdad? En realidad, es una de las calidades más bajas; se hace con las capas inferiores de la piel que sobran tras separar la parte buena. En MARIEL''LA utilizamos ''Full Grain'' (Grano Pleno). Es la capa superior de la piel, la más resistente y la única que conserva la textura natural del animal, incluidas sus imperfecciones que lo hacen único. Es un cuero que nunca se pela, solo se embellece. Es más difícil de trabajar y requiere artesanos expertos, pero la diferencia se nota al tacto y en la durabilidad de décadas.',
   'Mariela Calistro', '28 Feb 2025', '4 min lectura',
   'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800'),
  ('b3', 'Guía Definitiva: Cómo Cuidar tu Cuero',
   'Secretos del taller para que tu cartera o cinto dure para siempre y luzca mejor cada día.',
   'El cuero es piel, y como tal, necesita hidratación. 1. **Hidratación**: Una vez cada 6 meses, aplica una crema hidratante incolora o grasa de potro con un paño suave. 2. **Agua**: Si se moja, nunca lo seques al sol o con secador, eso lo acartona. Dejalo secar a la sombra naturalmente. 3. **Almacenamiento**: Guardá tus carteras rellenas de papel para que mantengan la forma y en bolsas de tela (nunca plástico) para que respiren. 4. **Manchas**: Si se mancha con aceite, cubrilo con talco inmediatamente y dejalo actuar 24 horas. Siguiendo estos pasos, tus piezas MARIEL''LA serán herencia para la próxima generación.',
   'Mariela Calistro', '10 Mar 2025', '2 min lectura',
   'https://drive.google.com/file/d/1A8uunxmriIof4e23Zr1xO7HdmIVdHTuY/view?usp=drive_link')
ON CONFLICT (id) DO NOTHING;

-- ✅ LISTO! Verificar con: SELECT count(*) FROM products;
