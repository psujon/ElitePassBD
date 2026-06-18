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
  FileText
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
  const [address, setAddress] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [phone, setPhone] = useState(user?.whatsapp_number || '');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [guestName, setGuestName] = useState('');
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

  // Pre-fill if user info loads late
  useEffect(() => {
    if (user) {
      if (user.whatsapp_number && !phone) {
        setPhone(user.whatsapp_number);
      }
    }
  }, [user, phone]);

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

    if (['bkash', 'nagad', 'rocket'].includes(paymentMethod) && (!bkashNumber || !bkashTxId)) {
      const methodName = paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket';
      setError(`Please provide your ${methodName} number and transaction ID.`);
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
        shipping_address: address,
        phone: phone,
        payment_method: ['bkash', 'nagad', 'rocket'].includes(paymentMethod)
          ? `${paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} (No: ${bkashNumber}, TxID: ${bkashTxId})`
          : paymentMethod,
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
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] py-20 flex flex-col justify-center items-center text-left animate-fade-in">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-md">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mb-6 shadow-xs">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#411f52] tracking-tight">
              Order Confirmed!
            </h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
              Thank you for your purchase. Your order has been placed successfully.
            </p>

            <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-150 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="text-violet-600 font-extrabold">#{orderSuccess.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="text-pink-600 font-bold">
                  {['bkash', 'nagad', 'rocket'].includes(paymentMethod)
                    ? `${paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} (No: ${bkashNumber}, TxID: ${bkashTxId})`
                    : paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping To:</span>
                <span className="text-slate-800 font-bold truncate max-w-[200px]">{address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">WhatsApp/Phone:</span>
                <span className="text-slate-800 font-bold">{phone}</span>
              </div>
              {additionalNotes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Additional Notes:</span>
                  <span className="text-slate-800 font-bold truncate max-w-[200px]">{additionalNotes}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Link
                to="/dashboard"
                className="block w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm text-center"
              >
                Track Order in Dashboard
              </Link>
              <Link
                to="/"
                className="block w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-sm transition-colors border border-slate-200 text-center"
              >
                Continue Shopping
              </Link>
            </div>
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
                  <CreditCard className="w-5 h-5 text-pink-600" />
                  <span>Payment Method</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'bkash'
                    ? 'border-pink-500 bg-pink-50/50'
                    : 'border-slate-200 bg-slate-50/30 hover:border-slate-355'
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
                      <span className="block text-sm font-bold text-slate-800 flex items-center">
                        <span>bKash</span>
                        <span className="ml-2 text-[8px] px-1 py-0.5 bg-pink-100 text-pink-600 rounded-md border border-pink-200 font-extrabold uppercase tracking-wide">Popular</span>
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">Manual verification</span>
                    </div>
                  </label>
                  <label className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'nagad'
                    ? 'border-pink-500 bg-pink-50/50'
                    : 'border-slate-200 bg-slate-50/30 hover:border-slate-355'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="nagad"
                      checked={paymentMethod === 'nagad'}
                      onChange={() => setPaymentMethod('nagad')}
                      className="mt-1 accent-pink-600"
                    />
                    <div className="text-left">
                      <span className="block text-sm font-bold text-slate-800 flex items-center">
                        <span>Nagad</span>
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">Manual verification</span>
                    </div>
                  </label>
                  <label className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'rocket'
                    ? 'border-pink-500 bg-pink-50/50'
                    : 'border-slate-200 bg-slate-50/30 hover:border-slate-355'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="rocket"
                      checked={paymentMethod === 'rocket'}
                      onChange={() => setPaymentMethod('rocket')}
                      className="mt-1 accent-pink-600"
                    />
                    <div className="text-left">
                      <span className="block text-sm font-bold text-slate-800 flex items-center">
                        <span>Rocket</span>
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">Manual verification</span>
                    </div>
                  </label>
                </div>

                {['bkash', 'nagad', 'rocket'].includes(paymentMethod) && (
                  <div className="p-4 bg-pink-50 border border-pink-150 rounded-xl space-y-4 animate-fade-in">
                    <div className="p-3 bg-pink-100/50 border border-pink-200 rounded-lg text-xs text-pink-700">
                      <p className="font-extrabold text-left">
                        Simulated {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} Payment Instructions:
                      </p>
                      <p className="mt-1 text-slate-600 text-left leading-relaxed">
                        1. Send the total amount <strong>৳{cartTotal.toFixed(2)}</strong> to {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} Personal: <strong>017********</strong>.
                        <br />
                        2. Input your {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} sender number and the Transaction ID below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="text-left">
                        <label className="block text-left text-xxs font-bold text-pink-600  tracking-wider mb-1.5">
                          {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} Number
                        </label>
                        <input
                          type="text"
                          value={bkashNumber}
                          onChange={(e) => setBkashNumber(e.target.value)}
                          placeholder="e.g. 017XXXXXXXX"
                          className="w-full text-sm bg-white border border-slate-200 focus:border-pink-500 focus:outline-none rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 transition-colors"
                          required={['bkash', 'nagad', 'rocket'].includes(paymentMethod)}
                        />
                      </div>

                      <div className="text-left">
                        <label className="block text-left text-xxs font-bold text-pink-600  tracking-wider mb-1.5">
                          Transaction ID
                        </label>
                        <input
                          type="text"
                          value={bkashTxId}
                          onChange={(e) => setBkashTxId(e.target.value)}
                          placeholder="e.g. TRX8462846"
                          className="w-full text-sm bg-white border border-slate-200 focus:border-pink-500 focus:outline-none rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 transition-colors"
                          required={['bkash', 'nagad', 'rocket'].includes(paymentMethod)}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                  <strong className="text-slate-700">Secure Activation Guarantee</strong>: All purchases are fully tracked. Keys are delivered via dashboard and WhatsApp number within minutes of verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
