import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ShieldAlert, ShoppingBag } from 'lucide-react';

export default function Navbar({ onCartClick }) {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
          <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-transparent bg-clip-text font-extrabold text-2xl glow-primary">
            ElitePassBD
          </span>
        </Link>

        {/* Action Items */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
            Shop
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
              >
                <User className="w-4 h-4 text-violet-400" />
                <span className="hidden md:inline">{user.name}</span>
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
              <span>Login</span>
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
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xxs font-bold px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center animate-pulse-subtle">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
