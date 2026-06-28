import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  DollarSign,
  Mail,
  FileText,
  Lock
} from 'lucide-react';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isGuestCheckout = location.state?.isGuest;

  // Protect page: if not logged in and not doing guest checkout, redirect to login
  useEffect(() => {
    if (!user && !isGuestCheckout) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, isGuestCheckout, navigate, location]);

  // State fields
  const [address, setAddress] = useState(user?.address || '');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [phone, setPhone] = useState(user?.whatsapp_number || '');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online_payment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // If cart is empty and order wasn't just placed successfully, redirect to home
  useEffect(() => {
    if (cartItems.length === 0 && !orderSuccess) {
      navigate('/');
    }
  }, [cartItems, orderSuccess, navigate]);

  // Pre-fill if user info loads late
  useEffect(() => {
    if (user) {
      if (user.whatsapp_number && !phone) {
        setPhone(user.whatsapp_number);
      }
      if (user.address && !address) {
        setAddress(user.address);
      }
    }
  }, [user, phone, address]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone || !deliveryEmail) {
      setError('Please provide phone number, and email for delivery keys.');
      return;
    }

    if (!user && !guestName) {
      setError('Please provide your full name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const orderPayload = {
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          package_name: item.package_name || null,
          selected_device: item.selected_device || null,
          selected_activation: item.selected_activation || null
        })),
        total_amount: cartTotal,
        shipping_address: address || "",
        phone: phone,
        payment_method: 'Online Payment',
        additional_notes: additionalNotes,
        delivery_email: deliveryEmail
      };

      let res;
      if (user) {
        res = await api.post('/orders', orderPayload);
      } else {
        res = await api.post('/orders/guest', {
          ...orderPayload,
          guest_name: guestName,
          guest_email: deliveryEmail
        });
      }

      setOrderSuccess({
        orderId: res.orderId,
        message: 'Redirecting to payment gateway...'
      });

      // Initiate EPS payment gateway redirect
      const payRes = await api.post('/payments/initiate', { orderId: res.orderId });

      if (payRes && payRes.redirectUrl) {
        clearCart();
        window.location.href = payRes.redirectUrl;
      } else {
        throw new Error('Failed to initiate payment gateway.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to place order. Please check stock and try again.');
      setOrderSuccess(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] py-20 flex flex-col justify-center items-center text-left animate-fade-in">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-md">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-violet-50 text-violet-600 mb-6 shadow-xs">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#411f52] tracking-tight animate-pulse">
              Connecting Gateway...
            </h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
              Please wait while we redirect you to the secure EPS payment portal to complete your order. Do not close or refresh this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-6 transition-colors group border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Store</span>
        </button>

        <div className="text-left mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-3">
            <ShoppingBag className="w-8 h-8 text-violet-600" />
            <span>Checkout</span>
          </h1>
          <p className="text-slate-550 text-sm mt-2">
            Verify your details and complete your digital purchase safely.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Checkout Details Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-150 pb-3 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-violet-500" />
                <span>Shipping & Contact Information</span>
              </h3>

              {error && (
                <div className="text-xs font-bold text-red-655 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-450 tracking-wider mb-1.5">
                    Your Full Name
                  </label>
                  {user ? (
                    <input
                      type="text"
                      value={user.name}
                      disabled
                      className="w-full text-sm bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed opacity-80"
                    />
                  ) : (
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl px-4 py-2.5 text-slate-800"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-455  tracking-wider mb-1.5">
                    Email Address
                  </label>
                  {user ? (
                    <input
                      type="text"
                      value={user.email}
                      disabled
                      className="w-full text-sm bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed opacity-80"
                    />
                  ) : (
                    <input
                      type="email"
                      value={deliveryEmail}
                      onChange={(e) => setDeliveryEmail(e.target.value)}
                      placeholder=""
                      className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl px-4 py-2.5 text-slate-800"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 tracking-wider mb-1.5">
                  Contact Number (WhatsApp preferred)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=""
                    className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 transition-colors"
                    required
                  />
                  <Phone className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                </div>
                <p className="text-slate-455 text-xs mt-1.5">
                  We will contact or WhatsApp you on this number for keys, delivery details or verification.
                </p>
              </div>

              {user && (
                <div>
                  <label className="block text-xxs font-bold text-slate-500  tracking-wider mb-1.5">
                    Email (For Delivery Keys)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={deliveryEmail}
                      onChange={(e) => setDeliveryEmail(e.target.value)}
                      placeholder=""
                      className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 transition-colors"
                      required
                    />
                    <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <p className="text-slate-455 text-xs mt-1.5">
                    Your digital codes / subscription activation keys will be sent to this email address.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xxs font-bold text-slate-500 tracking-wider mb-1.5">
                  Shipping / Delivery Address
                </label>
                <div className="relative">
                  <textarea
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder=""
                    className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 transition-colors resize-none"
                  />
                  <MapPin className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500  tracking-wider mb-1.5">
                  Additional Notes
                </label>
                <div className="relative">
                  <textarea
                    rows="2"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Enter any additional notes or instructions..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 transition-colors resize-none"
                  />
                  <FileText className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-base font-bold text-slate-805 border-b border-slate-150 pb-3 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                  <span>Payment Method</span>
                </h3>

                <div className="p-5 bg-violet-50/50 border border-violet-150 rounded-2xl space-y-3">
                  <div className="flex items-start space-x-3 text-left">
                    <div className="bg-white text-violet-600 p-2 rounded-xl mt-0.5 shrink-0 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">EPS Online Payment (Instant & Secure)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        You will be redirected to the secure EPS gateway to pay. Supports:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md font-extrabold">bKash</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md font-extrabold">Nagad</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md font-extrabold">Rocket</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md font-extrabold">Visa/Mastercard</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md font-extrabold">Internet Banking</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-violet-100/70 flex items-center justify-between text-slate-500 text-[10px] tracking-wide">
                    <span className="flex items-center space-x-1 font-bold">
                      <span>🛡️ SECURE 256-BIT SSL CONNECTION</span>
                    </span>
                    <span className="font-extrabold text-violet-600 uppercase">Instant Activation</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs sticky top-6 space-y-6 text-left">
              <h3 className="text-base font-extrabold text-slate-850 border-b border-slate-150 pb-3">
                Order Summary
              </h3>

              {/* Scrollable list of items */}
              <div className="divide-y divide-slate-150 max-h-[40vh] overflow-y-auto pr-1 space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={item.cart_key}
                    className={`flex items-start space-x-4 ${index > 0 ? 'pt-4 border-t border-slate-100' : ''}`}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-lg bg-slate-50 border border-slate-200/60 shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center text-xxxxs text-slate-400 border border-slate-200 shrink-0 mt-0.5">
                        No Image
                      </div>
                    )}

                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{item.name}</h4>

                      {/* Selected Options display */}
                      {(item.package_name || item.selected_device || item.selected_activation) && (
                        <div className="text-[10px] text-slate-500 mt-1 space-y-0.5 leading-relaxed">
                          {item.package_name && (
                            <div>Package: <span className="text-violet-600 font-bold">{item.package_name}</span></div>
                          )}
                          {item.selected_device && (
                            <div>Device: <span className="text-violet-600 font-bold">{item.selected_device}</span></div>
                          )}
                          {item.selected_activation && (
                            <div>Activation: <span className="text-violet-600 font-bold">{item.selected_activation}</span></div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-slate-500 mt-1">
                        Quantity: <span className="text-slate-800 font-bold">{item.quantity}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-violet-600">
                        ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                      <span className="block text-[9px] text-slate-450 mt-0.5">
                        ৳{parseFloat(item.price).toFixed(2)} each
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations and payment info */}
              <div className="pt-4 border-t border-slate-150 space-y-2.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800 font-bold">৳{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Handling</span>
                  <span className="text-slate-800 font-bold">৳0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Fee</span>
                  <span className="text-slate-800 font-bold">৳0.00</span>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-800">Grand Total</span>
                  <span className="text-xl font-extrabold text-slate-855">
                    ৳{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Safety badge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-start space-x-2 text-[10px] text-slate-500 text-left">
                <span className="text-sm mt-0.5">🛡️</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-700">Secure Payment Guarantee</strong>: All payments are secured by EPS. After successful payment, keys are delivered via mail within minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Footer Banner */}
        <div className="mt-8">
          <img
            src="/Checkout-Page-Pay_with_EPS.png"
            alt="Pay securely with EPS"
            className="w-full h-auto shadow-xs"
          />
        </div>
      </div>
    </div>
  );
}
