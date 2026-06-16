import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ShieldAlert, ChevronDown, Menu, X } from 'lucide-react';
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 sm:px-6 py-1">
      <div className="max-w-full mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
          <img src={logo} alt="Logo" className="w-15 h-15 rounded-full object-cover border border-violet-500/20 shadow-sm" />
          <span className="text-blue-500 font-extrabold text-2xl glow-primary">
            Elite <span className="text-white">Pass</span>BD
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
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
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1 py-1 focus:outline-none cursor-pointer"
            >
              <span>Products</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-lg py-2 z-50 animate-fade-in before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3">
                {categories.length === 0 ? (
                  <span className="block px-4 py-2 text-xs text-slate-500">No categories</span>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      onClick={handleDropdownItemClick}
                      className="block px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <Link to="/about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            About Us
          </Link>
          <Link to="/contact" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Contact
          </Link>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center space-x-4">
          {/* User Links (Desktop Only) */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 bg-red-950/40 text-red-400 border border-red-900 rounded-full hover:bg-red-900/40 transition-colors"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  title="My Account"
                >
                  <User className="w-4 h-4 text-violet-400" />
                  <span>My Account</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 transition-colors p-1 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
              >
                <User className="w-4 h-4" />
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
        <div className="md:hidden mt-4 pt-4 border-t border-slate-900 flex flex-col space-y-4 animate-fade-in">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
          >
            Home
          </Link>

          {/* Products Section in Mobile Menu */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Products
            </span>
            <div className="flex flex-col space-y-2 pl-3 border-l border-slate-900">
              {categories.length === 0 ? (
                <span className="text-xs text-slate-500">No categories</span>
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
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
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
          >
            About Us
          </Link>

          <Link
            to="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
          >
            Contact
          </Link>

          {/* User Links in Mobile Menu */}
          <div className="border-t border-slate-900 pt-4 flex flex-col space-y-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors py-1"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
                >
                  <User className="w-4 h-4 text-violet-400" />
                  <span>My Account</span>
                </Link>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors py-1 text-left w-full cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-sm font-medium text-slate-300 hover:text-white transition-colors py-1"
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
