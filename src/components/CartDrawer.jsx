import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { X, Trash2, Plus, Minus, CreditCard, Loader2 } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose }) {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    onClose();
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-[#f5f7fa] border-l border-slate-200 flex flex-col shadow-2xl z-10 animate-slide-up text-left">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/85 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <span>Shopping Cart</span>
            <span className="text-xs font-normal text-slate-500">({cartItems.length} items)</span>
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-400 space-y-2">
              <span className="text-4xl">🛒</span>
              <p className="text-sm font-semibold">Your cart is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.cart_key} 
                className="flex items-start space-x-3 p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs animate-fade-in"
              >
                {/* Product Image */}
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-14 h-14 object-cover rounded-lg bg-slate-50 border border-slate-200/50 shrink-0 mt-0.5" 
                  />
                ) : (
                  <div className="w-14 h-14 bg-slate-50 border border-slate-200/50 rounded-lg flex items-center justify-center text-xs text-slate-400 shrink-0 mt-0.5 font-bold">
                    No Image
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{item.name}</h4>
                  
                  {/* Selected Options */}
                  {(item.package_name || item.selected_device || item.selected_activation) && (
                    <div className="text-[10px] text-slate-500 mt-1 space-y-0.5 leading-relaxed bg-violet-50/40 border border-violet-100/30 p-1.5 rounded-lg max-w-xs">
                      {item.package_name && (
                        <div>Package: <span className="text-violet-650 font-bold">{item.package_name}</span></div>
                      )}
                      {item.selected_device && (
                        <div>Device: <span className="text-violet-650 font-bold">{item.selected_device}</span></div>
                      )}
                      {item.selected_activation && (
                        <div>Activation: <span className="text-violet-650 font-bold">{item.selected_activation}</span></div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-violet-605 font-bold mt-1.5">৳{parseFloat(item.price).toFixed(2)}</p>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 mt-2">
                    <button 
                      onClick={() => updateQuantity(item.cart_key, item.quantity - 1)}
                      className="p-0.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer animate-scale"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-extrabold text-slate-800 px-2">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cart_key, item.quantity + 1)}
                      className="p-0.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer animate-scale"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Delete Button */}
                <button 
                  onClick={() => removeFromCart(item.cart_key)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Checkout Button & Total */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Total Price:</span>
              <span className="text-lg font-extrabold text-slate-850">৳{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-650 hover:from-violet-550 hover:to-pink-550 text-white font-bold rounded-lg text-sm transition-all flex items-center justify-center space-x-2 active:scale-98 shadow-sm cursor-pointer border-none"
            >
              <CreditCard className="w-4 h-4" />
              <span>Proceed to Checkout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
