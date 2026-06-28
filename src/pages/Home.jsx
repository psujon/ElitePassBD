import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Star,
  Check,
  Eye,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
  Key,
  Lock,
  RotateCcw,
  Headphones,
  Search,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

const getProductDisplayPriceRange = (prod) => {
  if (!prod) return "৳0";
  if (prod.packages && prod.packages.length > 1) {
    const prices = prod.packages.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
    if (prices.length > 0) {
      return `${Math.min(...prices).toFixed(0)} ৳ - ${Math.max(...prices).toFixed(0)} ৳`;
    }
  }
  return `${parseFloat(prod.price).toFixed(0)} ৳`;
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffDays = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
};

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carousel slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Bengali FAQ accordion state
  const [activeFaq, setActiveFaq] = useState(null);

  const [latestReviews, setLatestReviews] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchLatestReviews();
  }, []);

  const fetchLatestReviews = async () => {
    try {
      const data = await api.get('/products/reviews/latest');
      setLatestReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load latest reviews:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/products');
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products on Home:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
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
    navigate(`/product/${product.id}`);
  };

  // Filter products for sections
  const bestSellers = products.filter(p => p.tags && p.tags.toLowerCase().includes('best sellers')).slice(0, 4);

  // Group products by category dynamically
  const productsByCategory = products.reduce((acc, product) => {
    if (product.category_name) {
      if (!acc[product.category_name]) {
        acc[product.category_name] = [];
      }
      acc[product.category_name].push(product);
    }
    return acc;
  }, {});

  // Helper to format recent titles
  const formatRecentTitle = (name, maxLen = 35) => {
    if (!name) return "";
    return name.length > maxLen ? name.substring(0, maxLen).trim() + "..." : name;
  };

  // Recent 2 Products (the products list is returned sorted by p.id DESC)
  const recentProduct1 = products[0];
  const recentProduct2 = products[1];

  const recent1Link = recentProduct1 ? `/product/${recentProduct1.id}` : "/products?category=Subscription";
  const recent1Badge = recentProduct1
    ? (recentProduct1.discount_percent ? `SAVE ${recentProduct1.discount_percent}%` : "NEW ARRIVAL")
    : "Up to 50%";
  const recent1Title = recentProduct1
    ? formatRecentTitle(recentProduct1.name).toUpperCase()
    : "EDUCATION SUBSCRIPTION";
  const recent1Image = recentProduct1?.image_url;

  const recent2Link = recentProduct2 ? `/product/${recentProduct2.id}` : "/products?category=Microsoft%20Office";
  const recent2Badge = recentProduct2
    ? (recentProduct2.discount_percent ? `SAVE ${recentProduct2.discount_percent}%` : "NEW ARRIVAL")
    : "Big 65% Offer";
  const recent2Title = recentProduct2
    ? formatRecentTitle(recentProduct2.name).toUpperCase()
    : "OFFICE BUNDLE SALE";
  const recent2Image = recentProduct2?.image_url;

  // Dynamic Hot Selling Product
  const hotProduct = products.filter(p => !!p.is_hot).sort((a, b) => b.id - a.id)[0];
  const hotName = hotProduct?.name;
  const hotImage = hotProduct?.image_url;
  const hotSub = hotProduct?.category_name;
  const hotCurrentPrice = hotProduct ? getProductDisplayPrice(hotProduct) : 0.00;

  const hasHotDiscount = hotProduct && hotProduct.discount_percent !== null && hotProduct.discount_percent !== undefined && parseInt(hotProduct.discount_percent) > 0;
  const hotDiscountPercent = hasHotDiscount ? parseInt(hotProduct.discount_percent) : 45;
  const hotOriginalPrice = hotProduct ? (hasHotDiscount ? (hotCurrentPrice / (1 - hotDiscountPercent / 100)) : (hotCurrentPrice * 1.45)) : 244.00;

  // Split description sentences for checkmarks
  let hotBullets = [];
  if (hotProduct && hotProduct.description) {
    const cleanDesc = hotProduct.description.replace(/<[^>]*>/g, '');
    hotBullets = cleanDesc
      .split(/[.\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 12)
      .slice(0, 3);
  }
  if (hotBullets.length === 0) {
    hotBullets = [
      "Fast Download (5x Faster)" + (hotProduct ? "" : " and resume support"),
      "Lifetime Serial Key Activation Guarantee",
      "Synchronized official updates and support"
    ];
  }

  // Carousel Slides Content
  const slides = [
    {
      id: 1,
      image: "/top_slider_image_1.png",
    },
    {
      id: 2,
      image: "/top_slider_image_2.png",
    }
  ];

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Autoplay slider
  useEffect(() => {
    const timer = setInterval(handleNextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "কেন আপনাদের কাছ থেকে সার্ভিস নিব?",
      a: "আমরা ১০০% জেনুইন রিটেল এবং ওইএম লাইসেন্স কি অফার করি। প্রতিটি ক্রয়ের সাথে থাকছে লাইফটাইম সাপোর্ট এবং অফিসিয়াল আপডেট গ্যারান্টি।"
    },
    {
      q: "আমাদের প্রোডাক্ট বা সার্ভিসের কোন গ্যারান্টি থাকে?",
      a: "অবশ্যই! আমাদের প্রতিটি প্রোডাক্টের সাথে অফিসিয়াল ওয়ারেন্টি থাকে। যেকোনো অ্যাক্টিভেশন সমস্যায় আমরা সরাসরি ইমেইল/হোয়াটসঅ্যাপে সাপোর্ট প্রদান করি।"
    },
    {
      q: "অর্ডার করার কতক্ষণ পর প্রোডাক্ট পাব?",
      a: "সাধারণত পেমেন্ট সম্পন্ন হওয়ার ৫ থেকে ১৫ মিনিটের মধ্যে আমাদের সিস্টেম স্বয়ংক্রিয়ভাবে আপনার ইমেইলে লাইসেন্স কি এবং অ্যাক্টিভেশন গাইড পাঠিয়ে দেয়।"
    },
    {
      q: "আপনারা কিভাবে সাপোর্ট দিবেন?",
      a: "আমরা ২৪/৭ ইমেইল এবং লাইভ চ্যাট সাপোর্ট প্রদান করি। এছাড়াও নিচে ডান কোণায় থাকা হোয়াটসঅ্যাপ চ্যাটবক্সের মাধ্যমে আপনি আমাদের এজেন্টের সাথে সরাসরি যুক্ত হতে পারেন।"
    },
    {
      q: "অর্ডার করার পর কি করতে হবে?",
      a: "অর্ডার সম্পন্ন হলে আপনার রেজিস্টার্ড ইমেইল চেক করুন। সেখানে আমরা বিস্তারিত নির্দেশনা পাঠিয়েছি যা দেখে আপনি খুব সহজেই সফটওয়্যার অ্যাক্টিভেট করে নিতে পারবেন।"
    },
    {
      q: "অর্ডার ম্যানুয়ালি করা যাবে?",
      a: "হ্যাঁ, আপনি সরাসরি আমাদের হোয়াটসঅ্যাপ নম্বরে যোগাযোগ করে বিকাশ, নগদ বা রকেটের মাধ্যমে ম্যানুয়ালি অর্ডার করতে পারেন।"
    }
  ];

  return (
    <div className="w-full bg-[#f8fafc] text-slate-800 py-6 text-left">
      <div className="max-w-full mx-auto px-4 sm:px-6">

        {/* ================= HERO & PROMOTIONS SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-15 md:mb-8">

          {/* Left: Dynamic Carousel Slider */}
          <div className="relative rounded-lg overflow-hidden shadow-xs h-auto aspect-[1663/945] md:h-[400px] lg:h-[420px] md:aspect-auto group bg-slate-900">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img src={slide.image} alt="Slider Banner" className="w-full h-full object-cover md:object-contain" />

                {/* Slide Footer Indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                  <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {slides.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setCurrentSlide(dotIdx)}
                        className={`w-2 h-2 rounded-full cursor-pointer transition-all ${dotIdx === currentSlide ? 'bg-white w-4' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Slider arrows */}
            <button
              onClick={handlePrevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-slate-900/40 hover:bg-slate-950/80 text-white p-2 rounded-full border border-white/10 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-slate-900/40 hover:bg-slate-950/80 text-white p-2 rounded-full border border-white/10 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right Column: Promos and Featured */}
          <div className="flex flex-col gap-6 lg:h-[420px]">

            <div className='h-[360px] md:h-[200px]'>
              {products.filter((product) => product.is_hot).slice(0, 1).map((p, idx) => (
                <Link
                  to={`/product/${p.id}`}
                  key={idx}
                  className="relative rounded-lg overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col md:flex-row p-2 h-full min-h-[200px] bg-white border border-slate-200"
                >
                  {/* Left Side: Image */}
                  <div className="w-full md:w-3/12 h-40 md:h-full relative overflow-hidden rounded-lg flex-shrink-0 bg-slate-50 ">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs">No Image</div>
                    )}
                  </div>

                  {/* Right Side: Content */}
                  <div className="w-full md:w-7/12 flex flex-col justify-center pl-0 md:pl-6 mt-4 md:mt-0 text-left">
                    <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-800 leading-snug drop-shadow-sm mb-2">
                      {p.name}
                    </h3>

                    {/* Stars */}
                    {p.avg_rating > 0 && (
                      <div className="flex gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(p.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-medium">
                      {p.description ? p.description.replace(/<[^>]*>?/gm, '') : "Get the best deal right now! Fast and secure delivery."}
                    </p>
                    <button className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all self-start shadow-sm active:scale-95 flex items-center gap-2">
                      <span>Buy Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </Link>
              ))}

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[360px] md:h-[180px]">

              <Link
                to={recent1Link}
                className="relative rounded-lg overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col justify-end p-5 h-full min-h-[180px] bg-slate-900 border border-slate-200/50"
              >
                {recent1Image ? (
                  <>
                    <img
                      src={recent1Image}
                      alt={recent1Title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-650 to-red-800" />
                )}
                <div className="relative z-10 text-left">
                  <h3 className="text-sm font-black tracking-tight text-white leading-snug drop-shadow-md">
                    {recent1Title}
                  </h3>
                </div>
              </Link>

              <Link
                to={recent2Link}
                className="relative rounded-lg overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col justify-end p-5 h-full min-h-[180px] bg-slate-900 border border-slate-200/50"
              >
                {recent2Image ? (
                  <>
                    <img
                      src={recent2Image}
                      alt={recent2Title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-650 to-blue-800" />
                )}
                <div className="relative z-10 text-left">
                  <h3 className="text-sm font-black tracking-tight text-white leading-snug drop-shadow-md">
                    {recent2Title}
                  </h3>
                </div>
              </Link>

            </div>
          </div>
        </div>


        {/* ================= SECTION 1: THE BEST SELLERS ================= */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl mb-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 p-4 mb-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-5 bg-blue-600 rounded-md" />
              <span className='bg-blue-600/90 text-white rounded-lg py-1 px-6'>Popular Items</span>
            </h2>
            <Link
              to="/products"
              className="text-xs text-blue-600 font-extrabold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
            >
              More Products <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-400">Loading products...</div>
          ) : bestSellers.length === 0 ? (
            <div className="py-10 text-center text-slate-400">No best seller items found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 p-2">
              {bestSellers.map((prod) => {
                const currentPrice = getProductDisplayPrice(prod);
                const isOutOfStock = prod.stock === 0;

                // Real original price and discount percent if specified
                const hasDiscount = prod.discount_percent !== null && prod.discount_percent !== undefined && parseInt(prod.discount_percent) > 0;
                const discountPercent = hasDiscount ? parseInt(prod.discount_percent) : 0;
                const originalPrice = hasDiscount ? (currentPrice / (1 - discountPercent / 100)) : 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleProductClick(prod.id)}
                    className="border border-slate-150 rounded-2xl p-3 bg-slate-50 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative group"
                  >
                    {/* Discount Badge */}
                    {!isOutOfStock && hasDiscount && (
                      <div className="absolute top-2.5 left-2.5 z-10 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        -{discountPercent}%
                      </div>
                    )}

                    {/* Image */}
                    <div className="aspect-square w-full bg-white border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative mb-3">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-350" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">No Image</span>
                      )}

                      {isOutOfStock && (
                        <div className="absolute top-2 left-2 flex items-start justify-start">
                          <span className="px-4 py-1.5 bg-red-500 text-white border border-red-200/85 text-xs font-bold rounded-full">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div>
                      <h3 className="text-[12px] font-extrabold text-slate-800 line-clamp-2 leading-snug min-h-[2rem]">
                        {prod.name}
                      </h3>
                      {/* Stars */}
                      {prod.avg_rating > 0 && (
                        <div className="flex gap-0.5 my-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < Math.round(prod.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                          ))}
                        </div>
                      )}
                      {/* Stock */}
                      <div className="text-[10px] font-bold text-slate-500 mb-2">
                        {isOutOfStock ? (
                          <span className="text-red-500">Out of stock</span>
                        ) : (
                          <span className="text-emerald-600">Stock Available</span>
                        )}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-3 pt-2 border-t border-slate-150">
                      <div className="flex items-baseline gap-1.5 mb-2.5">
                        <span className="text-xs font-black text-blue-600">{
                          getProductDisplayPriceRange(prod)
                        }</span>
                        {!isOutOfStock && hasDiscount && (
                          <span className="text-[10px] text-slate-400 line-through">{originalPrice.toFixed(0)}৳</span>
                        )}
                      </div>

                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full py-1.5 rounded-lg text-[10px] font-extrabold text-center bg-slate-200 text-slate-450 cursor-not-allowed"
                        >
                          Out of Stock
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={(e) => handleAddToCart(e, prod)}
                            className="bg-slate-900 hover:bg-slate-950 text-white text-[10px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ShoppingCart className="w-3 h-3" /> Cart
                          </button>
                          <button
                            onClick={(e) => handleOrderNow(e, prod)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Buy Now
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


        {/* ================= DYNAMIC CATEGORY SECTIONS ================= */}
        {Object.entries(productsByCategory).map(([categoryName, catProducts]) => {
          const displayedProducts = catProducts.slice(0, 4);
          if (displayedProducts.length === 0) return null;

          return (
            <div key={categoryName} className="mb-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-6">
                <h2 className="text-md font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-600 rounded-sm" />
                  {categoryName}
                </h2>
                <Link
                  to={`/products?category=${encodeURIComponent(categoryName)}`}
                  className="text-xxs text-white font-bold bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-full transition-all shadow-xs"
                >
                  VIEW ALL
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 p-2">
                {displayedProducts.map((prod) => {
                  const currentPrice = getProductDisplayPrice(prod);
                  const isOutOfStock = prod.stock === 0;

                  // Real original price and discount percent if specified
                  const hasDiscount = prod.discount_percent !== null && prod.discount_percent !== undefined && parseInt(prod.discount_percent) > 0;
                  const discountPercent = hasDiscount ? parseInt(prod.discount_percent) : 0;
                  const originalPrice = hasDiscount ? (currentPrice / (1 - discountPercent / 100)) : 0;

                  // Fake eye view count based on id
                  const views = 150 + (prod.id * 97) % 300;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleProductClick(prod.id)}
                      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md hover:border-slate-350 transition-all cursor-pointer flex flex-col group relative"
                    >
                      {/* Image */}
                      <div className="aspect-square w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden relative">
                        {/* Discount Badge */}
                        {!isOutOfStock && hasDiscount && (
                          <div className="absolute top-2.5 left-2.5 z-10 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            -{discountPercent}%
                          </div>
                        )}

                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover transition-transform group-hover:scale-103 duration-350" />
                        ) : (
                          <span className="text-xs text-slate-400 font-bold uppercase">No Image</span>
                        )}

                        {isOutOfStock && (
                          <div className="absolute top-2 left-2 flex items-center justify-center">
                            <span className="px-4 py-1.5 bg-red-500 text-white border border-red-200/85 text-xs font-bold rounded-full">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Metadata & Actions */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug min-h-[2.5rem]">
                            {prod.name}
                          </h3>

                          {/* Stars */}
                          {prod.avg_rating > 0 && (
                            <div className="flex gap-0.5 mt-1.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < Math.round(prod.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                              ))}
                            </div>
                          )}

                          {/* Views & Price line */}
                          <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-bold">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>{views}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-blue-600 text-sm font-black">{getProductDisplayPriceRange(prod)}</span>
                              {!isOutOfStock && hasDiscount && (
                                <span className="text-[10px] text-slate-400 line-through font-normal">{originalPrice.toFixed(0)}৳</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                          <button
                            onClick={(e) => handleAddToCart(e, prod)}
                            disabled={isOutOfStock}
                            className="bg-slate-900 hover:bg-slate-950 text-white text-[10px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <ShoppingCart className="w-3 h-3" /> Cart
                          </button>
                          <button
                            onClick={(e) => handleOrderNow(e, prod)}
                            disabled={isOutOfStock}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}


        {/* ================= SECTION 4: WHY CHOOSE US ================= */}
        <div className="relative bg-slate-50/60 border border-slate-200/60 rounded-3xl p-8 md:p-10 mb-6 shadow-xxs overflow-hidden text-center">
          {/* Ambient background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-transparent opacity-80 pointer-events-none" />

          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2 relative z-10">
            <span className="w-2 h-5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-md" />
            Why Choose ElitePassBD?
          </h2>
          <p className="text-slate-500 text-xs mt-2 max-w-lg mx-auto font-medium relative z-10">
            We're committed to providing the best software purchasing experience with guaranteed authenticity and support.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 relative z-10">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200/70 p-6 rounded-2xl flex flex-col items-center group hover:shadow-2xl hover:shadow-blue-500/8 hover:border-blue-500/40 hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/30 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 transition-all duration-350 group-hover:scale-110 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/25 group-hover:rotate-[8deg]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">100% Genuine Licenses</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">
                All our licenses are sourced from official channels. No cracks, no torrents - just authentic software.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200/70 p-6 rounded-2xl flex flex-col items-center group hover:shadow-2xl hover:shadow-orange-500/8 hover:border-orange-500/40 hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 transition-all duration-350 group-hover:scale-110 group-hover:from-amber-400 group-hover:to-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-500/25 group-hover:rotate-[8deg]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-orange-500 transition-colors">Instant Email Delivery</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">
                Receive your license key and download link within minutes of purchase. No waiting required.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200/70 p-6 rounded-2xl flex flex-col items-center group hover:shadow-2xl hover:shadow-emerald-500/8 hover:border-emerald-500/40 hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 transition-all duration-350 group-hover:scale-110 group-hover:from-emerald-400 group-hover:to-teal-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/25 group-hover:rotate-[8deg]">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-emerald-650 transition-colors">Secure Activation</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">
                One-time purchase for lasting use. No recurring fees or subscription renewals for perpetual licenses.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-200/70 p-6 rounded-2xl flex flex-col items-center group hover:shadow-2xl hover:shadow-indigo-500/8 hover:border-indigo-500/40 hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50/30 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 transition-all duration-350 group-hover:scale-110 group-hover:from-indigo-500 group-hover:to-violet-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/25 group-hover:rotate-[8deg]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">Secure Payment</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">
                Multiple payment options including bKash, Nagad, cards, and international methods like Payoneer.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-slate-200/70 p-6 rounded-2xl flex flex-col items-center group hover:shadow-2xl hover:shadow-rose-500/8 hover:border-rose-500/40 hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/30 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 transition-all duration-350 group-hover:scale-110 group-hover:from-rose-400 group-hover:to-red-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-rose-500/25 group-hover:rotate-[8deg]">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-rose-500 transition-colors">Money-Back Guarantee</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">
                Not satisfied? Get a full refund within 7 days if you face any activation issues.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-slate-200/70 p-6 rounded-2xl flex flex-col items-center group hover:shadow-2xl hover:shadow-purple-500/8 hover:border-purple-500/40 hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50/30 border border-purple-100 flex items-center justify-center text-purple-600 mb-4 transition-all duration-350 group-hover:scale-110 group-hover:from-purple-500 group-hover:to-fuchsia-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-purple-500/25 group-hover:rotate-[8deg]">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-purple-600 transition-colors">24/7 Support</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">
                Our team is always ready to help with activation, installation, or any questions you have.
              </p>
            </div>
          </div>
        </div>


        {/* ================= SECTION 5: HOW IT WORKS ================= */}
        <div className="relative bg-slate-50/60 border border-slate-200/60 rounded-3xl p-8 md:p-10 mb-6 shadow-xxs overflow-hidden text-center">
          {/* Ambient background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-50/30 via-transparent to-transparent opacity-80 pointer-events-none" />

          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2 relative z-10">
            <span className="w-2 h-5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-md" />
            How It Works
          </h2>
          <p className="text-slate-500 text-xs mt-2 mx-auto max-w-sm font-medium relative z-10">
            Get your software license in just 3 simple steps
          </p>

          <div className="relative flex flex-col md:flex-row justify-between gap-8 mt-12 px-4 relative z-10">

            {/* Flowchart connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-24 right-24 h-[3px] bg-gradient-to-r from-blue-400/30 via-indigo-400/40 to-purple-400/30 -z-10" />

            {/* Step 1 */}
            <div className="flex-1 bg-white border border-slate-100 p-6 rounded-2xl flex flex-col items-center group hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer">
              <div className="relative mb-6">
                <span className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-blue-500/30 z-10">
                  1
                </span>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/40 group-hover:shadow-md group-hover:rotate-6">
                  <Search className="w-6 h-6 transition-transform duration-300" />
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">Choose Your Software</h3>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold max-w-xs">
                Browse our catalog and select the software license you need. Compare options and find the best deal.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex-1 bg-white border border-slate-100 p-6 rounded-2xl flex flex-col items-center group hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer">
              <div className="relative mb-6">
                <span className="absolute -top-3 -right-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-indigo-500/30 z-10">
                  2
                </span>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-500/40 group-hover:shadow-md group-hover:rotate-6">
                  <Lock className="w-6 h-6 transition-transform duration-300" />
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">Complete Payment</h3>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold max-w-xs">
                Pay securely using bKash, Nagad, credit card, or other methods. Your transaction is protected.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex-1 bg-white border border-slate-100 p-6 rounded-2xl flex flex-col items-center group hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer">
              <div className="relative mb-6">
                <span className="absolute -top-3 -right-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-violet-500/30 z-10">
                  3
                </span>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-violet-500/40 group-hover:shadow-md group-hover:rotate-6">
                  <Zap className="w-6 h-6 transition-transform duration-300 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-900 group-hover:text-violet-650 transition-colors">Receive & Activate</h3>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold max-w-xs">
                Get your license key and download link via email instantly. Follow our simple activation guide.
              </p>
            </div>

          </div>
        </div>


        {/* ================= SECTION 6: FAQ ACCORDION (BENGALI) ================= */}
        <div className="bg-[#f1f5f9] border border-slate-200/60 rounded-3xl p-6 md:p-8 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-lg md:text-xl font-extrabold text-emerald-800 tracking-tight">
              আমাদের সম্পর্কে কিছু প্রশ্ন ও উত্তরঃ
            </h2>
          </div>

          <div className="space-y-4 max-w-7xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 shadow-xxs"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-4 font-bold text-xs md:text-sm text-slate-800 flex justify-between items-center gap-4 cursor-pointer focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 border-t border-slate-100 text-xs md:text-sm text-slate-550 leading-relaxed font-medium bg-slate-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= SECTION 7: CUSTOMER REVIEWS ================= */}
        <div className="bg-[#f1f5f9] border border-slate-200/60 rounded-3xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
            <h2 className="text-lg md:text-xl font-extrabold text-[#0c3944] tracking-tight flex items-center gap-2">
              <span className="w-2 h-5 bg-yellow-400 rounded-md" />
              What Our Customer Says
            </h2>
          </div>

          {latestReviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestReviews.map((review) => (
                <div key={review.id} className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="mb-2">
                    <h4 className="text-xl font-black text-[#0c3944] tracking-tight">{review.user_name}</h4>
                    <p className="text-sm text-slate-400 font-medium">{review.user_review_count} review{review.user_review_count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`} />
                    ))}
                    <span className="text-sm text-slate-400 ml-2 font-medium">
                      {timeAgo(review.created_at)}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-[#0c3944] mb-3 mt-2">Verified customer</div>
                  <p className="text-sm text-[#0c3944] leading-relaxed flex-grow">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 border border-slate-200/60 rounded-2xl">
              <p className="text-slate-500 font-bold">No reviews yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
