import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api, API_BASE_URL } from '../utils/api';
import { Loader2, Plus, Edit2, Trash2, Check, X, ClipboardList, Package, Banknote, MessageSquare, Layers, ChevronDown, Database, KeyRound, LayoutDashboard } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'products', 'orders', 'tickets', 'categories', 'backup', 'licenses'

  // Data lists
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [epsHistory, setEpsHistory] = useState([]);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    closed: 0
  });
  const [loading, setLoading] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
    activation_options: '',
    discount_percent: '',
    is_hot: false,
    is_highlighted: false,
    activation_process: 'Manual'
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null means adding new
  const [backingUp, setBackingUp] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });
  const [categoryFormError, setCategoryFormError] = useState('');
  const [categoryFormSubmitting, setCategoryFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal State for License Keys
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [licenseForm, setLicenseForm] = useState({
    product_id: '',
    activation_option: '',
    package_option: '',
    license_key: ''
  });
  const [licenseFormSubmitting, setLicenseFormSubmitting] = useState(false);
  const [licenseFormError, setLicenseFormError] = useState('');
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseCurrentPage, setLicenseCurrentPage] = useState(1);
  const [licenseProductSearch, setLicenseProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

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
      const [prodData, orderData, ticketData, statsData, catData, licenseData, epsData] = await Promise.all([
        api.get('/products'),
        api.get('/orders'),
        api.get('/tickets'),
        api.get('/tickets/stats'),
        api.get('/products/categories'),
        api.get('/licenses'),
        api.get('/payments/history')
      ]);
      setProducts(prodData);
      setOrders(orderData);
      setTickets(ticketData);
      setTicketStats(statsData);
      setCategories(catData || []);
      setLicenses(licenseData || []);
      setEpsHistory(epsData || []);
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
        activation_options: product.activation_options || '',
        discount_percent: product.discount_percent !== null && product.discount_percent !== undefined ? product.discount_percent : '',
        is_hot: !!product.is_hot,
        is_highlighted: !!product.is_highlighted,
        activation_process: product.activation_process || 'Manual'
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
        activation_options: '',
        discount_percent: '',
        is_hot: false,
        is_highlighted: false,
        activation_process: 'Manual'
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

  const handleDownloadBackup = async () => {
    try {
      setBackingUp(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/admin/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate backup. Access denied or server error.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'elitepass_db_backup.sql';
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Database backup downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to download database backup.');
    } finally {
      setBackingUp(false);
    }
  };

  // LICENSE KEY HANDLERS
  const handleOpenLicenseModal = () => {
    setEditingLicense(null);
    setLicenseForm({
      product_id: '',
      activation_option: '',
      package_option: '',
      license_key: ''
    });
    setLicenseFormError('');
    setShowLicenseModal(true);
  };

  const handleEditLicense = (license) => {
    setEditingLicense(license);
    setLicenseForm({
      product_id: license.product_id,
      activation_option: license.activation_option || '',
      package_option: license.package_option || '',
      license_key: license.license_key
    });
    setLicenseFormError('');
    setShowLicenseModal(true);
  };

  const handleLicenseSubmit = async (e) => {
    e.preventDefault();
    const { product_id, license_key } = licenseForm;

    if (!product_id || !license_key.trim()) {
      setLicenseFormError('Please select a product and provide license key(s).');
      return;
    }

    setLicenseFormSubmitting(true);
    setLicenseFormError('');

    try {
      if (editingLicense) {
        const res = await api.put(`/licenses/${editingLicense.id}`, licenseForm);
        toast.success(res.message || 'License key updated successfully!');
      } else {
        const res = await api.post('/licenses', licenseForm);
        toast.success(res.message || 'License key(s) saved successfully!');
      }
      setShowLicenseModal(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setLicenseFormError(err.message || 'Failed to save license keys.');
    } finally {
      setLicenseFormSubmitting(false);
    }
  };

  const handleDeleteLicense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this license key?')) return;
    try {
      const res = await api.delete(`/licenses/${id}`);
      toast.success(res.message || 'License key deleted successfully!');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete license key.');
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

  // Pagination calculation
  const itemsPerPage = 10;
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const activePage = Math.min(currentPage, totalProductPages || 1);
  const displayedProducts = filteredProducts.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // License calculations
  const filteredLicenses = licenses.filter((lic) => {
    if (!licenseSearchQuery) return true;
    const query = licenseSearchQuery.toLowerCase();
    return (
      lic.license_key?.toLowerCase().includes(query) ||
      lic.product_name?.toLowerCase().includes(query) ||
      lic.activation_option?.toLowerCase().includes(query) ||
      lic.package_option?.toLowerCase().includes(query) ||
      lic.id?.toString().includes(query)
    );
  });

  const licenseItemsPerPage = 10;
  const totalLicensePages = Math.ceil(filteredLicenses.length / licenseItemsPerPage);
  const activeLicensePage = Math.min(licenseCurrentPage, totalLicensePages || 1);
  const displayedLicenses = filteredLicenses.slice(
    (activeLicensePage - 1) * licenseItemsPerPage,
    activeLicensePage * licenseItemsPerPage
  );

  const getPageNumbers = (current, total) => {
    const pages = [];
    const maxVisible = 5;
    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      if (current <= 2) end = 3;
      if (current >= total - 1) start = total - 2;
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

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
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${activeTab === 'dashboard'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>Dashboard</span>
          </button>

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

          <button
            onClick={() => setActiveTab('licenses')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${activeTab === 'licenses'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <KeyRound className={`w-4 h-4 shrink-0 ${activeTab === 'licenses' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>License Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${activeTab === 'backup'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <Database className={`w-4 h-4 shrink-0 ${activeTab === 'backup' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>Database Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('eps_history')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 whitespace-nowrap snap-start cursor-pointer ${activeTab === 'eps_history'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <Banknote className={`w-4 h-4 shrink-0 ${activeTab === 'eps_history' ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>EPS Payments</span>
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

        {/* Tab Panel Content */}
        <div className="space-y-6">
          {/* DASHBOARD OVERVIEW TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in text-left">
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

              {/* Quick Actions & Recent Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders Section */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Recent Customer Orders</h4>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xxs text-violet-650 hover:text-violet-850 font-bold cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {orders.length === 0 ? (
                      <p className="text-xs text-slate-450 italic py-4">No customer orders available.</p>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="text-slate-400 font-bold text-xxs tracking-wider border-b border-slate-100 uppercase pb-2">
                            <th className="py-2">Order</th>
                            <th className="py-2">Customer</th>
                            <th className="py-2">Total</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orders.slice(0, 5).map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50/20 text-slate-700 font-medium">
                              <td className="py-2 font-bold text-slate-805">#{ord.id}</td>
                              <td className="py-2">
                                <p className="font-bold text-slate-800 leading-tight">{ord.user_name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{ord.user_email}</p>
                              </td>
                              <td className="py-2 font-bold text-slate-850">৳{parseFloat(ord.total_amount).toFixed(2)}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${ord.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  ord.status === 'Cancelled' ? 'bg-red-50 text-red-500 border border-red-100' :
                                    'bg-violet-50 text-violet-600 border border-violet-100'
                                  }`}>
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Recent Support Tickets Section */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Recent Support Tickets</h4>
                    <button
                      onClick={() => setActiveTab('tickets')}
                      className="text-xxs text-violet-650 hover:text-violet-850 font-bold cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    {tickets.length === 0 ? (
                      <p className="text-xs text-slate-450 italic py-4">No support tickets available.</p>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="text-slate-400 font-bold text-xxs tracking-wider border-b border-slate-100 uppercase pb-2">
                            <th className="py-2">Ticket</th>
                            <th className="py-2">Sender</th>
                            <th className="py-2">Subject</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tickets.slice(0, 5).map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/20 text-slate-700 font-medium">
                              <td className="py-2 font-bold text-slate-805">#T{t.id}</td>
                              <td className="py-2">
                                <p className="font-bold text-slate-800 leading-tight">{t.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{t.email}</p>
                              </td>
                              <td className="py-2 max-w-[120px] truncate" title={t.subject}>{t.subject}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  t.status === 'Closed' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-left">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Products Catalog ({products.length})</h3>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearchQuery}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-250 focus:border-violet-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-slate-700 w-48 shadow-xs normal-case"
                  />
                </div>
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
                  <table className="w-full text-left text-xs border-collapse table-auto">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xxs tracking-wider border-b border-slate-200/60">
                      <tr>
                        {/* <th className="pl-4 pr-2 py-3 whitespace-nowrap">ID</th> */}
                        <th className="px-2 py-3 whitespace-nowrap">Item Details</th>
                        <th className="px-2 py-3 whitespace-nowrap">Category</th>
                        <th className="px-2 py-3 whitespace-nowrap">Description</th>
                        <th className="px-2 py-3 whitespace-nowrap">Price</th>
                        <th className="px-2 py-3 whitespace-nowrap">Stock</th>
                        <th className="px-2 py-3 whitespace-nowrap">Tags</th>
                        <th className="px-2 py-3 whitespace-nowrap">Devices</th>
                        <th className="px-2 py-3 whitespace-nowrap">Activation</th>
                        <th className="px-2 py-3 whitespace-nowrap">Additional Info</th>
                        <th className="px-2 py-3 whitespace-nowrap">Packages</th>
                        <th className="px-2 py-3 whitespace-nowrap">FAQs</th>
                        <th className="pl-2 pr-4 py-3 text-right whitespace-nowrap">Actions</th>
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
                        displayedProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 text-slate-700 font-medium text-xs">
                            {/* 1. ID */}
                            {/* <td className="pl-4 pr-2 py-3 font-bold text-slate-800 whitespace-nowrap">{prod.id}</td> */}

                            {/* 2. Item Details (Image & Name) */}
                            <td className="px-2 py-3">
                              <div className="flex items-center space-x-2 shrink-0">
                                {prod.image_url ? (
                                  <img src={prod.image_url} alt={prod.name} className="w-8 h-8 object-cover rounded-lg bg-slate-100 border border-slate-200/50 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 bg-slate-100 border border-slate-200/50 rounded-lg flex items-center justify-center text-[9px] text-slate-400 shrink-0 font-bold">No Img</div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-850 whitespace-normal break-words max-w-[110px]" title={prod.name}>
                                    {prod.name}
                                  </span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {!!prod.is_hot && (
                                      <span className="text-[9px] bg-orange-100 text-orange-600 border border-orange-200 px-1 rounded font-bold">HOT</span>
                                    )}
                                    {!!prod.is_highlighted && (
                                      <span className="text-[9px] bg-amber-100 text-amber-600 border border-amber-200 px-1 rounded font-bold">FEATURED</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 3. Category */}
                            <td className="px-2 py-3 whitespace-nowrap">
                              {prod.category_name ? (
                                <span className="bg-violet-50 text-violet-600 border border-violet-100/60 px-2 py-0.5 rounded-lg text-[10px] font-bold wrap-break-word">{prod.category_name}</span>
                              ) : (
                                <span className="text-slate-450 italic text-[10px]">-</span>
                              )}
                            </td>

                            {/* 4. Description */}
                            <td className="px-2 py-3 max-w-[130px] whitespace-normal break-words line-clamp-2 text-slate-500 text-[11px]" title={prod.description}>
                              {prod.description}
                            </td>

                            {/* 5. Price */}
                            <td className="px-2 py-3 font-bold text-slate-850 whitespace-nowrap">৳{parseFloat(prod.price).toFixed(2)}</td>

                            {/* 6. Stock */}
                            <td className="px-2 py-3 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${prod.stock === 0 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {prod.stock} left
                              </span>
                            </td>

                            {/* 7. Tags */}
                            <td className="px-2 py-3">
                              {prod.tags ? (
                                <div className="flex flex-wrap gap-1 max-w-[100px]">
                                  {prod.tags.split(',').map((tag, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-605 border border-slate-200/50 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">{tag.trim()}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 8. Devices */}
                            <td className="px-2 py-3">
                              {prod.device_options ? (
                                <div className="flex flex-wrap gap-1 max-w-[100px]">
                                  {prod.device_options.split(',').map((device, idx) => (
                                    <span key={idx} className="bg-blue-50 text-blue-600 border border-blue-100/60 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">{device.trim()}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 9. Activation */}
                            <td className="px-2 py-3">
                              <div className="flex flex-col gap-1.5 text-left">
                                {prod.activation_options ? (
                                  <div className="flex flex-wrap gap-1 max-w-[100px]">
                                    {prod.activation_options.split(',').map((opt, idx) => (
                                      <span key={idx} className="bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">{opt.trim()}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-450 italic text-[10px]">-</span>
                                )}
                                <div className="text-[9px]">
                                  <span className={`px-1.5 py-0.5 rounded-md font-extrabold border ${prod.activation_process === 'Automatic'
                                    ? 'bg-blue-50 text-blue-600 border-blue-150'
                                    : 'bg-amber-55 bg-amber-50 text-amber-600 border-amber-150'
                                    }`}>
                                    {prod.activation_process || 'Manual'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 10. Additional Info */}
                            <td className="px-2 py-3 max-w-[110px] whitespace-normal break-words line-clamp-2 text-slate-500 text-[11px]" title={prod.additional_info}>
                              {prod.additional_info || <span className="text-slate-450 italic">-</span>}
                            </td>

                            {/* 11. Packages */}
                            <td className="px-2 py-3">
                              {prod.packages && prod.packages.length > 0 ? (
                                <div className="space-y-1 max-w-[100px] whitespace-normal">
                                  {prod.packages.map((pkg, idx) => (
                                    <div key={idx} className="text-[10px] text-slate-600 flex justify-between gap-1 border-b border-slate-100 pb-0.5">
                                      <span className="text-slate-500 truncate">
                                        {pkg.activation && (
                                          <span className="bg-emerald-55 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded px-1 py-0.5 text-[8px] font-bold mr-1 inline-block">
                                            {pkg.activation}
                                          </span>
                                        )}
                                        {pkg.duration}
                                      </span>
                                      <span className="font-extrabold text-violet-605 whitespace-nowrap">৳{parseFloat(pkg.price).toFixed(0)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 12. FAQs */}
                            <td className="px-2 py-3 whitespace-nowrap">
                              {prod.faqs && prod.faqs.length > 0 ? (
                                <span className="text-[10px] text-slate-650 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-bold cursor-help" title={prod.faqs.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}>
                                  {prod.faqs.length} FAQs
                                </span>
                              ) : (
                                <span className="text-slate-450 italic">-</span>
                              )}
                            </td>

                            {/* 13. Actions */}
                            <td className="flex flex-col gap-3 items-center justify-center py-3">
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

                {/* Pagination Controls */}
                {totalProductPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                    <div className="text-xxs text-slate-500 font-semibold uppercase tracking-wider">
                      Showing <span className="font-extrabold text-slate-750">{(activePage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-extrabold text-slate-750">
                        {Math.min(activePage * itemsPerPage, filteredProducts.length)}
                      </span>{' '}
                      of <span className="font-extrabold text-slate-750">{filteredProducts.length}</span> items
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={activePage === 1}
                        className={`px-3 py-1.5 rounded-lg border text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${activePage === 1
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 hover:text-slate-805'
                          }`}
                      >
                        Prev
                      </button>

                      {getPageNumbers(activePage, totalProductPages).map((page, idx) => {
                        if (page === '...') {
                          return (
                            <span key={idx} className="px-2 text-xxs font-bold text-slate-400">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-lg text-xxs font-extrabold transition-all cursor-pointer select-none flex items-center justify-center ${activePage === page
                              ? 'bg-red text-black border border-black shadow-xs shadow-violet-500/10'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-805'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalProductPages))}
                        disabled={activePage === totalProductPages}
                        className={`px-3 py-1.5 rounded-lg border text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${activePage === totalProductPages
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 hover:text-slate-805'
                          }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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

          {/* DATABASE BACKUP TAB */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in text-left max-w-2xl">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 pt-2">Database Backup Console</h3>

              <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-xs text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-650 mx-auto shadow-xs">
                  <Database className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h4 className="text-base font-extrabold text-slate-900">Download Full Database Backup</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Generate and download a complete SQL schema and data dump of the database.
                    This backup can be used to restore database tables, products, categories, users, and orders in case of data migration or recovery.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={backingUp}
                    className="flex items-center space-x-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-98 mx-auto disabled:opacity-50"
                  >
                    {backingUp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Backup SQL...</span>
                      </>
                    ) : (
                      <span>Download SQL Backup</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LICENSE KEYS TAB */}
          {activeTab === 'licenses' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-left">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">License Keys ({licenses.length})</h3>
                  <input
                    type="text"
                    placeholder="Search license keys..."
                    value={licenseSearchQuery}
                    onChange={(e) => {
                      setLicenseSearchQuery(e.target.value);
                      setLicenseCurrentPage(1);
                    }}
                    className="bg-white border border-slate-250 focus:border-violet-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-slate-700 w-48 shadow-xs normal-case"
                  />
                </div>
                <button
                  onClick={handleOpenLicenseModal}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add License Keys</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse table-auto">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xxs tracking-wider border-b border-slate-200/60">
                      <tr>
                        <th className="pl-4 pr-2 py-3 whitespace-nowrap">ID</th>
                        <th className="px-2 py-3 whitespace-nowrap">Product Name</th>
                        <th className="px-2 py-3 whitespace-nowrap">Activation Option</th>
                        <th className="px-2 py-3 whitespace-nowrap">Package Option</th>
                        <th className="px-2 py-3 whitespace-nowrap">License Key</th>
                        <th className="px-2 py-3 whitespace-nowrap">Status</th>
                        <th className="px-2 py-3 whitespace-nowrap">Created At</th>
                        <th className="pl-2 pr-4 py-3 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLicenses.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                            {licenses.length === 0 ? 'No license keys stored in the database yet.' : 'No matching license keys found.'}
                          </td>
                        </tr>
                      ) : (
                        displayedLicenses.map((lic) => (
                          <tr key={lic.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 text-slate-700 font-medium text-xs">
                            <td className="pl-4 pr-2 py-3 font-bold text-slate-800 whitespace-nowrap">#{lic.id}</td>
                            <td className="px-2 py-3 font-bold text-slate-850 whitespace-normal break-words max-w-[200px]">{lic.product_name}</td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              {lic.activation_option ? (
                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-2 py-0.5 rounded-lg text-[10px] font-bold">{lic.activation_option}</span>
                              ) : (
                                <span className="text-slate-450 italic text-[10px]">-</span>
                              )}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              {lic.package_option ? (
                                <span className="bg-violet-50 text-violet-600 border border-violet-100/60 px-2 py-0.5 rounded-lg text-[10px] font-bold">{lic.package_option}</span>
                              ) : (
                                <span className="text-slate-450 italic text-[10px]">-</span>
                              )}
                            </td>
                            <td className="px-2 py-3 font-mono text-[11px] select-all max-w-[250px] truncate" title={lic.license_key}>{lic.license_key}</td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${lic.is_used ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-100 text-slate-700'}`}>
                                {lic.is_used ? 'Used' : 'Available'}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-slate-400 whitespace-nowrap">{new Date(lic.created_at).toLocaleDateString()}</td>
                            <td className="pl-2 pr-4 py-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleEditLicense(lic)}
                                className="p-2 bg-slate-55 hover:bg-violet-50 hover:text-violet-650 border border-slate-200/40 rounded-lg text-slate-500 transition-colors cursor-pointer mr-2"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLicense(lic.id)}
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

                {/* Pagination Controls */}
                {totalLicensePages > 1 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center select-none">
                    <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">
                      Page {activeLicensePage} of {totalLicensePages} ({filteredLicenses.length} keys total)
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setLicenseCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={activeLicensePage === 1}
                        className={`px-3 py-1.5 rounded-lg border text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${activeLicensePage === 1
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 hover:text-slate-805'
                          }`}
                      >
                        Prev
                      </button>

                      {getPageNumbers(activeLicensePage, totalLicensePages).map((page, idx) => {
                        if (page === '...') {
                          return (
                            <span key={idx} className="px-2.5 py-1.5 text-xxs font-bold text-slate-400 select-none">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => setLicenseCurrentPage(page)}
                            className={`px-3 py-1.5 rounded-lg border text-xxs font-bold transition-all cursor-pointer select-none ${activeLicensePage === page
                              ? 'bg-violet-600 text-white border-transparent'
                              : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setLicenseCurrentPage(prev => Math.min(prev + 1, totalLicensePages))}
                        disabled={activeLicensePage === totalLicensePages}
                        className={`px-3 py-1.5 rounded-lg border text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${activeLicensePage === totalLicensePages
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 hover:text-slate-805'
                          }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* EPS PAYMENT HISTORY TAB */}
          {activeTab === 'eps_history' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-violet-600" />
                    EPS Payment History
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">View transaction details and the license keys provided.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto relative">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xxs font-black text-slate-500 uppercase tracking-wider">
                      <th className="p-4 py-3">Date</th>
                      <th className="p-4 py-3">Transaction IDs</th>
                      <th className="p-4 py-3">User Info</th>
                      <th className="p-4 py-3">Amount & Status</th>
                      <th className="p-4 py-3 max-w-[200px]">Products & Licenses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-sm">
                    {epsHistory.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 align-top">
                          <span className="font-bold text-slate-700 block whitespace-nowrap text-xs">
                            {new Date(row.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {new Date(row.created_at).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="p-4 align-top text-xs">
                          <span className="block font-bold text-slate-600 break-all mb-1">
                            <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Merchant Tx:</span>
                            {row.merchant_transaction_id}
                          </span>
                          {row.eps_transaction_id && (
                            <span className="block font-bold text-slate-500 break-all">
                              <span className="text-[10px] uppercase text-slate-400 block mb-0.5">EPS Tx:</span>
                              {row.eps_transaction_id}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top text-xs">
                          <span className="block font-bold text-slate-800">{row.user_name || 'Guest'}</span>
                          <span className="block text-slate-500">{row.user_email || row.delivery_email || 'N/A'}</span>
                          {row.order_id && (
                            <span className="block mt-1 font-bold text-violet-600 text-[10px]">Order #{row.order_id}</span>
                          )}
                        </td>
                        <td className="p-4 align-top text-xs">
                          <span className="font-black text-blue-600 block text-sm">৳{parseFloat(row.amount).toFixed(2)}</span>
                          <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wide ${row.payment_status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : row.payment_status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {row.payment_status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="p-4 align-top text-xs max-w-[200px] break-all">
                          {row.product_names ? (
                            <div className="space-y-2">
                              <div className="font-bold text-slate-700 mb-1">{row.product_names.replace(/\|\|/g, ', ')}</div>
                              {row.license_keys ? (
                                <div className="font-mono text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                                  {row.license_keys.split('||').map((key, i) => (
                                    <div key={i} className="mb-1 last:mb-0 pb-1 last:pb-0 border-b last:border-0 border-slate-200">{key}</div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-500">No keys assigned</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No products</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {epsHistory.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500">
                          No EPS payment history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-805 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Activation Process</label>
                  <div className="flex items-center space-x-4 py-2 border border-slate-250 bg-slate-50 rounded-lg px-3 h-[38px] text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="activation_process"
                        value="Automatic"
                        checked={productForm.activation_process === 'Automatic'}
                        onChange={(e) => setProductForm({ ...productForm, activation_process: e.target.value })}
                        className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer"
                      />
                      <span>Automatic</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="activation_process"
                        value="Manual"
                        checked={productForm.activation_process === 'Manual'}
                        onChange={(e) => setProductForm({ ...productForm, activation_process: e.target.value })}
                        className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer"
                      />
                      <span>Manual</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Category (Optional)</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-805 cursor-pointer"
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
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-805 placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Discount (%) (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={productForm.discount_percent}
                    onChange={(e) => setProductForm({ ...productForm, discount_percent: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-805 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Stock Count *</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="50"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-850 placeholder-slate-400"
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
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-850 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Device Options (comma-separated)</label>
                  <input
                    type="text"
                    value={productForm.device_options}
                    onChange={(e) => setProductForm({ ...productForm, device_options: e.target.value })}
                    placeholder="e.g. Phone, PC/MAC, Phone + PC"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-850 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Activation Options (comma-separated)</label>
                  <input
                    type="text"
                    value={productForm.activation_options}
                    onChange={(e) => setProductForm({ ...productForm, activation_options: e.target.value })}
                    placeholder="e.g. Readymade ID, Personal Email"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-850 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
                <span className="block text-xxs font-bold text-slate-500 uppercase tracking-wider">Product Badges / Special Labels</span>
                <div className="flex flex-wrap gap-6 text-xs text-slate-700 font-semibold">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={productForm.is_hot}
                      onChange={(e) => setProductForm({ ...productForm, is_hot: e.target.checked })}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer"
                    />
                    <span>🔥 Hot Selling</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={productForm.is_highlighted}
                      onChange={(e) => setProductForm({ ...productForm, is_highlighted: e.target.checked })}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer"
                    />
                    <span>⭐ Highlighted Product</span>
                  </label>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Description *</label>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={productForm.description || ''}
                      onChange={(content) => setProductForm({ ...productForm, description: content })}
                      placeholder=""
                      className="text-xs text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-550 uppercase tracking-wider mb-1">Additional Information Box</label>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={productForm.additional_info || ''}
                      onChange={(content) => setProductForm({ ...productForm, additional_info: content })}
                      placeholder=""
                      className="text-xs text-slate-800"
                    />
                  </div>
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
                        const updatedPkgs = [...productForm.packages, { activation: '', duration: '', price: '' }];
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
                      {productForm.packages.map((pkg, idx) => {
                        const activationOpts = productForm.activation_options
                          ? productForm.activation_options.split(',').map(o => o.trim()).filter(Boolean)
                          : [];
                        return (
                          <div key={idx} className="flex items-center space-x-2">
                            {activationOpts.length > 0 ? (
                              <select
                                value={pkg.activation || ''}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].activation = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                className="w-32 text-xs bg-white border border-slate-250 focus:border-violet-500 focus:outline-none rounded-lg px-2 py-1.5 text-slate-855 cursor-pointer shrink-0"
                                required
                              >
                                <option value="">Activation...</option>
                                {activationOpts.map((opt, oIdx) => (
                                  <option key={oIdx} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={pkg.activation || ''}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].activation = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                placeholder="Activation..."
                                className="w-32 text-xs bg-white border border-slate-250 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-855 shrink-0"
                              />
                            )}
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
                              className="p-1.5 bg-red-55 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white border border-red-200 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
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
      {/* LICENSE CREATE MODAL */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={() => setShowLicenseModal(false)} />

          <div className="relative bg-white border border-slate-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl z-10 animate-slide-up text-left">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-base font-bold text-slate-850">{editingLicense ? 'Edit License Key' : 'Add License Keys'}</h4>
              <button onClick={() => setShowLicenseModal(false)} className="text-slate-400 hover:text-slate-650"><X className="w-5 h-5 cursor-pointer" /></button>
            </div>

            <form onSubmit={handleLicenseSubmit} className="p-5 space-y-4">
              {licenseFormError && (
                <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {licenseFormError}
                </div>
              )}

              {/* Product Selection Combobox */}
              <div className="relative">
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">Product *</label>
                
                <div 
                  className="w-full text-xs bg-slate-50 border border-slate-250 focus-within:border-violet-500 focus-within:bg-white rounded-lg px-3 py-2 text-slate-800 cursor-text flex items-center justify-between"
                  onClick={() => setShowProductDropdown(true)}
                >
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none w-full"
                    placeholder="Search a Product..."
                    value={showProductDropdown ? licenseProductSearch : (products.find(p => p.id === parseInt(licenseForm.product_id))?.name || '')}
                    onChange={(e) => {
                      setLicenseProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                  />
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {showProductDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProductDropdown(false)}></div>
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                      {products
                        .filter(prod => prod.name.toLowerCase().includes(licenseProductSearch.toLowerCase()))
                        .map((prod) => (
                          <div
                            key={prod.id}
                            className={`px-3 py-2 text-xs cursor-pointer hover:bg-violet-50 ${licenseForm.product_id == prod.id ? 'bg-violet-100 text-violet-700 font-bold' : 'text-slate-700'}`}
                            onClick={() => {
                              setLicenseForm({
                                ...licenseForm,
                                product_id: prod.id,
                                activation_option: '',
                                package_option: ''
                              });
                              setLicenseProductSearch('');
                              setShowProductDropdown(false);
                            }}
                          >
                            {prod.name}
                          </div>
                      ))}
                      {products.filter(prod => prod.name.toLowerCase().includes(licenseProductSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-500 text-center italic">No products found.</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Dynamic Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Activation Option Selection */}
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">Activation Option</label>
                  {(() => {
                    const selectedProduct = products.find(p => p.id === parseInt(licenseForm.product_id));
                    const activationOptions = selectedProduct?.activation_options
                      ? selectedProduct.activation_options.split(',').map(opt => opt.trim()).filter(Boolean)
                      : [];

                    return (
                      <select
                        value={licenseForm.activation_option}
                        onChange={(e) => setLicenseForm({ ...licenseForm, activation_option: e.target.value })}
                        disabled={!licenseForm.product_id || activationOptions.length === 0}
                        className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{activationOptions.length === 0 ? 'No Activation Options' : 'Select Activation Option...'}</option>
                        {activationOptions.map((opt, idx) => (
                          <option key={idx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                {/* Package Option Selection */}
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">Package Option</label>
                  {(() => {
                    const selectedProduct = products.find(p => p.id === parseInt(licenseForm.product_id));
                    const packages = selectedProduct?.packages || [];

                    return (
                      <select
                        value={licenseForm.package_option}
                        onChange={(e) => setLicenseForm({ ...licenseForm, package_option: e.target.value })}
                        disabled={!licenseForm.product_id || packages.length === 0}
                        className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{packages.length === 0 ? 'No Package Options' : 'Select Package Option...'}</option>
                        {packages.map((pkg, idx) => (
                          <option key={idx} value={pkg.duration}>{pkg.duration} (৳{pkg.price})</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>

              {/* License Key input */}
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {editingLicense ? 'License Key *' : 'License Keys (One per line for bulk) *'}
                </label>
                <textarea
                  rows={editingLicense ? "2" : "5"}
                  value={licenseForm.license_key}
                  onChange={(e) => setLicenseForm({ ...licenseForm, license_key: e.target.value })}
                  placeholder={editingLicense ? "Key-XXXX" : "Paste keys here\nKey-1-XXXX\nKey-2-XXXX"}
                  className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 font-mono"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLicenseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-550 hover:bg-slate-50 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={licenseFormSubmitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  {licenseFormSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{editingLicense ? 'Update Key' : 'Save Keys'}</span>
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
