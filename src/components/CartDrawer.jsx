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
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-10 animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Shopping Cart</span>
            <span className="text-xs font-normal text-slate-400">({cartItems.length} items)</span>
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-500 space-y-2">
              <span className="text-4xl">🛒</span>
              <p className="text-sm">Your cart is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.product_id} 
                className="flex items-center space-x-3 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl"
              >
                {/* Product Image */}
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-14 h-14 object-cover rounded-lg bg-slate-850" 
                  />
                ) : (
                  <div className="w-14 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
                    No Image
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                  <p className="text-xs text-violet-400 mt-0.5">৳{parseFloat(item.price).toFixed(2)}</p>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 mt-2">
                    <button 
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="p-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold text-white px-2">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="p-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Delete Button */}
                <button 
                  onClick={() => removeFromCart(item.product_id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Checkout Button & Total */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Price:</span>
              <span className="text-lg font-bold text-white">৳{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center space-x-2 active:scale-98"
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
