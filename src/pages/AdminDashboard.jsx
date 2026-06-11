import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Loader2, Plus, Edit2, Trash2, Check, X, ClipboardList, Package, Banknote } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', or 'tickets'
  
  // Data lists
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    closed: 0
  });
  const [loading, setLoading] = useState(true);

  // Modal State for Product Create/Edit
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means adding new
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: ''
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal State for Order Cancellation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Modal State for Ticket Action
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    status: 'Pending',
    remarks: ''
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [prodData, orderData, ticketData, statsData] = await Promise.all([
        api.get('/products'),
        api.get('/orders'),
        api.get('/tickets'),
        api.get('/tickets/stats')
      ]);
      setProducts(prodData);
      setOrders(orderData);
      setTickets(ticketData);
      setTicketStats(statsData);
    } catch (err) {
      console.error('Failed to load admin stats', err);
      alert('Error loading dashboard data. Are you logged in as an Admin?');
    } finally {
      setLoading(false);
    }
  };

  // Compute stats metrics
  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const processingOrdersCount = orders.filter(o => o.status === 'Processing').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'Shipped').length;
  const completedOrdersCount = orders.filter(o => o.status === 'Delivered').length;
  const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;

  // PRODUCT CRUD HANDLERS
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        stock: product.stock
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        image_url: '',
        stock: '10' // default
      });
    }
    setFormError('');
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const { name, description, price, image_url, stock } = productForm;

    if (!name || !description || price === undefined || stock === undefined) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingProduct) {
        // Edit existing product
        await api.put(`/products/${editingProduct.id}`, productForm);
        alert('Product updated successfully!');
      } else {
        // Create new product
        await api.post('/products', productForm);
        alert('Product created successfully!');
      }
      setShowProductModal(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      alert(res.message || 'Product deleted successfully!');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete product.');
    }
  };

  // ORDER STATUS CHANGE HANDLER
  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === 'Cancelled') {
      setCancellingOrderId(orderId);
      setCancelRemarks('');
      setShowCancelModal(true);
      return;
    }

    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      alert(`Order status updated to ${newStatus}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelRemarks.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    try {
      setCancelSubmitting(true);
      await api.put(`/orders/${cancellingOrderId}/status`, { 
        status: 'Cancelled', 
        cancel_reason: cancelRemarks 
      });
      alert('Order status updated to Cancelled');
      setShowCancelModal(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // TICKET ACTION HANDLERS
  const handleOpenTicketModal = (ticket) => {
    setActiveTicket(ticket);
    setTicketForm({
      status: ticket.status,
      remarks: ticket.remarks || ''
    });
    setShowTicketModal(true);
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      setTicketSubmitting(true);
      await api.put(`/tickets/${activeTicket.id}/status`, ticketForm);
      alert('Ticket status updated successfully!');
      setShowTicketModal(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update ticket status.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Admin Branding */}
      <div>
        <span className="text-xxs font-bold text-red-400 bg-red-950/40 border border-red-900 px-3 py-1 rounded-full uppercase tracking-wider">
          Management Control Console
        </span>
        <h1 className="text-2xl font-extrabold text-white mt-3 tracking-tight">Admin Overview Dashboard</h1>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'products' ? 'text-violet-400 border-violet-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Manage Catalog Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'orders' ? 'text-violet-400 border-violet-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Customer Orders Log
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'tickets' ? 'text-violet-400 border-violet-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Support Tickets Log
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-fade-in">
          {/* Products Stats Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4 max-w-sm">
            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xxs font-semibold text-slate-500 uppercase">Products Catalog</span>
              <p className="text-xl font-bold text-white mt-1">{totalProducts} items</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Products Catalog ({products.length})</h3>
            <button
              onClick={() => handleOpenProductModal()}
              className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-xxs tracking-wider border-b border-slate-850">
                  <tr>
                    <th className="p-4">Item Details</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">In Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500">No products available. Add some products to your catalog.</td>
                    </tr>
                  ) : (
                    products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-850/40">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.name} className="w-10 h-10 object-cover rounded-lg bg-slate-950 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-850 rounded-lg flex items-center justify-center text-xxs text-slate-500 shrink-0">No Img</div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate text-sm">{prod.name}</p>
                              <p className="text-xxs text-slate-500 truncate max-w-md mt-0.5">{prod.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-white">৳{parseFloat(prod.price).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xxs font-medium ${
                            prod.stock === 0 ? 'bg-red-950/45 text-red-400' : 'bg-slate-950 text-slate-300'
                          }`}>
                            {prod.stock} left
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenProductModal(prod)}
                            className="p-1.5 bg-slate-800 hover:bg-violet-900/40 hover:text-violet-400 rounded-lg text-slate-400 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 bg-slate-800 hover:bg-red-900/40 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in">
          {/* Revenue & Orders Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className="p-3 bg-violet-950 text-violet-400 rounded-xl">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xxs font-semibold text-slate-500 uppercase">Total Net Revenue</span>
                <p className="text-xl font-bold text-white mt-1">৳{totalSales.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className="p-3 bg-pink-950 text-pink-400 rounded-xl">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xxs font-semibold text-slate-500 uppercase">Customer Orders</span>
                <p className="text-xl font-bold text-white mt-1">{totalOrders} orders</p>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown Sub-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {/* Pending Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Pending Orders</span>
                <span className="text-lg font-extrabold text-amber-500 mt-1 block">{pendingOrdersCount}</span>
              </div>
              <span className="text-base select-none">⏳</span>
            </div>

            {/* Processing Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Processing Orders</span>
                <span className="text-lg font-extrabold text-blue-400 mt-1 block">{processingOrdersCount}</span>
              </div>
              <span className="text-base select-none">⚙️</span>
            </div>

            {/* Shipped Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Shipped Orders</span>
                <span className="text-lg font-extrabold text-indigo-400 mt-1 block">{shippedOrdersCount}</span>
              </div>
              <span className="text-base select-none">🚚</span>
            </div>

            {/* Completed Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Completed Orders</span>
                <span className="text-lg font-extrabold text-emerald-400 mt-1 block">{completedOrdersCount}</span>
              </div>
              <span className="text-base select-none">✅</span>
            </div>

            {/* Cancelled Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Cancelled Orders</span>
                <span className="text-lg font-extrabold text-red-400 mt-1 block">{cancelledOrdersCount}</span>
              </div>
              <span className="text-base select-none">❌</span>
            </div>
          </div>

          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-2">Order Logs ({orders.length})</h3>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-xxs tracking-wider border-b border-slate-850">
                  <tr>
                    <th className="p-4">Order Info</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Total Bill</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">No orders placed by customers yet.</td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-850/40">
                        <td className="p-4">
                          <p className="font-bold text-white">#{ord.id}</p>
                          <p className="text-xxs text-slate-500 mt-0.5">{new Date(ord.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{ord.user_name}</p>
                          <p className="text-xxs text-slate-500 mt-0.5">{ord.user_email}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-slate-300 font-semibold">{ord.items?.map(i => `${i.product_name} (x${i.quantity})`).join(', ')}</p>
                          <p className="text-xxs text-slate-500 mt-1 flex items-center">
                            <span>Phone: {ord.phone} | Addr: {ord.shipping_address}</span>
                          </p>
                          <p className="text-xxs mt-1.5 flex flex-wrap items-center gap-1.5 text-left">
                            <span className="text-slate-500 font-bold uppercase">Payment:</span>
                            {ord.payment_method?.includes('bKash') ? (
                              <span className="px-2 py-0.5 bg-pink-950/40 text-pink-400 font-semibold border border-pink-900/40 rounded">
                                {ord.payment_method}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-violet-950/40 text-violet-400 font-semibold border border-violet-900/40 rounded">
                                {ord.payment_method}
                              </span>
                            )}
                          </p>
                          {ord.status === 'Cancelled' && ord.cancel_reason && (
                            <p className="text-xxs text-red-400 bg-red-950/30 border border-red-900/30 px-2.5 py-1.5 rounded-lg mt-2 text-left">
                              <strong>Cancel Reason:</strong> {ord.cancel_reason}
                            </p>
                          )}
                        </td>
                        <td className="p-4 font-bold text-white">৳{parseFloat(ord.total_amount).toFixed(2)}</td>
                        <td className="p-4">
                          <select
                            value={ord.status}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                            className={`text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-violet-500 font-medium ${
                              ord.status === 'Delivered' ? 'text-emerald-400 border-emerald-950' :
                              ord.status === 'Cancelled' ? 'text-red-400 border-red-950' :
                              'text-violet-450 border-violet-950'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT TICKETS TAB */}
      {activeTab === 'tickets' && (
        <div className="space-y-6 animate-fade-in">
          {/* Support Desk Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Tickets */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Total Support Tickets</span>
                <span className="text-lg font-extrabold text-white mt-1 block">{ticketStats.total}</span>
              </div>
              <span className="text-base select-none">📨</span>
            </div>

            {/* Pending Tickets */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Pending Tickets</span>
                <span className="text-lg font-extrabold text-amber-500 mt-1 block">{ticketStats.pending}</span>
              </div>
              <span className="text-base select-none">⏳</span>
            </div>

            {/* Resolved Tickets */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Resolved Tickets</span>
                <span className="text-lg font-extrabold text-emerald-400 mt-1 block">{ticketStats.resolved}</span>
              </div>
              <span className="text-base select-none">✅</span>
            </div>

            {/* Closed Tickets */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Closed Tickets</span>
                <span className="text-lg font-extrabold text-slate-400 mt-1 block">{ticketStats.closed}</span>
              </div>
              <span className="text-base select-none">📁</span>
            </div>
          </div>

          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pt-2">Support Tickets Log ({tickets.length})</h3>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-xxs tracking-wider border-b border-slate-850">
                  <tr>
                    <th className="p-4">Ticket ID</th>
                    <th className="p-4">Sender</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Message</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Admin Remarks</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-500">No support tickets found.</td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-850/40">
                        <td className="p-4 font-bold text-white">#T{ticket.id}</td>
                        <td className="p-4">
                          <span className="font-semibold text-white block">{ticket.name}</span>
                          <span className="text-xxs text-slate-500 block">{ticket.email}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] inline-block mt-1 font-semibold ${
                            ticket.user_name ? 'bg-violet-950/45 text-violet-400 border border-violet-900/30' : 'bg-slate-950/45 text-slate-450 border border-slate-800'
                          }`}>
                            {ticket.user_name ? 'Registered User' : 'Guest'}
                          </span>
                        </td>
                        <td className="p-4 text-white font-semibold">{ticket.subject}</td>
                        <td className="p-4 text-slate-300 max-w-[200px] whitespace-pre-wrap">{ticket.message}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                            ticket.status === 'Resolved' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' :
                            ticket.status === 'Closed' ? 'bg-slate-950/40 text-slate-400 border border-slate-900' :
                            'bg-amber-950/40 text-amber-500 border border-amber-900'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 italic max-w-[150px] truncate">{ticket.remarks || 'No remarks'}</td>
                        <td className="p-4 text-slate-500">{new Date(ticket.created_at).toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenTicketModal(ticket)}
                            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-violet-400 border border-slate-850 hover:border-slate-700 font-bold text-xxs rounded-lg transition-colors inline-flex items-center space-x-1 animate-pulse-subtle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Action</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT CREATE/EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setShowProductModal(false)} />
          
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl z-10 animate-slide-up">
            <div className="p-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <h4 className="text-base font-bold text-white">{editingProduct ? 'Edit Catalog Product' : 'Add New Product'}</h4>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900 px-3 py-2 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Fortnite 1000 V-Bucks Gift Card"
                  className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Description *</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Details, features, activation region..."
                  className="w-full text-xs bg-slate-950 border border-slate-855 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Price (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="1200"
                    className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Count *</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="50"
                    className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://example.com/product.jpg"
                  className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-700"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-350 hover:text-white rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                >
                  {formSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Save Catalog</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION REMARKS MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl z-10 animate-slide-up">
            <div className="p-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <h4 className="text-base font-bold text-white">Order Cancellation Reason</h4>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-5 space-y-4">
              <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/40 p-3 rounded-xl">
                <p className="text-left"><strong>Warning</strong>: Cancelling this order will release/restock the product units. Please specify the reason below.</p>
              </div>

              <div>
                <label className="block text-left text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Reason / Remarks *
                </label>
                <textarea
                  rows="3"
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                  placeholder="e.g. Stock unavailable, payment failed, or customer request..."
                  className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-700"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-350 hover:text-white rounded-lg text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                >
                  {cancelSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Confirm Cancel</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TICKET STATUS MODAL */}
      {showTicketModal && activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowTicketModal(false)} />

          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 animate-slide-up text-left">
            <button
              onClick={() => setShowTicketModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-850 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Process Ticket #T{activeTicket.id}</h3>
            <p className="text-xxs text-violet-400 font-semibold mb-4">Subject: {activeTicket.subject}</p>

            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl mb-4 text-xxs text-slate-350">
              <span className="font-bold text-slate-400 block mb-1">Message from {activeTicket.name}:</span>
              <p className="whitespace-pre-wrap leading-relaxed">{activeTicket.message}</p>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Set Ticket Status</label>
                <select
                  value={ticketForm.status}
                  onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3 py-2 text-white transition-all text-xs font-semibold"
                >
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Resolution Remarks / Notes</label>
                <textarea
                  value={ticketForm.remarks}
                  onChange={(e) => setTicketForm({ ...ticketForm, remarks: e.target.value })}
                  placeholder="Type any actions taken or notes here..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-650 transition-all resize-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-white text-xs font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 glow-button flex items-center space-x-1"
                >
                  {ticketSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Actions</span>
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
