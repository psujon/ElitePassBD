import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../utils/api';
import {
  Users,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  Plus,
  Filter,
  MessageSquare,
  Globe,
  Facebook,
  User,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  Edit2,
  Trash2,
  Settings,
  Bell,
  Check,
  Send,
  History,
  Shield,
  Smartphone,
  Mail,
  MoreVertical,
  ArrowUpRight,
  Info
} from 'lucide-react';

const getDurationDays = (durationStr) => {
  if (!durationStr || typeof durationStr !== 'string') return 30;
  const lower = durationStr.toLowerCase().trim();
  if (lower.includes('lifetime') || lower.includes('lifetim')) return 3650;
  const matchMonth = lower.match(/(\d+)\s*(month|m)/);
  if (matchMonth) {
    const m = parseInt(matchMonth[1], 10);
    if (m === 1) return 30;
    if (m === 3) return 90;
    if (m === 6) return 180;
    if (m === 12) return 365;
    if (m === 18) return 540;
    if (m === 24) return 730;
    if (m === 36) return 1095;
    return m * 30;
  }
  const matchYear = lower.match(/(\d+)\s*(year|yr|y)/);
  if (matchYear) {
    const y = parseInt(matchYear[1], 10);
    return y * 365;
  }
  const matchDay = lower.match(/(\d+)\s*(day|d)/);
  if (matchDay) {
    return parseInt(matchDay[1], 10);
  }
  return 30;
};

export default function SubscriptionManager() {
  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // 'dashboard', 'subscriptions', 'customers', 'renewals', 'reminder_history', 'settings'
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    expiringToday: 0,
    within3Days: 0,
    within7Days: 0,
    expired: 0,
    renewed: 0,
    totalCustomers: 0,
    totalSubscriptions: 0
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('All Products');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [expiryFilter, setExpiryFilter] = useState('All Dates');
  const [sourceFilter, setSourceFilter] = useState('All Sources');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null); // null = Add, object = Edit
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubDetail, setSelectedSubDetail] = useState(null);

  // Forms state
  const [subForm, setSubForm] = useState({
    customer_name: '',
    whatsapp_number: '',
    email: '',
    product_name: '',
    custom_product_name: '',
    package_plan: 'Monthly',
    customer_source: 'Manual',
    purchase_date: new Date().toISOString().slice(0, 10),
    validity_days: 30,
    expiry_date: '',
    account_given: '',
    selling_price: '0',
    payment_status: 'Paid',
    notes: ''
  });
  const [subFormSubmitting, setSubFormSubmitting] = useState(false);

  // Renewal form state
  const [renewForm, setRenewForm] = useState({
    renewal_date: new Date().toISOString().slice(0, 10),
    validity_days: 30,
    package_plan: '',
    new_expiry_date: '',
    payment_amount: '',
    notes: 'Subscription renewed'
  });
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  // Settings form state
  const [settings, setSettings] = useState({
    reminder_3_days_before: 'true',
    reminder_1_day_before: 'true',
    reminder_expiry_day: 'true',
    channel_whatsapp_enabled: 'true',
    channel_email_enabled: 'true',
    whatsapp_cloud_api_token: '',
    whatsapp_phone_number_id: '',
    whatsapp_template: `Hello {customer_name}, your {product_name} subscription expires on {expiry_date}. Please complete renewal payment to continue. Thank you, ElitePassBD.`,
    email_subject_template: `Your {product_name} Subscription is Expiring`,
    email_body_template: `Hello {customer_name},\n\nYour {product_name} subscription ({package_plan}) is set to expire on {expiry_date}.\n\nTo keep your access uninterrupted, please complete your renewal payment.\n\nThank you,\nElitePassBD`,
    admin_alert_dashboard: 'true',
    admin_alert_email: 'true',
    admin_alert_whatsapp: 'true',
    admin_email: 'admin@elitepassbd.com',
    admin_whatsapp: ''
  });
  const [settingsActiveTab, setSettingsActiveTab] = useState('whatsapp'); // 'whatsapp', 'email'
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);

  // Action Menu dropdown state (rendered via portal with fixed coords to prevent table overflow clipping)
  const [activeMenuSub, setActiveMenuSub] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUp: false });

  const toggleActionMenu = (e, sub) => {
    e.stopPropagation();
    if (activeMenuSub?.id === sub.id) {
      setActiveMenuSub(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 170;
    setMenuPosition({
      top: openUp ? Math.max(10, rect.top - 124) : (rect.bottom + 4),
      left: Math.max(10, rect.right - 144),
      openUp
    });
    setActiveMenuSub(sub);
  };

  useEffect(() => {
    if (!activeMenuSub) return;
    const handleClose = () => setActiveMenuSub(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [activeMenuSub]);

  // Catalog products from products table & search dropdown state
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const combinedProducts = React.useMemo(() => {
    const productMap = new Map();

    catalogProducts.forEach(p => {
      const pName = p.name || p.title;
      if (pName) {
        const priceVal = p.price || p.sale_price || '';
        productMap.set(pName.toLowerCase(), { name: pName, price: priceVal, isCatalog: true, id: p.id });
      }
    });

    subscriptions.forEach(s => {
      if (s.product_name && !productMap.has(s.product_name.toLowerCase())) {
        productMap.set(s.product_name.toLowerCase(), { name: s.product_name, price: s.selling_price || '', isCatalog: false });
      }
    });

    return Array.from(productMap.values());
  }, [catalogProducts, subscriptions]);

  const selectedProductPackages = React.useMemo(() => {
    if (!subForm.product_name) return [];
    const found = catalogProducts.find(p => p.name === subForm.product_name);
    if (!found || !found.packages) return [];
    try {
      return Array.isArray(found.packages)
        ? found.packages
        : (typeof found.packages === 'string' ? JSON.parse(found.packages) : []);
    } catch (e) {
      return [];
    }
  }, [subForm.product_name, catalogProducts]);

  // Calculate Expiry Date automatically based on Purchase Date + Validity Days
  useEffect(() => {
    if (subForm.purchase_date && subForm.validity_days) {
      const pDate = new Date(subForm.purchase_date);
      if (!isNaN(pDate.getTime())) {
        const eDate = new Date(pDate);
        eDate.setDate(eDate.getDate() + parseInt(subForm.validity_days || 30));
        setSubForm(prev => ({ ...prev, expiry_date: eDate.toISOString().slice(0, 10) }));
      }
    }
  }, [subForm.purchase_date, subForm.validity_days]);

  // Calculate Renewal Expiry Date automatically
  useEffect(() => {
    if (renewForm.renewal_date && renewForm.validity_days) {
      const rDate = new Date(renewForm.renewal_date);
      if (!isNaN(rDate.getTime())) {
        const eDate = new Date(rDate);
        eDate.setDate(eDate.getDate() + parseInt(renewForm.validity_days || 30));
        setRenewForm(prev => ({ ...prev, new_expiry_date: eDate.toISOString().slice(0, 10) }));
      }
    }
  }, [renewForm.renewal_date, renewForm.validity_days]);

  const fetchCatalogProducts = async () => {
    try {
      const res = await api.get('/products');
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      // Sort alphabetically by name
      const sorted = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCatalogProducts(sorted);
    } catch (err) {
      console.error('Failed to fetch catalog products:', err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (productFilter && productFilter !== 'All Products') params.product = productFilter;
      if (statusFilter && statusFilter !== 'All Status') params.status = statusFilter;
      if (sourceFilter && sourceFilter !== 'All Sources') params.source = sourceFilter;
      if (expiryFilter && expiryFilter !== 'All Dates') params.expiryFilter = expiryFilter;

      const res = await api.get('/subscriptions', { params });
      const data = res?.subscriptions !== undefined ? res : (res?.data || {});
      setSubscriptions(data.subscriptions || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      toast.error('Failed to load subscriptions data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/subscriptions/settings');
      const data = (res && typeof res === 'object' && !res.data) ? res : (res?.data || {});
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to fetch subscription settings:', err);
    }
  };

  // Fetch initial catalog products & settings on mount
  useEffect(() => {
    fetchCatalogProducts();
    fetchSettings();
  }, []);

  // Fetch subscriptions whenever search/filter parameters change
  useEffect(() => {
    fetchSubscriptions();
  }, [searchQuery, productFilter, statusFilter, sourceFilter, expiryFilter]);

  const handleOpenAddModal = () => {
    setEditingSub(null);
    const defaultProduct = catalogProducts.length > 0 ? (catalogProducts[0].name || '') : '';
    let defaultPrice = '0';
    let defaultPackagePlan = 'Monthly';
    let defaultValidity = 30;

    if (catalogProducts.length > 0) {
      const prod0 = catalogProducts[0];
      let pkgs = [];
      try {
        pkgs = Array.isArray(prod0.packages)
          ? prod0.packages
          : (typeof prod0.packages === 'string' ? JSON.parse(prod0.packages) : []);
      } catch (e) {
        pkgs = [];
      }
      if (pkgs.length > 0) {
        const pkg0 = pkgs[0];
        defaultPackagePlan = pkg0.duration
          ? `${pkg0.duration.trim()}${pkg0.activation ? ` - ${pkg0.activation.trim()}` : ''}`
          : (pkg0.name || 'Monthly');
        defaultPrice = pkg0.price ? String(pkg0.price) : (prod0.price ? String(prod0.price) : '0');
        const days = getDurationDays(pkg0.duration);
        if (days) defaultValidity = days;
      } else {
        defaultPrice = prod0.price ? String(prod0.price) : '0';
      }
    }

    setSubForm({
      customer_name: '',
      whatsapp_number: '',
      email: '',
      product_name: defaultProduct,
      custom_product_name: '',
      package_plan: defaultPackagePlan,
      customer_source: 'Manual',
      purchase_date: new Date().toISOString().slice(0, 10),
      validity_days: defaultValidity,
      expiry_date: '',
      account_given: '',
      selling_price: defaultPrice,
      payment_status: 'Paid',
      notes: ''
    });
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    const subProd = sub.product_name || '';
    setSubForm({
      customer_name: sub.customer_name || '',
      whatsapp_number: sub.whatsapp_number || '',
      email: sub.email || '',
      product_name: subProd,
      custom_product_name: '',
      package_plan: sub.package_plan || 'Monthly',
      customer_source: sub.customer_source || 'Manual',
      purchase_date: sub.purchase_date ? new Date(sub.purchase_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      validity_days: sub.validity_days || 30,
      expiry_date: sub.expiry_date ? new Date(sub.expiry_date).toISOString().slice(0, 10) : '',
      account_given: sub.account_given || '',
      selling_price: sub.selling_price || '',
      payment_status: sub.payment_status || 'Paid',
      notes: sub.notes || ''
    });
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setShowAddModal(true);
    setActiveMenuId(null);
  };

  const handleSaveCustomerSub = async (e) => {
    e.preventDefault();
    if (!subForm.customer_name || !subForm.whatsapp_number) {
      toast.error('Customer Name and WhatsApp Number are required.');
      return;
    }

    const targetProductName = (subForm.product_name || '').trim();
    if (!targetProductName) {
      toast.error('Please select a product from the list or enter a product name.');
      return;
    }

    try {
      setSubFormSubmitting(true);
      const payload = {
        ...subForm,
        product_name: targetProductName
      };

      if (editingSub) {
        await api.put(`/subscriptions/${editingSub.id}`, payload);
        toast.success('Subscription updated successfully!');
      } else {
        await api.post('/subscriptions', payload);
        toast.success('Customer subscription added successfully!');
      }

      setShowAddModal(false);
      fetchSubscriptions();
    } catch (err) {
      console.error('Error saving subscription:', err);
      toast.error(err.message || err.response?.data?.message || 'Failed to save subscription.');
    } finally {
      setSubFormSubmitting(false);
    }
  };

  const handleOpenDetailModal = async (sub) => {
    try {
      const res = await api.get(`/subscriptions/${sub.id}`);
      const data = (res && typeof res === 'object' && !res.data) ? res : (res?.data || {});
      setSelectedSubDetail(data);

      const targetProdName = data.product_name || sub.product_name;
      const foundProduct = catalogProducts.find(p => p.name === targetProdName);
      let pkgs = [];
      if (foundProduct?.packages) {
        try {
          pkgs = Array.isArray(foundProduct.packages) ? foundProduct.packages : JSON.parse(foundProduct.packages);
        } catch (e) {
          pkgs = [];
        }
      }

      let initPackagePlan = data.package_plan || sub.package_plan || '';
      let initAmount = data.selling_price || sub.selling_price || '0';
      let initDays = data.validity_days || sub.validity_days || 30;

      if (pkgs.length > 0) {
        const matched = pkgs.find(pkg => {
          const pkgLabel = pkg.duration
            ? `${pkg.duration.trim()}${pkg.activation ? ` - ${pkg.activation.trim()}` : ''}`
            : (pkg.name || '');
          return pkgLabel === initPackagePlan || pkg.duration?.trim() === initPackagePlan;
        }) || pkgs[0];

        initPackagePlan = matched.duration
          ? `${matched.duration.trim()}${matched.activation ? ` - ${matched.activation.trim()}` : ''}`
          : (matched.name || 'Monthly');
        if (matched.price) initAmount = String(matched.price);
        const days = getDurationDays(matched.duration);
        if (days) initDays = days;
      }

      setRenewForm({
        renewal_date: new Date().toISOString().slice(0, 10),
        validity_days: initDays,
        package_plan: initPackagePlan,
        new_expiry_date: '',
        payment_amount: initAmount,
        notes: 'Subscription renewed'
      });
      setShowDetailModal(true);
      setActiveMenuId(null);
    } catch (err) {
      toast.error('Failed to load customer subscription details.');
    }
  };

  const handleConfirmRenewal = async (e) => {
    e.preventDefault();
    if (!selectedSubDetail) return;

    try {
      setRenewSubmitting(true);
      await api.post(`/subscriptions/${selectedSubDetail.id}/renew`, renewForm);
      toast.success(`Subscription renewed successfully!`);

      // Refresh detail & list
      const res = await api.get(`/subscriptions/${selectedSubDetail.id}`);
      const data = (res && typeof res === 'object' && !res.data) ? res : (res?.data || {});
      setSelectedSubDetail(data);
      fetchSubscriptions();
    } catch (err) {
      console.error('Renewal error:', err);
      toast.error(err.response?.data?.message || 'Failed to renew subscription.');
    } finally {
      setRenewSubmitting(false);
    }
  };

  const handleDeleteSubscription = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the subscription for "${name}"?`)) return;

    try {
      await api.delete(`/subscriptions/${id}`);
      toast.success('Subscription deleted.');
      if (showDetailModal && selectedSubDetail?.id === id) {
        setShowDetailModal(false);
      }
      fetchSubscriptions();
    } catch (err) {
      toast.error('Failed to delete subscription.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsSubmitting(true);
      await api.put('/subscriptions/settings', settings);
      toast.success('Subscription settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const formatSourceBadge = (source) => {
    switch (source) {
      case 'Website':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Globe size={12} /> Website</span>;
      case 'WhatsApp':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><MessageSquare size={12} /> WhatsApp</span>;
      case 'Facebook':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><Facebook size={12} /> Facebook</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><User size={12} /> Manual</span>;
    }
  };

  const formatStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active</span>;
      case 'Expiring Soon':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Expiring Soon</span>;
      case 'Expired':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Expired</span>;
      case 'Renewed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Renewed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Cancelled</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-900 font-sans">

      {/* Top Header & Concept Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <RefreshCw className="text-emerald-600 animate-spin-slow" size={26} />
              Subscription Manager
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
              Admin UI
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Manage customers, subscriptions, and automatic renewal reminders in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setExpiryFilter('today');
              setActiveSubTab('subscriptions');
            }}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            title="Expiring Today Notifications"
          >
            <Bell size={20} />
            {stats.expiringToday > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {stats.expiringToday}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Alert Banners matching UI mockup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner 1: Expiry Warning */}
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 border border-rose-200 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 tracking-wide">
                {stats.expiringToday} subscriptions expire today
              </p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Follow up with customers to ensure uninterrupted service.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setExpiryFilter('today');
              setActiveSubTab('subscriptions');
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 underline whitespace-nowrap flex items-center gap-1 transition-colors"
          >
            View customers <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Banner 2: Website Auto-entry Status */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 border border-emerald-200 shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 tracking-wide">
                Website orders: Auto-entry enabled
              </p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Successful orders automatically create customer subscription records.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('settings')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all whitespace-nowrap"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs matching UI concept */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Clock },
          { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw, badge: stats.totalSubscriptions },
          { id: 'add_customer', label: 'Add Subscription', icon: Plus },
          { id: 'renewals', label: 'Renewals', icon: History, badge: stats.renewed },
          { id: 'reminder_history', label: 'Reminder History', icon: Send },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'add_customer') {
                  handleOpenAddModal();
                } else {
                  setActiveSubTab(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl transition-all whitespace-nowrap ${isActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 7 Dashboard Stat Cards Grid matching concept mockup */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Card 1: Active Subscriptions */}
        <div
          onClick={() => { setStatusFilter('Active'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.active}</div>
        </div>

        {/* Card 2: Expiring Today */}
        <div
          onClick={() => { setExpiryFilter('today'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-rose-50/50 p-4 rounded-xl border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold">Expiring Today</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{String(stats.expiringToday).padStart(2, '0')}</div>
        </div>

        {/* Card 3: Within 3 Days */}
        <div
          onClick={() => { setExpiryFilter('3days'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-amber-50/50 p-4 rounded-xl border border-amber-200 hover:border-amber-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold">Within 3 Days</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.within3Days}</div>
        </div>

        {/* Card 4: Within 7 Days */}
        <div
          onClick={() => { setExpiryFilter('7days'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-yellow-500/40 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Within 7 Days</span>
            <div className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.within7Days}</div>
        </div>

        {/* Card 5: Expired */}
        <div
          onClick={() => { setStatusFilter('Expired'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-rose-50/50 p-4 rounded-xl border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold">Expired</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <X size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.expired}</div>
        </div>

        {/* Card 6: Renewed */}
        <div
          onClick={() => { setStatusFilter('Renewed'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-teal-50/50 p-4 rounded-xl border border-slate-200 hover:border-teal-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Renewed</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
              <RefreshCw size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-700">{stats.renewed}</div>
        </div>

        {/* Card 7: Total Customers */}
        <div
          onClick={() => { setStatusFilter('All Status'); setExpiryFilter('All Dates'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Customers</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalCustomers}</div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT SWITCHER */}
      {activeSubTab === 'settings' ? (
        /* REMINDER SETTINGS PANEL matching UI mockup */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="text-emerald-600" size={22} />
                Reminder Settings
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configure automatic renewal reminders and messaging channels.</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all"
            >
              <Check size={18} />
              {settingsSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Column: Reminder Timing & Channels */}
            <div className="space-y-6">

              {/* 1. Reminder Timing */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Reminder Timing (send before expiry)</h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reminder_3_days_before === 'true'}
                      onChange={(e) => setSettings({ ...settings, reminder_3_days_before: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    3 days before
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reminder_1_day_before === 'true'}
                      onChange={(e) => setSettings({ ...settings, reminder_1_day_before: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    1 day before
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reminder_expiry_day === 'true'}
                      onChange={(e) => setSettings({ ...settings, reminder_expiry_day: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    Expiry day
                  </label>
                </div>
              </div>

              {/* 2. Reminder Channels & WhatsApp Integration */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Reminder Channels</h3>
                <div className="flex items-center justify-between text-sm text-slate-700 py-1">
                  <span>Customer WhatsApp</span>
                  <input
                    type="checkbox"
                    checked={settings.channel_whatsapp_enabled === 'true'}
                    onChange={(e) => setSettings({ ...settings, channel_whatsapp_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-slate-700 py-1 border-t border-slate-200 pt-2">
                  <span>Customer Email</span>
                  <input
                    type="checkbox"
                    checked={settings.channel_email_enabled === 'true'}
                    onChange={(e) => setSettings({ ...settings, channel_email_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                </div>

                {/* WhatsApp Cloud API Integration Setup Box */}
                <div className="mt-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900">WhatsApp Integration</h4>
                        <p className="text-[11px] text-emerald-700">Cloud API • Setup optional</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">WhatsApp Cloud API Token</label>
                      <input
                        type="password"
                        placeholder="EAAG..."
                        value={settings.whatsapp_cloud_api_token || ''}
                        onChange={(e) => setSettings({ ...settings, whatsapp_cloud_api_token: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Phone Number ID</label>
                      <input
                        type="text"
                        placeholder="10987654321..."
                        value={settings.whatsapp_phone_number_id || ''}
                        onChange={(e) => setSettings({ ...settings, whatsapp_phone_number_id: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Admin Expiry Alerts */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Admin Alerts (when subscription expires)</h3>
                <div className="flex items-center gap-4 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.admin_alert_dashboard === 'true'}
                      onChange={(e) => setSettings({ ...settings, admin_alert_dashboard: e.target.checked ? 'true' : 'false' })}
                      className="rounded accent-emerald-600"
                    />
                    Dashboard
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.admin_alert_email === 'true'}
                      onChange={(e) => setSettings({ ...settings, admin_alert_email: e.target.checked ? 'true' : 'false' })}
                      className="rounded accent-emerald-600"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.admin_alert_whatsapp === 'true'}
                      onChange={(e) => setSettings({ ...settings, admin_alert_whatsapp: e.target.checked ? 'true' : 'false' })}
                      className="rounded accent-emerald-600"
                    />
                    WhatsApp
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Admin Email</label>
                    <input
                      type="email"
                      value={settings.admin_email || ''}
                      onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Admin WhatsApp</label>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={settings.admin_whatsapp || ''}
                      onChange={(e) => setSettings({ ...settings, admin_whatsapp: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Message Templates (WhatsApp & Email) */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Message Templates</h3>
                  <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 text-xs">
                    <button
                      onClick={() => setSettingsActiveTab('whatsapp')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors ${settingsActiveTab === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      WhatsApp Template
                    </button>
                    <button
                      onClick={() => setSettingsActiveTab('email')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors ${settingsActiveTab === 'email' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Email Template
                    </button>
                  </div>
                </div>

                {/* Available Variables Guide */}
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-700">Available Variables:</span>{' '}
                  <code className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">{'{customer_name}'}</code>,{' '}
                  <code className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">{'{product_name}'}</code>,{' '}
                  <code className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">{'{expiry_date}'}</code>,{' '}
                  <code className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">{'{package_plan}'}</code>
                </div>

                {settingsActiveTab === 'whatsapp' ? (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700">Message Template (WhatsApp)</label>
                    <textarea
                      rows={6}
                      value={settings.whatsapp_template || ''}
                      onChange={(e) => setSettings({ ...settings, whatsapp_template: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Email Subject</label>
                      <input
                        type="text"
                        value={settings.email_subject_template || ''}
                        onChange={(e) => setSettings({ ...settings, email_subject_template: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Email Body Text</label>
                      <textarea
                        rows={6}
                        value={settings.email_body_template || ''}
                        onChange={(e) => setSettings({ ...settings, email_body_template: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 leading-relaxed mt-1"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      ) : (
        /* SUBSCRIPTIONS TABLE & SEARCH TOOLBAR matching UI concept */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Filter & Search Bar matching concept mockup */}
          <div className="p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50/70">

            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search name, mobile or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Product Select Filter */}
            <div>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Products">Product: All Products</option>
                {combinedProducts.map((p, i) => (
                  <option key={i} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Status">Status: All Status</option>
                <option value="Active">Active</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
                <option value="Renewed">Renewed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Expiry Date Select */}
            <div>
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="All Dates">Expiry: All Dates</option>
                <option value="today">Expiring Today</option>
                <option value="3days">Within 3 Days</option>
                <option value="7days">Within 7 Days</option>
                <option value="expired">Expired</option>
              </select>
            </div>

          </div>

          {/* Table Content */}
          <div className="overflow-x-auto min-h-[220px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Product & Plan</th>
                  <th className="py-3.5 px-4">Expiry</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <RefreshCw className="animate-spin inline-block mr-2 text-emerald-600" size={18} />
                      Loading customer subscriptions...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No customer subscriptions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const formattedExpiry = sub.expiry_date ? new Date(sub.expiry_date).toISOString().slice(0, 10) : '-';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors group">

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                              {sub.customer_name ? sub.customer_name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                {sub.customer_name}
                              </p>
                              <p className="text-[11px] text-slate-500">{sub.whatsapp_number}</p>
                              {sub.email && <p className="text-[10px] text-slate-400">{sub.email}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Product & Plan */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{sub.product_name}</span>
                          <span className="text-slate-500"> • {sub.package_plan}</span>
                        </td>

                        {/* Expiry */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {formattedExpiry}
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4">
                          {formatSourceBadge(sub.customer_source)}
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${sub.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            {sub.payment_status}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {formatStatusBadge(sub.status)}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right relative">
                          <div className="flex items-center justify-end gap-2">

                            {/* Direct WhatsApp Chat 1-Click Link Button */}
                            {sub.direct_whatsapp_url && (
                              <a
                                href={sub.direct_whatsapp_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                title="Open Direct WhatsApp Chat with Reminder Text"
                              >
                                <MessageSquare size={15} />
                              </a>
                            )}

                            {/* Renew / View Button */}
                            {sub.status === 'Expiring Soon' || sub.status === 'Expired' ? (
                              <button
                                onClick={() => handleOpenDetailModal(sub)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all shadow-xs"
                              >
                                Renew
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenDetailModal(sub)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
                              >
                                Renew
                              </button>
                            )}

                            {/* More Actions Dropdown Toggle */}
                            <button
                              onClick={(e) => toggleActionMenu(e, sub)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                activeMenuSub?.id === sub.id
                                  ? 'bg-slate-200 text-slate-900'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="More actions"
                            >
                              <MoreVertical size={16} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Legend */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Expiring Soon</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Expired</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Renewed</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Cancelled</span>
            </div>
            <div>
              Showing {subscriptions.length} customer subscription entries
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: ADD / EDIT CUSTOMER SUBSCRIPTION */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl my-auto text-left overflow-hidden text-slate-900">

            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingSub ? 'Edit Customer Subscription' : 'Add Customer / Subscription'}
                </h3>
                <p className="text-xs text-slate-500">Create a new customer and subscription record.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerSub} className="space-y-4 overflow-y-auto pr-1 mt-4 max-h-[calc(90vh-110px)] custom-scrollbar">

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim Ahmed"
                    value={subForm.customer_name}
                    onChange={(e) => setSubForm({ ...subForm, customer_name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* WhatsApp / Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 019XX XXX101"
                    value={subForm.whatsapp_number}
                    onChange={(e) => setSubForm({ ...subForm, whatsapp_number: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={subForm.email}
                    onChange={(e) => setSubForm({ ...subForm, email: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Customer Source */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Source *</label>
                  <select
                    value={subForm.customer_source}
                    onChange={(e) => setSubForm({ ...subForm, customer_source: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                {/* Product / Service (Search a Product matching image) */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PRODUCT *
                  </label>

                  <div
                    className="w-full text-xs bg-white border border-violet-500 rounded-lg px-3 py-2 text-slate-900 cursor-text flex items-center justify-between shadow-xs"
                    onClick={() => setShowProductDropdown(true)}
                  >
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none w-full text-slate-900 placeholder-slate-400 text-xs font-medium"
                      placeholder="Search a Product..."
                      value={showProductDropdown ? productSearchQuery : (subForm.product_name || '')}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>

                  {showProductDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowProductDropdown(false)}></div>
                      <div className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                        {catalogProducts
                          .filter(prod => (prod.name || '').toLowerCase().includes(productSearchQuery.toLowerCase()))
                          .map((prod) => (
                            <div
                              key={prod.id}
                              className={`px-3 py-2 text-xs cursor-pointer hover:bg-violet-50 transition-colors ${subForm.product_name === prod.name ? 'bg-violet-100 text-violet-700 font-bold' : 'text-slate-700'
                                }`}
                              onClick={() => {
                                const currentProd = prod;
                                let pkgs = [];
                                try {
                                  pkgs = Array.isArray(currentProd.packages)
                                    ? currentProd.packages
                                    : (typeof currentProd.packages === 'string' ? JSON.parse(currentProd.packages || '[]') : []);
                                } catch (e) {
                                  pkgs = [];
                                }

                                let newPackagePlan = 'Monthly';
                                let newPrice = currentProd.price ? String(currentProd.price) : subForm.selling_price;
                                let newValidity = subForm.validity_days;

                                if (pkgs.length > 0) {
                                  const firstPkg = pkgs[0];
                                  newPackagePlan = firstPkg.duration
                                    ? `${firstPkg.duration.trim()}${firstPkg.activation ? ` - ${firstPkg.activation.trim()}` : ''}`
                                    : (firstPkg.name || 'Monthly');
                                  if (firstPkg.price) {
                                    newPrice = String(firstPkg.price);
                                  }
                                  const days = getDurationDays(firstPkg.duration);
                                  if (days) newValidity = days;
                                }

                                setSubForm(prev => ({
                                  ...prev,
                                  product_name: currentProd.name,
                                  package_plan: newPackagePlan,
                                  selling_price: newPrice,
                                  validity_days: newValidity
                                }));
                                setProductSearchQuery('');
                                setShowProductDropdown(false);
                              }}
                            >
                              {prod.name}
                            </div>
                          ))}
                        {catalogProducts.filter(prod => (prod.name || '').toLowerCase().includes(productSearchQuery.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-xs text-slate-500 text-center italic">No products found.</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Package / Plan */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Package / Plan *</label>
                    {selectedProductPackages.length > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {selectedProductPackages.length} package options
                      </span>
                    )}
                  </div>
                  <select
                    value={subForm.package_plan}
                    onChange={(e) => {
                      const chosenVal = e.target.value;
                      const matchedPkg = selectedProductPackages.find(pkg => {
                        const pkgLabel = pkg.duration
                          ? `${pkg.duration.trim()}${pkg.activation ? ` - ${pkg.activation.trim()}` : ''}`
                          : (pkg.name || '');
                        return pkgLabel === chosenVal || pkg.duration?.trim() === chosenVal;
                      });

                      let updatedPrice = subForm.selling_price;
                      let updatedValidity = subForm.validity_days;
                      if (matchedPkg) {
                        if (matchedPkg.price) updatedPrice = String(matchedPkg.price);
                        const days = getDurationDays(matchedPkg.duration);
                        if (days) updatedValidity = days;
                      }

                      setSubForm(prev => ({
                        ...prev,
                        package_plan: chosenVal,
                        selling_price: updatedPrice,
                        validity_days: updatedValidity
                      }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {selectedProductPackages.length > 0 ? (
                      <>
                        {selectedProductPackages.map((pkg, idx) => {
                          const pkgLabel = pkg.duration
                            ? `${pkg.duration.trim()}${pkg.activation ? ` - ${pkg.activation.trim()}` : ''}`
                            : (pkg.name || `Package ${idx + 1}`);
                          const displayPrice = pkg.price ? ` (৳${parseFloat(pkg.price).toFixed(0)})` : '';
                          return (
                            <option key={idx} value={pkgLabel} className="bg-white text-slate-900 py-1">
                              {pkgLabel}{displayPrice}
                            </option>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        <option value="Monthly" className="bg-white text-slate-900">Monthly</option>
                        <option value="3 Months" className="bg-white text-slate-900">3 Months</option>
                        <option value="6 Months" className="bg-white text-slate-900">6 Months</option>
                        <option value="Yearly" className="bg-white text-slate-900">Yearly</option>
                        <option value="Lifetime" className="bg-white text-slate-900">Lifetime</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={subForm.purchase_date}
                    onChange={(e) => setSubForm({ ...subForm, purchase_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Validity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity *</label>
                  <select
                    value={subForm.validity_days}
                    onChange={(e) => setSubForm({ ...subForm, validity_days: parseInt(e.target.value, 10) || 30 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={30}>1 Month (30 Days)</option>
                    <option value={60}>2 Months (60 Days)</option>
                    <option value={90}>3 Months (90 Days)</option>
                    <option value={180}>6 Months (180 Days)</option>
                    <option value={365}>1 Year (365 Days)</option>
                    <option value={540}>18 Months (540 Days)</option>
                    <option value={730}>2 Years (730 Days)</option>
                    <option value={1095}>3 Years (1095 Days)</option>
                    <option value={3650}>Lifetime</option>
                    {![30, 60, 90, 180, 365, 540, 730, 1095, 3650].includes(parseInt(subForm.validity_days, 10)) && (
                      <option value={subForm.validity_days}>{subForm.validity_days} Days</option>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Select or synced with package duration</p>
                </div>

                {/* Expiry Date (Auto calculated & editable) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={subForm.expiry_date}
                    onChange={(e) => setSubForm({ ...subForm, expiry_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">Calculated automatically • Editable</p>
                </div>

                {/* Account Given */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Information / Given</label>
                  <input
                    type="text"
                    placeholder="customer.account@example.com"
                    value={subForm.account_given}
                    onChange={(e) => setSubForm({ ...subForm, account_given: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={subForm.selling_price}
                    onChange={(e) => setSubForm({ ...subForm, selling_price: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status *</label>
                  <select
                    value={subForm.payment_status}
                    onChange={(e) => setSubForm({ ...subForm, payment_status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                {/* Notes (Spans all 4 columns) */}
                <div className="col-span-1 sm:col-span-2 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Add any additional notes..."
                    value={subForm.notes}
                    onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subFormSubmitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-700/20 transition-all"
                >
                  {subFormSubmitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CUSTOMER PROFILE & RENEWAL DRAWER matching UI concept */}
      {showDetailModal && selectedSubDetail && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl my-auto text-left overflow-hidden text-slate-900">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-base sm:text-lg">
                  {selectedSubDetail.customer_name ? selectedSubDetail.customer_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{selectedSubDetail.customer_name}</h3>
                    {formatStatusBadge(selectedSubDetail.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedSubDetail.product_name} • {selectedSubDetail.package_plan} | WhatsApp: {selectedSubDetail.whatsapp_number}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Grid (Scrollable) */}
            <div className="overflow-y-auto mt-4 pr-1 max-h-[calc(90vh-110px)] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Renew Subscription Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <RefreshCw className="text-emerald-600" size={16} />
                    Renew Subscription
                  </h4>

                  <form onSubmit={handleConfirmRenewal} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Renewal Date</label>
                      <input
                        type="date"
                        required
                        value={renewForm.renewal_date}
                        onChange={(e) => setRenewForm({ ...renewForm, renewal_date: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 mt-1"
                      />
                    </div>

                    {/* Renewal Package Details from Website */}
                    {(() => {
                      const renewProduct = catalogProducts.find(p => p.name === selectedSubDetail?.product_name);
                      let renewPackages = [];
                      if (renewProduct?.packages) {
                        try {
                          renewPackages = Array.isArray(renewProduct.packages)
                            ? renewProduct.packages
                            : JSON.parse(renewProduct.packages);
                        } catch (e) {
                          renewPackages = [];
                        }
                      }

                      return (
                        <div className="space-y-3">
                          {renewPackages.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-slate-700">Renewal Package</label>
                                <span className="text-[10px] text-emerald-700 font-semibold">
                                  {renewPackages.length} package options available
                                </span>
                              </div>
                              <select
                                value={renewForm.package_plan || ''}
                                onChange={(e) => {
                                  const chosenVal = e.target.value;
                                  const matchedPkg = renewPackages.find(pkg => {
                                    const pkgLabel = pkg.duration
                                      ? `${pkg.duration.trim()}${pkg.activation ? ` - ${pkg.activation.trim()}` : ''}`
                                      : (pkg.name || '');
                                    return pkgLabel === chosenVal || pkg.duration?.trim() === chosenVal;
                                  });

                                  let updatedAmount = renewForm.payment_amount;
                                  let updatedValidity = renewForm.validity_days;
                                  if (matchedPkg) {
                                    if (matchedPkg.price) updatedAmount = String(matchedPkg.price);
                                    const days = getDurationDays(matchedPkg.duration);
                                    if (days) updatedValidity = days;
                                  }

                                  setRenewForm(prev => ({
                                    ...prev,
                                    package_plan: chosenVal,
                                    payment_amount: updatedAmount,
                                    validity_days: updatedValidity
                                  }));
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                              >
                                {renewPackages.map((pkg, idx) => {
                                  const pkgLabel = pkg.duration
                                    ? `${pkg.duration.trim()}${pkg.activation ? ` - ${pkg.activation.trim()}` : ''}`
                                    : (pkg.name || `Package ${idx + 1}`);
                                  const displayPrice = pkg.price ? ` (৳${parseFloat(pkg.price).toFixed(0)})` : '';
                                  return (
                                    <option key={idx} value={pkgLabel} className="bg-white text-slate-900 py-1">
                                      {pkgLabel}{displayPrice}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-slate-700">
                                {renewPackages.length > 0 ? 'Validity Days' : 'Now Validity'}
                              </label>
                              <select
                                value={renewForm.validity_days}
                                onChange={(e) => setRenewForm({ ...renewForm, validity_days: parseInt(e.target.value, 10) || 30 })}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 mt-1 cursor-pointer"
                              >
                                <option value={30}>1 Month (30 Days)</option>
                                <option value={60}>2 Months (60 Days)</option>
                                <option value={90}>3 Months (90 Days)</option>
                                <option value={180}>6 Months (180 Days)</option>
                                <option value={365}>1 Year (365 Days)</option>
                                <option value={540}>18 Months (540 Days)</option>
                                <option value={730}>2 Years (730 Days)</option>
                                <option value={1095}>3 Years (1095 Days)</option>
                                <option value={3650}>Lifetime</option>
                                {![30, 60, 90, 180, 365, 540, 730, 1095, 3650].includes(parseInt(renewForm.validity_days, 10)) && (
                                  <option value={renewForm.validity_days}>{renewForm.validity_days} Days</option>
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-700">New Expiry</label>
                              <input
                                type="date"
                                required
                                value={renewForm.new_expiry_date}
                                onChange={(e) => setRenewForm({ ...renewForm, new_expiry_date: e.target.value })}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Payment Amount (BDT)</label>
                      <input
                        type="number"
                        required
                        value={renewForm.payment_amount}
                        onChange={(e) => setRenewForm({ ...renewForm, payment_amount: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 mt-1"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={renewSubmitting}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all mt-2"
                    >
                      {renewSubmitting ? 'Processing...' : 'Confirm Renewal'}
                    </button>
                  </form>
                </div>

                {/* Right Column: Renewal History & Reminder History */}
                <div className="md:col-span-2 space-y-5">

                  {/* 1. Renewal History */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Renewal History</h4>
                      <span className="text-[11px] text-slate-500">Previous records are preserved.</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-100/60">
                            <th className="py-2 px-3">Start Date</th>
                            <th className="py-2 px-3">End Date</th>
                            <th className="py-2 px-3">Amount</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedSubDetail.renewals && selectedSubDetail.renewals.length > 0 ? (
                            selectedSubDetail.renewals.map((ren) => (
                              <tr key={ren.id}>
                                <td className="py-2 px-3 text-slate-800">{new Date(ren.start_date).toISOString().slice(0, 10)}</td>
                                <td className="py-2 px-3 text-slate-800">{new Date(ren.end_date).toISOString().slice(0, 10)}</td>
                                <td className="py-2 px-3 font-bold text-emerald-700">BDT {ren.amount}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ren.status === 'Current' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                    {ren.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-3 text-center text-slate-500">No renewal history recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2. Reminder History */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Reminder History</h4>
                      <span className="text-[11px] text-slate-500">Duplicate reminders prevented.</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-100/60">
                            <th className="py-2 px-3">Channel</th>
                            <th className="py-2 px-3">Scheduled</th>
                            <th className="py-2 px-3">Result</th>
                            <th className="py-2 px-3">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedSubDetail.reminders && selectedSubDetail.reminders.length > 0 ? (
                            selectedSubDetail.reminders.map((rem) => (
                              <tr key={rem.id}>
                                <td className="py-2 px-3 text-slate-800 font-medium">{rem.channel}</td>
                                <td className="py-2 px-3 text-slate-500">{new Date(rem.scheduled_at).toLocaleString()}</td>
                                <td className="py-2 px-3">
                                  <span className={`font-bold ${rem.status === 'Sent' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {rem.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-500">{rem.failure_reason || 'Delivered'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-3 text-center text-slate-500">No automated reminders dispatched yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Action Menu Dropdown (Portal - completely immune to table container overflow/clipping) */}
      {activeMenuSub && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: '144px',
            zIndex: 999999
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-slate-200 rounded-xl shadow-2xl py-1 text-xs text-left ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            onClick={() => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleOpenEditModal(s);
            }}
            className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium cursor-pointer transition-colors"
          >
            <Edit2 size={13} className="text-slate-500" /> Edit
          </button>
          <button
            onClick={() => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleOpenDetailModal(s);
            }}
            className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium cursor-pointer transition-colors"
          >
            <History size={13} className="text-slate-500" /> History
          </button>
          <div className="border-t border-slate-100 my-1"></div>
          <button
            onClick={() => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleDeleteSubscription(s.id, s.customer_name);
            }}
            className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
          >
            <Trash2 size={13} className="text-rose-500" /> Delete
          </button>
        </div>,
        document.body
      )}

    </div>
  );
}
