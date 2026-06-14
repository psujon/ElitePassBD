import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';
import { Loader2, Plus, Edit2, Trash2, Check, X, ClipboardList, Package, Banknote, MessageSquare, Layers, ChevronDown } from 'lucide-react';

const parseJSON = (str, fallback) => {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', or 'tickets'

  // Data lists
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    closed: 0
  });
  const [loading, setLoading] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Modal State for Product Create/Edit
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means adding new
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: '',
    category_id: '',
    tags: '',
    additional_info: '',
    faqs: [],
    packages: [],
    device_options: '',
    activation_options: ''
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null means adding new
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });
  const [categoryFormError, setCategoryFormError] = useState('');
  const [categoryFormSubmitting, setCategoryFormSubmitting] = useState(false);
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
      const [prodData, orderData, ticketData, statsData, catData] = await Promise.all([
        api.get('/products'),
        api.get('/orders'),
        api.get('/tickets'),
        api.get('/tickets/stats'),
        api.get('/products/categories')
      ]);
      setProducts(prodData);
      setOrders(orderData);
      setTickets(ticketData);
      setTicketStats(statsData);
      setCategories(catData || []);
    } catch (err) {
      console.error('Failed to load admin stats', err);
      toast.error('Error loading dashboard data. Are you logged in as an Admin?');
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
        stock: product.stock,
        category_id: product.category_id || '',
        tags: product.tags || '',
        additional_info: product.additional_info || '',
        faqs: parseJSON(product.faqs, []),
        packages: parseJSON(product.packages, []),
        device_options: product.device_options || '',
        activation_options: product.activation_options || ''
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        image_url: '',
        stock: '10', // default
        category_id: '',
        tags: '',
        additional_info: '',
        faqs: [],
        packages: [],
        device_options: '',
        activation_options: ''
      });
    }
    setFormError('');
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const { name, description, price, image_url, stock, category_id } = productForm;

    if (!name || !description || price === undefined || stock === undefined) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    const submissionData = {
      ...productForm,
      category_id: category_id === '' ? null : parseInt(category_id)
    };

    try {
      if (editingProduct) {
        // Edit existing product
        await api.put(`/products/${editingProduct.id}`, submissionData);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        await api.post('/products', submissionData);
        toast.success('Product created successfully!');
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
      toast.success(res.message || 'Product deleted successfully!');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete product.');
    }
  };

  // CATEGORY CRUD HANDLERS
  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: ''
      });
    }
    setCategoryFormError('');
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const { name } = categoryForm;

    if (!name || name.trim() === '') {
      setCategoryFormError('Category name is required.');
      return;
    }

    setCategoryFormSubmitting(true);
    setCategoryFormError('');

    try {
      if (editingCategory) {
        // Edit existing category
        await api.put(`/products/categories/${editingCategory.id}`, categoryForm);
        toast.success('Category updated successfully!');
      } else {
        // Create new category
        await api.post('/products/categories', categoryForm);
        toast.success('Category created successfully!');
      }
      setShowCategoryModal(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setCategoryFormError(err.message || 'Failed to save category.');
    } finally {
      setCategoryFormSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Associated products will become uncategorized.')) return;
    try {
      const res = await api.delete(`/products/categories/${id}`);
      toast.success(res.message || 'Category deleted successfully!');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete category.');
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
      toast.success(`Order status updated to ${newStatus}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelRemarks.trim()) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }

    try {
      setCancelSubmitting(true);
      await api.put(`/orders/${cancellingOrderId}/status`, {
        status: 'Cancelled',
        cancel_reason: cancelRemarks
      });
      toast.success('Order status updated to Cancelled');
      setShowCancelModal(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to cancel order.');
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
      toast.success('Ticket status updated successfully!');
      setShowTicketModal(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update ticket status.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const filteredProducts = products.filter((prod) => {
    if (!productSearchQuery) return true;
    const query = productSearchQuery.toLowerCase();
    return (
      prod.name?.toLowerCase().includes(query) ||
      prod.description?.toLowerCase().includes(query) ||
      prod.category_name?.toLowerCase().includes(query) ||
      prod.tags?.toLowerCase().includes(query) ||
      prod.device_options?.toLowerCase().includes(query) ||
      prod.activation_options?.toLowerCase().includes(query) ||
      prod.id?.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col md:flex-row bg-[#f5f7fa] text-slate-800">

      {/* Left Side: Navigation Sidebar */}
      <div className="w-full md:w-64 bg-[#111e35] text-slate-300 p-6 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-800">
        {/* Logo and brand name */}
        <div className="flex items-center space-x-2.5 px-2 mb-6 text-left">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-violet-500/20 shrink-0">
            E
          </div>
          <span className="text-sm font-extrabold tracking-wider text-white uppercase truncate">ElitePass BD</span>
        </div>

        <div className="mb-6 px-2 hidden md:block text-left">
          <span className="text-[10px] font-bold text-orange-400 bg-orange-950/45 border border-orange-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit">
            Admin Console
          </span>
        </div>

        {/* Navigation Sidebar List */}
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 pb-2 md:pb-0 scrollbar-none snap-x md:space-y-1">
          <div className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3.5 mb-2 mt-4 text-left">
            General
          </div>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${activeTab === 'products'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <Package className={`w-4 h-4 shrink-0 ${activeTab === 'products' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>Catalog Products</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${activeTab === 'orders'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <ClipboardList className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>Customer Orders</span>
            {pendingOrdersCount > 0 && (
              <span className="ml-auto bg-[#ff5e3a] text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <div className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3.5 mb-2 mt-6 text-left">
            Management
          </div>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${activeTab === 'categories'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'categories' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>Categories</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${activeTab === 'tickets'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'tickets' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>Support Tickets</span>
            {ticketStats.pending > 0 && (
              <span className="ml-auto bg-orange-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                {ticketStats.pending}
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
            <h1 className="text-2xl font-extrabold text-slate-850 tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">Welcome back, Admin. Manage catalog and track customer orders.</p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-650 bg-white border border-slate-200/60 hover:bg-slate-50 rounded-xl transition-colors relative cursor-pointer shadow-xs">
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff5e3a] rounded-full animate-pulse" />
              🔔
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-650 bg-white border border-slate-200/60 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-xs">
              ✉️
            </button>
            <div className="flex items-center space-x-2.5 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl shadow-xs">
              <div className="w-7 h-7 rounded-full bg-violet-650 flex items-center justify-center text-white font-extrabold text-xs">
                AD
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-700 leading-tight">Admin User</span>
                <span className="block text-[10px] text-slate-500 font-semibold leading-tight">Super Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row of 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Revenue */}
          <div className="bg-white border border-slate-150/70 p-5 rounded-2xl shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Total Net Revenue</span>
                <span className="text-lg font-extrabold text-slate-850 mt-1 block">৳{totalSales.toFixed(2)}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-base shadow-xs select-none">
                ৳
              </div>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-[10px] text-violet-600 hover:text-violet-850 font-bold flex items-center cursor-pointer"
            >
              View orders &rarr;
            </button>
          </div>

          {/* Card 2: Orders */}
          <div className="bg-white border border-slate-150/70 p-5 rounded-2xl shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Customer Orders</span>
                <span className="text-lg font-extrabold text-slate-850 mt-1 block">{totalOrders} orders</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-purple-500/10 text-purple-650 flex items-center justify-center font-bold text-sm shadow-xs select-none">
                📋
              </div>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-[10px] text-violet-600 hover:text-violet-850 font-bold flex items-center cursor-pointer"
            >
              View all orders &rarr;
            </button>
          </div>

          {/* Card 3: Products */}
          <div className="bg-white border border-slate-150/70 p-5 rounded-2xl shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Catalog Products</span>
                <span className="text-lg font-extrabold text-slate-850 mt-1 block">{totalProducts} items</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-650 flex items-center justify-center font-bold text-sm shadow-xs select-none">
                📦
              </div>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-[10px] text-violet-600 hover:text-violet-850 font-bold flex items-center cursor-pointer"
            >
              View catalog &rarr;
            </button>
          </div>
        </div>

        {/* Tab Panel Content */}
        <div className="space-y-6">
          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="flex justify-between items-center pt-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Products Catalog ({products.length})</h3>
                <button
                  onClick={() => handleOpenProductModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xxs tracking-wider border-b border-slate-200/60 whitespace-nowrap">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">
                          <div className="flex items-center space-x-2">
                            <span>Item Details</span>
                            <input
                              type="text"
                              placeholder="Search..."
                              value={productSearchQuery}
                              onChange={(e) => setProductSearchQuery(e.target.value)}
                              className="bg-white border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-2 py-0.5 text-[10px] font-normal text-slate-700 w-36 normal-case"
                            />
                          </div>
                        </th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Tags</th>
                        <th className="p-4">Devices</th>
                        <th className="p-4">Activation</th>
                        <th className="p-4">Additional Info</th>
                        <th className="p-4">Packages</th>
                        <th className="p-4">FAQs</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="13" className="p-8 text-center text-slate-400 font-medium">
                            {products.length === 0 ? 'No products available. Add some products to your catalog.' : 'No matching products found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 text-slate-700 font-medium text-xs whitespace-nowrap">
                            {/* 1. ID */}
                            <td className="p-4 font-bold text-slate-800">#{prod.id}</td>

                            {/* 2. Item Details (Image & Name) */}
                            <td className="p-4">
                              <div className="flex items-center space-x-2.5">
                                {prod.image_url ? (
                                  <img src={prod.image_url} alt={prod.name} className="w-8 h-8 object-cover rounded-lg bg-slate-100 border border-slate-200/50 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 bg-slate-100 border border-slate-200/50 rounded-lg flex items-center justify-center text-[9px] text-slate-400 shrink-0 font-bold">No Img</div>
                                )}
                                <span className="font-bold text-slate-850 truncate max-w-[150px]">{prod.name}</span>
                              </div>
                            </td>

                            {/* 3. Category */}
                            <td className="p-4">
                              {prod.category_name ? (
                                <span className="bg-violet-50 text-violet-600 border border-violet-100/60 px-2 py-0.5 rounded-lg text-[10px] font-bold">{prod.category_name}</span>
                              ) : (
                                <span className="text-slate-450 italic text-[10px]">-</span>
                              )}
                            </td>

                            {/* 4. Description */}
                            <td className="p-4 max-w-[200px] truncate text-slate-500 text-[11px]" title={prod.description}>
                              {prod.description}
                            </td>

                            {/* 5. Price */}
                            <td className="p-4 font-bold text-slate-850">৳{parseFloat(prod.price).toFixed(2)}</td>

                            {/* 6. Stock */}
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${prod.stock === 0 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {prod.stock} left
                              </span>
                            </td>

                            {/* 7. Tags */}
                            <td className="p-4">
                              {prod.tags ? (
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  {prod.tags.split(',').map((tag, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-605 border border-slate-200/50 px-1.5 py-0.5 rounded text-[9px] font-bold">{tag.trim()}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 8. Devices */}
                            <td className="p-4">
                              {prod.device_options ? (
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  {prod.device_options.split(',').map((device, idx) => (
                                    <span key={idx} className="bg-blue-50 text-blue-600 border border-blue-100/60 px-1.5 py-0.5 rounded text-[9px] font-bold">{device.trim()}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 9. Activation */}
                            <td className="p-4">
                              {prod.activation_options ? (
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  {prod.activation_options.split(',').map((opt, idx) => (
                                    <span key={idx} className="bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-1.5 py-0.5 rounded text-[9px] font-bold">{opt.trim()}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 10. Additional Info */}
                            <td className="p-4 max-w-[180px] truncate text-slate-500 text-[11px]" title={prod.additional_info}>
                              {prod.additional_info || <span className="text-slate-450 italic">-</span>}
                            </td>

                            {/* 11. Packages */}
                            <td className="p-4">
                              {prod.packages && prod.packages.length > 0 ? (
                                <div className="space-y-1 max-w-[150px]">
                                  {prod.packages.map((pkg, idx) => (
                                    <div key={idx} className="text-[10px] text-slate-600 flex justify-between gap-2 border-b border-slate-100 pb-0.5">
                                      <span className="text-slate-500">{pkg.duration}</span>
                                      <span className="font-extrabold text-violet-605">৳{parseFloat(pkg.price).toFixed(0)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 12. FAQs */}
                            <td className="p-4">
                              {prod.faqs && prod.faqs.length > 0 ? (
                                <span className="text-[10px] text-slate-650 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-bold cursor-help" title={prod.faqs.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}>
                                  {prod.faqs.length} FAQs
                                </span>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 13. Actions */}
                            <td className="p-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleOpenProductModal(prod)}
                                className="p-2 bg-slate-50 hover:bg-violet-55 hover:text-violet-650 border border-slate-200/40 rounded-lg text-slate-500 transition-colors cursor-pointer inline-block"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-2 bg-slate-50 hover:bg-red-55 hover:text-red-650 border border-slate-200/40 rounded-lg text-slate-500 transition-colors cursor-pointer inline-block"
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
            <div className="space-y-6 animate-fade-in text-left">
              {/* Order Status Breakdown Sub-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {/* Pending Card */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Pending</span>
                    <span className="text-lg font-extrabold text-amber-500 mt-1 block">{pendingOrdersCount}</span>
                  </div>
                  <span className="text-base select-none">⏳</span>
                </div>

                {/* Processing Card */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Processing</span>
                    <span className="text-lg font-extrabold text-blue-500 mt-1 block">{processingOrdersCount}</span>
                  </div>
                  <span className="text-base select-none">⚙️</span>
                </div>

                {/* Shipped Card */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Shipped</span>
                    <span className="text-lg font-extrabold text-indigo-500 mt-1 block">{shippedOrdersCount}</span>
                  </div>
                  <span className="text-base select-none">🚚</span>
                </div>

                {/* Completed Card */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
                    <span className="text-lg font-extrabold text-emerald-500 mt-1 block">{completedOrdersCount}</span>
                  </div>
                  <span className="text-base select-none">✅</span>
                </div>

                {/* Cancelled Card */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Cancelled</span>
                    <span className="text-lg font-extrabold text-red-500 mt-1 block">{cancelledOrdersCount}</span>
                  </div>
                  <span className="text-base select-none">❌</span>
                </div>
              </div>

              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 pt-2">Order Logs ({orders.length})</h3>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xxs tracking-wider border-b border-slate-200/60">
                      <tr>
                        <th className="p-4">Order Info</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">Total Bill</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No orders placed by customers yet.</td>
                        </tr>
                      ) : (
                        orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4 text-left">
                              <p className="font-bold text-slate-805">#{ord.id}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{new Date(ord.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="p-4 text-left">
                              <p className="font-bold text-slate-700">{ord.user_name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{ord.user_email}</p>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1.5 text-left">
                                {ord.items?.map((i, idx) => (
                                  <div key={idx} className="text-slate-650 text-xs">
                                    <span className="font-semibold text-slate-850">{i.product_name}</span>
                                    <span className="text-slate-450 ml-1 font-bold">x{i.quantity}</span>
                                    {(i.package_name || i.selected_device || i.selected_activation) && (
                                      <div className="text-[10px] text-violet-600 font-bold mt-0.5 space-y-0.5 leading-relaxed bg-violet-50 border border-violet-100/60 p-1.5 rounded-lg max-w-xs">
                                        {i.package_name && <div>📦 Pkg: {i.package_name}</div>}
                                        {i.selected_device && <div>📱 Dev: {i.selected_device}</div>}
                                        {i.selected_activation && <div>🔑 Act: {i.selected_activation}</div>}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 font-semibold">
                                <span>Phone: {ord.phone} | Addr: {ord.shipping_address}</span>
                              </p>
                              {ord.additional_notes && (
                                <p className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200/85 px-2.5 py-1.5 rounded-lg mt-1.5 text-left leading-relaxed max-w-xs">
                                  <strong>Notes:</strong> {ord.additional_notes}
                                </p>
                              )}
                              <p className="text-[10px] mt-1.5 flex flex-wrap items-center gap-1.5 text-left">
                                <span className="text-slate-400 font-bold uppercase">Payment:</span>
                                {ord.payment_method?.includes('bKash') ? (
                                  <span className="px-2 py-0.5 bg-pink-50 text-pink-600 font-bold border border-pink-100 rounded text-[9px] uppercase tracking-wide">
                                    {ord.payment_method}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-violet-50 text-violet-600 font-bold border border-violet-100 rounded text-[9px] uppercase tracking-wide">
                                    {ord.payment_method}
                                  </span>
                                )}
                              </p>
                              {ord.status === 'Cancelled' && ord.cancel_reason && (
                                <p className="text-[10px] text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg mt-2 text-left leading-relaxed">
                                  <strong>Cancel Reason:</strong> {ord.cancel_reason}
                                </p>
                              )}
                            </td>
                            <td className="p-4 font-extrabold text-slate-800">৳{parseFloat(ord.total_amount).toFixed(2)}</td>
                            <td className="p-4">
                              <select
                                value={ord.status}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                className={`text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-violet-500 font-semibold cursor-pointer ${ord.status === 'Delivered' ? 'text-emerald-600 border-emerald-200 bg-emerald-50/20' :
                                  ord.status === 'Cancelled' ? 'text-red-500 border-red-200 bg-red-50/20' :
                                    'text-violet-600 border-violet-200 bg-violet-50/20'
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
            <div className="space-y-6 animate-fade-in text-left">
              {/* Support Desk Overview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Total Tickets */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Total Support Tickets</span>
                    <span className="text-lg font-extrabold text-slate-800 mt-1 block">{ticketStats.total}</span>
                  </div>
                  <span className="text-base select-none">📨</span>
                </div>

                {/* Pending Tickets */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Pending Tickets</span>
                    <span className="text-lg font-extrabold text-amber-500 mt-1 block">{ticketStats.pending}</span>
                  </div>
                  <span className="text-base select-none">⏳</span>
                </div>

                {/* Resolved Tickets */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Resolved Tickets</span>
                    <span className="text-lg font-extrabold text-emerald-500 mt-1 block">{ticketStats.resolved}</span>
                  </div>
                  <span className="text-base select-none">✅</span>
                </div>

                {/* Closed Tickets */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="text-left">
                    <span className="text-xxxxs font-bold text-slate-500 uppercase tracking-wider block">Closed Tickets</span>
                    <span className="text-lg font-extrabold text-slate-400 mt-1 block">{ticketStats.closed}</span>
                  </div>
                  <span className="text-base select-none">📁</span>
                </div>
              </div>

              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 pt-2">Support Tickets Log ({tickets.length})</h3>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xxs tracking-wider border-b border-slate-200/60">
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
                    <tbody className="divide-y divide-slate-100">
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">No support tickets found.</td>
                        </tr>
                      ) : (
                        tickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4 font-bold text-slate-800 text-left">#T{ticket.id}</td>
                            <td className="p-4 text-left">
                              <span className="font-bold text-slate-700 block">{ticket.name}</span>
                              <span className="text-[10px] text-slate-450 block mt-0.5">{ticket.email}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] inline-block mt-1.5 font-bold ${ticket.user_name ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                                }`}>
                                {ticket.user_name ? 'Registered' : 'Guest'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-800 font-semibold text-left">{ticket.subject}</td>
                            <td className="p-4 text-slate-500 max-w-[200px] whitespace-pre-wrap text-left">{ticket.message}</td>
                            <td className="p-4 text-left">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                ticket.status === 'Closed' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                  'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="p-4 text-slate-550 italic max-w-[150px] truncate text-left">{ticket.remarks || 'No remarks'}</td>
                            <td className="p-4 text-slate-400 text-left">{new Date(ticket.created_at).toLocaleString()}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleOpenTicketModal(ticket)}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-violet-600 border border-slate-200 hover:border-slate-350 font-bold text-[10px] rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
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

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-between items-center pt-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Product Categories ({categories.length})</h3>
                <button
                  onClick={() => handleOpenCategoryModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xxs tracking-wider border-b border-slate-200/60">
                      <tr>
                        <th className="p-4">Category ID</th>
                        <th className="p-4">Category Name</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-450 font-medium">No categories found. Create some categories.</td>
                        </tr>
                      ) : (
                        categories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4 font-bold text-slate-800 text-left">#{cat.id}</td>
                            <td className="p-4 font-bold text-slate-800 text-left">{cat.name}</td>
                            <td className="p-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleOpenCategoryModal(cat)}
                                className="p-2 bg-slate-50 hover:bg-violet-50 hover:text-violet-650 border border-slate-200/40 rounded-lg text-slate-500 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 bg-slate-55 hover:bg-red-50 hover:text-red-650 border border-slate-200/40 rounded-lg text-slate-500 transition-colors cursor-pointer"
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
        </div>
      </div>

      {/* PRODUCT CREATE/EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={() => setShowProductModal(false)} />

          <div className="relative bg-white border border-slate-200 w-full rounded-2xl overflow-hidden shadow-2xl z-10 animate-slide-up max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h4 className="text-base font-bold text-slate-800">{editingProduct ? 'Edit Catalog Product' : 'Add New Product'}</h4>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-left">
              {formError && (
                <div className="text-xs font-semibold text-red-505 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Capcut Pro Special offer"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/product.jpg"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Category (Optional)</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 cursor-pointer"
                  >
                    <option value="">No Category / Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Base Price (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="1200"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Stock Count *</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="50"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Product Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={productForm.tags}
                    onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                    placeholder="e.g. AI tools, video editing"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Device Options (comma-separated)</label>
                  <input
                    type="text"
                    value={productForm.device_options}
                    onChange={(e) => setProductForm({ ...productForm, device_options: e.target.value })}
                    placeholder="e.g. Phone, PC/MAC, Phone + PC"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Activation Options (comma-separated)</label>
                  <input
                    type="text"
                    value={productForm.activation_options}
                    onChange={(e) => setProductForm({ ...productForm, activation_options: e.target.value })}
                    placeholder="e.g. Readymade ID, Personal Email"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Description *</label>
                  <textarea
                    rows="5"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Details, features, activation region..."
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Additional Information Box</label>
                  <textarea
                    rows="5"
                    value={productForm.additional_info}
                    onChange={(e) => setProductForm({ ...productForm, additional_info: e.target.value })}
                    placeholder="E.g. full period warranty, official accounts, 28 days validity..."
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Package Builder */}
                <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Product Packages</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedPkgs = [...productForm.packages, { duration: '', price: '' }];
                        setProductForm({ ...productForm, packages: updatedPkgs });
                      }}
                      className="px-2.5 py-1 bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white border border-violet-200 hover:border-transparent rounded text-[10px] font-bold transition-all cursor-pointer"
                    >
                      + Add Package Option
                    </button>
                  </div>

                  {productForm.packages.length === 0 ? (
                    <p className="text-[11px] text-slate-450 italic">No packages defined. Base price will apply.</p>
                  ) : (
                    <div className="space-y-2">
                      {productForm.packages.map((pkg, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={pkg.duration}
                            onChange={(e) => {
                              const updated = [...productForm.packages];
                              updated[idx].duration = e.target.value;
                              setProductForm({ ...productForm, packages: updated });
                            }}
                            placeholder="e.g. 1 Month, 6 Months"
                            className="flex-1 text-xs bg-white border border-slate-250 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-850"
                            required
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={pkg.price}
                            onChange={(e) => {
                              const updated = [...productForm.packages];
                              updated[idx].price = e.target.value;
                              setProductForm({ ...productForm, packages: updated });
                            }}
                            placeholder="Price in ৳"
                            className="w-28 text-xs bg-white border border-slate-250 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-855"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productForm.packages.filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, packages: updated });
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white border border-red-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* FAQ Builder */}
                <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Frequently Asked Questions (FAQ)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedFaqs = [...productForm.faqs, { q: '', a: '' }];
                        setProductForm({ ...productForm, faqs: updatedFaqs });
                      }}
                      className="px-2.5 py-1 bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white border border-violet-200 hover:border-transparent rounded text-[10px] font-bold transition-all cursor-pointer"
                    >
                      + Add FAQ
                    </button>
                  </div>

                  {productForm.faqs.length === 0 ? (
                    <p className="text-[11px] text-slate-450 italic">No FAQs added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {productForm.faqs.map((faq, idx) => (
                        <div key={idx} className="space-y-1.5 p-3 bg-white rounded-lg border border-slate-200 relative">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productForm.faqs.filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, faqs: updated });
                            }}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="text"
                            value={faq.q}
                            onChange={(e) => {
                              const updated = [...productForm.faqs];
                              updated[idx].q = e.target.value;
                              setProductForm({ ...productForm, faqs: updated });
                            }}
                            placeholder="Question (e.g. How do I purchase?)"
                            className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800 pr-8"
                            required
                          />
                          <textarea
                            rows="2"
                            value={faq.a}
                            onChange={(e) => {
                              const updated = [...productForm.faqs];
                              updated[idx].a = e.target.value;
                              setProductForm({ ...productForm, faqs: updated });
                            }}
                            placeholder="Answer"
                            className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
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
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={() => setShowCancelModal(false)} />

          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl z-10 animate-slide-up text-left">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-base font-bold text-slate-800">Order Cancellation Reason</h4>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-5 space-y-4">
              <div className="text-xs text-red-500 bg-red-50 border border-red-100 p-3 rounded-xl">
                <p className="text-left leading-relaxed"><strong>Warning</strong>: Cancelling this order will release/restock the product units. Please specify the reason below.</p>
              </div>

              <div>
                <label className="block text-left text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1.5">
                  Reason / Remarks *
                </label>
                <textarea
                  rows="3"
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                  placeholder="e.g. Stock unavailable, payment failed, or customer request..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-550 hover:bg-slate-50 rounded-lg text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
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
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={() => setShowTicketModal(false)} />

          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 animate-slide-up text-left">
            <button
              onClick={() => setShowTicketModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-full border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-805 mb-1">Process Ticket #T{activeTicket.id}</h3>
            <p className="text-xxs text-violet-600 font-semibold mb-4">Subject: {activeTicket.subject}</p>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl mb-4 text-xxs text-slate-600">
              <span className="font-bold text-slate-500 block mb-1">Message from {activeTicket.name}:</span>
              <p className="whitespace-pre-wrap leading-relaxed">{activeTicket.message}</p>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-2">Set Ticket Status</label>
                <select
                  value={ticketForm.status}
                  onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
                  className="w-full bg-slate-55 border border-slate-200 focus:border-violet-500 focus:bg-white focus:outline-none rounded-xl px-3 py-2 text-slate-800 transition-all text-xs font-semibold cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-2">Resolution Remarks / Notes</label>
                <textarea
                  value={ticketForm.remarks}
                  onChange={(e) => setTicketForm({ ...ticketForm, remarks: e.target.value })}
                  placeholder="Type any actions taken or notes here..."
                  rows={3}
                  className="w-full bg-slate-55 border border-slate-200 focus:border-violet-500 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 transition-all resize-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
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

      {/* CATEGORY CREATE/EDIT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={() => setShowCategoryModal(false)} />

          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl z-10 animate-slide-up text-left">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-base font-bold text-slate-850">{editingCategory ? 'Edit Category' : 'Add New Category'}</h4>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-650"><X className="w-5 h-5 cursor-pointer" /></button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-5 space-y-4">
              {categoryFormError && (
                <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {categoryFormError}
                </div>
              )}

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Subscriptions"
                  className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-550 hover:bg-slate-50 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categoryFormSubmitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  {categoryFormSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Save Category</span>
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
