import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import {
  Star, ShoppingBag, Plus, Minus, Loader2, ChevronDown,
  Tag, Info, HelpCircle, ArrowLeft, Layers, Heart, CheckCircle2, Phone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/fbPixel';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const reviewsRef = React.useRef(null);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [reviewerEmail, setReviewerEmail] = useState(user?.email || '');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name && !reviewerName) setReviewerName(user.name);
      if (user.email && !reviewerEmail) setReviewerEmail(user.email);
    }
  }, [user]);

  const handleReviewClick = () => {
    if (reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) {
      toast.error('Please write a review comment.');
      return;
    }
    if (!reviewerName.trim()) {
      toast.error('Please enter your name.');
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post(`/products/${product.id}/reviews`, {
        rating: newReviewRating,
        text: newReviewText.trim(),
        reviewer_name: reviewerName.trim(),
        reviewer_email: reviewerEmail.trim()
      });
      toast.success('Thank you! Your review has been submitted successfully.');
      setNewReviewText('');
      fetchReviews(product.id);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // User selections
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedActivation, setSelectedActivation] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Tab State
  const [activeTab, setActiveTab] = useState('description'); // 'description' or 'additional'

  // FAQ Accordion State (stores key-index of open FAQ item)
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Favorite button
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  // Sync package selection when activation choice changes
  useEffect(() => {
    if (product && product.packages && product.packages.length > 0) {
      const activations = product.activation_options
        ? product.activation_options.split(',').map(a => a.trim()).filter(Boolean)
        : [];

      const filtered = product.packages.filter(pkg => {
        if (activations.length > 0 && selectedActivation) {
          if (!pkg.activation) return true;
          return pkg.activation.toLowerCase() === selectedActivation.toLowerCase();
        }
        return true;
      });

      if (filtered.length > 0) {
        const isStillAvailable = filtered.some(p => p.duration === selectedPackage?.duration && p.activation === selectedPackage?.activation);
        if (!isStillAvailable) {
          setSelectedPackage(filtered[0]);
        }
      } else {
        setSelectedPackage(null);
      }
    }
  }, [selectedActivation, product]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const prodData = await api.get(`/products/${id}`);
      setProduct(prodData);

      // Trigger ViewContent tracking event
      trackEvent('ViewContent', {
        content_ids: [String(prodData.id)],
        content_name: prodData.name,
        content_type: 'product',
        value: parseFloat(prodData.price),
        currency: 'BDT'
      });

      // Trigger GA4 view_item event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'ecommerce': null });
      window.dataLayer.push({
        'event': 'view_item',
        'ecommerce': {
          'currency': 'BDT',
          'value': parseFloat(prodData.price),
          'items': [{
            'item_id': String(prodData.id),
            'item_name': prodData.name,
            'price': parseFloat(prodData.price),
            'quantity': 1
          }]
        }
      });

      // Pre-select first package if packages exist
      if (prodData.packages && prodData.packages.length > 0) {
        setSelectedPackage(prodData.packages[0]);
      } else {
        setSelectedPackage(null);
      }

      // Pre-select first options if device/activation options exist
      if (prodData.device_options) {
        const devices = prodData.device_options.split(',').map(d => d.trim()).filter(Boolean);
        if (devices.length > 0) setSelectedDevice(devices[0]);
      } else {
        setSelectedDevice('');
      }

      if (prodData.activation_options) {
        const activations = prodData.activation_options.split(',').map(a => a.trim()).filter(Boolean);
        if (activations.length > 0) setSelectedActivation(activations[0]);
      } else {
        setSelectedActivation('');
      }

      // Reset quantity
      setQuantity(1);

      // Fetch reviews
      fetchReviews(prodData.id);

      // Fetch related products
      if (prodData.category_id) {
        fetchRelated(prodData.category_id, prodData.id);
      } else {
        setRelatedProducts([]);
      }

    } catch (err) {
      console.error(err);
      setError('Product not found or failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      setReviewsLoading(true);
      const data = await api.get(`/products/${productId}/reviews`);
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchRelated = async (categoryId, currentProdId) => {
    try {
      setRelatedLoading(true);
      const allProds = await api.get('/products');
      // filter by same category and exclude current product
      const filtered = allProds.filter(p => p.category_id === categoryId && p.id !== currentProdId);
      setRelatedProducts(filtered.slice(0, 4)); // max 4 related products
    } catch (err) {
      console.error('Failed to load related products:', err);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const success = addToCart(product, quantity, selectedPackage, selectedDevice, selectedActivation);
    if (success) {
      const priceToUse = selectedPackage ? parseFloat(selectedPackage.price) : parseFloat(product.price);
      trackEvent('AddToCart', {
        content_ids: [String(product.id)],
        content_name: product.name,
        content_type: 'product',
        value: priceToUse * quantity,
        currency: 'BDT',
        contents: [{
          id: String(product.id),
          quantity: parseInt(quantity),
          item_price: priceToUse
        }]
      });
      // Small feedback dialog / confirm
      toast.success(`Added to cart: ${product.name} ${selectedPackage ? `(${selectedPackage.duration})` : ''}`);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const success = addToCart(product, quantity, selectedPackage, selectedDevice, selectedActivation);
    if (success) {
      const priceToUse = selectedPackage ? parseFloat(selectedPackage.price) : parseFloat(product.price);
      trackEvent('AddToCart', {
        content_ids: [String(product.id)],
        content_name: product.name,
        content_type: 'product',
        value: priceToUse * quantity,
        currency: 'BDT',
        contents: [{
          id: String(product.id),
          quantity: parseInt(quantity),
          item_price: priceToUse
        }]
      });
      navigate('/checkout');
    }
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const supportNumber = '8801925112444';
    const productInfo = `Hello, I'm interested in ordering: ${product.name}${selectedPackage ? ` (${selectedPackage.duration})` : ''} - Price: ৳${displayPrice}. Please assist.`;
    const encodedText = encodeURIComponent(productInfo);
    window.open(`https://wa.me/${supportNumber}?text=${encodedText}`, '_blank');
  };

  // Compute average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md w-full mx-auto px-4 py-20 text-center">
        <div className="glass-card rounded-2xl p-8 border border-red-500/20">
          <span className="text-4xl block mb-2">⚠️</span>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Something went wrong.'}</p>
          <Link to="/" className="inline-block px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const parsedDevices = product.device_options
    ? product.device_options.split(',').map(d => d.trim()).filter(Boolean)
    : [];

  const parsedActivations = product.activation_options
    ? product.activation_options.split(',').map(a => a.trim()).filter(Boolean)
    : [];

  const parsedTags = product.tags
    ? product.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const filteredPackages = product.packages
    ? product.packages.filter(pkg => {
      if (parsedActivations.length > 0 && selectedActivation) {
        if (!pkg.activation) return true;
        return pkg.activation.toLowerCase() === selectedActivation.toLowerCase();
      }
      return true;
    })
    : [];

  const displayPrice = selectedPackage
    ? parseFloat(selectedPackage.price)
    : product ? parseFloat(product.price) : 0;

  const activeDiscountAmount = selectedPackage
    ? (selectedPackage.discount !== undefined && selectedPackage.discount !== null && selectedPackage.discount !== '' ? parseFloat(selectedPackage.discount) : 0)
    : (product && product.discount_percent ? parseFloat(product.discount_percent) : 0);

  let hasDiscount = false;
  let originalPrice = 0;
  let discountPercent = 0;

  if (activeDiscountAmount > displayPrice) {
    hasDiscount = true;
    originalPrice = activeDiscountAmount;
    discountPercent = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);
  } else if (activeDiscountAmount > 0 && activeDiscountAmount <= 100) {
    hasDiscount = true;
    originalPrice = displayPrice / (1 - activeDiscountAmount / 100);
    discountPercent = Math.round(activeDiscountAmount);
  }

  const selectedPackageStock = selectedPackage && selectedPackage.stock !== undefined && selectedPackage.stock !== null && selectedPackage.stock !== ''
    ? parseInt(selectedPackage.stock)
    : (product ? product.stock : 0);

  const priceRange = product?.packages && product.packages.length > 0
    ? `${Math.min(...product.packages.map(p => parseFloat(p.price)))}-${Math.max(...product.packages.map(p => parseFloat(p.price)))} ৳`
    : `${displayPrice.toFixed(0)} ৳`;

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-8 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6">

        {/* Back navigation */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-8 transition-colors group cursor-pointer border-none bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Store Catalog</span>
        </button>

        {/* Main product configuration layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">

          {/* Left Column: ShahedStore Style Glass Image Box & Showcase Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-purple-50/70 via-indigo-50/50 to-blue-50/60 border border-purple-100/90 rounded-xl shadow-xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-center text-left">

              {/* Center 3D Showcase Image Card */}
              <div className="relative w-full aspect-square bg-white/75 backdrop-blur-xl border border-white/90 rounded-xl p-1 shadow-xl shadow-purple-500/10 flex items-center justify-center overflow-hidden group">
                {/* Heart Icon Overlay Directly On Top of Product Image */}
                <button
                  onClick={() => {
                    setIsFavorite(!isFavorite);
                    toast.success(isFavorite ? 'Removed from Wishlist' : 'Added to Wishlist!');
                  }}
                  className={`absolute top-10 left-10 z-30 w-10 h-10 rounded-full bg-white/95 border border-white/90 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                    }`}
                  title="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                </button>

                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 filter drop-shadow-md rounded-xl"
                  />
                ) : (
                  <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">No Product Image</span>
                )}

                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-20">
                    <span className="px-5 py-2 bg-red-600 text-white text-xs font-extrabold rounded-full shadow-lg uppercase tracking-wider">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Checkmark Pills Below Image */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-extrabold text-slate-700 text-center">
              <div className="bg-white/90 border border-purple-100/90 rounded-2xl p-2.5 flex items-center justify-center space-x-1.5 shadow-2xs">
                <span className="text-amber-500">⚡</span>
                <span>Instant Delivery</span>
              </div>
              <div className="bg-white/90 border border-purple-100/90 rounded-2xl p-2.5 flex items-center justify-center space-x-1.5 shadow-2xs">
                <span className="text-emerald-500 font-black">✓</span>
                <span>100% Genuine</span>
              </div>
              <div className="bg-white/90 border border-purple-100/90 rounded-2xl p-2.5 flex items-center justify-center space-x-1.5 shadow-2xs">
                <span className="text-blue-500">🕒</span>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Column: Selections and Buy Card */}
          <div className="lg:col-span-7 text-left space-y-5">

            {/* Top Outer Glass Card (Matching 1st Image Design) */}
            <div className="bg-white/80 backdrop-blur-xl border border-purple-200/70 rounded-3xl p-5 sm:p-6 shadow-xl shadow-purple-500/5 relative overflow-hidden space-y-4">

              {/* Top Gradient Border Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600"></div>

              {/* Category badge & Share Action row */}
              <div className="flex justify-between items-center pt-1">
                <span className="px-3 py-1 bg-cyan-50 border border-cyan-200/70 text-cyan-700 text-xs font-black rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1">
                  DIGITAL PRODUCT
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Product link copied to clipboard!');
                  }}
                  className="bg-white/90 border border-slate-200/80 hover:bg-slate-50 text-slate-600 font-bold text-xs px-3.5 py-1 rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Share</span>
                </button>
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Bullet Points / Highlighted Text snippet */}
              {(() => {
                let bullets = [];
                if (product.highlighted_text && product.highlighted_text.trim()) {
                  bullets = product.highlighted_text
                    .split(/\r?\n|;/)
                    .map(line => line.trim().replace(/^[•\-\*🔘\s]+/, ''))
                    .filter(Boolean);
                }

                if (bullets.length === 0) {
                  const cleanDesc = product.description ? product.description.replace(/<[^>]*>?/gm, '').trim() : '';
                  bullets = [
                    `${product.name} জেনুইন ডিজিটাল লাইসেন্স কিনুন এলিম পাস বিডি থেকে।`,
                    cleanDesc ? (cleanDesc.length > 120 ? cleanDesc.slice(0, 120) + '...' : cleanDesc) : 'These keys can be used on the same PCs to reactivate after reinstallation.',
                    'Lifetime Activation & Instant Delivery Support.'
                  ];
                }

                return (
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                    {bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full border-2 border-violet-600 bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>
                        </div>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}

              {/* Ratings Summary & Stock Status Badge */}
              <div className="flex items-center space-x-3 text-xs pt-1">
                <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-full text-amber-800 font-extrabold shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9</span>
                </div>
                <span className="text-slate-400 font-bold">
                  • {product.total_sold !== undefined && product.total_sold > 0 ? `${product.total_sold}+ sold` : '50+ sold'}
                </span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full text-emerald-700 font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{product.stock === 0 ? 'Out of stock' : 'In Stock'}</span>
                </div>
              </div>

              {/* Glass Pricing Box Card */}
              <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/60 border border-purple-100/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-2xs">
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    ৳{displayPrice.toFixed(0)}
                  </span>
                  {hasDiscount && originalPrice > displayPrice && (
                    <span className="text-sm sm:text-base text-slate-400 line-through font-bold">
                      ৳{originalPrice.toFixed(0)}
                    </span>
                  )}
                  {hasDiscount && originalPrice > displayPrice && (
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                      Save ৳{Math.round(originalPrice - displayPrice)}
                    </span>
                  )}
                </div>

                {hasDiscount && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-2xs">
                    -{discountPercent}% OFF
                  </div>
                )}
              </div>

            </div>

            {/* Activation Type / Option Selection Pills */}
            {parsedActivations.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-extrabold text-slate-800 block"> Activation Type</span>
                <div className="flex flex-wrap gap-2">
                  {parsedActivations.map((activation, idx) => {
                    const isSelected = selectedActivation?.toLowerCase() === activation.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedActivation(activation)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-2 ${isSelected
                          ? 'border-2 border-violet-600 bg-violet-50 text-violet-900 shadow-sm'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-violet-600 bg-violet-600' : 'border-slate-300'}`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        </div>
                        <span>{activation}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Device / System Display Badge (Non-clickable Information) */}
            {parsedDevices.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-extrabold text-slate-800 block">Compatible Devices/Systems</span>
                <div className="flex flex-wrap gap-2">
                  {parsedDevices.map((device, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-100/90 border border-slate-200/80 text-slate-800 font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 select-none shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                      <span>{device}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* "মেয়াদ ও মূল্য পরিকল্পনা" (Plan Selection Options Box) */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-slate-800 block">Plans & Pricing</span>

              {filteredPackages && filteredPackages.length > 0 ? (
                <div className="space-y-2">
                  {filteredPackages.map((pkg, idx) => {
                    const isSelected = selectedPackage?.duration === pkg.duration && selectedPackage?.activation === pkg.activation;
                    const pkgDiscount = pkg.discount !== undefined && pkg.discount !== null && pkg.discount !== '' ? parseFloat(pkg.discount) : (product.discount_percent ? parseFloat(product.discount_percent) : 0);
                    const pkgHasDiscount = pkgDiscount > parseFloat(pkg.price);
                    const pkgOriginalPrice = pkgHasDiscount ? pkgDiscount : 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center text-left ${isSelected
                          ? 'border-2 border-violet-600 bg-violet-50/50 shadow-md'
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 ${isSelected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                          </div>
                          <div>
                            <p className={`text-xs font-extrabold ${isSelected ? 'text-violet-900' : 'text-slate-800'}`}>{pkg.duration}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{product.name} {pkg.activation ? `· ${pkg.activation}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pkgHasDiscount && (
                            <span className="text-[10px] font-bold text-slate-400 line-through">৳{pkgOriginalPrice.toFixed(0)}</span>
                          )}
                          <span className="text-xs sm:text-sm font-black text-slate-900">৳{parseFloat(pkg.price).toFixed(0)}</span>
                          {pkgHasDiscount && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                              -{Math.round(((pkgOriginalPrice - parseFloat(pkg.price)) / pkgOriginalPrice) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border-2 border-violet-600 bg-violet-50/50 shadow-md flex justify-between items-center text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full border-4 border-violet-600 bg-white shrink-0"></div>
                    <span className="text-xs font-extrabold text-violet-950">Standard Lifetime Activation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasDiscount && <span className="text-[10px] font-bold text-slate-400 line-through">৳{originalPrice.toFixed(0)}</span>}
                    <span className="text-xs sm:text-sm font-black text-slate-900">৳{displayPrice.toFixed(0)}</span>
                    {hasDiscount && <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">-{Math.round(((originalPrice - displayPrice) / (originalPrice || 1)) * 100)}%</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="pt-2">
              <span className="text-xs font-extrabold text-slate-800 block mb-2">Quantity</span>
              <div className="flex items-center bg-slate-100/80 border border-slate-200/80 rounded-full px-3 py-1 shadow-2xs w-max">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-900 w-8 text-center select-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedPackageStock, quantity + 1))}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ShahedStore Style CTA Action Buttons (Matching Logo Color Gradient) */}
            <div className="space-y-3 pt-3">
              {/* Row 1: Primary Full Width Buy Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={selectedPackageStock === 0}
                className="w-full bg-gradient-to-r from-[#005F4B]/90 via-[#005F4B] to-[#FF6D00] hover:from-[#005F4B] hover:to-[#FF6D00] text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-[#005F4B]/20 backdrop-blur-md border border-white/20 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 transition-all text-base sm:text-lg disabled:opacity-40"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Buy Now</span>
              </button>

              {/* Row 2: WhatsApp + Add to Cart Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleWhatsAppOrder}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-md shadow-emerald-600/25 border border-white/20 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer active:scale-98 transition-all"
                >
                  <Phone className="w-4.5 h-4.5 text-white" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={selectedPackageStock === 0}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-md shadow-indigo-600/25 border border-white/20 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer active:scale-98 transition-all disabled:opacity-40"
                >
                  <ShoppingBag className="w-4.5 h-4.5 text-white" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>

            {/* Product metadata definitions */}
            {product.category_name && (
              <div className="border-t border-slate-200/80 pt-4 space-y-2 text-xxs text-slate-500">
                <div>
                  <span className="font-bold text-slate-450 tracking-wide">Categories:</span>
                  <span className="ml-1 text-slate-600 font-semibold">{product.category_name}</span>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Product Description & Additional Description Section */}
        {(() => {
          const hasAdditionalInfo = product?.additional_info &&
            product.additional_info.replace(/<[^>]*>/g, '').trim().length > 0;

          if (hasAdditionalInfo) {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 text-left">
                {/* Grid 1: Product Description */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                      Product Description
                    </h3>
                  </div>
                  <div className="bg-white/90 border border-blue-100/90 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xl">
                    <div
                      className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-normal"
                      dangerouslySetInnerHTML={{ __html: product.description || '<p class="italic text-slate-400">No product description available.</p>' }}
                    />
                  </div>
                </div>

                {/* Grid 2: Additional Description */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-5 bg-gradient-to-b from-indigo-600 to-violet-600 rounded-full"></span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                      Additional Description
                    </h3>
                  </div>
                  <div className="bg-white/90 border border-indigo-100/90 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xl">
                    <div
                      className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-normal"
                      dangerouslySetInnerHTML={{ __html: product.additional_info }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          // Single Full-Width Product Description when Additional Description is empty
          return (
            <div className="space-y-3 mb-16 text-left w-full">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Product Description
                </h3>
              </div>
              <div className="bg-white/90 border border-blue-100/90 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xl w-full">
                <div
                  className="prose max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-normal"
                  dangerouslySetInnerHTML={{ __html: product.description || '<p class="italic text-slate-400">No product description available.</p>' }}
                />
              </div>
            </div>
          );
        })()}

        {/* FAQs Section */}
        {product.faqs && product.faqs.length > 0 && (
          <div className="mb-16 text-left space-y-6">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-violet-500" />
              <h2 className="text-xl font-extrabold text-slate-850 tracking-tight">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {product.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-200 shadow-xs"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-6 py-4 flex justify-between items-center text-xs font-bold text-slate-800 text-left cursor-pointer hover:bg-slate-50"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-250 ${isOpen ? 'rotate-180 text-violet-500' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs text-slate-500 border-t border-slate-100 bg-slate-50/35 leading-relaxed whitespace-pre-wrap">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer Reviews Details List & Submission Box */}
        <div ref={reviewsRef} id="reviews-section" className="mb-16 text-left space-y-6">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-xl font-extrabold text-slate-855 tracking-tight">Customer Reviews</h2>
          </div>

          {/* Review Submission Form Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <span>Write a Review</span>
            </h3>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Rating Star Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rating Stars *
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-600">({newReviewRating} / 5)</span>
                </div>
              </div>

              {/* Name & Email inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-slate-800 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-slate-800 font-semibold"
                    required
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                    <span>🔒</span>
                    <span>Your email address will not be visible to anyone.</span>
                  </p>
                </div>
              </div>

              {/* Review Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Review Comments *
                </label>
                <textarea
                  rows="3"
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Write your honest review about this product..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-slate-800 font-medium resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center space-x-2"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </form>
          </div>

          {/* List of Reviews */}
          {reviewsLoading ? (
            <div className="py-8 flex justify-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-450 italic text-xs shadow-xs">
              There are no reviews for this product yet. Be the first to leave a review above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs">{rev.user_name}</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">
                        {new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    "{rev.text}"
                  </p>

                  <div className="flex items-center space-x-1 text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Customer Review</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="text-left space-y-6">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-violet-500" />
              <h2 className="text-xl font-extrabold text-slate-855 tracking-tight">Related Products</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => navigate(`/product/${prod.id}`)}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer group shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
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
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200/85 text-[10px] font-bold rounded-full">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-800 truncate group-hover:text-violet-650 transition-colors">{prod.name}</h3>
                      <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {prod.description ? prod.description.replace(/<[^>]*>?/gm, '') : ''}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-450 block">Price</span>
                        <span className="text-xs font-extrabold text-slate-800">
                          ৳{parseFloat(prod.price).toFixed(0)}
                        </span>
                      </div>

                      <span className="px-3 py-1.5 bg-violet-50 group-hover:bg-violet-600 text-violet-600 group-hover:text-white border border-violet-100 group-hover:border-transparent text-[10px] font-bold rounded-lg transition-all">
                        Details
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
