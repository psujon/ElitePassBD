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

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carousel slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Bengali FAQ accordion state
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

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
    addToCart(product, 1);
    navigate('/checkout');
  };

  // Filter products for sections
  const bestSellers = products.filter(p => p.tags && p.tags.toLowerCase().includes('best sellers')).slice(0, 4);
  const windowsProducts = products.filter(p => p.category_name && p.category_name.toLowerCase() === 'windows').slice(0, 4);
  const subscriptionProducts = products.filter(p => p.category_name && p.category_name.toLowerCase() === 'subscription').slice(0, 4);

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
  const hotName = hotProduct?.name || "Internet Download Manager";
  const hotImage = hotProduct?.image_url || "https://www.digitalproductsbd.com/wp-content/uploads/IDM-min-600x600.webp";
  const hotSub = hotProduct?.category_name || "5x FASTER DOWNLOAD";
  const hotCurrentPrice = hotProduct ? parseFloat(hotProduct.price) : 120.00;

  const hasHotDiscount = hotProduct && hotProduct.discount_percent !== null && hotProduct.discount_percent !== undefined && parseInt(hotProduct.discount_percent) > 0;
  const hotDiscountPercent = hasHotDiscount ? parseInt(hotProduct.discount_percent) : 45;
  const hotOriginalPrice = hotProduct ? (hasHotDiscount ? (hotCurrentPrice / (1 - hotDiscountPercent / 100)) : (hotCurrentPrice * 1.45)) : 244.00;

  // Split description sentences for checkmarks
  let hotBullets = [];
  if (hotProduct && hotProduct.description) {
    hotBullets = hotProduct.description
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
      title: "WE PROVIDE AUTHENTIC DIGITAL LICENSE.",
      subtitle: "THAT WILL ENSURE 100% SECURE YOUR DEVICE.",
      phone: "01925-112444",
      accent: "from-blue-600 to-indigo-900",
      images: [
        'https://www.digitalproductsbd.com/wp-content/uploads/Windows-11-Pro-min-600x600.webp',
        'https://www.digitalproductsbd.com/wp-content/uploads/Office-365-Pro-Plus-min-600x600.webp',
        'https://www.digitalproductsbd.com/wp-content/uploads/Windows-10-Pro-min-600x600.webp'
      ]
    },
    {
      id: 2,
      title: "PREMIUM AI & CREATIVE SUBSCRIPTIONS.",
      subtitle: "GET CHATGPT PLUS, ADOBE CC & MORE INSTANTLY.",
      phone: "01925-112444",
      accent: "from-violet-600 to-purple-950",
      images: [
        'https://www.digitalproductsbd.com/wp-content/uploads/Adobe-Creative-Cloud-min-600x600.webp',
        'https://www.digitalproductsbd.com/wp-content/uploads/Freepik-Premium-min-600x600.webp',
        'https://www.hatchwise.com/wp-content/uploads/2024/05/image-12-1024x623-1.jpeg'
      ]
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-15 md:mb-8">

          {/* Left: Dynamic Carousel Slider */}
          <div className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-xs h-[420px] group bg-slate-900">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 bg-gradient-to-r ${slide.accent} transition-opacity duration-1000 flex flex-col justify-between p-8 md:p-10 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                {/* Background graphic elements */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full filter blur-3xl -z-10" />

                {/* Slide Top Text */}
                <div className="max-w-md">
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest bg-yellow-400 text-slate-950 px-2.5 py-1 rounded-full mb-3 shadow-xs">
                    Licensed Authorized Dealer
                  </span>
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-xs md:text-sm text-slate-200 mt-2 font-medium">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Box Graphic Representation */}
                <div className="absolute right-4 md:right-8 bottom-20 flex gap-2 md:gap-4 select-none opacity-40 md:opacity-100">
                  {slide.images.map((imgUrl, i) => (
                    <div
                      key={i}
                      className={`w-16 h-22 md:w-24 md:h-32 bg-white rounded-lg shadow-xl border border-white/20 overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ${i === 1 ? '-translate-y-4 shadow-2xl scale-105 z-10' : 'scale-95'}`}
                    >
                      <img src={imgUrl} alt="Product package mockup" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {/* Slide Footer */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-white/10 pt-4 z-20">
                  <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm">
                    <Phone className="w-4.5 h-4.5 bg-yellow-400 text-slate-950 p-1 rounded-full animate-bounce" />
                    <span>{slide.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {slides.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setCurrentSlide(dotIdx)}
                        className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${dotIdx === currentSlide ? 'bg-white w-6' : 'bg-white/40'}`}
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
          <div className="flex flex-col gap-6 h-[420px]">

            {/* Promo 1: Dynamic Hot Selling Highlight Box */}
            <div
              onClick={() => {
                if (hotProduct) {
                  navigate(`/product/${hotProduct.id}`);
                } else {
                  navigate('/products?category=Windows');
                }
              }}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between flex-1 shadow-xs hover:border-slate-350 transition-colors cursor-pointer text-left"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    <img
                      src={hotImage}
                      alt={hotName}
                      className="w-10 h-10 object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-extrabold text-slate-900 line-clamp-1">{hotName}</h2>
                    <span className="text-[10px] bg-red-150 text-red-655 font-extrabold px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider">
                      {hotSub}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 line-through block">{hotOriginalPrice.toFixed(0)}৳</span>
                  <span className="text-sm font-extrabold text-blue-600">{hotCurrentPrice.toFixed(0)}৳</span>
                </div>
              </div>

              <ul className="my-2.5 space-y-1 text-[11px] text-slate-500 font-semibold text-left">
                {hotBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 line-clamp-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                  <Phone className="w-3 h-3" />
                  <span>01925-112444</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hotProduct) {
                      addToCart(hotProduct, 1);
                      navigate('/checkout');
                    } else {
                      navigate('/products?category=Windows');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer border-none"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Promo 2: Stacking Two Half-Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[360px] md:h-[180px]">

              {/* Education Subscription / Recent Product 1 */}
              <Link
                to={recent1Link}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full filter blur-xl -z-10 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-md">
                    {recent1Badge}
                  </span>
                  <h3 className="text-xs font-black tracking-tight mt-2 leading-snug max-w-[65%]">
                    {recent1Title}
                  </h3>
                </div>
                {recent1Image && (
                  <img
                    src={recent1Image}
                    alt={recent1Title}
                    className="absolute bottom-3 right-3 w-20 h-20 object-cover rounded-2xl bg-white/15 p-1.5 shadow-md border border-white/10 group-hover:scale-110 transition-transform duration-300"
                  />
                )}
                <span className="text-[10px] font-bold underline flex items-center gap-1">
                  View Details <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              {/* Big 65% Offer / Recent Product 2 */}
              <Link
                to={recent2Link}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full filter blur-xl -z-10 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-md">
                    {recent2Badge}
                  </span>
                  <h3 className="text-xs font-black tracking-tight mt-2 leading-snug max-w-[65%]">
                    {recent2Title}
                  </h3>
                </div>
                {recent2Image && (
                  <img
                    src={recent2Image}
                    alt={recent2Title}
                    className="absolute bottom-3 right-3 w-20 h-20 object-contain rounded-2xl bg-white/15 p-1.5 shadow-md border border-white/10 group-hover:scale-110 transition-transform duration-300"
                  />
                )}
                <span className="text-[10px] font-bold underline flex items-center gap-1">
                  View Details <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

            </div>

          </div>

        </div>


        {/* ================= SECTION 1: THE BEST SELLERS ================= */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 mb-12 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-5 bg-blue-600 rounded-md" />
              The Best Sellers
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {bestSellers.map((prod) => {
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
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-2 py-0.5 bg-red-100 text-red-655 text-[9px] font-extrabold rounded-full border border-red-200">
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
                      <div className="flex gap-0.5 my-1.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-450 text-amber-450" />
                        ))}
                      </div>
                      {/* Stock */}
                      <div className="text-[10px] font-bold text-slate-500 mb-2">
                        {isOutOfStock ? (
                          <span className="text-red-500">✗ Out of stock</span>
                        ) : (
                          <span className="text-emerald-600">✓ In stock</span>
                        )}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-3 pt-2 border-t border-slate-150">
                      <div className="flex items-baseline gap-1.5 mb-2.5">
                        <span className="text-xs font-black text-blue-600">{currentPrice.toFixed(0)}৳</span>
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


        {/* ================= SECTION 2: MICROSOFT WINDOWS ================= */}
        <div className="mb-12">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-6">
            <h2 className="text-md font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-sm" />
              Microsoft Windows
            </h2>
            <Link
              to="/products?category=Windows"
              className="text-xxs text-white font-bold bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-full transition-all shadow-xs"
            >
              VIEW ALL
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-400">Loading products...</div>
          ) : windowsProducts.length === 0 ? (
            <div className="py-10 text-center text-slate-400">No products found in Windows.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {windowsProducts.map((prod) => {
                const currentPrice = parseFloat(prod.price);
                const isOutOfStock = prod.stock === 0;

                // Real original price and discount percent if specified
                const hasDiscount = prod.discount_percent !== null && prod.discount_percent !== undefined && parseInt(prod.discount_percent) > 0;
                const discountPercent = hasDiscount ? parseInt(prod.discount_percent) : 0;
                const originalPrice = hasDiscount ? (currentPrice / (1 - discountPercent / 100)) : 0;

                // Fake eye view count based on id
                const views = 200 + (prod.id * 83) % 300;

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
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-2.5 py-1 bg-red-50 text-red-655 text-[10px] font-extrabold rounded-full border border-red-200">
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

                        {/* Views & Price line */}
                        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-bold">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>{views}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-blue-600 text-sm font-black">{currentPrice.toFixed(0)}৳</span>
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
                          Order Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* ================= SECTION 3: SUBSCRIPTION ================= */}
        <div className="mb-16">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-6">
            <h2 className="text-md font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-sm" />
              OTT Subscription
            </h2>
            <Link
              to="/products?category=Subscription"
              className="text-xxs text-white font-bold bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-full transition-all shadow-xs"
            >
              VIEW ALL
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-400">Loading products...</div>
          ) : subscriptionProducts.length === 0 ? (
            <div className="py-10 text-center text-slate-400">No products found in Subscriptions.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {subscriptionProducts.map((prod) => {
                const currentPrice = parseFloat(prod.price);
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
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-2.5 py-1 bg-red-50 text-red-655 text-[10px] font-extrabold rounded-full border border-red-200">
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

                        {/* Views & Price line */}
                        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-bold">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>{views}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-blue-600 text-sm font-black">{currentPrice.toFixed(0)}৳</span>
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
                          Order Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* ================= SECTION 4: WHY CHOOSE US ================= */}
        <div className="bg-slate-50 border border-slate-150 rounded-3xl p-8 mb-12 shadow-xs text-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Why Choose ElitePassBD?
          </h2>
          <p className="text-slate-500 text-xs mt-2 max-w-lg mx-auto">
            We're committed to providing the best software purchasing experience with guaranteed authenticity and support.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center shadow-xxs">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-950">100% Genuine Licenses</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                All our licenses are sourced from official channels. No cracks, no torrents - just authentic software.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center shadow-xxs">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-950">Instant Email Delivery</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Receive your license key and download link within minutes of purchase. No waiting required.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center shadow-xxs">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-950">Secure Activation</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                One-time purchase for lasting use. No recurring fees or subscription renewals for perpetual licenses.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center shadow-xxs">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-950">Secure Payment</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Multiple payment options including bKash, Nagad, cards, and international methods like Payoneer.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center shadow-xxs">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-950">Money-Back Guarantee</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Not satisfied? Get a full refund within 7 days if you face any activation issues.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center shadow-xxs">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-950">24/7 Support</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Our team is always ready to help with activation, installation, or any questions you have.
              </p>
            </div>
          </div>
        </div>


        {/* ================= SECTION 5: HOW IT WORKS ================= */}
        <div className="bg-slate-50 border border-slate-150 rounded-3xl p-8 mb-12 shadow-xs text-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-slate-500 text-xs mt-2 mx-auto max-w-sm">
            Get your software license in just 3 simple steps
          </p>

          <div className="relative flex flex-col md:flex-row justify-between gap-8 mt-12 px-4">

            {/* Flowchart connecting line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-16 right-16 h-0.5 bg-slate-200 -z-10" />

            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-6">
                <span className="absolute -top-3.5 -right-3.5 bg-blue-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-50 shadow-sm">
                  1
                </span>
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-sm">
                  <Search className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-900">Choose Your Software</h3>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold max-w-xs">
                Browse our catalog and select the software license you need. Compare options and find the best deal.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-6">
                <span className="absolute -top-3.5 -right-3.5 bg-blue-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-50 shadow-sm">
                  2
                </span>
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-900">Complete Payment</h3>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold max-w-xs">
                Pay securely using bKash, Nagad, credit card, or other methods. Your transaction is protected.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-6">
                <span className="absolute -top-3.5 -right-3.5 bg-blue-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-50 shadow-sm">
                  3
                </span>
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-900">Receive & Activate</h3>
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

      </div>
    </div>
  );
}
