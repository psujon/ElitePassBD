import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Search, Loader2, Star, ShoppingBag, ShoppingCart, AlertTriangle, ChevronDown, Tag, Sparkles, Monitor, Briefcase, Laptop, ShieldCheck, Lock, Layers } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import { trackEvent } from '../utils/fbPixel';

const getProductDisplayPrice = (prod) => {
  if (!prod) return 0;
  if (prod.packages && prod.packages.length > 0) {
    const prices = prod.packages.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
    if (prices.length > 0) {
      return Math.min(...prices);
    }
  }
  return parseFloat(prod.price) || 0;
};

const getCategoryIcon = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('ai')) return <Sparkles className="w-4 h-4 text-purple-600" />;
  if (lower.includes('window')) return <Monitor className="w-4 h-4 text-blue-600" />;
  if (lower.includes('office')) return <Briefcase className="w-4 h-4 text-amber-600" />;
  if (lower.includes('soft') || lower.includes('dev')) return <Laptop className="w-4 h-4 text-emerald-600" />;
  if (lower.includes('sub') || lower.includes('pass')) return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
  if (lower.includes('vpn') || lower.includes('security')) return <Lock className="w-4 h-4 text-rose-600" />;
  return <Layers className="w-4 h-4 text-violet-600" />;
};

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category');
    if (catParam) {
      setSelectedCategory(catParam);
    } else {
      setSelectedCategory('All');
    }
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories')
      ]);
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch store data.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const success = addToCart(product, 1);
    if (success) {
      const priceToUse = getProductDisplayPrice(product);
      trackEvent('AddToCart', {
        content_ids: [String(product.id)],
        content_name: product.name,
        content_type: 'product',
        value: priceToUse,
        currency: 'BDT',
        contents: [{
          id: String(product.id),
          quantity: 1,
          item_price: priceToUse
        }]
      });
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    if (catName === 'All') {
      navigate('/products');
    } else {
      navigate(`/products?category=${encodeURIComponent(catName)}`);
    }
  };

  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' ||
      (prod.category_name && prod.category_name.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = getProductDisplayPrice(a);
    const priceB = getProductDisplayPrice(b);
    if (sortOrder === 'price-asc') return priceA - priceB;
    if (sortOrder === 'price-desc') return priceB - priceA;
    if (sortOrder === 'popular') return (b.id % 5) - (a.id % 5);
    return b.id - a.id; // latest
  });

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-800 py-8 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6">

        <div className="flex flex-col lg:flex-row gap-6">

          <div className="w-full lg:w-64 shrink-0 text-left">

            {/* Mobile Category Dropdown Select */}
            <div className="lg:hidden w-full mb-6">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-violet-600 shadow-2xs cursor-pointer"
              >
                <option value="All">All Categories ({products.length})</option>
                {categories.map((cat) => {
                  const count = products.filter(p => p.category_name && p.category_name.toLowerCase() === cat.name.toLowerCase()).length;
                  return (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="hidden lg:block bg-white/80 backdrop-blur-xl border border-white/90 p-4 rounded-3xl sticky top-24 shadow-xl shadow-purple-500/5 text-slate-700 text-left">
              <div className="flex items-center gap-2 mb-4 px-1 pb-2 border-b border-slate-100">
                <span className="w-1.5 h-4 bg-violet-600 rounded-full"></span>
                <span className="text-sm font-black text-slate-900">Category</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleCategorySelect('All')}
                  className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${selectedCategory === 'All'
                    ? 'bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-violet-500/15 text-violet-700 border border-violet-200/80 shadow-2xs'
                    : 'bg-white/90 hover:bg-slate-50 text-slate-700 border border-slate-200/70 shadow-2xs'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedCategory === 'All' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span>All</span>
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                    {products.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = products.filter(p => p.category_name && p.category_name.toLowerCase() === cat.name.toLowerCase()).length;
                  const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.name)}
                      className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${isActive
                        ? 'bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-violet-500/15 text-violet-700 border border-violet-200/80 shadow-2xs'
                        : 'bg-white/90 hover:bg-slate-50 text-slate-700 border border-slate-200/70 shadow-2xs'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {getCategoryIcon(cat.name)}
                        </div>
                        <span>{cat.name}</span>
                      </div>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6">

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search Products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200/80 rounded-full px-4 py-2.5 pl-10 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:border-violet-500"
                />
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>

              <div className="w-full sm:w-auto flex justify-end">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-white border border-slate-200/80 rounded-full px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="latest">Latest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-650 font-medium bg-red-50 border border-red-200 rounded-3xl flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <span>{error}</span>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-20 text-slate-400 bg-white border border-slate-200/85 rounded-3xl shadow-xs">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-sm font-bold text-slate-700">No Products Found</p>
                <p className="text-xs text-slate-400 mt-1">Enter a keyword to search for or change the category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {sortedProducts.map((prod, idx) => {
                  const currentPrice = getProductDisplayPrice(prod);
                  const isOutOfStock = prod.stock === 0;
                  const hasDiscount = prod.discount_percent && parseFloat(prod.discount_percent) > currentPrice;
                  const originalPrice = hasDiscount ? parseFloat(prod.discount_percent) : 0;
                  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

                  const badgeLabels = ['✨ New', '⭐ Premium', '🔥 Trending', '💥 Sale'];
                  const statusBadge = badgeLabels[idx % badgeLabels.length];

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleProductClick(prod.id)}
                      className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden flex flex-col h-full shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer text-left relative"
                    >
                      <div className="relative w-full aspect-square bg-gradient-to-br from-purple-50/70 via-indigo-50/50 to-blue-50/60 flex items-center justify-center overflow-hidden border-b border-slate-100">
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                          {hasDiscount ? (
                            <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
                              -{discountPercent}% OFF
                            </span>
                          ) : <div></div>}

                          {(prod.is_instant === 1 || prod.activation_process === 'Instant') && (
                            <span className="bg-emerald-600/95 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                              ⚡ Instant
                            </span>
                          )}
                        </div>

                        <div className="relative w-full h-full bg-white flex items-center justify-center overflow-hidden">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase">No Image</span>
                          )}

                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-20">
                              <span className="px-2.5 py-1 bg-red-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 flex flex-col justify-between flex-1">
                        <h4 className="text-xs font-black text-slate-900 line-clamp-2 min-h-[2.7rem] leading-tight group-hover:text-violet-600 transition-colors">
                          {prod.name}
                        </h4>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-sm sm:text-base font-black text-slate-900">
                              ৳{currentPrice.toFixed(0)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-slate-400 font-bold line-through block -mt-0.5">
                                ৳{originalPrice.toFixed(0)}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleAddToCart(e, prod)}
                            disabled={isOutOfStock}
                            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 disabled:opacity-40"
                            title="Add to Cart"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
