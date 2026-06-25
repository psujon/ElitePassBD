import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ShieldAlert, ChevronDown, Menu, X, Search, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import logo from '../assets/logo.jpeg';

export default function Navbar({ onCartClick }) {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);

  // Mobile search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchProducts, setSearchProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef(null);

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
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
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

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 sm:px-6 py-1">
      <div className="max-w-full mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-1.5 xs:space-x-2 text-xl font-bold tracking-tight text-white">
          <img src={logo} alt="Logo" className="w-10 h-10 xs:w-12 xs:h-12 md:w-15 md:h-15 rounded-full object-cover border border-violet-500/20 shadow-sm" />
          <span className="text-blue-500 font-extrabold text-sm xs:text-base sm:text-xl md:text-2xl glow-primary">
            Elite <span className="text-white">Pass</span>BD
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-3">
          <Link to="/" className="px-3.5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-violet-500/50 rounded-xl transition-all duration-200">
            Home
          </Link>

          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-violet-500/50 rounded-xl transition-all duration-200 flex items-center space-x-1 focus:outline-none cursor-pointer"
            >
              <span>Products</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-lg py-2 z-50 animate-fade-in before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                {categories.length === 0 ? (
                  <span className="block px-4 py-2 text-xs text-slate-500">No categories</span>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      onClick={handleDropdownItemClick}
                      className="block px-4 py-2 mx-1.5 my-0.5 text-xs font-semibold text-slate-300 hover:bg-violet-500/10 hover:text-violet-400 rounded-lg transition-all duration-200"
                    >
                      {cat.name}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <Link to="/about" className="px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-violet-500/50 rounded-xl transition-all duration-200">
            About Us
          </Link>
          <Link to="/contact" className="px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-violet-500/50 rounded-xl transition-all duration-200">
            Contact
          </Link>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Search Box */}
          <div ref={searchContainerRef} className="relative block md:hidden w-28 xs:w-36 sm:w-44">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onFocus={handleSearchFocus}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 transition-all focus:ring-1 focus:ring-violet-500/50"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Mobile Search Results Dropdown */}
            {showSearchResults && searchQuery && (
              <div className="absolute right-0 mt-2 w-60 xs:w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 max-h-80 overflow-y-auto animate-fade-in">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500 text-center">
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
                      className="flex items-center gap-2.5 p-2 mx-1.5 my-0.5 rounded-lg hover:bg-violet-500/10 text-left transition-colors w-[calc(100%-12px)] cursor-pointer"
                    >
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-8 h-8 rounded-md object-cover bg-slate-800 border border-slate-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-[9px] text-slate-500 uppercase">
                          No Img
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate hover:text-violet-400 transition-colors">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-violet-400 font-bold mt-0.5">
                          {parseFloat(prod.price).toFixed(2)}৳
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Links (Desktop Only) */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 bg-red-950/40 text-red-400 border border-red-900 rounded-full hover:bg-red-900/40 hover:text-red-300 transition-colors"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all duration-200 flex items-center space-x-1.5"
                  title="My Account"
                >
                  <User className="w-4 h-4 text-violet-400" />
                  <span>My Account</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 text-slate-450 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all duration-200 flex items-center space-x-1.5"
              >
                <User className="w-4 h-4 text-violet-400" />
                <span>My Account</span>
              </Link>
            )}
          </div>

          {/* Cart Icon Button - Always Visible */}
          <button
            onClick={onCartClick}
            className="relative p-2 bg-slate-900 border border-slate-800 rounded-full text-slate-200 hover:text-white hover:border-violet-500 transition-all active:scale-95 cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-xxs font-bold px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center animate-pulse-subtle">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button - 3 lines menu icon */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-slate-900 flex flex-col space-y-2.5 animate-fade-in">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 text-sm font-semibold text-slate-300 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all duration-200 block"
          >
            Home
          </Link>

          {/* Products Section in Mobile Menu */}
          <div className="flex flex-col space-y-1.5 px-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
              Products
            </span>
            <div className="flex flex-col space-y-1.5 pl-3 border-l border-slate-900">
              {categories.length === 0 ? (
                <span className="text-xs text-slate-500">No categories</span>
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-1.5 text-sm font-semibold text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all duration-200 block"
                  >
                    {cat.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          <Link
            to="/about"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 text-sm font-semibold text-slate-300 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all duration-200 block"
          >
            About Us
          </Link>

          <Link
            to="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 text-sm font-semibold text-slate-300 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all duration-200 block"
          >
            Contact
          </Link>

          {/* User Links in Mobile Menu */}
          <div className="border-t border-slate-900 pt-3 flex flex-col space-y-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all duration-200"
                >
                  <User className="w-4 h-4 text-violet-400" />
                  <span>My Account</span>
                </Link>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 text-left w-full cursor-pointer border-none bg-transparent"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all duration-200"
              >
                <User className="w-4 h-4 text-violet-400" />
                <span>My Account</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
