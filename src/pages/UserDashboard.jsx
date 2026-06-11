import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Loader2, Package, Calendar, Phone, MapPin, Truck, ChevronRight, CheckCircle2, Clock, Star, X, MessageSquare, Send, Inbox, Plus } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'tickets'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected order for full tracking detail
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProductId, setReviewProductId] = useState(null);
  const [reviewProductName, setReviewProductName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Support Tickets State
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    message: ''
  });
  const [newTicketSubmitting, setNewTicketSubmitting] = useState(false);
  const [newTicketError, setNewTicketError] = useState('');
  const [newTicketSuccess, setNewTicketSuccess] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchTickets(true);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.get('/orders/my-orders');
      setOrders(data);
      if (data.length > 0) {
        // Auto-select the first/latest order for tracking display
        handleTrackOrder(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load purchase history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (autoSelectFirst = false) => {
    try {
      setTicketsLoading(true);
      const data = await api.get('/tickets/my-tickets');
      setTickets(data);
      if (autoSelectFirst && data.length > 0) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim() || !newTicketForm.message.trim()) {
      setNewTicketError('Subject and message are required.');
      return;
    }

    try {
      setNewTicketSubmitting(true);
      setNewTicketError('');
      setNewTicketSuccess('');

      await api.post('/tickets', {
        name: user.name,
        email: user.email,
        subject: newTicketForm.subject.trim(),
        message: newTicketForm.message.trim()
      });

      setNewTicketSuccess('Support ticket submitted successfully!');
      setNewTicketForm({ subject: '', message: '' });
      
      // Refresh tickets list
      const data = await api.get('/tickets/my-tickets');
      setTickets(data);
      if (data.length > 0) {
        setSelectedTicket(data[0]);
      }
      
      // Return to tickets list details after a delay
      setTimeout(() => {
        setNewTicketSuccess('');
        setShowNewTicketForm(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      setNewTicketError(err.message || 'Failed to submit support ticket.');
    } finally {
      setNewTicketSubmitting(false);
    }
  };

  const handleTrackOrder = async (orderId) => {
    try {
      setTrackingLoading(true);
      const data = await api.get(`/orders/track/${orderId}`);
      setTrackingOrder(data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch tracking details.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleOpenReviewModal = async (productId, productName) => {
    setReviewProductId(productId);
    setReviewProductName(productName);
    setReviewRating(5);
    setReviewText('');
    setReviewError('');
    setReviewSuccess('');
    setShowReviewModal(true);

    try {
      // Check if user has already reviewed this product to pre-populate form
      const data = await api.get(`/products/${productId}/my-review`);
      if (data) {
        setReviewRating(data.rating);
        setReviewText(data.text);
      }
    } catch (err) {
      console.error('Failed to fetch existing review:', err);
    }
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewProductId(null);
    setReviewProductName('');
    setReviewRating(5);
    setReviewText('');
    setReviewError('');
    setReviewSuccess('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setReviewError('Please write some review text.');
      return;
    }
    
    try {
      setReviewSubmitting(true);
      setReviewError('');
      setReviewSuccess('');
      
      await api.post(`/products/${reviewProductId}/reviews`, {
        rating: reviewRating,
        text: reviewText
      });
      
      setReviewSuccess('Thank you! Your review has been submitted.');
      setTimeout(() => {
        handleCloseReviewModal();
      }, 1500);
    } catch (err) {
      console.error(err);
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Helper to determine status step number
  const getStatusStep = (status) => {
    switch (status) {
      case 'Pending': return 1;
      case 'Processing': return 2;
      case 'Shipped': return 3;
      case 'Delivered': return 4;
      case 'Cancelled': return -1;
      default: return 1;
    }
  };

  const currentStep = trackingOrder ? getStatusStep(trackingOrder.status) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Profile Info */}
      <div className="mb-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xxs font-bold text-violet-400 uppercase tracking-wider">Account Panel</span>
          <h2 className="text-xl font-bold text-white mt-1">Hello, {user?.name}</h2>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        
        <div className="px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-center shrink-0">
          <span className="text-xxs font-bold text-slate-500 block uppercase">Total Purchases</span>
          <span className="text-lg font-bold text-white">{orders.length} orders</span>
        </div>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-800 gap-6 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'orders' ? 'text-violet-400 border-violet-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          My Purchases
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'tickets' ? 'text-violet-400 border-violet-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Support Tickets
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Left Column: Purchase History */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Order History</h3>

            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-xs text-red-400 bg-red-950/20 border border-red-900 p-4 rounded-xl">
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                No orders placed yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleTrackOrder(order.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                      trackingOrder?.id === order.id
                        ? 'bg-violet-950/20 border-violet-500/60 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                        <span>Order #{order.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xxs ${
                          order.status === 'Delivered' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
                          order.status === 'Cancelled' ? 'bg-red-950/40 text-red-400 border border-red-900' :
                          'bg-violet-950/40 text-violet-450 border border-violet-900'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xxs text-slate-500 mt-2 space-x-3">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-semibold text-slate-400">৳{parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                      {order.status === 'Cancelled' && order.cancel_reason && (
                        <p className="text-red-400/80 text-xxs mt-2 truncate max-w-[200px] text-left">
                          Reason: {order.cancel_reason}
                        </p>
                      )}
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Tracking Visualizer */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Live Track Status</h3>

            {trackingLoading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl h-80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : !trackingOrder ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl h-80 flex flex-col justify-center items-center text-slate-500 text-xs">
                <Package className="w-8 h-8 mb-2 text-slate-600" />
                <p>Select an order from the history list to track it.</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                {/* Top details card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-4 gap-2">
                  <div>
                    <h4 className="text-base font-bold text-white">Tracking Order #{trackingOrder.id}</h4>
                    <p className="text-xxs text-slate-500 mt-1">Placed on {new Date(trackingOrder.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xxs text-slate-400">Total Bill</span>
                    <p className="text-base font-extrabold text-white">৳{parseFloat(trackingOrder.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                {/* Step-by-step progress visualizer */}
                {trackingOrder.status === 'Cancelled' ? (
                  <div className="p-4 bg-red-950/20 border border-red-900/60 rounded-xl text-center space-y-2.5">
                    <p className="text-sm font-bold text-red-400">This order has been Cancelled.</p>
                    {trackingOrder.cancel_reason && (
                      <div className="text-xs text-red-300 bg-red-950/30 border border-red-900/30 px-3.5 py-2 rounded-xl inline-block max-w-md mx-auto text-left">
                        <strong>Cancellation Reason:</strong> {trackingOrder.cancel_reason}
                      </div>
                    )}
                    <p className="text-xxs text-slate-500 block">Please reach out to support if you have any questions.</p>
                  </div>
                ) : (
                  <div className="py-6 px-2">
                    <div className="relative flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-2">
                      {/* Horizontal Line connector (desktop only) */}
                      <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-slate-800 -z-10 hidden sm:block">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700" 
                          style={{ width: `${(Math.max(0, currentStep - 1) / 3) * 100}%` }}
                        />
                      </div>

                      {/* Step 1: Pending */}
                      <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-center w-full sm:w-1/4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                          currentStep >= 1 ? 'bg-violet-600 glow-primary' : 'bg-slate-800'
                        }`}>
                          {currentStep > 1 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '1'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Order Placed</p>
                          <p className="text-xxs text-slate-500">Pending Approval</p>
                        </div>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-center w-full sm:w-1/4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                          currentStep >= 2 ? 'bg-violet-600 glow-primary' : 'bg-slate-800'
                        }`}>
                          {currentStep > 2 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '2'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Processing</p>
                          <p className="text-xxs text-slate-500">Preparing Delivery</p>
                        </div>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-center w-full sm:w-1/4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                          currentStep >= 3 ? 'bg-violet-600 glow-primary' : 'bg-slate-800'
                        }`}>
                          {currentStep > 3 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '3'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Shipped</p>
                          <p className="text-xxs text-slate-500">In Transit / E-delivered</p>
                        </div>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-center w-full sm:w-1/4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                          currentStep >= 4 ? 'bg-gradient-to-r from-violet-600 to-pink-600 glow-primary' : 'bg-slate-800'
                        }`}>
                          {currentStep >= 4 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '4'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white font-gradient">Delivered</p>
                          <p className="text-xxs text-slate-500">Successfully Received</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Summary list */}
                <div className="border-t border-slate-850 pt-5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Ordered Items</h5>
                  <div className="space-y-2">
                    {trackingOrder.items?.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center text-xs p-3 bg-slate-950/30 rounded-xl border border-slate-850/40 gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{item.product_name}</p>
                          <p className="text-xxs text-slate-500 mt-0.5">Qty: {item.quantity} × ৳{parseFloat(item.price).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <span className="font-bold text-white">৳{(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                          {trackingOrder.status === 'Delivered' && (
                            <button
                              onClick={() => handleOpenReviewModal(item.product_id, item.product_name)}
                              className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center space-x-1 shadow-sm active:scale-95 duration-150 cursor-pointer"
                            >
                              <Star className="w-3 h-3 fill-amber-450 text-amber-450" />
                              <span>Review</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping address & phone */}
                <div className="border-t border-slate-855 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <span className="text-xxs font-bold text-slate-500 uppercase block tracking-wider">Delivery Details</span>
                    <div className="flex items-start space-x-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{trackingOrder.shipping_address}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xxs font-bold text-slate-500 uppercase block tracking-wider">Contact Info</span>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{trackingOrder.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Left Column: Support Tickets History */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Ticket History</h3>
              <button
                onClick={() => {
                  setShowNewTicketForm(true);
                  setSelectedTicket(null);
                  setNewTicketError('');
                  setNewTicketSuccess('');
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xxs font-bold rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Ticket</span>
              </button>
            </div>

            {ticketsLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                No tickets submitted yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowNewTicketForm(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                      selectedTicket?.id === ticket.id && !showNewTicketForm
                        ? 'bg-violet-950/20 border-violet-500/60 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                        <span>Ticket #T{ticket.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ticket.status === 'Resolved' ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-900' :
                          ticket.status === 'Closed' ? 'bg-slate-950/45 text-slate-450 border border-slate-800' :
                          'bg-amber-950/45 text-amber-500 border border-amber-900'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      
                      <p className="font-bold text-white text-xs mt-1.5 truncate">{ticket.subject}</p>
                      
                      <div className="flex items-center text-[10px] text-slate-500 mt-2 space-x-3">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Support Ticket Detail / Creator */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              {showNewTicketForm ? 'Submit Query' : 'Ticket Visualizer'}
            </h3>

            {showNewTicketForm ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-left">
                <div className="border-b border-slate-850 pb-4">
                  <h4 className="text-base font-bold text-white">Create New Support Ticket</h4>
                  <p className="text-xxs text-slate-500 mt-1">Describe your issue in detail. A support agent will respond shortly.</p>
                </div>
                
                {newTicketError && (
                  <div className="text-xxs text-red-400 bg-red-950/20 border border-red-900/60 p-2.5 rounded-lg">
                    {newTicketError}
                  </div>
                )}
                
                {newTicketSuccess && (
                  <div className="text-xxs text-emerald-400 bg-emerald-950/20 border border-emerald-900/60 p-2.5 rounded-lg font-bold animate-pulse-subtle">
                    {newTicketSuccess}
                  </div>
                )}

                <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                    <input
                      type="text"
                      value={newTicketForm.subject}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                      placeholder="e.g. Need code activation assistance"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Message Description</label>
                    <textarea
                      value={newTicketForm.message}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                      placeholder="Describe your issue or question in detail..."
                      rows={6}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl p-4 text-xs text-white placeholder-slate-700 transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewTicketForm(false)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-855 border border-slate-855 text-slate-400 hover:text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={newTicketSubmitting || !!newTicketSuccess}
                      className="px-5 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 glow-button flex items-center space-x-1 cursor-pointer"
                    >
                      {newTicketSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedTicket ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-left">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-4 gap-2">
                  <div>
                    <h4 className="text-base font-bold text-white">Ticket #T{selectedTicket.id}</h4>
                    <p className="text-xxs text-slate-500 mt-1">Submitted on {new Date(selectedTicket.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedTicket.status === 'Resolved' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
                      selectedTicket.status === 'Closed' ? 'bg-slate-950/40 text-slate-450 border border-slate-800' :
                      'bg-amber-950/40 text-amber-500 border border-amber-900'
                    }`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* Subject & Message */}
                <div className="space-y-1">
                  <span className="text-xxs font-bold text-slate-500 uppercase block tracking-wider">Subject</span>
                  <h5 className="text-sm font-bold text-white leading-relaxed">{selectedTicket.subject}</h5>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xxs font-bold text-slate-500 uppercase block tracking-wider">Description</span>
                  <div className="p-4 bg-slate-950/40 border border-slate-850/60 rounded-xl text-xs text-slate-350 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Admin Remarks */}
                <div className="border-t border-slate-850 pt-5 space-y-2.5">
                  <span className="text-xxs font-bold text-slate-500 uppercase block tracking-wider">Resolution Status & Remarks</span>
                  {selectedTicket.remarks ? (
                    <div className="p-4 bg-violet-955/10 border border-violet-900/30 rounded-xl text-xs text-slate-300">
                      <p className="font-semibold text-white mb-1 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                        <span>Support Remarks:</span>
                      </p>
                      <p className="italic leading-relaxed">{selectedTicket.remarks}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No admin remarks entered yet. The support team is currently reviewing your query.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl h-80 flex flex-col justify-center items-center text-slate-500 text-xs">
                <MessageSquare className="w-8 h-8 mb-2 text-slate-600 animate-pulse-subtle" />
                <p>Select a support ticket to view details or click 'New Ticket' to submit a query.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* REVIEW SUBMISSION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in" onClick={handleCloseReviewModal} />

          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 animate-slide-up text-left">
            <button
              onClick={handleCloseReviewModal}
              className="absolute top-4 right-4 p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-850 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Write a Review</h3>
            <p className="text-xxs text-violet-400 font-semibold mb-4 truncate">{reviewProductName}</p>

            {reviewError && (
              <div className="text-xxs text-red-400 bg-red-950/20 border border-red-900/60 p-2.5 rounded-lg mb-4">
                {reviewError}
              </div>
            )}

            {reviewSuccess && (
              <div className="text-xxs text-emerald-400 bg-emerald-950/20 border border-emerald-900/60 p-2.5 rounded-lg mb-4">
                {reviewSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text Area */}
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl p-3 text-xs text-white placeholder-slate-600 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseReviewModal}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white text-xs font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting || !!reviewSuccess}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 glow-button flex items-center space-x-1"
                >
                  {reviewSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
