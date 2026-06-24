import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Loader2, Package, Calendar, Phone, MapPin, Truck, ChevronRight, CheckCircle2, Clock, Star, X, MessageSquare, Send, Inbox, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      toast.error('Failed to fetch tracking details.');
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
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col md:flex-row bg-[#f5f7fa] text-slate-800">
      
      {/* Left Side: Navigation Sidebar */}
      <div className="w-full md:w-64 bg-[#111e35] text-slate-300 p-6 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-850">
        {/* Logo and brand name */}
        <div className="flex items-center space-x-2.5 px-2 mb-6 text-left">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-violet-500/20 shrink-0">
            E
          </div>
          <span className="text-sm font-extrabold tracking-wider text-white uppercase truncate">ElitePass BD</span>
        </div>
        
        <div className="mb-6 px-2 hidden md:block text-left">
          <span className="text-[10px] font-bold text-orange-400 bg-orange-950/45 border border-orange-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit">
            Account Panel
          </span>
        </div>

        {/* Navigation Sidebar List */}
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 pb-2 md:pb-0 scrollbar-none snap-x md:space-y-1">
          <div className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3.5 mb-2 mt-4 text-left">
            General
          </div>
          
          <button
            onClick={() => {
              setActiveTab('orders');
              if (!trackingOrder && orders.length > 0) {
                handleTrackOrder(orders[0].id);
              }
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white/10 text-white shadow-xs'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Package className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>My Purchases</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tickets');
              if (!selectedTicket && tickets.length > 0) {
                setSelectedTicket(tickets[0]);
              }
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-white/10 text-white shadow-xs'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'tickets' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>Support Tickets</span>
            {tickets.filter(t => t.status === 'Pending').length > 0 && (
              <span className="ml-auto bg-[#ff5e3a] text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                {tickets.filter(t => t.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Right Side Content Panel */}
      <div className="flex-1 bg-[#f5f7fa] p-6 sm:p-8 overflow-y-auto space-y-6 min-w-0">
        
        {/* Header Row */}
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-5 shrink-0">
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-slate-850 tracking-tight">
              {activeTab === 'orders' ? 'My Purchases' : 'Support Tickets'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Hello, {user?.name}. {activeTab === 'orders' ? 'Check your purchase history and live tracking details.' : 'Submit and manage your support tickets.'}
            </p>
          </div>
          
          {/* User Profile Info on Right */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl shadow-xs">
              <div className="w-7 h-7 rounded-full bg-violet-650 flex items-center justify-center text-white font-extrabold text-xs uppercase shadow-sm">
                {user?.name ? user.name.substring(0, 2) : 'US'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-700 leading-tight">{user?.name}</span>
                <span className="block text-[10px] text-slate-500 font-semibold leading-tight">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row of 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Spend */}
          <div className="bg-white border border-slate-150/70 p-5 rounded-2xl shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Total Net Spend</span>
                <span className="text-lg font-extrabold text-slate-850 mt-1 block">
                  ৳{orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount), 0).toFixed(2)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-650 flex items-center justify-center font-bold text-base shadow-xs select-none">
                ৳
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('orders')} 
              className="text-[10px] text-violet-650 hover:text-violet-850 font-bold flex items-center cursor-pointer text-left border-none bg-transparent p-0"
            >
              View purchases &rarr;
            </button>
          </div>

          {/* Card 2: Orders Count */}
          <div className="bg-white border border-slate-150/70 p-5 rounded-2xl shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Total Orders</span>
                <span className="text-lg font-extrabold text-slate-850 mt-1 block">{orders.length} orders</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-purple-500/10 text-purple-650 flex items-center justify-center font-bold text-sm shadow-xs select-none">
                📋
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('orders')} 
              className="text-[10px] text-violet-650 hover:text-violet-850 font-bold flex items-center cursor-pointer text-left border-none bg-transparent p-0"
            >
              Track orders &rarr;
            </button>
          </div>

          {/* Card 3: Support Tickets */}
          <div className="bg-white border border-slate-150/70 p-5 rounded-2xl shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Support Tickets</span>
                <span className="text-lg font-extrabold text-slate-850 mt-1 block">{tickets.length} tickets</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-650 flex items-center justify-center font-bold text-sm shadow-xs select-none">
                ✉️
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('tickets')} 
              className="text-[10px] text-violet-650 hover:text-violet-850 font-bold flex items-center cursor-pointer text-left border-none bg-transparent p-0"
            >
              View tickets &rarr;
            </button>
          </div>
        </div>

        {/* Tab Content Areas */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-left">
            
            {/* Left Column: Purchase History */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Order History</h3>

              {loading ? (
                <div className="p-12 flex justify-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-xs text-red-650 bg-red-50 border border-red-200 p-4 rounded-xl">
                  {error}
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-450 text-xs shadow-xs">
                  No orders placed yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleTrackOrder(order.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${
                        trackingOrder?.id === order.id
                          ? 'bg-violet-50/50 border-violet-500/60 shadow-xs'
                          : 'bg-white border-slate-200/85 hover:border-slate-350 hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                          <span>Order #{order.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                            'bg-violet-50 text-violet-600 border border-violet-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xxs text-slate-500 mt-2 space-x-3">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                          <span className="font-extrabold text-slate-700">৳{parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                        {order.status === 'Cancelled' && order.cancel_reason && (
                          <p className="text-red-550 text-[10px] mt-2 truncate max-w-[200px] text-left">
                            Reason: {order.cancel_reason}
                          </p>
                        )}
                      </div>
                      
                      <ChevronRight className={`w-4 h-4 transition-colors shrink-0 ${
                        trackingOrder?.id === order.id ? 'text-violet-600' : 'text-slate-450'
                      }`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Live Track Status */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-4">Live Track Status</h3>

              {trackingLoading ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl h-80 flex items-center justify-center shadow-xs">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
              ) : !trackingOrder ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl h-80 flex flex-col justify-center items-center text-slate-450 text-xs shadow-xs">
                  <Package className="w-8 h-8 mb-2 text-slate-350" />
                  <p>Select an order from the history list to track it.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
                  {/* Top details card */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 pb-4 gap-2">
                    <div className="text-left">
                      <h4 className="text-base font-extrabold text-slate-800">Tracking Order #{trackingOrder.id}</h4>
                      <p className="text-xxs text-slate-500 mt-1">Placed on {new Date(trackingOrder.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xxs text-slate-450 font-bold block uppercase tracking-wider">Total Bill</span>
                      <p className="text-base font-extrabold text-slate-850">৳{parseFloat(trackingOrder.total_amount).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Step-by-step progress visualizer */}
                  {trackingOrder.status === 'Cancelled' ? (
                    <div className="p-5 bg-red-50 border border-red-150 rounded-xl text-center space-y-2.5">
                      <p className="text-sm font-extrabold text-red-650">This order has been Cancelled.</p>
                      {trackingOrder.cancel_reason && (
                        <div className="text-xs text-red-700 bg-red-100/50 border border-red-200 px-3.5 py-2.5 rounded-xl inline-block max-w-md mx-auto text-left leading-relaxed">
                          <strong>Cancellation Reason:</strong> {trackingOrder.cancel_reason}
                        </div>
                      )}
                      <p className="text-xxs text-slate-500 block">Please reach out to support if you have any questions.</p>
                    </div>
                  ) : (
                    <div className="py-6 px-2">
                      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-2">
                        {/* Horizontal Line connector (desktop only) */}
                        <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-slate-200 -z-10 hidden sm:block">
                          <div 
                            className="h-full bg-violet-600 transition-all duration-700" 
                            style={{ width: `${(Math.max(0, currentStep - 1) / 3) * 100}%` }}
                          />
                        </div>

                        {/* Step 1: Pending */}
                        <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center w-full sm:w-1/4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            currentStep >= 1 ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {currentStep > 1 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '1'}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-450'}`}>Order Placed</p>
                            <p className="text-[10px] text-slate-500">Pending Approval</p>
                          </div>
                        </div>

                        {/* Step 2: Processing */}
                        <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center w-full sm:w-1/4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            currentStep >= 2 ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {currentStep > 2 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '2'}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-450'}`}>Processing</p>
                            <p className="text-[10px] text-slate-500">Preparing Delivery</p>
                          </div>
                        </div>

                        {/* Step 3: Shipped */}
                        <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center w-full sm:w-1/4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            currentStep >= 3 ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {currentStep > 3 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '3'}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-450'}`}>Shipped</p>
                            <p className="text-[10px] text-slate-500">In Transit / E-delivered</p>
                          </div>
                        </div>

                        {/* Step 4: Delivered */}
                        <div className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center w-full sm:w-1/4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            currentStep >= 4 ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {currentStep >= 4 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '4'}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${currentStep >= 4 ? 'text-violet-600 font-extrabold' : 'text-slate-450'}`}>Delivered</p>
                            <p className="text-[10px] text-slate-500">Successfully Received</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items Summary list */}
                  <div className="border-t border-slate-150 pt-5">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Ordered Items</h5>
                    <div className="space-y-2">
                      {trackingOrder.items?.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-150 gap-3">
                          <div className="min-w-0 flex-1 text-left">
                            <p className="font-bold text-slate-800 truncate">{item.product_name}</p>
                            
                            {/* Selected Options display */}
                            {(item.package_name || item.selected_device || item.selected_activation) && (
                              <div className="text-[10px] text-slate-500 mt-1 space-y-1 flex flex-col leading-relaxed">
                                <div className="space-x-1.5 flex flex-wrap gap-y-1">
                                  {item.package_name && (
                                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200/80">Package: {item.package_name}</span>
                                  )}
                                  {item.selected_device && (
                                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200/80">Device: {item.selected_device}</span>
                                  )}
                                  {item.selected_activation && (
                                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200/80">Activation: {item.selected_activation}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            <p className="text-xxs text-slate-500 mt-1.5">Qty: {item.quantity} × ৳{parseFloat(item.price).toFixed(2)}</p>

                            {item.license_keys && item.license_keys.length > 0 && (
                              <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 space-y-1">
                                <span className="block text-[9px] font-black uppercase tracking-wider text-emerald-600">License Key(s) / Code(s):</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.license_keys.map((key, keyIdx) => (
                                    <code key={keyIdx} className="block text-xxs font-mono bg-white px-2 py-1 border border-emerald-100 rounded select-all font-bold w-fit">{key}</code>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <span className="font-extrabold text-slate-800">৳{(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                            {trackingOrder.status === 'Delivered' && (
                              <button
                                onClick={() => handleOpenReviewModal(item.product_id, item.product_name)}
                                className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-550 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center space-x-1 shadow-xs active:scale-95 duration-150 cursor-pointer"
                              >
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>Review</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping address & phone */}
                  <div className="border-t border-slate-150 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2 text-left">
                      <span className="text-xxs font-bold text-slate-450 uppercase block tracking-wider">Delivery Details</span>
                      <div className="flex items-start space-x-2 text-slate-750">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{trackingOrder.shipping_address}</span>
                      </div>
                      {trackingOrder.additional_notes && (
                        <div className="flex items-start space-x-2 text-slate-750 mt-1.5 bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                          <span className="text-xs shrink-0">📝</span>
                          <span className="leading-relaxed"><strong>Notes:</strong> {trackingOrder.additional_notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-left">
                      <span className="text-xxs font-bold text-slate-450 uppercase block tracking-wider">Contact Info</span>
                      <div className="flex items-center space-x-2 text-slate-750">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-left">
            {/* Left Column: Support Tickets History */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Ticket History</h3>
                <button
                  onClick={() => {
                    setShowNewTicketForm(true);
                    setSelectedTicket(null);
                    setNewTicketError('');
                    setNewTicketSuccess('');
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xxs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Ticket</span>
                </button>
              </div>

              {ticketsLoading ? (
                <div className="p-12 flex justify-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-450 text-xs shadow-xs">
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
                      className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${
                        selectedTicket?.id === ticket.id && !showNewTicketForm
                          ? 'bg-violet-50/50 border-violet-500/60 shadow-xs'
                          : 'bg-white border-slate-200/85 hover:border-slate-350 hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                          <span>Ticket #T{ticket.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            ticket.status === 'Closed' ? 'bg-slate-100 text-slate-655 border border-slate-200' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        
                        <p className="font-bold text-slate-800 text-xs mt-1.5 truncate">{ticket.subject}</p>
                        
                        <div className="flex items-center text-[10px] text-slate-500 mt-2 space-x-3">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <ChevronRight className={`w-4 h-4 transition-colors shrink-0 ${
                        selectedTicket?.id === ticket.id && !showNewTicketForm ? 'text-violet-600' : 'text-slate-450'
                      }`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Support Ticket Detail / Creator */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-4">
                {showNewTicketForm ? 'Submit Query' : 'Ticket Visualizer'}
              </h3>

              {showNewTicketForm ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="border-b border-slate-150 pb-4 text-left">
                    <h4 className="text-base font-extrabold text-slate-800">Create New Support Ticket</h4>
                    <p className="text-xxs text-slate-500 mt-1">Describe your issue in detail. A support agent will respond shortly.</p>
                  </div>
                  
                  {newTicketError && (
                    <div className="text-xxs text-red-655 bg-red-50 border border-red-200 p-2.5 rounded-lg text-left">
                      {newTicketError}
                    </div>
                  )}
                  
                  {newTicketSuccess && (
                    <div className="text-xxs text-emerald-600 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg font-bold animate-pulse-subtle text-left">
                      {newTicketSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                    <div className="text-left">
                      <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                      <input
                        type="text"
                        value={newTicketForm.subject}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                        placeholder="e.g. Need code activation assistance"
                        className="w-full bg-slate-55 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-455 transition-all"
                        required
                      />
                    </div>

                    <div className="text-left">
                      <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-2">Message Description</label>
                      <textarea
                        value={newTicketForm.message}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                        placeholder="Describe your issue or question in detail..."
                        rows={6}
                        className="w-full bg-slate-55 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl p-4 text-xs text-slate-800 placeholder-slate-455 transition-all resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewTicketForm(false)}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-550 hover:text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={newTicketSubmitting || !!newTicketSuccess}
                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
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
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs text-left">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 pb-4 gap-2">
                    <div className="text-left">
                      <h4 className="text-base font-extrabold text-slate-800">Ticket #T{selectedTicket.id}</h4>
                      <p className="text-xxs text-slate-500 mt-1">Submitted on {new Date(selectedTicket.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedTicket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-650 border border-emerald-100' :
                        selectedTicket.status === 'Closed' ? 'bg-slate-100 text-slate-655 border border-slate-200' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>

                  {/* Subject & Message */}
                  <div className="space-y-1 text-left">
                    <span className="text-xxs font-bold text-slate-450 uppercase block tracking-wider">Subject</span>
                    <h5 className="text-sm font-extrabold text-slate-800 leading-relaxed">{selectedTicket.subject}</h5>
                  </div>

                  <div className="space-y-2.5 text-left">
                    <span className="text-xxs font-bold text-slate-450 uppercase block tracking-wider">Description</span>
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-650 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Admin Remarks */}
                  <div className="border-t border-slate-150 pt-5 space-y-2.5 text-left">
                    <span className="text-xxs font-bold text-slate-450 uppercase block tracking-wider">Resolution Status & Remarks</span>
                    {selectedTicket.remarks ? (
                      <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl text-xs text-slate-700">
                        <p className="font-bold text-violet-755 mb-1 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                          <span>Support Remarks:</span>
                        </p>
                        <p className="italic leading-relaxed">{selectedTicket.remarks}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-450 italic">No admin remarks entered yet. The support team is currently reviewing your query.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl h-80 flex flex-col justify-center items-center text-slate-450 text-xs shadow-xs">
                  <MessageSquare className="w-8 h-8 mb-2 text-slate-350" />
                  <p>Select a support ticket to view details or click 'New Ticket' to submit a query.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REVIEW SUBMISSION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in" onClick={handleCloseReviewModal} />

          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 animate-slide-up text-left">
            <button
              onClick={handleCloseReviewModal}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-655 rounded-full border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-slate-850 mb-1">Write a Review</h3>
            <p className="text-xxs text-violet-600 font-extrabold mb-4 truncate">{reviewProductName}</p>

            {reviewError && (
              <div className="text-xxs text-red-655 bg-red-50 border border-red-200 p-2.5 rounded-lg mb-4">
                {reviewError}
              </div>
            )}

            {reviewSuccess && (
              <div className="text-xxs text-emerald-600 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg mb-4">
                {reviewSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xxs font-bold text-slate-455 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 hover:text-slate-450'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text Area */}
              <div>
                <label className="block text-xxs font-bold text-slate-455 uppercase tracking-wider mb-2">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl p-3 text-xs text-slate-800 placeholder-slate-450 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseReviewModal}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-550 hover:text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting || !!reviewSuccess}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
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
