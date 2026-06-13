import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { Search, SlidersHorizontal, Loader2, X, ShoppingBag, Star, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Categories state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [latestReviews, setLatestReviews] = useState([]);

  const { addToCart } = useCart();

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  useEffect(() => {
    fetchProducts();
    fetchLatestReviews();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/products/categories');
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchLatestReviews = async () => {
    try {
      const data = await api.get('/products/reviews/latest');
      setLatestReviews(data);
    } catch (err) {
      console.error('Failed to fetch latest global reviews:', err);
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation(); // Avoid triggering details navigation if we implement one
    const success = addToCart(product, 1);
    if (success) {
      // Small feedback alert or styling can go here if wanted
    }
  };

  // Filter products locally
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = maxPrice ? parseFloat(prod.price) <= parseFloat(maxPrice) : true;
    const matchesCategory = selectedCategory === 'All' || 
      (prod.category_name && prod.category_name.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesPrice && matchesCategory;
  });

  const defaultTestimonials = [
    {
      id: 'static-1',
      name: "Adnan Chowdhury",
      avatar: "AC",
      rating: 5,
      date: "June 08, 2026",
      product: "ChatGPT Plus Subscription",
      text: "Extremely fast service! Got my ChatGPT Plus activation within 5 minutes of making payment via bKash. Recommended platform!"
    },
    {
      id: 'static-2',
      name: "Farhana Yasmin",
      avatar: "FY",
      rating: 5,
      date: "June 05, 2026",
      product: "Netflix Premium Account",
      text: "Subscribed for Netflix 1-Screen shared plan. The profile pin works perfectly. Video quality is ultra HD. Highly recommended!"
    },
    {
      id: 'static-3',
      name: "Tariqul Islam",
      avatar: "TI",
      rating: 5,
      date: "May 29, 2026",
      product: "Spotify Premium 1 Year",
      text: "Value for money! Got Spotify Premium on my own personal account for 1 year at a very cheap price. No issues so far."
    }
  ];

  const displayReviews = latestReviews.length > 0
    ? latestReviews.map(r => ({
      id: `db-${r.id}`,
      name: r.user_name,
      avatar: r.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      rating: r.rating,
      date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
      product: r.product_name,
      text: r.text
    }))
    : defaultTestimonials;

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-8 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Premium Hero Banner */}
        <div className="relative mb-12 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full filter blur-3xl -z-10" />
          <div className="absolute bottom-0 left-10 w-60 h-60 bg-pink-500/10 rounded-full filter blur-3xl -z-10" />

          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold px-3 py-1 bg-white/20 text-white border border-white/20 rounded-full mb-4">
              Special Discounts Live
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Unlock the Ultimate <span className="text-yellow-300">Digital Subscription Deals</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-violet-100 leading-relaxed">
              Find cheap digital keys, premium subscriptions, AI subscriptions, digital top-ups, and in-game top-ups. High performance, zero hassle checkout.
            </p>
          </div>
        </div>

        {/* Search & Filter section */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all shadow-xs"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1 text-sm text-slate-500 w-full md:w-48 shadow-xs">
              <span className="text-slate-450 mr-2">Max: ৳</span>
              <input
                type="number"
                placeholder="Price limit"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-slate-800 w-full placeholder-slate-350 text-sm"
              />
            </div>

            <button
              onClick={() => { setSearchTerm(''); setMaxPrice(''); setSelectedCategory('All'); }}
              className="text-xs text-slate-550 hover:text-slate-850 underline transition-colors shrink-0 cursor-pointer border-none bg-transparent"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Categories Layout Container */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Categories Navigation / Sidebar */}
          <div className="w-full md:w-64 shrink-0 text-left">
            {/* Mobile Categories Tags Scroll */}
            <div className="md:hidden mb-6">
              <span className="text-xxs font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">
                Select Category
              </span>
              <div className="flex flex-row overflow-x-auto gap-2 pb-2 scrollbar-none snap-x scroll-smooth">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap snap-start transition-all cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-gradient-to-r from-violet-600 to-pink-650 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 shadow-xs'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap snap-start transition-all cursor-pointer ${
                      selectedCategory === cat.name
                        ? 'bg-gradient-to-r from-violet-600 to-pink-650 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 shadow-xs'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block bg-[#111e35] border border-slate-800 p-5 rounded-2xl sticky top-24 shadow-sm text-slate-350">
              <span className="text-xxs font-bold uppercase tracking-wider text-slate-400 block mb-4 px-1">
                Product Categories
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-white/10 text-white shadow-xs'
                      : 'text-slate-450 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>All Products</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold transition-colors ${
                    selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-900/60 text-slate-500 group-hover:text-slate-455'
                  }`}>
                    {products.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = products.filter(p => p.category_name === cat.name).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                        selectedCategory === cat.name
                          ? 'bg-white/10 text-white shadow-xs'
                          : 'text-slate-455 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold transition-colors ${
                        selectedCategory === cat.name ? 'bg-white/20 text-white' : 'bg-slate-900/60 text-slate-500 group-hover:text-slate-455'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Products Grid Column */}
          <div className="flex-1">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 font-medium bg-red-50 border border-red-200 rounded-2xl">
                {error}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-slate-455 bg-white border border-slate-200/80 rounded-3xl shadow-xs">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-sm font-bold text-slate-700">No products found in this category.</p>
                <p className="text-xxs text-slate-500 mt-1">Try resetting your filters or selecting another category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleProductClick(prod.id)}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer group shadow-xs hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-video w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">No Image</span>
                      )}

                      {prod.stock === 0 && (
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-200/85 text-xs font-bold rounded-full">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Details */}
                    <div className="p-5 flex-1 flex flex-col text-left">
                      <h3 className="text-base font-extrabold text-slate-800 truncate group-hover:text-violet-600 transition-colors">{prod.name}</h3>
                      <p className="text-slate-550 text-xs mt-1.5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {prod.description}
                      </p>

                      {/* Pricing and Action */}
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <div>
                          <span className="text-xxs text-slate-450 block uppercase font-bold tracking-wider">Price</span>
                          <span className="text-base font-extrabold text-slate-850">
                            ৳{parseFloat(prod.price).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(prod.id);
                          }}
                          disabled={prod.stock === 0}
                          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-650 hover:from-violet-550 hover:to-pink-550 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xs cursor-pointer"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Testimonials / User Reviews Section */}
      <div className="mt-20 border-t border-slate-200/80 pt-16 pb-8 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-855 tracking-tight leading-tight mt-3">
              What Our Customers Say
            </h2>
            <p className="text-slate-500 text-xs mt-2 mx-auto">
              Real feedback from verified purchasers about our subscriptions, top-ups, and customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow animate-fade-in"
              >
                <div>
                  {/* Rating & Date */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xxxxs text-slate-450 font-semibold">{rev.date}</span>
                  </div>

                  {/* Text */}
                  <p className="text-xs text-slate-650 leading-relaxed italic mb-4">
                    "{rev.text}"
                  </p>
                </div>

                {/* User Info */}
                <div className="border-t border-slate-150 pt-4 flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
                      {rev.avatar}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-extrabold text-slate-800 truncate">{rev.name}</span>
                      <span className="block text-xxxxs text-violet-600 truncate mt-0.5 font-bold">{rev.product}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-emerald-600 shrink-0 select-none">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xxxxs font-bold uppercase tracking-wide">Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
