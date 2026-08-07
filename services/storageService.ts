import { Product, Fair, HistoryEvent, BlogPost, SiteSettings, ThemeName } from '../types';
import { supabase } from './supabaseClient';
import { INITIAL_PRODUCTS, INITIAL_FAIRS, INITIAL_HISTORY, INITIAL_BLOG_POSTS, INITIAL_CATEGORIES } from '../constants';

// Tablas del tenant MARIEL'LA dentro del proyecto compartido
const T = {
  products: 'mariella_products',
  fairs: 'mariella_fairs',
  history: 'mariella_history_events',
  blog: 'mariella_blog_posts',
  categories: 'mariella_categories',
  settings: 'mariella_settings',
} as const;

export const DEFAULT_SETTINGS: SiteSettings = {
  theme: 'cuero',
  heroEyebrow: 'Artesanía Uruguaya',
  heroLine1: 'Piezas de cuero genuino que cuentan historias.',
  heroLine2: 'Hechas a mano, una a una, con pasión y tiempo.',
  heroCta: 'Ver Tienda Online',
};

const VALID_THEMES: ThemeName[] = ['cuero', 'vino', 'oliva', 'noche', 'terracota', 'rosa'];

const BUCKET = 'mariella';

// Usuario único de administración (Mariela solo ingresa su contraseña)
export const ADMIN_EMAIL = 'admin@mariel-la.vercel.app';

// --- Mappers: DB snake_case <-> TS camelCase ---

function dbToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceUYU: Number(row.price_uyu),
    priceUSD: Number(row.price_usd),
    category: row.category,
    images: row.images || [],
    materials: row.materials || [],
    colors: row.colors || [],
    dimensions: row.dimensions,
    isFeatured: row.is_featured,
    isSoldOut: row.is_sold_out || false,
    createdAt: row.created_at,
  };
}

function productToDb(p: Product): any {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price_uyu: p.priceUYU,
    price_usd: p.priceUSD,
    category: p.category,
    images: p.images,
    materials: Array.isArray(p.materials) ? p.materials : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    dimensions: p.dimensions,
    is_featured: p.isFeatured,
    is_sold_out: p.isSoldOut || false,
    // created_at se omite: lo define la base al insertar
  };
}

function dbToFair(row: any): Fair {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    city: row.city,
    location: row.location,
    description: row.description,
    imageUrl: row.image_url || '',
    mapsUrl: row.maps_url || '',
    status: row.status,
  };
}

function fairToDb(f: Fair): any {
  return {
    id: f.id,
    name: f.name,
    date: f.date,
    city: f.city,
    location: f.location,
    description: f.description,
    image_url: f.imageUrl,
    maps_url: f.mapsUrl,
    status: f.status,
  };
}

function dbToHistory(row: any): HistoryEvent {
  return {
    id: row.id,
    year: row.year,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
  };
}

function historyToDb(h: HistoryEvent): any {
  return {
    id: h.id,
    year: h.year,
    title: h.title,
    description: h.description,
    image_url: h.imageUrl,
  };
}

function dbToBlogPost(row: any): BlogPost {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    date: row.date,
    imageUrl: row.image_url,
    readTime: row.read_time,
  };
}

function blogPostToDb(b: BlogPost): any {
  return {
    id: b.id,
    title: b.title,
    excerpt: b.excerpt,
    content: b.content,
    author: b.author,
    date: b.date,
    image_url: b.imageUrl,
    read_time: b.readTime,
  };
}

// Escrituras: si falla, se lanza el error para que la UI avise (nada de fallos silenciosos)
function throwIfError(error: { message: string } | null, action: string): void {
  if (error) {
    console.error(`Error ${action}:`, error);
    throw new Error(`${action}: ${error.message}`);
  }
}

// --- Storage Service (Supabase) ---
// Lecturas: si la base no responde se usa el contenido inicial (la web nunca
// queda vacía por un problema de conexión). Si responde y está vacía de
// verdad, se devuelve vacío: lo que se ve es lo que hay.

export const StorageService = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from(T.products).select('*').order('created_at');
    if (error) { console.error('Error fetching products:', error); return INITIAL_PRODUCTS; }
    return (data ?? []).map(dbToProduct);
  },

  saveProduct: async (product: Product): Promise<void> => {
    const { error } = await supabase.from(T.products).upsert(productToDb(product));
    throwIfError(error, 'guardar producto');
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase.from(T.products).delete().eq('id', id);
    throwIfError(error, 'eliminar producto');
  },

  // Fairs
  getFairs: async (): Promise<Fair[]> => {
    const { data, error } = await supabase.from(T.fairs).select('*').order('created_at');
    if (error) { console.error('Error fetching fairs:', error); return INITIAL_FAIRS; }
    return (data ?? []).map(dbToFair);
  },

  saveFair: async (fair: Fair): Promise<void> => {
    const { error } = await supabase.from(T.fairs).upsert(fairToDb(fair));
    throwIfError(error, 'guardar feria');
  },

  deleteFair: async (id: string): Promise<void> => {
    const { error } = await supabase.from(T.fairs).delete().eq('id', id);
    throwIfError(error, 'eliminar feria');
  },

  // History
  getHistory: async (): Promise<HistoryEvent[]> => {
    const { data, error } = await supabase.from(T.history).select('*').order('created_at');
    if (error) { console.error('Error fetching history:', error); return INITIAL_HISTORY; }
    return (data ?? []).map(dbToHistory);
  },

  saveHistoryEvent: async (event: HistoryEvent): Promise<void> => {
    const { error } = await supabase.from(T.history).upsert(historyToDb(event));
    throwIfError(error, 'guardar hito');
  },

  deleteHistoryEvent: async (id: string): Promise<void> => {
    const { error } = await supabase.from(T.history).delete().eq('id', id);
    throwIfError(error, 'eliminar hito');
  },

  // Blog Posts
  getBlogPosts: async (): Promise<BlogPost[]> => {
    const { data, error } = await supabase.from(T.blog).select('*').order('created_at');
    if (error) { console.error('Error fetching blog posts:', error); return INITIAL_BLOG_POSTS; }
    return (data ?? []).map(dbToBlogPost);
  },

  saveBlogPost: async (post: BlogPost): Promise<void> => {
    const { error } = await supabase.from(T.blog).upsert(blogPostToDb(post));
    throwIfError(error, 'guardar post');
  },

  deleteBlogPost: async (id: string): Promise<void> => {
    const { error } = await supabase.from(T.blog).delete().eq('id', id);
    throwIfError(error, 'eliminar post');
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase.from(T.categories).select('name').order('sort_order');
    if (error) { console.error('Error fetching categories:', error); return INITIAL_CATEGORIES; }
    return (data ?? []).map((r: any) => r.name);
  },

  addCategory: async (name: string): Promise<void> => {
    const { data: maxRow, error: readError } = await supabase
      .from(T.categories).select('sort_order').order('sort_order', { ascending: false }).limit(1);
    throwIfError(readError, 'agregar categoría');
    const nextOrder = (maxRow && maxRow[0] ? maxRow[0].sort_order : 0) + 1;
    const { error } = await supabase.from(T.categories).insert({ name, sort_order: nextOrder });
    throwIfError(error, 'agregar categoría');
  },

  deleteCategory: async (name: string): Promise<void> => {
    const { error } = await supabase.from(T.categories).delete().eq('name', name);
    throwIfError(error, 'eliminar categoría');
  },

  // Personalización (tema + textos de portada)
  getSettings: async (): Promise<SiteSettings> => {
    const { data, error } = await supabase.from(T.settings).select('*').eq('id', 1).maybeSingle();
    if (error || !data) {
      if (error) console.error('Error fetching settings:', error);
      return DEFAULT_SETTINGS;
    }
    return {
      theme: VALID_THEMES.includes(data.theme) ? data.theme : 'cuero',
      heroEyebrow: data.hero_eyebrow ?? DEFAULT_SETTINGS.heroEyebrow,
      heroLine1: data.hero_line1 ?? DEFAULT_SETTINGS.heroLine1,
      heroLine2: data.hero_line2 ?? DEFAULT_SETTINGS.heroLine2,
      heroCta: data.hero_cta ?? DEFAULT_SETTINGS.heroCta,
    };
  },

  saveSettings: async (s: SiteSettings): Promise<void> => {
    const { error } = await supabase.from(T.settings).upsert({
      id: 1,
      theme: s.theme,
      hero_eyebrow: s.heroEyebrow,
      hero_line1: s.heroLine1,
      hero_line2: s.heroLine2,
      hero_cta: s.heroCta,
      updated_at: new Date().toISOString(),
    });
    throwIfError(error, 'guardar personalización');
  },

  // Image Upload
  uploadImage: async (file: File, folder: string = 'products'): Promise<string> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${folder}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(`subir imagen: ${error.message}`);
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  },
};

// --- Auth (Supabase) ---
// La contraseña se valida en el servidor. La sesión persiste entre visitas.

export const AuthService = {
  signIn: async (password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    if (error) throw new Error(error.message);
  },

  signOut: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  // Notifica el estado actual y cada cambio de sesión. Devuelve el unsubscribe.
  onAdminChange: (callback: (isAdmin: boolean) => void): (() => void) => {
    const isAdminSession = (session: { user?: { email?: string } } | null) =>
      !!session?.user?.email && session.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    supabase.auth.getSession().then(({ data }) => callback(isAdminSession(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(isAdminSession(session));
    });
    return () => sub.subscription.unsubscribe();
  },
};
