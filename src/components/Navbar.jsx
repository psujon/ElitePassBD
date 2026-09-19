import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ShieldAlert, ChevronDown, Menu, X, Search, Loader2, Mail, Star, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';
const logo = '/logo.png';
import logoBanner from '../assets/logo_banner.png';

export default function Navbar({ onCartClick }) {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchProducts, setSearchProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const mobileSearchRef = useRef(null);
  const desktopSearchRef = useRef(null);

  const [marqueeEnabled, setMarqueeEnabled] = useState(true);
  const [marqueeSpeed, setMarqueeSpeed] = useState(35);
  const [marqueeItems, setMarqueeItems] = useState([
    {
      id: '1',
      badge: 'বিশেষ অফার',
      text: 'সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান',
      badgeColor: 'purple',
      textColor: 'violet'
    },
    {
      id: '2',
      badge: '🛡️ 100% Genuine',
      text: 'Genuine Digital License & Instant Email Delivery',
      badgeColor: 'emerald',
      textColor: 'emerald'
    },
    {
      id: '3',
      badge: '⭐ 50,000+',
      text: 'Trusted by Happy Customers in Bangladesh',
      badgeColor: 'amber',
      textColor: 'amber'
    }
  ]);

  const [supportLinks, setSupportLinks] = useState({
    support_whatsapp: '8801925112444',
    support_email: 'info@elitepassbd.com',
    social_facebook: 'https://facebook.com/ElitePassBD',
    social_instagram: 'https://instagram.com/elitepassbd'
  });

  useEffect(() => {
    let isMounted = true;
    const loadSiteSettings = async () => {
      try {
        const data = await api.get('/settings/public');
        if (data && isMounted) {
          if (data.marquee_enabled !== undefined) setMarqueeEnabled(data.marquee_enabled);
          if (data.marquee_speed) setMarqueeSpeed(data.marquee_speed);
          if (Array.isArray(data.marquee_items) && data.marquee_items.length > 0) {
            setMarqueeItems(data.marquee_items);
          }
          setSupportLinks({
            support_whatsapp: data.support_whatsapp || '8801925112444',
            support_email: data.support_email || 'info@elitepassbd.com',
            social_facebook: data.social_facebook || 'https://facebook.com/ElitePassBD',
            social_instagram: data.social_instagram || 'https://instagram.com/elitepassbd'
          });
        }
      } catch (e) {
        // Fallback to default
      }
    };

    loadSiteSettings();

    const handleMarqueeUpdate = (e) => {
      if (e?.detail) {
        if (e.detail.marquee_enabled !== undefined) setMarqueeEnabled(e.detail.marquee_enabled);
        if (e.detail.marquee_speed) setMarqueeSpeed(e.detail.marquee_speed);
        if (Array.isArray(e.detail.marquee_items)) setMarqueeItems(e.detail.marquee_items);
      } else {
        loadSiteSettings();
      }
    };

    const handleSupportUpdate = (e) => {
      if (e?.detail) {
        setSupportLinks(prev => ({ ...prev, ...e.detail }));
      } else {
        loadSiteSettings();
      }
    };

    window.addEventListener('marquee-updated', handleMarqueeUpdate);
    window.addEventListener('support-settings-updated', handleSupportUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('marquee-updated', handleMarqueeUpdate);
      window.removeEventListener('support-settings-updated', handleSupportUpdate);
    };
  }, []);

  const getBadgeStyle = (color) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-100/90 text-emerald-700 border-emerald-200/60';
      case 'amber':
        return 'bg-amber-100/90 text-amber-700 border-amber-200/60';
      case 'blue':
        return 'bg-blue-100/90 text-blue-700 border-blue-200/60';
      case 'rose':
      case 'red':
        return 'bg-rose-100/90 text-rose-700 border-rose-200/60';
      case 'purple':
      case 'violet':
      default:
        return 'bg-purple-100/90 text-purple-700 border-purple-200/60';
    }
  };

  const getTextColorStyle = (color) => {
    switch (color) {
      case 'emerald':
        return 'text-emerald-600';
      case 'amber':
        return 'text-amber-700';
      case 'blue':
        return 'text-blue-600';
      case 'rose':
      case 'red':
        return 'text-rose-600';
      case 'slate':
        return 'text-slate-700';
      case 'violet':
      case 'purple':
      default:
        return 'text-violet-700';
    }
  };

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  const handleDropdownItemClick = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get('/products/categories');
        setCategories(data || []);
      } catch (err) {
        console.error('Navbar category fetch failed:', err);
      }
    };
    fetchCategories();

    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchFocus = async () => {
    setShowSearchResults(true);
    if (searchProducts.length === 0) {
      setIsSearching(true);
      try {
        const data = await api.get('/products');
        setSearchProducts(data || []);
      } catch (err) {
        console.error('Navbar search products fetch failed:', err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(event.target);
      const clickedOutsideDesktop = desktopSearchRef.current && !desktopSearchRef.current.contains(event.target);
      if (clickedOutsideMobile && clickedOutsideDesktop) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredProducts = searchProducts.filter((prod) => {
    if (!searchQuery) return false;
    return (
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="w-full sticky top-0 z-50 text-left">
      <div className="hidden sm:block bg-slate-50/95 border-b border-slate-200/60 py-1.5 text-[11px] font-semibold text-slate-600 select-none">
        <div className="w-full max-w-[95%] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://wa.me/${(supportLinks.support_whatsapp || '8801925112444').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="bg-white border border-emerald-200/80 hover:bg-emerald-50 px-2.5 py-0.5 rounded-full text-emerald-600 font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-emerald-600 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            <a
              href={`mailto:${supportLinks.support_email || 'info@elitepassbd.com'}`}
              className="hidden sm:flex bg-white border border-slate-200/80 hover:bg-slate-100/80 px-2.5 py-0.5 rounded-full text-slate-700 font-bold items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Mail className="w-3 h-3 text-violet-600" />
              <span>{supportLinks.support_email || 'info@elitepassbd.com'}</span>
            </a>
          </div>

          {marqueeEnabled && marqueeItems.length > 0 ? (
            <div className="flex-1 overflow-hidden mx-2 sm:mx-4 relative flex items-center h-6">
              <div
                className="animate-topbar-marquee flex items-center gap-10 text-xs font-bold text-slate-700"
                style={{ animationDuration: `${marqueeSpeed}s` }}
              >
                {[...marqueeItems, ...marqueeItems].map((item, idx) => (
                  <div key={`${item.id || idx}-${idx}`} className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full border shadow-2xs ${getBadgeStyle(item.badgeColor)}`}>
                        {item.badge}
                      </span>
                    )}
                    <span className={`font-extrabold ${getTextColorStyle(item.textColor)}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-2.5 shrink-0">

            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-amber-800 font-extrabold text-[10px] shadow-2xs">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>4.9</span>
            </div>

            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-800 font-extrabold text-[10px] shadow-2xs">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Secured</span>
            </div>

            <div className="flex items-center gap-1 ml-1">
              <a
                href={supportLinks.social_facebook || "https://facebook.com/ElitePassBD"}
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Facebook"
              >
                <span className="font-black text-[9px]">f</span>
              </a>
              <a
                href={`https://wa.me/${(supportLinks.support_whatsapp || '8801925112444').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                title="WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href={supportLinks.social_instagram || "https://instagram.com/elitepassbd"}
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Instagram"
              >
                <span className="font-black text-[9px]">ig</span>
              </a>
            </div>

          </div>

        </div>
      </div>

      <nav className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm transition-all duration-300">
        <div className="w-full sm:max-w-[95%] mx-auto px-2.5 sm:px-6 py-2.5 flex items-center justify-between gap-2 md:gap-4 relative">

          <div className="flex items-center space-x-2.5 shrink-0">
            <Link to="/" className="w-10 h-10 sm:w-13 sm:h-13 flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 transition-transform">
              <img src={logo} alt="ElitePass BD Icon" className="w-full h-full object-contain" />
            </Link>

            <Link to="/" className="hidden sm:flex flex-col text-left">
              <div className="text-lg xs:text-xl sm:text-2xl font-black tracking-tight leading-none flex items-center gap-1">
                <span className="text-[#005F4B]">ELITE</span>
                <span className="text-[#FF6D00]">PASS</span>
                <span className="text-[#005F4B] border border-[#005F4B] px-1 py-0.5 rounded-md text-[10px] sm:text-xs font-black leading-none">
                  BD
                </span>
              </div>
            </Link>
          </div>

          {/* Centered Mobile Brand Name */}
          <Link to="/" className="sm:hidden absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            <div className="text-base font-black tracking-tight leading-none flex items-center gap-1">
              <span className="text-[#005F4B]">ELITE</span>
              <span className="text-[#FF6D00]">PASS</span>
              <span className="text-[#005F4B] border border-[#005F4B] px-0.5 py-0.2 rounded text-[9px] font-black leading-none">
                BD
              </span>
            </div>
          </Link>

          <div ref={desktopSearchRef} className="relative hidden xl:block w-72 lg:w-80">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onFocus={handleSearchFocus}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/80 border border-violet-100/80 focus:border-violet-400 focus:bg-white focus:outline-none rounded-full pl-9 pr-14 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            {showSearchResults && searchQuery && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 max-h-80 overflow-y-auto animate-fade-in text-left">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">
                    No products found
                  </div>
                ) : (
                  filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearchResults(false);
                        navigate(`/product/${prod.id}`);
                      }}
                      className="flex items-center gap-2.5 p-2 mx-1.5 my-0.5 rounded-xl hover:bg-slate-50 text-left transition-colors w-[calc(100%-12px)] cursor-pointer"
                    >
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[9px] text-slate-400 font-bold uppercase">
                          Img
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-teal-600 font-extrabold mt-0.5">
                          ৳{parseFloat(prod.price).toFixed(0)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-1.5">
            <Link
              to="/"
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isActive('/')
                ? 'bg-violet-100/80 text-violet-700 font-extrabold shadow-2xs border border-violet-200/50'
                : 'text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-50'
                }`}
            >
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${isActive('/products') || isDropdownOpen
                  ? 'bg-violet-100/80 text-violet-700 font-extrabold border border-violet-200/50'
                  : 'text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-50'
                  }`}
              >
                <span>All Products</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-left">
                  {categories.length === 0 ? (
                    <span className="block px-4 py-2 text-xs text-slate-400">No categories</span>
                  ) : (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                        onClick={handleDropdownItemClick}
                        className="block px-4 py-2 mx-1.5 my-0.5 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-all"
                      >
                        {cat.name}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link
              to="/about"
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isActive('/about')
                ? 'bg-violet-100/80 text-violet-700 font-extrabold border border-violet-200/50'
                : 'text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-50'
                }`}
            >
              About Us
            </Link>

            <Link
              to="/contact"
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isActive('/contact')
                ? 'bg-violet-100/80 text-violet-700 font-extrabold border border-violet-200/50'
                : 'text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-50'
                }`}
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">

            {user ? (
              <div className="hidden sm:flex items-center space-x-1.5">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 text-xs font-extrabold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition-colors shadow-2xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="bg-violet-50/90 hover:bg-violet-100/90 text-violet-700 border border-violet-200/70 font-extrabold px-3.5 py-1.5 rounded-full text-xs flex items-center space-x-1.5 transition-all shadow-2xs"
                  title="My Account"
                >
                  <User className="w-3.5 h-3.5 text-violet-600" />
                  <span>Account</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex bg-violet-50/90 hover:bg-violet-100/90 text-violet-700 border border-violet-200/70 font-extrabold px-3.5 py-1.5 rounded-full text-xs items-center space-x-1.5 transition-all shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-violet-600" />
                <span>Login</span>
              </Link>
            )}

            <button
              onClick={onCartClick}
              className="hidden sm:flex bg-gradient-to-r from-[#005F4B]/90 via-[#005F4B] to-[#FF6D00] hover:from-[#005F4B] hover:to-[#FF6D00] text-white font-extrabold px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs items-center space-x-1.5 shadow-md shadow-[#005F4B]/20 backdrop-blur-md border border-white/20 transition-all active:scale-95 cursor-pointer shrink-0"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-white text-blue-700 font-black text-[10px] px-1.5 py-0.2 rounded-full min-w-4 h-4 flex items-center justify-center ml-0.5">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Cart Icon */}
            <button
              onClick={onCartClick}
              className="sm:hidden relative p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 text-[#005F4B]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FF6D00] text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer ml-1"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile / Tablet Search Bar (shown below top navbar row) */}
        <div ref={mobileSearchRef} className="xl:hidden px-3 pb-2.5 pt-0.5 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onFocus={handleSearchFocus}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/90 border border-slate-200/90 focus:border-violet-500 focus:bg-white focus:outline-none rounded-full pl-9 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showSearchResults && searchQuery && (
            <div className="absolute left-3 right-3 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 max-h-80 overflow-y-auto animate-fade-in text-left">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 text-center">
                  No products found
                </div>
              ) : (
                filteredProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                      navigate(`/product/${prod.id}`);
                    }}
                    className="flex items-center gap-2.5 p-2 mx-1.5 my-0.5 rounded-xl hover:bg-slate-50 text-left transition-colors w-[calc(100%-12px)] cursor-pointer"
                  >
                    {prod.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[9px] text-slate-400 font-bold uppercase">
                        Img
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-teal-600 font-extrabold mt-0.5">
                        ৳{parseFloat(prod.price).toFixed(0)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 shadow-xl text-left animate-fade-in space-y-3">
            <div className="space-y-1 pt-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-2xl text-xs font-bold ${isActive('/') ? 'bg-violet-100/80 text-violet-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Home
              </Link>

              {/* Mobile All Products Dropdown List */}
              <div>
                <div
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-colors ${isActive('/products') || isMobileCategoriesOpen
                    ? 'bg-violet-100/80 text-violet-700 font-extrabold'
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <Link
                    to="/products"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1"
                  >
                    All Products
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    aria-label="Toggle categories dropdown"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isMobileCategoriesOpen && (
                  <div className="ml-3 mt-1 pl-3 border-l-2 border-violet-200 space-y-1 py-1 animate-fade-in">
                    <Link
                      to="/products"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsMobileCategoriesOpen(false);
                      }}
                      className="block px-3 py-2 rounded-xl text-xs font-extrabold text-violet-600 hover:bg-violet-50"
                    >
                      All Categories
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsMobileCategoriesOpen(false);
                        }}
                        className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-2xl text-xs font-bold ${isActive('/about') ? 'bg-violet-100/80 text-violet-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                About Us
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-2xl text-xs font-bold ${isActive('/contact') ? 'bg-violet-100/80 text-violet-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Contact
              </Link>

              {/* Mobile Account / Admin / Authentication Options */}
              <div className="border-t border-slate-100 pt-2.5 mt-2 space-y-1">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-red-600 bg-red-50/80 hover:bg-red-100"
                      >
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-violet-700 bg-violet-50/80 hover:bg-violet-100"
                    >
                      <User className="w-4 h-4 text-violet-600" />
                      <span>My Account</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-violet-700 bg-violet-50/80 hover:bg-violet-100"
                  >
                    <User className="w-4 h-4 text-violet-600" />
                    <span>Login / Register</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
