import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Search, Loader2, Star, CheckCircle, AlertTriangle, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Extract category from URL query parameters (e.g. ?category=Windows)
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
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleOrderNow = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/checkout');
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
      prod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = maxPrice ? parseFloat(prod.price) <= parseFloat(maxPrice) : true;
    const matchesCategory = selectedCategory === 'All' ||
      (prod.category_name && prod.category_name.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesPrice && matchesCategory;
  });

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-800 py-10 text-left">
      <div className="max-w-full mx-auto px-4 sm:px-6">

        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Browse our premium genuine keys, license certificates, and digital topups.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search keys, apps, subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 focus:border-blue-600 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all"
            />
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3 justify-end">
            <div className="relative flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-1 text-sm text-slate-500 w-full md:w-48">
              <span className="text-slate-400 mr-1.5">Max: ৳</span>
              <input
                type="number"
                placeholder="Price limit"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-slate-800 w-full placeholder-slate-400 text-sm py-1.5"
              />
            </div>

            <button
              onClick={() => { setSearchTerm(''); setMaxPrice(''); handleCategorySelect('All'); }}
              className="text-xs text-slate-500 hover:text-slate-900 underline transition-colors shrink-0 font-medium cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar Filters */}
          <div className="w-full md:w-64 shrink-0 text-left">
            {/* Mobile Categories Tags Scroll */}
            <div className="md:hidden mb-6">
              <span className="text-xxs font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                Categories
              </span>
              <div className="flex flex-row overflow-x-auto gap-2 pb-2 scrollbar-none snap-x scroll-smooth">
                <button
                  onClick={() => handleCategorySelect('All')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap snap-start transition-all cursor-pointer ${selectedCategory === 'All'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800'
                    }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap snap-start transition-all cursor-pointer ${selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block bg-white border border-slate-200/80 p-5 rounded-2xl sticky top-24 shadow-xs text-slate-700">
              <span className="text-xxs font-bold uppercase tracking-wider text-slate-400 block mb-4 px-1">
                Product Categories
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleCategorySelect('All')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${selectedCategory === 'All'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <span>All Products</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold transition-colors ${selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'
                    }`}>
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
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-650 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'
                        }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Products Column */}
          <div className="flex-1">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-655 font-medium bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <span>{error}</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-slate-400 bg-white border border-slate-200/85 rounded-2xl shadow-xs">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-sm font-bold text-slate-700">No products found.</p>
                <p className="text-xxs text-slate-500 mt-1">Try resetting your filters or selecting another category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => {
                  const currentPrice = parseFloat(prod.price);
                  const isOutOfStock = prod.stock === 0;

                  // Real original price and discount percent if specified
                  const hasDiscount = prod.discount_percent !== null && prod.discount_percent !== undefined && parseInt(prod.discount_percent) > 0;
                  const discountPercent = hasDiscount ? parseInt(prod.discount_percent) : 0;
                  const originalPrice = hasDiscount ? (currentPrice / (1 - discountPercent / 100)) : 0;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleProductClick(prod.id)}
                      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer group shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative"
                    >
                      {/* Discount Badge */}
                      {!isOutOfStock && hasDiscount && (
                        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                          -{discountPercent}%
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <span className="text-slate-450 text-xs font-bold uppercase tracking-wider">No Image</span>
                        )}

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center">
                            <span className="px-3 py-1 bg-red-100 text-red-655 border border-red-200 text-xs font-bold rounded-full">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Details */}
                      <div className="p-4 flex-1 flex flex-col text-left">
                        <h3 className="text-sm font-extrabold text-slate-800 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                          {prod.name}
                        </h3>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 mt-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-450 text-amber-450" />
                          ))}
                        </div>

                        {/* Stock status */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <CheckCircle className={`w-3.5 h-3.5 ${isOutOfStock ? 'text-slate-350' : 'text-emerald-500'}`} />
                          <span className={`text-[11px] font-bold ${isOutOfStock ? 'text-slate-500' : 'text-emerald-600'}`}>
                            {isOutOfStock ? 'Out of stock' : 'In stock'}
                          </span>
                        </div>

                        {/* Pricing */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline gap-2">
                          <span className="text-sm font-extrabold text-blue-600">
                            {currentPrice.toFixed(2)}৳
                          </span>
                          {!isOutOfStock && hasDiscount && (
                            <span className="text-xs text-slate-400 line-through">
                              {originalPrice.toFixed(2)}৳
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="mt-4 w-full py-2.5 text-xs font-bold rounded-xl text-center bg-slate-100 text-slate-400 cursor-not-allowed"
                          >
                            Out of Stock
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <button
                              onClick={(e) => handleAddToCart(e, prod)}
                              className="bg-slate-900 hover:bg-slate-950 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" /> Cart
                            </button>
                            <button
                              onClick={(e) => handleOrderNow(e, prod)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                            >
                              Buy
                            </button>
                          </div>
                        )}
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
