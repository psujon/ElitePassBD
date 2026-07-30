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
  CheckCircle,
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
  ShoppingCart,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
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
  const [slides, setSlides] = useState([]);

  // Carousel slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Category Sidebar & Filter State for Shahed Store layout
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  const [homeSearch, setHomeSearch] = useState('');

  // Bengali FAQ accordion state
  const [activeFaq, setActiveFaq] = useState(null);

  const [latestReviews, setLatestReviews] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchLatestReviews();
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const data = await api.get('/slides');
      setSlides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load slides on Home:', err);
    }
  };

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

  const handleOrderNow = (e, product) => {
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  // Spotlight Featured Product for Hero Section
  const spotlightProduct = products.find(p => p.is_hot) || products[0];

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

  // Hot Discount Products (filter where is_hot_discount is set, fallback to products if empty)
  const hotDiscountProducts = products.filter(p => !!p.is_hot_discount);
  const recentProduct1 = hotDiscountProducts[0];
  const recentProduct2 = hotDiscountProducts[1];
  const recentProduct3 = hotDiscountProducts[2];
  const recentProduct4 = hotDiscountProducts[3];

  const getPercentageBadge = (product) => {
    if (!product) return "20% OFF";
    if (!product.discount_percent) return "20% OFF";

    const originalPrice = parseFloat(product.discount_percent);
    const currentPrice = getProductDisplayPrice(product);

    if (originalPrice > currentPrice && currentPrice > 0) {
      const percentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      return `${percentage}% OFF`;
    }

    return "20% OFF";
  };


  const recent1Link = recentProduct1 ? `/product/${recentProduct1.id}` : "/products?category=Subscription";
  const recent1Badge = (
    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs animate-pulse">
      {getPercentageBadge(recentProduct1)}
    </span>
  );
  const recent1Title = recentProduct1
    ? formatRecentTitle(recentProduct1.name).toUpperCase()
    : "EDUCATION SUBSCRIPTION";
  const recent1Image = recentProduct1?.image_url;

  const recent2Link = recentProduct2 ? `/product/${recentProduct2.id}` : "/products?category=Microsoft%20Office";
  const recent2Badge = (
    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs animate-pulse">
      {getPercentageBadge(recentProduct2)}
    </span>
  );
  const recent2Title = recentProduct2
    ? formatRecentTitle(recentProduct2.name).toUpperCase()
    : "OFFICE BUNDLE SALE";
  const recent2Image = recentProduct2?.image_url;

  const recent3Link = recentProduct3 ? `/product/${recentProduct3.id}` : "/products?category=Microsoft%20Office";
  const recent3Badge = (
    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs animate-pulse">
      {getPercentageBadge(recentProduct3)}
    </span>
  );
  const recent3Title = recentProduct3
    ? formatRecentTitle(recentProduct3.name).toUpperCase()
    : "OFFICE BUNDLE SALE";
  const recent3Image = recentProduct3?.image_url;

  const recent4Link = recentProduct4 ? `/product/${recentProduct4.id}` : "/products?category=Microsoft%20Office";
  const recent4Badge = (
    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs animate-pulse">
      {getPercentageBadge(recentProduct4)}
    </span>
  );
  const recent4Title = recentProduct4
    ? formatRecentTitle(recentProduct4.name).toUpperCase()
    : "OFFICE BUNDLE SALE";
  const recent4Image = recentProduct4?.image_url;

  // Dynamic Hot Selling Product
  const hotProduct = products.filter(p => !!p.is_hot).sort((a, b) => b.id - a.id)[0];
  const hotName = hotProduct?.name;
  const hotImage = hotProduct?.image_url;
  const hotSub = hotProduct?.category_name;
  const hotCurrentPrice = hotProduct ? getProductDisplayPrice(hotProduct) : 0.00;

  const hasHotDiscount = hotProduct && hotProduct.discount_percent !== null && hotProduct.discount_percent !== undefined && parseFloat(hotProduct.discount_percent) > 0;
  const hotDiscountAmount = hasHotDiscount ? parseFloat(hotProduct.discount_percent) : 45;
  const hotOriginalPrice = hotProduct ? (hasHotDiscount ? hotDiscountAmount : (hotCurrentPrice + 45)) : 244.00;

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
  const idmProd = products.find(p => p.name?.toLowerCase().includes('idm')) || products[0];
  const winProd = products.find(p => p.name?.toLowerCase().includes('windows')) || products[1];
  const offProd = products.find(p => p.name?.toLowerCase().includes('office')) || products[2];

  const activeSlides = slides.length > 0 ? slides : [
    {
      id: 'slide-idm',
      title1: 'IDM',
      title2: 'Lifetime',
      subtitle: 'Internet Download Manager',
      tagline: 'আমরা IDM-এর অফিসিয়াল রিসেলার। একবার কিনুন, সারাজীবন ব্যবহার করুন।',
      price: idmProd ? getProductDisplayPrice(idmProd) : 2650,
      originalPrice: idmProd && idmProd.discount_percent ? parseFloat(idmProd.discount_percent) : 6500,
      discount: idmProd && idmProd.discount_percent ? Math.round(((parseFloat(idmProd.discount_percent) - getProductDisplayPrice(idmProd)) / parseFloat(idmProd.discount_percent)) * 100) : 59,
      badge1: '🏆 OFFICIAL RESELLER',
      badge2: 'OFFICIAL RESELLER',
      features: ['Official Reseller ✓', 'Lifetime License ✓', 'Instant Delivery ✓'],
      product_id: idmProd?.id,
      image_url: idmProd?.image_url
    },
    {
      id: 'slide-win11',
      title1: 'Windows 11',
      title2: 'Pro License',
      subtitle: 'Official Microsoft Windows Key',
      tagline: '১০০% জেনুইন রিটেল কি। অনলাইন লাইফটাইম অ্যাক্টিভেশন গ্যারান্টি।',
      price: winProd ? getProductDisplayPrice(winProd) : 599,
      originalPrice: winProd && winProd.discount_percent ? parseFloat(winProd.discount_percent) : 2499,
      discount: winProd && winProd.discount_percent ? Math.round(((parseFloat(winProd.discount_percent) - getProductDisplayPrice(winProd)) / parseFloat(winProd.discount_percent)) * 100) : 76,
      badge1: '⚡ BEST SELLER',
      badge2: 'GENUINE RETAIL',
      features: ['1 PC Lifetime ✓', 'Global Activation ✓', 'Official Updates ✓'],
      product_id: winProd?.id,
      image_url: winProd?.image_url
    },
    {
      id: 'slide-office365',
      title1: 'Office 365',
      title2: 'Personal',
      subtitle: '5 Devices + 1TB OneDrive Cloud',
      tagline: 'অফিসিয়াল মাইক্রোসফট অ্যাকাউন্ট সাপোর্ট ও ফুল প্যাকেজ অ্যাক্সেস।',
      price: offProd ? getProductDisplayPrice(offProd) : 1999,
      originalPrice: offProd && offProd.discount_percent ? parseFloat(offProd.discount_percent) : 4999,
      discount: offProd && offProd.discount_percent ? Math.round(((parseFloat(offProd.discount_percent) - getProductDisplayPrice(offProd)) / parseFloat(offProd.discount_percent)) * 100) : 60,
      badge1: '🌟 HOT OFFER',
      badge2: 'ORIGINAL LICENSE',
      features: ['5 Devices Support ✓', '1TB OneDrive ✓', '24/7 Assistance ✓'],
      product_id: offProd?.id,
      image_url: offProd?.image_url
    }
  ];

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  // Autoplay slider
  useEffect(() => {
    const timer = setInterval(handleNextSlide, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

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

        {/* ================= HERO SECTION (FULL WIDTH GLASS SLIDER) ================= */}
        <div className="w-full mb-8">

          {/* Full Width ShahedStore Style Glassmorphic Hero Slider */}
          <div className="w-full relative rounded-xl overflow-hidden border border-purple-100/90 shadow-xl min-h-95 sm:min-h-105 lg:min-h-130 flex items-center bg-gradient-to-r from-purple-50/90 via-indigo-50/60 to-blue-50/80 group">

            {/* Slide Container */}
            {activeSlides.map((slide, idx) => {
              const isCurrent = idx === currentSlide;

              // Check if slide is a pure full image banner uploaded by admin
              const isPureImageBanner = slide.image_url && !slide.title1 && !slide.price;

              return (
                <div
                  key={slide.id || idx}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col justify-between ${isCurrent ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
                    }`}
                >
                  {isPureImageBanner ? (
                    <img src={slide.image_url} alt="Hero Banner" className="w-full h-full object-fill rounded" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center h-full">

                      {/* Left Side Content */}
                      <div className="md:col-span-7 flex flex-col justify-center text-left space-y-2.5 sm:space-y-3.5">

                        {/* Top Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1">
                            {slide.badge1 || '🏆 OFFICIAL RESELLER'}
                          </span>
                          <span className="bg-purple-100/80 text-purple-700 font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase">
                            {slide.badge2 || 'OFFICIAL RESELLER'}
                          </span>
                        </div>

                        {/* Main Title Stack */}
                        <div className="flex flex-col">
                          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                            {slide.title1 || slide.name || 'IDM'}
                          </h1>
                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-violet-600 tracking-tight leading-none mt-1">
                            {slide.title2 || 'Lifetime'}
                          </h2>
                        </div>

                        {/* Subtitle / Description */}
                        <p className="text-xs sm:text-sm font-extrabold text-slate-500 line-clamp-1">
                          {slide.subtitle || 'Internet Download Manager'}
                        </p>

                        {/* Bengali Tagline */}
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                          {slide.tagline || 'আমরা IDM-এর অফিসিয়াল রিসেলার। একবার কিনুন, সারাজীবন ব্যবহার করুন।'}
                        </p>

                        {/* Feature Checkmark Badges */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {(slide.features || ['Official Reseller ✓', 'Lifetime License ✓', 'Instant Delivery ✓']).map((feat, fIdx) => (
                            <span key={fIdx} className="bg-white/80 border border-purple-100/90 text-purple-800 font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span>{feat}</span>
                            </span>
                          ))}
                        </div>

                        {/* Price Row */}
                        <div className="flex items-baseline gap-3 pt-1">
                          <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                            ৳{(slide.price || 2650).toLocaleString()}
                          </span>
                          {slide.originalPrice > slide.price && (
                            <span className="text-sm font-bold text-slate-400 line-through">
                              ৳{slide.originalPrice.toLocaleString()}
                            </span>
                          )}
                          <span className="bg-violet-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-2xs">
                            -{slide.discount || 59}% OFF
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => slide.product_id ? navigate(`/product/${slide.product_id}`) : navigate('/products')}
                            className="bg-gradient-to-r from-[#005F4B]/90 via-[#005F4B] to-[#FF6D00] hover:from-[#005F4B] hover:to-[#FF6D00] text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md shadow-[#005F4B]/20 backdrop-blur-md border border-white/20 flex items-center gap-2 hover:scale-103 cursor-pointer active:scale-98 transition-all"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Buy Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => navigate('/products')}
                            className="bg-white/90 hover:bg-white text-violet-700 border border-purple-200/80 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-2xs hover:scale-103 cursor-pointer active:scale-98 transition-all"
                          >
                            <Zap className="w-3.5 h-3.5 fill-violet-600 text-violet-600" />
                            <span>View All Deals</span>
                          </button>
                        </div>

                        {/* Bottom Guarantee Icons */}
                        <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-slate-500 pt-1 flex-wrap">
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Instant Delivery</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> 100% Genuine</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Headphones className="w-3 h-3 text-blue-500" /> 24/7 Support</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9★ Rating</span>
                        </div>

                      </div>

                      {/* Right Side (3D Showcase Card) */}
                      <div className="hidden md:flex md:col-span-5 items-center justify-center relative">
                        <div className="relative w-full max-w-[280px] lg:max-w-[340px] aspect-square rounded-3xl bg-white/60 backdrop-blur-xl border border-white/90 p-3 shadow-2xl shadow-purple-500/10 flex items-center justify-center overflow-hidden group-hover:scale-103 transition-transform duration-500">
                          {slide.image_url ? (
                            <img
                              src={slide.image_url}
                              alt={slide.title1 || "Hero Product"}
                              className="w-full h-full object-contain rounded-2xl filter drop-shadow-xl"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex flex-col items-center justify-center text-white p-4 text-center">
                              <Sparkles className="w-12 h-12 mb-2 animate-bounce" />
                              <span className="font-black text-2xl tracking-tight">{slide.title1}</span>
                              <span className="text-xs font-bold opacity-80 mt-1">{slide.title2}</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}

            {/* Navigation Floating Arrows */}
            <button
              onClick={handlePrevSlide}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 text-slate-700 shadow-md flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 text-slate-700 shadow-md flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Dots Indicator */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20 pointer-events-auto">
              <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/60 shadow-2xs">
                {activeSlides.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentSlide(dotIdx)}
                    className={`h-2 rounded-full cursor-pointer transition-all ${dotIdx === currentSlide ? 'bg-violet-600 w-6' : 'bg-slate-300 w-2 hover:bg-slate-400'
                      }`}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Commented out Spotlight Offer section as requested by user */}
          {/*
          <div className="lg:col-span-4 flex flex-col">
            {spotlightProduct ? (
              <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-md flex flex-col justify-between h-full hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Spotlight Offer
                  </span>
                  {spotlightProduct.avg_rating > 0 && (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full text-xs font-bold text-amber-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{spotlightProduct.avg_rating}</span>
                    </div>
                  )}
                </div>

                <div className="relative aspect-video sm:aspect-square w-full bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-2xl border border-slate-200/60 overflow-hidden flex items-center justify-center p-3 mb-4 group cursor-pointer" onClick={() => handleProductClick(spotlightProduct.id)}>
                  {spotlightProduct.image_url ? (
                    <img src={spotlightProduct.image_url} alt={spotlightProduct.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold uppercase">Spotlight Offer</span>
                  )}
                </div>

                <div className="space-y-2 mb-4 text-left">
                  <h3 className="text-base font-extrabold text-slate-900 line-clamp-1 hover:text-teal-700 transition-colors cursor-pointer" onClick={() => handleProductClick(spotlightProduct.id)}>
                    {spotlightProduct.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-teal-700">
                      ৳{getProductDisplayPrice(spotlightProduct).toFixed(0)}
                    </span>
                    {spotlightProduct.discount_percent && (
                      <span className="text-xs font-bold text-slate-400 line-through">
                        ৳{parseFloat(spotlightProduct.discount_percent).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => handleOrderNow(e, spotlightProduct)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3 px-4 rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Buy Now Instant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
          */}
        </div>

        {/* ================= LIVE TICKER / MOVING DISCOUNT BAR ================= */}
        {products.length > 0 && (
          <div className="w-full mt-6 mb-4 text-left">
            <div className="bg-slate-100/90 backdrop-blur-md border border-slate-200/80 rounded-full px-3 py-1.5 shadow-2xs overflow-hidden flex items-center gap-3">
              {/* Left Live Badge */}
              <div className="bg-violet-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 shadow-2xs animate-pulse z-10">
                <Zap className="w-3 h-3 fill-current" />
                <span>LIVE</span>
                <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-ping" />
              </div>

              {/* Scrolling Marquee Container */}
              <div className="overflow-hidden whitespace-nowrap w-full relative">
                <div className="animate-marquee-slow flex items-center gap-4">
                  {[...products, ...products].map((prod, index) => {
                    const minPrice = getProductDisplayPrice(prod);
                    const hasDiscount = prod.discount_percent && parseFloat(prod.discount_percent) > minPrice;
                    const originalPrice = hasDiscount ? parseFloat(prod.discount_percent) : 0;
                    const discountPercent = hasDiscount
                      ? Math.round(((originalPrice - minPrice) / originalPrice) * 100)
                      : 25;

                    return (
                      <div
                        key={`${prod.id}-ticker-${index}`}
                        onClick={() => navigate(`/product/${prod.id}`)}
                        className="flex items-center gap-2 shrink-0 cursor-pointer group transition-transform hover:scale-102"
                      >
                        <span className="text-xs font-extrabold text-slate-800 group-hover:text-violet-700 transition-colors">
                          {prod.name} Price in BD
                        </span>
                        <span className="text-xs font-black text-violet-700">
                          ৳{minPrice.toFixed(0)}
                        </span>
                        <span className="bg-violet-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                          -{discountPercent}%
                        </span>
                        <span className="text-slate-300 font-bold ml-2">|</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= BEST SELLERS / POPULAR ITEMS SECTION ================= */}
        {(() => {
          const hotProducts = products.filter(p => p.is_hot || p.is_featured);
          const bestSellers = hotProducts.length >= 3 ? hotProducts.slice(0, 5) : products.slice(0, 5);

          if (bestSellers.length === 0) return null;

          return (
            <div className="w-full text-left mt-8 mb-6">
              {/* Best Seller Header Bar */}
              <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Top Selling</span>
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 flex items-center gap-1">
                      🔥 Hot Items
                    </span>
                  </h2>
                </div>
                <Link
                  to="/products?filter=hot"
                  className="text-xs font-extrabold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 group"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* 5-Column Responsive Glassmorphism Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {bestSellers.map((prod) => {
                  const currentPrice = getProductDisplayPrice(prod);
                  const isOutOfStock = prod.stock === 0;
                  const hasDiscount = prod.discount_percent && parseFloat(prod.discount_percent) > currentPrice;
                  const originalPrice = hasDiscount ? parseFloat(prod.discount_percent) : 0;
                  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleProductClick(prod.id)}
                      className="bg-gradient-to-b from-amber-100/70 via-orange-50/50 to-white/95 backdrop-blur-xl border border-white/90 rounded-3xl p-3.5 shadow-lg shadow-amber-500/5 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 relative flex flex-col justify-between group cursor-pointer text-left"
                    >
                      {/* Top Inner Glass Image Box */}
                      <div>
                        <div className="relative aspect-square w-full bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl flex items-center justify-center shadow-inner shadow-white/60 mb-3 overflow-hidden">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 font-extrabold uppercase">No Image</span>
                          )}

                          {/* Badges Over Image Box */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                            <span className="bg-slate-900/40 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/40 shadow-2xs">
                              ELITEPASS
                            </span>
                            <span className="bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-white/90 shadow-2xs flex items-center gap-0.5">
                              ⚡ Best Seller
                            </span>
                          </div>

                          {/* Bottom Badge Over Image */}
                          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                            {hasDiscount ? (
                              <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                                -{discountPercent}%
                              </span>
                            ) : (
                              <span className="bg-slate-900/80 backdrop-blur-md text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5" /> Instant
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Title */}
                        <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2 min-h-[2.4rem] leading-snug group-hover:text-amber-700 transition-colors">
                          {prod.name}
                        </h4>

                        {/* Star Ratings */}
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-bold">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.round(prod.avg_rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                          <span>({prod.avg_rating > 0 ? (prod.avg_rating * 35).toFixed(0) : '170'})</span>
                        </div>

                        {/* Price Line */}
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className="text-base font-black text-violet-700">
                            ৳{currentPrice.toFixed(0)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs font-bold text-slate-400 line-through">
                              ৳{originalPrice.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons (3 Buttons: Buy Now + WhatsApp + Cart) */}
                      <div className="mt-3 space-y-1.5">
                        <button
                          onClick={(e) => handleOrderNow(e, prod)}
                          disabled={isOutOfStock}
                          className="w-full bg-gradient-to-r from-[#005F4B]/90 via-[#005F4B] to-[#FF6D00] hover:from-[#005F4B] hover:to-[#FF6D00] text-white font-extrabold py-2 px-3 rounded-2xl text-xs shadow-md shadow-[#005F4B]/20 backdrop-blur-md border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all disabled:opacity-40"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Buy Now</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/8801925112444?text=${encodeURIComponent(`Hello! I want to order ${prod.name}`)}`, '_blank');
                            }}
                            className="bg-white/80 hover:bg-emerald-50 text-emerald-700 border border-slate-200/80 font-extrabold text-[10px] py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={(e) => handleAddToCart(e, prod)}
                            disabled={isOutOfStock}
                            className="bg-white/80 hover:bg-blue-50 text-blue-700 border border-slate-200/80 font-extrabold text-[10px] py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs disabled:opacity-40"
                          >
                            <ShoppingCart className="w-3 h-3 text-blue-600" />
                            <span>Cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ================= CATEGORY WISE PRODUCTS SECTION ================= */}
        <div className="w-full space-y-8 text-left mt-8">

          {/* Top Navigation Bar: Category Pills + Search & Sort */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Category Tabs Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
              {['All', ...new Set(products.map(p => p.category_name).filter(Boolean))].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${selectedCategory === cat
                    ? 'bg-violet-700 text-white shadow-md shadow-violet-700/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200/70'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right Search & Sort Controls */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-violet-600 focus:outline-none rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-violet-600 cursor-pointer"
              >
                <option value="newest">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC CATEGORY SECTIONS */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-bold">Loading product catalog...</div>
          ) : (
            Object.entries(productsByCategory)
              .filter(([categoryName]) => selectedCategory === 'All' || categoryName.toLowerCase() === selectedCategory.toLowerCase())
              .map(([categoryName, catProducts], catIdx) => {
                const filteredCatProducts = catProducts
                  .filter(p => !homeSearch || p.name.toLowerCase().includes(homeSearch.toLowerCase()))
                  .sort((a, b) => {
                    if (sortOption === 'price-low') return getProductDisplayPrice(a) - getProductDisplayPrice(b);
                    if (sortOption === 'price-high') return getProductDisplayPrice(b) - getProductDisplayPrice(a);
                    return b.id - a.id;
                  });

                if (filteredCatProducts.length === 0) return null;

                // Vibrant Pastel Gradients Palette per category
                const gradients = [
                  'from-purple-100/70 via-pink-50/50 to-white/95 shadow-purple-500/5',
                  'from-sky-100/70 via-blue-50/50 to-white/95 shadow-sky-500/5',
                  'from-amber-100/70 via-orange-50/50 to-white/95 shadow-orange-500/5',
                  'from-emerald-100/70 via-teal-50/50 to-white/95 shadow-teal-500/5',
                  'from-rose-100/70 via-pink-50/50 to-white/95 shadow-rose-500/5'
                ];
                const gradientStyle = gradients[catIdx % gradients.length];

                return (
                  <div key={categoryName} className="mb-10 text-left">
                    {/* Category Header Bar with Vertical Indicator */}
                    <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-violet-600 rounded-full inline-block" />
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>{categoryName}</span>
                          <span className="text-xs font-extrabold text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                            {filteredCatProducts.length}
                          </span>
                        </h2>
                      </div>
                      <Link
                        to={`/products?category=${encodeURIComponent(categoryName)}`}
                        className="text-xs font-extrabold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1 group"
                      >
                        <span>View all</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* 5-Column Responsive Glassmorphism Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                      {filteredCatProducts.map((prod) => {
                        const currentPrice = getProductDisplayPrice(prod);
                        const isOutOfStock = prod.stock === 0;
                        const hasDiscount = prod.discount_percent && parseFloat(prod.discount_percent) > currentPrice;
                        const originalPrice = hasDiscount ? parseFloat(prod.discount_percent) : 0;
                        const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleProductClick(prod.id)}
                            className={`bg-gradient-to-b ${gradientStyle} backdrop-blur-xl border border-white/90 rounded-3xl p-3.5 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 relative flex flex-col justify-between group cursor-pointer text-left`}
                          >
                            {/* Top Inner Glass Image Box */}
                            <div>
                              <div className="relative aspect-square w-full bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl flex items-center justify-center shadow-inner shadow-white/60 mb-3 overflow-hidden">
                                {prod.image_url ? (
                                  <img
                                    src={prod.image_url}
                                    alt={prod.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <span className="text-xs text-slate-400 font-extrabold uppercase">No Image</span>
                                )}

                                {/* Badges Over Image Box */}
                                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                                  <span className="bg-slate-900/40 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/40 shadow-2xs">
                                    ELITEPASS
                                  </span>
                                  <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-white/90 shadow-2xs truncate max-w-[90px]">
                                    {categoryName}
                                  </span>
                                </div>

                                {/* Bottom Badge Over Image */}
                                <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                                  {hasDiscount ? (
                                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                                      -{discountPercent}%
                                    </span>
                                  ) : (
                                    <span className="bg-slate-900/80 backdrop-blur-md text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                      <Zap className="w-2.5 h-2.5" /> Instant
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Product Title */}
                              <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2 min-h-[2.4rem] leading-snug group-hover:text-violet-700 transition-colors">
                                {prod.name}
                              </h4>

                              {/* Star Ratings */}
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-bold">
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < Math.round(prod.avg_rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                  ))}
                                </div>
                                <span>({prod.avg_rating > 0 ? (prod.avg_rating * 35).toFixed(0) : '170'})</span>
                              </div>

                              {/* Price Line */}
                              <div className="flex items-baseline gap-1.5 mt-2">
                                <span className="text-base font-black text-violet-700">
                                  ৳{currentPrice.toFixed(0)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-xs font-bold text-slate-400 line-through">
                                    ৳{originalPrice.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons (3 Buttons: Buy Now + WhatsApp + Cart) */}
                            <div className="mt-3 space-y-1.5">
                              <button
                                onClick={(e) => handleOrderNow(e, prod)}
                                disabled={isOutOfStock}
                                className="w-full bg-gradient-to-r from-[#005F4B]/90 via-[#005F4B] to-[#FF6D00] hover:from-[#005F4B] hover:to-[#FF6D00] text-white font-extrabold py-2 px-3 rounded-2xl text-xs shadow-md shadow-[#005F4B]/20 backdrop-blur-md border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all disabled:opacity-40"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Buy Now</span>
                              </button>

                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://wa.me/8801925112444?text=${encodeURIComponent(`Hello! I want to order ${prod.name}`)}`, '_blank');
                                  }}
                                  className="bg-white/80 hover:bg-emerald-50 text-emerald-700 border border-slate-200/80 font-extrabold text-[10px] py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>WhatsApp</span>
                                </button>

                                <button
                                  onClick={(e) => handleAddToCart(e, prod)}
                                  disabled={isOutOfStock}
                                  className="bg-white/80 hover:bg-blue-50 text-blue-700 border border-slate-200/80 font-extrabold text-[10px] py-1.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs disabled:opacity-40"
                                >
                                  <ShoppingCart className="w-3 h-3 text-blue-600" />
                                  <span>Cart</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>


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
