import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import {
  Star, ShoppingBag, Plus, Minus, Loader2, ChevronDown,
  Tag, Info, HelpCircle, ArrowLeft, Layers, Heart, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

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
      // Small feedback dialog / confirm
      toast.success(`Added to cart: ${product.name} ${selectedPackage ? `(${selectedPackage.duration})` : ''}`);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const success = addToCart(product, quantity, selectedPackage, selectedDevice, selectedActivation);
    if (success) {
      navigate('/checkout');
    }
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

  const priceRange = filteredPackages.length > 0
    ? `৳${Math.min(...filteredPackages.map(p => parseFloat(p.price)))} - ৳${Math.max(...filteredPackages.map(p => parseFloat(p.price)))}`
    : product ? `৳${parseFloat(product.price).toFixed(2)}` : '৳0.00';

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

          {/* Left Column: Image Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-6 relative group shadow-xs">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-102"
                />
              ) : (
                <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">No Product Image</span>
              )}

              {product.stock === 0 && (
                <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center">
                  <span className="px-4 py-1.5 bg-red-50 text-red-655 border border-red-200/85 text-xs font-bold rounded-full">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selections and Buy Card */}
          <div className="lg:col-span-7 text-left space-y-6">

            {/* Header Product Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${product.stock === 0
                  ? 'bg-red-50 text-red-600 border-red-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  {product.stock === 0 ? 'Out of Stock' : 'In Stock & Ready'}
                </span>
                {product.category_name && (
                  <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-full">
                    <Layers className="w-3 h-3" />
                    <span>{product.category_name}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Ratings Summary */}
              <div className="flex items-center space-x-4">
                <div className="flex space-x-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(avgRating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500">
                  {reviews.length > 0 ? `${avgRating} / 5.0 (${reviews.length} customer reviews)` : 'No reviews yet'}
                </span>
              </div>

              {/* Price display */}
              <div className="pt-2">
                <span className="text-xxs text-slate-450  font-bold tracking-wider block">Price</span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <span className="text-3xl font-black text-slate-850">
                    ৳{displayPrice.toFixed(0)}
                  </span>
                  {product.packages && product.packages.length > 1 && (
                    <span className="text-xs text-slate-500 font-semibold">
                      (Range: {priceRange})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-6 space-y-6">



              {/* 2. Device selection if present */}
              {parsedDevices.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xxs font-bold text-slate-500  tracking-wider block">Compatible Devices</span>
                  <div className="flex flex-wrap gap-2">
                    {parsedDevices.map((dev) => (
                      <button
                        key={dev}
                        onClick={() => setSelectedDevice(dev)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${selectedDevice === dev
                          ? 'bg-violet-600 border-transparent text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-350 shadow-xs'
                          }`}
                      >
                        {dev}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Activation option selector if present */}
              {parsedActivations.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xxs font-bold text-slate-500  tracking-wider block">Account Type</span>
                  <div className="flex flex-wrap gap-2">
                    {parsedActivations.map((act) => (
                      <button
                        key={act}
                        onClick={() => setSelectedActivation(act)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${selectedActivation === act
                          ? 'bg-violet-600 border-transparent text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-350 shadow-xs'
                          }`}
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Package options month wise */}
              {filteredPackages && filteredPackages.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xxs font-bold text-slate-500  tracking-wider block">Choose Plan</span>
                  <div className="flex flex-wrap gap-2">
                    {filteredPackages.map((pkg, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${selectedPackage?.duration === pkg.duration && selectedPackage?.activation === pkg.activation
                          ? 'bg-violet-600 border-transparent text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-350 shadow-xs'
                          }`}
                      >
                        {pkg.duration} - ৳{parseFloat(pkg.price).toFixed(0)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and Actions */}
              <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-slate-200/80">
                <div className="space-y-2">
                  <span className="text-xxs font-bold text-slate-500  tracking-wider block">Quantity</span>
                  <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 px-3 w-8 text-center select-none">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 flex-1 min-w-[240px]">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 py-3 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-violet-600" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock === 0}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Product metadata definitions */}
            <div className="border-t border-slate-200/80 pt-6 space-y-2 text-xxs text-slate-500">
              {/* <div>
                <span className="font-bold text-slate-450  tracking-wide">SKU:</span>
                <span className="ml-1 text-slate-600 font-semibold">EP-PROD-{product.id}</span>
              </div> */}
              {product.category_name && (
                <div>
                  <span className="font-bold text-slate-450  tracking-wide">Categories:</span>
                  <span className="ml-1 text-slate-600 font-semibold ">{product.category_name}</span>
                </div>
              )}
              {parsedTags.length > 0 && (
                <div className="flex items-center">
                  {/* <span className="font-bold text-slate-450  tracking-wide mr-1.5 shrink-0">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {parsedTags.map((t, idx) => (
                      <span key={idx} className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div> */}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Tabs Layout Description / Additional Information */}
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden mb-16 text-left shadow-xs">
          {/* Tab triggers */}
          <div className="flex border-b border-slate-200/80 bg-slate-50">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'description'
                ? 'text-violet-600 border-violet-500 bg-white'
                : 'text-slate-550 border-transparent hover:text-slate-800'
                }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('additional')}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'additional'
                ? 'text-violet-600 border-violet-500 bg-white'
                : 'text-slate-550 border-transparent hover:text-slate-800'
                }`}
            >
              Additional Information
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 space-y-4 text-slate-600">
            {activeTab === 'description' ? (
              <div
                className="prose max-w-none text-sm text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description || '' }}
              />
            ) : (
              <div
                className="prose max-w-none text-sm text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: product.additional_info || '<p class="italic text-slate-400">No additional information available for this product.</p>'
                }}
              />
            )}
          </div>
        </div>

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

        {/* Customer Reviews Details List */}
        <div className="mb-16 text-left space-y-6">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-xl font-extrabold text-slate-855 tracking-tight">Customer Reviews</h2>
          </div>

          {reviewsLoading ? (
            <div className="py-8 flex justify-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-10 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-450 italic text-xs shadow-xs">
              There are no reviews for this product yet. Only purchased users can leave verified ratings.
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
                    <span>Verified Purchase</span>
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
                        {prod.description}
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
