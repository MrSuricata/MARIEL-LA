import React, { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  ShoppingBag, Menu, X, Instagram, Mail, Phone, MapPin, 
  Star, Trash2, Edit, Plus, Minus, Search, ExternalLink, Settings, LogOut, Image as ImageIcon,
  CheckCircle, ArrowRight, Hammer, Heart, ScrollText, Calendar, Clock, Map, ChevronLeft, ChevronRight,
  ZoomIn, Maximize2, Truck, CreditCard, BookOpen, MessageCircle, Copy, Database, XCircle, Tag
} from 'lucide-react';
import { Product, CartItem, Fair, Currency, HistoryEvent, BlogPost } from './types';
import { StorageService } from './services/storageService';
import { Upload } from 'lucide-react';

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
    return `https://lh3.googleusercontent.com/d/${idMatch[0]}=s${size}`;
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

// --- Scroll To Top Component ---
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
};

// --- Global Styles ---
const GlobalStyles = () => (
  <style>{`
    html { scroll-behavior: smooth; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes zoomFadeIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes cartBounce { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
    .animate-fade-in-up { animation: fadeInUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .animate-zoom-fade-in { animation: zoomFadeIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    .animate-slide-in-right { animation: slideInRight 0.3s ease-out forwards; }
    .animate-cart-bounce { animation: cartBounce 0.4s ease-in-out; }
    .delay-100 { animation-delay: 150ms; }
    .delay-200 { animation-delay: 300ms; }
    .delay-300 { animation-delay: 450ms; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .leather-patch {
      background-color: #7f3e23;
      box-shadow: 0 10px 20px rgba(0,0,0,0.4), inset 0 0 40px rgba(0,0,0,0.2);
    }
    .stitch-border {
      border: 3px dashed #f5ead6; 
      box-shadow: inset 0 0 2px 1px rgba(0,0,0,0.3), 0 0 1px 0 rgba(255,255,255,0.2); 
    }
    .text-stitch {
      color: #f5ead6;
      text-shadow: 0px 1px 1px rgba(0,0,0,0.5), 0px 2px 4px rgba(0,0,0,0.3);
      filter: drop-shadow(0 2px 1px rgba(0,0,0,0.2));
    }
    .text-shadow-sm {
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    
    /* NUCLEAR OPTION FOR INPUTS */
    input, textarea, select {
      background-color: #ffffff !important;
      color: #111827 !important;
    }
    
    /* Chrome/Edge Autofill Override Hack */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    textarea:-webkit-autofill,
    textarea:-webkit-autofill:hover,
    textarea:-webkit-autofill:focus,
    select:-webkit-autofill,
    select:-webkit-autofill:hover,
    select:-webkit-autofill:focus {
      -webkit-text-fill-color: #111827;
      -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
      transition: background-color 5000s ease-in-out 0s;
    }
  `}</style>
);

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
  convertPrice: (priceUYU: number) => number;
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  setCurrency: (c: Currency) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addFair: (fair: Fair) => void;
  updateFair: (fair: Fair) => void;
  deleteFair: (id: string) => void;
  addHistoryEvent: (event: HistoryEvent) => void;
  updateHistoryEvent: (event: HistoryEvent) => void;
  deleteHistoryEvent: (id: string) => void;
  addBlogPost: (post: BlogPost) => void;
  updateBlogPost: (post: BlogPost) => void;
  deleteBlogPost: (id: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
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

  const convertPrice = (priceUYU: number): number => {
    if (currency === 'UYU') return priceUYU;
    return Math.round(priceUYU / exchangeRate);
  };

  useEffect(() => {
    const loadData = async () => {
      const [prods, frs, hist, blogs, cats] = await Promise.all([
        StorageService.getProducts(),
        StorageService.getFairs(),
        StorageService.getHistory(),
        StorageService.getBlogPosts(),
        StorageService.getCategories(),
      ]);
      setProducts(prods);
      setFairs(frs);
      setHistory(hist);
      setBlogPosts(blogs);
      setCategories(cats);
    };
    loadData();
    // Fetch exchange rate USD/UYU
    fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')
      .then(r => r.json())
      .then(data => { if (data?.usd?.uyu) setExchangeRate(data.usd.uyu); })
      .catch(() => {}); // Keep fallback
    try {
      const savedCart = localStorage.getItem('mariella_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch { /* corrupted cart data, start fresh */ }
  }, []);

  useEffect(() => { localStorage.setItem('mariella_cart', JSON.stringify(cart)); }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };
  const clearCart = () => setCart([]);
  const login = (password: string) => {
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD;
    if (password === adminPass) { setIsAdmin(true); return true; }
    return false;
  };
  const logout = () => setIsAdmin(false);

  const addProduct = async (p: Product) => { setProducts(prev => [...prev, p]); await StorageService.saveProduct(p); };
  const updateProduct = async (p: Product) => { setProducts(prev => prev.map(x => x.id === p.id ? p : x)); await StorageService.saveProduct(p); };
  const deleteProduct = async (id: string) => { setProducts(prev => prev.filter(x => x.id !== id)); await StorageService.deleteProduct(id); };

  const addFair = async (f: Fair) => { setFairs(prev => [...prev, f]); await StorageService.saveFair(f); };
  const updateFair = async (f: Fair) => { setFairs(prev => prev.map(x => x.id === f.id ? f : x)); await StorageService.saveFair(f); };
  const deleteFair = async (id: string) => { setFairs(prev => prev.filter(x => x.id !== id)); await StorageService.deleteFair(id); };

  const addHistoryEvent = async (h: HistoryEvent) => { setHistory(prev => [...prev, h]); await StorageService.saveHistoryEvent(h); };
  const updateHistoryEvent = async (h: HistoryEvent) => { setHistory(prev => prev.map(x => x.id === h.id ? h : x)); await StorageService.saveHistoryEvent(h); };
  const deleteHistoryEvent = async (id: string) => { setHistory(prev => prev.filter(x => x.id !== id)); await StorageService.deleteHistoryEvent(id); };

  const addBlogPost = async (b: BlogPost) => { setBlogPosts(prev => [...prev, b]); await StorageService.saveBlogPost(b); };
  const updateBlogPost = async (b: BlogPost) => { setBlogPosts(prev => prev.map(x => x.id === b.id ? b : x)); await StorageService.saveBlogPost(b); };
  const deleteBlogPost = async (id: string) => { setBlogPosts(prev => prev.filter(x => x.id !== id)); await StorageService.deleteBlogPost(id); };

  const addCategory = async (c: string) => {
    if (!categories.includes(c)) {
      setCategories(prev => [...prev, c]);
      await StorageService.addCategory(c);
    }
  };
  const deleteCategory = async (c: string) => {
    setCategories(prev => prev.filter(cat => cat !== c));
    await StorageService.deleteCategory(c);
  };

  return (
    <StoreContext.Provider value={{
      products, cart, fairs, history, blogPosts, categories, currency, exchangeRate, convertPrice, isAdmin,
      setCurrency, addToCart, removeFromCart, updateCartQuantity, clearCart, login, logout,
      addProduct, updateProduct, deleteProduct, addFair, updateFair, deleteFair,
      addHistoryEvent, updateHistoryEvent, deleteHistoryEvent, addBlogPost, updateBlogPost, deleteBlogPost,
      addCategory, deleteCategory
    }}>
      {children}
    </StoreContext.Provider>
  );
};

// --- Navbar & UI Components ---

const TopBar = () => (
  <div className="bg-leather-900 text-leather-200 text-xs py-2 px-4 text-center tracking-widest uppercase font-bold border-b border-leather-800 hidden sm:block">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <span className="flex items-center gap-2"><Truck size={14} /> Envíos a todo el país</span>
      <span className="flex items-center gap-2">Artesanía 100% Uruguaya <Heart size={12} className="text-red-500 fill-current" /></span>
    </div>
  </div>
);

const FloatingWhatsApp = () => (
  <a 
    href="https://wa.me/59898766318" 
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

const Navbar = ({ toggleCart }: { toggleCart: () => void }) => {
  const { cart, isAdmin } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine if we need light text (on dark Hero background and not scrolled)
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
        <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-leather-600 transition-all duration-300 group-hover:w-full ${isActive ? 'w-full' : ''}`}></span>
      </Link>
    );
  };

  return (
    <>
    <ScrollToTop />
    <TopBar />
    <nav className={`fixed top-8 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-leather-50/95 backdrop-blur-md shadow-md py-2 top-0' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" onClick={(e) => handleNavClick(e, '/', false)} className={`font-serif text-2xl tracking-wider font-bold z-50 cursor-pointer ${logoColorClass}`}>
            MARIEL'LA
          </Link>
          <div className={`hidden md:flex items-center space-x-8 ${!scrolled && location.pathname === '/' ? 'px-8 py-3 rounded-full backdrop-blur-[2px]' : ''}`}>
            <NavLink label="Inicio" to="/" />
            <NavLink label="Tienda" to="/catalogo" />
            {/* Historia hidden */}
            <NavLink label="Descubre" to="/blog" />
            <NavLink label="Ferias" to="/ferias" />
            <NavLink label="Contacto" to="#contacto" isAnchor={true} />
          </div>
          <div className="flex items-center space-x-4 z-50">
            <button onClick={toggleCart} className={`relative p-2 transition-colors rounded-full hover:bg-white/20 ${iconColorClass}`}>
              <ShoppingBag size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-leather-600 rounded-full shadow-sm">
                  {itemCount}
                </span>
              )}
            </button>
            <Link to={isAdmin ? "/admin" : "/login"} className={`p-2 rounded-full hover:bg-white/20 transition-colors ${iconColorClass}`} aria-label="Configuración">
              <Settings size={20} />
            </Link>
            <button className={`md:hidden p-2 rounded-full ${iconColorClass}`} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden absolute top-0 left-0 w-full h-screen bg-leather-50 flex flex-col items-center justify-center space-y-8 z-40">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-leather-900 font-bold text-xl">Inicio</Link>
            <Link to="/catalogo" onClick={() => setIsMenuOpen(false)} className="text-leather-900 font-bold text-xl">Tienda</Link>
            {/* Historia Hidden */}
            <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="text-leather-900 font-bold text-xl">Descubre</Link>
            <Link to="/ferias" onClick={() => setIsMenuOpen(false)} className="text-leather-900 font-bold text-xl">Ferias</Link>
            <a href="#contacto" onClick={(e) => handleNavClick(e, '#contacto', true)} className="text-leather-900 font-bold text-xl">Contacto</a>
        </div>
      )}
    </nav>
    </>
  );
};

// --- Home Sections ---

const HeroSection = () => (
  <section id="inicio" className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-leather-900">
    <div className="absolute inset-0 z-0">
      <img src={processImageUrl("https://drive.google.com/file/d/1qeN28si1WAj_TmotiGxcENBATPK1Ugze/view?usp=drive_link", 1920)} alt="Textura cuero" className="absolute inset-0 w-full h-full object-cover blur-[2px]" onError={handleImgError} />
      <div className="absolute inset-0 bg-leather-900/40 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-leather-900/80 to-transparent z-10" />
      <div className="absolute inset-0 z-20 opacity-10 mix-blend-overlay" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'}} />
    </div>
    <div className="relative z-30 text-center px-4 max-w-4xl mx-auto">
      <span className="block text-leather-100 text-sm md:text-base tracking-[0.3em] uppercase mb-10 font-bold animate-fade-in-up drop-shadow-md text-shadow-sm">Artesanía Uruguaya</span>
      <div className="inline-block relative p-8 md:p-12 mb-10 animate-zoom-fade-in leather-patch rounded-lg transform rotate-1">
        <div className="absolute inset-2 stitch-border rounded-md pointer-events-none"></div>
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-[#cd853f] border border-[#5d2f0d] shadow-sm z-20"></div>
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#cd853f] border border-[#5d2f0d] shadow-sm z-20"></div>
        <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-[#cd853f] border border-[#5d2f0d] shadow-sm z-20"></div>
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[#cd853f] border border-[#5d2f0d] shadow-sm z-20"></div>
        <h1 className="text-stitch text-5xl md:text-7xl lg:text-9xl font-serif font-bold leading-none tracking-tight relative z-10">MARIEL'LA</h1>
      </div>
      <p className="text-lg md:text-2xl text-leather-50 mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up delay-200 drop-shadow-md font-sans text-shadow-sm">
        Piezas de cuero genuino que cuentan historias. <br/> Hechas a mano, una a una, con pasión y tiempo.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
        <Link to="/catalogo" className="bg-[#f5ead6] text-[#5d2f0d] px-8 py-3 rounded-full font-bold hover:bg-white transition-all shadow-lg hover:shadow-xl hover:scale-105 border border-leather-400">Ver Tienda Online</Link>
      </div>
    </div>
  </section>
);

const DiscoverSection = () => {
  const { blogPosts } = useStore();
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
          {featuredPosts.map((post, i) => (
            <Reveal key={post.id} delay={i * 100}>
              <Link to={`/blog/${post.id}`} className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all h-full border border-leather-100">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={processImageUrl(post.imageUrl, 600)} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
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

const HomePage = () => {
  useEffect(() => { document.title = "MARIEL'LA | Artesanía en Cuero"; }, []);
  return (
    <div className="animate-fade-in-up scroll-smooth">
      <HeroSection />
      <Reveal><FeaturedCarousel /></Reveal>
      {/* History Section Hidden */}
      <DiscoverSection />
      <Reveal><FairsTeaser /></Reveal>
      <Reveal><ContactSection /></Reveal>
    </div>
  );
};

// --- Sections Components ---

const FeaturedCarousel = () => {
  const { products, currency, convertPrice } = useStore();
  const displayProducts = products.filter(p => p.isFeatured).concat(products.filter(p => !p.isFeatured)).slice(0, 6);
  const [startIndex, setStartIndex] = useState(0);

  const nextSlide = () => setStartIndex(prev => (prev + 1) % (displayProducts.length - 2)); 
  const prevSlide = () => setStartIndex(prev => (prev - 1 + (displayProducts.length - 2)) % (displayProducts.length - 2));
  const visibleProducts = displayProducts.slice(startIndex, startIndex + 3);

  return (
    <section id="coleccion" className="py-24 border-t border-leather-100 scroll-mt-20 relative bg-[#fdfbf7]">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
           <span className="text-leather-600 uppercase tracking-widest text-xs font-bold">Hecho a Mano</span>
           <h2 className="text-4xl font-serif font-bold text-leather-900 mt-2">Colección de Temporada</h2>
        </div>
        <div className="hidden md:block relative">
           <div className="flex gap-8 justify-center">
             {visibleProducts.map((product) => (
                <div key={product.id} className="w-1/3 group relative">
                  <Link to={`/producto/${product.id}`} className="block">
                    <div className="aspect-[4/5] overflow-hidden rounded-lg mb-4 relative shadow-md">
                       <img src={processImageUrl(product.images[0], 600)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" onError={handleImgError} />
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-leather-900/80 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none font-bold shadow-xl text-center min-w-[140px]">{product.name}</div>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-leather-900">{product.name}</h3>
                    <p className="text-leather-600 font-bold text-lg">{currency} {convertPrice(product.priceUYU).toLocaleString()}</p>
                  </Link>
                </div>
             ))}
           </div>
           {displayProducts.length > 3 && (
             <>
               <button onClick={prevSlide} className="absolute top-1/2 -left-4 -translate-y-1/2 bg-white text-leather-900 p-3 rounded-full shadow-lg hover:bg-leather-100 border border-leather-100 transition-all z-10"><ChevronLeft size={24} /></button>
               <button onClick={nextSlide} className="absolute top-1/2 -right-4 -translate-y-1/2 bg-white text-leather-900 p-3 rounded-full shadow-lg hover:bg-leather-100 border border-leather-100 transition-all z-10"><ChevronRight size={24} /></button>
             </>
           )}
        </div>
        <div className="md:hidden grid grid-cols-1 gap-8">
           {displayProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="group">
                  <Link to={`/producto/${product.id}`} className="block">
                    <div className="aspect-square overflow-hidden rounded-lg mb-4 relative shadow-md">
                       <img src={processImageUrl(product.images[0], 600)} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12"><span className="text-white font-bold text-sm">{product.name}</span></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                       <h3 className="text-xl font-serif font-bold text-leather-900">{product.name}</h3>
                       <p className="text-leather-600 font-bold">{currency} {convertPrice(product.priceUYU).toLocaleString()}</p>
                    </div>
                  </Link>
              </div>
           ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/catalogo" className="bg-leather-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-leather-800 transition shadow-lg">Ver Todo el Catálogo</Link>
        </div>
      </div>
    </section>
  );
};

const FairsTeaser = () => {
  const { fairs } = useStore();
  const upcoming = fairs.filter(f => f.status === 'upcoming').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 2);

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
                   <span className="block text-2xl font-bold text-leather-900 leading-none">{new Date(fair.date).getDate()}</span>
                   <span className="block text-xs font-bold text-leather-500 uppercase">{new Date(fair.date).toLocaleString('es-ES', { month: 'short' })}</span>
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

const ContactSection = () => (
  <section id="contacto" className="py-24 bg-leather-100 scroll-mt-20">
    <div className="max-w-5xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-leather-200">
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-leather-900 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-serif font-bold mb-6">Hablemos</h2>
            <p className="text-leather-200 mb-8 leading-relaxed font-medium">¿Tenés una idea especial? ¿Querés personalizar un producto? Estamos aquí para responder todas tus dudas.</p>
            <div className="space-y-6">
              <a href="https://wa.me/59898766318" className="flex items-center gap-4 group cursor-pointer hover:bg-leather-800 p-2 -ml-2 rounded-lg transition-colors">
                 <div className="bg-[#25D366] p-1 rounded-full"><MessageCircle size={18} className="text-white fill-white" /></div> 
                 <span className="font-bold text-lg text-white">+598 98 766 318</span>
              </a>
              {/* Email Removed */}
              <a href="https://www.instagram.com/mariellacalistro/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group cursor-pointer hover:bg-leather-800 p-2 -ml-2 rounded-lg transition-colors">
                 <div className="bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-1 rounded-full"><Instagram size={18} className="text-white" /></div>
                 <span className="font-bold text-lg text-white">@mariellacalistro</span>
              </a>
            </div>
          </div>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px]"></div>
        </div>
        <div className="md:w-1/2 bg-leather-50 relative min-h-[400px] flex items-center justify-center p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
          {/* Circular Image Container for the Artisan */}
          <div className="relative w-64 h-64 rounded-full border-[6px] border-white shadow-2xl overflow-hidden z-10 ring-4 ring-leather-200/50">
             <img src={processImageUrl("https://drive.google.com/file/d/1nMQHF1eWwDKQsQL-Fggx1lbex5V0nZ3b/view?usp=drive_link", 600)} alt="Mariela Calistro" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 opacity-20"><Hammer size={120} className="text-leather-300" /></div>
        </div>
      </div>
    </div>
  </section>
);

const BlogPage = () => {
  const { blogPosts } = useStore();
  const { id: urlPostId } = useParams();
  const [selectedPost, setSelectedPost] = useState<string | null>(urlPostId || null);

  useEffect(() => {
    if (urlPostId) setSelectedPost(urlPostId);
  }, [urlPostId]);

  useEffect(() => {
    window.scrollTo(0,0);
    document.title = selectedPost
      ? `${blogPosts.find(p=>p.id===selectedPost)?.title} - MARIEL'LA`
      : "Blog - MARIEL'LA";
  }, [selectedPost, blogPosts]);

  if (selectedPost) {
    const post = blogPosts.find(p => p.id === selectedPost);
    if (!post) return null;
    return (
      <div className="bg-white min-h-screen pt-32 pb-24 animate-fade-in-up">
        <div className="max-w-3xl mx-auto px-6">
          <button onClick={() => setSelectedPost(null)} className="flex items-center text-leather-600 font-bold mb-8 hover:underline"><ChevronLeft size={20}/> Volver</button>
          <span className="text-leather-600 font-bold uppercase text-xs tracking-wider mb-2 block">{post.date} • {post.readTime}</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-leather-900 mb-8 leading-tight">{post.title}</h1>
          <div className="aspect-video w-full rounded-xl overflow-hidden mb-10 shadow-lg border border-leather-200">
            <img src={processImageUrl(post.imageUrl, 1200)} alt={post.title} className="w-full h-full object-cover" onError={handleImgError} />
          </div>
          <div className="prose prose-lg prose-stone mx-auto text-leather-800 leading-relaxed font-serif">
             <p className="font-bold text-xl mb-6 text-leather-900">{post.excerpt}</p>
             {post.content.split('\n').map((p, i) => <p key={i} className="mb-6">{p}</p>)}
          </div>
          <div className="mt-12 pt-8 border-t border-leather-200 flex items-center justify-between">
            <span className="font-bold text-leather-900">Escrito por {post.author}</span>
            <div className="flex gap-2"><Heart className="text-leather-400" /></div>
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
          {blogPosts.map((post) => (
             <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all h-full border border-leather-100 flex flex-col cursor-pointer" onClick={() => setSelectedPost(post.id)}>
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={processImageUrl(post.imageUrl, 600)} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-leather-500 mb-3 font-bold uppercase tracking-wider">
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-leather-900 mb-3 leading-tight hover:text-leather-600 transition-colors">{post.title}</h3>
                  <p className="text-leather-700 text-sm line-clamp-3 mb-6 leading-relaxed flex-1 font-medium">{post.excerpt}</p>
                  <span className="inline-flex items-center text-sm font-bold text-leather-800 border-b-2 border-leather-200 hover:border-leather-600 transition-all self-start">Leer artículo <ArrowRight size={14} className="ml-1" /></span>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const { products, addToCart, currency, convertPrice } = useStore();
  const [selectedImg, setSelectedImg] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0,0) }, [id]);
  
  const product = products.find(p => p.id === id);
  
  // Dynamic Title
  useEffect(() => {
    if (product) document.title = `${product.name} - MARIEL'LA`;
  }, [product]);

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-leather-50 pt-20">
      <div className="text-center px-4">
        <ShoppingBag size={48} className="mx-auto text-leather-200 mb-4" />
        <h2 className="text-2xl font-serif font-bold text-leather-900 mb-2">Producto no encontrado</h2>
        <p className="text-leather-500 mb-6">Este producto ya no está disponible o fue removido.</p>
        <Link to="/catalogo" className="bg-leather-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-leather-800 transition">Ver catálogo</Link>
      </div>
    </div>
  );
  const currentImageUrl = processImageUrl(product.images[selectedImg], 1200);
  const highResImageUrl = processImageUrl(product.images[selectedImg], 2400);

  // Related Products Logic
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgContainerRef.current) return;
    const { left, top, width, height } = imgContainerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    setCursorPos({ x, y });
    setBgPos({ x: (x / width) * 100, y: (y / height) * 100 });
  };

  return (
    <>
      <div className="bg-white min-h-screen pt-36 pb-12 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            <div className="space-y-6">
              <div ref={imgContainerRef} className={`relative aspect-square bg-leather-50 rounded-2xl overflow-hidden border border-leather-100 shadow-sm group ${showMagnifier ? 'cursor-none' : 'cursor-zoom-in'}`} onMouseEnter={() => setShowMagnifier(true)} onMouseLeave={() => setShowMagnifier(false)} onMouseMove={handleMouseMove} onClick={() => setIsLightboxOpen(true)}>
                <img src={currentImageUrl} alt={product.name} className="w-full h-full object-cover" />
                {showMagnifier && (
                  <div className="absolute w-40 h-40 rounded-full border-4 border-white shadow-2xl pointer-events-none z-20 overflow-hidden hidden md:block" style={{ left: cursorPos.x, top: cursorPos.y, transform: 'translate(-50%, -50%)', backgroundImage: `url(${highResImageUrl})`, backgroundRepeat: 'no-repeat', backgroundPosition: `${bgPos.x}% ${bgPos.y}%`, backgroundSize: '500%' }} />
                )}
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur p-2 rounded-full text-leather-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><Maximize2 size={20} /></div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImg(idx)} className={`w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImg === idx ? 'border-leather-600 ring-2 ring-leather-100' : 'border-transparent opacity-70 hover:opacity-100'}`}><img src={processImageUrl(img, 200)} alt="" className="w-full h-full object-cover" /></button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                 <span className="text-leather-600 font-bold uppercase tracking-wider text-sm">{product.category}</span>
                 <h1 className="text-4xl md:text-5xl font-serif font-bold text-leather-900 mt-2 mb-4">{product.name}</h1>
                 <p className="text-3xl font-light text-leather-800 font-serif">{currency} {convertPrice(product.priceUYU).toLocaleString()}</p>
              </div>
              <div className="prose prose-lg text-leather-800 mb-10 leading-relaxed font-medium"><p>{product.description}</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 p-6 bg-leather-50 rounded-xl border border-leather-100">
                <div><span className="font-bold text-leather-900 block mb-2">Materiales</span><ul className="text-sm text-leather-800 space-y-1">{product.materials.map(m => <li key={m} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-leather-500"></div>{m}</li>)}</ul></div>
                <div><span className="font-bold text-leather-900 block mb-2">Detalles</span><p className="text-sm text-leather-800 mb-2"><span className="font-semibold">Medidas:</span> {product.dimensions}</p><p className="text-sm text-leather-800"><span className="font-semibold">Colores:</span> {product.colors.join(', ')}</p></div>
              </div>
              {product.isSoldOut ? (
                <div className="w-full bg-red-100 text-red-700 px-8 py-5 rounded-lg font-bold text-lg text-center border border-red-200">🚫 Producto Agotado</div>
              ) : (
                <button onClick={() => addToCart(product)} className="w-full bg-leather-900 text-white px-8 py-5 rounded-lg font-bold text-lg hover:bg-leather-800 transition shadow-lg transform active:scale-95">Agregar al Carrito</button>
              )}
            </div>
          </div>
          
          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-leather-100 pt-16">
              <h2 className="text-2xl font-serif font-bold text-leather-900 mb-8">También te podría gustar</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedProducts.map(rp => (
                  <div key={rp.id} className="group">
                    <Link to={`/producto/${rp.id}`} className="block">
                      <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-leather-100 shadow-sm">
                        <img src={processImageUrl(rp.images[0], 600)} alt={rp.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <h3 className="font-bold text-leather-900 text-lg group-hover:text-leather-600 transition">{rp.name}</h3>
                      <p className="text-leather-600 font-medium">{currency} {convertPrice(rp.priceUYU).toLocaleString()}</p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2"><X size={32} /></button>
          <img src={highResImageUrl} alt={product.name} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm cursor-default" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

// Admin Panel Updates
const AdminPanel = () => {
  const { products, fairs, history, blogPosts, categories, exchangeRate, logout, addProduct, updateProduct, deleteProduct, addFair, updateFair, deleteFair, addHistoryEvent, updateHistoryEvent, deleteHistoryEvent, addBlogPost, updateBlogPost, deleteBlogPost, addCategory, deleteCategory } = useStore();
  const [activeTab, setActiveTab] = useState<'products' | 'fairs' | 'history' | 'blog' | 'categories' | 'system'>('products');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingFair, setEditingFair] = useState<Partial<Fair> | null>(null);
  const [editingHistory, setEditingHistory] = useState<Partial<HistoryEvent> | null>(null);
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Admin - MARIEL'LA"; }, []);

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

  const ProductForm = () => {
    const [formData, setFormData] = useState<Partial<Product>>(editingProduct || { name: '', description: '', priceUYU: 0, priceUSD: 0, category: categories[1] || 'Carteras', images: [''], materials: [], colors: [], dimensions: '', isFeatured: false, isSoldOut: false });
    const [uploading, setUploading] = useState(false);
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const p = { ...formData, id: formData.id || Date.now().toString(), materials: typeof formData.materials === 'string' ? (formData.materials as string).split('\n').filter(Boolean) : formData.materials, colors: typeof formData.colors === 'string' ? (formData.colors as string).split('\n').filter(Boolean) : formData.colors, images: Array.isArray(formData.images) ? formData.images.filter(i => i !== '') : [] } as Product;
      if (formData.id) updateProduct(p); else addProduct(p);
      setEditingProduct(null);
    };
    return (
      <div className="fixed inset-0 bg-leather-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto"><div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-sm sm:max-w-2xl w-full border border-leather-200 my-8 max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-serif font-bold mb-6 text-leather-900">{formData.id ? 'Editar' : 'Nuevo'} Producto</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-leather-700 mb-1 block">Nombre *</label><input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label className="text-xs font-bold text-leather-700 mb-1 block">Categoría</label><select style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>{categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div><label className="text-xs font-bold text-leather-700 mb-1 block">Descripción</label><textarea style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-leather-700 mb-1 block">Precio (UYU) *</label>
                <input style={{backgroundColor: 'white'}} type="number" min="0" className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" value={formData.priceUYU} onChange={e => setFormData({...formData, priceUYU: Number(e.target.value)})} required />
                {formData.priceUYU ? <p className="text-xs text-leather-400 mt-1">≈ USD {Math.round((formData.priceUYU || 0) / exchangeRate)}</p> : null}
              </div>
              <div><label className="text-xs font-bold text-leather-700 mb-1 block">Dimensiones</label><input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="ej: 35cm x 30cm x 12cm" value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-leather-700 mb-1 block">Materiales (uno por línea)</label><textarea style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-16 text-sm" placeholder="Cuero genuino&#10;Herrajes metálicos" value={Array.isArray(formData.materials) ? formData.materials.join('\n') : formData.materials} onChange={e => setFormData({...formData, materials: e.target.value.split('\n') as any})} /></div>
              <div><label className="text-xs font-bold text-leather-700 mb-1 block">Colores (uno por línea)</label><textarea style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-16 text-sm" placeholder="Marrón&#10;Negro" value={Array.isArray(formData.colors) ? formData.colors.join('\n') : formData.colors} onChange={e => setFormData({...formData, colors: e.target.value.split('\n') as any})} /></div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isFeatured || false} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="w-4 h-4 rounded border-leather-300 text-leather-600 focus:ring-leather-500" /><span className="text-sm font-bold text-leather-700">⭐ Destacado</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isSoldOut || false} onChange={e => setFormData({...formData, isSoldOut: e.target.checked})} className="w-4 h-4 rounded border-leather-300 text-red-600 focus:ring-red-500" /><span className="text-sm font-bold text-red-600">🚫 Agotado</span></label>
            </div>
            <div>
              <label className="text-xs font-bold text-leather-700 mb-1 block">Fotos del Producto</label>
              <label className={`flex items-center gap-2 cursor-pointer bg-leather-50 border-2 border-dashed border-leather-300 rounded-lg p-4 hover:border-leather-500 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={20} className="text-leather-500" />
                <span className="text-sm text-leather-600 font-medium">{uploading ? 'Subiendo...' : 'Click para seleccionar imágenes'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
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
                }} />
              </label>
              {formData.images && formData.images.filter(i => i).length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {formData.images.filter(i => i).map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={processImageUrl(img, 100)} className="w-16 h-16 object-cover rounded border" alt={`Imagen ${idx + 1}`} />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">×</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="text-xs text-leather-400 mt-2 block">O pega URLs directamente:</label>
              <textarea style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-16 text-sm font-mono mt-1" value={Array.isArray(formData.images) ? formData.images.join('\n') : ''} onChange={e => setFormData({...formData, images: e.target.value.split('\n')})} />
            </div>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setEditingProduct(null)} className="px-6 py-2 text-leather-600 font-bold">Cancelar</button><button type="submit" disabled={uploading} className="px-6 py-2 bg-leather-900 text-white rounded-lg font-bold disabled:opacity-50">Guardar</button></div>
          </form>
      </div></div>
    );
  };

  return (
    <div className="min-h-screen bg-leather-50 pt-36 pb-12 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm border border-leather-100">
          <div><h1 className="text-2xl font-bold text-leather-900">Panel de Administración</h1></div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-medium px-4 py-2 hover:bg-red-50 rounded-lg"><LogOut size={18} /> Salir</button>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-leather-200 min-h-[600px] overflow-hidden">
          <div className="border-b border-leather-200 px-8 py-5 flex gap-8 bg-leather-50/50 overflow-x-auto">
            {['products', 'categories', 'fairs', 'history', 'blog', 'system'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`text-lg font-bold pb-1 border-b-2 capitalize whitespace-nowrap ${activeTab === tab ? 'border-leather-900 text-leather-900' : 'border-transparent text-leather-400'}`}>
                {tab === 'products' ? 'Productos' : tab === 'categories' ? 'Categorías' : tab === 'fairs' ? 'Ferias' : tab === 'history' ? 'Historia' : tab === 'blog' ? 'Blog' : 'Sistema'}
              </button>
            ))}
          </div>
          <div className="p-8">
            {activeTab === 'system' && (
              <div className="animate-fade-in max-w-2xl">
                 <h2 className="text-2xl font-serif font-bold text-leather-900 mb-4">Estado del Sistema</h2>
                 <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
                   <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2"><CheckCircle size={20} className="text-green-600" /> Base de datos conectada</h3>
                   <p className="text-green-700 text-sm">Los datos se guardan automáticamente en la nube (Supabase). Todos los cambios que hagas desde este panel son visibles inmediatamente para todos los visitantes de la web.</p>
                 </div>
                 <div className="bg-leather-50 p-6 rounded-xl border border-leather-200">
                   <h3 className="font-bold text-leather-900 mb-3 flex items-center gap-2"><Database size={20}/> Exportar Datos (Backup)</h3>
                   <p className="text-sm text-leather-600 mb-4">Exportar una copia de seguridad de todos los datos actuales.</p>
                   <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all ${copied ? 'bg-green-600' : 'bg-leather-900 hover:bg-leather-800'}`}>
                      {copied ? <><CheckCircle size={20}/> ¡Copiado!</> : <><Copy size={20}/> Copiar Backup JSON</>}
                   </button>
                 </div>
              </div>
            )}
            {activeTab === 'categories' && (
              <div className="animate-fade-in max-w-xl">
                <div className="flex gap-4 mb-8">
                  <input style={{backgroundColor: 'white'}} className="flex-1 !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Nueva Categoría" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                  <button onClick={() => { if(newCategory) { addCategory(newCategory); setNewCategory(''); } }} className="bg-leather-900 text-white px-6 rounded-lg font-bold hover:bg-leather-800 transition">Agregar</button>
                </div>
                <div className="space-y-3">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between items-center p-4 bg-leather-50 rounded-lg border border-leather-100">
                      <span className="font-bold text-leather-900">{cat}</span>
                      {cat !== 'Todas' && <button onClick={() => { if(confirm('¿Eliminar categoría?')) deleteCategory(cat); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'products' && (
              <div className="animate-fade-in">
                <button onClick={() => setEditingProduct({})} className="mb-6 flex items-center gap-2 bg-leather-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-leather-800 transition"><Plus size={20} /> Nuevo Producto</button>
                <div className="grid gap-4">{products.map(p => (
                  <div key={p.id} className="flex justify-between items-center border border-leather-100 p-4 rounded-lg hover:shadow-md transition bg-white">
                    <div className="flex gap-4 items-center">
                      <img src={processImageUrl(p.images[0], 100)} className="w-12 h-12 object-cover rounded" alt="" />
                      <div>
                        <span className="font-bold text-leather-900 block">{p.name}</span>
                        <span className="text-xs text-leather-500">{p.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-2"><button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18}/></button><button onClick={() => { if(confirm('¿Eliminar este producto?')) deleteProduct(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button></div>
                  </div>
                ))}</div>
                {editingProduct && <ProductForm />}
              </div>
            )}
            {activeTab === 'fairs' && (
              <div className="animate-fade-in">
                 <button onClick={() => setEditingFair({})} className="mb-6 flex items-center gap-2 bg-leather-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-leather-800 transition"><Plus size={20} /> Nueva Feria</button>
                 <div className="grid gap-4">{fairs.map(f => (
                   <div key={f.id} className="flex justify-between items-center border border-leather-100 p-4 rounded-lg hover:shadow-md transition bg-white">
                      <div>
                        <span className="font-bold text-leather-900 block">{f.name}</span>
                        <span className="text-sm text-leather-500">{f.date} - {f.city}</span>
                      </div>
                      <div className="flex gap-2"><button onClick={() => setEditingFair(f)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18}/></button><button onClick={() => { if(confirm('¿Eliminar esta feria?')) deleteFair(f.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button></div>
                   </div>
                 ))}</div>
                 {editingFair && (
                   <div className="fixed inset-0 bg-leather-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"><div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-leather-200">
                     <h3 className="text-2xl font-serif font-bold mb-6 text-leather-900">Editar Feria</h3>
                     <form onSubmit={(e) => { e.preventDefault(); const f = { ...editingFair, id: editingFair.id || Date.now().toString() } as Fair; if(editingFair.id) updateFair(f); else addFair(f); setEditingFair(null); }} className="space-y-4">
                       <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Nombre" value={editingFair.name || ''} onChange={e => setEditingFair({...editingFair, name: e.target.value})} />
                       <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" type="date" value={editingFair.date || ''} onChange={e => setEditingFair({...editingFair, date: e.target.value})} />
                       <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Ciudad" value={editingFair.city || ''} onChange={e => setEditingFair({...editingFair, city: e.target.value})} />
                       <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Ubicación" value={editingFair.location || ''} onChange={e => setEditingFair({...editingFair, location: e.target.value})} />
                       <textarea style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-24" placeholder="Descripción" value={editingFair.description || ''} onChange={e => setEditingFair({...editingFair, description: e.target.value})} />
                       <select style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" value={editingFair.status || 'upcoming'} onChange={e => setEditingFair({...editingFair, status: e.target.value as any})}><option value="upcoming">Próxima</option><option value="past">Pasada</option></select>
                       <div>
                         <label className="text-xs font-bold text-leather-700 mb-1 block">Imagen</label>
                         <label className="flex items-center gap-2 cursor-pointer bg-leather-50 border-2 border-dashed border-leather-300 rounded-lg p-3 hover:border-leather-500 transition-colors">
                           <Upload size={18} className="text-leather-500" /><span className="text-sm text-leather-600">Subir foto</span>
                           <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                             const file = e.target.files?.[0]; if (!file) return;
                             try { const url = await StorageService.uploadImage(file, 'fairs'); setEditingFair({...editingFair, imageUrl: url}); } catch { alert('Error al subir'); }
                           }} />
                         </label>
                         {editingFair.imageUrl && <img src={processImageUrl(editingFair.imageUrl, 100)} className="w-16 h-16 object-cover rounded mt-2" alt="" />}
                       </div>
                       <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingFair(null)} className="px-6 py-2 text-leather-600 font-bold">Cancelar</button><button type="submit" className="px-6 py-2 bg-leather-900 text-white rounded-lg font-bold">Guardar</button></div>
                     </form>
                   </div></div>
                 )}
              </div>
            )}
             {activeTab === 'blog' && (
               <div className="animate-fade-in">
                  <button onClick={() => setEditingBlog({})} className="mb-6 flex items-center gap-2 bg-leather-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-leather-800 transition"><Plus size={20} /> Nuevo Post</button>
                  <div className="grid gap-4">{blogPosts.map(p => (
                    <div key={p.id} className="flex justify-between items-center border border-leather-100 p-4 rounded-lg hover:shadow-md transition bg-white">
                       <span className="font-bold text-leather-900">{p.title}</span>
                       <div className="flex gap-2"><button onClick={() => setEditingBlog(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18}/></button><button onClick={() => { if(confirm('¿Eliminar este post?')) deleteBlogPost(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button></div>
                    </div>
                  ))}</div>
                  {editingBlog && (
                    <div className="fixed inset-0 bg-leather-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"><div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-leather-200">
                      <h3 className="text-2xl font-serif font-bold mb-6 text-leather-900">Editar Post</h3>
                      <form onSubmit={(e) => { e.preventDefault(); const b = { ...editingBlog, id: editingBlog.id || Date.now().toString(), excerpt: editingBlog.excerpt || (editingBlog.content || '').substring(0, 150) + '...', date: editingBlog.date || new Date().toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' }), readTime: editingBlog.readTime || `${Math.max(1, Math.ceil((editingBlog.content || '').split(' ').length / 200))} min lectura` } as BlogPost; if(editingBlog.id) updateBlogPost(b); else addBlogPost(b); setEditingBlog(null); }} className="space-y-4">
                        <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Título *" value={editingBlog.title || ''} onChange={e => setEditingBlog({...editingBlog, title: e.target.value})} required />
                        <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none text-sm" placeholder="Resumen corto (se genera automáticamente si lo dejás vacío)" value={editingBlog.excerpt || ''} onChange={e => setEditingBlog({...editingBlog, excerpt: e.target.value})} />
                        <textarea style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-32" placeholder="Contenido del artículo *" value={editingBlog.content || ''} onChange={e => setEditingBlog({...editingBlog, content: e.target.value})} required />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Autor" value={editingBlog.author || 'Mariela Calistro'} onChange={e => setEditingBlog({...editingBlog, author: e.target.value})} />
                          <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none text-sm" placeholder="Fecha (ej: 20 Mar 2025)" value={editingBlog.date || ''} onChange={e => setEditingBlog({...editingBlog, date: e.target.value})} />
                          <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none text-sm" placeholder="Tiempo lectura (ej: 3 min)" value={editingBlog.readTime || ''} onChange={e => setEditingBlog({...editingBlog, readTime: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-leather-700 mb-1 block">Imagen</label>
                          <label className="flex items-center gap-2 cursor-pointer bg-leather-50 border-2 border-dashed border-leather-300 rounded-lg p-3 hover:border-leather-500 transition-colors">
                            <Upload size={18} className="text-leather-500" /><span className="text-sm text-leather-600">Subir foto</span>
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return;
                              try { const url = await StorageService.uploadImage(file, 'blog'); setEditingBlog({...editingBlog, imageUrl: url}); } catch { alert('Error al subir'); }
                            }} />
                          </label>
                          {editingBlog.imageUrl && <img src={processImageUrl(editingBlog.imageUrl, 100)} className="w-16 h-16 object-cover rounded mt-2" alt="" />}
                          <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none mt-2 text-sm" placeholder="O pegar URL de imagen" value={editingBlog.imageUrl || ''} onChange={e => setEditingBlog({...editingBlog, imageUrl: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingBlog(null)} className="px-6 py-2 text-leather-600 font-bold">Cancelar</button><button type="submit" className="px-6 py-2 bg-leather-900 text-white rounded-lg font-bold">Guardar</button></div>
                      </form>
                    </div></div>
                  )}
               </div>
             )}
             {activeTab === 'history' && (
               <div className="animate-fade-in">
                  <button onClick={() => setEditingHistory({})} className="mb-6 flex items-center gap-2 bg-leather-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-leather-800 transition"><Plus size={20} /> Nuevo Hito</button>
                  <div className="grid gap-4">{history.map(p => (
                    <div key={p.id} className="flex justify-between items-center border border-leather-100 p-4 rounded-lg hover:shadow-md transition bg-white">
                       <span className="font-bold text-leather-900">{p.year} - {p.title}</span>
                       <div className="flex gap-2"><button onClick={() => setEditingHistory(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18}/></button><button onClick={() => { if(confirm('¿Eliminar este hito?')) deleteHistoryEvent(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button></div>
                    </div>
                  ))}</div>
                  {editingHistory && (
                    <div className="fixed inset-0 bg-leather-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"><div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-leather-200">
                      <h3 className="text-2xl font-serif font-bold mb-6 text-leather-900">Editar Historia</h3>
                      <form onSubmit={(e) => { e.preventDefault(); const h = { ...editingHistory, id: editingHistory.id || Date.now().toString() } as HistoryEvent; if(editingHistory.id) updateHistoryEvent(h); else addHistoryEvent(h); setEditingHistory(null); }} className="space-y-4">
                        <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Año" value={editingHistory.year || ''} onChange={e => setEditingHistory({...editingHistory, year: e.target.value})} />
                        <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="Título" value={editingHistory.title || ''} onChange={e => setEditingHistory({...editingHistory, title: e.target.value})} />
                        <textarea style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none h-24" placeholder="Descripción" value={editingHistory.description || ''} onChange={e => setEditingHistory({...editingHistory, description: e.target.value})} />
                        <input style={{backgroundColor: 'white'}} className="w-full !bg-white p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-leather-500 focus:outline-none" placeholder="URL Imagen" value={editingHistory.imageUrl || ''} onChange={e => setEditingHistory({...editingHistory, imageUrl: e.target.value})} />
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

// --- Missing Pages and Components ---

const CatalogPage = () => {
  const { products, currency, convertPrice, addToCart, categories } = useStore();
  const [filter, setFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { 
    window.scrollTo(0, 0); 
    document.title = "Tienda - MARIEL'LA";
  }, []);

  // Filter products by category AND search term (name or description)
  const filtered = products.filter(p => {
    const matchesCategory = filter === 'Todas' || p.category === filter;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-36 pb-24 bg-leather-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-serif font-bold text-leather-900 mb-8 text-center">Nuestra Colección</h1>
        
        {/* Search Input */}
        <div className="max-w-md mx-auto mb-8 relative">
          <input 
            type="text" 
            placeholder="Buscar por nombre o descripción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-leather-200 focus:border-leather-900 focus:ring-2 focus:ring-leather-100 transition-all outline-none bg-white shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-leather-400" size={20} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-leather-400 hover:text-leather-600">
              <XCircle size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-6 py-2 rounded-full font-bold transition-all border ${filter === cat ? 'bg-leather-900 text-white border-leather-900' : 'bg-white text-leather-900 border-leather-200 hover:border-leather-900'}`}>
              {cat}
            </button>
          ))}
        </div>
        
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filtered.map(product => (
              <div key={product.id} className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-leather-100 ${product.isSoldOut ? 'opacity-75' : ''}`}>
                <Link to={`/producto/${product.id}`} className="block relative aspect-square overflow-hidden">
                  <img src={processImageUrl(product.images[0], 400)} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${product.isSoldOut ? 'grayscale-[30%]' : ''}`} alt={product.name} loading="lazy" onError={handleImgError} />
                  {product.isSoldOut && <div className="absolute inset-0 flex items-center justify-center"><span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg uppercase tracking-wider">Agotado</span></div>}
                </Link>
                <div className="p-4">
                  <Link to={`/producto/${product.id}`}><h3 className="font-bold text-lg text-leather-900 mb-2">{product.name}</h3></Link>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${product.isSoldOut ? 'text-leather-400 line-through' : 'text-leather-600'}`}>{currency} {convertPrice(product.priceUYU).toLocaleString()}</span>
                    {!product.isSoldOut && <button onClick={() => addToCart(product)} className="p-2 bg-leather-50 rounded-full hover:bg-leather-900 hover:text-white transition-colors border border-leather-100" aria-label="Agregar al carrito"><ShoppingBag size={18} /></button>}
                  </div>
                </div>
              </div>
            ))}
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
  useEffect(() => { document.title = "Historia - MARIEL'LA"; }, []);
  return (
    <div className="pt-36 pb-24 bg-[#fdfbf7] min-h-screen relative">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <span className="text-leather-600 uppercase tracking-widest text-xs font-bold block mb-2">Desde 1998</span>
          <h1 className="text-5xl font-serif font-bold text-leather-900">Nuestra Trayectoria</h1>
        </div>
        
        <div className="relative">
          {/* Central Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-leather-300 hidden md:block"></div>
          
          <div className="space-y-24">
            {history.map((event, i) => (
              <div key={event.id} className={`flex flex-col md:flex-row gap-12 items-center ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-1 w-full text-center md:text-left">
                  <div className={`flex flex-col ${i % 2 !== 0 ? 'md:items-start' : 'md:items-end'} md:text-${i % 2 !== 0 ? 'left' : 'right'}`}>
                    <div className="inline-block relative p-4 mb-4 leather-patch rounded-lg transform -rotate-2">
                       <div className="absolute inset-1 stitch-border rounded-md pointer-events-none"></div>
                       <span className="text-2xl font-bold text-stitch font-serif relative z-10">{event.year}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-leather-900 mb-4 font-serif">{event.title}</h2>
                    <p className="text-leather-700 leading-relaxed font-medium text-lg">{event.description}</p>
                  </div>
                </div>
                
                {/* Timeline Dot */}
                <div className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-leather-900 border-4 border-[#fdfbf7] z-10 shadow-lg"></div>
                
                <div className="flex-1 w-full">
                  <div className="relative aspect-[4/3] bg-white p-3 shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-500 border border-leather-200 rounded-sm">
                     <img src={processImageUrl(event.imageUrl, 800)} className="w-full h-full object-cover" alt={event.title} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
           <p className="text-2xl font-serif text-leather-900 italic">"La historia no termina aquí, cada pieza que entregamos escribe un nuevo capítulo."</p>
        </div>
      </div>
    </div>
  );
};

const FairsPage = () => {
  const { fairs } = useStore();
  const upcoming = fairs.filter(f => f.status === 'upcoming');
  const past = fairs.filter(f => f.status === 'past');
  useEffect(() => { document.title = "Ferias - MARIEL'LA"; }, []);

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
                    <div className="text-3xl font-bold text-leather-900">{new Date(fair.date).getDate()}</div>
                    <div className="text-sm uppercase font-bold text-leather-500">{new Date(fair.date).toLocaleString('es-ES', { month: 'long' })}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-leather-900 mb-2">{fair.name}</h3>
                    <p className="text-leather-600 mb-2 flex items-center gap-2 font-medium"><MapPin size={16} /> {fair.city} - {fair.location}</p>
                    <p className="text-sm text-leather-700">{fair.description}</p>
                  </div>
                  {fair.mapsUrl && <a href={fair.mapsUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-2 border border-leather-900 text-leather-900 rounded-full font-bold hover:bg-leather-900 hover:text-white transition">Ver Mapa</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-leather-900 mb-8 border-b border-leather-100 pb-2">Eventos Pasados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {past.map(fair => (
              <div key={fair.id} className="bg-white border border-leather-200 p-6 rounded-xl opacity-75 hover:opacity-100 transition hover:shadow-md">
                <h3 className="font-bold text-leather-900 text-lg">{fair.name}</h3>
                <p className="text-sm text-leather-500 mb-3 font-bold uppercase">{new Date(fair.date).getFullYear()} • {fair.city}</p>
                <p className="text-sm text-leather-600 line-clamp-2">{fair.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();
  useEffect(() => { document.title = "Acceso Admin - MARIEL'LA"; }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/admin');
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-leather-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full border border-leather-100">
        <h1 className="text-2xl font-bold text-center mb-6 text-leather-900">Acceso Admin</h1>
        <input 
          style={{backgroundColor: 'white'}}
          type="password" 
          value={password} 
          onChange={e => { setPassword(e.target.value); setError(false); }} 
          className="w-full !bg-white p-3 rounded-lg mb-4 focus:ring-2 focus:ring-leather-500 focus:outline-none border border-gray-300 text-leather-900"
          placeholder="Contraseña"
        />
        {error && <p className="text-red-500 text-sm mb-4 text-center font-bold">Contraseña incorrecta</p>}
        <button type="submit" className="w-full bg-leather-900 text-white py-3 rounded-lg font-bold hover:bg-leather-800 transition">Ingresar</button>
      </form>
    </div>
  );
};

const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { cart, removeFromCart, updateCartQuantity, currency, setCurrency, convertPrice } = useStore();
  const total = cart.reduce((sum, item) => sum + convertPrice(item.priceUYU) * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    let message = "Hola MARIEL'LA, me gustaría realizar el siguiente pedido:\n\n";
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} (${currency} ${convertPrice(item.priceUYU)})\n`;
    });
    message += `\nTotal: ${currency} ${total}`;
    const whatsappUrl = `https://wa.me/59898766318?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-6 flex flex-col animate-slide-in-right">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-bold text-leather-900">Tu Carrito</h2>
          <button onClick={onClose} className="p-2 hover:bg-leather-50 rounded-full text-leather-900"><X /></button>
        </div>
        {/* Currency Toggle */}
        <div className="flex items-center gap-2 mb-6 bg-leather-50 rounded-lg p-1 self-start border border-leather-100">
          <button onClick={() => setCurrency('UYU')} className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${currency === 'UYU' ? 'bg-leather-900 text-white shadow-sm' : 'text-leather-600 hover:text-leather-900'}`}>UYU</button>
          <button onClick={() => setCurrency('USD')} className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${currency === 'USD' ? 'bg-leather-900 text-white shadow-sm' : 'text-leather-600 hover:text-leather-900'}`}>USD</button>
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
              <img src={processImageUrl(item.images[0], 100)} className="w-20 h-20 object-cover rounded-lg border border-leather-100" alt={item.name} />
              <div className="flex-1">
                <h3 className="font-bold text-leather-900 text-sm leading-tight">{item.name}</h3>
                <p className="text-leather-600 font-bold mt-1">{currency} {convertPrice(item.priceUYU).toLocaleString()}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-leather-100 rounded-full hover:bg-leather-200 text-leather-800 transition"><Minus size={14} /></button>
                  <span className="font-bold text-leather-900 min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-leather-100 rounded-full hover:bg-leather-200 text-leather-800 transition"><Plus size={14} /></button>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 self-start p-1 transition"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-leather-200 pt-6 mt-4">
            <div className="flex justify-between text-xl font-bold text-leather-900 mb-2">
              <span>Total</span>
              <span>{currency} {total.toLocaleString()}</span>
            </div>
            <p className="text-xs text-leather-500 mb-6 flex items-center gap-1"><Truck size={14} /> Envíos a todo Uruguay</p>
            <button onClick={handleCheckout} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold hover:bg-[#128C7E] transition shadow-lg flex items-center justify-center gap-2 active:scale-95 transform">
              <MessageCircle size={24} className="fill-white" /> Finalizar en WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-leather-900 text-leather-300 py-16 border-t border-leather-800">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div className="md:col-span-1">
        <h3 className="text-white font-serif font-bold text-2xl mb-4">MARIEL'LA</h3>
        <p className="text-sm font-medium leading-relaxed mb-4">Artesanía en cuero con identidad uruguaya. Cada pieza cuenta una historia de tradición y pasión.</p>
        <div className="flex gap-4 mt-4">
          <a href="https://www.instagram.com/mariellacalistro/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-leather-800 flex items-center justify-center hover:bg-leather-700 transition-colors"><Instagram size={18} className="text-leather-200" /></a>
          <a href="https://wa.me/59898766318" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-leather-800 flex items-center justify-center hover:bg-[#25D366] transition-colors"><MessageCircle size={18} className="text-leather-200" /></a>
        </div>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Tienda</h4>
        <ul className="space-y-3 text-sm font-medium">
          <li><Link to="/catalogo" className="hover:text-white transition-colors">Colección</Link></li>
          <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
          <li><Link to="/ferias" className="hover:text-white transition-colors">Ferias</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Contacto</h4>
        <ul className="space-y-3 text-sm font-medium">
          <li className="flex items-center gap-2"><Phone size={14} /> +598 98 766 318</li>
          <li className="flex items-center gap-2"><MapPin size={14} /> Montevideo, Uruguay</li>
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
      <p className="text-leather-500">Artesanía en cuero uruguaya desde 1998</p>
    </div>
  </footer>
);

// --- 404 Page ---
const NotFoundPage = () => {
  useEffect(() => { document.title = "Página no encontrada - MARIEL'LA"; }, []);
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
      <StoreProvider>
        <HashRouter>
          <GlobalStyles />
          <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          <Navbar toggleCart={toggleCart} />
          <FloatingWhatsApp />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/historia" element={<HistoryPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogPage />} />
              <Route path="/ferias" element={<FairsPage />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </HashRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
};

export default App;
