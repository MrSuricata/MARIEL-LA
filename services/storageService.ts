import { Product, Fair, HistoryEvent, BlogPost } from '../types';
import { INITIAL_PRODUCTS, INITIAL_FAIRS, INITIAL_HISTORY, INITIAL_BLOG_POSTS, INITIAL_CATEGORIES } from '../constants';

const KEYS = {
  PRODUCTS: 'mariella_products',
  FAIRS: 'mariella_fairs',
  HISTORY: 'mariella_history',
  BLOG: 'mariella_blog',
  CART: 'mariella_cart',
  CATEGORIES: 'mariella_categories'
};

export const StorageService = {
  getProducts: (): Product[] => {
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