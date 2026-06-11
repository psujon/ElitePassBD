import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  ShoppingBag,
  MapPin,
  Phone,
  CreditCard,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Smartphone,
  DollarSign
} from 'lucide-react';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State fields
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.whatsapp_number || '');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [bkashNumber, setBkashNumber] = useState('');
  const [bkashTxId, setBkashTxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // If cart is empty and order wasn't just placed successfully, redirect to home
  useEffect(() => {
    if (cartItems.length === 0 && !orderSuccess) {
      navigate('/');
    }
  }, [cartItems, orderSuccess, navigate]);

  // Pre-fill phone if user info loads late
  useEffect(() => {
    if (user?.whatsapp_number && !phone) {
      setPhone(user.whatsapp_number);
    }
  }, [user, phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address || !phone) {
      setError('Please provide a shipping address and contact number.');
      return;
    }

    if (paymentMethod === 'bkash' && (!bkashNumber || !bkashTxId)) {
      setError('Please provide your bKash number and transaction ID.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const orderPayload = {
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: cartTotal,
        shipping_address: address,
        phone: phone,
        payment_method: paymentMethod === 'bkash' 
          ? `bKash (No: ${bkashNumber}, TxID: ${bkashTxId})` 
          : paymentMethod
      };

      const res = await api.post('/orders', orderPayload);

      setOrderSuccess({
        orderId: res.orderId,
        message: res.message || 'Order placed successfully!'
      });

      clearCart();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to place order. Please check stock and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-md w-full mx-auto px-4 py-20 flex flex-col justify-center min-h-[75vh]">
        <div className="glass-card rounded-3xl p-8 text-center shadow-2xl border border-violet-500/20 animate-fade-in">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight glow-primary">
            Order Confirmed!
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Thank you for your purchase. Your order has been placed successfully.
          </p>

          <div className="my-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Order ID:</span>
              <span className="text-violet-400 font-bold">#{orderSuccess.orderId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Payment Method:</span>
              <span className="text-pink-400 font-semibold">
                {paymentMethod === 'bkash' ? `bKash (No: ${bkashNumber}, TxID: ${bkashTxId})` : paymentMethod}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Shipping To:</span>
              <span className="text-white truncate max-w-[200px]">{address}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">WhatsApp/Phone:</span>
              <span className="text-white">{phone}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="block w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/15"
            >
              Track Order in Dashboard
            </Link>
            <Link
              to="/"
              className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-sm transition-colors border border-slate-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-12">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-semibold mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Store</span>
      </button>

      <div className="text-left mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight glow-primary flex items-center space-x-3">
          <ShoppingBag className="w-8 h-8 text-violet-500" />
          <span>Checkout</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Verify your details and complete your digital purchase safely.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Details Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800/80 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-violet-400" />
              <span>Shipping & Contact Information</span>
            </h3>

            {error && (
              <div className="text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full text-sm bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed opacity-80"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full text-sm bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Contact Number (WhatsApp preferred)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +88017XXXXXXXX"
                  className="w-full text-sm bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 transition-colors"
                  required
                />
                <Phone className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
              </div>
              <p className="text-slate-500 text-xxs mt-1.5">
                We will contact you on this number for keys, delivery details or verification.
              </p>
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Shipping / Delivery Address
              </label>
              <div className="relative">
                <textarea
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter house no, street name, area/city details..."
                  className="w-full text-sm bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 transition-colors"
                  required
                />
                <MapPin className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-pink-400" />
                <span>Payment Method</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash on Delivery */}
                <label className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'Cash on Delivery'
                  ? 'border-violet-500 bg-violet-600/5'
                  : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                  }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Cash on Delivery"
                    disabled={true}
                    checked={paymentMethod === 'Cash on Delivery'}
                    onChange={() => setPaymentMethod('Cash on Delivery')}
                    className="mt-1 accent-violet-600"
                  />
                  <div className="text-left">
                    <span className="block text-sm font-semibold text-white">Cash on Delivery</span>
                    <span className="block text-xxs text-slate-500 mt-0.5">Pay upon key activation or receipt</span>
                  </div>
                </label>

                {/* Bkash / Online Pay (Simulated) */}
                <label className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'bkash'
                  ? 'border-pink-500 bg-pink-600/5'
                  : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                  }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bkash"
                    checked={paymentMethod === 'bkash'}
                    onChange={() => setPaymentMethod('bkash')}
                    className="mt-1 accent-pink-600"
                  />
                  <div className="text-left">
                    <span className="block text-sm font-semibold text-white flex items-center">
                      <span>bKash / Nagad</span>
                      <span className="ml-2 text-xxxxs px-1 py-0.5 bg-pink-500/10 text-pink-400 rounded-md border border-pink-500/20">Popular</span>
                    </span>
                    <span className="block text-xxs text-slate-500 mt-0.5">Mock online sandbox verification</span>
                  </div>
                </label>
              </div>

              {/* bKash additional fields */}
              {paymentMethod === 'bkash' && (
                <div className="p-4 bg-pink-950/10 border border-pink-500/10 rounded-xl space-y-4 animate-fade-in">
                  <div className="p-3 bg-pink-950/20 border border-pink-500/20 rounded-lg text-xs text-pink-300">
                    <p className="font-semibold text-left">Simulated bKash Payment Instructions:</p>
                    <p className="mt-1 text-slate-400 text-left leading-relaxed">
                      1. Send the total amount <strong>৳{cartTotal.toFixed(2)}</strong> to bKash Personal: <strong>01799998888</strong>.
                      <br />
                      2. Input your bKash sender number and the 10-digit Transaction ID below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-left text-xxs font-bold text-pink-400 uppercase tracking-wider mb-1.5">
                        bKash Number
                      </label>
                      <input
                        type="text"
                        value={bkashNumber}
                        onChange={(e) => setBkashNumber(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full text-sm bg-slate-900 border border-slate-800 focus:border-pink-500 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-slate-600 transition-colors"
                        required={paymentMethod === 'bkash'}
                      />
                    </div>

                    <div>
                      <label className="block text-left text-xxs font-bold text-pink-400 uppercase tracking-wider mb-1.5">
                        bKash Transaction ID (TxID)
                      </label>
                      <input
                        type="text"
                        value={bkashTxId}
                        onChange={(e) => setBkashTxId(e.target.value)}
                        placeholder="e.g. TRX8462846"
                        className="w-full text-sm bg-slate-900 border border-slate-800 focus:border-pink-500 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-slate-600 transition-colors"
                        required={paymentMethod === 'bkash'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Checkout...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Place Order (৳{cartTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-5">
          <div className="glass-card rounded-2xl p-6 shadow-xl border border-slate-800/80 sticky top-6 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Order Summary
            </h3>

            {/* Scrollable list of items */}
            <div className="divide-y divide-slate-800 max-h-[40vh] overflow-y-auto pr-1 space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={item.product_id}
                  className={`flex items-center space-x-4 ${index > 0 ? 'pt-4' : ''}`}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg bg-slate-800 border border-slate-800"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-xxxxs text-slate-500 border border-slate-800">
                      No Image
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Quantity: <span className="text-white font-bold">{item.quantity}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-violet-400">
                      ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                    <span className="block text-xxxxs text-slate-500 mt-0.5">
                      ৳{parseFloat(item.price).toFixed(2)} each
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations and payment info */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-semibold">৳{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Handing</span>
                <span className="text-white font-semibold">৳0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Fee</span>
                <span className="text-white font-semibold">৳0.00</span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                <span className="text-sm font-bold text-white">Grand Total</span>
                <span className="text-xl font-extrabold text-white glow-primary">
                  ৳{cartTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Safety badge */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-850 flex items-start space-x-2 text-xxs text-slate-500 text-left">
              <span className="text-sm mt-0.5">🛡️</span>
              <p>
                <strong>Secure Activation Guarantee</strong>: All purchases are fully tracked. Keys are delivered via dashboard and WhatsApp number within minutes of verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
