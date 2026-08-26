import React, { useState, useEffect, createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ShoppingBag, Menu, X, Instagram, Phone, MapPin,
  Star, Trash2, Edit, Plus, Minus, Search, Settings, LogOut,
  CheckCircle, ArrowRight, Hammer, Heart, ScrollText, ChevronLeft, ChevronRight,
  Maximize2, Truck, MessageCircle, Copy, Database, XCircle, Upload,
  AlertCircle, HelpCircle, Share2, ArrowUp, Eye, EyeOff, Sparkles, Package, Calendar, Info, Palette
} from 'lucide-react';
import { Product, CartItem, Fair, Currency, HistoryEvent, BlogPost, SiteSettings, ThemeName } from './types';
import { StorageService, AuthService, DEFAULT_SETTINGS } from './services/storageService';

// Temas disponibles en Admin → Personalizar (los colores son solo la muestra del selector)
const THEMES: { id: ThemeName; name: string; swatch: [string, string, string] }[] = [
  { id: 'cuero', name: 'Cuero Clásico', swatch: ['#67331e', '#c68131', '#f5ead6'] },
  { id: 'vino', name: 'Vino Bordó', swatch: ['#4a1a19', '#b25a50', '#f8e8e6'] },
  { id: 'oliva', name: 'Verde Oliva', swatch: ['#34351d', '#8a8749', '#f0efdd'] },
  { id: 'noche', name: 'Azul Noche', swatch: ['#1f2937', '#587293', '#e9edf4'] },
  { id: 'terracota', name: 'Terracota', swatch: ['#55261a', '#c76440', '#fae9df'] },
  { id: 'rosa', name: 'Rosa Viejo', swatch: ['#481d29', '#b45669', '#f9e8ea'] },
];

// --- Constantes globales ---
const WHATSAPP_NUMBER = '59898766318';
const INSTAGRAM_URL = 'https://www.instagram.com/mariellacalistro/';
const waLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

// --- Utility: Image URL Processor ---
const processImageUrl = (url: string, size: number = 800): string => {
  if (!url) return '';
  // Supabase storage URLs pass through directly
  if (url.includes('supabase.co/storage')) return url;
  let cleanUrl = url;
  if (url.includes('google.com/url?')) {
     const match = url.match(/q=([^&]+)/);
     if (match && match[1]) {
       cleanUrl = decodeURIComponent(match[1]);
     }
  }
  const idMatch = cleanUrl.match(/[-\w]{25,}/);
  if (idMatch && (cleanUrl.includes('drive.google.com') || cleanUrl.includes('docs.google.com'))) {
    return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w${size}`;
  }
  if (cleanUrl.includes('images.unsplash.com')) {
    const urlObj = new URL(cleanUrl);
    urlObj.searchParams.set('w', size.toString());
    return urlObj.toString();
  }
  return cleanUrl;
};

const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="#f5ead6" width="400" height="400"/><text x="200" y="200" text-anchor="middle" fill="#9b4d23" font-family="serif" font-size="18">MARIEL\'LA</text></svg>');
const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = FALLBACK_IMG; };
const safeImg = (images: string[] | undefined, index: number = 0): string => (images && images.length > index) ? images[index] : '';

// src seguro: nunca devuelve string vacío (usa el placeholder de la marca)
const imgSrc = (images: string[] | undefined, size: number, index: number = 0): string => {
  const url = safeImg(images, index);
  return url ? processImageUrl(url, size) : FALLBACK_IMG;
};
const imgSrc1 = (url: string | undefined, size: number): string => url ? processImageUrl(url, size) : FALLBACK_IMG;

// Formateo de precios con separador de miles uruguayo
const formatPrice = (amount: number, currency: Currency): string =>
  `${currency === 'UYU' ? '$U' : 'US$'} ${amount.toLocaleString('es-UY')}`;

// new Date('YYYY-MM-DD') interpreta UTC y en Uruguay (UTC-3) muestra el día
// anterior. Parseamos la fecha como local para que el día sea el correcto.
const parseLocalDate = (dateStr: string): Date => {
  const parts = (dateStr || '').split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
};

// Título + descripción por página
const usePageMeta = (title: string, description?: string) => {
  useEffect(() => {
    document.title = title;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
  }, [title, description]);
};

// --- Reveal Animation Component ---
const Reveal: React.FC<{ children: ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- Scroll To Top on route change ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- Botón flotante "subir" ---
const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  // En la ficha de producto (celular) la barra de compra ocupa ese lugar
  const onProductPage = pathname.startsWith('/producto/');
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 left-6 z-40 bg-white text-leather-900 p-3 rounded-full shadow-xl border border-leather-200 hover:bg-leather-50 transition-all hover:scale-110 animate-fade-in-up ${onProductPage ? 'hidden lg:block' : ''}`}
      aria-label="Volver arriba"
    >
      <ArrowUp size={20} />
    </button>
  );
};

// --- Compatibilidad con links viejos con hash (/#/catalogo → /catalogo) ---
const HashRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const { hash } = window.location;
    if (hash.startsWith('#/')) {
      navigate(hash.slice(1), { replace: true });
    }
  }, [navigate]);
  return null;
};

// --- Sistema de Toasts (avisos) ---
type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }

const ToastContext = createContext<{ showToast: (message: string, type?: ToastType) => void } | undefined>(undefined);
const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'error' ? 5000 : 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 items-center pointer-events-none px-4 w-full sm:w-auto" aria-live="polite">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`animate-toast-in flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl text-white text-sm font-bold max-w-full ${
              toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-leather-700' : 'bg-leather-900'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} className="flex-shrink-0" /> : <CheckCircle size={18} className="flex-shrink-0" />}
            <span className="truncate">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// --- Store Context ---
interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  fairs: Fair[];
  history: HistoryEvent[];
  blogPosts: BlogPost[];
  categories: string[];
  currency: Currency;
  exchangeRate: number;
  loading: boolean;
  authReady: boolean;
  settings: SiteSettings;
  updateSettings: (s: SiteSettings) => Promise<boolean>;
  convertPrice: (priceUYU: number) => number;
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setCurrency: (c: Currency) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  addProduct: (product: Product) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  addFair: (fair: Fair) => Promise<boolean>;
  updateFair: (fair: Fair) => Promise<boolean>;
  deleteFair: (id: string) => Promise<boolean>;
  addHistoryEvent: (event: HistoryEvent) => Promise<boolean>;
  updateHistoryEvent: (event: HistoryEvent) => Promise<boolean>;
  deleteHistoryEvent: (id: string) => Promise<boolean>;
  addBlogPost: (post: BlogPost) => Promise<boolean>;
  updateBlogPost: (post: BlogPost) => Promise<boolean>;
  deleteBlogPost: (id: string) => Promise<boolean>;
  addCategory: (category: string) => Promise<boolean>;
  deleteCategory: (category: string) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};

const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [fairs, setFairs] = useState<Fair[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<Currency>('UYU');
  const [exchangeRate, setExchangeRate] = useState<number>(42); // fallback ~42 UYU/USD
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const { showToast } = useToast();

  const convertPrice = (priceUYU: number): number => {
    if (currency === 'UYU') return priceUYU;
    return Math.round(priceUYU / exchangeRate);
  };

  useEffect(() => {
    const loadData = async () => {
      const [prods, frs, hist, blogs, cats, setts] = await Promise.all([
        StorageService.getProducts(),
        StorageService.getFairs(),
        StorageService.getHistory(),
        StorageService.getBlogPosts(),
        StorageService.getCategories(),
        StorageService.getSettings(),
      ]);
      setProducts(prods);
      setFairs(frs);
      setHistory(hist);
      setBlogPosts(blogs);
      setCategories(cats);
      setSettings(setts);
      setLoading(false);
    };
    loadData();
    // Cotización USD/UYU del día (si falla, queda el valor por defecto)
    fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')
      .then(r => r.json())
      .then(data => {
        const rate = data?.usd?.uyu;
        if (typeof rate === 'number' && rate > 10 && rate < 200) setExchangeRate(rate);
      })
      .catch(() => {});
    try {
      const savedCart = localStorage.getItem('mariella_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.every(i => i && typeof i.id === 'string' && typeof i.quantity === 'number')) {
          setCart(parsed);
        }
      }
    } catch { /* carrito corrupto: se arranca vacío */ }
  }, []);

  // Sesión de admin (persiste entre visitas y pestañas)
  useEffect(() => {
    const unsubscribe = AuthService.onAdminChange((admin) => {
      setIsAdmin(admin);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Aplica el tema elegido a todo el sitio (y lo cachea para evitar parpadeo)
  useEffect(() => {
    if (settings.theme === 'cuero') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    try { localStorage.setItem('mariella_theme', settings.theme); } catch { /* sin storage */ }
    // Color de la barra del navegador acorde al tema
    const meta = document.querySelector('meta[name="theme-color"]');
    const rgb = getComputedStyle(document.documentElement).getPropertyValue('--leather-900').trim();
    if (meta && rgb) meta.setAttribute('content', `rgb(${rgb.split(' ').join(', ')})`);
  }, [settings.theme]);

  useEffect(() => { localStorage.setItem('mariella_cart', JSON.stringify(cart)); }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast('Agregado al carrito 🛍️');
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };
  const clearCart = () => setCart([]);

  const login = async (password: string): Promise<boolean> => {
    try {
      await AuthService.signIn(password);
      return true;
    } catch {
      return false;
    }
  };
  const logout = () => { AuthService.signOut(); };

  // Guardado con reversa: si la nube falla, se restaura lo anterior y se avisa.
  const persist = async (action: () => Promise<void>, revert: () => void, successMsg?: string): Promise<boolean> => {
    try {
      await action();
      if (successMsg) showToast(successMsg);
      return true;
    } catch (e) {
      console.error(e);
      revert();
      showToast('No se pudo guardar. Revisá tu conexión e intentá de nuevo.', 'error');
      return false;
    }
  };

  const addProduct = (p: Product) => {
    const prev = products;
    setProducts([...prev, p]);
    return persist(() => StorageService.saveProduct(p), () => setProducts(prev), 'Producto guardado ✓');
  };
  const updateProduct = (p: Product) => {
    const prev = products;
    setProducts(prev.map(x => x.id === p.id ? p : x));
    return persist(() => StorageService.saveProduct(p), () => setProducts(prev), 'Cambios guardados ✓');
  };
  const deleteProduct = (id: string) => {
    const prev = products;
    setProducts(prev.filter(x => x.id !== id));
    return persist(() => StorageService.deleteProduct(id), () => setProducts(prev), 'Producto eliminado');
  };

  const addFair = (f: Fair) => {
    const prev = fairs;
    setFairs([...prev, f]);
    return persist(() => StorageService.saveFair(f), () => setFairs(prev), 'Feria guardada ✓');
  };
  const updateFair = (f: Fair) => {
    const prev = fairs;
    setFairs(prev.map(x => x.id === f.id ? f : x));
    return persist(() => StorageService.saveFair(f), () => setFairs(prev), 'Cambios guardados ✓');
  };
  const deleteFair = (id: string) => {
    const prev = fairs;
    setFairs(prev.filter(x => x.id !== id));
    return persist(() => StorageService.deleteFair(id), () => setFairs(prev), 'Feria eliminada');
  };

  const addHistoryEvent = (h: HistoryEvent) => {
    const prev = history;
    setHistory([...prev, h]);
    return persist(() => StorageService.saveHistoryEvent(h), () => setHistory(prev), 'Hito guardado ✓');
  };
  const updateHistoryEvent = (h: HistoryEvent) => {
    const prev = history;
    setHistory(prev.map(x => x.id === h.id ? h : x));
    return persist(() => StorageService.saveHistoryEvent(h), () => setHistory(prev), 'Cambios guardados ✓');
  };
  const deleteHistoryEvent = (id: string) => {
    const prev = history;
    setHistory(prev.filter(x => x.id !== id));
    return persist(() => StorageService.deleteHistoryEvent(id), () => setHistory(prev), 'Hito eliminado');
  };

  const addBlogPost = (b: BlogPost) => {
    const prev = blogPosts;
    setBlogPosts([...prev, b]);
    return persist(() => StorageService.saveBlogPost(b), () => setBlogPosts(prev), 'Post guardado ✓');
  };
  const updateBlogPost = (b: BlogPost) => {
    const prev = blogPosts;
    setBlogPosts(prev.map(x => x.id === b.id ? b : x));
    return persist(() => StorageService.saveBlogPost(b), () => setBlogPosts(prev), 'Cambios guardados ✓');
  };
  const deleteBlogPost = (id: string) => {
    const prev = blogPosts;
    setBlogPosts(prev.filter(x => x.id !== id));
    return persist(() => StorageService.deleteBlogPost(id), () => setBlogPosts(prev), 'Post eliminado');
  };

  const updateSettings = (s: SiteSettings) => {
    const prev = settings;
    setSettings(s);
    return persist(() => StorageService.saveSettings(s), () => setSettings(prev), 'Personalización guardada ✓');
  };

  const addCategory = (c: string) => {
    if (categories.includes(c)) return Promise.resolve(false);
    const prev = categories;
    setCategories([...prev, c]);
    return persist(() => StorageService.addCategory(c), () => setCategories(prev), 'Categoría agregada ✓');
  };
  const deleteCategory = (c: string) => {
    const prev = categories;
    setCategories(prev.filter(cat => cat !== c));
    return persist(() => StorageService.deleteCategory(c), () => setCategories(prev), 'Categoría eliminada');
  };

  return (
    <StoreContext.Provider value={{
      products, cart, fairs, history, blogPosts, categories, currency, exchangeRate, loading, authReady, settings, updateSettings, convertPrice, isAdmin,
      setCurrency, addToCart, removeFromCart, updateCartQuantity, clearCart, login, logout,
      addProduct, updateProduct, deleteProduct, addFair, updateFair, deleteFair,
      addHistoryEvent, updateHistoryEvent, deleteHistoryEvent, addBlogPost, updateBlogPost, deleteBlogPost,
      addCategory, deleteCategory
    }}>
      {children}
    </StoreContext.Provider>
  );
};

// --- Toggle de moneda reutilizable ---
const CurrencyToggle = () => {
  const { currency, setCurrency } = useStore();
  return (
    <div className="inline-flex items-center gap-1 bg-leather-50 rounded-lg p-1 border border-leather-100">
      {(['UYU', 'USD'] as Currency[]).map(c => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          aria-pressed={currency === c}
          className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${currency === c ? 'bg-leather-900 text-white shadow-sm' : 'text-leather-600 hover:text-leather-900'}`}
        >
          {c === 'UYU' ? '$U' : 'US$'}
        </button>
      ))}
    </div>
  );
};

// --- Skeletons de carga ---
const ProductCardSkeleton = ({ tall: _tall = false }: { tall?: boolean }) => (
  <div>
    <div className="aspect-[4/5] skeleton rounded-2xl" />
    <div className="mt-4 space-y-2 px-0.5">
      <div className="h-3 w-1/4 skeleton rounded" />
      <div className="h-5 w-3/4 skeleton rounded" />
      <div className="h-4 w-1/3 skeleton rounded" />
    </div>
  </div>
);

// --- Tarjeta de producto (estilo galería) ---
// La foto es la protagonista: sin caja blanca, texto respirando sobre el fondo,
// segunda foto al pasar el mouse y la costura de la marca como firma.
const ProductCard = ({ product, showBadge = true, aspect = 'aspect-[4/5]' }: { product: Product; showBadge?: boolean; aspect?: string }) => {
  const { currency, convertPrice, addToCart } = useStore();
  const hasSecond = product.images.length > 1;
  return (
    <div className="group">
      <Link to={`/producto/${product.id}`} className={`block relative ${aspect} rounded-2xl overflow-hidden bg-leather-100/60 shadow-sm transition-shadow duration-500 group-hover:shadow-xl`}>
        <img
          src={imgSrc(product.images, 600)}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.06] ${product.isSoldOut ? 'grayscale-[35%] opacity-90' : ''} ${hasSecond ? 'group-hover:opacity-0' : ''}`}
          loading="lazy"
          onError={handleImgError}
        />
        {hasSecond && (
          <img
            src={imgSrc(product.images, 600, 1)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.06]"
            loading="lazy"
            onError={handleImgError}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-leather-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute inset-2.5 rounded-xl border border-dashed border-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        {showBadge && product.isFeatured && !product.isSoldOut && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-leather-50/95 backdrop-blur-sm text-leather-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            <Star size={11} className="fill-amber-400 text-amber-400" /> Destacada
          </span>
        )}
        {product.isSoldOut && (
          <span className="absolute bottom-3 left-3 bg-leather-900/85 backdrop-blur-sm text-leather-50 text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full">
            Vendida
          </span>
        )}
      </Link>
      <div className="mt-3.5 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[0.14em] font-bold text-leather-500 mb-0.5">{product.category}</span>
          <Link to={`/producto/${product.id}`}>
            <h3 className="font-serif font-bold text-leather-900 leading-snug text-base sm:text-lg group-hover:text-leather-600 transition-colors">{product.name}</h3>
          </Link>
          <p className={`mt-1 font-medium ${product.isSoldOut ? 'text-leather-400 line-through' : 'text-leather-700'}`}>{formatPrice(convertPrice(product.priceUYU), currency)}</p>
        </div>
        {!product.isSoldOut && (
          <button
            onClick={() => addToCart(product)}
            className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-leather-900 text-leather-50 flex items-center justify-center shadow-md hover:bg-leather-700 hover:scale-110 active:scale-95 transition-all"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingBag size={17} />
          </button>
        )}
      </div>
    </div>
  );
};

const BlogCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-leather-100 shadow-sm">
    <div className="aspect-[16/10] skeleton" />
    <div className="p-8 space-y-3">
      <div className="h-3 w-1/3 skeleton rounded" />
      <div className="h-6 w-full skeleton rounded" />
      <div className="h-4 w-5/6 skeleton rounded" />
    </div>
  </div>
);

// --- Cinta de texto en movimiento (identidad de marca) ---
const MarqueeStrip = () => {
  const items = ['Hecho a mano en Piriápolis', 'Piezas únicas e irrepetibles', 'Cuero genuino uruguayo', 'Envíos a todo el país', 'Tradición familiar'];
  const run = (key: string) => (
    <div key={key} className="flex items-center flex-shrink-0">
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 text-[11px] sm:text-xs uppercase tracking-[0.28em] font-bold text-leather-600 whitespace-nowrap">{t}</span>
          <span className="text-leather-400 text-xs">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee overflow-hidden border-y border-leather-200/70 bg-[rgb(var(--paper))] py-3 select-none" aria-hidden="true">
      <div className="marquee-track">{run('a')}{run('b')}</div>
    </div>
  );
};

// --- Tile narrativa dentro de la grilla del catálogo ---
const StoryTile = () => (
  <Link to="/nosotros" className="block break-inside-avoid mb-8 sm:mb-10 group">
    <div className="relative leather-patch rounded-2xl p-8 aspect-[4/5] flex flex-col items-center justify-center text-center overflow-hidden transition-transform duration-500 group-hover:scale-[1.015]">
      <div className="absolute inset-3 stitch-border rounded-xl pointer-events-none opacity-90"></div>
      <Sparkles className="text-leather-100 mb-4 opacity-80 relative z-10" size={22} />
      <p className="text-stitch font-serif italic text-xl leading-relaxed relative z-10">"No existen dos piezas iguales: la que te enamora, es tuya."</p>
      <span className="mt-5 text-leather-100/90 text-[11px] uppercase tracking-[0.22em] font-bold relative z-10 border-b border-leather-100/50 pb-1 group-hover:border-leather-100 transition-colors">Conocé a Mariela</span>
    </div>
  </Link>
);

// Ritmo de proporciones para la grilla editorial (evita la grilla uniforme)
const GRID_ASPECTS = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[7/9]', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]'];

// --- Navbar & UI Components ---

const TopBar = () => {
  const { settings } = useStore();
  return (
    <div className="bg-leather-900 text-leather-200 text-xs py-2 px-4 text-center tracking-widest uppercase font-bold border-b border-leather-800 hidden sm:block">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <span className="flex items-center gap-2"><Truck size={14} /> {settings.topbarLeft}</span>
        <span className="flex items-center gap-2">{settings.topbarRight} <Heart size={12} className="text-red-500 fill-current" /></span>
      </div>
    </div>
  );
};

const FloatingWhatsApp = () => {
  // En la ficha de producto no se muestra: ahí ya hay barra de compra y botón de consulta propios
  const { pathname } = useLocation();
  if (pathname.startsWith('/producto/')) return null;
  return (
  <a
    href={waLink('¡Hola MARIEL\'LA! Quiero hacerles una consulta 😊')}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#20bd5a] transition-all duration-300 hover:scale-110 flex items-center justify-center group"
    aria-label="Contactar por WhatsApp"
  >
    <MessageCircle size={28} className="fill-white text-white" />
    <span className="absolute right-full mr-3 bg-white text-leather-900 px-3 py-1 rounded-lg text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      ¡Escribinos!
    </span>
  </a>
  );
};

const Navbar = ({ toggleCart }: { toggleCart: () => void }) => {
  const { cart, isAdmin } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloquear el scroll del fondo cuando el menú móvil está abierto
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Cerrar el menú al cambiar de página
  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  // Texto claro sobre el hero oscuro de la portada (sin scroll)
  const isHomeHero = location.pathname === '/' && !scrolled;
  const textColorClass = isHomeHero ? 'text-leather-100 hover:text-white' : 'text-leather-900 hover:text-leather-600';
  const iconColorClass = isHomeHero ? 'text-leather-100 hover:text-white' : 'text-leather-800 hover:text-leather-500';
  const logoColorClass = isHomeHero ? 'text-leather-100' : 'text-leather-900';

  const handleNavClick = (e: React.MouseEvent, target: string, isAnchor: boolean = false) => {
    setIsMenuOpen(false);
    if (isAnchor) {
      e.preventDefault();
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
         document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === '/' && location.pathname === '/') {
       e.preventDefault();
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const NavLink = ({ label, to, isAnchor = false }: { label: string, to: string, isAnchor?: boolean }) => {
    const isActive = !isAnchor && location.pathname === to;
    return (
      <Link
        to={to}
        onClick={(e) => handleNavClick(e, to, isAnchor)}
        className={`font-serif font-medium tracking-wide transition-all duration-300 relative group ${textColorClass}`}
      >
        {label}
        <span className={`absolute -bottom-1 left-0 h-0.5 bg-leather-600 transition-all duration-300 group-hover:w-full ${isActive ? 'w-full' : 'w-0'}`}></span>
      </Link>
    );
  };

  const mobileLinks = [
    { label: 'Inicio', to: '/' },
    { label: 'Tienda', to: '/catalogo' },
    { label: 'Mariela', to: '/nosotros' },
    { label: 'Historia', to: '/historia' },
    { label: 'Descubre', to: '/blog' },
    { label: 'Ferias', to: '/ferias' },
  ];

  return (
    <>
    <ScrollToTop />
    <TopBar />
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'top-0 bg-leather-50/95 backdrop-blur-md shadow-md py-2' : 'top-0 sm:top-8 bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" onClick={(e) => handleNavClick(e, '/', false)} className={`font-serif text-2xl tracking-wider font-bold z-50 cursor-pointer ${logoColorClass}`}>
            MARIEL'LA
          </Link>
          <div className={`hidden md:flex items-center space-x-8 ${!scrolled && location.pathname === '/' ? 'px-8 py-3 rounded-full backdrop-blur-[2px]' : ''}`}>
            <NavLink label="Inicio" to="/" />
            <NavLink label="Tienda" to="/catalogo" />
            <NavLink label="Mariela" to="/nosotros" />
            <NavLink label="Descubre" to="/blog" />
            <NavLink label="Ferias" to="/ferias" />
            <NavLink label="Contacto" to="#contacto" isAnchor={true} />
          </div>
          <div className="flex items-center space-x-4 z-50">
            <button onClick={toggleCart} className={`relative p-2 transition-colors rounded-full hover:bg-white/20 ${iconColorClass}`} aria-label={`Abrir carrito (${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'})`}>
              <ShoppingBag size={22} />
              {itemCount > 0 && (
                <span key={itemCount} className="animate-cart-bounce absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-leather-600 rounded-full shadow-sm">
                  {itemCount}
                </span>
              )}
            </button>
            <Link to={isAdmin ? "/admin" : "/login"} className={`p-2 rounded-full hover:bg-white/20 transition-colors ${iconColorClass}`} aria-label="Panel de administración">
              <Settings size={20} />
            </Link>
            <button className={`md:hidden p-2 rounded-full ${iconColorClass}`} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-expanded={isMenuOpen} aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 h-screen bg-leather-50 flex flex-col items-center justify-center space-y-7 z-40 animate-fade-in-up">
            {mobileLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setIsMenuOpen(false)} className="text-leather-900 font-bold text-xl font-serif">{l.label}</Link>
            ))}
            <a href="#contacto" onClick={(e) => handleNavClick(e, '#contacto', true)} className="text-leather-900 font-bold text-xl font-serif">Contacto</a>
            <div className="flex gap-4 pt-4">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-11 h-11 rounded-full bg-leather-900 flex items-center justify-center"><Instagram size={20} className="text-leather-100" /></a>
              <a href={waLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center"><MessageCircle size={20} className="text-white fill-white" /></a>
            </div>
        </div>
      )}
    </nav>
    </>
  );
};

// --- Home Sections ---

const HeroSection = () => {
  const { settings } = useStore();
  return (
  <section id="inicio" className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-leather-900">
    <div className="absolute inset-0 z-0">
      <img src="/fotos/hero-cuero.jpg" alt="Textura cuero" fetchPriority="high" className="absolute inset-0 w-full h-full object-cover blur-[2px]" onError={handleImgError} />
      <div className="absolute inset-0 bg-leather-900/40 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-leather-900/80 to-transparent z-10" />
      <div className="absolute inset-0 z-20 opacity-10 mix-blend-overlay" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'}} />
    </div>
    <div className="relative z-30 text-center px-4 max-w-4xl mx-auto">
      <span className="block text-leather-100 text-sm md:text-base tracking-[0.3em] uppercase mb-10 font-bold animate-fade-in-up drop-shadow-md text-shadow-sm">{settings.heroEyebrow}</span>
      <div className="inline-block relative p-8 md:p-12 mb-10 animate-zoom-fade-in leather-patch rounded-lg transform rotate-1">
        <div className="absolute inset-2 stitch-border rounded-md pointer-events-none"></div>
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-[rgb(var(--dot))] border border-[rgb(var(--dot-border))] shadow-sm z-20"></div>
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[rgb(var(--dot))] border border-[rgb(var(--dot-border))] shadow-sm z-20"></div>
        <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-[rgb(var(--dot))] border border-[rgb(var(--dot-border))] shadow-sm z-20"></div>
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[rgb(var(--dot))] border border-[rgb(var(--dot-border))] shadow-sm z-20"></div>
        <h1 className="text-stitch text-5xl md:text-7xl lg:text-9xl font-serif font-bold leading-none tracking-tight relative z-10">MARIEL'LA</h1>
      </div>
      <p className="text-lg md:text-2xl text-leather-50 mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up delay-200 drop-shadow-md font-sans text-shadow-sm">
        {settings.heroLine1} {settings.heroLine2 && <><br/> {settings.heroLine2}</>}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
        <Link to="/catalogo" className="bg-leather-100 text-leather-900 px-8 py-3 rounded-full font-bold hover:bg-white transition-all shadow-lg hover:shadow-xl hover:scale-105 border border-leather-400">{settings.heroCta}</Link>
      </div>
    </div>
  </section>
  );
};

// --- Cómo Comprar (nuevo) ---
const HowToBuySection = () => {
  const steps = [
    { icon: <Search size={26} />, title: '1. Elegí tu pieza', desc: 'Recorré la tienda online o vení a vernos a una feria. Cada pieza es única: la que te enamora, es tuya.' },
    { icon: <MessageCircle size={26} />, title: '2. Escribinos por WhatsApp', desc: 'El pedido se confirma por WhatsApp. Coordinamos pago (transferencia, giro o efectivo) directo con Mariela.' },
    { icon: <Truck size={26} />, title: '3. Recibila donde estés', desc: 'Hacemos envíos por agencia a todo Uruguay. También podés retirarla en Piriápolis o en la próxima feria.' },
  ];
  return (
    <section id="como-comprar" className="py-24 bg-leather-900 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none"></div>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <Reveal>
          <div className="text-center mb-16">
            <span className="text-leather-300 uppercase tracking-widest text-xs font-bold">Simple y directo</span>
            <h2 className="text-4xl font-serif font-bold text-leather-50 mt-2">¿Cómo comprar?</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 150}>
              <div className="bg-leather-800/60 border border-leather-700 rounded-2xl p-8 text-center h-full backdrop-blur-sm hover:bg-leather-800 transition-colors">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-leather-100 text-leather-900 flex items-center justify-center shadow-lg">{step.icon}</div>
                <h3 className="text-xl font-serif font-bold text-leather-50 mb-3">{step.title}</h3>
                <p className="text-leather-200 text-sm leading-relaxed font-medium">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={300}>
          <div className="text-center mt-12">
            <a href={waLink('¡Hola MARIEL\'LA! Quiero hacer una consulta sobre una pieza 😊')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-3 rounded-full font-bold hover:bg-[#20bd5a] transition-all shadow-lg hover:scale-105">
              <MessageCircle size={20} className="fill-white" /> Escribinos ahora
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const DiscoverSection = () => {
  const { blogPosts, loading } = useStore();
  const featuredPosts = blogPosts.slice(0, 3);

  return (
    <section className="py-24 bg-leather-50 border-t border-leather-200">
      <div className="max-w-7xl mx-auto px-4">
        <Reveal>
          <div className="text-center mb-16">
            <span className="text-leather-600 uppercase tracking-widest text-xs font-bold">Blog & Novedades</span>
            <h2 className="text-4xl font-serif font-bold text-leather-900 mt-2">Descubre el Mundo del Cuero</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {loading ? (
            <>
              <BlogCardSkeleton /><BlogCardSkeleton /><BlogCardSkeleton />
            </>
          ) : featuredPosts.map((post, i) => (
            <Reveal key={post.id} delay={i * 100}>
              <Link to={`/blog/${post.id}`} className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all h-full border border-leather-100">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={imgSrc1(post.imageUrl, 600)} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onError={handleImgError} />
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 text-xs text-leather-500 mb-3 font-bold uppercase tracking-wider">
                    <span>{post.date}</span> • <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-leather-900 mb-3 leading-tight group-hover:text-leather-600 transition-colors">{post.title}</h3>
                  <p className="text-leather-600 text-sm line-clamp-3 mb-6 leading-relaxed">{post.excerpt}</p>
                  <span className="inline-flex items-center text-sm font-bold text-leather-800 border-b-2 border-leather-200 group-hover:border-leather-600 transition-all">Leer artículo <ArrowRight size={14} className="ml-1" /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- About Mariela Section ---
const AboutMariela = () => (
    <section className="py-24 bg-white border-t border-leather-100 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <Reveal>
          <div className="text-center mb-16">
            <span className="text-leather-600 uppercase tracking-widest text-xs font-bold">La Artesana</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-leather-900 mt-2">Conoce a Mariela</h2>
          </div>
        </Reveal>

        {/* Main Story - Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          {/* Left: Photo Collage */}
          <Reveal>
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-leather-100">
                <img src="/fotos/familia/pablo-calistro-con-hijas.jpg" alt="Pablo Calistro con sus hijas" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" onError={handleImgError} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-leather-100">
                  <img src="/fotos/familia/pablo-y-esposa-retrato.jpg" alt="Pablo Calistro y Maris Ferreira" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" onError={handleImgError} />
                </div>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-leather-100">
                  <img src="/fotos/familia/familia-grupo-jardin.jpg" alt="Familia Calistro Ferreira" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" onError={handleImgError} />
                </div>
              </div>
              <p className="text-center text-xs text-leather-400 italic mt-2">La familia Calistro Ferreira: tradición artesanal de generaciones</p>
            </div>
          </Reveal>

          {/* Right: Story */}
          <Reveal delay={200}>
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-leather-50 px-4 py-2 rounded-full border border-leather-100 self-start mb-6">
                <Heart size={16} className="text-red-500 fill-current" />
                <span className="text-leather-700 text-sm font-bold">Mariela Calistro Ferreira</span>
              </div>

              <h3 className="text-3xl font-serif font-bold text-leather-900 mb-6 leading-tight">Una vida entre telas, cuero y creatividad</h3>

              <div className="space-y-4 text-leather-700 leading-relaxed font-medium">
                <p>Mariela creció en Montevideo rodeada de agujas, hilos y el aroma del cuero. Su padre, <strong>Pablo Calistro</strong>, fundador de la tapicería <strong>TAPIPOCITOS</strong>, y su madre <strong>Maris Ferreira</strong>, costurera de toda la vida, le enseñaron que crear con las manos es mucho más que un oficio: es una forma de vivir.</p>

                <p>Desde chica aprendió a mirar las texturas, a sentir la diferencia entre un cuero genuino y una imitación, a respetar cada material. Esa herencia familiar se convirtió en su pasión: <strong>diseñar piezas únicas</strong> que cuenten una historia.</p>

                <p>Hoy Mariela trabaja desde Piriápolis, acompañada de sus fieles máquinas de coser, junto a <strong>Johnny</strong>, su compañero de vida, y <strong>Brian</strong>, su hijo. Cada cartera, cada bolso, cada accesorio que sale de sus manos es <strong>irrepetible</strong> — no existen dos piezas exactamente iguales.</p>
              </div>

              <div className="mt-8 p-6 bg-leather-50 rounded-xl border border-leather-100">
                <p className="text-leather-800 font-serif italic text-lg leading-relaxed">"Me encanta crear, diseñar, inventar. Cada pieza que hago lleva un pedazo de mi historia y la de mi familia."</p>
                <p className="text-leather-600 font-bold mt-3 text-sm">— Mariela Calistro</p>
              </div>

              <Link to="/historia" className="inline-flex items-center gap-2 mt-8 text-leather-800 font-bold hover:text-leather-600 transition-colors self-start border-b-2 border-leather-200 hover:border-leather-600 pb-0.5">
                Conocé nuestra trayectoria completa <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Values Strip */}
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Hammer size={24} />, title: 'Hecho a Mano', desc: 'Cada pieza es artesanal, sin producción en serie' },
              { icon: <Heart size={24} />, title: 'Piezas Únicas', desc: 'No existen dos productos exactamente iguales' },
              { icon: <ScrollText size={24} />, title: 'Herencia Familiar', desc: 'Tradición artesanal de generaciones' },
              { icon: <Truck size={24} />, title: 'Envíos a Todo el País', desc: 'Desde Piriápolis a donde estés' },
            ].map((val, i) => (
              <div key={i} className="text-center p-6 bg-leather-50 rounded-xl border border-leather-100 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-leather-900 text-leather-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-leather-700 transition-colors">{val.icon}</div>
                <h4 className="font-bold text-leather-900 mb-2">{val.title}</h4>
                <p className="text-leather-600 text-sm font-medium">{val.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
);

// --- About Page Wrapper ---
const AboutPage = () => {
  usePageMeta("Conoce a Mariela - MARIEL'LA", 'La historia de Mariela Calistro: una vida entre telas, cuero y creatividad. Artesanía uruguaya con herencia familiar.');
  return (
    <div className="pt-24 animate-fade-in-up">
      <AboutMariela />
    </div>
  );
};

// --- Instagram CTA (nuevo) ---
const InstagramCTA = () => (
  <section className="py-16 bg-white border-t border-leather-100">
    <div className="max-w-4xl mx-auto px-4">
      <Reveal>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl p-[3px] bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 shadow-lg hover:shadow-2xl transition-all hover:scale-[1.01]"
        >
          <div className="bg-white rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Instagram size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-leather-900">Seguinos en Instagram</h3>
                <p className="text-leather-600 font-medium">Nuevas piezas, ferias y el detrás de escena del taller</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 bg-leather-900 text-white px-6 py-3 rounded-full font-bold group-hover:bg-leather-800 transition whitespace-nowrap">
              @mariellacalistro <ArrowRight size={16} />
            </span>
          </div>
        </a>
      </Reveal>
    </div>
  </section>
);

const HomePage = () => {
  usePageMeta("MARIEL'LA | Artesanía en Cuero Uruguaya", 'Artesanía en cuero genuino hecha a mano en Uruguay. Carteras, bolsos, billeteras y accesorios únicos con identidad uruguaya. Envíos a todo el país.');
  return (
    <div className="animate-fade-in-up">
      <HeroSection />
      <MarqueeStrip />
      <Reveal><FeaturedCarousel /></Reveal>
      <HowToBuySection />
      <AboutMariela />
      <DiscoverSection />
      <Reveal><FairsTeaser /></Reveal>
      <InstagramCTA />
      <Reveal><ContactSection /></Reveal>
    </div>
  );
};

// --- Sections Components ---

const FeaturedCarousel = () => {
  const { products, currency, convertPrice, loading } = useStore();
  const available = products.filter(p => !p.isSoldOut);
  const displayProducts = available.filter(p => p.isFeatured).concat(available.filter(p => !p.isFeatured)).slice(0, 6);
  const [startIndex, setStartIndex] = useState(0);

  const maxStart = Math.max(0, displayProducts.length - 3);
  useEffect(() => {
    if (startIndex > maxStart) setStartIndex(0);
  }, [maxStart, startIndex]);

  const nextSlide = () => setStartIndex(prev => (prev + 1) % (maxStart + 1));
  const prevSlide = () => setStartIndex(prev => (prev - 1 + maxStart + 1) % (maxStart + 1));
  const visibleProducts = displayProducts.slice(startIndex, startIndex + 3);

  return (
    <section id="coleccion" className="py-24 border-t border-leather-100 scroll-mt-20 relative bg-[rgb(var(--paper))]">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
           <span className="text-leather-600 uppercase tracking-widest text-xs font-bold">Hecho a Mano</span>
           <h2 className="text-4xl font-serif font-bold text-leather-900 mt-2">Colección de Temporada</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProductCardSkeleton tall /><div className="hidden md:block"><ProductCardSkeleton tall /></div><div className="hidden md:block"><ProductCardSkeleton tall /></div>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-leather-200">
            <Sparkles size={40} className="mx-auto text-leather-300 mb-4" />
            <p className="text-leather-600 font-medium text-lg mb-2">Estamos preparando nuevas piezas</p>
            <p className="text-leather-400 text-sm">Seguinos en Instagram para enterarte primero</p>
          </div>
        ) : (
        <>
        <div className="hidden md:block relative">
           <div className="grid grid-cols-3 gap-8">
             {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} showBadge={false} />
             ))}
           </div>
           {displayProducts.length > 3 && (
             <>
               <button onClick={prevSlide} className="absolute top-1/2 -left-5 -translate-y-1/2 bg-white text-leather-900 p-3 rounded-full shadow-lg hover:bg-leather-100 border border-leather-100 transition-all z-10" aria-label="Anterior"><ChevronLeft size={24} /></button>
               <button onClick={nextSlide} className="absolute top-1/2 -right-5 -translate-y-1/2 bg-white text-leather-900 p-3 rounded-full shadow-lg hover:bg-leather-100 border border-leather-100 transition-all z-10" aria-label="Siguiente"><ChevronRight size={24} /></button>
             </>
           )}
        </div>
        <div className="md:hidden grid grid-cols-2 gap-x-4 gap-y-8">
           {displayProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} showBadge={false} />
           ))}
        </div>
        </>
        )}
        <div className="text-center mt-12">
          <Link to="/catalogo" className="bg-leather-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-leather-800 transition shadow-lg">Ver Todo el Catálogo</Link>
        </div>
      </div>
    </section>
  );
};

const FairsTeaser = () => {
  const { fairs } = useStore();
  const upcoming = fairs.filter(f => f.status === 'upcoming').sort((a,b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()).slice(0, 2);

  return (
    <section id="ferias" className="py-24 bg-leather-50 border-t border-leather-200 scroll-mt-20 relative">
       <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle,rgba(103,51,30,0.04)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none"></div>
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <span className="text-leather-600 uppercase tracking-widest text-xs font-bold">Encuentros</span>
        <h2 className="text-4xl font-serif font-bold text-leather-900 mt-2 mb-12">Próximas Ferias</h2>
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
            {upcoming.map(fair => (
              <div key={fair.id} className="bg-white rounded-xl p-8 border border-leather-100 flex flex-col items-start hover:shadow-lg transition-shadow">
                <div className="bg-leather-50 px-4 py-2 rounded-lg border border-leather-200 mb-4 text-center">
                   <span className="block text-2xl font-bold text-leather-900 leading-none">{parseLocalDate(fair.date).getDate()}</span>
                   <span className="block text-xs font-bold text-leather-500 uppercase">{parseLocalDate(fair.date).toLocaleString('es-UY', { month: 'short' })}</span>
                </div>
                <h3 className="text-2xl font-bold text-leather-900 mb-2">{fair.name}</h3>
                <p className="text-leather-600 mb-4 flex items-center gap-2 font-medium"><MapPin size={18} /> {fair.city}</p>
                <p className="text-sm text-leather-700 line-clamp-2 mb-6 font-medium">{fair.description}</p>
                <Link to="/ferias" className="text-leather-800 font-bold border-b border-leather-800 pb-0.5 hover:text-leather-600 hover:border-leather-600 transition-colors">Ver detalles</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-dashed border-leather-200 mb-12 shadow-sm"><p className="text-leather-500 italic">No tenemos fechas confirmadas por el momento. ¡Pronto más novedades!</p></div>
        )}
        <Link to="/ferias" className="inline-flex items-center gap-2 text-leather-600 hover:text-leather-900 font-bold transition-colors">Ver calendario completo <ArrowRight size={18} /></Link>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const { settings } = useStore();
  return (
  <section id="contacto" className="py-24 bg-leather-100 scroll-mt-20">
    <div className="max-w-5xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-leather-200">
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-leather-900 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-serif font-bold mb-6">Hablemos</h2>
            <p className="text-leather-200 mb-8 leading-relaxed font-medium">{settings.contactText}</p>
            <div className="space-y-6">
              <a href={waLink('¡Hola MARIEL\'LA! Quiero hacerles una consulta 😊')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group cursor-pointer hover:bg-leather-800 p-2 -ml-2 rounded-lg transition-colors">
                 <div className="bg-[#25D366] p-1 rounded-full"><MessageCircle size={18} className="text-white fill-white" /></div>
                 <span className="font-bold text-lg text-white">+598 98 766 318</span>
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group cursor-pointer hover:bg-leather-800 p-2 -ml-2 rounded-lg transition-colors">
                 <div className="bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-1 rounded-full"><Instagram size={18} className="text-white" /></div>
                 <span className="font-bold text-lg text-white">@mariellacalistro</span>
              </a>
              <div className="flex items-center gap-4 p-2 -ml-2">
                 <div className="bg-leather-700 p-1 rounded-full"><MapPin size={18} className="text-white" /></div>
                 <span className="font-medium text-leather-200">Piriápolis, Maldonado — Uruguay</span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px]"></div>
        </div>
        <div className="md:w-1/2 bg-leather-50 relative min-h-[400px] flex items-center justify-center p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
          {/* Circular Image Container for the Artisan */}
          <div className="relative w-64 h-64 rounded-full border-[6px] border-white shadow-2xl overflow-hidden z-10 ring-4 ring-leather-200/50">
             <img src="/fotos/familia/familia-celebracion-fiesta.jpg" alt="Familia Calistro celebrando" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" loading="lazy" onError={handleImgError} />
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 opacity-20"><Hammer size={120} className="text-leather-300" /></div>
        </div>
      </div>
    </div>
  </section>
  );
};

const BlogPage = () => {
  const { blogPosts, loading } = useStore();
  const { id: urlPostId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const post = urlPostId ? blogPosts.find(p => p.id === urlPostId) : undefined;

  usePageMeta(
    post ? `${post.title} - MARIEL'LA` : "Blog - MARIEL'LA",
    post ? post.excerpt : 'Historias del taller: el mundo del cuero uruguayo, consejos de cuidado y novedades de MARIEL\'LA.'
  );

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copiado 📋', 'info');
      }
    } catch { /* usuario canceló */ }
  };

  if (urlPostId) {
    if (!post) {
      if (loading) {
        return (
          <div className="bg-white min-h-screen pt-32 pb-24">
            <div className="max-w-3xl mx-auto px-6 space-y-6">
              <div className="h-4 w-40 skeleton rounded" />
              <div className="h-12 w-full skeleton rounded" />
              <div className="aspect-video w-full skeleton rounded-xl" />
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-5/6 skeleton rounded" />
            </div>
          </div>
        );
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-leather-50 pt-20">
          <div className="text-center px-4">
            <ScrollText size={48} className="mx-auto text-leather-200 mb-4" />
            <h2 className="text-2xl font-serif font-bold text-leather-900 mb-2">Artículo no encontrado</h2>
            <p className="text-leather-500 mb-6">Este artículo ya no está disponible.</p>
            <Link to="/blog" className="bg-leather-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-leather-800 transition">Ver el blog</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white min-h-screen pt-32 pb-24 animate-fade-in-up">
        <div className="max-w-3xl mx-auto px-6">
          <button onClick={() => navigate('/blog')} className="flex items-center text-leather-600 font-bold mb-8 hover:underline"><ChevronLeft size={20}/> Volver</button>
          <span className="text-leather-600 font-bold uppercase text-xs tracking-wider mb-2 block">{post.date} • {post.readTime}</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-leather-900 mb-8 leading-tight">{post.title}</h1>
          <div className="aspect-video w-full rounded-xl overflow-hidden mb-10 shadow-lg border border-leather-200">
            <img src={imgSrc1(post.imageUrl, 1200)} alt={post.title} className="w-full h-full object-cover" onError={handleImgError} />
          </div>
          <div className="prose prose-lg prose-stone mx-auto text-leather-800 leading-relaxed font-serif">
             <p className="font-bold text-xl mb-6 text-leather-900">{post.excerpt}</p>
             {post.content.split('\n').filter(p => p.trim()).map((p, i) => <p key={i} className="mb-6">{p}</p>)}
          </div>
          <div className="mt-12 pt-8 border-t border-leather-200 flex items-center justify-between">
            <span className="font-bold text-leather-900">Escrito por {post.author}</span>
            <button onClick={handleShare} className="flex items-center gap-2 text-leather-600 hover:text-leather-900 font-bold transition-colors" aria-label="Compartir artículo">
              <Share2 size={18} /> Compartir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-leather-50 min-h-screen pt-36 pb-24 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
           <span className="text-leather-600 uppercase tracking-widest text-xs font-bold">Blog</span>
           <h1 className="text-4xl font-serif font-bold text-leather-900 mt-2">Historias del Taller</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            <><BlogCardSkeleton /><BlogCardSkeleton /><BlogCardSkeleton /></>
          ) : blogPosts.map((post) => (
             <Link key={post.id} to={`/blog/${post.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all h-full border border-leather-100 flex flex-col">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={imgSrc1(post.imageUrl, 600)} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onError={handleImgError} />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-leather-500 mb-3 font-bold uppercase tracking-wider">
                    <span>{post.date}</span> • <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-leather-900 mb-3 leading-tight group-hover:text-leather-600 transition-colors">{post.title}</h3>
                  <p className="text-leather-700 text-sm line-clamp-3 mb-6 leading-relaxed flex-1 font-medium">{post.excerpt}</p>
                  <span className="inline-flex items-center text-sm font-bold text-leather-800 border-b-2 border-leather-200 group-hover:border-leather-600 transition-all self-start">Leer artículo <ArrowRight size={14} className="ml-1" /></span>
                </div>
             </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const { products, addToCart, currency, convertPrice, loading } = useStore();
  const { showToast } = useToast();
  const [selectedImg, setSelectedImg] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const product = products.find(p => p.id === id);

  usePageMeta(
    product ? `${product.name} - MARIEL'LA` : "Producto - MARIEL'LA",
    product ? product.description.slice(0, 155) : undefined
  );

  // Al cambiar de producto, volver a la primera foto
  useEffect(() => { setSelectedImg(0); }, [id]);

  // Lightbox: teclado (Esc, flechas) y bloqueo de scroll
  useEffect(() => {
    if (!isLightboxOpen || !product) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setSelectedImg(prev => (prev + 1) % product.images.length);
      if (e.key === 'ArrowLeft') setSelectedImg(prev => (prev - 1 + product.images.length) % product.images.length);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen, product]);

  if (!product) {
    if (loading) {
      return (
        <div className="bg-white min-h-screen pt-36 pb-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="aspect-square skeleton rounded-2xl" />
            <div className="space-y-4 py-8">
              <div className="h-4 w-24 skeleton rounded" />
              <div className="h-12 w-3/4 skeleton rounded" />
              <div className="h-8 w-32 skeleton rounded" />
              <div className="h-24 w-full skeleton rounded" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-leather-50 pt-20">
        <div className="text-center px-4">
          <ShoppingBag size={48} className="mx-auto text-leather-200 mb-4" />
          <h2 className="text-2xl font-serif font-bold text-leather-900 mb-2">Producto no encontrado</h2>
          <p className="text-leather-500 mb-6">Este producto ya no está disponible o fue removido.</p>
          <Link to="/catalogo" className="bg-leather-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-leather-800 transition">Ver catálogo</Link>
        </div>
      </div>
    );
  }

  const highResImageUrl = imgSrc(product.images, 2400, selectedImg);
  const hasMultipleImages = product.images.length > 1;

  // Related Products Logic
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id && !p.isSoldOut)
    .slice(0, 3);

  const productUrl = `${window.location.origin}/producto/${product.id}`;
  const consultUrl = waLink(`¡Hola MARIEL'LA! Me interesa esta pieza: ${product.name} — ${productUrl}`);
  const encargoUrl = waLink(`¡Hola MARIEL'LA! Vi que "${product.name}" está agotada. ¿Podrían hacerme una pieza similar por encargue? — ${productUrl}`);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: productUrl });
      } else {
        await navigator.clipboard.writeText(productUrl);
        showToast('Link copiado 📋', 'info');
      }
    } catch { /* usuario canceló */ }
  };

  return (
    <>
      <div className="bg-white min-h-screen pt-32 pb-28 lg:pb-16 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4">
          {/* Miga de pan */}
          <nav className="mb-8 text-[13px] font-medium text-leather-400 flex items-center gap-2 flex-wrap" aria-label="Ruta de navegación">
            <Link to="/catalogo" className="hover:text-leather-700 transition-colors">Tienda</Link>
            <span aria-hidden="true">/</span>
            <span>{product.category}</span>
            <span aria-hidden="true">/</span>
            <span className="text-leather-700">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 mb-24 items-start">
            {/* Galería: fotos grandes en columna (desktop) / carrusel con snap (celular) */}
            <div>
              <div className="hidden lg:flex flex-col gap-5">
                {(product.images.length > 0 ? product.images : ['']).map((_, idx) => (
                  <button key={idx} onClick={() => { setSelectedImg(idx); setIsLightboxOpen(true); }} className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-leather-100/60 cursor-zoom-in group block w-full" aria-label={`Ampliar foto ${idx + 1} de ${product.name}`}>
                    <img src={imgSrc(product.images, 1200, idx)} alt={`${product.name} — foto ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading={idx === 0 ? 'eager' : 'lazy'} onError={handleImgError} />
                    <div className="absolute top-4 right-4 bg-white/85 backdrop-blur p-2 rounded-full text-leather-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><Maximize2 size={18} /></div>
                  </button>
                ))}
              </div>
              <div className="lg:hidden">
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                  {(product.images.length > 0 ? product.images : ['']).map((_, idx) => (
                    <button key={idx} onClick={() => { setSelectedImg(idx); setIsLightboxOpen(true); }} className="snap-center flex-shrink-0 w-[86%] relative aspect-[4/5] rounded-2xl overflow-hidden bg-leather-100/60" aria-label={`Ampliar foto ${idx + 1} de ${product.name}`}>
                      <img src={imgSrc(product.images, 1000, idx)} alt={`${product.name} — foto ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" loading={idx === 0 ? 'eager' : 'lazy'} onError={handleImgError} />
                    </button>
                  ))}
                </div>
                {hasMultipleImages && <p className="mt-3 text-center text-xs text-leather-400 font-medium">{product.images.length} fotos — deslizá para verlas, tocá para ampliar</p>}
              </div>
            </div>

            {/* Panel de información: acompaña el scroll en desktop */}
            <div className="lg:sticky lg:top-32">
              <div className="mb-6">
                 <div className="flex items-center justify-between gap-4 flex-wrap">
                   <div className="flex items-center gap-3 flex-wrap">
                     <span className="inline-flex items-center gap-1 bg-leather-50 border border-leather-200 text-leather-700 text-xs font-bold px-3 py-1 rounded-full"><Sparkles size={12} /> Pieza única hecha a mano</span>
                   </div>
                   <button onClick={handleShare} className="flex items-center gap-1 text-leather-400 hover:text-leather-700 transition-colors text-sm font-bold" aria-label="Compartir producto"><Share2 size={16} /> Compartir</button>
                 </div>
                 <h1 className="text-4xl xl:text-5xl font-serif font-bold text-leather-900 mt-3 mb-5 leading-[1.08] text-balance">{product.name}</h1>
                 <div className="flex items-center gap-4 flex-wrap">
                   <p className="text-3xl font-light text-leather-800 font-serif">{formatPrice(convertPrice(product.priceUYU), currency)}</p>
                   <CurrencyToggle />
                 </div>
              </div>
              <div className="text-leather-800 mb-8 leading-relaxed font-medium text-[15px]"><p>{product.description}</p></div>
              <div className="mb-8 border-y border-leather-100 divide-y divide-leather-100">
                {product.materials.length > 0 && (
                  <div className="flex gap-6 py-3.5">
                    <span className="w-24 flex-shrink-0 text-[11px] uppercase tracking-[0.14em] font-bold text-leather-500 pt-0.5">Materiales</span>
                    <span className="text-sm text-leather-800 font-medium">{product.materials.join(' · ')}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex gap-6 py-3.5">
                    <span className="w-24 flex-shrink-0 text-[11px] uppercase tracking-[0.14em] font-bold text-leather-500 pt-0.5">Medidas</span>
                    <span className="text-sm text-leather-800 font-medium">{product.dimensions}</span>
                  </div>
                )}
                {product.colors.length > 0 && (
                  <div className="flex gap-6 py-3.5">
                    <span className="w-24 flex-shrink-0 text-[11px] uppercase tracking-[0.14em] font-bold text-leather-500 pt-0.5">Colores</span>
                    <span className="text-sm text-leather-800 font-medium">{product.colors.join(', ')}</span>
                  </div>
                )}
              </div>
              {product.isSoldOut ? (
                <div className="space-y-4">
                  <div className="w-full bg-leather-50 text-leather-800 px-8 py-5 rounded-xl font-serif italic text-lg text-center border border-leather-200">Esta pieza ya encontró su dueño 💛</div>
                  <a href={encargoUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-leather-900 text-white px-8 py-5 rounded-xl font-bold text-lg hover:bg-leather-800 transition shadow-lg flex items-center justify-center gap-2">
                    <MessageCircle size={22} className="fill-white" /> Pedir una similar por encargue
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={() => addToCart(product)} className="w-full bg-leather-900 text-white px-8 py-5 rounded-xl font-bold text-lg hover:bg-leather-800 transition shadow-lg transform active:scale-[0.98] flex items-center justify-center gap-2">
                    <ShoppingBag size={22} /> Agregar al Carrito
                  </button>
                  <a href={consultUrl} target="_blank" rel="noopener noreferrer" className="w-full border-2 border-[#25D366] text-[#128C7E] px-8 py-4 rounded-xl font-bold hover:bg-[#25D366]/10 transition flex items-center justify-center gap-2">
                    <MessageCircle size={20} /> Consultar por WhatsApp
                  </a>
                </div>
              )}
              <div className="mt-8 flex items-center gap-x-5 gap-y-2 text-[12px] text-leather-500 font-medium flex-wrap">
                <span className="flex items-center gap-1.5"><Hammer size={13} /> Hecha a mano en Piriápolis</span>
                <span className="flex items-center gap-1.5"><Truck size={13} /> Envíos a todo el país</span>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-leather-100 pt-16">
              <h2 className="text-2xl font-serif font-bold text-leather-900 mb-8">También te podría gustar</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 sm:gap-x-8">
                {relatedProducts.map(rp => (
                  <ProductCard key={rp.id} product={rp} showBadge={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Barra de compra fija (solo celular) — fuera del contenedor animado
          para que position:fixed se ancle al viewport y no al transform */}
      {!product.isSoldOut && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-leather-100 px-4 pt-3 flex items-center gap-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <div className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-leather-900 truncate">{product.name}</span>
            <span className="text-leather-700 font-bold text-sm">{formatPrice(convertPrice(product.priceUYU), currency)}</span>
          </div>
          <button onClick={() => addToCart(product)} className="flex-shrink-0 bg-leather-900 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition"><ShoppingBag size={17} /> Agregar</button>
        </div>
      )}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)} role="dialog" aria-modal="true" aria-label={`Foto de ${product.name}`}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-10" aria-label="Cerrar"><X size={32} /></button>
          {hasMultipleImages && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setSelectedImg(prev => (prev - 1 + product.images.length) % product.images.length); }} className="absolute left-4 md:left-8 text-white/70 hover:text-white p-3 bg-white/10 rounded-full backdrop-blur-sm z-10" aria-label="Foto anterior"><ChevronLeft size={28} /></button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedImg(prev => (prev + 1) % product.images.length); }} className="absolute right-4 md:right-8 text-white/70 hover:text-white p-3 bg-white/10 rounded-full backdrop-blur-sm z-10" aria-label="Foto siguiente"><ChevronRight size={28} /></button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-bold bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm">{selectedImg + 1} / {product.images.length}</span>
            </>
          )}
          <img src={highResImageUrl} alt={product.name} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm cursor-default" onClick={(e) => e.stopPropagation()} onError={handleImgError} />
        </div>
      )}
    </>
  );
};

// --- Formulario de Producto (admin) ---
// Componente estable fuera del panel para no perder lo tipeado en re-renders.
const ProductForm = ({ initial, categories, exchangeRate, onSave, onCancel }: {
  initial: Partial<Product>;
  categories: string[];
  exchangeRate: number;
  onSave: (p: Product) => Promise<boolean>;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<Product>>(
    Object.keys(initial).length > 0 ? initial : { name: '', description: '', priceUYU: 0, priceUSD: 0, category: categories.find(c => c !== 'Todas') || 'Carteras', images: [''], materials: [], colors: [], dimensions: '', isFeatured: false, isSoldOut: false }
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const p = {
      ...formData,
      id: formData.id || Date.now().toString(),
      priceUSD: Math.round((formData.priceUYU || 0) / exchangeRate),
      materials: typeof formData.materials === 'string' ? (formData.materials as unknown as string).split('\n').filter(Boolean) : (formData.materials || []).filter(Boolean),
      colors: typeof formData.colors === 'string' ? (formData.colors as unknown as string).split('\n').filter(Boolean) : (formData.colors || []).filter(Boolean),
      images: Array.isArray(formData.images) ? formData.images.filter(i => i !== '') : []
    } as Product;
    const ok = await onSave(p);
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <div className="fixed inset-0 bg-leather-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto"><div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-sm sm:max-w-2xl w-full border border-leather-200 my-8 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-serif font-bold mb-6 text-leather-900">{formData.id ? 'Editar' : 'Nuevo'} Producto</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-leather-700 mb-1 block">Nombre *</label><input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div><label className="text-xs font-bold text-leather-700 mb-1 block">Categoría</label><select className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div><label className="text-xs font-bold text-leather-700 mb-1 block">Descripción</label><textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-leather-700 mb-1 block">Precio (UYU) *</label>
              <input type="number" min="0" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" value={formData.priceUYU} onChange={e => setFormData({...formData, priceUYU: Number(e.target.value)})} required />
              {formData.priceUYU ? <p className="text-xs text-leather-400 mt-1">≈ USD {Math.round((formData.priceUYU || 0) / exchangeRate)} (cotización del día)</p> : null}
            </div>
            <div><label className="text-xs font-bold text-leather-700 mb-1 block">Dimensiones</label><input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="ej: 35cm x 30cm x 12cm" value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-leather-700 mb-1 block">Materiales (uno por línea)</label><textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-16 text-sm" placeholder="Cuero genuino&#10;Herrajes metálicos" value={Array.isArray(formData.materials) ? formData.materials.join('\n') : formData.materials} onChange={e => setFormData({...formData, materials: e.target.value.split('\n') as any})} /></div>
            <div><label className="text-xs font-bold text-leather-700 mb-1 block">Colores (uno por línea)</label><textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-16 text-sm" placeholder="Marrón&#10;Negro" value={Array.isArray(formData.colors) ? formData.colors.join('\n') : formData.colors} onChange={e => setFormData({...formData, colors: e.target.value.split('\n') as any})} /></div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isFeatured || false} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="w-4 h-4 rounded border-leather-300 text-leather-600 focus:ring-leather-500" /><span className="text-sm font-bold text-leather-700">⭐ Destacado</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isSoldOut || false} onChange={e => setFormData({...formData, isSoldOut: e.target.checked})} className="w-4 h-4 rounded border-leather-300 text-red-600 focus:ring-red-500" /><span className="text-sm font-bold text-red-600">🚫 Agotado</span></label>
          </div>
          <div>
            <label className="text-xs font-bold text-leather-700 mb-1 block">Fotos del Producto</label>
            <label className={`flex items-center gap-2 cursor-pointer bg-leather-50 border-2 border-dashed border-leather-300 rounded-lg p-4 hover:border-leather-500 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={20} className="text-leather-500" />
              <span className="text-sm text-leather-600 font-medium">{uploading ? 'Subiendo...' : 'Tocá acá para elegir las fotos'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={async (e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                if (files.length === 0) return;
                const MAX_SIZE = 5 * 1024 * 1024;
                const invalid = files.find(f => f.size > MAX_SIZE);
                if (invalid) { alert(`"${invalid.name}" es muy grande. Máximo 5MB por imagen.`); return; }
                setUploading(true);
                try {
                  const urls = await Promise.all(files.map(f => StorageService.uploadImage(f, 'products')));
                  setFormData(prev => ({ ...prev, images: [...(prev.images || []).filter(i => i !== ''), ...urls] }));
                } catch (err) { console.error('Upload error:', err); alert('Error al subir imagen. Verificá tu conexión.'); }
                setUploading(false);
                e.target.value = '';
              }} />
            </label>
            {formData.images && formData.images.filter(i => i).length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {formData.images.filter(i => i).map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={processImageUrl(img, 100)} className="w-16 h-16 object-cover rounded border" alt={`Imagen ${idx + 1}`} />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: (prev.images || []).filter(i => i !== '').filter((_, i) => i !== idx) }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition" aria-label="Quitar imagen">×</button>
                  </div>
                ))}
              </div>
            )}
            <label className="text-xs text-leather-400 mt-2 block">O pega URLs directamente:</label>
            <textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-16 text-sm font-mono mt-1" value={Array.isArray(formData.images) ? formData.images.join('\n') : ''} onChange={e => setFormData({...formData, images: e.target.value.split('\n')})} />
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onCancel} className="px-6 py-2 text-leather-600 font-bold">Cancelar</button><button type="submit" disabled={uploading || saving} className="px-6 py-2 bg-leather-900 text-white rounded-lg font-bold disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button></div>
        </form>
    </div></div>
  );
};

// --- Panel de Administración ---
const AdminPanel = () => {
  const { products, fairs, history, blogPosts, categories, exchangeRate, settings, updateSettings, logout, addProduct, updateProduct, deleteProduct, addFair, updateFair, deleteFair, addHistoryEvent, updateHistoryEvent, deleteHistoryEvent, addBlogPost, updateBlogPost, deleteBlogPost, addCategory, deleteCategory } = useStore();
  const [activeTab, setActiveTab] = useState<'products' | 'fairs' | 'history' | 'blog' | 'categories' | 'personalizar' | 'ayuda' | 'system'>('products');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingFair, setEditingFair] = useState<Partial<Fair> | null>(null);
  const [editingHistory, setEditingHistory] = useState<Partial<HistoryEvent> | null>(null);
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [copied, setCopied] = useState(false);
  const [heroDraft, setHeroDraft] = useState({ heroEyebrow: settings.heroEyebrow, heroLine1: settings.heroLine1, heroLine2: settings.heroLine2, heroCta: settings.heroCta, topbarLeft: settings.topbarLeft, topbarRight: settings.topbarRight, contactText: settings.contactText, footerTagline: settings.footerTagline });
  const [savingHero, setSavingHero] = useState(false);
  const navigate = useNavigate();

  // Cuando llegan los settings de la nube, refrescar el borrador de textos
  useEffect(() => {
    setHeroDraft({ heroEyebrow: settings.heroEyebrow, heroLine1: settings.heroLine1, heroLine2: settings.heroLine2, heroCta: settings.heroCta, topbarLeft: settings.topbarLeft, topbarRight: settings.topbarRight, contactText: settings.contactText, footerTagline: settings.footerTagline });
  }, [settings]);

  usePageMeta("Panel de Administración - MARIEL'LA");

  const handleLogout = () => { logout(); navigate('/'); };

  const copyToClipboard = () => {
    const data = `
import { Product, Fair, HistoryEvent, BlogPost } from './types';

export const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};
export const INITIAL_FAIRS: Fair[] = ${JSON.stringify(fairs, null, 2)};
export const INITIAL_HISTORY: HistoryEvent[] = ${JSON.stringify(history, null, 2)};
export const INITIAL_BLOG_POSTS: BlogPost[] = ${JSON.stringify(blogPosts, null, 2)};
export const INITIAL_CATEGORIES = ${JSON.stringify(categories, null, 2)};
    `;
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'products', label: 'Productos' },
    { key: 'categories', label: 'Categorías' },
    { key: 'fairs', label: 'Ferias' },
    { key: 'history', label: 'Historia' },
    { key: 'blog', label: 'Blog' },
    { key: 'personalizar', label: '🎨 Personalizar' },
    { key: 'ayuda', label: '❓ Ayuda' },
    { key: 'system', label: 'Sistema' },
  ];

  const HelpStep = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-leather-900 text-white flex items-center justify-center font-bold flex-shrink-0">{n}</div>
      <div>
        <h4 className="font-bold text-leather-900 mb-1">{title}</h4>
        <div className="text-leather-700 text-sm leading-relaxed font-medium">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-leather-50 pt-36 pb-12 animate-fade-in-up relative">
      {/* Textura de la marca para que el fondo no quede pelado */}
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle,rgba(103,51,30,0.05)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex justify-between items-start mb-10 bg-white p-6 rounded-xl shadow-sm border border-leather-100 gap-4 flex-wrap relative overflow-hidden">
          <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-leather-50 opacity-70 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-serif font-bold text-leather-900">Panel de Administración</h1>
            <p className="text-sm text-leather-500 font-medium mt-1">Hola Mariela 👋 Todo lo que cambies acá se publica al instante.</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-leather-50 border border-leather-100 text-leather-700 text-xs font-bold px-3 py-1.5 rounded-full"><Package size={13} /> {products.length} {products.length === 1 ? 'pieza' : 'piezas'}</span>
              <span className="inline-flex items-center gap-1.5 bg-leather-50 border border-leather-100 text-leather-700 text-xs font-bold px-3 py-1.5 rounded-full"><Star size={13} className="fill-amber-400 text-amber-400" /> {products.filter(p => p.isFeatured).length} destacadas</span>
              <span className="inline-flex items-center gap-1.5 bg-leather-50 border border-leather-100 text-leather-700 text-xs font-bold px-3 py-1.5 rounded-full"><CheckCircle size={13} /> {products.filter(p => p.isSoldOut).length} vendidas</span>
              <span className="inline-flex items-center gap-1.5 bg-leather-50 border border-leather-100 text-leather-700 text-xs font-bold px-3 py-1.5 rounded-full"><Calendar size={13} /> {fairs.filter(f => f.status === 'upcoming').length} {fairs.filter(f => f.status === 'upcoming').length === 1 ? 'feria próxima' : 'ferias próximas'}</span>
              <span className="inline-flex items-center gap-1.5 bg-leather-50 border border-leather-100 text-leather-700 text-xs font-bold px-3 py-1.5 rounded-full"><ScrollText size={13} /> {blogPosts.length} posts</span>
            </div>
          </div>
          <button onClick={handleLogout} className="relative z-10 flex items-center gap-2 text-red-600 font-medium px-4 py-2 hover:bg-red-50 rounded-lg"><LogOut size={18} /> Salir</button>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-leather-200 min-h-[600px] overflow-hidden">
          <div className="border-b border-leather-200 px-8 py-5 flex gap-8 bg-leather-50/50 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`text-lg font-bold pb-1 border-b-2 whitespace-nowrap ${activeTab === tab.key ? 'border-leather-900 text-leather-900' : 'border-transparent text-leather-400'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-8">
            {activeTab === 'personalizar' && (
              <div className="animate-fade-in-up max-w-3xl space-y-10">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-leather-900 mb-2 flex items-center gap-2"><Palette size={24} /> Colores de la página</h2>
                  <p className="text-leather-600 text-sm font-medium mb-6">Elegí el tema y toda la página cambia de color al instante, para todos los visitantes. Probá tranquila: podés volver a cambiarlo cuando quieras.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => updateSettings({ ...settings, theme: theme.id })}
                        aria-pressed={settings.theme === theme.id}
                        className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${settings.theme === theme.id ? 'border-leather-900 bg-leather-50 shadow-md' : 'border-leather-100 bg-white hover:border-leather-300'}`}
                      >
                        <div className="flex gap-1.5 mb-3">
                          {theme.swatch.map((color, i) => (
                            <span key={i} className="w-7 h-7 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <span className="font-bold text-leather-900 text-sm flex items-center gap-1.5">
                          {theme.name}
                          {settings.theme === theme.id && <CheckCircle size={15} className="text-green-600" />}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-leather-100 pt-8">
                  <h2 className="text-2xl font-serif font-bold text-leather-900 mb-2">Textos de la portada</h2>
                  <p className="text-leather-600 text-sm font-medium mb-6">Estos son los textos que se ven en la pantalla principal, arriba de todo.</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (savingHero) return;
                    setSavingHero(true);
                    await updateSettings({
                      ...settings,
                      heroEyebrow: heroDraft.heroEyebrow.trim() || DEFAULT_SETTINGS.heroEyebrow,
                      heroLine1: heroDraft.heroLine1.trim() || DEFAULT_SETTINGS.heroLine1,
                      heroLine2: heroDraft.heroLine2.trim(),
                      heroCta: heroDraft.heroCta.trim() || DEFAULT_SETTINGS.heroCta,
                      topbarLeft: heroDraft.topbarLeft.trim() || DEFAULT_SETTINGS.topbarLeft,
                      topbarRight: heroDraft.topbarRight.trim() || DEFAULT_SETTINGS.topbarRight,
                      contactText: heroDraft.contactText.trim() || DEFAULT_SETTINGS.contactText,
                      footerTagline: heroDraft.footerTagline.trim() || DEFAULT_SETTINGS.footerTagline,
                    });
                    setSavingHero(false);
                  }} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-leather-700 mb-1 block">Texto chico de arriba</label>
                      <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" maxLength={60} value={heroDraft.heroEyebrow} onChange={e => setHeroDraft({ ...heroDraft, heroEyebrow: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-leather-700 mb-1 block">Frase principal (primera línea)</label>
                      <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" maxLength={90} value={heroDraft.heroLine1} onChange={e => setHeroDraft({ ...heroDraft, heroLine1: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-leather-700 mb-1 block">Frase principal (segunda línea — podés dejarla vacía)</label>
                      <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" maxLength={90} value={heroDraft.heroLine2} onChange={e => setHeroDraft({ ...heroDraft, heroLine2: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-leather-700 mb-1 block">Texto del botón</label>
                      <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" maxLength={35} value={heroDraft.heroCta} onChange={e => setHeroDraft({ ...heroDraft, heroCta: e.target.value })} />
                    </div>
                    {/* Vista previa simple de la portada */}
                    <div className="rounded-xl overflow-hidden border border-leather-200">
                      <div className="bg-leather-900 px-6 py-8 text-center">
                        <span className="block text-leather-100 text-[10px] tracking-[0.3em] uppercase mb-3 font-bold">{heroDraft.heroEyebrow || DEFAULT_SETTINGS.heroEyebrow}</span>
                        <div className="inline-block leather-patch rounded-md px-6 py-3 mb-3"><span className="text-stitch font-serif font-bold text-2xl">MARIEL'LA</span></div>
                        <p className="text-leather-50 text-sm font-light">{heroDraft.heroLine1 || DEFAULT_SETTINGS.heroLine1}{heroDraft.heroLine2 ? <><br/>{heroDraft.heroLine2}</> : null}</p>
                        <span className="inline-block mt-4 bg-leather-100 text-leather-900 px-5 py-1.5 rounded-full font-bold text-xs">{heroDraft.heroCta || DEFAULT_SETTINGS.heroCta}</span>
                      </div>
                      <p className="text-center text-[11px] text-leather-400 py-2 bg-leather-50">Vista previa — así se ve arriba de la portada</p>
                    </div>

                    <h3 className="text-lg font-serif font-bold text-leather-900 pt-4 border-t border-leather-100">Textos generales de la página</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-leather-700 mb-1 block">Barra de arriba — izquierda</label>
                        <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" maxLength={40} value={heroDraft.topbarLeft} onChange={e => setHeroDraft({ ...heroDraft, topbarLeft: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-leather-700 mb-1 block">Barra de arriba — derecha</label>
                        <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" maxLength={40} value={heroDraft.topbarRight} onChange={e => setHeroDraft({ ...heroDraft, topbarRight: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-leather-700 mb-1 block">Texto de "Hablemos" (sección de contacto)</label>
                      <textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-20" maxLength={220} value={heroDraft.contactText} onChange={e => setHeroDraft({ ...heroDraft, contactText: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-leather-700 mb-1 block">Frase del pie de página</label>
                      <textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-16" maxLength={180} value={heroDraft.footerTagline} onChange={e => setHeroDraft({ ...heroDraft, footerTagline: e.target.value })} />
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" disabled={savingHero} className="px-8 py-3 bg-leather-900 text-white rounded-lg font-bold hover:bg-leather-800 transition disabled:opacity-50">{savingHero ? 'Guardando...' : 'Guardar textos'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {activeTab === 'ayuda' && (
              <div className="animate-fade-in-up max-w-3xl space-y-8">
                <div className="bg-leather-50 p-6 rounded-xl border border-leather-200">
                  <h2 className="text-2xl font-serif font-bold text-leather-900 mb-2 flex items-center gap-2"><HelpCircle size={24} /> Guía rápida</h2>
                  <p className="text-leather-700 font-medium">Todo lo que hagas acá se guarda solo y se ve al instante en la página. No tengas miedo de tocar: siempre podés editar o borrar después.</p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold text-leather-900 border-b border-leather-100 pb-2">📦 Para vender una pieza nueva</h3>
                  <HelpStep n={1} title="Sacale buenas fotos">Con luz natural, sobre fondo claro. Podés sacar varias: de frente, de costado y del detalle que más te guste.</HelpStep>
                  <HelpStep n={2} title="Entrá a 'Productos' y tocá 'Nuevo Producto'">Poné el nombre, una descripción linda (contá qué la hace única), el precio en pesos y las medidas.</HelpStep>
                  <HelpStep n={3} title="Subí las fotos">Tocá "Tocá acá para elegir las fotos" y elegilas de la galería del celular. Podés elegir varias juntas.</HelpStep>
                  <HelpStep n={4} title="Guardá">Tocá "Guardar" y listo: ya está publicada en la tienda. El precio en dólares se calcula solo con la cotización del día.</HelpStep>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold text-leather-900 border-b border-leather-100 pb-2">✅ Cuando vendés una pieza</h3>
                  <p className="text-leather-700 text-sm font-medium">En la lista de productos, tocá el botón <span className="font-bold">"Agotado"</span> de esa pieza. Queda marcada como vendida en la tienda (no hace falta borrarla: así los clientes ven todo lo que hiciste y pueden pedir una similar por encargue).</p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold text-leather-900 border-b border-leather-100 pb-2">⭐ Piezas destacadas</h3>
                  <p className="text-leather-700 text-sm font-medium">Las piezas marcadas como <span className="font-bold">"Destacada"</span> aparecen primero en la portada y en el catálogo. Elegí tus 3 a 6 favoritas.</p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold text-leather-900 border-b border-leather-100 pb-2">📅 Ferias, 📖 Historia y ✍️ Blog</h3>
                  <p className="text-leather-700 text-sm font-medium"><span className="font-bold">Ferias:</span> cargá las próximas fechas en la pestaña Ferias (aparecen en la portada). Cuando pasan, editá y cambiá el estado a "Pasada".<br/><br/><span className="font-bold">Blog:</span> para contar novedades (una nota de radio, una feria linda, consejos de cuidado del cuero). Con título, un textito y una foto alcanza.<br/><br/><span className="font-bold">Historia:</span> los hitos que se ven en la página "Historia".</p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold text-leather-900 border-b border-leather-100 pb-2">🎨 Cambiar los colores y textos de la página</h3>
                  <p className="text-leather-700 text-sm font-medium">En la pestaña <span className="font-bold">Personalizar</span> podés elegir entre 6 combinaciones de colores (tocás una y la página entera cambia al instante) y editar los <span className="font-bold">textos de la portada</span> (con vista previa) y los <span className="font-bold">textos generales</span>: la barra de arriba, el texto de "Hablemos" y la frase del pie de página. Todo se puede volver a cambiar cuando quieras.</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl space-y-3">
                  <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2"><AlertCircle size={20}/> Si algo no funciona</h3>
                  <ul className="text-amber-900 text-sm space-y-2 font-medium list-disc pl-5">
                    <li>Fijate que el celular tenga internet.</li>
                    <li>Recargá la página y probá de nuevo.</li>
                    <li>Si aparece un cartel rojo al guardar, esperá un ratito y volvé a intentar.</li>
                    <li>Si nada funciona… llamá a Brian 😉</li>
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'system' && (
              <div className="animate-fade-in-up max-w-2xl">
                 <h2 className="text-2xl font-serif font-bold text-leather-900 mb-4">Estado del Sistema</h2>
                 <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
                   <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2"><CheckCircle size={20} className="text-green-600" /> Base de datos conectada</h3>
                   <p className="text-green-700 text-sm">Los datos se guardan automáticamente en la nube. Todos los cambios que hagas desde este panel son visibles inmediatamente para todos los visitantes de la web.</p>
                 </div>
                 <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
                   <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Info size={20} /> Cotización del día</h3>
                   <p className="text-blue-700 text-sm">1 USD = $U {exchangeRate.toFixed(2)}. Los precios en dólares de la tienda se calculan automáticamente con este valor.</p>
                 </div>
                 <div className="bg-leather-50 p-6 rounded-xl border border-leather-200">
                   <h3 className="font-bold text-leather-900 mb-3 flex items-center gap-2"><Database size={20}/> Exportar Datos (Backup)</h3>
                   <p className="text-sm text-leather-600 mb-4">Copia de seguridad de todos los datos actuales (para guardar en un archivo o mandarle a Brian).</p>
                   <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all ${copied ? 'bg-green-600' : 'bg-leather-900 hover:bg-leather-800'}`}>
                      {copied ? <><CheckCircle size={20}/> ¡Copiado!</> : <><Copy size={20}/> Copiar Backup JSON</>}
                   </button>
                 </div>
              </div>
            )}
            {activeTab === 'categories' && (
              <div className="animate-fade-in-up max-w-xl">
                <div className="flex gap-4 mb-8">
                  <input className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Nueva Categoría" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                  <button onClick={() => { const c = newCategory.trim(); if(c) { addCategory(c); setNewCategory(''); } }} className="bg-leather-900 text-white px-6 rounded-lg font-bold hover:bg-leather-800 transition">Agregar</button>
                </div>
                <div className="space-y-3">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between items-center p-4 bg-leather-50 rounded-lg border border-leather-100">
                      <span className="font-bold text-leather-900">{cat}</span>
                      {cat !== 'Todas' && <button onClick={() => { if(confirm(`¿Eliminar la categoría "${cat}"?`)) deleteCategory(cat); }} className="text-red-500 hover:bg-red-50 p-2 rounded" aria-label={`Eliminar ${cat}`}><Trash2 size={18}/></button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'products' && (
              <div className="animate-fade-in-up">
                <button onClick={() => setEditingProduct({})} className="mb-6 flex items-center gap-2 bg-leather-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-leather-800 transition"><Plus size={20} /> Nuevo Producto</button>
                <div className="grid gap-4">{products.map(p => (
                  <div key={p.id} className="flex justify-between items-center border border-leather-100 p-4 rounded-lg hover:shadow-md transition bg-white gap-4 flex-wrap">
                    <div className="flex gap-4 items-center min-w-0">
                      <img src={imgSrc(p.images, 100)} className="w-12 h-12 object-cover rounded flex-shrink-0" alt="" onError={handleImgError} />
                      <div className="min-w-0">
                        <span className="font-bold text-leather-900 block truncate">{p.name}</span>
                        <span className="text-xs text-leather-500">{p.category} · $U {p.priceUYU.toLocaleString('es-UY')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <button
                        onClick={() => updateProduct({ ...p, isFeatured: !p.isFeatured })}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${p.isFeatured ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-leather-200 text-leather-400 hover:border-amber-300 hover:text-amber-700'}`}
                        aria-pressed={p.isFeatured}
                      >⭐ {p.isFeatured ? 'Destacada' : 'Destacar'}</button>
                      <button
                        onClick={() => updateProduct({ ...p, isSoldOut: !p.isSoldOut })}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${p.isSoldOut ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-leather-200 text-leather-400 hover:border-red-300 hover:text-red-600'}`}
                        aria-pressed={p.isSoldOut}
                      >{p.isSoldOut ? '🚫 Agotada' : 'Marcar agotada'}</button>
                      <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" aria-label={`Editar ${p.name}`}><Edit size={18}/></button>
                      <button onClick={() => { if(confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) deleteProduct(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded" aria-label={`Eliminar ${p.name}`}><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}</div>
                {products.length === 0 && (
                  <div className="text-center py-12 text-leather-400 font-medium">
                    <Package size={40} className="mx-auto mb-3 text-leather-200" />
                    Todavía no hay productos. ¡Agregá el primero!
                  </div>
                )}
                {editingProduct && <ProductForm initial={editingProduct} categories={categories} exchangeRate={exchangeRate} onSave={(p) => editingProduct.id ? updateProduct(p) : addProduct(p)} onCancel={() => setEditingProduct(null)} />}
              </div>
            )}
            {activeTab === 'fairs' && (
              <div className="animate-fade-in-up">
                 <button onClick={() => setEditingFair({})} className="mb-6 flex items-center gap-2 bg-leather-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-leather-800 transition"><Plus size={20} /> Nueva Feria</button>
                 <div className="grid gap-4">{fairs.map(f => (
                   <div key={f.id} className="flex justify-between items-center border border-leather-100 p-4 rounded-lg hover:shadow-md transition bg-white gap-4">
                      <div>
                        <span className="font-bold text-leather-900 block">{f.name}</span>
                        <span className="text-sm text-leather-500">{f.date} — {f.city}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${f.status === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-leather-100 text-leather-500'}`}>{f.status === 'upcoming' ? 'Próxima' : 'Pasada'}</span>
                        <button onClick={() => setEditingFair(f)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" aria-label={`Editar ${f.name}`}><Edit size={18}/></button>
                        <button onClick={() => { if(confirm(`¿Eliminar la feria "${f.name}"?`)) deleteFair(f.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded" aria-label={`Eliminar ${f.name}`}><Trash2 size={18}/></button>
                      </div>
                   </div>
                 ))}</div>
                 {editingFair && (
                   <div className="fixed inset-0 bg-leather-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto"><div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-leather-200 my-8">
                     <h3 className="text-2xl font-serif font-bold mb-6 text-leather-900">{editingFair.id ? 'Editar' : 'Nueva'} Feria</h3>
                     <form onSubmit={async (e) => { e.preventDefault(); const f = { ...editingFair, id: editingFair.id || Date.now().toString(), status: editingFair.status || 'upcoming' } as Fair; const ok = await (editingFair.id ? updateFair(f) : addFair(f)); if (ok) setEditingFair(null); }} className="space-y-4">
                       <div><label className="text-xs font-bold text-leather-700 mb-1 block">Nombre *</label><input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="ej: Feria Ideas+" value={editingFair.name || ''} onChange={e => setEditingFair({...editingFair, name: e.target.value})} required /></div>
                       <div><label className="text-xs font-bold text-leather-700 mb-1 block">Fecha *</label><input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" type="date" value={editingFair.date || ''} onChange={e => setEditingFair({...editingFair, date: e.target.value})} required /></div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div><label className="text-xs font-bold text-leather-700 mb-1 block">Ciudad</label><input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="ej: Montevideo" value={editingFair.city || ''} onChange={e => setEditingFair({...editingFair, city: e.target.value})} /></div>
                         <div><label className="text-xs font-bold text-leather-700 mb-1 block">Lugar</label><input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="ej: Parque Rodó" value={editingFair.location || ''} onChange={e => setEditingFair({...editingFair, location: e.target.value})} /></div>
                       </div>
                       <div><label className="text-xs font-bold text-leather-700 mb-1 block">Descripción</label><textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-24" placeholder="Contá algo sobre la feria" value={editingFair.description || ''} onChange={e => setEditingFair({...editingFair, description: e.target.value})} /></div>
                       <div><label className="text-xs font-bold text-leather-700 mb-1 block">Estado</label><select className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" value={editingFair.status || 'upcoming'} onChange={e => setEditingFair({...editingFair, status: e.target.value as Fair['status']})}><option value="upcoming">Próxima</option><option value="past">Pasada</option></select></div>
                       <div>
                         <label className="text-xs font-bold text-leather-700 mb-1 block">Imagen</label>
                         <label className="flex items-center gap-2 cursor-pointer bg-leather-50 border-2 border-dashed border-leather-300 rounded-lg p-3 hover:border-leather-500 transition-colors">
                           <Upload size={18} className="text-leather-500" /><span className="text-sm text-leather-600">Subir foto</span>
                           <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                             const file = e.target.files?.[0]; if (!file) return;
                             try { const url = await StorageService.uploadImage(file, 'fairs'); setEditingFair(prev => ({...prev, imageUrl: url})); } catch { alert('Error al subir la foto. Verificá tu conexión.'); }
                             e.target.value = '';
                           }} />
                         </label>
                         {editingFair.imageUrl && <img src={processImageUrl(editingFair.imageUrl, 100)} className="w-16 h-16 object-cover rounded mt-2" alt="" onError={handleImgError} />}
                       </div>
                       <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingFair(null)} className="px-6 py-2 text-leather-600 font-bold">Cancelar</button><button type="submit" className="px-6 py-2 bg-leather-900 text-white rounded-lg font-bold">Guardar</button></div>
                     </form>
                   </div></div>
                 )}
              </div>
            )}
             {activeTab === 'blog' && (
               <div className="animate-fade-in-up">
                  <button onClick={() => setEditingBlog({})} className="mb-6 flex items-center gap-2 bg-leather-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-leather-800 transition"><Plus size={20} /> Nuevo Post</button>
                  <div className="grid gap-4">{blogPosts.map(p => (
                    <div key={p.id} className="flex justify-between items-center border border-leather-100 p-4 rounded-lg hover:shadow-md transition bg-white gap-4">
                       <div className="min-w-0">
                         <span className="font-bold text-leather-900 block truncate">{p.title}</span>
                         <span className="text-xs text-leather-500">{p.date}</span>
                       </div>
                       <div className="flex gap-2"><button onClick={() => setEditingBlog(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" aria-label={`Editar ${p.title}`}><Edit size={18}/></button><button onClick={() => { if(confirm(`¿Eliminar el post "${p.title}"?`)) deleteBlogPost(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded" aria-label={`Eliminar ${p.title}`}><Trash2 size={18}/></button></div>
                    </div>
                  ))}</div>
                  {editingBlog && (
                    <div className="fixed inset-0 bg-leather-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto"><div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-leather-200 my-8 max-h-[90vh] overflow-y-auto">
                      <h3 className="text-2xl font-serif font-bold mb-6 text-leather-900">{editingBlog.id ? 'Editar' : 'Nuevo'} Post</h3>
                      <form onSubmit={async (e) => { e.preventDefault(); const b = { ...editingBlog, id: editingBlog.id || Date.now().toString(), author: editingBlog.author || 'Mariela Calistro', excerpt: editingBlog.excerpt || (editingBlog.content || '').substring(0, 150) + '...', date: editingBlog.date || new Date().toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' }), readTime: editingBlog.readTime || `${Math.max(1, Math.ceil((editingBlog.content || '').split(' ').length / 200))} min lectura` } as BlogPost; const ok = await (editingBlog.id ? updateBlogPost(b) : addBlogPost(b)); if (ok) setEditingBlog(null); }} className="space-y-4">
                        <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Título *" value={editingBlog.title || ''} onChange={e => setEditingBlog({...editingBlog, title: e.target.value})} required />
                        <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none text-sm" placeholder="Resumen corto (se genera automáticamente si lo dejás vacío)" value={editingBlog.excerpt || ''} onChange={e => setEditingBlog({...editingBlog, excerpt: e.target.value})} />
                        <textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-32" placeholder="Contenido del artículo * (separá los párrafos con Enter)" value={editingBlog.content || ''} onChange={e => setEditingBlog({...editingBlog, content: e.target.value})} required />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Autor" value={editingBlog.author ?? 'Mariela Calistro'} onChange={e => setEditingBlog({...editingBlog, author: e.target.value})} />
                          <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none text-sm" placeholder="Fecha (ej: 20 Mar 2026)" value={editingBlog.date || ''} onChange={e => setEditingBlog({...editingBlog, date: e.target.value})} />
                          <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none text-sm" placeholder="Tiempo lectura (ej: 3 min)" value={editingBlog.readTime || ''} onChange={e => setEditingBlog({...editingBlog, readTime: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-leather-700 mb-1 block">Imagen</label>
                          <label className="flex items-center gap-2 cursor-pointer bg-leather-50 border-2 border-dashed border-leather-300 rounded-lg p-3 hover:border-leather-500 transition-colors">
                            <Upload size={18} className="text-leather-500" /><span className="text-sm text-leather-600">Subir foto</span>
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return;
                              try { const url = await StorageService.uploadImage(file, 'blog'); setEditingBlog(prev => ({...prev, imageUrl: url})); } catch { alert('Error al subir la foto. Verificá tu conexión.'); }
                              e.target.value = '';
                            }} />
                          </label>
                          {editingBlog.imageUrl && <img src={processImageUrl(editingBlog.imageUrl, 100)} className="w-16 h-16 object-cover rounded mt-2" alt="" onError={handleImgError} />}
                          <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none mt-2 text-sm" placeholder="O pegar URL de imagen" value={editingBlog.imageUrl || ''} onChange={e => setEditingBlog({...editingBlog, imageUrl: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingBlog(null)} className="px-6 py-2 text-leather-600 font-bold">Cancelar</button><button type="submit" className="px-6 py-2 bg-leather-900 text-white rounded-lg font-bold">Guardar</button></div>
                      </form>
                    </div></div>
                  )}
               </div>
             )}
             {activeTab === 'history' && (
               <div className="animate-fade-in-up">
                  <button onClick={() => setEditingHistory({})} className="mb-6 flex items-center gap-2 bg-leather-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-leather-800 transition"><Plus size={20} /> Nuevo Hito</button>
                  <div className="grid gap-4">{history.map(p => (
                    <div key={p.id} className="flex justify-between items-center border border-leather-100 p-4 rounded-lg hover:shadow-md transition bg-white gap-4">
                       <span className="font-bold text-leather-900">{p.year} — {p.title}</span>
                       <div className="flex gap-2"><button onClick={() => setEditingHistory(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" aria-label={`Editar ${p.title}`}><Edit size={18}/></button><button onClick={() => { if(confirm(`¿Eliminar el hito "${p.title}"?`)) deleteHistoryEvent(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded" aria-label={`Eliminar ${p.title}`}><Trash2 size={18}/></button></div>
                    </div>
                  ))}</div>
                  {editingHistory && (
                    <div className="fixed inset-0 bg-leather-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto"><div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-leather-200 my-8">
                      <h3 className="text-2xl font-serif font-bold mb-6 text-leather-900">{editingHistory.id ? 'Editar' : 'Nuevo'} Hito</h3>
                      <form onSubmit={async (e) => { e.preventDefault(); const h = { ...editingHistory, id: editingHistory.id || Date.now().toString() } as HistoryEvent; const ok = await (editingHistory.id ? updateHistoryEvent(h) : addHistoryEvent(h)); if (ok) setEditingHistory(null); }} className="space-y-4">
                        <div><label className="text-xs font-bold text-leather-700 mb-1 block">Época *</label><input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder='ej: "Los inicios" o "2024"' value={editingHistory.year || ''} onChange={e => setEditingHistory({...editingHistory, year: e.target.value})} required /></div>
                        <div><label className="text-xs font-bold text-leather-700 mb-1 block">Título *</label><input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="ej: Herencia Familiar" value={editingHistory.title || ''} onChange={e => setEditingHistory({...editingHistory, title: e.target.value})} required /></div>
                        <div><label className="text-xs font-bold text-leather-700 mb-1 block">Descripción</label><textarea className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-24" placeholder="Contá este capítulo de la historia" value={editingHistory.description || ''} onChange={e => setEditingHistory({...editingHistory, description: e.target.value})} /></div>
                        <div>
                          <label className="text-xs font-bold text-leather-700 mb-1 block">Imagen</label>
                          <label className="flex items-center gap-2 cursor-pointer bg-leather-50 border-2 border-dashed border-leather-300 rounded-lg p-3 hover:border-leather-500 transition-colors">
                            <Upload size={18} className="text-leather-500" /><span className="text-sm text-leather-600">Subir foto</span>
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return;
                              try { const url = await StorageService.uploadImage(file, 'history'); setEditingHistory(prev => ({...prev, imageUrl: url})); } catch { alert('Error al subir la foto. Verificá tu conexión.'); }
                              e.target.value = '';
                            }} />
                          </label>
                          {editingHistory.imageUrl && <img src={processImageUrl(editingHistory.imageUrl, 100)} className="w-16 h-16 object-cover rounded mt-2" alt="" onError={handleImgError} />}
                          <input className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none mt-2 text-sm" placeholder="O pegar URL de imagen" value={editingHistory.imageUrl || ''} onChange={e => setEditingHistory({...editingHistory, imageUrl: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingHistory(null)} className="px-6 py-2 text-leather-600 font-bold">Cancelar</button><button type="submit" className="px-6 py-2 bg-leather-900 text-white rounded-lg font-bold">Guardar</button></div>
                      </form>
                    </div></div>
                  )}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Catálogo ---
type SortOption = 'destacados' | 'precio-asc' | 'precio-desc' | 'recientes';

const CatalogPage = () => {
  const { products, categories, loading } = useStore();
  const [filter, setFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<SortOption>('destacados');

  usePageMeta("Tienda - MARIEL'LA", 'Catálogo de artesanía en cuero: carteras, bolsos, billeteras, cintos y accesorios únicos hechos a mano en Uruguay.');

  // Filtrado por categoría y búsqueda (nombre o descripción)
  const filtered = products.filter(p => {
    const matchesCategory = filter === 'Todas' || p.category === filter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  const recency = (p: Product) => p.createdAt ? new Date(p.createdAt).getTime() : Number(p.id) || 0;
  const sorted = [...filtered].sort((a, b) => {
    // Las agotadas siempre al final
    const soldDiff = (a.isSoldOut ? 1 : 0) - (b.isSoldOut ? 1 : 0);
    if (soldDiff !== 0) return soldDiff;
    switch (sort) {
      case 'precio-asc': return a.priceUYU - b.priceUYU;
      case 'precio-desc': return b.priceUYU - a.priceUYU;
      case 'recientes': return recency(b) - recency(a);
      case 'destacados':
      default:
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return recency(b) - recency(a);
    }
  });

  return (
    <div className="pt-36 pb-24 bg-leather-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Encabezado editorial */}
        <div className="mb-10">
          <span className="text-leather-600 uppercase tracking-[0.22em] text-xs font-bold">La tienda</span>
          <h1 className="mt-2 font-serif font-bold text-leather-900 text-5xl sm:text-6xl leading-[1.02] text-balance">Nuestra <em className="italic text-leather-600">Colección</em></h1>
          <p className="mt-4 text-leather-600 font-medium max-w-xl">Cada pieza sale una sola vez del taller de Mariela. Cuando encuentra dueño, no se repite.</p>
        </div>
      </div>

      <MarqueeStrip />

      <div className="max-w-7xl mx-auto px-4 pt-10">
        {/* Toolbar: búsqueda + categorías */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4">
          <div className="relative w-full md:max-w-xs flex-shrink-0">
            <input
              type="text"
              placeholder="Buscar una pieza..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 rounded-full border border-leather-200 focus:border-leather-900 focus:ring-2 focus:ring-leather-100 transition-all outline-none shadow-sm text-sm"
              aria-label="Buscar productos"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-leather-400" size={17} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-leather-400 hover:text-leather-600" aria-label="Borrar búsqueda">
                <XCircle size={17} />
              </button>
            )}
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} aria-pressed={filter === cat} className={`px-5 py-2 rounded-full font-bold text-sm transition-all border ${filter === cat ? 'bg-leather-900 text-white border-leather-900' : 'bg-white text-leather-900 border-leather-200 hover:border-leather-900'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contador + Orden */}
        {!loading && (
          <div className="flex justify-between items-center mb-10 flex-wrap gap-3">
            <p className="text-leather-500 font-medium text-sm">{sorted.length} {sorted.length === 1 ? 'pieza' : 'piezas'}</p>
            <div className="flex items-center gap-3">
              <CurrencyToggle />
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortOption)}
                className="px-4 py-2 rounded-lg border border-leather-200 text-sm font-bold text-leather-800 focus:border-leather-900 focus:outline-none shadow-sm cursor-pointer"
                aria-label="Ordenar productos"
              >
                <option value="destacados">Destacadas primero</option>
                <option value="recientes">Más recientes</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="columns-2 lg:columns-3 gap-5 sm:gap-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="break-inside-avoid mb-8 sm:mb-10"><ProductCardSkeleton /></div>
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <div className="columns-2 lg:columns-3 gap-5 sm:gap-7">
            {(() => {
              const nodes = sorted.map((product, i) => (
                <div key={product.id} className="break-inside-avoid mb-8 sm:mb-10">
                  <ProductCard product={product} aspect={GRID_ASPECTS[i % GRID_ASPECTS.length]} />
                </div>
              ));
              // La tile con la historia de Mariela se mezcla entre las piezas
              if (sorted.length >= 3) nodes.splice(2, 0, <StoryTile key="story-tile" />);
              return nodes;
            })()}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search size={48} className="mx-auto text-leather-200 mb-4" />
            <p className="text-leather-500 text-lg font-medium mb-4">No se encontraron productos.</p>
            {(searchTerm || filter !== 'Todas') && (
              <button onClick={() => { setSearchTerm(''); setFilter('Todas'); }} className="text-leather-800 font-bold border-b border-leather-800 hover:text-leather-600 hover:border-leather-600 transition-colors">Ver todos los productos</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const HistoryPage = () => {
  const { history } = useStore();
  usePageMeta("Nuestra Historia - MARIEL'LA", 'La trayectoria de MARIEL\'LA: de la tapicería familiar TAPIPOCITOS al taller de Piriápolis. Tradición artesanal uruguaya.');
  return (
    <div className="pt-36 pb-24 bg-[rgb(var(--paper))] min-h-screen relative">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <span className="text-leather-600 uppercase tracking-widest text-xs font-bold block mb-2">Tradición familiar</span>
          <h1 className="text-5xl font-serif font-bold text-leather-900">Nuestra Historia</h1>
        </div>

        <div className="relative">
          {/* Central Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-leather-300 hidden md:block"></div>

          <div className="space-y-24">
            {history.map((event, i) => (
              <div key={event.id} className={`flex flex-col md:flex-row gap-12 items-center ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-1 w-full text-center md:text-left">
                  <div className={`flex flex-col ${i % 2 !== 0 ? 'md:items-start md:text-left' : 'md:items-end md:text-right'}`}>
                    <div className="inline-block relative p-4 mb-4 leather-patch rounded-lg transform -rotate-2">
                       <div className="absolute inset-1 stitch-border rounded-md pointer-events-none"></div>
                       <span className="text-2xl font-bold text-stitch font-serif relative z-10">{event.year}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-leather-900 mb-4 font-serif">{event.title}</h2>
                    <p className="text-leather-700 leading-relaxed font-medium text-lg">{event.description}</p>
                  </div>
                </div>

                {/* Timeline Dot */}
                <div className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-leather-900 border-4 border-[rgb(var(--paper))] z-10 shadow-lg flex-shrink-0"></div>

                <div className="flex-1 w-full">
                  <div className="relative aspect-[4/3] bg-white p-3 shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-500 border border-leather-200 rounded-sm">
                     <img src={imgSrc1(event.imageUrl, 800)} className="w-full h-full object-cover" alt={event.title} loading="lazy" onError={handleImgError} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
           <p className="text-2xl font-serif text-leather-900 italic">"La historia no termina aquí, cada pieza que entregamos escribe un nuevo capítulo."</p>
           <Link to="/catalogo" className="inline-block mt-8 bg-leather-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-leather-800 transition shadow-lg">Conocé nuestras piezas</Link>
        </div>
      </div>
    </div>
  );
};

const FairsPage = () => {
  const { fairs } = useStore();
  const upcoming = fairs.filter(f => f.status === 'upcoming').sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
  const past = fairs.filter(f => f.status === 'past').sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  usePageMeta("Ferias - MARIEL'LA", 'Encontranos en las próximas ferias artesanales de Uruguay. Calendario de eventos de MARIEL\'LA.');

  return (
    <div className="pt-36 pb-24 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-serif font-bold text-leather-900 mb-12 text-center">Encuentros y Ferias</h1>

        {upcoming.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-leather-900 mb-8 border-b border-leather-100 pb-2">Próximas Fechas</h2>
            <div className="grid gap-6">
              {upcoming.map(fair => (
                <div key={fair.id} className="bg-leather-50 p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center border border-leather-100 hover:shadow-lg transition">
                  <div className="text-center md:text-left min-w-[100px]">
                    <div className="text-3xl font-bold text-leather-900">{parseLocalDate(fair.date).getDate()}</div>
                    <div className="text-sm uppercase font-bold text-leather-500">{parseLocalDate(fair.date).toLocaleString('es-UY', { month: 'long' })}</div>
                    <div className="text-xs font-bold text-leather-400">{parseLocalDate(fair.date).getFullYear()}</div>
                  </div>
                  {fair.imageUrl && (
                    <div className="w-full md:w-36 aspect-video md:aspect-square rounded-lg overflow-hidden border border-leather-200 flex-shrink-0">
                      <img src={processImageUrl(fair.imageUrl, 300)} alt={fair.name} className="w-full h-full object-cover" loading="lazy" onError={handleImgError} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-leather-900 mb-2">{fair.name}</h3>
                    <p className="text-leather-600 mb-2 flex items-center gap-2 font-medium"><MapPin size={16} /> {fair.city}{fair.location ? ` — ${fair.location}` : ''}</p>
                    <p className="text-sm text-leather-700">{fair.description}</p>
                  </div>
                  {fair.mapsUrl && <a href={fair.mapsUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-2 border border-leather-900 text-leather-900 rounded-full font-bold hover:bg-leather-900 hover:text-white transition">Ver Mapa</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {upcoming.length === 0 && (
          <div className="mb-16 bg-leather-50 p-10 rounded-xl border border-dashed border-leather-200 text-center">
            <Calendar size={40} className="mx-auto text-leather-300 mb-4" />
            <p className="text-leather-600 font-medium text-lg mb-1">No tenemos fechas confirmadas por el momento</p>
            <p className="text-leather-400 text-sm">Seguinos en Instagram para enterarte de la próxima feria</p>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-leather-900 mb-8 border-b border-leather-100 pb-2">Eventos Pasados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {past.map(fair => (
                <div key={fair.id} className="bg-white border border-leather-200 p-6 rounded-xl opacity-75 hover:opacity-100 transition hover:shadow-md">
                  <h3 className="font-bold text-leather-900 text-lg">{fair.name}</h3>
                  <p className="text-sm text-leather-500 mb-3 font-bold uppercase">{parseLocalDate(fair.date).getFullYear()} • {fair.city}</p>
                  <p className="text-sm text-leather-600 line-clamp-2">{fair.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-20 bg-leather-900 rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:12px_12px]"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-serif font-bold text-leather-50 mb-3">¿Organizás una feria artesanal?</h3>
            <p className="text-leather-200 font-medium mb-6">Nos encanta llevar nuestras piezas por todo el país. ¡Invitanos!</p>
            <a href={waLink('¡Hola MARIEL\'LA! Los quiero invitar a una feria 🎪')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-3 rounded-full font-bold hover:bg-[#20bd5a] transition-all shadow-lg">
              <MessageCircle size={20} className="fill-white" /> Escribinos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, isAdmin } = useStore();
  const navigate = useNavigate();
  usePageMeta("Acceso Admin - MARIEL'LA");

  // Si ya hay sesión, directo al panel
  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true });
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !password) return;
    setSubmitting(true);
    setError(false);
    const ok = await login(password);
    setSubmitting(false);
    if (ok) {
      navigate('/admin');
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-leather-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full border border-leather-100">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-leather-900 flex items-center justify-center">
          <span className="font-serif font-bold text-leather-100 text-xl">M'L</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1 text-leather-900">Acceso Admin</h1>
        <p className="text-center text-leather-400 text-sm mb-6 font-medium">Espacio de Mariela 💛</p>
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            className="w-full p-3 pr-12 rounded-lg focus:ring-2 focus:ring-leather-500 focus:outline-none border border-gray-300"
            placeholder="Contraseña"
            autoFocus
            aria-label="Contraseña"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-leather-400 hover:text-leather-700" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mb-4 text-center font-bold">Contraseña incorrecta. Probá de nuevo.</p>}
        <button type="submit" disabled={submitting || !password} className="w-full bg-leather-900 text-white py-3 rounded-lg font-bold hover:bg-leather-800 transition disabled:opacity-60">
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};

// --- Guard de ruta admin ---
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { isAdmin, authReady } = useStore();
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-leather-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-leather-200 border-t-leather-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-leather-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { cart, removeFromCart, updateCartQuantity, currency, setCurrency, convertPrice } = useStore();
  const total = cart.reduce((sum, item) => sum + convertPrice(item.priceUYU) * item.quantity, 0);

  // ESC para cerrar + bloquear scroll del fondo
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    let message = "¡Hola MARIEL'LA! 👋 Quiero hacer este pedido:\n\n";
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} — ${formatPrice(convertPrice(item.priceUYU), currency)}\n  ${window.location.origin}/producto/${item.id}\n`;
    });
    message += `\nTotal: ${formatPrice(total, currency)}\n\n¿Cómo coordinamos el pago y el envío?`;
    window.open(waLink(message), '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Carrito de compras">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-6 flex flex-col animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-bold text-leather-900">Tu Carrito</h2>
          <button onClick={onClose} className="p-2 hover:bg-leather-50 rounded-full text-leather-900" aria-label="Cerrar carrito"><X /></button>
        </div>
        {/* Currency Toggle */}
        <div className="flex items-center gap-2 mb-6 bg-leather-50 rounded-lg p-1 self-start border border-leather-100">
          <button onClick={() => setCurrency('UYU')} aria-pressed={currency === 'UYU'} className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${currency === 'UYU' ? 'bg-leather-900 text-white shadow-sm' : 'text-leather-600 hover:text-leather-900'}`}>UYU</button>
          <button onClick={() => setCurrency('USD')} aria-pressed={currency === 'USD'} className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${currency === 'USD' ? 'bg-leather-900 text-white shadow-sm' : 'text-leather-600 hover:text-leather-900'}`}>USD</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={48} className="mx-auto text-leather-200 mb-4" />
              <p className="text-leather-500 font-medium">Tu carrito está vacío.</p>
              <button onClick={onClose} className="mt-4 text-leather-800 font-bold border-b border-leather-800 hover:text-leather-600 hover:border-leather-600 transition-colors text-sm">Seguir comprando</button>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex gap-4 border-b border-leather-100 pb-4">
              <img src={imgSrc(item.images, 100)} className="w-20 h-20 object-cover rounded-lg border border-leather-100" alt={item.name} onError={handleImgError} />
              <div className="flex-1">
                <h3 className="font-bold text-leather-900 text-sm leading-tight">{item.name}</h3>
                <p className="text-leather-600 font-bold mt-1">{formatPrice(convertPrice(item.priceUYU), currency)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-leather-100 rounded-full hover:bg-leather-200 text-leather-800 transition" aria-label="Restar uno"><Minus size={14} /></button>
                  <span className="font-bold text-leather-900 min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-leather-100 rounded-full hover:bg-leather-200 text-leather-800 transition" aria-label="Sumar uno"><Plus size={14} /></button>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 self-start p-1 transition" aria-label={`Quitar ${item.name} del carrito`}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-leather-200 pt-6 mt-4">
            <div className="flex justify-between text-xl font-bold text-leather-900 mb-2">
              <span>Total</span>
              <span>{formatPrice(total, currency)}</span>
            </div>
            <p className="text-xs text-leather-500 mb-6 flex items-center gap-1"><Truck size={14} /> Envíos a todo Uruguay — el pedido se confirma por WhatsApp</p>
            <button onClick={handleCheckout} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold hover:bg-[#128C7E] transition shadow-lg flex items-center justify-center gap-2 active:scale-95 transform">
              <MessageCircle size={24} className="fill-white" /> Finalizar en WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Footer = () => {
  const { settings } = useStore();
  return (
  <footer className="bg-leather-900 text-leather-300 py-16 border-t border-leather-800">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div className="md:col-span-1">
        <h3 className="text-white font-serif font-bold text-2xl mb-4">MARIEL'LA</h3>
        <p className="text-sm font-medium leading-relaxed mb-4">{settings.footerTagline}</p>
        <div className="flex gap-4 mt-4">
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-leather-800 flex items-center justify-center hover:bg-leather-700 transition-colors" aria-label="Instagram"><Instagram size={18} className="text-leather-200" /></a>
          <a href={waLink()} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-leather-800 flex items-center justify-center hover:bg-[#25D366] transition-colors" aria-label="WhatsApp"><MessageCircle size={18} className="text-leather-200" /></a>
        </div>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Tienda</h4>
        <ul className="space-y-3 text-sm font-medium">
          <li><Link to="/catalogo" className="hover:text-white transition-colors">Colección</Link></li>
          <li><Link to="/nosotros" className="hover:text-white transition-colors">Conoce a Mariela</Link></li>
          <li><Link to="/historia" className="hover:text-white transition-colors">Nuestra Historia</Link></li>
          <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
          <li><Link to="/ferias" className="hover:text-white transition-colors">Ferias</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Contacto</h4>
        <ul className="space-y-3 text-sm font-medium">
          <li><a href={waLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={14} /> +598 98 766 318</a></li>
          <li className="flex items-center gap-2"><MapPin size={14} /> Piriápolis, Maldonado — Uruguay</li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Artesanía</h4>
        <ul className="space-y-3 text-sm font-medium">
          <li className="flex items-center gap-2"><Truck size={14} /> Envíos a todo el país</li>
          <li className="flex items-center gap-2"><Heart size={14} className="text-red-400" /> 100% hecho a mano</li>
          <li className="flex items-center gap-2"><Star size={14} /> Cuero genuino</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-leather-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
      <p>&copy; {new Date().getFullYear()} MARIEL'LA. Todos los derechos reservados.</p>
      <p className="text-leather-500">Tradición artesanal familiar — hecho con <Heart size={10} className="inline text-red-400 fill-current" /> en Uruguay</p>
    </div>
  </footer>
  );
};

// --- 404 Page ---
const NotFoundPage = () => {
  usePageMeta("Página no encontrada - MARIEL'LA");
  return (
    <div className="min-h-screen flex items-center justify-center bg-leather-50 pt-20">
      <div className="text-center px-4 max-w-lg">
        <div className="inline-block relative p-6 mb-8 leather-patch rounded-lg">
          <div className="absolute inset-2 stitch-border rounded-md pointer-events-none"></div>
          <span className="text-stitch text-6xl font-serif font-bold">404</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-leather-900 mb-4">Página no encontrada</h1>
        <p className="text-leather-600 mb-8 font-medium">Lo sentimos, la página que buscás no existe o fue movida.</p>
        <Link to="/" className="bg-leather-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-leather-800 transition shadow-lg inline-block">Volver al inicio</Link>
      </div>
    </div>
  );
};

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-leather-50">
          <div className="text-center px-4 max-w-lg">
            <h1 className="text-3xl font-serif font-bold text-leather-900 mb-4">Algo salió mal</h1>
            <p className="text-leather-600 mb-8 font-medium">Ocurrió un error inesperado. Intentá recargar la página.</p>
            <button onClick={() => window.location.reload()} className="bg-leather-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-leather-800 transition shadow-lg">Recargar página</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App Component ---

const App = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <StoreProvider>
          <BrowserRouter>
            <HashRedirect />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <Navbar toggleCart={toggleCart} />
            <FloatingWhatsApp />
            <ScrollTopButton />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalogo" element={<CatalogPage />} />
                <Route path="/nosotros" element={<AboutPage />} />
                <Route path="/historia" element={<HistoryPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPage />} />
                <Route path="/ferias" element={<FairsPage />} />
                <Route path="/producto/:id" element={<ProductDetail />} />
                <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </BrowserRouter>
        </StoreProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
