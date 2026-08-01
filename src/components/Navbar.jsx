import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ShieldAlert, ChevronDown, Menu, X, Search, Loader2, Phone, Mail, Star, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';
import logo from '../assets/logo.jpeg';
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

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BDT');

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
    <header className="w-full relative z-40 text-left">
      <div className="bg-slate-50/95 border-b border-slate-200/60 py-1.5 text-[11px] font-semibold text-slate-600 select-none">
        <div className="w-full max-w-[95%] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:01925112444"
              className="bg-white border border-slate-200/80 hover:bg-slate-100/80 px-2.5 py-0.5 rounded-full text-slate-700 font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Phone className="w-3 h-3 text-violet-600" />
              <span>01925112444</span>
            </a>

            <a
              href="mailto:info@elitepassbd.com"
              className="hidden sm:flex bg-white border border-slate-200/80 hover:bg-slate-100/80 px-2.5 py-0.5 rounded-full text-slate-700 font-bold items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Mail className="w-3 h-3 text-violet-600" />
              <span>info@elitepassbd.com</span>
            </a>
          </div>

          <div className="flex-1 overflow-hidden mx-2 sm:mx-4 relative flex items-center h-6">
            <div className="animate-topbar-marquee flex items-center gap-10 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="bg-purple-100/90 text-purple-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">বিশেষ অফার</span>
                <span className="text-violet-700 font-extrabold">সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <span>🛡️ 100% Genuine Digital License & Instant Email Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <span>⭐ Trusted by 5,000+ Happy Customers in Bangladesh</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-purple-100/90 text-purple-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">বিশেষ অফার</span>
                <span className="text-violet-700 font-extrabold">সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — সর্বোচ্চ ৭০% পর্যন্ত ছাড় পান</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <span>🛡️ 100% Genuine Digital License & Instant Email Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <span>⭐ Trusted by 50,000+ Happy Customers in Bangladesh</span>
              </div>
            </div>
          </div>

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
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Facebook"
              >
                <span className="font-black text-[9px]">f</span>
              </a>
              <a
                href="https://wa.me/8801925112444"
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                title="WhatsApp"
              >
                <Phone className="w-2.5 h-2.5" />
              </a>
              <a
                href="https://instagram.com"
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
        <div className="w-full max-w-[95%] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 md:gap-4">

          <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200/90 shadow-2xs p-1 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <img src={logo} alt="ElitePass BD Icon" className="w-full h-full object-contain" />
            </div>

            <div className="flex flex-col text-left">
              <div className="text-base xs:text-lg sm:text-xl font-black tracking-tight leading-none flex items-center gap-1">
                <span className="text-[#005F4B]">ELITE</span>
                <span className="text-[#FF6D00]">PASS</span>
                <span className="text-[#005F4B] border border-[#005F4B] px-1 py-0.5 rounded-md text-[10px] sm:text-xs font-black leading-none">
                  BD
                </span>
              </div>
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
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded shadow-2xs select-none">
                Ctrl K
              </kbd>
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
              <div className="flex items-center space-x-1.5">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center space-x-1 text-xs font-extrabold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition-colors shadow-2xs"
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
                  <span className="hidden sm:inline">Account</span>
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
                className="bg-violet-50/90 hover:bg-violet-100/90 text-violet-700 border border-violet-200/70 font-extrabold px-3.5 py-1.5 rounded-full text-xs flex items-center space-x-1.5 transition-all shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-violet-600" />
                <span>Login</span>
              </Link>
            )}

            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="bg-white border border-slate-200/80 px-2.5 py-1 rounded-full flex items-center space-x-1.5 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 font-black text-[10px] flex items-center justify-center shadow-2xs">
                  ৳
                </div>
                <span className="text-[11px] text-slate-700 font-bold">BD {selectedCurrency}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            <button
              onClick={onCartClick}
              className="bg-gradient-to-r from-[#005F4B]/90 via-[#005F4B] to-[#FF6D00] hover:from-[#005F4B] hover:to-[#FF6D00] text-white font-extrabold px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs flex items-center space-x-1.5 shadow-md shadow-[#005F4B]/20 backdrop-blur-md border border-white/20 transition-all active:scale-95 cursor-pointer shrink-0"
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

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer ml-1"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 shadow-xl text-left animate-fade-in space-y-3">
            <div ref={mobileSearchRef} className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onFocus={handleSearchFocus}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-1 pt-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-2xl text-xs font-bold ${isActive('/') ? 'bg-violet-100/80 text-violet-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-2xl text-xs font-bold ${isActive('/products') ? 'bg-violet-100/80 text-violet-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                All Products
              </Link>
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
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
