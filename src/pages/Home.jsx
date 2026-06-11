import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { Search, SlidersHorizontal, Loader2, X, ShoppingBag, Star, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Details Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [latestReviews, setLatestReviews] = useState([]);

  const { addToCart } = useCart();

  const handleOpenDetailsModal = async (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
    setProductReviews([]);
    setReviewsLoading(true);
    try {
      const data = await api.get(`/products/${product.id}/reviews`);
      setProductReviews(data);
    } catch (err) {
      console.error('Failed to fetch product reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setSelectedProduct(null);
    setShowDetailsModal(false);
    setProductReviews([]);
  };

  useEffect(() => {
    fetchProducts();
    fetchLatestReviews();
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
    return matchesSearch && matchesPrice;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Premium Hero Banner */}
      <div className="relative mb-12 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-violet-900/40 via-purple-950/20 to-slate-950 border border-violet-500/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full filter blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-pink-600/5 rounded-full filter blur-3xl -z-10" />

        <div className="max-w-2xl">
          <span className="inline-block text-xs font-semibold px-3 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full mb-4 animate-pulse-subtle">
            Special Discounts Live
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight glow-primary">
            Unlock the Ultimate <span className="bg-gradient-to-r from-violet-400 to-pink-500 text-transparent bg-clip-text">Digital Subscription Deals</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
            Find cheap digital keys, premium subscriptions, ai subscriptions, digital top-ups, and in-game top-ups. High performance, zero hassle checkout.
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
            className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-sm text-slate-400 w-full md:w-48">
            <span className="text-slate-600 mr-2">Max: ৳</span>
            <input
              type="number"
              placeholder="Price limit"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-white w-full placeholder-slate-700 text-sm"
            />
          </div>

          <button
            onClick={() => { setSearchTerm(''); setMaxPrice(''); }}
            className="text-xs text-slate-400 hover:text-white underline transition-colors shrink-0"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main product display */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-400 font-medium">
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <span className="text-3xl block mb-2">🔍</span>
          <p className="text-sm">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleOpenDetailsModal(prod)}
              className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer group"
            >
              {/* Product Image */}
              <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-900">
                {prod.image_url ? (
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">No Image</span>
                )}

                {prod.stock === 0 && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                    <span className="px-3 py-1 bg-red-950/50 text-red-400 border border-red-900/60 text-xs font-bold rounded-full">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col text-left">
                <h3 className="text-base font-bold text-white truncate">{prod.name}</h3>
                <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {prod.description}
                </p>

                {/* Pricing and Action */}
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xxs text-slate-500 block">Price</span>
                    <span className="text-base font-extrabold text-white">
                      ৳{parseFloat(prod.price).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(e, prod)}
                    disabled={prod.stock === 0}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none glow-button"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Testimonials / User Reviews Section */}
      <div className="mt-20 border-t border-slate-800/80 pt-16 pb-8 text-left">
        <div className="text-center mb-12">
          {/* <span className="text-xxs font-bold text-violet-400 bg-violet-950/40 border border-violet-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
            Testimonials
          </span> */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mt-3 glow-primary">
            What Our Customers Say
          </h2>
          <p className="text-slate-400 text-xs mt-2 mx-auto">
            Real feedback from verified purchasers about our subscriptions, top-ups, and customer support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayReviews.map((rev) => (
            <div
              key={rev.id}
              className="glass-card rounded-2xl p-5 border border-slate-850/50 flex flex-col justify-between animate-fade-in"
            >
              <div>
                {/* Rating & Date */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-0.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xxxxs text-slate-500">{rev.date}</span>
                </div>

                {/* Text */}
                <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                  "{rev.text}"
                </p>
              </div>

              {/* User Info */}
              <div className="border-t border-slate-850/60 pt-4 flex items-center justify-between mt-auto">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-950/40 border border-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">
                    {rev.avatar}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">{rev.name}</span>
                    <span className="block text-xxxxs text-violet-400 truncate mt-0.5 font-medium">{rev.product}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-emerald-400 shrink-0 select-none">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-xxxxs font-bold uppercase tracking-wide">Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCT DETAILS MODAL */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in" onClick={handleCloseDetailsModal} />

          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl z-10 animate-slide-up flex flex-col md:flex-row">
            {/* Left: Product Image */}
            <div className="w-full md:w-1/2 relative bg-slate-950 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-850 shrink-0">
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover max-h-[300px] md:max-h-full aspect-video md:aspect-auto"
                />
              ) : (
                <div className="py-20 text-slate-600 text-sm font-semibold uppercase tracking-wider">No Image Available</div>
              )}
              <button
                onClick={handleCloseDetailsModal}
                className="absolute top-4 left-4 p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-800 transition-colors md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between text-left">
              {/* Close Button (Desktop) */}
              <button
                onClick={handleCloseDetailsModal}
                className="absolute top-5 right-5 p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-850 transition-colors hidden md:block"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <span className={`inline-block text-xxs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${selectedProduct.stock === 0 ? 'bg-red-950/45 text-red-400 border border-red-900/30' : 'bg-emerald-950/45 text-emerald-400 border border-emerald-900/30'
                  }`}>
                  {selectedProduct.stock === 0 ? 'Out of Stock' : `${selectedProduct.stock} in stock`}
                </span>

                <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight glow-primary leading-snug pr-0 md:pr-6">
                  {selectedProduct.name}
                </h2>

                <div className="border-t border-slate-850 my-3 pt-3">
                  <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block mb-1">Detailed Description</span>
                  <div className="max-h-[100px] overflow-y-auto text-xs text-slate-450 leading-relaxed space-y-2 pr-1 scrollbar-thin">
                    <p className="whitespace-pre-wrap">{selectedProduct.description}</p>
                  </div>
                </div>

                <div className="border-t border-slate-850 my-3 pt-3">
                  <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Customer Reviews</span>
                  <div className="max-h-[130px] overflow-y-auto text-xs text-slate-450 leading-relaxed space-y-2 pr-1 scrollbar-thin">
                    {reviewsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                      </div>
                    ) : productReviews.length === 0 ? (
                      <p className="text-slate-500 italic text-[11px]">No reviews yet for this product.</p>
                    ) : (
                      <div className="space-y-2">
                        {productReviews.map((rev) => (
                          <div key={rev.id} className="p-2.5 bg-slate-950/30 border border-slate-850/50 rounded-xl text-[11px]">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white text-xxs">{rev.user_name}</span>
                              <div className="flex space-x-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-2.5 h-2.5 ${star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-350 italic">"{rev.text}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-850 mt-6 flex items-center justify-between">
                <div>
                  <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Price</span>
                  <span className="text-xl font-black text-white">
                    ৳{parseFloat(selectedProduct.price).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProduct, 1);
                    handleCloseDetailsModal();
                  }}
                  disabled={selectedProduct.stock === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-violet-600/15 disabled:opacity-50 disabled:cursor-not-allowed glow-button active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
