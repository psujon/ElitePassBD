import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, CreditCard, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav({ onCartClick }) {
  const location = useLocation();
  const { cartCount } = useCart();
  const { user } = useAuth();
  
  const currentPath = location.pathname;

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      to: '/',
      isButton: false
    },
    {
      label: 'Products',
      icon: Package,
      to: '/products',
      isButton: false
    },
    {
      label: 'Cart',
      icon: ShoppingCart,
      onClick: onCartClick,
      isButton: true,
      badge: cartCount
    },
    {
      label: 'Checkout',
      icon: CreditCard,
      to: '/checkout',
      isButton: false
    },
    {
      label: user ? 'Account' : 'Login',
      icon: User,
      to: user ? '/dashboard' : '/login',
      isButton: false
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          
          // Determine if active
          const isActive = item.isButton 
            ? false 
            : (item.to === '/' ? currentPath === '/' : currentPath.startsWith(item.to));

          const activeClasses = isActive 
            ? 'text-blue-600' 
            : 'text-slate-500 hover:text-slate-800';

          const content = (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-105' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full min-w-4 h-4 flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-extrabold tracking-wide mt-0.5">
                {item.label}
              </span>
            </div>
          );

          if (item.isButton) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center w-full h-full ${activeClasses} bg-transparent border-none cursor-pointer focus:outline-none`}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={index}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full ${activeClasses} no-underline`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
