/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  User, 
  Sparkles, 
  ChevronRight, 
  Filter,
  ExternalLink,
  Shirt,
  Watch,
  Droplets,
  Menu,
  X,
  Plus,
  Edit2,
  Trash2,
  Settings,
  PlusCircle,
  Upload,
  ArrowUpRight,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Product {
  id: string;
  name: string;
  category: 'outfit' | 'accessories' | 'grooming';
  subcategory: string;
  price: string;
  image: string;
  link: string;
  description: string;
  tags: string[];
}

// Mock Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Oversized Heavyweight Tee',
    category: 'outfit',
    subcategory: 'baju',
    price: 'Rp 149.000',
    image: 'https://picsum.photos/seed/tee/400/500',
    link: 'https://example.com/product/1',
    description: 'Bahan katun 24s tebal, nyaman dipakai seharian.',
    tags: ['minimalist', 'streetwear']
  },
  {
    id: '2',
    name: 'Slim Fit Chino Pants',
    category: 'outfit',
    subcategory: 'celana',
    price: 'Rp 299.000',
    image: 'https://picsum.photos/seed/chino/400/500',
    link: 'https://example.com/product/2',
    description: 'Celana chino dengan potongan slim fit yang modern.',
    tags: ['formal', 'casual']
  },
  {
    id: '3',
    name: 'Classic Silver Watch',
    category: 'accessories',
    subcategory: 'jam tangan',
    price: 'Rp 1.250.000',
    image: 'https://picsum.photos/seed/watch/400/500',
    link: 'https://example.com/product/3',
    description: 'Jam tangan stainless steel dengan desain timeless.',
    tags: ['luxury', 'essential']
  },
  {
    id: '4',
    name: 'Leather Bi-fold Wallet',
    category: 'accessories',
    subcategory: 'tas',
    price: 'Rp 185.000',
    image: 'https://picsum.photos/seed/wallet/400/500',
    link: 'https://example.com/product/4',
    description: 'Dompet kulit asli dengan banyak slot kartu.',
    tags: ['leather', 'daily']
  },
  {
    id: '5',
    name: 'Matte Clay Hair Wax',
    category: 'grooming',
    subcategory: 'rambut',
    price: 'Rp 85.000',
    image: 'https://picsum.photos/seed/hair/400/500',
    link: 'https://example.com/product/5',
    description: 'Memberikan tekstur matte dan hold yang kuat.',
    tags: ['haircare', 'styling']
  },
  {
    id: '6',
    name: 'Hydrating Face Wash',
    category: 'grooming',
    subcategory: 'wajah',
    price: 'Rp 65.000',
    image: 'https://picsum.photos/seed/face/400/500',
    link: 'https://example.com/product/6',
    description: 'Pembersih wajah yang lembut dan melembabkan.',
    tags: ['skincare', 'daily']
  },
  {
    id: '7',
    name: 'Denim Trucker Jacket',
    category: 'outfit',
    subcategory: 'jaket',
    price: 'Rp 450.000',
    image: 'https://picsum.photos/seed/jacket/400/500',
    link: 'https://example.com/product/7',
    description: 'Jaket denim klasik untuk tampilan rugged.',
    tags: ['outerwear', 'classic']
  },
  {
    id: '8',
    name: 'Minimalist Sunglasses',
    category: 'accessories',
    subcategory: 'topi',
    price: 'Rp 120.000',
    image: 'https://picsum.photos/seed/shades/400/500',
    link: 'https://example.com/product/8',
    description: 'Kacamata hitam dengan proteksi UV400.',
    tags: ['summer', 'style']
  }
];

const SUBCATEGORIES: Record<string, string[]> = {
  outfit: ['baju', 'jaket', 'sweater', 'celana', 'sepatu', 'dll'],
  accessories: ['jam tangan', 'cincin', 'kalung', 'tas', 'topi', 'anting', 'dll'],
  grooming: ['rambut', 'wajah', 'kulit', 'badan', 'dll']
};

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | Product['category']>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [displayedRecommendation, setDisplayedRecommendation] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesSubcategory = activeSubcategory === 'all' || product.subcategory === activeSubcategory;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [searchQuery, activeCategory, activeSubcategory, products]);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (editingProduct.id) {
      // Update
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct as Product : p));
    } else {
      // Create
      const newProduct: Product = {
        ...editingProduct as Product,
        id: Date.now().toString(),
        tags: editingProduct.tags || [],
      };
      setProducts([newProduct, ...products]);
    }
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  const openAddModal = () => {
    setEditingProduct({
      name: '',
      price: 'Rp ',
      category: 'outfit',
      subcategory: 'baju',
      image: 'https://picsum.photos/seed/' + Math.random() + '/400/500',
      link: '#',
      description: '',
      tags: []
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  // Inactivity timeout (5 minutes)
  useEffect(() => {
    if (!isAdminMode) return;

    let timeoutId: number;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setIsAdminMode(false);
        // Optional: show a small notification or just let them re-auth when they try to click something
      }, 5 * 60 * 1000); // 5 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAdminMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (editingProduct) {
          setEditingProduct({
            ...editingProduct,
            image: reader.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminToggle = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      setIsAuthModalOpen(true);
      setAuthInput('');
      setAuthError(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (authInput === '230701') {
      setIsAdminMode(true);
      setIsAuthModalOpen(false);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleAiRecommendation = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) return;
    
    setIsAiLoading(true);
    setAiRecommendation(null);
    setDisplayedRecommendation('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Kamu adalah asisten fashion pria untuk brand "씨발" (SSIBAL). 
        User bertanya: "${promptToUse}"
        Berdasarkan katalog kami (Outfit, Aksesoris, Perawatan), berikan saran singkat, stylish, dan to-the-point (maksimal 2-3 kalimat). 
        Gunakan nada bicara yang cool, maskulin, dan sedikit 'edgy' tapi tetap sopan. 
        Jangan gunakan emoji yang berlebihan.`
      });
      const text = response.text || "Maaf, saya tidak bisa memberikan saran saat ini.";
      setAiRecommendation(text);
    } catch (error) {
      console.error("AI Error:", error);
      setAiRecommendation("Gagal terhubung dengan AI. Coba lagi nanti.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Typing effect for AI recommendation
  useEffect(() => {
    if (aiRecommendation) {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayedRecommendation(aiRecommendation.slice(0, i + 1));
        i++;
        if (i >= aiRecommendation.length) clearInterval(timer);
      }, 20);
      return () => clearInterval(timer);
    }
  }, [aiRecommendation]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-white selection:text-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tighter italic">씨발</h1>
              <span className="text-[10px] uppercase tracking-widest opacity-50 border border-white/20 px-1.5 py-0.5 rounded">SSIBAL</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => setActiveCategory('all')} className={cn("text-sm font-medium transition-colors", activeCategory === 'all' ? "text-white" : "text-white/50 hover:text-white")}>Semua</button>
              <button onClick={() => setActiveCategory('outfit')} className={cn("text-sm font-medium transition-colors", activeCategory === 'outfit' ? "text-white" : "text-white/50 hover:text-white")}>Outfit</button>
              <button onClick={() => setActiveCategory('accessories')} className={cn("text-sm font-medium transition-colors", activeCategory === 'accessories' ? "text-white" : "text-white/50 hover:text-white")}>Aksesoris</button>
              <button onClick={() => setActiveCategory('grooming')} className={cn("text-sm font-medium transition-colors", activeCategory === 'grooming' ? "text-white" : "text-white/50 hover:text-white")}>Perawatan</button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={handleAdminToggle}
                className={cn(
                  "p-2 rounded-full transition-all",
                  isAdminMode ? "bg-white text-black" : "hover:bg-white/5 text-white/50"
                )}
                title={isAdminMode ? "Keluar Mode Admin" : "Masuk Mode Admin"}
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Cari produk..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 transition-all w-48 lg:w-64"
                />
              </div>
              <button className="md:hidden p-2 hover:bg-white/5 rounded-full transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-[#0A0A0A]"
            >
              <div className="px-4 py-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Cari produk..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => {setActiveCategory('all'); setIsMenuOpen(false)}} className="p-3 text-left bg-white/5 rounded-xl text-sm">Semua</button>
                  <button onClick={() => {setActiveCategory('outfit'); setIsMenuOpen(false)}} className="p-3 text-left bg-white/5 rounded-xl text-sm">Outfit</button>
                  <button onClick={() => {setActiveCategory('accessories'); setIsMenuOpen(false)}} className="p-3 text-left bg-white/5 rounded-xl text-sm">Aksesoris</button>
                  <button onClick={() => {setActiveCategory('grooming'); setIsMenuOpen(false)}} className="p-3 text-left bg-white/5 rounded-xl text-sm">Perawatan</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-transparent p-8 md:p-16 border border-white/10">
            <div className="relative z-10 max-w-2xl">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-none"
              >
                SPILL THE <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">ESSENTIALS.</span>
              </motion.h2>
              <p className="text-white/60 text-lg mb-8 max-w-md">
                Katalog pilihan produk pria terbaik. Dari outfit harian hingga perawatan diri yang bikin lo makin pede.
              </p>
              
              {/* Style Assistant Section */}
              <div className="relative mt-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-3xl blur opacity-25" />
                <div className="relative bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Style Concierge</span>
                    </div>
                    {isAiLoading && (
                      <div className="flex gap-1">
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-white rounded-full" />
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-white rounded-full" />
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-white rounded-full" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="Lagi cari style apa hari ini?" 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiRecommendation()}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                    />
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAiRecommendation()}
                      disabled={isAiLoading || !aiPrompt.trim()}
                      className="bg-white text-black px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Tanya
                    </motion.button>
                  </div>

                  {/* Suggested Prompts */}
                  {!aiRecommendation && !isAiLoading && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        "Style buat kencan pertama",
                        "Outfit kantor yang santai",
                        "Rekomendasi skincare harian",
                        "Aksesoris buat kondangan"
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setAiPrompt(suggestion);
                            handleAiRecommendation(suggestion);
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all text-white/40 hover:text-white"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {displayedRecommendation && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative mt-4 p-5 bg-white/[0.03] rounded-xl border border-white/5 group"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-white/20 rounded-full" />
                        <p className="text-sm leading-relaxed text-white/80 font-medium italic">
                          "{displayedRecommendation}"
                        </p>
                        <button 
                          onClick={() => {
                            setAiRecommendation(null);
                            setDisplayedRecommendation('');
                            setAiPrompt('');
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <X className="w-3 h-3 text-white/40" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Category Filters */}
        <div className="space-y-6 mb-12">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {['all', 'outfit', 'accessories', 'grooming'].map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveCategory(cat as any);
                  setActiveSubcategory('all');
                }}
                className={cn(
                  "px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest border transition-all duration-300",
                  activeCategory === cat 
                    ? "bg-white text-black border-white shadow-[0_10px_20px_-10px_rgba(255,255,255,0.3)]" 
                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white"
                )}
              >
                {cat === 'all' ? 'Semua Produk' : cat}
              </motion.button>
            ))}
          </div>

          {activeCategory !== 'all' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2"
            >
              <button
                onClick={() => setActiveSubcategory('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                  activeSubcategory === 'all'
                    ? "bg-white/20 text-white border-white/30"
                    : "bg-white/5 text-white/30 border-white/5 hover:border-white/20 hover:text-white/60"
                )}
              >
                Semua {activeCategory}
              </button>
              {SUBCATEGORIES[activeCategory].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                    activeSubcategory === sub
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-white/5 text-white/30 border-white/5 hover:border-white/20 hover:text-white/60"
                  )}
                >
                  {sub}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold tracking-tight">Katalog Produk</h3>
          {isAdminMode && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAddModal}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-bold text-sm"
            >
              <PlusCircle className="w-4 h-4" /> Tambah Produk
            </motion.button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col h-full"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-white/[0.02] border border-white/10 mb-5 relative transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
                <img 
                  src={product.image} 
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 max-w-[calc(100%-2rem)]">
                  <span className="bg-black/80 backdrop-blur-md text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-lg border border-white/10 shadow-xl">
                    {product.category}
                  </span>
                  <span className="bg-white/10 backdrop-blur-md text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-lg border border-white/5 text-white/70 shadow-xl">
                    {product.subcategory}
                  </span>
                </div>

                {/* Admin Actions */}
                {isAdminMode && (
                  <div className="absolute top-4 right-4 z-20 flex gap-1.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                      className="p-2 bg-white text-black rounded-xl hover:bg-white/90 transition-all shadow-xl active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product); }}
                      className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-xl active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                
                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end p-6">
                  <motion.a 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    href={product.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-white text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                  >
                    <Plus className="w-4 h-4" /> Beli Sekarang
                  </motion.a>
                </div>
              </div>

              <div className="flex flex-col flex-1 px-1">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-black text-xl tracking-tighter leading-none group-hover:text-white transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="pt-1">
                    <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>
                </div>
                
                <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-white font-mono text-lg font-black tracking-tighter">
                    {product.price}
                  </span>
                  <div className="flex gap-1">
                    {product.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[8px] uppercase tracking-widest text-white/20">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Auth Modal */}
        <AnimatePresence>
          {isAuthModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-black tracking-tighter">Admin Access</h2>
                  <p className="text-white/40 text-xs mt-1 uppercase tracking-widest">Masukkan Kode Akses</p>
                </div>
                
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <input 
                    autoFocus
                    type="password" 
                    placeholder="••••••"
                    value={authInput}
                    onChange={(e) => {
                      setAuthInput(e.target.value);
                      setAuthError(false);
                    }}
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none transition-all",
                      authError ? "border-red-500 text-red-500" : "border-white/10 focus:border-white/30"
                    )}
                  />
                  {authError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[10px] uppercase tracking-widest text-center font-bold"
                    >
                      Kode Akses Salah
                    </motion.p>
                  )}
                  <button 
                    type="submit"
                    className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors mt-2"
                  >
                    Verifikasi
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAuthModalOpen(false)}
                    className="w-full text-white/40 text-[10px] uppercase tracking-widest font-bold hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit/Add Modal */}
        <AnimatePresence>
          {isEditModalOpen && editingProduct && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 border-b border-white/5">
                  <h2 className="text-2xl font-black tracking-tighter">
                    {editingProduct.id ? `Edit: ${editingProduct.name}` : 'Tambah Produk Baru'}
                  </h2>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar">
                  <form onSubmit={handleSaveProduct} className="space-y-6">
                    <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Nama Produk</label>
                    <input 
                      required
                      type="text" 
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Harga</label>
                      <input 
                        required
                        type="text" 
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Kategori</label>
                      <select 
                        value={editingProduct.category}
                        onChange={(e) => {
                          const newCat = e.target.value as any;
                          setEditingProduct({
                            ...editingProduct, 
                            category: newCat,
                            subcategory: SUBCATEGORIES[newCat][0]
                          });
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30 appearance-none"
                      >
                        <option value="outfit">Outfit</option>
                        <option value="accessories">Aksesoris</option>
                        <option value="grooming">Perawatan</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Sub-Kategori</label>
                    <select 
                      value={editingProduct.subcategory}
                      onChange={(e) => setEditingProduct({...editingProduct, subcategory: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30 appearance-none"
                    >
                      {editingProduct.category && SUBCATEGORIES[editingProduct.category].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Foto Produk</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden relative group">
                        {editingProduct.image ? (
                          <img 
                            src={editingProduct.image} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-[10px] uppercase tracking-widest">No Preview</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center gap-3">
                        <label className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-2">
                          <Upload className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Upload dari Galeri</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Atau masukkan URL foto..." 
                            value={editingProduct.image}
                            onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] focus:outline-none focus:border-white/30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Link Produk (Shopee/Tokopedia/dll)</label>
                    <input 
                      required
                      type="text" 
                      value={editingProduct.link}
                      onChange={(e) => setEditingProduct({...editingProduct, link: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Deskripsi</label>
                    <textarea 
                      required
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30 h-24 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {productToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProductToDelete(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-black tracking-tighter mb-2">Hapus Produk?</h2>
                <p className="text-white/40 text-sm mb-8">
                  Apakah Anda yakin ingin menghapus <span className="text-white font-bold">"{productToDelete.name}"</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setProductToDelete(null)}
                    className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg">Tidak ada produk yang ditemukan.</p>
            <button 
              onClick={() => {setSearchQuery(''); setActiveCategory('all')}}
              className="mt-4 text-white underline underline-offset-4 hover:text-white/80"
            >
              Reset filter
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h1 className="text-3xl font-black tracking-tighter italic">씨발</h1>
                <span className="text-[10px] uppercase tracking-widest opacity-50">Est. 2024</span>
              </div>
              <p className="text-white/40 text-sm max-w-xs">
                Kurasi produk pria terbaik untuk gaya hidup modern. Kualitas tanpa kompromi.
              </p>
            </div>
            <div className="flex gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/30">Kategori</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => setActiveCategory('outfit')} className="hover:text-white text-white/60 transition-colors">Outfit</button></li>
                  <li><button onClick={() => setActiveCategory('accessories')} className="hover:text-white text-white/60 transition-colors">Aksesoris</button></li>
                  <li><button onClick={() => setActiveCategory('grooming')} className="hover:text-white text-white/60 transition-colors">Perawatan</button></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/30">Socials</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white text-white/60 transition-colors">Instagram</a></li>
                  <li><a href="#" className="hover:text-white text-white/60 transition-colors">TikTok</a></li>
                  <li><a href="#" className="hover:text-white text-white/60 transition-colors">Twitter</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-white/20">
            <p>© 2024 SSIBAL CATALOG. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
