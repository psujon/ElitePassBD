import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ShieldAlert, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';

export default function Navbar({ onCartClick }) {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
          <span className="text-violet-500 font-extrabold text-2xl glow-primary">
            ElitePassBD
          </span>
        </Link>

        {/* Action Items */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Home
          </Link>

          {/* Products Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1 py-1 focus:outline-none cursor-pointer"
            >
              <span>Products</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-lg py-2 z-50 animate-fade-in">
                {categories.length === 0 ? (
                  <span className="block px-4 py-2 text-xs text-slate-500">No categories</span>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setIsDropdownOpen(false)}
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


          {/* User Links */}
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
                <span className="hidden md:inline">My Account</span>
              </Link>

              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
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

          {/* Cart Icon Button */}
          <button
            onClick={onCartClick}
            className="relative p-2 bg-slate-900 border border-slate-800 rounded-full text-slate-200 hover:text-white hover:border-violet-500 transition-all active:scale-95"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-xxs font-bold px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center animate-pulse-subtle">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
