import React, { useState, useEffect, useRef } from 'react';
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

  // Action Menu dropdown state
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Catalog products for product combobox / type-and-select search
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef(null);

  const combinedProducts = React.useMemo(() => {
    const productMap = new Map();

    catalogProducts.forEach(p => {
      const pName = p.name || p.title;
      if (pName) {
        const priceVal = p.sale_price || p.price || p.regular_price || '';
        productMap.set(pName.toLowerCase(), { name: pName, price: priceVal, isCatalog: true });
      }
    });

    return Array.from(productMap.values());
  }, [catalogProducts]);

  const filteredProducts = React.useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return combinedProducts;
    return combinedProducts.filter(p => p.name.toLowerCase().includes(query));
  }, [combinedProducts, productSearchQuery]);

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
      setSubscriptions(res.data.subscriptions || []);
      if (res.data.stats) {
        setStats(res.data.stats);
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
      if (res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Failed to fetch subscription settings:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSub(null);
    const defaultProduct = catalogProducts.length > 0 ? (catalogProducts[0].name || catalogProducts[0].title) : '';
    const defaultPrice = catalogProducts.length > 0 ? String(catalogProducts[0].sale_price || catalogProducts[0].price || catalogProducts[0].regular_price || '') : '';
    setSubForm({
      customer_name: '',
      whatsapp_number: '',
      email: '',
      product_name: defaultProduct,
      custom_product_name: '',
      package_plan: 'Monthly',
      customer_source: 'Manual',
      purchase_date: new Date().toISOString().slice(0, 10),
      validity_days: 30,
      expiry_date: '',
      account_given: '',
      selling_price: defaultPrice,
      payment_status: 'Paid',
      notes: ''
    });
    setProductSearchQuery('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    setSubForm({
      customer_name: sub.customer_name || '',
      whatsapp_number: sub.whatsapp_number || '',
      email: sub.email || '',
      product_name: sub.product_name || '',
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
      toast.error(err.response?.data?.message || 'Failed to save subscription.');
    } finally {
      setSubFormSubmitting(false);
    }
  };

  const handleOpenDetailModal = async (sub) => {
    try {
      const res = await api.get(`/subscriptions/${sub.id}`);
      setSelectedSubDetail(res.data);
      setRenewForm({
        renewal_date: new Date().toISOString().slice(0, 10),
        validity_days: sub.validity_days || 30,
        new_expiry_date: '',
        payment_amount: sub.selling_price || '999',
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
      setSelectedSubDetail(res.data);
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
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Globe size={12} /> Website</span>;
      case 'WhatsApp':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><MessageSquare size={12} /> WhatsApp</span>;
      case 'Facebook':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Facebook size={12} /> Facebook</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-300 border border-slate-500/20"><User size={12} /> Manual</span>;
    }
  };

  const formatStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active</span>;
      case 'Expiring Soon':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Expiring Soon</span>;
      case 'Expired':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Expired</span>;
      case 'Renewed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Renewed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Cancelled</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">

      {/* Top Header & Concept Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <RefreshCw className="text-emerald-400 animate-spin-slow" size={26} />
              Subscription Manager
            </h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              Admin UI Concept
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage customers, subscriptions, and automatic renewal reminders in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setExpiryFilter('today');
              setActiveSubTab('subscriptions');
            }}
            className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
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
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Alert Banners matching UI mockup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner 1: Expiry Warning */}
        <div className="bg-rose-950/40 border border-rose-800/50 p-4 rounded-xl flex items-center justify-between gap-3 text-rose-200 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-900/60 rounded-lg text-rose-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-rose-100">
                {stats.expiringToday} subscriptions expire today
              </p>
              <p className="text-xs text-rose-300/80">Follow up with customers to ensure uninterrupted service.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setExpiryFilter('today');
              setActiveSubTab('subscriptions');
            }}
            className="text-xs font-semibold text-rose-400 hover:text-rose-200 underline whitespace-nowrap flex items-center gap-1"
          >
            View customers <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Banner 2: Website Auto-entry Status */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-xl flex items-center justify-between gap-3 text-emerald-200 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400">
              <Globe size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-100">Website orders: Auto-entry enabled</p>
              <p className="text-xs text-emerald-300/80">Successful orders automatically create customer subscription records.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('settings')}
            className="px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-200 text-xs font-semibold rounded-lg border border-emerald-600/40 transition-colors whitespace-nowrap"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs matching UI concept */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-1 no-scrollbar">
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
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-xl transition-all whitespace-nowrap ${isActive
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
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
          className="bg-slate-900/70 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.active}</div>
        </div>

        {/* Card 2: Expiring Today */}
        <div
          onClick={() => { setExpiryFilter('today'); setActiveSubTab('subscriptions'); }}
          className="bg-slate-900/70 hover:bg-slate-800/80 p-4 rounded-xl border border-rose-900/50 hover:border-rose-500/60 transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium">Expiring Today</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{String(stats.expiringToday).padStart(2, '0')}</div>
        </div>

        {/* Card 3: Within 3 Days */}
        <div
          onClick={() => { setExpiryFilter('3days'); setActiveSubTab('subscriptions'); }}
          className="bg-slate-900/70 hover:bg-slate-800/80 p-4 rounded-xl border border-amber-900/40 hover:border-amber-500/50 transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">Within 3 Days</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-300">{stats.within3Days}</div>
        </div>

        {/* Card 4: Within 7 Days */}
        <div
          onClick={() => { setExpiryFilter('7days'); setActiveSubTab('subscriptions'); }}
          className="bg-slate-900/70 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 hover:border-yellow-500/40 transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-yellow-400 mb-2">
            <span className="text-xs font-medium">Within 7 Days</span>
            <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.within7Days}</div>
        </div>

        {/* Card 5: Expired */}
        <div
          onClick={() => { setStatusFilter('Expired'); setActiveSubTab('subscriptions'); }}
          className="bg-slate-900/70 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Expired</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <X size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{stats.expired}</div>
        </div>

        {/* Card 6: Renewed */}
        <div
          onClick={() => { setStatusFilter('Renewed'); setActiveSubTab('subscriptions'); }}
          className="bg-slate-900/70 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 hover:border-teal-500/40 transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Renewed</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <RefreshCw size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-400">{stats.renewed}</div>
        </div>

        {/* Card 7: Total Customers */}
        <div
          onClick={() => { setStatusFilter('All Status'); setExpiryFilter('All Dates'); setActiveSubTab('subscriptions'); }}
          className="bg-slate-900/70 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Customers</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.totalCustomers}</div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT SWITCHER */}
      {activeSubTab === 'settings' ? (
        /* REMINDER SETTINGS PANEL matching UI mockup */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="text-emerald-400" size={22} />
                Reminder Settings
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure automatic renewal reminders and messaging channels.</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-all"
            >
              <Check size={18} />
              {settingsSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Column: Reminder Timing & Channels */}
            <div className="space-y-6">

              {/* 1. Reminder Timing */}
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Reminder Timing (send before expiry)</h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reminder_3_days_before === 'true'}
                      onChange={(e) => setSettings({ ...settings, reminder_3_days_before: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                    />
                    3 days before
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reminder_1_day_before === 'true'}
                      onChange={(e) => setSettings({ ...settings, reminder_1_day_before: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                    />
                    1 day before
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reminder_expiry_day === 'true'}
                      onChange={(e) => setSettings({ ...settings, reminder_expiry_day: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                    />
                    Expiry day
                  </label>
                </div>
              </div>

              {/* 2. Reminder Channels & WhatsApp Integration */}
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Reminder Channels</h3>
                <div className="flex items-center justify-between text-sm text-slate-300 py-1">
                  <span>Customer WhatsApp</span>
                  <input
                    type="checkbox"
                    checked={settings.channel_whatsapp_enabled === 'true'}
                    onChange={(e) => setSettings({ ...settings, channel_whatsapp_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300 py-1 border-t border-slate-800/60 pt-2">
                  <span>Customer Email</span>
                  <input
                    type="checkbox"
                    checked={settings.channel_email_enabled === 'true'}
                    onChange={(e) => setSettings({ ...settings, channel_email_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                  />
                </div>

                {/* WhatsApp Cloud API Integration Setup Box */}
                <div className="mt-3 p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-200">WhatsApp Integration</h4>
                        <p className="text-[11px] text-emerald-400">Cloud API • Setup optional</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-400">WhatsApp Cloud API Token</label>
                      <input
                        type="password"
                        placeholder="EAAG..."
                        value={settings.whatsapp_cloud_api_token || ''}
                        onChange={(e) => setSettings({ ...settings, whatsapp_cloud_api_token: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Phone Number ID</label>
                      <input
                        type="text"
                        placeholder="10987654321..."
                        value={settings.whatsapp_phone_number_id || ''}
                        onChange={(e) => setSettings({ ...settings, whatsapp_phone_number_id: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Admin Expiry Alerts */}
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Admin Alerts (when subscription expires)</h3>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.admin_alert_dashboard === 'true'}
                      onChange={(e) => setSettings({ ...settings, admin_alert_dashboard: e.target.checked ? 'true' : 'false' })}
                      className="rounded accent-emerald-500"
                    />
                    Dashboard
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.admin_alert_email === 'true'}
                      onChange={(e) => setSettings({ ...settings, admin_alert_email: e.target.checked ? 'true' : 'false' })}
                      className="rounded accent-emerald-500"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.admin_alert_whatsapp === 'true'}
                      onChange={(e) => setSettings({ ...settings, admin_alert_whatsapp: e.target.checked ? 'true' : 'false' })}
                      className="rounded accent-emerald-500"
                    />
                    WhatsApp
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-400">Admin Email</label>
                    <input
                      type="email"
                      value={settings.admin_email || ''}
                      onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Admin WhatsApp</label>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={settings.admin_whatsapp || ''}
                      onChange={(e) => setSettings({ ...settings, admin_whatsapp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Message Templates (WhatsApp & Email) */}
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-semibold text-slate-200">Message Templates</h3>
                  <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                    <button
                      onClick={() => setSettingsActiveTab('whatsapp')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${settingsActiveTab === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      WhatsApp Template
                    </button>
                    <button
                      onClick={() => setSettingsActiveTab('email')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${settingsActiveTab === 'email' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      Email Template
                    </button>
                  </div>
                </div>

                {/* Available Variables Guide */}
                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-emerald-400">Available Variables:</span>{' '}
                  <code className="text-emerald-300">{'{customer_name}'}</code>, <code className="text-emerald-300">{'{product_name}'}</code>, <code className="text-emerald-300">{'{expiry_date}'}</code>, <code className="text-emerald-300">{'{package_plan}'}</code>
                </div>

                {settingsActiveTab === 'whatsapp' ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-300">Message Template (WhatsApp)</label>
                    <textarea
                      rows={6}
                      value={settings.whatsapp_template || ''}
                      onChange={(e) => setSettings({ ...settings, whatsapp_template: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Email Subject</label>
                      <input
                        type="text"
                        value={settings.email_subject_template || ''}
                        onChange={(e) => setSettings({ ...settings, email_subject_template: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Email Body Text</label>
                      <textarea
                        rows={6}
                        value={settings.email_body_template || ''}
                        onChange={(e) => setSettings({ ...settings, email_body_template: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed mt-1"
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

          {/* Filter & Search Bar matching concept mockup */}
          <div className="p-4 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-950/40">

            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search name, mobile or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Product Select Filter */}
            <div>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Product & Plan</th>
                  <th className="py-3.5 px-4">Expiry</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="animate-spin inline-block mr-2 text-emerald-400" size={18} />
                      Loading customer subscriptions...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No customer subscriptions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const formattedExpiry = sub.expiry_date ? new Date(sub.expiry_date).toISOString().slice(0, 10) : '-';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors group">

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                              {sub.customer_name ? sub.customer_name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                {sub.customer_name}
                              </p>
                              <p className="text-[11px] text-slate-400">{sub.whatsapp_number}</p>
                              {sub.email && <p className="text-[10px] text-slate-500">{sub.email}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Product & Plan */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200">{sub.product_name}</span>
                          <span className="text-slate-400"> • {sub.package_plan}</span>
                        </td>

                        {/* Expiry */}
                        <td className="py-3.5 px-4 font-medium text-slate-300">
                          {formattedExpiry}
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4">
                          {formatSourceBadge(sub.customer_source)}
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${sub.payment_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                                title="Open Direct WhatsApp Chat with Reminder Text"
                              >
                                <MessageSquare size={15} />
                              </a>
                            )}

                            {/* Renew / View Button */}
                            {sub.status === 'Expiring Soon' || sub.status === 'Expired' ? (
                              <button
                                onClick={() => handleOpenDetailModal(sub)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all shadow-sm"
                              >
                                Renew
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenDetailModal(sub)}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg border border-slate-700 transition-colors"
                              >
                                View
                              </button>
                            )}

                            {/* More Actions Dropdown Toggle */}
                            <div className="relative">
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === sub.id ? null : sub.id)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {/* Dropdown Menu */}
                              {activeMenuId === sub.id && (
                                <div className="absolute right-0 top-8 z-50 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 text-xs text-left">
                                  <button
                                    onClick={() => handleOpenEditModal(sub)}
                                    className="w-full px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                                  >
                                    <Edit2 size={13} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleOpenDetailModal(sub)}
                                    className="w-full px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                                  >
                                    <History size={13} /> History
                                  </button>
                                  <div className="border-t border-slate-800 my-1"></div>
                                  <button
                                    onClick={() => handleDeleteSubscription(sub.id, sub.customer_name)}
                                    className="w-full px-3 py-2 text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>

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
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Expiring Soon</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Expired</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Renewed</span>
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
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl my-auto text-left overflow-hidden">

            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingSub ? 'Edit Customer Subscription' : 'Add Customer / Subscription'}
                </h3>
                <p className="text-xs text-slate-400">Create a new customer and subscription record.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerSub} className="space-y-4 overflow-y-auto pr-1 mt-4 max-h-[calc(90vh-110px)] custom-scrollbar">

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

                {/* Customer Name */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim Ahmed"
                    value={subForm.customer_name}
                    onChange={(e) => setSubForm({ ...subForm, customer_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

                {/* WhatsApp / Mobile */}
                <div>
                  <label className="text-xs font-medium text-slate-300">WhatsApp / Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 019XX XXX101"
                    value={subForm.whatsapp_number}
                    onChange={(e) => setSubForm({ ...subForm, whatsapp_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={subForm.email}
                    onChange={(e) => setSubForm({ ...subForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

                {/* Customer Source */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Customer Source *</label>
                  <select
                    value={subForm.customer_source}
                    onChange={(e) => setSubForm({ ...subForm, customer_source: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  >
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                {/* Product / Service (Type & Select Search) */}
                <div className="relative" ref={productDropdownRef}>
                  <label className="text-xs font-medium text-slate-300">Product / Service *</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      required
                      placeholder="Type or select product..."
                      value={subForm.product_name || ''}
                      onFocus={(e) => {
                        setShowProductDropdown(true);
                        e.target.select();
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubForm(prev => ({ ...prev, product_name: val }));
                        setProductSearchQuery(val);
                        setShowProductDropdown(true);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductDropdown(prev => !prev);
                        setProductSearchQuery('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronDown size={14} className={`transition-transform duration-200 ${showProductDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dropdown Suggestions List */}
                  {showProductDropdown && (
                    <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-700">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSubForm(prev => ({
                                ...prev,
                                product_name: p.name,
                                selling_price: p.price ? String(p.price) : prev.selling_price
                              }));
                              setProductSearchQuery('');
                              setShowProductDropdown(false);
                            }}
                            className="w-full px-3.5 py-2.5 text-left text-xs text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors flex items-center justify-between group"
                          >
                            <span className="font-medium group-hover:translate-x-0.5 transition-transform">{p.name}</span>
                            <div className="flex items-center gap-2">
                              {p.price && (
                                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">৳{p.price}</span>
                              )}
                              {p.isCatalog && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">Catalog</span>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3.5 py-2.5 text-xs text-slate-400 italic">
                          Custom product name: <span className="text-emerald-400 font-semibold">"{subForm.product_name}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Package / Plan */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Package / Plan *</label>
                  <select
                    value={subForm.package_plan}
                    onChange={(e) => setSubForm({ ...subForm, package_plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={subForm.purchase_date}
                    onChange={(e) => setSubForm({ ...subForm, purchase_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

                {/* Validity */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Validity *</label>
                  <select
                    value={subForm.validity_days}
                    onChange={(e) => setSubForm({ ...subForm, validity_days: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  >
                    <option value={30}>30 Days</option>
                    <option value={90}>3 Months (90 Days)</option>
                    <option value={180}>6 Months (180 Days)</option>
                    <option value={365}>1 Year (365 Days)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">30 Days - 1 Month - 3 Months - 1 Year</p>
                </div>

                {/* Expiry Date (Auto calculated & editable) */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={subForm.expiry_date}
                    onChange={(e) => setSubForm({ ...subForm, expiry_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  />
                  <p className="text-[10px] text-emerald-400 mt-1">Calculated automatically • Editable</p>
                </div>

                {/* Account Given */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Account Information / Given</label>
                  <input
                    type="text"
                    placeholder="customer.account@example.com"
                    value={subForm.account_given}
                    onChange={(e) => setSubForm({ ...subForm, account_given: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Selling Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={subForm.selling_price}
                    onChange={(e) => setSubForm({ ...subForm, selling_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

                {/* Payment Status */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Payment Status *</label>
                  <select
                    value={subForm.payment_status}
                    onChange={(e) => setSubForm({ ...subForm, payment_status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                {/* Notes (Spans all 4 columns) */}
                <div className="col-span-1 sm:col-span-2 md:col-span-4">
                  <label className="text-xs font-medium text-slate-300">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Add any additional notes..."
                    value={subForm.notes}
                    onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 sticky bottom-0 bg-slate-900 py-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subFormSubmitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
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
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl my-auto text-left overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base sm:text-lg">
                  {selectedSubDetail.customer_name ? selectedSubDetail.customer_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white">{selectedSubDetail.customer_name}</h3>
                    {formatStatusBadge(selectedSubDetail.status)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedSubDetail.product_name} • {selectedSubDetail.package_plan} | WhatsApp: {selectedSubDetail.whatsapp_number}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Grid (Scrollable) */}
            <div className="overflow-y-auto mt-4 pr-1 max-h-[calc(90vh-110px)] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Renew Subscription Form */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <RefreshCw className="text-emerald-400" size={16} />
                    Renew Subscription
                  </h4>

                  <form onSubmit={handleConfirmRenewal} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400">Renewal Date</label>
                      <input
                        type="date"
                        required
                        value={renewForm.renewal_date}
                        onChange={(e) => setRenewForm({ ...renewForm, renewal_date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400">Now Validity</label>
                        <select
                          value={renewForm.validity_days}
                          onChange={(e) => setRenewForm({ ...renewForm, validity_days: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                        >
                          <option value={30}>1 Month</option>
                          <option value={90}>3 Months</option>
                          <option value={180}>6 Months</option>
                          <option value={365}>1 Year</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-400">New Expiry</label>
                        <input
                          type="date"
                          required
                          value={renewForm.new_expiry_date}
                          onChange={(e) => setRenewForm({ ...renewForm, new_expiry_date: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400">Payment Amount (BDT)</label>
                      <input
                        type="number"
                        required
                        value={renewForm.payment_amount}
                        onChange={(e) => setRenewForm({ ...renewForm, payment_amount: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
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
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">Renewal History</h4>
                      <span className="text-[11px] text-slate-500">Previous records are preserved.</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-medium">
                            <th className="py-2 px-3">Start Date</th>
                            <th className="py-2 px-3">End Date</th>
                            <th className="py-2 px-3">Amount</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {selectedSubDetail.renewals && selectedSubDetail.renewals.length > 0 ? (
                            selectedSubDetail.renewals.map((ren) => (
                              <tr key={ren.id}>
                                <td className="py-2 px-3 text-slate-300">{new Date(ren.start_date).toISOString().slice(0, 10)}</td>
                                <td className="py-2 px-3 text-slate-300">{new Date(ren.end_date).toISOString().slice(0, 10)}</td>
                                <td className="py-2 px-3 font-semibold text-emerald-400">BDT {ren.amount}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ren.status === 'Current' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
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
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">Reminder History</h4>
                      <span className="text-[11px] text-slate-500">Duplicate reminders prevented.</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-medium">
                            <th className="py-2 px-3">Channel</th>
                            <th className="py-2 px-3">Scheduled</th>
                            <th className="py-2 px-3">Result</th>
                            <th className="py-2 px-3">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {selectedSubDetail.reminders && selectedSubDetail.reminders.length > 0 ? (
                            selectedSubDetail.reminders.map((rem) => (
                              <tr key={rem.id}>
                                <td className="py-2 px-3 text-slate-300 font-medium">{rem.channel}</td>
                                <td className="py-2 px-3 text-slate-400">{new Date(rem.scheduled_at).toLocaleString()}</td>
                                <td className="py-2 px-3">
                                  <span className={`font-bold ${rem.status === 'Sent' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {rem.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-400">{rem.failure_reason || 'Delivered'}</td>
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

    </div>
  );
}
