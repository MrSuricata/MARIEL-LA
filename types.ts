export interface Product {
  id: string;
  name: string;
  description: string;
  priceUYU: number;
  priceUSD: number;
  category: string;
  images: string[];
  materials: string[];
  colors: string[];
  dimensions: string;
  isFeatured: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Fair {
  id: string;
  name: string;
  date: string;
  city: string;
  location: string;
  description: string;
  imageUrl?: string;
  mapsUrl?: string;
  status: 'upcoming' | 'past';
}

export interface HistoryEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML or Markdown supported roughly
  author: string;
  date: string;
  imageUrl: string;
  readTime: string;
}

export interface Order {
  items: CartItem[];
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  totalUYU: number;
  totalUSD: number;
  currency: 'UYU' | 'USD';
}

export type Currency = 'UYU' | 'USD';
