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
  ChevronUp,
  UserPlus,
  Key,
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
  Info,
  Copy,
  ArrowUpDown,
  ChevronLeft,
  RotateCcw
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

const getRemainingDays = (expiryStr) => {
  if (!expiryStr) return null;
  const exp = new Date(expiryStr);
  if (isNaN(exp.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
  const [subSortField, setSubSortField] = useState('expiry');
  const [subSortAsc, setSubSortAsc] = useState(true);
  const [subPage, setSubPage] = useState(1);

  // Modals & Forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const customerFormRef = useRef(null);
  const [editingSub, setEditingSub] = useState(null); // null = Add, object = Edit
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubDetail, setSelectedSubDetail] = useState(null);

  // Available licenses state
  const [availableLicenses, setAvailableLicenses] = useState([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [licenseInputMode, setLicenseInputMode] = useState('dropdown'); // 'dropdown' | 'manual'

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
    selected_license_id: null,
    license_rules: '',
    selling_price: '0',
    payment_status: 'Paid',
    notes: '',
    order_id: ''
  });
  const [subFormSubmitting, setSubFormSubmitting] = useState(false);

  // Renewal form state
  const [renewForm, setRenewForm] = useState({
    renewal_date: new Date().toISOString().slice(0, 10),
    validity_days: 30,
    package_plan: '',
    new_expiry_date: '',
    payment_amount: '',
    notes: 'Subscription renewed',
    license_id: null,
    account_given: '',
    license_rules: '',
    customer_email: ''
  });
  const [renewLicenses, setRenewLicenses] = useState([]);
  const [loadingRenewLicenses, setLoadingRenewLicenses] = useState(false);
  const [renewLicenseMode, setRenewLicenseMode] = useState('dropdown'); // 'dropdown' | 'manual'
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

  const subsPerPage = 15;
  const sortedSubscriptions = React.useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      let comparison = 0;
      if (subSortField === 'expiry') {
        const expA = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
        const expB = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
        comparison = expA - expB;
      } else if (subSortField === 'order_date') {
        const dateA = new Date(a.order_created_at || a.created_at || a.purchase_date || 0).getTime();
        const dateB = new Date(b.order_created_at || b.created_at || b.purchase_date || 0).getTime();
        comparison = dateA - dateB;
      } else if (subSortField === 'customer') {
        comparison = (a.customer_name || '').localeCompare(b.customer_name || '');
      } else if (subSortField === 'product') {
        comparison = (a.product_name || '').localeCompare(b.product_name || '');
      } else if (subSortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      } else if (subSortField === 'amount') {
        comparison = (parseFloat(a.selling_price) || 0) - (parseFloat(b.selling_price) || 0);
      }
      return subSortAsc ? comparison : -comparison;
    });
  }, [subscriptions, subSortField, subSortAsc]);

  const totalSubPages = Math.ceil(sortedSubscriptions.length / subsPerPage) || 1;
  const paginatedSubscriptions = React.useMemo(() => {
    return sortedSubscriptions.slice((subPage - 1) * subsPerPage, subPage * subsPerPage);
  }, [sortedSubscriptions, subPage, subsPerPage]);

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

  // Fetch available licenses whenever product or package changes in Add/Edit form
  const fetchAvailableLicenses = async (productName, packagePlan) => {
    if (!productName || !productName.trim()) {
      setAvailableLicenses([]);
      setLicenseInputMode('manual');
      return;
    }

    try {
      setLoadingLicenses(true);
      const res = await api.get('/licenses/available', {
        params: {
          product_name: productName.trim(),
          package_name: packagePlan ? packagePlan.trim() : ''
        }
      });
      const licList = res?.licenses || [];
      setAvailableLicenses(licList);

      if (licList.length > 0) {
        setLicenseInputMode('dropdown');
        setSubForm(prev => {
          const currentId = prev.selected_license_id;
          const match = licList.find(l => l.id === currentId);
          if (match) {
            return {
              ...prev,
              account_given: match.license_key,
              license_rules: match.rules || ''
            };
          } else {
            return {
              ...prev,
              selected_license_id: licList[0].id,
              account_given: licList[0].license_key,
              license_rules: licList[0].rules || ''
            };
          }
        });
      } else {
        setLicenseInputMode('manual');
        setSubForm(prev => ({
          ...prev,
          selected_license_id: null
        }));
      }
    } catch (err) {
      console.error('Failed to fetch available licenses:', err);
      setAvailableLicenses([]);
      setLicenseInputMode('manual');
    } finally {
      setLoadingLicenses(false);
    }
  };

  useEffect(() => {
    if (showAddForm && subForm.product_name) {
      fetchAvailableLicenses(subForm.product_name, subForm.package_plan);
    }
  }, [showAddForm, subForm.product_name, subForm.package_plan]);

  // Fetch available unused licenses for Renew Modal matching product & package
  const fetchRenewLicenses = async (productName, packagePlan) => {
    if (!productName || !productName.trim()) {
      setRenewLicenses([]);
      setRenewLicenseMode('manual');
      return;
    }

    try {
      setLoadingRenewLicenses(true);
      const res = await api.get('/licenses/available', {
        params: {
          product_name: productName.trim(),
          package_name: packagePlan ? packagePlan.trim() : '',
          filter_by_package: 'true'
        }
      });
      const licList = res?.licenses || [];
      setRenewLicenses(licList);

      if (licList.length > 0) {
        setRenewLicenseMode('dropdown');
        setRenewForm(prev => {
          const currentId = prev.license_id;
          const match = licList.find(l => l.id === currentId);
          if (match) {
            return {
              ...prev,
              account_given: match.license_key,
              license_rules: match.rules || ''
            };
          } else {
            return {
              ...prev,
              license_id: licList[0].id,
              account_given: licList[0].license_key,
              license_rules: licList[0].rules || ''
            };
          }
        });
      } else {
        // When no unused licenses exist, switch to manual blank text field as requested!
        setRenewLicenseMode('manual');
        setRenewForm(prev => ({
          ...prev,
          license_id: null,
          account_given: '',
          license_rules: ''
        }));
      }
    } catch (err) {
      console.error('Failed to fetch renew licenses:', err);
      setRenewLicenses([]);
      setRenewLicenseMode('manual');
      setRenewForm(prev => ({
        ...prev,
        license_id: null,
        account_given: '',
        license_rules: ''
      }));
    } finally {
      setLoadingRenewLicenses(false);
    }
  };

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
    setSubPage(1);
  }, [searchQuery, productFilter, statusFilter, sourceFilter, expiryFilter]);

  const handleToggleAddForm = () => {
    if (showAddForm && !editingSub) {
      setShowAddForm(false);
      return;
    }

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
      selected_license_id: null,
      license_rules: '',
      selling_price: defaultPrice,
      payment_status: 'Paid',
      notes: ''
    });
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setShowAddForm(true);
    setTimeout(() => {
      customerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };
  const handleOpenAddModal = handleToggleAddForm;

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
      selected_license_id: null,
      license_rules: '',
      selling_price: sub.selling_price || '',
      payment_status: sub.payment_status || 'Paid',
      notes: sub.notes || '',
      order_id: sub.order_id || ''
    });
    setLicenseInputMode('manual');
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setShowAddForm(true);
    setActiveMenuSub(null);
    setTimeout(() => {
      customerFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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
        product_name: targetProductName,
        order_id: subForm.order_id ? parseInt(subForm.order_id, 10) : null,
        license_id: (licenseInputMode === 'dropdown' && subForm.selected_license_id) ? subForm.selected_license_id : null
      };

      if (editingSub) {
        await api.put(`/subscriptions/${editingSub.id}`, payload);
        toast.success('Subscription updated successfully!');
      } else {
        await api.post('/subscriptions', payload);
        toast.success('Customer subscription added successfully!');
      }

      setShowAddForm(false);
      setEditingSub(null);
      fetchSubscriptions();
    } catch (err) {
      console.error('Error saving subscription:', err);
      toast.error(err.message || err.response?.data?.message || 'Failed to save subscription.');
    } finally {
      setSubFormSubmitting(false);
    }
  };

  const handleOpenDetailModal = async (sub) => {
    // 1. Immediately set selectedSubDetail using existing sub data so UI never blocks or fails to open
    const initialDetail = {
      ...sub,
      renewals: sub.renewals || [],
      reminders: sub.reminders || []
    };
    setSelectedSubDetail(initialDetail);

    const targetProdName = sub.product_name;
    const foundProduct = catalogProducts.find(p => p.name === targetProdName);
    let pkgs = [];
    if (foundProduct?.packages) {
      try {
        pkgs = Array.isArray(foundProduct.packages) ? foundProduct.packages : JSON.parse(foundProduct.packages);
      } catch (e) {
        pkgs = [];
      }
    }

    let initPackagePlan = sub.package_plan || '';
    let initAmount = sub.selling_price || '0';
    let initDays = sub.validity_days || 30;

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

    // Auto-calculate new_expiry_date
    const today = new Date();
    const autoExpiry = new Date(today);
    autoExpiry.setDate(autoExpiry.getDate() + (parseInt(initDays, 10) || 30));
    const formattedAutoExpiry = autoExpiry.toISOString().slice(0, 10);

    setRenewForm({
      renewal_date: today.toISOString().slice(0, 10),
      validity_days: initDays,
      package_plan: initPackagePlan,
      new_expiry_date: formattedAutoExpiry,
      payment_amount: initAmount,
      notes: 'Subscription renewed',
      license_id: null,
      account_given: '',
      license_rules: '',
      customer_email: sub.email || ''
    });

    // Fetch unused licenses for this product & package option
    fetchRenewLicenses(sub.product_name, initPackagePlan);

    // OPEN THE MODAL IMMEDIATELY!
    setShowDetailModal(true);
    setActiveMenuSub(null);

    // 2. Fetch fresh details in background to populate latest renewal & reminder history
    try {
      const res = await api.get(`/subscriptions/${sub.id}`);
      const freshData = (res && typeof res === 'object' && !res.data) ? res : (res?.data || {});
      if (freshData && freshData.id) {
        setSelectedSubDetail(prev => ({
          ...prev,
          ...freshData,
          renewals: freshData.renewals || prev?.renewals || [],
          reminders: freshData.reminders || prev?.reminders || []
        }));
        if (freshData.email && !sub.email) {
          setRenewForm(prev => ({ ...prev, customer_email: freshData.email }));
        }
      }
    } catch (fetchErr) {
      console.warn('Background fetch for subscription details:', fetchErr.message);
    }
  };

  const handleConfirmRenewal = async (e) => {
    e.preventDefault();
    if (!selectedSubDetail) return;

    try {
      setRenewSubmitting(true);
      const payload = {
        ...renewForm,
        license_id: (renewLicenseMode === 'dropdown' && renewForm.license_id) ? renewForm.license_id : null,
        account_given: renewForm.account_given || '',
        customer_email: (renewForm.customer_email || selectedSubDetail.email || '').trim()
      };
      const res = await api.post(`/subscriptions/${selectedSubDetail.id}/renew`, payload);
      toast.success(res?.message || `Subscription renewed successfully!`);

      // Refresh detail & list
      try {
        const detailRes = await api.get(`/subscriptions/${selectedSubDetail.id}`);
        const freshData = (detailRes && typeof detailRes === 'object' && !detailRes.data) ? detailRes : (detailRes?.data || {});
        setSelectedSubDetail(prev => ({ ...prev, ...freshData }));
      } catch (err) {
        setSelectedSubDetail(prev => ({
          ...prev,
          expiry_date: renewForm.new_expiry_date || prev.expiry_date,
          status: 'Renewed',
          selling_price: renewForm.payment_amount || prev.selling_price,
          account_given: payload.account_given || prev.account_given,
          email: payload.customer_email || prev.email
        }));
      }
      fetchSubscriptions();
    } catch (err) {
      console.error('Renewal error:', err);
      toast.error(err.message || 'Failed to renew subscription.');
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
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"><Globe size={11} /> Website</span>;
      case 'WhatsApp':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"><MessageSquare size={11} /> WhatsApp</span>;
      case 'Facebook':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"><Facebook size={11} /> Facebook</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"><User size={11} /> Manual</span>;
    }
  };

  const formatStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active</span>;
      case 'Expiring Soon':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Expiring Soon</span>;
      case 'Expired':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Expired</span>;
      case 'Renewed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-cyan-50 text-cyan-700 border border-cyan-200/80 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Renewed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Cancelled</span>;
    }
  };

  return (
    <div className="space-y-4 text-slate-900 font-sans">

      {/* Top Header & Concept Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <RefreshCw className="text-emerald-600 animate-spin-slow" size={20} />
              Subscription Manager
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
              Admin UI
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage customers, subscriptions, and automatic renewal reminders in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setExpiryFilter('today');
              setActiveSubTab('subscriptions');
            }}
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 cursor-pointer shadow-2xs"
            title="Expiring Today Notifications"
          >
            <Bell size={17} />
            {stats.expiringToday > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                {stats.expiringToday}
              </span>
            )}
          </button>

          <button
            onClick={handleToggleAddForm}
            className={`flex items-center gap-1.5 px-3.5 py-1.75 font-bold text-xs rounded-lg shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${showAddForm
              ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-800/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20'
              }`}
          >
            {showAddForm ? (
              <>
                <ChevronUp size={15} />
                {editingSub ? 'Close Edit Form' : 'Close Form'}
              </>
            ) : (
              <>
                <Plus size={15} />
                Add Customer
              </>
            )}
          </button>
        </div>
      </div>

      {/* INLINE DROPDOWN / ACCORDION FORM: ADD / EDIT CUSTOMER SUBSCRIPTION */}
      {showAddForm && (
        <div
          ref={customerFormRef}
          className="bg-white border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl shadow-emerald-500/5 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                {editingSub ? <Edit2 size={20} /> : <UserPlus size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {editingSub ? 'Edit Customer Subscription' : 'Add Customer / Subscription'}
                  </h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${editingSub
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                    {editingSub ? 'Edit Mode' : 'New Entry'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingSub
                    ? `Updating customer subscription record for: ${editingSub.customer_name}`
                    : 'Fill in the customer information and subscription plan details below.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingSub(null);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSaveCustomerSub} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">

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

              {/* Order No (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Order No (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 1025"
                  value={subForm.order_id || ''}
                  onChange={(e) => setSubForm({ ...subForm, order_id: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
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

              {/* License Key / Credentials (Placed directly after Package / Plan) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key size={13} className="text-emerald-600" />
                    <span>License / Key</span>
                  </label>
                  {availableLicenses.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                        {availableLicenses.length} in stock
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (licenseInputMode === 'dropdown') {
                            setLicenseInputMode('manual');
                            setSubForm(prev => ({ ...prev, selected_license_id: null }));
                          } else {
                            setLicenseInputMode('dropdown');
                            if (availableLicenses.length > 0) {
                              const lic = availableLicenses[0];
                              setSubForm(prev => ({
                                ...prev,
                                selected_license_id: lic.id,
                                account_given: lic.license_key,
                                license_rules: lic.rules || ''
                              }));
                            }
                          }
                        }}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 underline font-medium cursor-pointer"
                      >
                        {licenseInputMode === 'dropdown' ? 'Type manual' : 'Use stock key'}
                      </button>
                    </div>
                  )}
                </div>

                {loadingLicenses ? (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-400 flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin text-emerald-600" />
                    <span>Checking license stock...</span>
                  </div>
                ) : licenseInputMode === 'dropdown' && availableLicenses.length > 0 ? (
                  <select
                    value={subForm.selected_license_id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__manual__') {
                        setLicenseInputMode('manual');
                        setSubForm(prev => ({ ...prev, selected_license_id: null, account_given: '' }));
                        return;
                      }
                      const chosenId = parseInt(val, 10);
                      const matched = availableLicenses.find(l => l.id === chosenId);
                      if (matched) {
                        setSubForm(prev => ({
                          ...prev,
                          selected_license_id: matched.id,
                          account_given: matched.license_key,
                          license_rules: matched.rules || ''
                        }));
                      }
                    }}
                    className="w-full bg-emerald-50/40 border border-emerald-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
                  >
                    {availableLicenses.map((lic, idx) => {
                      const displayKey = lic.license_key.length > 30 ? lic.license_key.slice(0, 30) + '...' : lic.license_key;
                      const pkgTag = lic.package_option ? ` [${lic.package_option}]` : '';
                      return (
                        <option key={lic.id || idx} value={lic.id}>
                          {displayKey}{pkgTag}
                        </option>
                      );
                    })}
                    <option value="__manual__">➕ Type custom / manual key...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter license key / account credentials..."
                    value={subForm.account_given}
                    onChange={(e) => setSubForm({ ...subForm, account_given: e.target.value, selected_license_id: null })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                )}
                <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>
                    {availableLicenses.length > 0 && licenseInputMode === 'dropdown'
                      ? 'Pre-stocked key • Auto marks used on confirm'
                      : 'Manual entry • Will be saved with subscription'}
                  </span>
                  {subForm.email && subForm.email.trim() && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Mail size={10} /> Will email to customer
                    </span>
                  )}
                </p>
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

              {/* Notes (Spans all columns) */}
              <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5">
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
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSub(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={subFormSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {subFormSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    {editingSub ? 'Update Subscription' : 'Save Customer'}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Alert Banners matching UI mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Banner 1: Expiry Warning */}
        <div className="bg-rose-50/80 border border-rose-200/90 p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-rose-100 rounded-lg text-rose-600 border border-rose-200 shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 tracking-wide">
                {stats.expiringToday} subscriptions expire today
              </p>
              <p className="text-[10.5px] text-slate-600 font-medium">
                Follow up with customers to ensure uninterrupted service.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setExpiryFilter('today');
              setActiveSubTab('subscriptions');
            }}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline whitespace-nowrap flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
          >
            View customers <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Banner 2: Website Auto-entry Status */}
        <div className="bg-emerald-50/80 border border-emerald-200/90 p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg text-emerald-700 border border-emerald-200 shrink-0">
              <Globe size={16} />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 tracking-wide">
                Website orders: Auto-entry enabled
              </p>
              <p className="text-[10.5px] text-slate-600 font-medium">
                Successful orders automatically create customer subscription records.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('settings')}
            className="px-3 py-1.25 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs matching UI concept */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1.5 scrollbar-thin">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-lg transition-all whitespace-nowrap cursor-pointer ${isActive
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 7 Dashboard Stat Cards Grid matching concept mockup */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-2.5">
        {/* Card 1: Active Subscriptions */}
        <div
          onClick={() => { setStatusFilter('Active'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 hover:border-emerald-500/40 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Active">Active</span>
            <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
              <Users size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">{stats.active}</div>
        </div>

        {/* Card 2: Expiring Today */}
        <div
          onClick={() => { setExpiryFilter('today'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-rose-50/50 p-2.5 sm:p-3 rounded-xl border border-rose-200/90 hover:border-rose-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Expiring Today">Expiring Today</span>
            <div className="p-1 rounded-md bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform shrink-0">
              <Calendar size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600">{String(stats.expiringToday).padStart(2, '0')}</div>
        </div>

        {/* Card 3: Within 3 Days */}
        <div
          onClick={() => { setExpiryFilter('3days'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-amber-50/50 p-2.5 sm:p-3 rounded-xl border border-amber-200/90 hover:border-amber-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Within 3 Days">Within 3 Days</span>
            <div className="p-1 rounded-md bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform shrink-0">
              <Clock size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600">{stats.within3Days}</div>
        </div>

        {/* Card 4: Within 7 Days */}
        <div
          onClick={() => { setExpiryFilter('7days'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 hover:border-yellow-500/40 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Within 7 Days">Within 7 Days</span>
            <div className="p-1 rounded-md bg-yellow-50 text-yellow-600 group-hover:scale-105 transition-transform shrink-0">
              <Clock size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">{stats.within7Days}</div>
        </div>

        {/* Card 5: Expired */}
        <div
          onClick={() => { setStatusFilter('Expired'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-rose-50/50 p-2.5 sm:p-3 rounded-xl border border-rose-200/90 hover:border-rose-300 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Expired">Expired</span>
            <div className="p-1 rounded-md bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform shrink-0">
              <X size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600">{stats.expired}</div>
        </div>

        {/* Card 6: Renewed */}
        <div
          onClick={() => { setStatusFilter('Renewed'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-teal-50/50 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 hover:border-teal-400 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Renewed">Renewed</span>
            <div className="p-1 rounded-md bg-teal-50 text-teal-600 group-hover:scale-105 transition-transform shrink-0">
              <RefreshCw size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-teal-700">{stats.renewed}</div>
        </div>

        {/* Card 7: Total Customers */}
        <div
          onClick={() => { setStatusFilter('All Status'); setExpiryFilter('All Dates'); setActiveSubTab('subscriptions'); }}
          className="bg-white hover:bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 hover:border-blue-400 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Total Customers">Total Customers</span>
            <div className="p-1 rounded-md bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform shrink-0">
              <Users size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">{stats.totalCustomers}</div>
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
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">

          {/* Filter & Search Bar with Sort & Reset */}
          <div className="p-3 border-b border-slate-200/90 bg-slate-50/80 flex flex-wrap items-center gap-2">

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search name, mobile or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSubPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
              />
            </div>

            {/* Product Select Filter */}
            <div className="w-full sm:w-auto min-w-[140px]">
              <select
                value={productFilter}
                onChange={(e) => {
                  setProductFilter(e.target.value);
                  setSubPage(1);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-2xs cursor-pointer"
              >
                <option value="All Products">All Products</option>
                {combinedProducts.map((p, i) => (
                  <option key={i} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div className="w-full sm:w-auto min-w-[120px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setSubPage(1);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-2xs cursor-pointer"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
                <option value="Renewed">Renewed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Expiry Date Select */}
            <div className="w-full sm:w-auto min-w-[125px]">
              <select
                value={expiryFilter}
                onChange={(e) => {
                  setExpiryFilter(e.target.value);
                  setSubPage(1);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-2xs cursor-pointer"
              >
                <option value="All Dates">All Expiry Dates</option>
                <option value="today">Expiring Today</option>
                <option value="3days">Within 3 Days</option>
                <option value="7days">Within 7 Days</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Sort Field Select */}
            <div className="w-full sm:w-auto min-w-[130px]">
              <select
                value={subSortField}
                onChange={(e) => {
                  setSubSortField(e.target.value);
                  setSubPage(1);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-2xs cursor-pointer"
              >
                <option value="expiry">Sort: Expiry Date</option>
                <option value="order_date">Sort: Order Date</option>
                <option value="customer">Sort: Customer Name</option>
                <option value="product">Sort: Product Name</option>
                <option value="status">Sort: Status</option>
                <option value="amount">Sort: Amount</option>
              </select>
            </div>

            {/* Sort Asc/Desc Button */}
            <button
              type="button"
              onClick={() => setSubSortAsc(!subSortAsc)}
              className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs cursor-pointer"
              title={subSortAsc ? 'Ascending Order (Click for Descending)' : 'Descending Order (Click for Ascending)'}
            >
              <ArrowUpDown size={14} className={subSortAsc ? 'text-emerald-600' : 'text-slate-600'} />
            </button>

            {/* Reset Filters Button */}
            {(searchQuery || productFilter !== 'All Products' || statusFilter !== 'All Status' || expiryFilter !== 'All Dates' || subSortField !== 'expiry' || !subSortAsc) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setProductFilter('All Products');
                  setStatusFilter('All Status');
                  setExpiryFilter('All Dates');
                  setSubSortField('expiry');
                  setSubSortAsc(true);
                  setSubPage(1);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}

          </div>

          {/* Bordered Table Content */}
          <div className="overflow-x-auto min-h-[220px]">
            <table className="w-full min-w-[1020px] text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-250 bg-slate-100/90 text-slate-700 font-black uppercase tracking-wider text-[10px] select-none">
                  <th
                    onClick={() => {
                      if (subSortField === 'customer') {
                        setSubSortAsc(!subSortAsc);
                      } else {
                        setSubSortField('customer');
                        setSubSortAsc(true);
                      }
                    }}
                    className="py-2.5 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Customer</span>
                      <ArrowUpDown size={10} className={subSortField === 'customer' ? 'text-emerald-600' : 'text-slate-400 opacity-50'} />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      if (subSortField === 'order_date') {
                        setSubSortAsc(!subSortAsc);
                      } else {
                        setSubSortField('order_date');
                        setSubSortAsc(true);
                      }
                    }}
                    className="py-2.5 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Order No & Date</span>
                      <ArrowUpDown size={10} className={subSortField === 'order_date' ? 'text-emerald-600' : 'text-slate-400 opacity-50'} />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      if (subSortField === 'product') {
                        setSubSortAsc(!subSortAsc);
                      } else {
                        setSubSortField('product');
                        setSubSortAsc(true);
                      }
                    }}
                    className="py-2.5 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Product & Plan</span>
                      <ArrowUpDown size={10} className={subSortField === 'product' ? 'text-emerald-600' : 'text-slate-400 opacity-50'} />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      if (subSortField === 'expiry') {
                        setSubSortAsc(!subSortAsc);
                      } else {
                        setSubSortField('expiry');
                        setSubSortAsc(true);
                      }
                    }}
                    className="py-2.5 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Expiry & Remaining</span>
                      <ArrowUpDown size={10} className={subSortField === 'expiry' ? 'text-emerald-600' : 'text-slate-400 opacity-50'} />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-250">Source</th>
                  <th className="py-2.5 px-3 border-r border-slate-250">Payment</th>
                  <th
                    onClick={() => {
                      if (subSortField === 'status') {
                        setSubSortAsc(!subSortAsc);
                      } else {
                        setSubSortField('status');
                        setSubSortAsc(true);
                      }
                    }}
                    className="py-2.5 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <ArrowUpDown size={10} className={subSortField === 'status' ? 'text-emerald-600' : 'text-slate-400 opacity-50'} />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 border-b border-slate-200">
                      <RefreshCw className="animate-spin inline-block mr-2 text-emerald-600" size={17} />
                      <span className="text-xs font-semibold">Loading customer subscriptions...</span>
                    </td>
                  </tr>
                ) : sortedSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 border-b border-slate-200">
                      <div className="max-w-sm mx-auto space-y-2">
                        <p className="text-xs font-semibold text-slate-600">No customer subscriptions found matching your filters.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setProductFilter('All Products');
                            setStatusFilter('All Status');
                            setExpiryFilter('All Dates');
                            setSubPage(1);
                          }}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSubscriptions.map((sub) => {
                    const formattedExpiry = sub.expiry_date ? new Date(sub.expiry_date).toISOString().slice(0, 10) : '-';
                    const remainingDays = getRemainingDays(sub.expiry_date);

                    return (
                      <tr key={sub.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-emerald-50/30 transition-colors group">

                        {/* Customer */}
                        <td className="py-2 px-3 border-r border-b border-slate-200/80 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-250 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 shadow-2xs">
                              {sub.customer_name ? sub.customer_name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-[11.5px] truncate max-w-[150px]">
                                {sub.customer_name}
                              </p>
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-600">
                                <span>{sub.whatsapp_number}</span>
                                {sub.whatsapp_number && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(sub.whatsapp_number);
                                      toast.success(`Copied: ${sub.whatsapp_number}`, { duration: 1500 });
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-emerald-600 transition-colors rounded cursor-pointer"
                                    title="Copy phone number"
                                  >
                                    <Copy size={10} />
                                  </button>
                                )}
                              </div>
                              {sub.email && (
                                <div className="flex items-center gap-1 text-[9.5px] text-slate-400">
                                  <span className="truncate max-w-[140px]" title={sub.email}>{sub.email}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(sub.email);
                                      toast.success(`Copied: ${sub.email}`, { duration: 1500 });
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-emerald-600 transition-colors rounded cursor-pointer shrink-0"
                                    title="Copy email"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Order No, Date & Time */}
                        <td className="py-2 px-3 border-r border-b border-slate-200/80 align-middle whitespace-nowrap">
                          {(() => {
                            const rawDate = sub.order_created_at || sub.created_at || sub.purchase_date;
                            if (!rawDate) return <span className="text-slate-400">-</span>;
                            const d = new Date(rawDate);
                            const isValid = !isNaN(d.getTime());
                            const formattedDate = isValid
                              ? d.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                              : (sub.purchase_date || '-');

                            const hasTime = !!(sub.order_created_at || sub.created_at) && isValid;
                            const formattedTime = hasTime ? d.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            }) : null;

                            return (
                              <div className="space-y-0.5">
                                <div>
                                  {sub.order_id ? (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                      Order #{sub.order_id}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                      Order #{sub.id}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 font-semibold text-slate-800 text-[10.5px]">
                                  <Calendar size={11} className="text-emerald-600 shrink-0" />
                                  <span>{formattedDate}</span>
                                </div>

                                {formattedTime && (
                                  <div className="flex items-center gap-1 text-[9.5px] text-slate-400 font-medium">
                                    <Clock size={10} className="text-slate-400 shrink-0" />
                                    <span>{formattedTime}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Product & Plan */}
                        <td className="py-2 px-3 border-r border-b border-slate-200/80 align-middle">
                          <div>
                            <span className="font-bold text-slate-900 text-[11px] block">{sub.product_name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{sub.package_plan}</span>
                          </div>
                        </td>

                        {/* Expiry & Remaining */}
                        <td className="py-2 px-3 border-r border-b border-slate-200/80 align-middle whitespace-nowrap">
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">{formattedExpiry}</div>
                            {(() => {
                              if (remainingDays === null) return null;
                              let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              let text = `${remainingDays}d left`;
                              if (remainingDays < 0) {
                                badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                                text = 'Expired';
                              } else if (remainingDays === 0) {
                                badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-black';
                                text = 'Expires Today';
                              } else if (remainingDays <= 3) {
                                badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold';
                              } else if (remainingDays <= 7) {
                                badgeStyle = 'bg-yellow-50 text-yellow-800 border-yellow-200 font-bold';
                              }
                              return (
                                <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9.5px] font-bold border mt-0.5 shadow-2xs ${badgeStyle}`}>
                                  {text}
                                </span>
                              );
                            })()}
                          </div>
                        </td>

                        {/* Source */}
                        <td className="py-2 px-3 border-r border-b border-slate-200/80 align-middle">
                          {formatSourceBadge(sub.customer_source)}
                        </td>

                        {/* Payment */}
                        <td className="py-2 px-3 border-r border-b border-slate-200/80 align-middle">
                          <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border shadow-2xs ${sub.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {sub.payment_status}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 border-r border-b border-slate-200/80 align-middle">
                          {formatStatusBadge(sub.status)}
                        </td>

                        {/* Action */}
                        <td className="py-2 px-3 border-b border-slate-200/80 align-middle text-right relative">
                          <div className="flex items-center justify-end gap-1.5">

                            {/* Direct WhatsApp Chat 1-Click Link Button */}
                            {sub.direct_whatsapp_url && (
                              <a
                                href={sub.direct_whatsapp_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                                title="Open Direct WhatsApp Chat with Reminder Text"
                              >
                                <MessageSquare size={13} />
                              </a>
                            )}

                            {/* Renew / View Button */}
                            {sub.status === 'Expiring Soon' || sub.status === 'Expired' ? (
                              <button
                                onClick={() => handleOpenDetailModal(sub)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] rounded-md transition-all shadow-2xs cursor-pointer"
                              >
                                Renew
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenDetailModal(sub)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] rounded-md border border-slate-200 transition-colors cursor-pointer"
                              >
                                Renew
                              </button>
                            )}

                            {/* More Actions Dropdown Toggle */}
                            <button
                              onClick={(e) => toggleActionMenu(e, sub)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${activeMenuSub?.id === sub.id
                                ? 'bg-slate-200 text-slate-900'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                              title="More actions"
                            >
                              <MoreVertical size={14} />
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

          {/* Table Footer / Legend & Pagination */}
          <div className="p-3 border-t border-slate-200/90 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[10.5px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Expiring Soon</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Expired</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Renewed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Cancelled</span>
            </div>

            {/* Pagination Info & Controls */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Showing {sortedSubscriptions.length === 0 ? 0 : ((subPage - 1) * subsPerPage) + 1} to {Math.min(subPage * subsPerPage, sortedSubscriptions.length)} of {sortedSubscriptions.length} entries
              </span>

              {totalSubPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={subPage === 1}
                    onClick={() => setSubPage(prev => Math.max(1, prev - 1))}
                    className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 transition-colors cursor-pointer shadow-2xs"
                    title="Previous Page"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {Array.from({ length: totalSubPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalSubPages || Math.abs(page - subPage) <= 1)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-1 text-slate-400 text-[10px]">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setSubPage(page)}
                          className={`w-6 h-6 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${subPage === page
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    type="button"
                    disabled={subPage >= totalSubPages}
                    onClick={() => setSubPage(prev => Math.min(totalSubPages, prev + 1))}
                    className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 transition-colors cursor-pointer shadow-2xs"
                    title="Next Page"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}


      {/* MODAL 2: CUSTOMER PROFILE & RENEWAL DRAWER matching UI concept */}
      {showDetailModal && selectedSubDetail && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowDetailModal(false)}
        >
          <div className="min-h-full flex items-center justify-center py-4 sm:py-8">
            <div
              className="bg-white border border-slate-200 rounded-2xl max-w-5xl lg:max-w-6xl w-full max-h-[88vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6 shadow-2xl text-left overflow-hidden text-slate-900 relative my-auto animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                    {selectedSubDetail.customer_name ? selectedSubDetail.customer_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">{selectedSubDetail.customer_name}</h3>
                      {formatStatusBadge(selectedSubDetail.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {selectedSubDetail.product_name} • {selectedSubDetail.package_plan} | WhatsApp: {selectedSubDetail.whatsapp_number}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        Order #{selectedSubDetail.order_id || selectedSubDetail.id}
                      </span>
                      {(selectedSubDetail.order_created_at || selectedSubDetail.created_at || selectedSubDetail.purchase_date) && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                          <Calendar size={11} className="text-emerald-600 shrink-0" />
                          <span>Date: {new Date(selectedSubDetail.order_created_at || selectedSubDetail.created_at || selectedSubDetail.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          {!!(selectedSubDetail.order_created_at || selectedSubDetail.created_at) && (
                            <>
                              <span className="text-slate-300">•</span>
                              <Clock size={11} className="text-slate-400 shrink-0" />
                              <span>{new Date(selectedSubDetail.order_created_at || selectedSubDetail.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  title="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content Area (Scrollable) */}
              <div className="overflow-y-auto mt-4 pr-1 flex-1 custom-scrollbar space-y-4 sm:space-y-5">

                {/* TOP SECTION: Renew Subscription (4-Column Responsive Grid) */}
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
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <RefreshCw className="text-emerald-600" size={16} />
                          Renew Subscription
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Select renewal package & license to dispatch renewal confirmation email
                        </span>
                      </div>

                      <form onSubmit={handleConfirmRenewal} className="space-y-3.5">
                        {/* 4-Grid System */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

                          {/* Grid 1: Renewal Date */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">Renewal Date</label>
                            <input
                              type="date"
                              required
                              value={renewForm.renewal_date}
                              onChange={(e) => {
                                const val = e.target.value;
                                const baseDate = new Date(val || new Date());
                                const nextExp = new Date(baseDate);
                                nextExp.setDate(nextExp.getDate() + (parseInt(renewForm.validity_days, 10) || 30));
                                setRenewForm(prev => ({
                                  ...prev,
                                  renewal_date: val,
                                  new_expiry_date: nextExp.toISOString().slice(0, 10)
                                }));
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Grid 2: Renewal Package */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-700">Renewal Package</label>
                              {renewPackages.length > 0 && (
                                <span className="text-[10px] text-emerald-700 font-semibold truncate">
                                  {renewPackages.length} options
                                </span>
                              )}
                            </div>
                            {renewPackages.length > 0 ? (
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

                                  const baseDate = new Date(renewForm.renewal_date || new Date());
                                  const nextExp = new Date(baseDate);
                                  nextExp.setDate(nextExp.getDate() + (parseInt(updatedValidity, 10) || 30));

                                  setRenewForm(prev => ({
                                    ...prev,
                                    package_plan: chosenVal,
                                    payment_amount: updatedAmount,
                                    validity_days: updatedValidity,
                                    new_expiry_date: nextExp.toISOString().slice(0, 10)
                                  }));

                                  // Dynamically fetch available licenses for this chosen package
                                  if (selectedSubDetail?.product_name) {
                                    fetchRenewLicenses(selectedSubDetail.product_name, chosenVal);
                                  }
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer truncate"
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
                            ) : (
                              <input
                                type="text"
                                value={renewForm.package_plan || ''}
                                onChange={(e) => setRenewForm({ ...renewForm, package_plan: e.target.value })}
                                placeholder="e.g. Monthly / Yearly"
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                              />
                            )}
                          </div>

                          {/* Grid 3: Validity Days & New Expiry */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1 truncate">Validity</label>
                              <select
                                value={renewForm.validity_days}
                                onChange={(e) => {
                                  const chosenDays = parseInt(e.target.value, 10) || 30;
                                  const baseDate = new Date(renewForm.renewal_date || new Date());
                                  const nextExp = new Date(baseDate);
                                  nextExp.setDate(nextExp.getDate() + chosenDays);

                                  setRenewForm(prev => ({
                                    ...prev,
                                    validity_days: chosenDays,
                                    new_expiry_date: nextExp.toISOString().slice(0, 10)
                                  }));
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                              >
                                <option value={30}>30 Days</option>
                                <option value={60}>60 Days</option>
                                <option value={90}>90 Days</option>
                                <option value={180}>180 Days</option>
                                <option value={365}>1 Year (365D)</option>
                                <option value={540}>18 Mo (540D)</option>
                                <option value={730}>2 Yrs (730D)</option>
                                <option value={1095}>3 Yrs (1095D)</option>
                                <option value={3650}>Lifetime</option>
                                {![30, 60, 90, 180, 365, 540, 730, 1095, 3650].includes(parseInt(renewForm.validity_days, 10)) && (
                                  <option value={renewForm.validity_days}>{renewForm.validity_days} Days</option>
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1 truncate">New Expiry</label>
                              <input
                                type="date"
                                required
                                value={renewForm.new_expiry_date}
                                onChange={(e) => setRenewForm({ ...renewForm, new_expiry_date: e.target.value })}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          {/* Grid 4: Payment Amount (BDT) */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Amount (BDT)</label>
                            <input
                              type="number"
                              required
                              value={renewForm.payment_amount}
                              onChange={(e) => setRenewForm({ ...renewForm, payment_amount: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Row 2: Product License (Span 2 cols) */}
                          <div className="col-span-1 sm:col-span-2 lg:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                <Key size={12} className={renewLicenses.length > 0 ? "text-emerald-600" : "text-slate-500"} />
                                Product License / Credentials
                              </label>
                              {loadingRenewLicenses ? (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <RefreshCw size={10} className="animate-spin text-emerald-600" />
                                  Checking stock...
                                </span>
                              ) : renewLicenses.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 size={10} />
                                  {renewLicenses.length} unused available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  No unused in stock (Blank field)
                                </span>
                              )}
                            </div>

                            {/* If unused licenses exist, show dropdown list */}
                            {renewLicenses.length > 0 ? (
                              <div className="space-y-1.5">
                                <select
                                  value={renewLicenseMode === 'dropdown' ? (renewForm.license_id || '') : 'manual'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'manual') {
                                      setRenewLicenseMode('manual');
                                      setRenewForm(prev => ({ ...prev, license_id: null, account_given: '' }));
                                    } else {
                                      setRenewLicenseMode('dropdown');
                                      const chosenId = parseInt(val, 10);
                                      const chosenLic = renewLicenses.find(l => l.id === chosenId);
                                      if (chosenLic) {
                                        setRenewForm(prev => ({
                                          ...prev,
                                          license_id: chosenLic.id,
                                          account_given: chosenLic.license_key,
                                          license_rules: chosenLic.rules || ''
                                        }));
                                      }
                                    }
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer truncate"
                                >
                                  {renewLicenses.map((lic) => {
                                    const optLabel = `${lic.activation_option ? `[${lic.activation_option}] ` : ''}${lic.license_key.length > 45 ? `${lic.license_key.substring(0, 45)}...` : lic.license_key} (#${lic.id})`;
                                    return (
                                      <option key={lic.id} value={lic.id}>
                                        {optLabel}
                                      </option>
                                    );
                                  })}
                                  <option value="manual">➕ Enter blank / custom credentials...</option>
                                </select>

                                {renewLicenseMode === 'dropdown' ? (
                                  <div className="bg-slate-100/90 border border-slate-200 rounded-lg p-2 text-xs flex items-center justify-between gap-2">
                                    <p className="font-mono text-slate-800 text-[11px] truncate font-medium flex-1">
                                      <span className="text-[10px] text-emerald-700 font-bold uppercase mr-1.5">Key:</span>
                                      {renewForm.account_given || 'No key selected'}
                                    </p>
                                    {renewForm.account_given && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(renewForm.account_given);
                                          toast.success('License key copied!');
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold shrink-0 cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200"
                                      >
                                        <Copy size={11} /> Copy
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <textarea
                                      rows={2}
                                      value={renewForm.account_given}
                                      onChange={(e) => setRenewForm({ ...renewForm, account_given: e.target.value })}
                                      placeholder="Type custom credentials..."
                                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (renewLicenses.length > 0) {
                                          setRenewLicenseMode('dropdown');
                                          setRenewForm(prev => ({
                                            ...prev,
                                            license_id: renewLicenses[0].id,
                                            account_given: renewLicenses[0].license_key,
                                            license_rules: renewLicenses[0].rules || ''
                                          }));
                                        }
                                      }}
                                      className="text-[10px] text-emerald-600 hover:underline mt-0.5 cursor-pointer"
                                    >
                                      ← Back to license stock list
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* If NO unused licenses, show blank text field */
                              <div>
                                <textarea
                                  rows={2}
                                  value={renewForm.account_given}
                                  onChange={(e) => setRenewForm({ ...renewForm, account_given: e.target.value })}
                                  placeholder="Enter digital license key, login credentials, or account details..."
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-400"
                                />
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] text-slate-400">Blank text field (manual entry).</span>
                                  {selectedSubDetail?.account_given && selectedSubDetail.account_given !== renewForm.account_given && (
                                    <button
                                      type="button"
                                      onClick={() => setRenewForm({ ...renewForm, account_given: selectedSubDetail.account_given })}
                                      className="text-[10px] text-emerald-600 hover:text-emerald-700 underline font-medium cursor-pointer"
                                    >
                                      Use Previous Account
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Row 2: Customer Email (Span 1 col) */}
                          <div className="col-span-1 sm:col-span-2 lg:col-span-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                <Mail size={12} className="text-emerald-600" />
                                Customer Email
                              </label>
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                <Send size={9} /> Auto-sends
                              </span>
                            </div>
                            <input
                              type="email"
                              value={renewForm.customer_email || ''}
                              onChange={(e) => setRenewForm({ ...renewForm, customer_email: e.target.value })}
                              placeholder="customer@email.com"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                            />
                            <p className="text-[10px] text-slate-400 truncate">
                              Sends renewal mail on confirm
                            </p>
                          </div>

                          {/* Row 2: Confirm Renewal Button (Span 1 col) */}
                          <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col justify-end">
                            <button
                              type="submit"
                              disabled={renewSubmitting}
                              className="w-full h-[38px] bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {renewSubmitting ? (
                                <>
                                  <RefreshCw size={14} className="animate-spin" />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={14} />
                                  <span>Confirm Renewal</span>
                                </>
                              )}
                            </button>
                          </div>

                        </div>
                      </form>
                    </div>
                  );
                })()}

                {/* BOTTOM SECTION: Renewal History & Reminder History Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

                  {/* 1. Renewal History */}
                  <div className="bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <History size={14} className="text-slate-600" />
                        Renewal History
                      </h4>
                      <span className="text-[10.5px] text-slate-500">Previous records preserved.</span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-250 bg-white shadow-2xs">
                      <table className="w-full min-w-[380px] text-left text-[10.5px] border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-250 text-slate-700 font-black uppercase text-[9.5px] bg-slate-100 tracking-wider">
                            <th className="py-2 px-2.5 border-r border-slate-250">Start Date</th>
                            <th className="py-2 px-2.5 border-r border-slate-250">End Date</th>
                            <th className="py-2 px-2.5 border-r border-slate-250">Amount</th>
                            <th className="py-2 px-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70">
                          {selectedSubDetail.renewals && selectedSubDetail.renewals.length > 0 ? (
                            selectedSubDetail.renewals.map((ren) => (
                              <tr key={ren.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-emerald-50/20 transition-colors">
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 text-slate-800 font-medium">{new Date(ren.start_date).toISOString().slice(0, 10)}</td>
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 text-slate-800 font-medium">{new Date(ren.end_date).toISOString().slice(0, 10)}</td>
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 font-bold text-emerald-700">BDT {ren.amount}</td>
                                <td className="py-1.75 px-2.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border shadow-2xs ${ren.status === 'Current' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                    {ren.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-3 text-center text-slate-400 font-medium">No renewal history recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2. Reminder History */}
                  <div className="bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Bell size={14} className="text-slate-600" />
                        Reminder History
                      </h4>
                      <span className="text-[10.5px] text-slate-500">Duplicate reminders prevented.</span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-250 bg-white shadow-2xs">
                      <table className="w-full min-w-[380px] text-left text-[10.5px] border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-250 text-slate-700 font-black uppercase text-[9.5px] bg-slate-100 tracking-wider">
                            <th className="py-2 px-2.5 border-r border-slate-250">Channel</th>
                            <th className="py-2 px-2.5 border-r border-slate-250">Scheduled</th>
                            <th className="py-2 px-2.5 border-r border-slate-250">Result</th>
                            <th className="py-2 px-2.5">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70">
                          {selectedSubDetail.reminders && selectedSubDetail.reminders.length > 0 ? (
                            selectedSubDetail.reminders.map((rem) => (
                              <tr key={rem.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-emerald-50/20 transition-colors">
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 text-slate-800 font-semibold">{rem.channel}</td>
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 text-slate-500">{new Date(rem.scheduled_at).toLocaleString()}</td>
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80">
                                  <span className={`font-bold ${rem.status === 'Sent' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {rem.status}
                                  </span>
                                </td>
                                <td className="py-1.75 px-2.5 text-slate-500">{rem.failure_reason || 'Delivered'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-3 text-center text-slate-400 font-medium">No automated reminders dispatched yet.</td>
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
        </div>,
        document.body
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
