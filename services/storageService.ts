import { Product, Fair, HistoryEvent, BlogPost } from '../types';
import { INITIAL_PRODUCTS, INITIAL_FAIRS, INITIAL_HISTORY, INITIAL_BLOG_POSTS, INITIAL_CATEGORIES } from '../constants';

const DATA_VERSION = 'v2025_update_3'; // Incrementing this forces a data reset for all users

const KEYS = {
  VERSION: 'mariella_version',
  PRODUCTS: 'mariella_products',
  FAIRS: 'mariella_fairs',
  HISTORY: 'mariella_history',
  BLOG: 'mariella_blog',
  CART: 'mariella_cart',
  CATEGORIES: 'mariella_categories'
};

// Check version and reset if needed
const checkVersion = () => {
  const currentVersion = localStorage.getItem(KEYS.VERSION);
  if (currentVersion !== DATA_VERSION) {
    // Clear old data to ensure new content (products, blog, history) is loaded
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.FAIRS);
    localStorage.removeItem(KEYS.HISTORY);
    localStorage.removeItem(KEYS.BLOG);
    localStorage.removeItem(KEYS.CATEGORIES);
    // Note: We keep the cart so users don't lose selections
    localStorage.setItem(KEYS.VERSION, DATA_VERSION);
    return false; // Data was reset
  }
  return true; // Data is up to date
};

export const StorageService = {
  getProducts: (): Product[] => {
    checkVersion();
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    if (!stored) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(stored);
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getFairs: (): Fair[] => {
    checkVersion();
    const stored = localStorage.getItem(KEYS.FAIRS);
    if (!stored) {
      localStorage.setItem(KEYS.FAIRS, JSON.stringify(INITIAL_FAIRS));
      return INITIAL_FAIRS;
    }
    return JSON.parse(stored);
  },

  saveFairs: (fairs: Fair[]) => {
    localStorage.setItem(KEYS.FAIRS, JSON.stringify(fairs));
  },

  getHistory: (): HistoryEvent[] => {
    checkVersion();
    const stored = localStorage.getItem(KEYS.HISTORY);
    if (!stored) {
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
      return INITIAL_HISTORY;
    }
    return JSON.parse(stored);
  },

  saveHistory: (history: HistoryEvent[]) => {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  },

  getBlogPosts: (): BlogPost[] => {
    checkVersion();
    const stored = localStorage.getItem(KEYS.BLOG);
    if (!stored) {
      localStorage.setItem(KEYS.BLOG, JSON.stringify(INITIAL_BLOG_POSTS));
      return INITIAL_BLOG_POSTS;
    }
    return JSON.parse(stored);
  },

  saveBlogPosts: (posts: BlogPost[]) => {
    localStorage.setItem(KEYS.BLOG, JSON.stringify(posts));
  },

  getCategories: (): string[] => {
    checkVersion();
    const stored = localStorage.getItem(KEYS.CATEGORIES);
    if (!stored) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(stored);
  },

  saveCategories: (categories: string[]) => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  }
};
