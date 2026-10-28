import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../utils/api';
import * as XLSX from 'xlsx';
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
  RotateCcw,
  Store,
  Eye,
  EyeOff,
  ScrollText,
  UserX,
  XCircle,
  FileText,
  BookmarkPlus,
  Server,
  Save,
  Loader2,
  Download,
  FileSpreadsheet
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
    notRenewed: 0,
    totalCustomers: 0,
    totalSubscriptions: 0
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('All Products');
  const [productFilterInput, setProductFilterInput] = useState('');
  const [productFilterOpen, setProductFilterOpen] = useState(false);
  const productFilterRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [expiryFilter, setExpiryFilter] = useState('All Dates');
  const [uniqueCustomerOnly, setUniqueCustomerOnly] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [subSortField, setSubSortField] = useState('order_no');
  const [subSortAsc, setSubSortAsc] = useState(false);
  const [subPage, setSubPage] = useState(1);

  // Active stat card calculation - returns null on initial load so NO card is active by default
  const activeStatCard = React.useMemo(() => {
    if (uniqueCustomerOnly) return 'uniqueCustomer';
    if (expiryFilter === 'today' && statusFilter === 'All Status') return 'expiringToday';
    if (expiryFilter === '3days' && statusFilter === 'All Status') return 'within3Days';
    if (expiryFilter === '7days' && statusFilter === 'All Status') return 'within7Days';
    if (statusFilter === 'Active' && expiryFilter === 'All Dates') return 'active';
    if (statusFilter === 'Expired' && expiryFilter === 'All Dates') return 'expired';
    if (statusFilter === 'Renewed' && expiryFilter === 'All Dates') return 'renewed';
    if (statusFilter === 'Not Renewed' && expiryFilter === 'All Dates') return 'notRenewed';
    return null;
  }, [uniqueCustomerOnly, expiryFilter, statusFilter]);

  // Click handler for 8 dashboard stat cards - filters data and allows toggling off
  const handleStatCardClick = (cardKey) => {
    setActiveSubTab('subscriptions');
    setSubPage(1);

    // If already active, toggle off and reset to default all subscriptions view
    if (activeStatCard === cardKey) {
      setStatusFilter('All Status');
      setExpiryFilter('All Dates');
      setUniqueCustomerOnly(false);
      return;
    }

    switch (cardKey) {
      case 'active':
        setUniqueCustomerOnly(false);
        setStatusFilter('Active');
        setExpiryFilter('All Dates');
        break;
      case 'expiringToday':
        setUniqueCustomerOnly(false);
        setStatusFilter('All Status');
        setExpiryFilter('today');
        break;
      case 'within3Days':
        setUniqueCustomerOnly(false);
        setStatusFilter('All Status');
        setExpiryFilter('3days');
        break;
      case 'within7Days':
        setUniqueCustomerOnly(false);
        setStatusFilter('All Status');
        setExpiryFilter('7days');
        break;
      case 'expired':
        setUniqueCustomerOnly(false);
        setStatusFilter('Expired');
        setExpiryFilter('All Dates');
        break;
      case 'renewed':
        setUniqueCustomerOnly(false);
        setStatusFilter('Renewed');
        setExpiryFilter('All Dates');
        break;
      case 'notRenewed':
        setUniqueCustomerOnly(false);
        setStatusFilter('Not Renewed');
        setExpiryFilter('All Dates');
        break;
      case 'uniqueCustomer':
        setUniqueCustomerOnly(true);
        setStatusFilter('All Status');
        setExpiryFilter('All Dates');
        break;
      default:
        setUniqueCustomerOnly(false);
        setStatusFilter('All Status');
        setExpiryFilter('All Dates');
        break;
    }
  };

  // Excel Export state
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const [headerExportMenuOpen, setHeaderExportMenuOpen] = useState(false);
  const headerExportMenuRef = useRef(null);

  // Modals & Forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const customerFormRef = useRef(null);
  const [editingSub, setEditingSub] = useState(null); // null = Add, object = Edit
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubDetail, setSelectedSubDetail] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSub, setViewingSub] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [inlineCredsEdit, setInlineCredsEdit] = useState(false);
  const [inlineCredsValue, setInlineCredsValue] = useState('');
  const [inlineDigitalAccId, setInlineDigitalAccId] = useState('');
  const [savingInlineCreds, setSavingInlineCreds] = useState(false);
  const [togglingNotRenewedId, setTogglingNotRenewedId] = useState(null);

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
    status: 'Active',
    notes: '',
    customer_notes: '',
    admin_notes: '',
    order_id: '',
    vendor_id: '',
    vendor_price: '',
    digital_account_id: '',
    send_email: true
  });
  const [digitalAccounts, setDigitalAccounts] = useState([]);
  const [loadingDigitalAccounts, setLoadingDigitalAccounts] = useState(false);
  const [allUsageRules, setAllUsageRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [vendors, setVendors] = useState([]);
  const [subFormSubmitting, setSubFormSubmitting] = useState(false);

  // Renewal form state
  const [renewForm, setRenewForm] = useState({
    renewal_date: new Date().toISOString().slice(0, 10),
    validity_days: 30,
    package_plan: '',
    new_expiry_date: '',
    payment_amount: '',
    notes: 'Subscription renewed',
    customer_notes: '',
    admin_notes: '',
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

  // Customer Note Templates state
  const [noteTemplates, setNoteTemplates] = useState([]);
  const [loadingNoteTemplates, setLoadingNoteTemplates] = useState(false);
  const [showManageTemplatesModal, setShowManageTemplatesModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // null = new, object = editing
  const [templateForm, setTemplateForm] = useState({ title: '', content: '' });
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState('list'); // 'list' | 'add'

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
    const menuWidth = 168;
    const menuHeight = 230;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight;
    setMenuPosition({
      top: openUp ? Math.max(10, rect.top - menuHeight) : (rect.bottom + 4),
      left: Math.max(10, rect.right - menuWidth),
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

  const filteredProductOptions = React.useMemo(() => {
    const q = (productFilterInput || '').trim().toLowerCase();
    if (!q) return combinedProducts;
    return combinedProducts.filter(p => (p.name || '').toLowerCase().includes(q));
  }, [combinedProducts, productFilterInput]);

  const handleSelectProduct = (productName) => {
    setProductFilter(productName);
    setProductFilterInput(productName === 'All Products' ? '' : productName);
    setProductFilterOpen(false);
    setSubPage(1);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (productFilterRef.current && !productFilterRef.current.contains(e.target)) {
        setProductFilterOpen(false);
        setProductFilterInput(productFilter === 'All Products' ? '' : productFilter);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
      if (headerExportMenuRef.current && !headerExportMenuRef.current.contains(e.target)) {
        setHeaderExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [productFilter]);

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

  // Product Usage Rules matching only the current selected product in form
  const matchingProductRules = React.useMemo(() => {
    if (!subForm.product_name) return [];
    const normalize = (str) => (str || '').trim().toLowerCase().replace(/[\s\-_–—|]+/g, ' ');
    const targetName = normalize(subForm.product_name);

    const matchedCatalogProd = catalogProducts.find(
      p => p.name && (normalize(p.name) === targetName || normalize(p.name).includes(targetName) || targetName.includes(normalize(p.name)))
    );
    const targetId = matchedCatalogProd ? matchedCatalogProd.id : null;

    return allUsageRules.filter(r => {
      if (r.is_active === 0) return false;
      if (targetId && r.product_id === targetId) return true;
      if (r.product_name) {
        const rName = normalize(r.product_name);
        if (rName === targetName || rName.includes(targetName) || targetName.includes(rName)) {
          return true;
        }
      }
      return false;
    });
  }, [allUsageRules, subForm.product_name, catalogProducts]);

  const getStatusPriority = (status) => {
    switch (status) {
      case 'Expired': return 1;
      case 'Not Renewed': return 2;
      case 'Expiring Soon': return 3;
      case 'Active': return 4;
      case 'Renewed': return 5;
      case 'Cancelled': return 6;
      default: return 7;
    }
  };

  const subsPerPage = 15;
  const sortedSubscriptions = React.useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      let comparison = 0;
      if (subSortField === 'order_no') {
        const numA = parseInt(a.order_id || a.id, 10) || 0;
        const numB = parseInt(b.order_id || b.id, 10) || 0;
        comparison = numA - numB;
      } else if (subSortField === 'expiry' || subSortField === 'status') {
        const pA = getStatusPriority(a.status);
        const pB = getStatusPriority(b.status);
        if (pA !== pB) {
          comparison = pA - pB;
        } else {
          const expA = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
          const expB = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
          if (a.status === 'Expired' || a.status === 'Not Renewed') {
            comparison = expB - expA; // Most recently expired first
          } else {
            comparison = expA - expB; // Expiring soonest first
          }
        }
      } else if (subSortField === 'expiry_date_only') {
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
      } else if (subSortField === 'amount') {
        comparison = (parseFloat(a.selling_price) || 0) - (parseFloat(b.selling_price) || 0);
      }
      return subSortAsc ? comparison : -comparison;
    });
  }, [subscriptions, subSortField, subSortAsc]);

  // Filter subscriptions - when uniqueCustomerOnly is active, deduplicate by customer
  const filteredSubscriptions = React.useMemo(() => {
    if (!uniqueCustomerOnly) {
      return sortedSubscriptions;
    }
    const seenEmails = new Set();
    const seenPhones = new Set();
    const seenNames = new Set();
    const seenIds = new Set();

    return sortedSubscriptions.filter(sub => {
      const cleanEmail = (sub.email || '').trim().toLowerCase();
      const cleanPhone = (sub.whatsapp_number || '').trim();
      const cleanName = (sub.customer_name || '').trim().toLowerCase();

      if (cleanEmail && seenEmails.has(cleanEmail)) {
        return false;
      }
      if (cleanPhone && seenPhones.has(cleanPhone)) {
        return false;
      }
      if (!cleanEmail && !cleanPhone && cleanName && seenNames.has(cleanName)) {
        return false;
      }
      if (!cleanEmail && !cleanPhone && !cleanName && seenIds.has(sub.id)) {
        return false;
      }

      if (cleanEmail) seenEmails.add(cleanEmail);
      if (cleanPhone) seenPhones.add(cleanPhone);
      if (cleanName) seenNames.add(cleanName);
      seenIds.add(sub.id);
      return true;
    });
  }, [sortedSubscriptions, uniqueCustomerOnly]);

  const totalSubPages = Math.ceil(filteredSubscriptions.length / subsPerPage) || 1;
  const paginatedSubscriptions = React.useMemo(() => {
    return filteredSubscriptions.slice((subPage - 1) * subsPerPage, subPage * subsPerPage);
  }, [filteredSubscriptions, subPage, subsPerPage]);

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
              license_rules: prev.license_rules || match.rules || ''
            };
          } else {
            return {
              ...prev,
              selected_license_id: licList[0].id,
              account_given: licList[0].license_key,
              license_rules: prev.license_rules || licList[0].rules || ''
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

  const fetchDigitalAccounts = async () => {
    try {
      setLoadingDigitalAccounts(true);
      const res = await api.get('/digital-licenses');
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setDigitalAccounts(list);
    } catch (err) {
      console.error('Failed to fetch digital license accounts:', err);
    } finally {
      setLoadingDigitalAccounts(false);
    }
  };

  const isAccountMatchingProduct = (acc, productName) => {
    if (!acc || !productName) return false;
    const target = (productName || '').toLowerCase().trim();
    const accName = (acc.product_name || '').toLowerCase().trim();
    if (!accName || !target) return false;
    if (accName === target) return true;
    if (target.includes(accName) || accName.includes(target)) return true;

    // Check catalog products for product_id matching
    const matchedCatalogProd = catalogProducts.find(p => p.name && p.name.toLowerCase().trim() === target);
    if (matchedCatalogProd && acc.product_id && String(acc.product_id) === String(matchedCatalogProd.id)) {
      return true;
    }

    const targetWords = target.split(/[\s–—\-_,./\\|()]+/).filter(w => w.length > 2);
    const accWords = accName.split(/[\s–—\-_,./\\|()]+/).filter(w => w.length > 2);
    const common = accWords.filter(w => targetWords.includes(w));
    if (common.length >= 2) return true;
    if (common.length === 1 && (accWords.length === 1 || ['adobe', 'creative', 'canva', 'chatgpt', 'netflix', 'spotify', 'zoom', 'antivirus', 'office', '365', 'prime', 'youtube', 'vpn', 'crunchyroll', 'nordvpn', 'surfshark', 'coursera', 'duolingo', 'grammarly', 'quillbot', 'freepik', 'envato'].includes(common[0]))) {
      return true;
    }
    return false;
  };

  const isAccountMatchingPackage = (acc, packagePlan) => {
    if (!packagePlan || !packagePlan.trim()) return true;
    if (!acc.package_name || !acc.package_name.trim()) {
      return true; // Generic account without specific package restriction
    }

    const planLower = packagePlan.toLowerCase().trim();
    const accPkgLower = acc.package_name.toLowerCase().trim();

    // 1. Direct equality
    if (planLower === accPkgLower) return true;

    // 2. Contains check
    if (planLower.includes(accPkgLower) || accPkgLower.includes(planLower)) return true;

    // 3. Tokenized keyword matching
    const tokenize = (str) =>
      str
        .toLowerCase()
        .replace(/[\-_–—|/\\(),.]+/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);

    const planWords = tokenize(planLower);
    const accWords = tokenize(accPkgLower);

    const commonWords = accWords.filter(w => planWords.includes(w));
    if (commonWords.length > 0) return true;

    return false;
  };

  const matchingDigitalAccounts = React.useMemo(() => {
    if (!subForm.product_name || !subForm.product_name.trim()) {
      return [];
    }

    // 1. Filter accounts by product first
    const productAccounts = digitalAccounts.filter(acc => 
      isAccountMatchingProduct(acc, subForm.product_name) ||
      (editingSub && subForm.digital_account_id && String(acc.id) === String(subForm.digital_account_id))
    );

    // If no package_plan specified, return all product accounts
    if (!subForm.package_plan || !subForm.package_plan.trim()) {
      return productAccounts;
    }

    // 2. Separate into accounts matching the specific package and generic accounts
    const exactPackageAccounts = [];
    const genericAccounts = [];

    productAccounts.forEach(acc => {
      // If currently editing and this account is already assigned to this subscription, keep it
      if (editingSub && subForm.digital_account_id && String(acc.id) === String(subForm.digital_account_id)) {
        exactPackageAccounts.push(acc);
        return;
      }

      if (acc.package_name && acc.package_name.trim()) {
        if (isAccountMatchingPackage(acc, subForm.package_plan)) {
          exactPackageAccounts.push(acc);
        }
      } else {
        genericAccounts.push(acc);
      }
    });

    // If there are accounts matching the specific package, show those (and include generic accounts as fallback)
    if (exactPackageAccounts.length > 0) {
      return [...exactPackageAccounts, ...genericAccounts];
    }

    // If no account specifically has this package tagged, allow generic accounts
    return genericAccounts;
  }, [digitalAccounts, subForm.product_name, subForm.package_plan, subForm.digital_account_id, editingSub, catalogProducts]);

  // Auto-clear or auto-select digital_account_id if selected account is no longer matching product & package
  React.useEffect(() => {
    if (subForm.digital_account_id) {
      const isStillMatching = matchingDigitalAccounts.some(acc => String(acc.id) === String(subForm.digital_account_id));
      if (!isStillMatching) {
        const firstAvailable = matchingDigitalAccounts.find(a => a.available_slots > 0) || matchingDigitalAccounts[0];
        setSubForm(prev => ({
          ...prev,
          digital_account_id: firstAvailable ? String(firstAvailable.id) : ''
        }));
      }
    } else if (matchingDigitalAccounts.length > 0 && showAddForm && !editingSub) {
      const bestMatch = matchingDigitalAccounts.find(a => a.available_slots > 0 && a.package_name && isAccountMatchingPackage(a, subForm.package_plan)) ||
        matchingDigitalAccounts.find(a => a.available_slots > 0) ||
        matchingDigitalAccounts[0];
      if (bestMatch) {
        setSubForm(prev => prev.digital_account_id ? prev : ({ ...prev, digital_account_id: String(bestMatch.id) }));
      }
    }
  }, [matchingDigitalAccounts, subForm.digital_account_id, showAddForm, editingSub, subForm.package_plan]);

  const selectedDigitalAccount = React.useMemo(() => {
    if (!subForm.digital_account_id) return null;
    return digitalAccounts.find(a => String(a.id) === String(subForm.digital_account_id)) || null;
  }, [digitalAccounts, subForm.digital_account_id]);

  const handleDigitalAccountChange = (accId) => {
    setSubForm(prev => ({
      ...prev,
      digital_account_id: accId || ''
    }));
  };

  const handleOrderLookup = async (orderIdToLookup) => {
    const cleanId = String(orderIdToLookup || '').replace(/[^0-9]/g, '');
    if (!cleanId) return;
    try {
      const res = await api.get(`/digital-licenses/order-lookup/${cleanId}`);
      const ord = res?.order || res;
      if (ord) {
        const rawEmail = (ord.delivery_email || (ord.user_role !== 'admin' ? ord.customer_email : '') || '').trim();
        const resolvedEmail = (rawEmail && !rawEmail.includes('@guest.')) ? rawEmail : '';
        const resolvedName = ((ord.customer_name && ord.customer_name.trim()) ? ord.customer_name.trim() : (ord.user_role !== 'admin' ? (ord.user_name || '') : '')).trim();
        setSubForm(prev => ({
          ...prev,
          customer_name: prev.customer_name || resolvedName,
          whatsapp_number: prev.whatsapp_number || ord.user_whatsapp || ord.phone || '',
          email: prev.email || resolvedEmail,
          selling_price: (!prev.selling_price || prev.selling_price === '0') ? (ord.total_amount ? String(ord.total_amount) : prev.selling_price) : prev.selling_price
        }));
        toast.success(`Loaded details from Order #${cleanId}!`);
      }
    } catch (err) {
      // Order lookup is optional
    }
  };

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

  const fetchSubscriptions = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
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

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch vendors for subscriptions:', err);
    }
  };

  const fetchUsageRules = async () => {
    try {
      setLoadingRules(true);
      const res = await api.get('/product-usage-rules');
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setAllUsageRules(list);
    } catch (err) {
      console.error('Failed to fetch product usage rules for subscriptions:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const fetchNoteTemplates = async () => {
    try {
      setLoadingNoteTemplates(true);
      const res = await api.get('/subscriptions/note-templates');
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setNoteTemplates(list);
    } catch (err) {
      console.error('Failed to fetch note templates:', err);
    } finally {
      setLoadingNoteTemplates(false);
    }
  };

  // Fetch initial catalog products, settings, vendors, digital accounts, usage rules & note templates on mount
  useEffect(() => {
    fetchCatalogProducts();
    fetchSettings();
    fetchVendors();
    fetchDigitalAccounts();
    fetchUsageRules();
    fetchNoteTemplates();
  }, []);

  // Auto-load matching product rules if rules were fetched after form opened
  useEffect(() => {
    if (!showAddForm || editingSub) return;
    if (matchingProductRules.length > 0) {
      const alreadyChosen = matchingProductRules.find(r => String(r.id) === String(selectedRuleId));
      if (!alreadyChosen && selectedRuleId !== '__custom__' && selectedRuleId !== '__none__') {
        const topRule = matchingProductRules[0];
        setSelectedRuleId(String(topRule.id));
        setSubForm(prev => ({
          ...prev,
          license_rules: topRule.rules_text || ''
        }));
      }
    } else {
      if (selectedRuleId !== '__custom__' && selectedRuleId !== '__none__') {
        setSelectedRuleId('__none__');
        setSubForm(prev => ({
          ...prev,
          license_rules: ''
        }));
      }
    }
  }, [matchingProductRules, showAddForm, editingSub, selectedRuleId]);

  const handleUsageRuleChange = (val) => {
    setSelectedRuleId(val);
    if (val === '__none__') {
      setSubForm(prev => ({ ...prev, license_rules: '' }));
    } else if (val === '__custom__') {
      // Keep whatever text is currently typed/edited
    } else {
      const chosen = allUsageRules.find(r => String(r.id) === String(val));
      if (chosen) {
        setSubForm(prev => ({ ...prev, license_rules: chosen.rules_text || '' }));
      }
    }
  };

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
    fetchDigitalAccounts();
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

    let defaultRuleText = '';
    let defaultRuleId = '__none__';
    if (catalogProducts.length > 0 && allUsageRules.length > 0) {
      const prod0 = catalogProducts[0];
      const normalize = (str) => (str || '').trim().toLowerCase().replace(/[\s\-_–—|]+/g, ' ');
      const prod0Norm = normalize(prod0.name);
      const foundRule = allUsageRules.find(r =>
        r.is_active !== 0 && (
          (prod0.id && r.product_id === prod0.id) ||
          (r.product_name && (normalize(r.product_name) === prod0Norm || normalize(r.product_name).includes(prod0Norm) || prod0Norm.includes(normalize(r.product_name))))
        )
      );
      if (foundRule) {
        defaultRuleText = foundRule.rules_text || '';
        defaultRuleId = String(foundRule.id);
      }
    }
    setSelectedRuleId(defaultRuleId);

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
      license_rules: defaultRuleText,
      selling_price: defaultPrice,
      payment_status: 'Paid',
      notes: '',
      customer_notes: '',
      admin_notes: '',
      order_id: '',
      vendor_id: '',
      vendor_price: '',
      digital_account_id: '',
      send_email: true
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
    fetchDigitalAccounts();
    const subProd = sub.product_name || '';
    const existingRules = sub.license_rules || '';
    const matchedEditRule = allUsageRules.find(r =>
      r.rules_text && existingRules && r.rules_text.trim() === existingRules.trim()
    );
    setSelectedRuleId(matchedEditRule ? String(matchedEditRule.id) : (existingRules ? '__custom__' : '__none__'));

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
      license_rules: existingRules,
      selling_price: sub.selling_price || '',
      payment_status: sub.payment_status || 'Paid',
      status: sub.status || 'Active',
      notes: sub.admin_notes || sub.notes || '',
      customer_notes: sub.customer_notes || '',
      admin_notes: sub.admin_notes || sub.notes || '',
      order_id: sub.order_id || '',
      vendor_id: sub.vendor_id || '',
      vendor_price: sub.vendor_price !== undefined && sub.vendor_price !== null ? String(sub.vendor_price) : '',
      digital_account_id: sub.digital_account_id ? String(sub.digital_account_id) : '',
      send_email: false
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

      // Check if logged in user is admin and prevent accidental admin email submission
      let currentLoggedUser = null;
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) currentLoggedUser = JSON.parse(storedUser);
      } catch (e) {}

      let cleanEmail = (subForm.email || '').trim();
      if (currentLoggedUser?.email && cleanEmail.toLowerCase() === currentLoggedUser.email.toLowerCase()) {
        cleanEmail = '';
      }

      const payload = {
        ...subForm,
        email: cleanEmail,
        product_name: targetProductName,
        order_id: subForm.order_id ? parseInt(subForm.order_id, 10) : null,
        vendor_id: subForm.vendor_id ? parseInt(subForm.vendor_id, 10) : null,
        vendor_price: subForm.vendor_price !== '' && subForm.vendor_price !== null ? parseFloat(subForm.vendor_price) : 0,
        license_id: (licenseInputMode === 'dropdown' && subForm.selected_license_id) ? subForm.selected_license_id : null,
        digital_account_id: subForm.digital_account_id ? parseInt(subForm.digital_account_id, 10) : null,
        send_email: Boolean(cleanEmail && subForm.send_email !== false)
      };

      if (editingSub) {
        await api.put(`/subscriptions/${editingSub.id}`, payload);
        toast.success('Subscription updated successfully!');
      } else {
        const res = await api.post('/subscriptions', payload);
        toast.success(res?.message || 'Customer subscription added successfully!');
      }

      setShowAddForm(false);
      setEditingSub(null);
      await fetchSubscriptions(true);
      fetchDigitalAccounts();
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
      customer_notes: '',
      admin_notes: '',
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
        if (freshData?.customer_email && !sub.email && freshData?.user_role !== 'admin') {
          setRenewForm(prev => ({ ...prev, customer_email: freshData.customer_email }));
        }
      }
    } catch (fetchErr) {
      console.warn('Background fetch for subscription details:', fetchErr.message);
    }
  };

  // Open Full View Details Modal
  const handleOpenViewModal = async (sub) => {
    setShowCredentials(false);
    setInlineCredsEdit(false);
    setInlineCredsValue('');
    setInlineDigitalAccId('');
    setViewingSub({
      ...sub,
      renewals: sub.renewals || [],
      reminders: sub.reminders || []
    });
    setShowViewModal(true);
    setActiveMenuSub(null);

    try {
      const res = await api.get(`/subscriptions/${sub.id}`);
      const freshData = (res && typeof res === 'object' && !res.data) ? res : (res?.data || {});
      if (freshData && freshData.id) {
        setViewingSub(prev => ({
          ...prev,
          ...freshData,
          renewals: freshData.renewals || prev?.renewals || [],
          reminders: freshData.reminders || prev?.reminders || []
        }));
      }
    } catch (err) {
      console.warn('Background fetch for subscription details error:', err.message);
    }
  };

  // Save inline credentials from View Modal
  const handleSaveInlineCredentials = async () => {
    if (!viewingSub) return;
    try {
      setSavingInlineCreds(true);
      const accId = inlineDigitalAccId ? parseInt(inlineDigitalAccId, 10) : null;
      await api.put(`/subscriptions/${viewingSub.id}`, {
        ...viewingSub,
        account_given: inlineCredsValue,
        digital_account_id: accId
      });

      // Re-fetch detail to get fresh slot info and joined renewal row
      const res = await api.get(`/subscriptions/${viewingSub.id}`);
      const freshData = (res && typeof res === 'object' && !res.data) ? res : (res?.data || {});
      if (freshData && freshData.id) {
        setViewingSub(prev => ({
          ...prev,
          ...freshData,
          renewals: freshData.renewals || prev?.renewals || [],
          reminders: freshData.reminders || prev?.reminders || []
        }));
      } else {
        setViewingSub(prev => ({
          ...prev,
          account_given: inlineCredsValue,
          digital_account_id: accId
        }));
      }

      // Also update in subscriptions list
      setSubscriptions(prev => prev.map(s => s.id === viewingSub.id ? {
        ...s,
        account_given: inlineCredsValue,
        digital_account_id: accId
      } : s));

      setInlineCredsEdit(false);
      toast.success('Account credentials saved & history updated!');
    } catch (err) {
      console.error('Failed to save credentials:', err);
      toast.error('Failed to save credentials: ' + (err.message || ''));
    } finally {
      setSavingInlineCreds(false);
    }
  };

  // Copy structured subscription summary to clipboard
  const handleCopySubscriptionSummary = (sub) => {
    if (!sub) return;
    const lines = [
      `📋 Subscription Summary:`,
      `Customer: ${sub.customer_name}`,
      `WhatsApp: ${sub.whatsapp_number || 'N/A'}`,
      sub.email ? `Email: ${sub.email}` : null,
      `Product: ${sub.product_name}`,
      `Plan: ${sub.package_plan}`,
      `Order: #${sub.order_id || sub.id}`,
      `Validity: ${sub.validity_days || 30} Days`,
      `Expiry Date: ${sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}`,
      `Selling Price: ৳${sub.selling_price || 0}`,
      `Status: ${sub.status}`,
      sub.account_given ? `Credentials: ${sub.account_given}` : null,
      sub.customer_notes ? `Customer Notes: ${sub.customer_notes}` : null,
      (sub.admin_notes || sub.notes) ? `Admin Notes: ${sub.admin_notes || sub.notes}` : null
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Subscription details copied to clipboard!');
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
      fetchSubscriptions(true);
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
      fetchSubscriptions(true);
    } catch (err) {
      toast.error('Failed to delete subscription.');
    }
  };

  const handleToggleNotRenewed = async (sub, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!sub || !sub.id) return;
    if (togglingNotRenewedId === sub.id) return;

    const isCurrentlyNotRenewed = sub.status === 'Not Renewed';
    const isPastExpiry = sub.expiry_date && new Date(sub.expiry_date).getTime() < new Date().setHours(0, 0, 0, 0);
    const newStatus = isCurrentlyNotRenewed
      ? (isPastExpiry ? 'Expired' : 'Active')
      : 'Not Renewed';

    setTogglingNotRenewedId(sub.id);

    // Optimistically update list and modal
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: newStatus } : s));
    if (selectedSubDetail && selectedSubDetail.id === sub.id) {
      setSelectedSubDetail(prev => prev ? ({ ...prev, status: newStatus }) : null);
    }

    try {
      await api.put(`/subscriptions/${sub.id}/status`, { status: newStatus });
      toast.success(isCurrentlyNotRenewed ? `Subscription marked as ${newStatus}` : 'Marked as Not Renewed');
      await fetchSubscriptions(true);
    } catch (err) {
      console.error('Error updating status:', err);
      // Revert optimistic update on failure
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: sub.status } : s));
      if (selectedSubDetail && selectedSubDetail.id === sub.id) {
        setSelectedSubDetail(prev => prev ? ({ ...prev, status: sub.status }) : null);
      }
      toast.error(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setTogglingNotRenewedId(null);
    }
  };

  const handleSelectNoteTemplate = (templateId, targetForm = 'subForm') => {
    if (!templateId) return;
    const tpl = noteTemplates.find(t => String(t.id) === String(templateId));
    if (!tpl) return;

    if (targetForm === 'subForm') {
      setSubForm(prev => ({
        ...prev,
        customer_notes: tpl.content
      }));
    } else if (targetForm === 'renewForm') {
      setRenewForm(prev => ({
        ...prev,
        customer_notes: tpl.content
      }));
    }
    toast.success(`Applied template: "${tpl.title}"`);
  };

  const handleQuickSaveAsTemplate = (currentNote) => {
    setEditingTemplate(null);
    setTemplateForm({
      title: '',
      content: (currentNote || '').trim()
    });
    setActiveTemplateTab('add');
    setShowManageTemplatesModal(true);
  };

  const handleStartEditTemplate = (tpl) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      title: tpl.title || '',
      content: tpl.content || ''
    });
    setActiveTemplateTab('add');
  };

  const handleSaveTemplate = async (e) => {
    e?.preventDefault();
    const tTitle = (templateForm.title || '').trim();
    const tContent = (templateForm.content || '').trim();

    if (!tTitle) {
      toast.error('Template title is required.');
      return;
    }
    if (!tContent) {
      toast.error('Template content is required.');
      return;
    }

    try {
      setTemplateSubmitting(true);
      if (editingTemplate) {
        await api.put(`/subscriptions/note-templates/${editingTemplate.id}`, {
          title: tTitle,
          content: tContent
        });
        toast.success('Template updated successfully!');
      } else {
        await api.post('/subscriptions/note-templates', {
          title: tTitle,
          content: tContent
        });
        toast.success('New template saved successfully!');
      }
      setEditingTemplate(null);
      setTemplateForm({ title: '', content: '' });
      setActiveTemplateTab('list');
      fetchNoteTemplates();
    } catch (err) {
      console.error('Save template error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save template.');
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete template "${title}"?`)) return;
    try {
      await api.delete(`/subscriptions/note-templates/${id}`);
      toast.success('Template deleted.');
      if (editingTemplate?.id === id) {
        setEditingTemplate(null);
        setTemplateForm({ title: '', content: '' });
      }
      fetchNoteTemplates();
    } catch (err) {
      console.error('Delete template error:', err);
      toast.error('Failed to delete template.');
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
      case 'Not Renewed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Not Renewed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {status || 'Cancelled'}</span>;
    }
  };

  const hasActiveFilters = Boolean(
    uniqueCustomerOnly ||
    searchQuery ||
    (productFilter && productFilter !== 'All Products') ||
    (statusFilter && statusFilter !== 'All Status') ||
    (expiryFilter && expiryFilter !== 'All Dates') ||
    (sourceFilter && sourceFilter !== 'All Sources')
  );

  const handleExportExcel = async (mode = 'auto') => {
    // mode: 'auto' | 'filtered' | 'all'
    try {
      setExportingExcel(true);
      let dataToExport = [];
      let isFilteredExport = false;

      if (mode === 'all') {
        if (!hasActiveFilters && subscriptions.length > 0) {
          dataToExport = filteredSubscriptions;
        } else {
          // Fetch complete list from backend
          const res = await api.get('/subscriptions');
          const data = res?.subscriptions !== undefined ? res : (res?.data || {});
          dataToExport = data.subscriptions || [];
        }
        isFilteredExport = false;
      } else if (mode === 'filtered') {
        dataToExport = filteredSubscriptions;
        isFilteredExport = true;
      } else {
        if (hasActiveFilters) {
          dataToExport = filteredSubscriptions;
          isFilteredExport = true;
        } else {
          dataToExport = filteredSubscriptions.length > 0 ? filteredSubscriptions : subscriptions;
          isFilteredExport = false;
        }
      }

      if (!dataToExport || dataToExport.length === 0) {
        toast.error('No subscriptions found to export.');
        return;
      }

      const rows = dataToExport.map((sub, idx) => {
        const remDays = getRemainingDays(sub.expiry_date);
        let remainingText = '-';
        if (remDays !== null) {
          if (remDays < 0) remainingText = `Expired (${Math.abs(remDays)}d ago)`;
          else if (remDays === 0) remainingText = 'Expires Today';
          else remainingText = `${remDays} days left`;
        }

        const purchaseDateStr = sub.purchase_date
          ? new Date(sub.purchase_date).toISOString().slice(0, 10)
          : (sub.order_created_at ? new Date(sub.order_created_at).toISOString().slice(0, 10) : '-');

        const expiryDateStr = sub.expiry_date
          ? new Date(sub.expiry_date).toISOString().slice(0, 10)
          : '-';

        const sellPrice = parseFloat(sub.selling_price) || 0;
        const venPrice = parseFloat(sub.vendor_price) || 0;
        const profit = sellPrice - venPrice;

        return {
          'SL': idx + 1,
          'Order ID': sub.order_id ? `#${sub.order_id}` : (sub.id ? `SUB-${sub.id}` : '-'),
          'Customer Name': sub.customer_name || 'N/A',
          'WhatsApp / Phone': sub.whatsapp_number || '-',
          'Email': sub.email || '-',
          'Product Name': sub.product_name || '-',
          'Package / Plan': sub.package_plan || '-',
          'Source': sub.customer_source || 'Website',
          'Purchase Date': purchaseDateStr,
          'Validity (Days)': sub.validity_days || 30,
          'Expiry Date': expiryDateStr,
          'Remaining Days': remainingText,
          'Status': sub.status || 'Active',
          'Selling Price (BDT)': sellPrice,
          'Payment Status': sub.payment_status || 'Paid',
          'Vendor Name': sub.vendor_name || sub.vendor_company || '-',
          'Vendor Cost (BDT)': venPrice,
          'Profit (BDT)': profit,
          'Account / Key Credentials': sub.account_given || '-',
          'License Rules': sub.license_rules || '-',
          'Customer Notes': sub.customer_notes || '-',
          'Admin Notes': sub.admin_notes || sub.notes || '-',
          'Order Date': sub.order_created_at ? new Date(sub.order_created_at).toLocaleString() : '-'
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const colWidths = [
        { wch: 6 },  // SL
        { wch: 12 }, // Order ID
        { wch: 22 }, // Customer Name
        { wch: 18 }, // WhatsApp / Phone
        { wch: 26 }, // Email
        { wch: 25 }, // Product Name
        { wch: 16 }, // Package / Plan
        { wch: 12 }, // Source
        { wch: 14 }, // Purchase Date
        { wch: 14 }, // Validity
        { wch: 14 }, // Expiry Date
        { wch: 18 }, // Remaining Days
        { wch: 14 }, // Status
        { wch: 18 }, // Selling Price
        { wch: 15 }, // Payment Status
        { wch: 18 }, // Vendor Name
        { wch: 16 }, // Vendor Cost
        { wch: 14 }, // Profit
        { wch: 30 }, // Account / Key Credentials
        { wch: 25 }, // License Rules
        { wch: 25 }, // Customer Notes
        { wch: 25 }, // Admin Notes
        { wch: 20 }, // Order Date
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subscriptions');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const filterTag = isFilteredExport ? 'Filtered_' : 'All_';
      const filename = `ElitePassBD_Subscriptions_${filterTag}${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success(`Successfully exported ${dataToExport.length} subscriptions to Excel!`);
    } catch (err) {
      console.error('Failed to export subscriptions to Excel:', err);
      toast.error('Failed to export Excel file. Please try again.');
    } finally {
      setExportingExcel(false);
      setExportMenuOpen(false);
      setHeaderExportMenuOpen(false);
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
              setUniqueCustomerOnly(false);
              setStatusFilter('All Status');
              setExpiryFilter('today');
              setActiveSubTab('subscriptions');
              setSubPage(1);
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

          {/* Header Excel Export Button with Dropdown */}
          <div className="relative" ref={headerExportMenuRef}>
            <div className="inline-flex rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => handleExportExcel(hasActiveFilters ? 'filtered' : 'all')}
                disabled={exportingExcel || filteredSubscriptions.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.75 bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-l-lg border border-emerald-300 border-r-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                title="Download subscriptions as Excel (.xlsx)"
              >
                {exportingExcel ? (
                  <Loader2 size={14} className="animate-spin text-emerald-600" />
                ) : (
                  <FileSpreadsheet size={15} className="text-emerald-600" />
                )}
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Excel</span>
                {hasActiveFilters && (
                  <span className="bg-emerald-200 text-emerald-900 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                    {filteredSubscriptions.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setHeaderExportMenuOpen(!headerExportMenuOpen)}
                disabled={exportingExcel}
                className="px-1.5 py-1.75 bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-r-lg border border-l-0 border-emerald-300 transition-all cursor-pointer disabled:opacity-50"
                title="Export Options"
              >
                <ChevronDown size={13} className={`transition-transform duration-200 ${headerExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {headerExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-slate-800 text-xs animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Excel Export Options
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderExportMenuOpen(false);
                    handleExportExcel('filtered');
                  }}
                  disabled={filteredSubscriptions.length === 0}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50/70 flex items-center justify-between text-slate-700 hover:text-emerald-700 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download size={13} className="text-emerald-600" />
                    <span>Export Current View</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {filteredSubscriptions.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderExportMenuOpen(false);
                    handleExportExcel('all');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50/70 flex items-center justify-between text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={13} className="text-emerald-600" />
                    <span>Export All Subscriptions</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {stats.totalSubscriptions || subscriptions.length}
                  </span>
                </button>
              </div>
            )}
          </div>

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

          <form onSubmit={handleSaveCustomerSub} autoComplete="off" className="space-y-4">
            {/* Hidden dummy fields to absorb aggressive browser autofill of saved admin credentials */}
            <input type="text" name="dummy_username_block" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
            <input type="password" name="dummy_password_block" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

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
                  name="sub_customer_full_name"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
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
                  name="sub_customer_mobile_phone"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address (ঐচ্ছিক)</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none text-slate-600 hover:text-emerald-700">
                    <input
                      type="checkbox"
                      checked={Boolean(subForm.send_email)}
                      onChange={(e) => setSubForm({ ...subForm, send_email: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                    />
                    <span className="font-medium">মেইল পাঠান</span>
                  </label>
                </div>
                <input
                  type="text"
                  inputMode="email"
                  name="sub_customer_direct_email_field"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  placeholder="e.g. customer@example.com (ঐচ্ছিক)"
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
                  onBlur={(e) => {
                    if (e.target.value) handleOrderLookup(e.target.value);
                  }}
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

                              // Auto-load matching rule for selected product
                              const normalize = (str) => (str || '').trim().toLowerCase().replace(/[\s\-_–—|]+/g, ' ');
                              const prodNorm = normalize(currentProd.name);
                              const matchedRule = allUsageRules.find(r =>
                                r.is_active !== 0 && (
                                  (currentProd.id && r.product_id === currentProd.id) ||
                                  (r.product_name && (normalize(r.product_name) === prodNorm || normalize(r.product_name).includes(prodNorm) || prodNorm.includes(normalize(r.product_name))))
                                )
                              );

                              setSubForm(prev => ({
                                ...prev,
                                product_name: currentProd.name,
                                package_plan: newPackagePlan,
                                selling_price: newPrice,
                                validity_days: newValidity,
                                digital_account_id: '',
                                license_rules: matchedRule ? (matchedRule.rules_text || '') : ''
                              }));
                              setSelectedRuleId(matchedRule ? String(matchedRule.id) : '__none__');
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

              {/* Subscription Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Status *</label>
                <select
                  value={subForm.status || 'Active'}
                  onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                  <option value="Renewed">Renewed</option>
                  <option value="Not Renewed">Not Renewed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Vendor / Supplier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Store size={12} className="text-purple-600" />
                    <span>Vendor / Supplier</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Internal</span>
                </label>
                <select
                  value={subForm.vendor_id || ''}
                  onChange={(e) => setSubForm({ ...subForm, vendor_id: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- No Vendor Selected --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.company_name ? `(${v.company_name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Select supplier (not shared with customer)</p>
              </div>

              {/* Vendor Price (Buying Cost) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Vendor Price (BDT)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Buying Cost</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={subForm.vendor_price}
                  onChange={(e) => setSubForm({ ...subForm, vendor_price: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {subForm.selling_price && subForm.vendor_price && parseFloat(subForm.selling_price) >= parseFloat(subForm.vendor_price) ? (
                    <span className="text-emerald-600 font-semibold">
                      Profit: ৳{(parseFloat(subForm.selling_price) - parseFloat(subForm.vendor_price)).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-400">Supplier buying cost (never sent in email)</span>
                  )}
                </p>
              </div>

              {/* License Manager Account (Product & Package Wise) */}
              <div className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key size={13} className="text-violet-600" />
                    <span>License Manager Account</span>
                  </label>
                  {matchingDigitalAccounts.length > 0 && (
                    <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-bold">
                      {matchingDigitalAccounts.length} matching product & package
                    </span>
                  )}
                </div>
                <select
                  value={subForm.digital_account_id || ''}
                  onChange={(e) => handleDigitalAccountChange(e.target.value)}
                  disabled={matchingDigitalAccounts.length === 0}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs transition-colors shadow-xs ${
                    matchingDigitalAccounts.length > 0
                      ? 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer'
                      : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {matchingDigitalAccounts.length > 0 ? (
                    <>
                      <option value="">-- No Account Selected --</option>
                      {matchingDigitalAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_email} • {acc.available_slots} / {acc.total_slots} Slots Free{acc.package_name ? ` • [${acc.package_name}]` : ''} ({acc.product_name})
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">
                      {subForm.product_name
                        ? (subForm.package_plan
                            ? `-- No Account Available for ${subForm.product_name} (${subForm.package_plan}) --`
                            : `-- No Account Available for ${subForm.product_name} --`)
                        : '-- Select a Product First --'}
                    </option>
                  )}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {matchingDigitalAccounts.length > 0
                    ? `Showing ${matchingDigitalAccounts.length} account(s) matching "${subForm.product_name}"${subForm.package_plan ? ` & "${subForm.package_plan}"` : ''}`
                    : (subForm.product_name
                        ? `No license accounts found for "${subForm.product_name}"${subForm.package_plan ? ` with plan "${subForm.package_plan}"` : ''}`
                        : 'Select a product and package above to filter accounts')}
                </p>
              </div>

              {/* Available Slots Display (Blank if no account selected) */}
              <div className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Shield size={13} className="text-emerald-600" />
                    <span>Available Slots</span>
                  </label>
                  {selectedDigitalAccount && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedDigitalAccount.available_slots > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {selectedDigitalAccount.available_slots > 0 ? `${selectedDigitalAccount.available_slots} Free` : 'No Free Slots'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  readOnly
                  placeholder=""
                  value={selectedDigitalAccount ? `${selectedDigitalAccount.available_slots} / ${selectedDigitalAccount.total_slots} Slots Available` : ''}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-colors ${
                    selectedDigitalAccount
                      ? (selectedDigitalAccount.available_slots > 0
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                          : 'bg-red-50/60 border-red-300 text-red-700')
                      : 'bg-slate-50 border-slate-300 text-slate-400'
                  }`}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {selectedDigitalAccount
                    ? (selectedDigitalAccount.available_slots > 0
                        ? '✓ Auto-assigns the next free slot on save'
                        : '⚠️ No available slots remaining in this account')
                    : 'Blank until an account is chosen'}
                </p>
              </div>

              {/* Product Usages Rules Section (Auto-loaded on product select & sent in email) */}
              <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-emerald-200/90 shadow-2xs space-y-2.5">
                {/* Header with Title, Matching Product Badge & Email Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <ScrollText size={14} className="text-emerald-600" />
                      <span>Product Usages Rules</span>
                    </label>
                    {matchingProductRules.length > 0 ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        ✓ Auto-loaded for {subForm.product_name}
                      </span>
                    ) : subForm.product_name ? (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        No saved rules for "{subForm.product_name}"
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    ✉️ Sent in Customer Email
                  </span>
                </div>

                {/* Selection Dropdown + Reload Default Button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedRuleId || (subForm.license_rules ? '__custom__' : '__none__')}
                      onChange={(e) => handleUsageRuleChange(e.target.value)}
                      disabled={loadingRules}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      {loadingRules ? (
                        <option value="">Loading product usage rules...</option>
                      ) : matchingProductRules.length > 0 ? (
                        <>
                          {matchingProductRules.map(rule => (
                            <option key={rule.id} value={String(rule.id)}>
                              ✓ {rule.title} ({rule.product_name})
                            </option>
                          ))}
                          <option value="__none__">-- No Rules (Do Not Send Rules in Email) --</option>
                          <option value="__custom__">✏️ Custom / Edit Rules Text Below</option>
                        </>
                      ) : (
                        <>
                          <option value="__none__">
                            {subForm.product_name
                              ? `-- No Rules Saved for "${subForm.product_name}" --`
                              : '-- Select a Product First --'}
                          </option>
                          <option value="__custom__">✏️ Type Custom Rules Text Below</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Quick Reload Rule Button */}
                  {matchingProductRules.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const defaultR = matchingProductRules[0];
                        setSelectedRuleId(String(defaultR.id));
                        setSubForm(prev => ({ ...prev, license_rules: defaultR.rules_text || '' }));
                        toast.success(`Reset to "${defaultR.title}"`);
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shrink-0 flex items-center gap-1 transition-colors shadow-2xs"
                      title="Reload default product rule"
                    >
                      <RotateCcw size={11} />
                      <span>Reload Rule</span>
                    </button>
                  )}
                </div>

                {/* Rules Text Editor / Preview */}
                <div className="space-y-1">
                  <textarea
                    rows={3}
                    placeholder="Select a rule above or type custom product usage rules to send with customer's activation email..."
                    value={subForm.license_rules || ''}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setSubForm(prev => ({ ...prev, license_rules: newText }));
                      if (selectedRuleId !== '__none__' && selectedRuleId !== '__custom__') {
                        const matched = allUsageRules.find(r => String(r.id) === String(selectedRuleId));
                        if (matched && matched.rules_text !== newText) {
                          setSelectedRuleId('__custom__');
                        }
                      }
                    }}
                    className="w-full bg-white border border-emerald-200/90 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all leading-relaxed custom-scrollbar"
                  />
                  <div className="flex items-center justify-between text-[10.5px] text-emerald-800/90 font-medium">
                    <span>
                      {subForm.license_rules?.trim()
                        ? '✓ These rules will be styled into bullet guidelines and included in the customer email.'
                        : '⚠️ No rules selected. Email will only contain license credentials.'}
                    </span>
                    {subForm.license_rules?.trim() && (
                      <span className="text-slate-500 font-mono text-[10px]">
                        {subForm.license_rules.length} chars
                      </span>
                    )}
                  </div>

                  {subForm.license_rules?.trim() && /<\/?[a-z][\s\S]*>/i.test(subForm.license_rules) && (
                    <div className="mt-1.5 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-slate-800 leading-relaxed max-h-36 overflow-y-auto">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Eye size={11} className="text-emerald-600" />
                        <span>Live Formatted Preview (Email Display):</span>
                      </div>
                      <div className="rule-html-content" dangerouslySetInnerHTML={{ __html: subForm.license_rules }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section: Customer Notes (sent in email) & Admin Notes (internal only) */}
              <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-2">

                {/* 1. Customer Notes (Will be sent in email to customer) */}
                <div className="bg-emerald-50/50 p-3 sm:p-3.5 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-900">Customer Notes (Sent in Email)</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✉️ Sent to Customer
                      </span>
                    </div>

                    {/* Template Selector & Manage Actions */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value === '__manage__') {
                            setActiveTemplateTab('list');
                            setShowManageTemplatesModal(true);
                          } else if (e.target.value) {
                            handleSelectNoteTemplate(e.target.value, 'subForm');
                          }
                        }}
                        className="bg-white border border-emerald-300 hover:border-emerald-400 text-emerald-950 font-semibold rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs max-w-[210px] sm:max-w-[260px] truncate"
                        title="Choose a pre-saved note template to auto-fill"
                      >
                        <option value="">⚡ Select Note Template...</option>
                        {noteTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                        <option value="__manage__">⚙️ Manage All Templates...</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleQuickSaveAsTemplate(subForm.customer_notes)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer shrink-0"
                        title="Save note as template to database for future use"
                      >
                        <BookmarkPlus size={12} />
                        <span>Save as Template</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    placeholder="e.g. Account activation instructions, rules, or special message for customer..."
                    value={subForm.customer_notes}
                    onChange={(e) => setSubForm({ ...subForm, customer_notes: e.target.value })}
                    className="w-full bg-white border border-emerald-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[10.5px] text-emerald-700/90 font-medium">
                    <span>This note will be included in the activation email sent to the customer.</span>
                    {subForm.customer_notes && (
                      <button
                        type="button"
                        onClick={() => setSubForm({ ...subForm, customer_notes: '' })}
                        className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-bold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Admin Notes (Private - only for admin, will NOT be sent in email) */}
                <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Shield size={13} className="text-amber-600" />
                      <span>Admin Notes (Private / Internal)</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full border border-slate-300">
                      🔒 Admin Only
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="e.g. Supplier contact, vendor payment reference, internal reminder..."
                    value={subForm.admin_notes}
                    onChange={(e) => setSubForm({ ...subForm, admin_notes: e.target.value, notes: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Private internal notes. Will never be sent to the customer.
                  </p>
                </div>

              </div>

            </div>

            {/* Actions & Email Notification Option */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 pt-4 mt-4">
              {/* Checkbox Button: কাস্টমারকে মেইল পাঠাবো কি না */}
              <label
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border cursor-pointer select-none transition-all ${
                  subForm.send_email
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-2xs'
                    : 'bg-slate-100/90 border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
                title="চেক করা থাকলে কাস্টমারকে মেইল পাঠানো হবে, আনচেক থাকলে কোনো মেইল যাবে না"
              >
                <input
                  type="checkbox"
                  checked={Boolean(subForm.send_email)}
                  onChange={(e) => setSubForm({ ...subForm, send_email: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Mail size={14} className={subForm.send_email ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>কাস্টমারকে মেইল পাঠাবো কি না?</span>
                </div>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                  subForm.send_email
                    ? 'bg-emerald-100/90 text-emerald-800 border-emerald-200'
                    : 'bg-slate-200/90 text-slate-600 border-slate-300'
                }`}>
                  {subForm.send_email ? '✓ হ্যাঁ, মেইল যাবে' : '✕ না, মেইল যাবে না'}
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 shrink-0">
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
              setUniqueCustomerOnly(false);
              setStatusFilter('All Status');
              setExpiryFilter('today');
              setActiveSubTab('subscriptions');
              setSubPage(1);
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
                } else if (tab.id === 'renewals') {
                  setUniqueCustomerOnly(false);
                  setStatusFilter('Renewed');
                  setExpiryFilter('All Dates');
                  setActiveSubTab('subscriptions');
                  setSubPage(1);
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

      {/* Product Filter Active Indicator for Stat Cards */}
      {productFilter && productFilter !== 'All Products' && (
        <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/90 px-3 py-1.5 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Showing stats for: <strong className="font-extrabold text-emerald-900">{productFilter}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectProduct('All Products')}
            className="text-[10px] font-extrabold text-emerald-700 hover:text-emerald-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            title="Reset to All Products stats"
          >
            Show All Products Stats
          </button>
        </div>
      )}

      {/* 8 Dashboard Stat Cards Grid matching concept mockup */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-2.5">
        {/* Card 1: Active Subscriptions */}
        <div
          onClick={() => handleStatCardClick('active')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
            activeStatCard === 'active'
              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-emerald-500/40'
          }`}
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
          onClick={() => handleStatCardClick('expiringToday')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
            activeStatCard === 'expiringToday'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white hover:bg-rose-50/50 border-rose-200/90 hover:border-rose-300'
          }`}
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
          onClick={() => handleStatCardClick('within3Days')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
            activeStatCard === 'within3Days'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white hover:bg-amber-50/50 border-amber-200/90 hover:border-amber-300'
          }`}
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
          onClick={() => handleStatCardClick('within7Days')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
            activeStatCard === 'within7Days'
              ? 'bg-yellow-50/80 border-yellow-500 ring-2 ring-yellow-500/20'
              : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-yellow-500/40'
          }`}
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
          onClick={() => handleStatCardClick('expired')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
            activeStatCard === 'expired'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white hover:bg-rose-50/50 border-rose-200/90 hover:border-rose-300'
          }`}
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
          onClick={() => handleStatCardClick('renewed')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
            activeStatCard === 'renewed'
              ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-white hover:bg-teal-50/50 border-slate-200/90 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Renewed">Renewed</span>
            <div className="p-1 rounded-md bg-teal-50 text-teal-600 group-hover:scale-105 transition-transform shrink-0">
              <RefreshCw size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-teal-700">{stats.renewed}</div>
        </div>

        {/* Card 7: Not Renewed */}
        <div
          onClick={() => handleStatCardClick('notRenewed')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
            activeStatCard === 'notRenewed'
              ? 'bg-slate-200/80 border-slate-600 ring-2 ring-slate-600/30'
              : 'bg-white hover:bg-slate-100/70 border-slate-200/90 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Not Renewed">Not Renewed</span>
            <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:scale-105 transition-transform shrink-0">
              <UserX size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-800">{stats.notRenewed || 0}</div>
        </div>

        {/* Card 8: Unique Customer */}
        <div
          onClick={() => handleStatCardClick('uniqueCustomer')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group ${
            activeStatCard === 'uniqueCustomer'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10.5px] font-bold truncate" title="Unique Customer">Unique Customer</span>
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
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search order no (e.g. #53), name, mobile or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSubPage(1);
                }}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSubPage(1);
                  }}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Product Type & Search Combobox Filter */}
            <div ref={productFilterRef} className="relative w-full sm:w-auto min-w-[160px] sm:min-w-[210px]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={productFilterOpen ? productFilterInput : (productFilter === 'All Products' ? '' : productFilter)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProductFilterInput(val);
                    if (!productFilterOpen) setProductFilterOpen(true);
                  }}
                  onFocus={() => {
                    setProductFilterInput(productFilter === 'All Products' ? '' : productFilter);
                    setProductFilterOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredProductOptions.length > 0) {
                        handleSelectProduct(filteredProductOptions[0].name);
                      } else if (productFilterInput.trim()) {
                        handleSelectProduct(productFilterInput.trim());
                      } else {
                        handleSelectProduct('All Products');
                      }
                    } else if (e.key === 'Escape') {
                      setProductFilterOpen(false);
                      setProductFilterInput(productFilter === 'All Products' ? '' : productFilter);
                    }
                  }}
                  placeholder={productFilter === 'All Products' ? 'All Products' : productFilter}
                  title="Type product name to search or select from list"
                  className={`w-full bg-white border rounded-lg pl-2.5 pr-11 py-1.5 text-[11px] placeholder-slate-400 focus:outline-none transition-all shadow-2xs ${
                    productFilter !== 'All Products'
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500'
                      : 'border-slate-300 text-slate-800 font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                  }`}
                />

                {/* Right controls: Clear (X) + Dropdown Chevron */}
                <div className="absolute right-1.5 flex items-center gap-0.5">
                  {(productFilter !== 'All Products' || (productFilterOpen && productFilterInput)) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProduct('All Products');
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Clear product filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!productFilterOpen) {
                        setProductFilterInput(productFilter === 'All Products' ? '' : productFilter);
                      }
                      setProductFilterOpen(prev => !prev);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                    title="Toggle product list"
                  >
                    <ChevronDown size={13} className={`transition-transform duration-200 ${productFilterOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Dropdown Menu */}
              {productFilterOpen && (
                <div className="absolute left-0 top-full mt-1 w-full min-w-[240px] max-w-xs bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <span>Products ({filteredProductOptions.length})</span>
                    <span className="text-[8.5px] text-slate-400 font-normal">Type to filter</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                    {/* Option: All Products */}
                    <div
                      onClick={() => handleSelectProduct('All Products')}
                      className={`px-3 py-1.5 text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                        productFilter === 'All Products'
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${productFilter === 'All Products' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <span>All Products</span>
                      </span>
                      {productFilter === 'All Products' && <Check size={12} className="text-emerald-600" />}
                    </div>

                    {/* Filtered Products */}
                    {filteredProductOptions.map((p, i) => {
                      const isSelected = productFilter.toLowerCase() === p.name.toLowerCase();
                      return (
                        <div
                          key={i}
                          onClick={() => handleSelectProduct(p.name)}
                          className={`px-3 py-1.5 text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate pr-2 font-medium" title={p.name}>
                            {p.name}
                          </span>
                          {isSelected && <Check size={12} className="text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}

                    {filteredProductOptions.length === 0 && (
                      <div className="px-3 py-3 text-[11px] text-slate-400 text-center italic">
                        No products match "{productFilterInput}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Select */}
            <div className="w-full sm:w-auto min-w-[120px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setUniqueCustomerOnly(false);
                  setStatusFilter(e.target.value);
                  setSubPage(1);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-2xs cursor-pointer"
              >
                <option value="All Status">All Status (Expired & Not Renewed First)</option>
                <option value="Expired">Expired</option>
                <option value="Not Renewed">Not Renewed</option>
                <option value="Expired & Not Renewed">Expired & Not Renewed</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Active">Active</option>
                <option value="Renewed">Renewed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Expiry Date Select */}
            <div className="w-full sm:w-auto min-w-[125px]">
              <select
                value={expiryFilter}
                onChange={(e) => {
                  setUniqueCustomerOnly(false);
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
                  if (e.target.value === 'order_no') {
                    setSubSortAsc(false);
                  }
                  setSubPage(1);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-2xs cursor-pointer"
              >
                <option value="order_no">Sort: Order No (High to Low)</option>
                <option value="expiry">Sort: Priority (Expired First)</option>
                <option value="expiry_date_only">Sort: Expiry Date (Strict)</option>
                <option value="order_date">Sort: Order Date</option>
                <option value="customer">Sort: Customer Name</option>
                <option value="product">Sort: Product Name</option>
                <option value="status">Sort: Status Priority</option>
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
            {(uniqueCustomerOnly || searchQuery || productFilter !== 'All Products' || statusFilter !== 'All Status' || expiryFilter !== 'All Dates' || subSortField !== 'order_no' || subSortAsc) && (
              <button
                type="button"
                onClick={() => {
                  setUniqueCustomerOnly(false);
                  setSearchQuery('');
                  setProductFilter('All Products');
                  setProductFilterInput('');
                  setProductFilterOpen(false);
                  setStatusFilter('All Status');
                  setExpiryFilter('All Dates');
                  setSubSortField('order_no');
                  setSubSortAsc(false);
                  setSubPage(1);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}

            {/* Export Excel Button in Toolbar */}
            <div className="relative sm:ml-auto" ref={exportMenuRef}>
              <div className="inline-flex rounded-lg shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleExportExcel(hasActiveFilters ? 'filtered' : 'all')}
                  disabled={exportingExcel || filteredSubscriptions.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-[11px] font-bold rounded-l-lg border-r border-emerald-500 transition-all cursor-pointer shadow-2xs"
                  title="Download subscriptions as Excel (.xlsx)"
                >
                  {exportingExcel ? (
                    <Loader2 size={13} className="animate-spin text-white" />
                  ) : (
                    <FileSpreadsheet size={14} className="text-emerald-100" />
                  )}
                  <span>Export Excel</span>
                  {hasActiveFilters && (
                    <span className="bg-emerald-800/80 text-emerald-100 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                      {filteredSubscriptions.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  disabled={exportingExcel}
                  className="px-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-[11px] font-bold rounded-r-lg transition-all cursor-pointer shadow-2xs"
                  title="Export Options"
                >
                  <ChevronDown size={13} className={`transition-transform duration-200 ${exportMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-slate-800 text-xs animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Excel Export Options
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportExcel('filtered');
                    }}
                    disabled={filteredSubscriptions.length === 0}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50/70 flex items-center justify-between text-slate-700 hover:text-emerald-700 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Download size={13} className="text-emerald-600" />
                      <span>Export Current View</span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {filteredSubscriptions.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      handleExportExcel('all');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50/70 flex items-center justify-between text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={13} className="text-emerald-600" />
                      <span>Export All Subscriptions</span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {stats.totalSubscriptions || subscriptions.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

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
                      if (subSortField === 'order_no') {
                        setSubSortAsc(!subSortAsc);
                      } else {
                        setSubSortField('order_no');
                        setSubSortAsc(false);
                      }
                    }}
                    className="py-2.5 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>Order No & Date</span>
                      <ArrowUpDown size={10} className={subSortField === 'order_no' ? 'text-emerald-600' : 'text-slate-400 opacity-50'} />
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
                ) : filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 border-b border-slate-200">
                      <div className="max-w-sm mx-auto space-y-2">
                        <p className="text-xs font-semibold text-slate-600">No customer subscriptions found matching your filters.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setUniqueCustomerOnly(false);
                            setSearchQuery('');
                            setProductFilter('All Products');
                            setProductFilterInput('');
                            setProductFilterOpen(false);
                            setStatusFilter('All Status');
                            setExpiryFilter('All Dates');
                            setSubSortField('order_no');
                            setSubSortAsc(false);
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
                              <button
                                type="button"
                                onClick={() => handleOpenViewModal(sub)}
                                className="font-bold text-slate-900 group-hover:text-emerald-700 hover:underline transition-colors text-[11.5px] truncate max-w-[150px] text-left cursor-pointer block"
                                title="Click to view full subscription details"
                              >
                                {sub.customer_name}
                              </button>
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
                            {sub.vendor_name && (
                              <div className="mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.2 rounded-md">
                                  <Store size={9} />
                                  <span className="truncate max-w-[120px]">{sub.vendor_name}</span>
                                </span>
                              </div>
                            )}
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
                          <div className="space-y-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold border shadow-2xs ${sub.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                              {sub.payment_status}
                            </span>
                            {sub.selling_price !== undefined && sub.selling_price !== null && (
                              <div className="text-[10px] font-bold text-slate-800 font-mono">
                                ৳{parseFloat(sub.selling_price || 0).toLocaleString()}
                              </div>
                            )}
                            {sub.vendor_price !== undefined && sub.vendor_price !== null && parseFloat(sub.vendor_price) > 0 && (
                              <div className="text-[9px] text-slate-400 font-medium font-mono" title="Vendor buying cost">
                                Cost: ৳{parseFloat(sub.vendor_price).toFixed(0)}
                              </div>
                            )}
                          </div>
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

                            {/* View Full Details Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenViewModal(sub)}
                              className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                              title="View Full Subscription Details"
                            >
                              <Eye size={13} />
                            </button>

                            {/* More Actions Dropdown Toggle (Includes Renew, Not Renewed, View Details, Edit, History, Delete) */}
                            <button
                              type="button"
                              onClick={(e) => toggleActionMenu(e, sub)}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer border ${activeMenuSub?.id === sub.id
                                ? 'bg-slate-200 text-slate-900 border-slate-300'
                                : 'bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200 shadow-2xs'
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
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500"></span> Not Renewed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Cancelled</span>
            </div>

            {/* Pagination Info & Controls */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Showing {filteredSubscriptions.length === 0 ? 0 : ((subPage - 1) * subsPerPage) + 1} to {Math.min(subPage * subsPerPage, filteredSubscriptions.length)} of {filteredSubscriptions.length} entries
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
                      <button
                        type="button"
                        disabled={togglingNotRenewedId === selectedSubDetail.id}
                        onClick={(e) => handleToggleNotRenewed(selectedSubDetail, e)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer flex items-center gap-1 disabled:opacity-60 ${
                          selectedSubDetail.status === 'Not Renewed'
                            ? 'bg-slate-700 text-white border-slate-700 hover:bg-slate-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title={selectedSubDetail.status === 'Not Renewed' ? 'Click to revert status' : 'Click to mark as Not Renewed (will not renew)'}
                      >
                        {togglingNotRenewedId === selectedSubDetail.id ? (
                          <RefreshCw size={10} className="animate-spin text-slate-300" />
                        ) : selectedSubDetail.status === 'Not Renewed' ? (
                          <XCircle size={10} className="text-rose-400" />
                        ) : (
                          <UserX size={10} />
                        )}
                        <span>{selectedSubDetail.status === 'Not Renewed' ? 'Revert Status' : 'Mark as Not Renewed'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {selectedSubDetail.product_name} • {selectedSubDetail.package_plan} | WhatsApp: {selectedSubDetail.whatsapp_number}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        Order #{selectedSubDetail.order_id || selectedSubDetail.id}
                      </span>
                      {selectedSubDetail.vendor_name && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <Store size={10} />
                          Vendor: {selectedSubDetail.vendor_name} {selectedSubDetail.vendor_company ? `(${selectedSubDetail.vendor_company})` : ''}
                        </span>
                      )}
                      {selectedSubDetail.vendor_price !== null && selectedSubDetail.vendor_price !== undefined && parseFloat(selectedSubDetail.vendor_price) > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Buying Cost: ৳{parseFloat(selectedSubDetail.vendor_price).toFixed(2)}
                        </span>
                      )}
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

                          {/* Row 2: Customer Email (Span 2 cols) */}
                          <div className="col-span-1 sm:col-span-2 lg:col-span-2 space-y-1">
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
                              name="renew_customer_email_address"
                              autoComplete="new-password"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              value={renewForm.customer_email || ''}
                              onChange={(e) => setRenewForm({ ...renewForm, customer_email: e.target.value })}
                              placeholder="customer@email.com (ঐচ্ছিক)"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                            />
                            <p className="text-[10px] text-slate-400 truncate">
                              Dispatches renewal confirmation email with credentials and customer notes.
                            </p>
                          </div>

                          {/* Row 3: Customer Notes (Sent in Email) (Span 2 cols) */}
                          <div className="col-span-1 sm:col-span-2 lg:col-span-2 bg-emerald-50/50 p-2.5 sm:p-3 rounded-xl border border-emerald-200/80 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <Mail size={12} className="text-emerald-600" />
                                <span className="text-[11px] font-bold text-emerald-900">Customer Notes (Sent in Email)</span>
                                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                                  ✉️ Sent to Customer
                                </span>
                              </div>

                              {/* Template Selector for Renewal */}
                              <div className="flex items-center gap-1">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value === '__manage__') {
                                      setActiveTemplateTab('list');
                                      setShowManageTemplatesModal(true);
                                    } else if (e.target.value) {
                                      handleSelectNoteTemplate(e.target.value, 'renewForm');
                                    }
                                  }}
                                  className="bg-white border border-emerald-300 hover:border-emerald-400 text-emerald-950 font-semibold rounded-lg px-2 py-0.5 text-[10.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs max-w-[200px] truncate"
                                  title="Choose a pre-saved note template to auto-fill"
                                >
                                  <option value="">⚡ Select Template...</option>
                                  {noteTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.title}
                                    </option>
                                  ))}
                                  <option value="__manage__">⚙️ Manage...</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleQuickSaveAsTemplate(renewForm.customer_notes)}
                                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer shrink-0"
                                  title="Save this note as a template for future use"
                                >
                                  <BookmarkPlus size={10} />
                                  <span>Save</span>
                                </button>
                              </div>
                            </div>

                            <textarea
                              rows={2}
                              value={renewForm.customer_notes || ''}
                              onChange={(e) => setRenewForm({ ...renewForm, customer_notes: e.target.value })}
                              placeholder="e.g. Renewal instructions, account access details, or thank you message for customer..."
                              className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                            />
                            <div className="flex items-center justify-between text-[10px] text-emerald-700/80 font-medium">
                              <span>This note will be included in the renewal confirmation email.</span>
                              {renewForm.customer_notes && (
                                <button
                                  type="button"
                                  onClick={() => setRenewForm({ ...renewForm, customer_notes: '' })}
                                  className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-bold"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Row 3: Admin Notes (Private) (Span 2 cols) */}
                          <div className="col-span-1 sm:col-span-2 lg:col-span-2 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                                <Shield size={12} className="text-amber-600" />
                                <span>Admin Notes (Private)</span>
                              </label>
                              <span className="text-[9.5px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full border border-slate-300">
                                🔒 Admin Only
                              </span>
                            </div>
                            <textarea
                              rows={2}
                              value={renewForm.admin_notes || ''}
                              onChange={(e) => setRenewForm({ ...renewForm, admin_notes: e.target.value, notes: e.target.value })}
                              placeholder="e.g. Internal renewal note, supplier cost reference, customer interaction note..."
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">
                              Private internal notes. Strictly for admin reference, never sent in email.
                            </p>
                          </div>

                          {/* Row 4: Action Footer (Span 4 cols) */}
                          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-slate-200/60">
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <RefreshCw size={12} className="text-emerald-600 shrink-0" />
                              <span>Clicking confirm will extend validity, record renewal history, and email customer credentials.</span>
                            </div>
                            <button
                              type="submit"
                              disabled={renewSubmitting}
                              className="w-full sm:w-auto min-w-[190px] h-[38px] px-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
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
                      <table className="w-full min-w-[500px] text-left text-[10.5px] border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-250 text-slate-700 font-black uppercase text-[9.5px] bg-slate-100 tracking-wider">
                            <th className="py-2 px-2.5 border-r border-slate-250">Start Date</th>
                            <th className="py-2 px-2.5 border-r border-slate-250">End Date</th>
                            <th className="py-2 px-2.5 border-r border-slate-250">Amount</th>
                            <th className="py-2 px-2.5 border-r border-slate-250">Status</th>
                            <th className="py-2 px-2.5 border-r border-slate-250 min-w-[150px]">Account / License Given</th>
                            <th className="py-2 px-2.5">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70">
                          {selectedSubDetail.renewals && selectedSubDetail.renewals.length > 0 ? (
                            selectedSubDetail.renewals.map((ren) => (
                              <tr key={ren.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-emerald-50/20 transition-colors">
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 text-slate-800 font-medium whitespace-nowrap">{new Date(ren.start_date).toISOString().slice(0, 10)}</td>
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 text-slate-800 font-medium whitespace-nowrap">{new Date(ren.end_date).toISOString().slice(0, 10)}</td>
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 font-bold text-emerald-700 whitespace-nowrap">BDT {ren.amount}</td>
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80 whitespace-nowrap">
                                  <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border shadow-2xs ${ren.status === 'Current' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                    {ren.status}
                                  </span>
                                </td>
                                <td className="py-1.75 px-2.5 border-r border-slate-200/80">
                                  <div className="space-y-1 max-w-[220px]">
                                    {(ren.digital_account_email || ren.digital_slot_number || ren.digital_account_product) && (
                                      <div className="flex items-center gap-1 text-[9.5px] font-semibold text-blue-700 bg-blue-50/90 border border-blue-200 px-1.5 py-0.5 rounded leading-tight">
                                        <Server size={10} className="shrink-0 text-blue-600" />
                                        <span className="truncate" title={`${ren.digital_account_product || 'Account'}: ${ren.digital_account_email || ''}`}>
                                          {ren.digital_account_email || ren.digital_account_product || 'Digital Account'}
                                        </span>
                                        {ren.digital_slot_number && (
                                          <span className="bg-blue-600 text-white text-[8.5px] font-bold px-1 rounded-xs shrink-0">
                                            #{ren.digital_slot_number}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {ren.account_given ? (
                                      <div className="flex items-center gap-1 bg-slate-900 text-emerald-300 font-mono text-[9.5px] px-1.5 py-0.5 rounded border border-slate-800 leading-tight">
                                        <Key size={10} className="shrink-0 text-emerald-400" />
                                        <span className="truncate flex-1 select-all font-mono" title={ren.account_given}>
                                          {ren.account_given}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(ren.account_given);
                                            toast.success('Account credentials copied!');
                                          }}
                                          title="Copy credentials"
                                          className="text-slate-400 hover:text-emerald-300 p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                                        >
                                          <Copy size={10} />
                                        </button>
                                      </div>
                                    ) : null}
                                    {!ren.account_given && !ren.digital_account_email && !ren.digital_slot_number && !ren.digital_account_product && (
                                      <span className="text-slate-400 italic text-[9.5px]">- Not recorded -</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1.75 px-2.5 text-slate-700">
                                  <div className="space-y-1 max-w-[220px]">
                                    {ren.customer_notes && (
                                      <div className="flex items-start gap-1 bg-emerald-50/90 text-emerald-800 text-[10px] p-1 rounded border border-emerald-200 leading-tight">
                                        <Mail size={11} className="shrink-0 text-emerald-600 mt-0.5" />
                                        <span className="font-normal break-words line-clamp-2" title={`Customer Note: ${ren.customer_notes}`}>
                                          <strong className="font-semibold text-emerald-900">Cust:</strong> {ren.customer_notes}
                                        </span>
                                      </div>
                                    )}
                                    {(ren.admin_notes || (ren.notes && ren.notes !== 'Subscription renewed' && ren.notes !== 'Initial purchase')) ? (
                                      <div className="flex items-start gap-1 bg-slate-100 text-slate-700 text-[10px] p-1 rounded border border-slate-200 leading-tight">
                                        <Shield size={11} className="shrink-0 text-amber-600 mt-0.5" />
                                        <span className="font-normal break-words line-clamp-2" title={`Admin Note: ${ren.admin_notes || ren.notes}`}>
                                          <strong className="font-semibold text-slate-800">Admin:</strong> {ren.admin_notes || ren.notes}
                                        </span>
                                      </div>
                                    ) : (ren.notes && !ren.customer_notes && !ren.admin_notes ? (
                                      <span className="text-[10px] text-slate-500 italic">{ren.notes}</span>
                                    ) : null)}
                                    {!ren.customer_notes && !ren.admin_notes && (!ren.notes || ren.notes === 'Subscription renewed' || ren.notes === 'Initial purchase') && (
                                      <span className="text-slate-400 italic text-[10px]">-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-3 text-center text-slate-400 font-medium">No renewal history recorded yet.</td>
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

      {/* MODAL 3: VIEW FULL SUBSCRIPTION DETAILS (COMPREHENSIVE MODAL) */}
      {showViewModal && viewingSub && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowViewModal(false)}
        >
          <div className="min-h-full flex items-center justify-center py-4 sm:py-8">
            <div
              className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[88vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6 shadow-2xl text-left overflow-hidden text-slate-900 relative my-auto animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-base sm:text-lg shrink-0 shadow-xs">
                    {viewingSub.customer_name ? viewingSub.customer_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                        {viewingSub.customer_name}
                      </h3>
                      {formatStatusBadge(viewingSub.status)}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                        Order #{viewingSub.order_id || viewingSub.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                      {viewingSub.product_name} • {viewingSub.package_plan}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {viewingSub.direct_whatsapp_url && (
                    <a
                      href={viewingSub.direct_whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Open WhatsApp Chat"
                    >
                      <MessageSquare size={13} />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopySubscriptionSummary(viewingSub)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy Summary to Clipboard"
                  >
                    <Copy size={13} />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="overflow-y-auto mt-4 pr-1 flex-1 custom-scrollbar space-y-4">

                {/* 4 Cards Overview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                  {/* Card 1: Customer Profile */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                      <User size={13} className="text-blue-600" />
                      <span>Customer Info</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">WhatsApp / Mobile</span>
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <span>{viewingSub.whatsapp_number || 'N/A'}</span>
                          {viewingSub.whatsapp_number && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(viewingSub.whatsapp_number);
                                toast.success('Phone copied!');
                              }}
                              className="text-slate-400 hover:text-emerald-600 cursor-pointer p-0.5"
                              title="Copy"
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Email Address</span>
                        <div className="flex items-center gap-1 text-slate-800 truncate">
                          <span className="truncate">{viewingSub.email || 'Not provided'}</span>
                          {viewingSub.email && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(viewingSub.email);
                                toast.success('Email copied!');
                              }}
                              className="text-slate-400 hover:text-emerald-600 cursor-pointer p-0.5 shrink-0"
                              title="Copy"
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Source</span>
                        <div className="mt-0.5">{formatSourceBadge(viewingSub.customer_source)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Subscription Timeline */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                      <Calendar size={13} className="text-emerald-600" />
                      <span>Timeline & Validity</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Purchase / Start Date</span>
                        <span className="font-semibold text-slate-800">
                          {viewingSub.purchase_date ? new Date(viewingSub.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Validity Duration</span>
                        <span className="font-semibold text-slate-800">{viewingSub.validity_days || 30} Days</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Expiry Date</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {viewingSub.expiry_date ? new Date(viewingSub.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                          {viewingSub.expiry_date && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {(() => {
                                const days = getRemainingDays(viewingSub.expiry_date);
                                if (days === null) return '-';
                                if (days > 1) return `${days}d left`;
                                if (days === 1) return `1d left`;
                                if (days === 0) return `Today`;
                                return `${Math.abs(days)}d ago`;
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Financials & Pricing */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                      <Shield size={13} className="text-amber-600" />
                      <span>Payment & Pricing</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Selling Price</span>
                        <span className="font-black text-emerald-700 text-sm">৳{parseFloat(viewingSub.selling_price || 0).toLocaleString()} BDT</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Payment Status</span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${viewingSub.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {viewingSub.payment_status || 'Paid'}
                        </span>
                      </div>
                      {viewingSub.vendor_price !== null && viewingSub.vendor_price !== undefined && parseFloat(viewingSub.vendor_price) > 0 && (
                        <div>
                          <span className="text-slate-400 text-[10.5px] block">Supplier Buying Cost</span>
                          <span className="text-slate-700 font-semibold">৳{parseFloat(viewingSub.vendor_price).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Vendor & Order Ref */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                      <Store size={13} className="text-purple-600" />
                      <span>Order & Supplier</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Order Ref Number</span>
                        <span className="font-bold text-blue-700">#{viewingSub.order_id || viewingSub.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Vendor / Supplier</span>
                        <span className="font-semibold text-slate-800">
                          {viewingSub.vendor_name ? `${viewingSub.vendor_name} ${viewingSub.vendor_company ? `(${viewingSub.vendor_company})` : ''}` : 'Self / In-house'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10.5px] block">Created Date & Time</span>
                        <span className="text-slate-600 text-[11px]">
                          {viewingSub.order_created_at || viewingSub.created_at
                            ? new Date(viewingSub.order_created_at || viewingSub.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* License Key & Credentials Section */}
                <div className="bg-slate-900 rounded-xl p-4 text-white space-y-2.5 border border-slate-800 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Key size={15} className="text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Digital License Key / Account Credentials
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!inlineCredsEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setInlineCredsValue(viewingSub.account_given || '');
                            setInlineDigitalAccId(viewingSub.digital_account_id ? String(viewingSub.digital_account_id) : '');
                            setInlineCredsEdit(true);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                          title="Assign or update account credentials"
                        >
                          <Edit2 size={12} />
                          <span>{viewingSub.account_given ? 'Edit' : 'Assign'}</span>
                        </button>
                      )}
                      {viewingSub.account_given && !inlineCredsEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowCredentials(!showCredentials)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                          >
                            {showCredentials ? <EyeOff size={12} /> : <Eye size={12} />}
                            <span>{showCredentials ? 'Hide' : 'Reveal'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(viewingSub.account_given);
                              toast.success('Credentials copied to clipboard!');
                            }}
                            className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {inlineCredsEdit ? (
                    <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/50 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                          Account Access / Credentials / License Key:
                        </label>
                        <textarea
                          rows={3}
                          value={inlineCredsValue}
                          onChange={(e) => setInlineCredsValue(e.target.value)}
                          placeholder="Type or paste credentials (e.g. Email: ... | Password: ...) or license key..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                        />
                      </div>

                      {digitalAccounts && digitalAccounts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <label className="text-slate-400 text-[11px] font-medium">Link Digital Account Slot:</label>
                          <select
                            value={inlineDigitalAccId}
                            onChange={(e) => setInlineDigitalAccId(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">-- No Account Linked --</option>
                            {digitalAccounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.product_name}{acc.package_name ? ` • [${acc.package_name}]` : ''} ({acc.account_email})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setInlineCredsEdit(false)}
                          className="px-2.5 py-1 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingInlineCreds}
                          onClick={handleSaveInlineCredentials}
                          className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {savingInlineCreds ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          <span>Save & Update History</span>
                        </button>
                      </div>
                    </div>
                  ) : viewingSub.account_given ? (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 whitespace-pre-wrap break-all select-all leading-relaxed">
                      {showCredentials ? viewingSub.account_given : (
                        viewingSub.account_given.length > 50
                          ? `${viewingSub.account_given.slice(0, 15)}••••••••••••••••••••••••••••••••${viewingSub.account_given.slice(-10)}`
                          : viewingSub.account_given.replace(/[a-zA-Z0-9]/g, '•')
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <span className="italic">No license key or account credentials assigned to this subscription yet.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineCredsValue('');
                          setInlineDigitalAccId(viewingSub.digital_account_id ? String(viewingSub.digital_account_id) : '');
                          setInlineCredsEdit(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer not-italic shadow-xs"
                      >
                        <Key size={12} />
                        <span>Assign Credentials Now</span>
                      </button>
                    </div>
                  )}

                  {/* Associated Digital License Slot info if linked */}
                  {(viewingSub.digital_account_product || viewingSub.digital_account_id || viewingSub.digital_account_email) && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Linked License Account:</span>
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {viewingSub.digital_account_product || `Account #${viewingSub.digital_account_id}`}
                      </span>
                      {viewingSub.digital_account_email && (
                        <span className="font-mono text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {viewingSub.digital_account_email}
                        </span>
                      )}
                      {viewingSub.digital_slot_number && (
                        <span className="font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                          Slot #{viewingSub.digital_slot_number}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Usages Rules Display (if assigned) */}
                {viewingSub.license_rules && (
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <ScrollText size={13} className="text-emerald-600" />
                        <span>Product Usages Rules (Sent in Email)</span>
                      </div>
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✉️ Included in Customer Email
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs text-slate-800 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                      {/<\/?[a-z][\s\S]*>/i.test(viewingSub.license_rules) ? (
                        <div className="rule-html-content" dangerouslySetInnerHTML={{ __html: viewingSub.license_rules }} />
                      ) : (
                        <div className="whitespace-pre-wrap font-sans">{viewingSub.license_rules}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes Section: Customer Notes & Admin Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {/* Customer Notes */}
                  <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <Mail size={13} className="text-emerald-600" />
                        <span>Customer Notes</span>
                      </div>
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✉️ Included in Email
                      </span>
                    </div>
                    {viewingSub.customer_notes ? (
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {viewingSub.customer_notes}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No customer notes provided.</p>
                    )}
                  </div>

                  {/* Admin Notes */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Shield size={13} className="text-amber-600" />
                        <span>Admin Notes</span>
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full border border-slate-300">
                        🔒 Private / Admin Only
                      </span>
                    </div>
                    {(viewingSub.admin_notes || viewingSub.notes) ? (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {viewingSub.admin_notes || viewingSub.notes}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No private admin notes recorded.</p>
                    )}
                  </div>
                </div>

                {/* Renewal & Reminder History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Renewal History */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <History size={13} className="text-slate-600" />
                        Renewal History
                      </h4>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {viewingSub.renewals?.length || 0} record(s)
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full min-w-[540px] text-left text-[10.5px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-100 text-[9.5px] uppercase">
                            <th className="py-1.5 px-2">Start</th>
                            <th className="py-1.5 px-2">End</th>
                            <th className="py-1.5 px-2">Amount</th>
                            <th className="py-1.5 px-2">Status</th>
                            <th className="py-1.5 px-2 min-w-[150px]">Account / License Given</th>
                            <th className="py-1.5 px-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {viewingSub.renewals && viewingSub.renewals.length > 0 ? (
                            viewingSub.renewals.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="py-1.5 px-2 whitespace-nowrap">{new Date(r.start_date).toISOString().slice(0, 10)}</td>
                                <td className="py-1.5 px-2 whitespace-nowrap">{new Date(r.end_date).toISOString().slice(0, 10)}</td>
                                <td className="py-1.5 px-2 font-bold text-emerald-700 whitespace-nowrap">৳{r.amount}</td>
                                <td className="py-1.5 px-2 whitespace-nowrap">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${r.status === 'Current' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2">
                                  <div className="space-y-1 max-w-[220px]">
                                    {(r.digital_account_email || r.digital_slot_number || r.digital_account_product) && (
                                      <div className="flex items-center gap-1 text-[9.5px] font-semibold text-blue-700 bg-blue-50/90 border border-blue-200 px-1.5 py-0.5 rounded leading-tight">
                                        <Server size={10} className="shrink-0 text-blue-600" />
                                        <span className="truncate" title={`${r.digital_account_product || 'Account'}: ${r.digital_account_email || ''}`}>
                                          {r.digital_account_email || r.digital_account_product || 'Digital Account'}
                                        </span>
                                        {r.digital_slot_number && (
                                          <span className="bg-blue-600 text-white text-[8.5px] font-bold px-1 rounded-xs shrink-0">
                                            #{r.digital_slot_number}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {r.account_given ? (
                                      <div className="flex items-center gap-1 bg-slate-900 text-emerald-300 font-mono text-[9.5px] px-1.5 py-0.5 rounded border border-slate-800 leading-tight">
                                        <Key size={10} className="shrink-0 text-emerald-400" />
                                        <span className="truncate flex-1 select-all font-mono" title={r.account_given}>
                                          {r.account_given}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(r.account_given);
                                            toast.success('Account credentials copied!');
                                          }}
                                          title="Copy credentials"
                                          className="text-slate-400 hover:text-emerald-300 p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                                        >
                                          <Copy size={10} />
                                        </button>
                                      </div>
                                    ) : null}
                                    {!r.account_given && !r.digital_account_email && !r.digital_slot_number && !r.digital_account_product && (
                                      <span className="text-slate-400 italic text-[9.5px]">- Not recorded -</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1.5 px-2 text-slate-700">
                                  <div className="space-y-1 max-w-[180px]">
                                    {r.customer_notes && (
                                      <div className="flex items-start gap-1 bg-emerald-50/80 text-emerald-800 text-[9.5px] p-1 rounded border border-emerald-200 leading-tight">
                                        <Mail size={10} className="shrink-0 text-emerald-600 mt-0.5" />
                                        <span className="font-normal break-words line-clamp-2" title={`Customer Note: ${r.customer_notes}`}>
                                          <strong className="font-semibold text-emerald-900">Cust:</strong> {r.customer_notes}
                                        </span>
                                      </div>
                                    )}
                                    {(r.admin_notes || (r.notes && r.notes !== 'Subscription renewed' && r.notes !== 'Initial purchase')) ? (
                                      <div className="flex items-start gap-1 bg-slate-100 text-slate-700 text-[9.5px] p-1 rounded border border-slate-200 leading-tight">
                                        <Shield size={10} className="shrink-0 text-amber-600 mt-0.5" />
                                        <span className="font-normal break-words line-clamp-2" title={`Admin Note: ${r.admin_notes || r.notes}`}>
                                          <strong className="font-semibold text-slate-800">Admin:</strong> {r.admin_notes || r.notes}
                                        </span>
                                      </div>
                                    ) : (r.notes && !r.customer_notes && !r.admin_notes ? (
                                      <span className="text-[9.5px] text-slate-500 italic">{r.notes}</span>
                                    ) : null)}
                                    {!r.customer_notes && !r.admin_notes && (!r.notes || r.notes === 'Subscription renewed' || r.notes === 'Initial purchase') && (
                                      <span className="text-slate-400 italic text-[9.5px]">-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-2.5 text-center text-slate-400 italic">No renewal records yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Reminder Logs */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Bell size={13} className="text-slate-600" />
                        Reminder Logs
                      </h4>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {viewingSub.reminders?.length || 0} log(s)
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-[10.5px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-100 text-[9.5px] uppercase">
                            <th className="py-1.5 px-2">Channel</th>
                            <th className="py-1.5 px-2">Time</th>
                            <th className="py-1.5 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {viewingSub.reminders && viewingSub.reminders.length > 0 ? (
                            viewingSub.reminders.map(rem => (
                              <tr key={rem.id} className="hover:bg-slate-50">
                                <td className="py-1.5 px-2 font-semibold">{rem.channel}</td>
                                <td className="py-1.5 px-2 text-slate-500">{new Date(rem.scheduled_at).toLocaleDateString()}</td>
                                <td className="py-1.5 px-2">
                                  <span className={`font-bold ${rem.status === 'Sent' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {rem.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-2.5 text-center text-slate-400 italic">No reminder records yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 pt-3 mt-4 shrink-0 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySubscriptionSummary(viewingSub)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy Full Summary</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const s = viewingSub;
                      setShowViewModal(false);
                      handleOpenEditModal(s);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const s = viewingSub;
                      setShowViewModal(false);
                      handleOpenDetailModal(s);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Renew</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
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
            width: '168px',
            zIndex: 999999
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-slate-200 rounded-xl shadow-2xl py-1 text-xs text-left ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 font-sans"
        >
          {/* Renew Button */}
          <button
            type="button"
            onClick={() => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleOpenDetailModal(s);
            }}
            className="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw size={13} className="text-emerald-600 shrink-0" />
            <span>Renew</span>
          </button>

          {/* Not Renewed Button */}
          <button
            type="button"
            disabled={togglingNotRenewedId === activeMenuSub?.id}
            onClick={(e) => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleToggleNotRenewed(s, e);
            }}
            className={`w-full px-3 py-2 flex items-center gap-2 font-medium cursor-pointer transition-colors disabled:opacity-60 ${
              activeMenuSub?.status === 'Not Renewed'
                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            {activeMenuSub?.status === 'Not Renewed' ? (
              <>
                <RotateCcw size={13} className="text-slate-500 shrink-0" />
                <span>Revert Not Renewed</span>
              </>
            ) : (
              <>
                <UserX size={13} className="text-rose-500 shrink-0" />
                <span>Not Renewed</span>
              </>
            )}
          </button>

          <div className="border-t border-slate-100 my-1"></div>

          {/* View Details */}
          <button
            type="button"
            onClick={() => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleOpenViewModal(s);
            }}
            className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium cursor-pointer transition-colors"
          >
            <Eye size={13} className="text-blue-600 shrink-0" />
            <span>View Details</span>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleOpenEditModal(s);
            }}
            className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium cursor-pointer transition-colors"
          >
            <Edit2 size={13} className="text-slate-500 shrink-0" />
            <span>Edit</span>
          </button>

          {/* History */}
          <button
            type="button"
            onClick={() => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleOpenDetailModal(s);
            }}
            className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium cursor-pointer transition-colors"
          >
            <History size={13} className="text-slate-500 shrink-0" />
            <span>History</span>
          </button>

          <div className="border-t border-slate-100 my-1"></div>

          {/* Delete */}
          <button
            type="button"
            onClick={() => {
              const s = activeMenuSub;
              setActiveMenuSub(null);
              handleDeleteSubscription(s.id, s.customer_name);
            }}
            className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 font-medium cursor-pointer transition-colors"
          >
            <Trash2 size={13} className="text-rose-500 shrink-0" />
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}

      {/* MODAL: MANAGE CUSTOMER NOTES TEMPLATES */}
      {showManageTemplatesModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowManageTemplatesModal(false)}
        >
          <div className="min-h-full flex items-center justify-center py-4 sm:py-8">
            <div
              className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full flex flex-col p-5 sm:p-6 shadow-2xl text-left overflow-hidden text-slate-900 relative my-auto animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ScrollText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Customer Note Templates (গ্রাহক নোট টেমপ্লেট)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pre-saved note templates saved in database to quickly insert into customer activation and renewal emails.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManageTemplatesModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center justify-between gap-2 mt-4 border-b border-slate-150 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTemplateTab('list');
                      setEditingTemplate(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTemplateTab === 'list'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Saved Templates ({noteTemplates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTemplateTab('add');
                      if (!editingTemplate) {
                        setTemplateForm({ title: '', content: '' });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeTemplateTab === 'add'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Plus size={12} />
                    <span>{editingTemplate ? 'Edit Template' : 'Add New Template'}</span>
                  </button>
                </div>

                {activeTemplateTab === 'add' && editingTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({ title: '', content: '' });
                      setActiveTemplateTab('list');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {activeTemplateTab === 'list' ? (
                  <div className="space-y-3">
                    {loadingNoteTemplates ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        <RefreshCw size={16} className="animate-spin inline mr-2 text-emerald-600" />
                        Loading templates from database...
                      </div>
                    ) : noteTemplates.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                        <p>No note templates saved yet.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplate(null);
                            setTemplateForm({ title: '', content: '' });
                            setActiveTemplateTab('add');
                          }}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                          + Create First Template
                        </button>
                      </div>
                    ) : (
                      noteTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="bg-slate-50 hover:bg-emerald-50/30 p-3.5 rounded-xl border border-slate-200 transition-all space-y-2 group"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {tpl.title}
                            </span>
                            <div className="flex items-center gap-1">
                              {/* Apply to Form */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (showDetailModal) {
                                    handleSelectNoteTemplate(tpl.id, 'renewForm');
                                  } else {
                                    handleSelectNoteTemplate(tpl.id, 'subForm');
                                  }
                                  setShowManageTemplatesModal(false);
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold transition-colors cursor-pointer"
                                title="Insert this template into Customer Notes field"
                              >
                                Insert into Notes
                              </button>
                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleStartEditTemplate(tpl)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                                title="Edit this template"
                              >
                                <Edit2 size={12} />
                              </button>
                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete template from database"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 whitespace-pre-wrap leading-relaxed font-sans">
                            {tpl.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Create / Edit Form */
                  <form onSubmit={handleSaveTemplate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Template Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={templateForm.title}
                        onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                        placeholder="e.g. Do Not Change Password Warning, Account Login Instructions..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Template Content (Sent to Customer in Email) *
                      </label>
                      <textarea
                        rows={5}
                        required
                        value={templateForm.content}
                        onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                        placeholder="Write the message that will be inserted into the customer activation/renewal email..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                      />
                      <p className="text-[10.5px] text-slate-400 mt-1">
                        This text will be saved to the database and will appear in the template dropdown for all future subscriptions and renewals.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTemplateTab('list');
                          setEditingTemplate(null);
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={templateSubmitting}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} />
                        <span>{templateSubmitting ? 'Saving to Database...' : (editingTemplate ? 'Update Template' : 'Save Template to DB')}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
