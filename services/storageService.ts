import { Product, Fair, HistoryEvent, BlogPost } from '../types';
import { supabase } from './supabaseClient';

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

// --- Storage Service (Supabase) ---

export const StorageService = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').order('created_at');
    if (error) { console.error('Error fetching products:', error); return []; }
    return (data || []).map(dbToProduct);
  },

  saveProduct: async (product: Product): Promise<void> => {
    const { error } = await supabase.from('products').upsert(productToDb(product));
    if (error) console.error('Error saving product:', error);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Error deleting product:', error);
  },

  // Fairs
  getFairs: async (): Promise<Fair[]> => {
    const { data, error } = await supabase.from('fairs').select('*').order('created_at');
    if (error) { console.error('Error fetching fairs:', error); return []; }
    return (data || []).map(dbToFair);
  },

  saveFair: async (fair: Fair): Promise<void> => {
    const { error } = await supabase.from('fairs').upsert(fairToDb(fair));
    if (error) console.error('Error saving fair:', error);
  },

  deleteFair: async (id: string): Promise<void> => {
    const { error } = await supabase.from('fairs').delete().eq('id', id);
    if (error) console.error('Error deleting fair:', error);
  },

  // History
  getHistory: async (): Promise<HistoryEvent[]> => {
    const { data, error } = await supabase.from('history_events').select('*').order('created_at');
    if (error) { console.error('Error fetching history:', error); return []; }
    return (data || []).map(dbToHistory);
  },

  saveHistoryEvent: async (event: HistoryEvent): Promise<void> => {
    const { error } = await supabase.from('history_events').upsert(historyToDb(event));
    if (error) console.error('Error saving history event:', error);
  },

  deleteHistoryEvent: async (id: string): Promise<void> => {
    const { error } = await supabase.from('history_events').delete().eq('id', id);
    if (error) console.error('Error deleting history event:', error);
  },

  // Blog Posts
  getBlogPosts: async (): Promise<BlogPost[]> => {
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at');
    if (error) { console.error('Error fetching blog posts:', error); return []; }
    return (data || []).map(dbToBlogPost);
  },

  saveBlogPost: async (post: BlogPost): Promise<void> => {
    const { error } = await supabase.from('blog_posts').upsert(blogPostToDb(post));
    if (error) console.error('Error saving blog post:', error);
  },

  deleteBlogPost: async (id: string): Promise<void> => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) console.error('Error deleting blog post:', error);
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase.from('categories').select('name').order('sort_order');
    if (error) { console.error('Error fetching categories:', error); return []; }
    return (data || []).map((r: any) => r.name);
  },

  addCategory: async (name: string): Promise<void> => {
    const { data: maxRow } = await supabase.from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1);
    const nextOrder = (maxRow && maxRow[0] ? maxRow[0].sort_order : 0) + 1;
    const { error } = await supabase.from('categories').insert({ name, sort_order: nextOrder });
    if (error) console.error('Error adding category:', error);
  },

  deleteCategory: async (name: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('name', name);
    if (error) console.error('Error deleting category:', error);
  },

  // Image Upload
  uploadImage: async (file: File, folder: string = 'products'): Promise<string> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${folder}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('images').upload(fileName, file, {
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('images').getPublicUrl(fileName);
    return data.publicUrl;
  },
};
