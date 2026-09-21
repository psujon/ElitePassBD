import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import JoditEditor from 'jodit-react';
import { api, API_BASE_URL } from '../utils/api';
import { Loader2, Plus, Edit2, Trash2, Check, X, ClipboardList, Package, Banknote, MessageSquare, Layers, ChevronDown, ChevronUp, ChevronRight, Database, KeyRound, LayoutDashboard, Palette, Tag, ToggleLeft, ToggleRight, Percent, Search, RefreshCw, Megaphone, ArrowUp, ArrowDown, Headphones, ExternalLink, Globe, Mail, Phone, TrendingUp, ShoppingBag, ArrowRight, ArrowUpRight, CheckCircle2, Sparkles, Clock, Calendar, Eye, Copy, Filter, ArrowUpDown, RotateCcw, Hourglass, Truck, XCircle, ShieldCheck, Save, Send, HardDrive, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SubscriptionManager from '../components/admin/SubscriptionManager';

const parseJSON = (str, fallback) => {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

const joditConfig = {
  readonly: false,
  height: 300,
  enableDragAndDropFileToEditor: true,
  buttons: [
    'source', '|',
    'bold', 'strikethrough', 'underline', 'italic', '|',
    'ul', 'ol', '|',
    'outdent', 'indent', '|',
    'font', 'fontsize', 'brush', 'paragraph', '|',
    'image', 'video', 'table', 'link', '|',
    'align', 'undo', 'redo', '|',
    'hr', 'eraser', 'copyformat', '|',
    'symbol', 'fullsize', 'print', 'about'
  ],
  removeButtons: [],
  showXPathInStatusbar: false,
  showCharsCounter: false,
  showWordsCounter: false,
  toolbarAdaptive: false
};

const tabSlugToKey = {
  '': 'dashboard',
  'overview': 'dashboard',
  'dashboard': 'dashboard',
  'products': 'products',
  'catalog-products': 'products',
  'orders': 'orders',
  'customer-orders': 'orders',
  'subscriptions': 'subscriptions_manager',
  'subscriptions_manager': 'subscriptions_manager',
  'categories': 'categories',
  'tickets': 'tickets',
  'support-tickets': 'tickets',
  'licenses': 'licenses',
  'license-keys': 'licenses',
  'coupons': 'coupons',
  'promo-codes': 'coupons',
  'backup': 'backup',
  'database-backup': 'backup',
  'eps-payments': 'eps_history',
  'eps_history': 'eps_history',
  'slides': 'slides',
  'marquee': 'marquee_settings',
  'marquee-settings': 'marquee_settings',
  'marquee_settings': 'marquee_settings',
  'support': 'support_settings',
  'support-links': 'support_settings',
  'support_settings': 'support_settings',
  'theme-settings': 'theme_settings',
  'theme_settings': 'theme_settings'
};

const keyToTabSlug = {
  'dashboard': '/dashboard/overview',
  'products': '/dashboard/products',
  'orders': '/dashboard/orders',
  'subscriptions_manager': '/dashboard/subscriptions',
  'categories': '/dashboard/categories',
  'tickets': '/dashboard/tickets',
  'licenses': '/dashboard/licenses',
  'coupons': '/dashboard/coupons',
  'backup': '/dashboard/backup',
  'eps_history': '/dashboard/eps-payments',
  'slides': '/dashboard/slides',
  'marquee_settings': '/dashboard/marquee',
  'support_settings': '/dashboard/support-links',
  'theme_settings': '/dashboard/theme-settings'
};

export default function AdminDashboard() {
  const { theme, updateTheme, selectPreset, THEME_PRESETS } = useTheme();
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTabState] = useState(() => {
    return tabSlugToKey[urlTab || ''] || 'dashboard';
  });

  useEffect(() => {
    if (urlTab !== undefined) {
      const targetKey = tabSlugToKey[urlTab] || 'dashboard';
      setActiveTabState(targetKey);
    }
  }, [urlTab]);

  const setActiveTab = (newKey) => {
    setActiveTabState(newKey);
    const targetSlug = keyToTabSlug[newKey] || '/dashboard/overview';
    navigate(targetSlug);
  };

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [epsHistory, setEpsHistory] = useState([]);
  const [slides, setSlides] = useState([]);
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideFormSubmitting, setSlideFormSubmitting] = useState(false);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    closed: 0
  });
  const [loading, setLoading] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [productSortField, setProductSortField] = useState('id');
  const [productSortAsc, setProductSortAsc] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);

  // Dynamic Dashboard Tables State
  const [dashOrderSearch, setDashOrderSearch] = useState('');
  const [dashOrderStatus, setDashOrderStatus] = useState('all');
  const [dashOrderSortField, setDashOrderSortField] = useState('date');
  const [dashOrderSortAsc, setDashOrderSortAsc] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [dashTicketSearch, setDashTicketSearch] = useState('');
  const [dashTicketStatus, setDashTicketStatus] = useState('all');
  const [dashTicketSortAsc, setDashTicketSortAsc] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  // Customer Orders Tab State
  const [orderTabSearch, setOrderTabSearch] = useState('');
  const [orderTabStatus, setOrderTabStatus] = useState('all');
  const [orderTabPayment, setOrderTabPayment] = useState('all');
  const [orderTabSource, setOrderTabSource] = useState('all'); // 'all', 'website', 'manual'
  const [orderTabSortField, setOrderTabSortField] = useState('date');
  const [orderTabSortAsc, setOrderTabSortAsc] = useState(false);
  const [orderTabPage, setOrderTabPage] = useState(1);

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
    highlighted_text: '',
    discount_percent: '',
    is_hot: false,
    is_highlighted: false,
    is_hot_discount: false,
    activation_process: 'Manual'
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null means adding new
  const [backingUp, setBackingUp] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [autoBackupEmail, setAutoBackupEmail] = useState('');
  const [backupScheduleTime, setBackupScheduleTime] = useState('17:05 (5:05 PM BST)');
  const [backupLastRun, setBackupLastRun] = useState(null);
  const [backupLastStatus, setBackupLastStatus] = useState(null);
  const [backupLastSize, setBackupLastSize] = useState(null);
  const [backupLastTables, setBackupLastTables] = useState(null);
  const [backupLastRows, setBackupLastRows] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSaving, setBackupSaving] = useState(false);
  const [backupSendingEmail, setBackupSendingEmail] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });
  const [categoryFormError, setCategoryFormError] = useState('');
  const [categoryFormSubmitting, setCategoryFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockPackages, setStockPackages] = useState([]);
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [licenseForm, setLicenseForm] = useState({
    product_id: '',
    activation_option: '',
    package_option: '',
    rules: '',
    license_key: ''
  });
  const [licenseFormSubmitting, setLicenseFormSubmitting] = useState(false);
  const [licenseFormError, setLicenseFormError] = useState('');
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseCurrentPage, setLicenseCurrentPage] = useState(1);
  const [licenseProductSearch, setLicenseProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [licenseStatusFilter, setLicenseStatusFilter] = useState('all');
  const [licenseProductFilter, setLicenseProductFilter] = useState('all');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    status: 'Pending',
    remarks: ''
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketSortField, setTicketSortField] = useState('date');
  const [ticketSortAsc, setTicketSortAsc] = useState(false);

  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    expires_at: ''
  });
  const [couponFormSubmitting, setCouponFormSubmitting] = useState(false);
  const [couponFormError, setCouponFormError] = useState('');
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState('all');
  const [couponTypeFilter, setCouponTypeFilter] = useState('all');

  const [marqueeEnabled, setMarqueeEnabled] = useState(true);
  const [marqueeSpeed, setMarqueeSpeed] = useState(35);
  const [marqueeItems, setMarqueeItems] = useState([
    {
      id: '1',
      badge: 'বিশেষ অফার',
      text: 'সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান',
      badgeColor: 'purple',
      textColor: 'violet'
    },
    {
      id: '2',
      badge: '🛡️ 100% Genuine',
      text: 'Genuine Digital License & Instant Email Delivery',
      badgeColor: 'emerald',
      textColor: 'emerald'
    },
    {
      id: '3',
      badge: '⭐ 50,000+',
      text: 'Trusted by Happy Customers in Bangladesh',
      badgeColor: 'amber',
      textColor: 'amber'
    }
  ]);
  const [marqueeLoading, setMarqueeLoading] = useState(false);
  const [marqueeSaving, setMarqueeSaving] = useState(false);

  const fetchMarqueeSettings = async () => {
    try {
      setMarqueeLoading(true);
      const data = await api.get('/settings/public');
      if (data) {
        if (data.marquee_enabled !== undefined) setMarqueeEnabled(data.marquee_enabled);
        if (data.marquee_speed) setMarqueeSpeed(data.marquee_speed);
        if (Array.isArray(data.marquee_items) && data.marquee_items.length > 0) {
          setMarqueeItems(data.marquee_items);
        }
      }
    } catch (e) {
      console.error('Failed to load marquee settings', e);
    } finally {
      setMarqueeLoading(false);
    }
  };

  const handleSaveMarquee = async () => {
    try {
      setMarqueeSaving(true);
      const payload = {
        marquee_enabled: marqueeEnabled,
        marquee_speed: parseInt(marqueeSpeed, 10) || 35,
        marquee_items: marqueeItems
      };
      await api.put('/settings/marquee', payload);
      toast.success('Moving text announcements updated successfully!');
      window.dispatchEvent(new CustomEvent('marquee-updated', { detail: payload }));
    } catch (err) {
      toast.error(err.message || 'Failed to save marquee settings');
    } finally {
      setMarqueeSaving(false);
    }
  };

  const handleAddMarqueeItem = () => {
    const newItem = {
      id: String(Date.now()),
      badge: 'অফার',
      text: 'নতুন অফার বা নোটিশ এখানে লিখুন',
      badgeColor: 'purple',
      textColor: 'violet'
    };
    setMarqueeItems(prev => [...prev, newItem]);
  };

  const handleUpdateMarqueeItem = (index, field, value) => {
    setMarqueeItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteMarqueeItem = (index) => {
    setMarqueeItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveMarqueeItem = (index, direction) => {
    setMarqueeItems(prev => {
      if ((direction === -1 && index === 0) || (direction === 1 && index === prev.length - 1)) return prev;
      const updated = [...prev];
      const targetIdx = index + direction;
      const temp = updated[index];
      updated[index] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
  };

  const handleResetMarqueeDefaults = () => {
    const defaultItems = [
      {
        id: '1',
        badge: 'বিশেষ অফার',
        text: 'সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান',
        badgeColor: 'purple',
        textColor: 'violet'
      },
      {
        id: '2',
        badge: '🛡️ 100% Genuine',
        text: 'Genuine Digital License & Instant Email Delivery',
        badgeColor: 'emerald',
        textColor: 'emerald'
      },
      {
        id: '3',
        badge: '⭐ 50,000+',
        text: 'Trusted by Happy Customers in Bangladesh',
        badgeColor: 'amber',
        textColor: 'amber'
      }
    ];
    setMarqueeEnabled(true);
    setMarqueeSpeed(35);
    setMarqueeItems(defaultItems);
    toast.success('Reset to default announcements (click Save Changes to apply)');
  };

  const [supportForm, setSupportForm] = useState({
    support_whatsapp: '8801925112444',
    support_email: 'info@elitepassbd.com',
    social_facebook: 'https://facebook.com/ElitePassBD',
    social_instagram: 'https://instagram.com/elitepassbd',
    social_youtube: 'https://youtube.com/elitepassbd',
    social_linkedin: 'https://linkedin.com/elitepassbd',
    social_messenger: 'https://m.me/elitepassbd'
  });
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSaving, setSupportSaving] = useState(false);

  const fetchSupportSettings = async () => {
    try {
      setSupportLoading(true);
      const data = await api.get('/settings/public');
      if (data) {
        setSupportForm({
          support_whatsapp: data.support_whatsapp || '8801925112444',
          support_email: data.support_email || 'info@elitepassbd.com',
          social_facebook: data.social_facebook || 'https://facebook.com/ElitePassBD',
          social_instagram: data.social_instagram || 'https://instagram.com/elitepassbd',
          social_youtube: data.social_youtube || 'https://youtube.com/elitepassbd',
          social_linkedin: data.social_linkedin || 'https://linkedin.com/elitepassbd',
          social_messenger: data.social_messenger || 'https://m.me/elitepassbd'
        });
      }
    } catch (e) {
      console.error('Failed to load support settings', e);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleSaveSupportSettings = async () => {
    try {
      setSupportSaving(true);
      await api.put('/settings/support', supportForm);
      toast.success('Support and social links updated successfully!');
      window.dispatchEvent(new CustomEvent('support-settings-updated', { detail: supportForm }));
    } catch (err) {
      toast.error(err.message || 'Failed to save support settings');
    } finally {
      setSupportSaving(false);
    }
  };

  const handleResetSupportDefaults = () => {
    const defaults = {
      support_whatsapp: '8801925112444',
      support_email: 'info@elitepassbd.com',
      social_facebook: 'https://facebook.com/ElitePassBD',
      social_instagram: 'https://instagram.com/elitepassbd',
      social_youtube: 'https://youtube.com/elitepassbd',
      social_linkedin: 'https://linkedin.com/elitepassbd',
      social_messenger: 'https://m.me/elitepassbd'
    };
    setSupportForm(defaults);
    toast.success('Reset to default contact links (click Save Changes to apply)');
  };

  const fetchBackupSettings = async () => {
    try {
      setBackupLoading(true);
      const res = await api.get('/admin/backup/settings');
      if (res) {
        if (res.enabled !== undefined) setAutoBackupEnabled(res.enabled);
        setAutoBackupEmail(res.email || '');
        if (res.scheduleTime) setBackupScheduleTime(res.scheduleTime);
        if (res.lastRun !== undefined) setBackupLastRun(res.lastRun);
        if (res.lastStatus !== undefined) setBackupLastStatus(res.lastStatus);
        if (res.lastSize !== undefined) setBackupLastSize(res.lastSize);
        if (res.lastTables !== undefined) setBackupLastTables(res.lastTables);
        if (res.lastRows !== undefined) setBackupLastRows(res.lastRows);
      }
    } catch (e) {
      console.error('Failed to load backup settings', e);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleSaveBackupSettings = async () => {
    if (autoBackupEnabled && (!autoBackupEmail || !autoBackupEmail.trim().includes('@'))) {
      toast.error('স্বয়ংক্রিয় ব্যাকআপ চালু রাখতে একটি সঠিক ব্যাকআপ ইমেইল এড্রেস প্রদান করুন।');
      return;
    }
    try {
      setBackupSaving(true);
      const res = await api.put('/admin/backup/settings', {
        enabled: autoBackupEnabled,
        email: (autoBackupEmail || '').trim()
      });
      toast.success(res.message || 'ব্যাকআপ সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!');
      if (res.settings) {
        setAutoBackupEnabled(res.settings.enabled);
        setAutoBackupEmail(res.settings.email || '');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save backup settings');
    } finally {
      setBackupSaving(false);
    }
  };

  const handleSendTestBackupEmail = async () => {
    if (!autoBackupEmail || !autoBackupEmail.trim().includes('@')) {
      toast.error('দয়া করে প্রথমে একটি সঠিক ব্যাকআপ ইমেইল এড্রেস লিখুন ও সেভ করুন।');
      return;
    }
    try {
      setBackupSendingEmail(true);
      const res = await api.post('/admin/backup/send-email', {
        email: autoBackupEmail.trim()
      });
      toast.success(`টেস্ট ব্যাকআপ সফলভাবে [${autoBackupEmail}] ঠিকানায় পাঠানো হয়েছে!`, { duration: 6000 });
      await fetchBackupSettings();
    } catch (err) {
      console.error('Failed to send backup email:', err);
      toast.error(err.message || 'Failed to send backup email.');
      await fetchBackupSettings();
    } finally {
      setBackupSendingEmail(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchMarqueeSettings();
    fetchSupportSettings();
    fetchBackupSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'backup') {
      fetchBackupSettings();
    }
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [prodData, orderData, ticketData, statsData, catData, licenseData, epsData, slideData, couponData] = await Promise.all([
        api.get('/products'),
        api.get('/orders'),
        api.get('/tickets'),
        api.get('/tickets/stats'),
        api.get('/products/categories'),
        api.get('/licenses'),
        api.get('/payments/history'),
        api.get('/slides'),
        api.get('/coupons').catch(() => [])
      ]);
      setProducts(prodData);
      setOrders(orderData);
      setTickets(ticketData);
      setTicketStats(statsData);
      setCategories(catData || []);
      setLicenses(licenseData || []);
      setEpsHistory(epsData || []);
      setSlides(slideData || []);
      setCoupons(couponData || []);
    } catch (err) {
      console.error('Failed to load admin stats', err);
      toast.error('Error loading dashboard data. Are you logged in as an Admin?');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await api.get('/coupons');
      setCoupons(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCouponModal = (coupon = null) => {
    if (coupon && coupon.id) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code || '',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value !== undefined && coupon.discount_value !== null ? coupon.discount_value : '',
        min_order_amount: coupon.min_order_amount !== undefined && coupon.min_order_amount !== null ? coupon.min_order_amount : '',
        max_discount_amount: coupon.max_discount_amount !== undefined && coupon.max_discount_amount !== null ? coupon.max_discount_amount : '',
        usage_limit: coupon.usage_limit !== undefined && coupon.usage_limit !== null ? coupon.usage_limit : '',
        expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : ''
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        expires_at: ''
      });
    }
    setCouponFormError('');
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discount_value) {
      setCouponFormError('Coupon code and discount value are required.');
      return;
    }

    try {
      setCouponFormSubmitting(true);
      setCouponFormError('');
      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, couponForm);
        toast.success('Coupon updated successfully!');
      } else {
        await api.post('/coupons', couponForm);
        toast.success('Coupon created successfully!');
      }
      setShowCouponModal(false);
      setActiveTab('coupons');
      fetchCoupons();
    } catch (err) {
      console.error(err);
      setCouponFormError(err.message || 'Failed to save coupon.');
    } finally {
      setCouponFormSubmitting(false);
    }
  };

  const handleToggleCouponStatus = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}/status`, { is_active: !coupon.is_active });
      toast.success(`Coupon '${coupon.code}' ${!coupon.is_active ? 'activated' : 'deactivated'}.`);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update coupon status.');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await api.delete(`/coupons/${id}`);
        toast.success('Coupon deleted successfully!');
        fetchCoupons();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete coupon.');
      }
    }
  };

  const totalSales = orders
    .filter(o => o.payment_status === 'Paid')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const processingOrdersCount = orders.filter(o => o.status === 'Processing').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'Shipped').length;
  const completedOrdersCount = orders.filter(o => o.status === 'Delivered').length;
  const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;

  // Filtered & Sorted Dashboard Orders
  const filteredDashboardOrders = orders
    .filter((ord) => {
      if (dashOrderStatus !== 'all') {
        const pStatus = (ord.payment_status || '').toLowerCase();
        const oStatus = (ord.status || '').toLowerCase();
        const target = dashOrderStatus.toLowerCase();
        if (target === 'paid' && pStatus !== 'paid') return false;
        if (target === 'pending' && (pStatus === 'paid' || oStatus === 'delivered' || oStatus === 'cancelled')) return false;
        if (target === 'delivered' && oStatus !== 'delivered') return false;
        if (target === 'processing' && oStatus !== 'processing') return false;
        if (target === 'cancelled' && (oStatus !== 'cancelled' && pStatus !== 'cancelled')) return false;
      }
      if (dashOrderSearch.trim()) {
        const q = dashOrderSearch.toLowerCase().trim();
        const idMatch = String(ord.id || '').toLowerCase().includes(q);
        const nameMatch = (ord.user_name || '').toLowerCase().includes(q);
        const emailMatch = (ord.user_email || '').toLowerCase().includes(q);
        const phoneMatch = (ord.phone || '').toLowerCase().includes(q);
        const methodMatch = (ord.payment_method || '').toLowerCase().includes(q);
        const pStatusMatch = (ord.payment_status || '').toLowerCase().includes(q);
        const oStatusMatch = (ord.status || '').toLowerCase().includes(q);
        const itemMatch = ord.items?.some(it => (it.product_name || '').toLowerCase().includes(q));
        return idMatch || nameMatch || emailMatch || phoneMatch || methodMatch || pStatusMatch || oStatusMatch || itemMatch;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (dashOrderSortField === 'id') {
        comparison = (Number(a.id) || 0) - (Number(b.id) || 0);
      } else if (dashOrderSortField === 'total') {
        comparison = (parseFloat(a.total_amount) || 0) - (parseFloat(b.total_amount) || 0);
      } else {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        comparison = dateA - dateB;
      }
      return dashOrderSortAsc ? comparison : -comparison;
    });

  // Filtered & Sorted Dashboard Tickets
  const filteredDashboardTickets = tickets
    .filter((t) => {
      if (dashTicketStatus !== 'all') {
        const tStatus = (t.status || 'pending').toLowerCase();
        if (tStatus !== dashTicketStatus.toLowerCase()) return false;
      }
      if (dashTicketSearch.trim()) {
        const q = dashTicketSearch.toLowerCase().trim();
        const idMatch = String(t.id || '').toLowerCase().includes(q);
        const nameMatch = (t.name || '').toLowerCase().includes(q);
        const emailMatch = (t.email || '').toLowerCase().includes(q);
        const subjMatch = (t.subject || '').toLowerCase().includes(q);
        const msgMatch = (t.message || '').toLowerCase().includes(q);
        return idMatch || nameMatch || emailMatch || subjMatch || msgMatch;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      const comparison = dateA - dateB;
      return dashTicketSortAsc ? comparison : -comparison;
    });

  // Filtered & Sorted Customer Orders Tab
  const filteredTabOrders = orders
    .filter((ord) => {
      if (orderTabStatus !== 'all') {
        const oStatus = (ord.status || '').toLowerCase();
        if (oStatus !== orderTabStatus.toLowerCase()) return false;
      }
      if (orderTabPayment !== 'all') {
        const pStatus = (ord.payment_status || '').toLowerCase();
        if (pStatus !== orderTabPayment.toLowerCase()) return false;
      }
      if (orderTabSource !== 'all') {
        const method = (ord.payment_method || '').toLowerCase();
        const isWeb = method.includes('online') || method.includes('gateway') || method.includes('eps') || Boolean(ord.transaction_id && !method.includes('manual') && !method.includes('whatsapp') && !method.includes('cash'));
        if (orderTabSource === 'website' && !isWeb) return false;
        if (orderTabSource === 'manual' && isWeb) return false;
      }
      if (orderTabSearch.trim()) {
        const q = orderTabSearch.toLowerCase().trim();
        const idMatch = String(ord.id || '').toLowerCase().includes(q);
        const nameMatch = (ord.user_name || '').toLowerCase().includes(q);
        const emailMatch = (ord.user_email || '').toLowerCase().includes(q);
        const phoneMatch = (ord.phone || '').toLowerCase().includes(q);
        const addressMatch = (ord.shipping_address || '').toLowerCase().includes(q);
        const methodMatch = (ord.payment_method || '').toLowerCase().includes(q);
        const trxMatch = String(ord.transaction_id || '').toLowerCase().includes(q);
        const isWeb = methodMatch.includes('online') || methodMatch.includes('gateway') || methodMatch.includes('eps') || Boolean(ord.transaction_id && !methodMatch.includes('manual') && !methodMatch.includes('whatsapp') && !methodMatch.includes('cash'));
        const sourceMatch = (isWeb ? 'website ওয়েবসাইট online gateway' : 'manual ম্যানুয়াল ম্যানুয়াল whatsapp cash offline').includes(q);
        const itemMatch = ord.items?.some(it =>
          (it.product_name || '').toLowerCase().includes(q) ||
          (it.package_name || '').toLowerCase().includes(q) ||
          (it.selected_activation || '').toLowerCase().includes(q) ||
          it.license_keys?.some(k => (k || '').toLowerCase().includes(q))
        );
        return idMatch || nameMatch || emailMatch || phoneMatch || addressMatch || methodMatch || trxMatch || sourceMatch || itemMatch;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (orderTabSortField === 'id') {
        comparison = (Number(a.id) || 0) - (Number(b.id) || 0);
      } else if (orderTabSortField === 'total') {
        comparison = (parseFloat(a.total_amount) || 0) - (parseFloat(b.total_amount) || 0);
      } else if (orderTabSortField === 'customer') {
        comparison = (a.user_name || '').localeCompare(b.user_name || '');
      } else {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        comparison = dateA - dateB;
      }
      return orderTabSortAsc ? comparison : -comparison;
    });

  const ordersPerPage = 15;
  const totalOrderPages = Math.ceil(filteredTabOrders.length / ordersPerPage) || 1;
  const paginatedTabOrders = filteredTabOrders.slice(
    (orderTabPage - 1) * ordersPerPage,
    orderTabPage * ordersPerPage
  );

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
        packages: parseJSON(product.packages, []).map(p => ({
          activation: p.activation || '',
          duration: p.duration || '',
          stock: p.stock !== undefined && p.stock !== null ? p.stock : '',
          discount: p.discount !== undefined && p.discount !== null ? p.discount : '',
          activation_process: p.activation_process || 'Automatic',
          original_price: p.original_price || '',
          retail_price: p.retail_price || '',
          price: p.price || ''
        })),
        device_options: product.device_options || '',
        activation_options: product.activation_options || '',
        highlighted_text: product.highlighted_text || '',
        discount_percent: product.discount_percent !== null && product.discount_percent !== undefined ? product.discount_percent : '',
        is_hot: !!product.is_hot,
        is_highlighted: !!product.is_highlighted,
        is_hot_discount: !!product.is_hot_discount,
        is_top_selling: !!product.is_top_selling,
        activation_process: product.activation_process || 'Manual',
        is_instant: product.is_instant === 1 || (product.is_instant !== 0 && product.activation_process === 'Instant'),
        bullet_points: Array.isArray(product.bullet_points) ? product.bullet_points : []
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
        highlighted_text: '',
        discount_percent: '',
        is_hot: false,
        is_highlighted: false,
        is_hot_discount: false,
        is_top_selling: false,
        activation_process: 'Manual',
        is_instant: false,
        bullet_points: []
      });
    }
    setFormError('');
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const { name, description, category_id } = productForm;

    if (!name || !description) {
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
        await api.put(`/products/${editingProduct.id}`, submissionData);
        toast.success('Product updated successfully!');
      } else {
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

  const handleOpenStockModal = (prod) => {
    setStockProduct(prod);
    const parsed = parseJSON(prod.packages, []).map(p => ({
      activation: p.activation || '',
      duration: p.duration || '',
      stock: p.stock !== undefined && p.stock !== null ? p.stock : 0,
      discount: p.discount !== undefined && p.discount !== null ? p.discount : '',
      activation_process: p.activation_process || 'Manual',
      original_price: p.original_price || '',
      retail_price: p.retail_price || '',
      price: p.price || ''
    }));

    if (parsed.length === 0) {
      parsed.push({
        activation: prod.activation_options ? prod.activation_options.split(',')[0].trim() : 'Standard',
        duration: '1 Month',
        stock: prod.stock || 0,
        discount: prod.discount_percent || '',
        activation_process: prod.activation_process || 'Manual',
        original_price: prod.price || '',
        retail_price: prod.price || '',
        price: prod.price || ''
      });
    }

    setStockPackages(parsed);
    setShowStockModal(true);
  };

  const handleSaveStock = async (e) => {
    if (e) e.preventDefault();
    if (!stockProduct) return;

    try {
      setStockSubmitting(true);
      const calculatedStock = stockPackages.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
      const prices = stockPackages.map(p => parseFloat(p.price)).filter(p => !isNaN(p) && p > 0);
      const calculatedPrice = prices.length > 0 ? Math.min(...prices) : (parseFloat(stockProduct.price) || 0);

      const payload = {
        name: stockProduct.name,
        description: stockProduct.description,
        price: calculatedPrice,
        image_url: stockProduct.image_url,
        stock: calculatedStock,
        category_id: stockProduct.category_id,
        tags: stockProduct.tags,
        additional_info: stockProduct.additional_info,
        faqs: stockProduct.faqs,
        packages: stockPackages,
        device_options: stockProduct.device_options,
        activation_options: stockProduct.activation_options,
        highlighted_text: stockProduct.highlighted_text,
        discount_percent: stockProduct.discount_percent,
        is_hot: stockProduct.is_hot,
        is_highlighted: stockProduct.is_highlighted,
        is_hot_discount: stockProduct.is_hot_discount,
        is_top_selling: stockProduct.is_top_selling,
        activation_process: stockProduct.activation_process,
        is_instant: stockProduct.is_instant,
        bullet_points: stockProduct.bullet_points
      };

      await api.put(`/products/${stockProduct.id}`, payload);
      toast.success(`Stock updated for ${stockProduct.name}! Total: ${calculatedStock} units`);
      setShowStockModal(false);
      fetchAdminData();
    } catch (err) {
      console.error('Failed to update stock:', err);
      toast.error(err.message || 'Failed to update stock');
    } finally {
      setStockSubmitting(false);
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
        await api.put(`/products/categories/${editingCategory.id}`, categoryForm);
        toast.success('Category updated successfully!');
      } else {
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

  const handleUpdatePaymentMethod = async (orderId, newMethod) => {
    try {
      await api.put(`/orders/${orderId}/payment`, { payment_method: newMethod });
      toast.success(`Order #${orderId} payment updated to ${newMethod}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update payment method.');
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

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete order #${orderId}? This action cannot be undone.`)) return;
    try {
      const res = await api.delete(`/orders/${orderId}`);
      toast.success(res.message || `Order #${orderId} deleted successfully!`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete order.');
    }
  };

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

  const handleSlideSubmit = async (e) => {
    e.preventDefault();
    if (!slideImageUrl) {
      toast.error('Please enter an image URL.');
      return;
    }
    try {
      setSlideFormSubmitting(true);
      await api.post('/slides', { image_url: slideImageUrl });
      toast.success('Slide added successfully!');
      setSlideImageUrl('');
      const slideData = await api.get('/slides');
      setSlides(slideData || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save slide.');
    } finally {
      setSlideFormSubmitting(false);
    }
  };

  const handleDeleteSlide = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    try {
      await api.delete(`/slides/${id}`);
      toast.success('Slide deleted successfully!');
      const slideData = await api.get('/slides');
      setSlides(slideData || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete slide.');
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

  const handleOpenLicenseModal = () => {
    setEditingLicense(null);
    setLicenseForm({
      product_id: '',
      activation_option: '',
      package_option: '',
      rules: '',
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
      rules: license.rules || '',
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

  const filteredProducts = products
    .filter((prod) => {
      if (productCategoryFilter !== 'all') {
        if (
          String(prod.category_id) !== String(productCategoryFilter) &&
          prod.category_name !== productCategoryFilter
        ) {
          return false;
        }
      }
      if (productStockFilter !== 'all') {
        const stock = Number(prod.stock) || 0;
        if (productStockFilter === 'in_stock' && stock <= 0) return false;
        if (productStockFilter === 'low_stock' && (stock <= 0 || stock > 5)) return false;
        if (productStockFilter === 'out_of_stock' && stock > 0) return false;
      }
      if (!productSearchQuery) return true;
      const query = productSearchQuery.toLowerCase().trim();
      return (
        prod.name?.toLowerCase().includes(query) ||
        prod.description?.toLowerCase().includes(query) ||
        prod.category_name?.toLowerCase().includes(query) ||
        prod.tags?.toLowerCase().includes(query) ||
        prod.device_options?.toLowerCase().includes(query) ||
        prod.activation_options?.toLowerCase().includes(query) ||
        prod.id?.toString().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (productSortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (productSortField === 'price') {
        comparison = (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
      } else if (productSortField === 'stock') {
        comparison = (Number(a.stock) || 0) - (Number(b.stock) || 0);
      } else {
        comparison = (Number(a.id) || 0) - (Number(b.id) || 0);
      }
      return productSortAsc ? comparison : -comparison;
    });

  const itemsPerPage = 10;
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const activePage = Math.min(currentPage, totalProductPages || 1);
  const displayedProducts = filteredProducts.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((ticket) => {
      if (ticketStatusFilter !== 'all' && ticket.status !== ticketStatusFilter) return false;
      if (!ticketSearchQuery) return true;
      const q = ticketSearchQuery.toLowerCase().trim();
      return (
        ticket.id?.toString().includes(q) ||
        ticket.name?.toLowerCase().includes(q) ||
        ticket.email?.toLowerCase().includes(q) ||
        ticket.subject?.toLowerCase().includes(q) ||
        ticket.message?.toLowerCase().includes(q) ||
        ticket.remarks?.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      let comp = 0;
      if (ticketSortField === 'date') {
        comp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      } else if (ticketSortField === 'id') {
        comp = a.id - b.id;
      } else if (ticketSortField === 'status') {
        comp = (a.status || '').localeCompare(b.status || '');
      } else if (ticketSortField === 'sender') {
        comp = (a.name || '').localeCompare(b.name || '');
      }
      return ticketSortAsc ? comp : -comp;
    });
  }, [tickets, ticketStatusFilter, ticketSearchQuery, ticketSortField, ticketSortAsc]);

  const filteredCategories = React.useMemo(() => {
    if (!categorySearchQuery) return categories;
    const q = categorySearchQuery.toLowerCase().trim();
    return categories.filter((cat) =>
      cat.name?.toLowerCase().includes(q) || cat.id?.toString().includes(q)
    );
  }, [categories, categorySearchQuery]);

  const filteredLicenses = licenses.filter((lic) => {
    if (licenseStatusFilter === 'available' && lic.is_used) return false;
    if (licenseStatusFilter === 'used' && !lic.is_used) return false;
    if (licenseProductFilter !== 'all' && lic.product_name !== licenseProductFilter) return false;
    if (!licenseSearchQuery) return true;
    const query = licenseSearchQuery.toLowerCase();
    return (
      lic.license_key?.toLowerCase().includes(query) ||
      lic.product_name?.toLowerCase().includes(query) ||
      lic.activation_option?.toLowerCase().includes(query) ||
      lic.package_option?.toLowerCase().includes(query) ||
      lic.rules?.toLowerCase().includes(query) ||
      lic.id?.toString().includes(query)
    );
  });

  const filteredCoupons = coupons.filter((c) => {
    if (couponStatusFilter === 'active' && !c.is_active) return false;
    if (couponStatusFilter === 'disabled' && c.is_active) return false;
    if (couponTypeFilter !== 'all' && c.discount_type !== couponTypeFilter) return false;
    if (!couponSearchQuery) return true;
    const query = couponSearchQuery.toLowerCase();
    return (
      c.code?.toLowerCase().includes(query) ||
      c.discount_type?.toLowerCase().includes(query) ||
      c.id?.toString().includes(query)
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

  const menuSections = [
    {
      title: 'GENERAL',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          activeBg: 'bg-white text-indigo-950 border-indigo-200/90 shadow-2xs ring-1 ring-indigo-500/20',
          hoverBg: 'hover:bg-indigo-50/70 hover:text-indigo-900 hover:border-indigo-200/60',
          activeIconColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
          inactiveIconColor: 'text-indigo-500 bg-indigo-50/60 group-hover:bg-indigo-100/90 group-hover:text-indigo-700',
          accentDot: 'bg-indigo-500',
        },
        {
          id: 'products',
          label: 'Catalog Products',
          icon: Package,
          activeBg: 'bg-white text-amber-950 border-amber-200/90 shadow-2xs ring-1 ring-amber-500/20',
          hoverBg: 'hover:bg-amber-50/70 hover:text-amber-900 hover:border-amber-200/60',
          activeIconColor: 'text-amber-600 bg-amber-50 border-amber-100',
          inactiveIconColor: 'text-amber-500 bg-amber-50/60 group-hover:bg-amber-100/90 group-hover:text-amber-700',
          accentDot: 'bg-amber-500',
        },
        {
          id: 'orders',
          label: 'Customer Orders',
          icon: ClipboardList,
          activeBg: 'bg-white text-blue-950 border-blue-200/90 shadow-2xs ring-1 ring-blue-500/20',
          hoverBg: 'hover:bg-blue-50/70 hover:text-blue-900 hover:border-blue-200/60',
          activeIconColor: 'text-blue-600 bg-blue-50 border-blue-100',
          inactiveIconColor: 'text-blue-500 bg-blue-50/60 group-hover:bg-blue-100/90 group-hover:text-blue-700',
          accentDot: 'bg-blue-500',
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
          badgeColor: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white',
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        {
          id: 'subscriptions_manager',
          label: 'Subscriptions',
          icon: RefreshCw,
          activeBg: 'bg-white text-emerald-950 border-emerald-200/90 shadow-2xs ring-1 ring-emerald-500/20',
          hoverBg: 'hover:bg-emerald-50/70 hover:text-emerald-900 hover:border-emerald-200/60',
          activeIconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          inactiveIconColor: 'text-emerald-500 bg-emerald-50/60 group-hover:bg-emerald-100/90 group-hover:text-emerald-700',
          accentDot: 'bg-emerald-500',
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: Layers,
          activeBg: 'bg-white text-purple-950 border-purple-200/90 shadow-2xs ring-1 ring-purple-500/20',
          hoverBg: 'hover:bg-purple-50/70 hover:text-purple-900 hover:border-purple-200/60',
          activeIconColor: 'text-purple-600 bg-purple-50 border-purple-100',
          inactiveIconColor: 'text-purple-500 bg-purple-50/60 group-hover:bg-purple-100/90 group-hover:text-purple-700',
          accentDot: 'bg-purple-500',
        },
        {
          id: 'tickets',
          label: 'Support Tickets',
          icon: MessageSquare,
          activeBg: 'bg-white text-rose-950 border-rose-200/90 shadow-2xs ring-1 ring-rose-500/20',
          hoverBg: 'hover:bg-rose-50/70 hover:text-rose-900 hover:border-rose-200/60',
          activeIconColor: 'text-rose-600 bg-rose-50 border-rose-100',
          inactiveIconColor: 'text-rose-500 bg-rose-50/60 group-hover:bg-rose-100/90 group-hover:text-rose-700',
          accentDot: 'bg-rose-500',
          badge: ticketStats.pending > 0 ? ticketStats.pending : null,
          badgeColor: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white',
        },
        {
          id: 'licenses',
          label: 'License Keys',
          icon: KeyRound,
          activeBg: 'bg-white text-teal-950 border-teal-200/90 shadow-2xs ring-1 ring-teal-500/20',
          hoverBg: 'hover:bg-teal-50/70 hover:text-teal-900 hover:border-teal-200/60',
          activeIconColor: 'text-teal-600 bg-teal-50 border-teal-100',
          inactiveIconColor: 'text-teal-500 bg-teal-50/60 group-hover:bg-teal-100/90 group-hover:text-teal-700',
          accentDot: 'bg-teal-500',
        },
        {
          id: 'coupons',
          label: 'Coupons / Promo Codes',
          icon: Tag,
          activeBg: 'bg-white text-fuchsia-950 border-fuchsia-200/90 shadow-2xs ring-1 ring-fuchsia-500/20',
          hoverBg: 'hover:bg-fuchsia-50/70 hover:text-fuchsia-900 hover:border-fuchsia-200/60',
          activeIconColor: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100',
          inactiveIconColor: 'text-fuchsia-500 bg-fuchsia-50/60 group-hover:bg-fuchsia-100/90 group-hover:text-fuchsia-700',
          accentDot: 'bg-fuchsia-500',
        },
        {
          id: 'backup',
          label: 'Database Backup',
          icon: Database,
          activeBg: 'bg-white text-sky-950 border-sky-200/90 shadow-2xs ring-1 ring-sky-500/20',
          hoverBg: 'hover:bg-sky-50/70 hover:text-sky-900 hover:border-sky-200/60',
          activeIconColor: 'text-sky-600 bg-sky-50 border-sky-100',
          inactiveIconColor: 'text-sky-500 bg-sky-50/60 group-hover:bg-sky-100/90 group-hover:text-sky-700',
          accentDot: 'bg-sky-500',
        },
      ],
    },
    {
      title: 'SETUP',
      items: [
        {
          id: 'slides',
          label: 'Slides',
          icon: Layers,
          activeBg: 'bg-white text-violet-950 border-violet-200/90 shadow-2xs ring-1 ring-violet-500/20',
          hoverBg: 'hover:bg-violet-50/70 hover:text-violet-900 hover:border-violet-200/60',
          activeIconColor: 'text-violet-600 bg-violet-50 border-violet-100',
          inactiveIconColor: 'text-violet-500 bg-violet-50/60 group-hover:bg-violet-100/90 group-hover:text-violet-700',
          accentDot: 'bg-violet-500',
        },
        {
          id: 'marquee_settings',
          label: 'Moving Text / Marquee',
          icon: Megaphone,
          activeBg: 'bg-white text-amber-950 border-amber-200/90 shadow-2xs ring-1 ring-amber-500/20',
          hoverBg: 'hover:bg-amber-50/70 hover:text-amber-900 hover:border-amber-200/60',
          activeIconColor: 'text-amber-600 bg-amber-50 border-amber-100',
          inactiveIconColor: 'text-amber-500 bg-amber-50/60 group-hover:bg-amber-100/90 group-hover:text-amber-700',
          accentDot: 'bg-amber-500',
        },
        {
          id: 'support_settings',
          label: 'Support & Social Links',
          icon: Headphones,
          activeBg: 'bg-white text-blue-950 border-blue-200/90 shadow-2xs ring-1 ring-blue-500/20',
          hoverBg: 'hover:bg-blue-50/70 hover:text-blue-900 hover:border-blue-200/60',
          activeIconColor: 'text-blue-600 bg-blue-50 border-blue-100',
          inactiveIconColor: 'text-blue-500 bg-blue-50/60 group-hover:bg-blue-100/90 group-hover:text-blue-700',
          accentDot: 'bg-blue-500',
        },
        {
          id: 'theme_settings',
          label: 'Theme Settings',
          icon: Palette,
          activeBg: 'bg-white text-pink-950 border-pink-200/90 shadow-2xs ring-1 ring-pink-500/20',
          hoverBg: 'hover:bg-pink-50/70 hover:text-pink-900 hover:border-pink-200/60',
          activeIconColor: 'text-pink-600 bg-pink-50 border-pink-100',
          inactiveIconColor: 'text-pink-500 bg-pink-50/60 group-hover:bg-pink-100/90 group-hover:text-pink-700',
          accentDot: 'bg-pink-500',
        },
      ],
    },
  ];

  return (
    <div className="w-full max-w-full min-w-0 min-h-[calc(100vh-64px)] flex flex-col md:flex-row bg-[#f5f7fa] text-slate-800 overflow-x-hidden">

      <div className="w-full md:w-56 lg:w-64 bg-[#f8fafc] text-slate-900 p-3 sm:p-3.5 md:p-4 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-200 min-w-0 max-w-full">
        {/* Mobile Tab Dropdown Select List */}
        <div className="md:hidden w-full relative mb-3 text-left">
          <label className="text-[9px] font-black uppercase text-slate-500 block mb-1 tracking-wider">
            Menu List
          </label>
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 font-bold text-[11px] rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-xs"
            >
              <option value="dashboard" className="bg-white text-slate-900">📊 Dashboard</option>
              <option value="subscriptions_manager" className="bg-white text-slate-900">🔄 Subscriptions & Renewal Manager</option>
              <option value="products" className="bg-white text-slate-900">📦 Catalog Products ({products.length})</option>
              <option value="orders" className="bg-white text-slate-900">📋 Customer Orders ({orders.length})</option>
              <option value="categories" className="bg-white text-slate-900">🥞 Categories ({categories.length})</option>
              <option value="tickets" className="bg-white text-slate-900">💬 Support Tickets ({tickets.length})</option>
              <option value="licenses" className="bg-white text-slate-900">🔑 License Keys ({licenses.length})</option>
              <option value="coupons" className="bg-white text-slate-900">🏷️ Coupons / Promo Codes ({coupons.length})</option>
              <option value="backup" className="bg-white text-slate-900">💾 Database Backup</option>
              <option value="slides" className="bg-white text-slate-900">🖼️ Slides ({slides.length})</option>
              <option value="marquee_settings" className="bg-white text-slate-900">📢 Moving Text / Marquee</option>
              <option value="support_settings" className="bg-white text-slate-900">🎧 Support & Social Links</option>
              <option value="theme_settings" className="bg-white text-slate-900">🎨 Theme Settings</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Desktop Vertical Menu List */}
        <div className="hidden md:flex md:flex-col space-y-3">
          {menuSections.map((section, sIdx) => (
            <div key={section.title} className={sIdx > 0 ? "pt-1" : ""}>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2.5 mb-1.5 flex items-center justify-between select-none">
                <span>{section.title}</span>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-150 flex items-center space-x-2.5 whitespace-nowrap cursor-pointer group border ${isActive
                        ? `${item.activeBg} font-black`
                        : `border-transparent text-slate-700 font-bold ${item.hoverBg} hover:translate-x-1 hover:shadow-2xs`
                        }`}
                    >
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-md border shrink-0 transition-all duration-150 ${isActive
                          ? item.activeIconColor
                          : `border-transparent ${item.inactiveIconColor}`
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate flex-1 tracking-tight">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full shrink-0 shadow-xs ${item.badgeColor || 'bg-rose-500 text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.accentDot} animate-pulse`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-[#f5f7fa] p-3 sm:p-4 md:p-5 lg:p-6 min-w-0 w-full max-w-full overflow-x-hidden overflow-y-visible md:overflow-y-auto space-y-3.5 sm:space-y-4.5">

        <div className="space-y-5 min-w-0 w-full max-w-full">
          {activeTab === 'subscriptions_manager' && (
            <div className="animate-fade-in text-left min-w-0 w-full max-w-full">
              <SubscriptionManager />
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-5 animate-fade-in text-left min-w-0 w-full max-w-full">
              {/* 3 Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0 w-full max-w-full">
                {/* Card 1: Total Net Revenue */}
                <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-0.5 flex flex-col justify-between min-w-0 w-full">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 group-hover:h-1.5 transition-all"></div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Total Net Revenue
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-100/70 text-emerald-600 border border-emerald-200/60 flex items-center justify-center font-black text-base shadow-2xs group-hover:scale-105 transition-transform">
                        ৳
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                        ৳{totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                        Paid Orders
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">All-time revenue</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer group/btn"
                    >
                      <span>View orders</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
                  </div>
                </div>

                {/* Card 2: Customer Orders */}
                <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-0.5 flex flex-col justify-between min-w-0 w-full">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-400 group-hover:h-1.5 transition-all"></div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                        Customer Orders
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-50 to-purple-100/70 text-violet-600 border border-violet-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                        {totalOrders}
                      </h3>
                      <span className="text-xs font-bold text-slate-400">orders placed</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-violet-700 bg-violet-50 border border-violet-200/70 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5 text-violet-600" />
                        {completedOrdersCount} Delivered
                      </span>
                      {pendingOrdersCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
                          {pendingOrdersCount} Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer group/btn"
                    >
                      <span>Manage all orders</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment</span>
                  </div>
                </div>

                {/* Card 3: Catalog Products */}
                <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-0.5 flex flex-col justify-between min-w-0 w-full">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 group-hover:h-1.5 transition-all"></div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Catalog Products
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-100/70 text-blue-600 border border-blue-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                        {totalProducts}
                      </h3>
                      <span className="text-xs font-bold text-slate-400">products listed</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                        Active Catalog
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">{categories.length} Categories</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('products')}
                      className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer group/btn"
                    >
                      <span>View catalog</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Inventory</span>
                  </div>
                </div>
              </div>

              {/* Lower Section: Tables Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-5 min-w-0 w-full max-w-full">
                {/* Recent Customer Orders Card */}
                <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs min-w-0 w-full max-w-full overflow-hidden">
                  <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 via-white to-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-850 tracking-tight">Recent Customer Orders</h4>
                          <span className="bg-violet-50 text-violet-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-violet-100">
                            {filteredDashboardOrders.length} orders
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Real-time incoming customer purchases, payment verification, and order fulfillment</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-[11px] font-extrabold border border-slate-200 hover:border-violet-200 transition-all shadow-2xs flex items-center gap-1 cursor-pointer group"
                      >
                        <span>View All Orders</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Orders Filter & Search Toolbar */}
                  <div className="bg-slate-50/75 border-b border-slate-200 px-3.5 py-2 sm:px-4 sm:py-2 flex flex-wrap items-center justify-between gap-2">
                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline flex items-center gap-1">
                        <Filter className="w-3 h-3 text-slate-400" /> Filter:
                      </span>
                      {[
                        { key: 'all', label: 'All', count: orders.length, color: 'violet' },
                        { key: 'paid', label: 'Paid', count: orders.filter(o => o.payment_status === 'Paid').length, color: 'emerald' },
                        { key: 'pending', label: 'Pending', count: orders.filter(o => o.payment_status !== 'Paid' && o.status !== 'Cancelled').length, color: 'amber' },
                        { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length, color: 'teal' },
                        { key: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'Processing').length, color: 'blue' },
                        { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled' || o.payment_status === 'Cancelled').length, color: 'rose' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setDashOrderStatus(tab.key)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${dashOrderStatus === tab.key
                            ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70 hover:text-slate-800'
                            }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[9px] px-1 rounded ${dashOrderStatus === tab.key ? 'bg-violet-700/80 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Instant Search Box */}
                    <div className="relative flex items-center">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
                      <input
                        type="text"
                        value={dashOrderSearch}
                        onChange={(e) => setDashOrderSearch(e.target.value)}
                        placeholder="Search order, customer, email..."
                        className="pl-6 pr-6 py-1 text-[11px] bg-white border border-slate-250 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-violet-500 w-44 sm:w-56 shadow-2xs font-medium"
                      />
                      {dashOrderSearch && (
                        <button
                          onClick={() => setDashOrderSearch('')}
                          className="absolute right-1.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bordered Orders Table */}
                  <div className="p-3 sm:p-4 overflow-x-auto w-full max-w-full">
                    <div className="border border-slate-250 rounded-xl overflow-hidden shadow-2xs bg-white">
                      {filteredDashboardOrders.length === 0 ? (
                        <div className="py-10 text-center bg-white">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">No matching orders found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search query or status filter.</p>
                          {(dashOrderSearch || dashOrderStatus !== 'all') && (
                            <button
                              onClick={() => { setDashOrderSearch(''); setDashOrderStatus('all'); }}
                              className="mt-2.5 px-2.5 py-1 text-[10px] font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md border border-violet-200 transition-colors cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          )}
                        </div>
                      ) : (
                        <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                          <thead>
                            <tr className="bg-slate-100/90 text-slate-700 font-black text-[10px] tracking-wider uppercase border-b-2 border-slate-250 select-none">
                              <th className="px-2 py-2.5 w-8 text-center border-r border-slate-200/90">
                                <span className="sr-only">Expand</span>
                              </th>
                              <th
                                onClick={() => {
                                  if (dashOrderSortField === 'id') {
                                    setDashOrderSortAsc(!dashOrderSortAsc);
                                  } else {
                                    setDashOrderSortField('id');
                                    setDashOrderSortAsc(false);
                                  }
                                }}
                                className="px-3 py-2.5 border-r border-slate-200/90 cursor-pointer hover:bg-slate-200/70 transition-colors"
                              >
                                <div className="flex items-center gap-1">
                                  <span>Order</span>
                                  {dashOrderSortField === 'id' ? (
                                    dashOrderSortAsc ? <ArrowUp className="w-3 h-3 text-violet-600" /> : <ArrowDown className="w-3 h-3 text-violet-600" />
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                                  )}
                                </div>
                              </th>
                              <th
                                onClick={() => {
                                  if (dashOrderSortField === 'date') {
                                    setDashOrderSortAsc(!dashOrderSortAsc);
                                  } else {
                                    setDashOrderSortField('date');
                                    setDashOrderSortAsc(false);
                                  }
                                }}
                                className="px-3 py-2.5 border-r border-slate-200/90 cursor-pointer hover:bg-slate-200/70 transition-colors"
                              >
                                <div className="flex items-center gap-1">
                                  <span>Date & Time</span>
                                  {dashOrderSortField === 'date' ? (
                                    dashOrderSortAsc ? <ArrowUp className="w-3 h-3 text-violet-600" /> : <ArrowDown className="w-3 h-3 text-violet-600" />
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                                  )}
                                </div>
                              </th>
                              <th className="px-3 py-2.5 border-r border-slate-200/90">Customer</th>
                              <th
                                onClick={() => {
                                  if (dashOrderSortField === 'total') {
                                    setDashOrderSortAsc(!dashOrderSortAsc);
                                  } else {
                                    setDashOrderSortField('total');
                                    setDashOrderSortAsc(false);
                                  }
                                }}
                                className="px-3 py-2.5 border-r border-slate-200/90 cursor-pointer hover:bg-slate-200/70 transition-colors"
                              >
                                <div className="flex items-center gap-1">
                                  <span>Total</span>
                                  {dashOrderSortField === 'total' ? (
                                    dashOrderSortAsc ? <ArrowUp className="w-3 h-3 text-violet-600" /> : <ArrowDown className="w-3 h-3 text-violet-600" />
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                                  )}
                                </div>
                              </th>
                              <th className="px-3 py-2.5 border-r border-slate-200/90">Payment</th>
                              <th className="px-3 py-2.5 border-r border-slate-200/90">Fulfillment</th>
                              <th className="px-3 py-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70 font-medium">
                            {filteredDashboardOrders.slice(0, 10).map((ord) => {
                              const isExpanded = expandedOrderId === ord.id;
                              return (
                                <React.Fragment key={ord.id}>
                                  <tr
                                    onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                                    className={`transition-colors duration-150 cursor-pointer border-b border-slate-200/75 ${isExpanded
                                      ? 'bg-violet-50/70'
                                      : 'hover:bg-violet-50/30 bg-white'
                                      }`}
                                  >
                                    <td className="px-2 py-2 text-center border-r border-slate-200/70">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedOrderId(isExpanded ? null : ord.id);
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-100/60 transition-all cursor-pointer inline-flex items-center"
                                        title={isExpanded ? "Collapse Details" : "Expand Details"}
                                      >
                                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-violet-700' : ''}`} />
                                      </button>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap border-r border-slate-200/70">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-[11px] font-black text-violet-700 bg-violet-50/90 border border-violet-200/80 px-2 py-0.5 rounded-md inline-block shadow-2xs">
                                          #{ord.id}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard?.writeText(String(ord.id));
                                            toast.success(`Order #${ord.id} copied!`);
                                          }}
                                          title="Copy Order ID"
                                          className="p-1 rounded text-slate-350 hover:text-violet-600 hover:bg-violet-100/50 transition-colors cursor-pointer"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap border-r border-slate-200/70">
                                      {ord.created_at ? (
                                        <div>
                                          <span className="font-bold text-slate-800 text-[11px] block">
                                            {new Date(ord.created_at).toLocaleDateString()}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                                            {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">-</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 border-r border-slate-200/70">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 border border-violet-200/70 font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                          {(ord.user_name || 'U').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-slate-850 text-[11px] truncate leading-tight">
                                            {ord.user_name || 'Anonymous User'}
                                          </p>
                                          <p className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5">
                                            {ord.user_email}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap border-r border-slate-200/70">
                                      <span className="font-black text-slate-900 text-xs block">
                                        ৳{parseFloat(ord.total_amount).toFixed(0)}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400">
                                        {ord.items?.length || 1} item{ord.items?.length > 1 ? 's' : ''}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap border-r border-slate-200/70">
                                      <div className="space-y-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${ord.payment_status === 'Paid'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-2xs'
                                          : ord.payment_status === 'Failed'
                                            ? 'bg-rose-50 text-rose-700 border-rose-200/90'
                                            : ord.payment_status === 'Cancelled'
                                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                                              : 'bg-amber-50 text-amber-700 border-amber-200/90'
                                          }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${ord.payment_status === 'Paid'
                                            ? 'bg-emerald-500'
                                            : ord.payment_status === 'Failed'
                                              ? 'bg-rose-500'
                                              : ord.payment_status === 'Cancelled'
                                                ? 'bg-slate-400'
                                                : 'bg-amber-500 animate-pulse'
                                            }`}></span>
                                          {ord.payment_status || 'Pending'}
                                        </span>
                                        {ord.payment_method && (
                                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                            {ord.payment_method}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap border-r border-slate-200/70">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${ord.status === 'Delivered'
                                        ? 'bg-teal-50 text-teal-700 border-teal-200/90 shadow-2xs'
                                        : ord.status === 'Cancelled'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200/90'
                                          : ord.status === 'Processing'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200/90'
                                            : ord.status === 'Shipped'
                                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/90'
                                              : 'bg-violet-50 text-violet-700 border-violet-200/90'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${ord.status === 'Delivered'
                                          ? 'bg-teal-500'
                                          : ord.status === 'Cancelled'
                                            ? 'bg-rose-500'
                                            : ord.status === 'Processing'
                                              ? 'bg-blue-500'
                                              : ord.status === 'Shipped'
                                                ? 'bg-indigo-500'
                                                : 'bg-violet-500'
                                          }`}></span>
                                        {ord.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedOrderId(isExpanded ? null : ord.id);
                                          }}
                                          title={isExpanded ? "Hide Details" : "View Order Details"}
                                          className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer inline-flex items-center border border-transparent hover:border-violet-100"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteOrder(ord.id);
                                          }}
                                          title="Delete Order"
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex items-center border border-transparent hover:border-rose-100"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Expandable Order Details Drawer */}
                                  {isExpanded && (
                                    <tr className="bg-slate-50/95 border-b border-slate-200">
                                      <td colSpan="8" className="p-3 sm:p-4 text-left border-r-0">
                                        <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-3">
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-slate-800 text-xs">
                                                Order #{ord.id} - Item Details
                                              </span>
                                              <span className="text-[10px] text-slate-500 font-medium">
                                                Placed on {new Date(ord.created_at).toLocaleString()}
                                              </span>
                                            </div>
                                            <button
                                              onClick={() => setActiveTab('orders')}
                                              className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-200/80 hover:bg-violet-100 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1"
                                            >
                                              <span>Open Full Order Panel</span>
                                              <ArrowRight className="w-3 h-3" />
                                            </button>
                                          </div>

                                          {/* Purchased Items List */}
                                          <div className="space-y-1.5">
                                            {ord.items && ord.items.length > 0 ? (
                                              ord.items.map((it, itIdx) => (
                                                <div key={itIdx} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                                  <div>
                                                    <span className="font-bold text-slate-900">{it.product_name}</span>
                                                    <span className="text-slate-500 font-bold ml-1.5">x{it.quantity}</span>
                                                    {(it.package_name || it.selected_device || it.selected_activation) && (
                                                      <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] font-semibold text-slate-600">
                                                        {it.package_name && <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">Pkg: {it.package_name}</span>}
                                                        {it.selected_device && <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">Device: {it.selected_device}</span>}
                                                        {it.selected_activation && <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">Activation: {it.selected_activation}</span>}
                                                      </div>
                                                    )}
                                                  </div>

                                                  {it.license_keys && it.license_keys.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1">
                                                      <span className="text-[10px] font-bold text-slate-500">License:</span>
                                                      {it.license_keys.map((lic, lIdx) => (
                                                        <code key={lIdx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono select-all">
                                                          {lic}
                                                        </code>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-slate-400 text-xs">No detailed items recorded for this order.</p>
                                            )}
                                          </div>

                                          {/* Customer Details Footer */}
                                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 border-t border-slate-100 pt-2">
                                            {ord.phone && <span><strong>Phone:</strong> {ord.phone}</span>}
                                            {ord.shipping_address && <span><strong>Address:</strong> {ord.shipping_address}</span>}
                                            {ord.additional_notes && <span><strong>Notes:</strong> {ord.additional_notes}</span>}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Orders Table Footer Count */}
                  <div className="px-3.5 py-2 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium gap-2">
                    <span>
                      Showing {Math.min(filteredDashboardOrders.length, 10)} of {filteredDashboardOrders.length} orders
                      {filteredDashboardOrders.length !== orders.length ? ` (filtered from ${orders.length} total)` : ''}
                    </span>
                    {(dashOrderSearch || dashOrderStatus !== 'all') && (
                      <button
                        onClick={() => { setDashOrderSearch(''); setDashOrderStatus('all'); }}
                        className="text-violet-600 hover:text-violet-800 font-bold text-[10px] cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Support Tickets Card */}
                <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs min-w-0 w-full max-w-full overflow-hidden">
                  <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 via-white to-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-850 tracking-tight">Recent Support Tickets</h4>
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-amber-100">
                            {filteredDashboardTickets.length} tickets
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Latest customer queries, issues, and customer assistance inquiries</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('tickets')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 text-[11px] font-extrabold border border-slate-200 hover:border-amber-200 transition-all shadow-2xs flex items-center gap-1 cursor-pointer group"
                      >
                        <span>View All Tickets</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Tickets Filter & Search Toolbar */}
                  <div className="bg-slate-50/75 border-b border-slate-200 px-3.5 py-2 sm:px-4 sm:py-2 flex flex-wrap items-center justify-between gap-2">
                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline flex items-center gap-1">
                        <Filter className="w-3 h-3 text-slate-400" /> Filter:
                      </span>
                      {[
                        { key: 'all', label: 'All', count: tickets.length },
                        { key: 'pending', label: 'Pending', count: tickets.filter(t => t.status === 'Pending' || !t.status).length },
                        { key: 'resolved', label: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length },
                        { key: 'closed', label: 'Closed', count: tickets.filter(t => t.status === 'Closed').length }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setDashTicketStatus(tab.key)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${dashTicketStatus === tab.key
                            ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70 hover:text-slate-800'
                            }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[9px] px-1 rounded ${dashTicketStatus === tab.key ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Search Field */}
                    <div className="relative flex items-center">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
                      <input
                        type="text"
                        value={dashTicketSearch}
                        onChange={(e) => setDashTicketSearch(e.target.value)}
                        placeholder="Search tickets by sender, subject..."
                        className="pl-6 pr-6 py-1 text-[11px] bg-white border border-slate-250 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 w-44 sm:w-56 shadow-2xs font-medium"
                      />
                      {dashTicketSearch && (
                        <button
                          onClick={() => setDashTicketSearch('')}
                          className="absolute right-1.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bordered Tickets Table */}
                  <div className="p-3 sm:p-4 overflow-x-auto w-full max-w-full">
                    <div className="border border-slate-250 rounded-xl overflow-hidden shadow-2xs bg-white">
                      {filteredDashboardTickets.length === 0 ? (
                        <div className="py-10 text-center bg-white">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">No support tickets found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Customer support inquiries will appear here.</p>
                          {(dashTicketSearch || dashTicketStatus !== 'all') && (
                            <button
                              onClick={() => { setDashTicketSearch(''); setDashTicketStatus('all'); }}
                              className="mt-2.5 px-2.5 py-1 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          )}
                        </div>
                      ) : (
                        <table className="w-full text-xs text-left border-collapse min-w-[680px]">
                          <thead>
                            <tr className="bg-slate-100/90 text-slate-700 font-black text-[10px] tracking-wider uppercase border-b-2 border-slate-250 select-none">
                              <th className="px-2 py-2.5 w-8 text-center border-r border-slate-200/90">
                                <span className="sr-only">Expand</span>
                              </th>
                              <th
                                onClick={() => setDashTicketSortAsc(!dashTicketSortAsc)}
                                className="px-3 py-2.5 border-r border-slate-200/90 cursor-pointer hover:bg-slate-200/70 transition-colors"
                              >
                                <div className="flex items-center gap-1">
                                  <span>Ticket</span>
                                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                                </div>
                              </th>
                              <th className="px-3 py-2.5 border-r border-slate-200/90">Sender</th>
                              <th className="px-3 py-2.5 border-r border-slate-200/90">Subject & Message</th>
                              <th className="px-3 py-2.5 border-r border-slate-200/90">Status</th>
                              <th className="px-3 py-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70 font-medium">
                            {filteredDashboardTickets.slice(0, 5).map((t) => {
                              const isExpanded = expandedTicketId === t.id;
                              return (
                                <React.Fragment key={t.id}>
                                  <tr
                                    onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                                    className={`transition-colors duration-150 cursor-pointer border-b border-slate-200/75 ${isExpanded ? 'bg-amber-50/70' : 'hover:bg-amber-50/30 bg-white'
                                      }`}
                                  >
                                    <td className="px-2 py-2 text-center border-r border-slate-200/70">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedTicketId(isExpanded ? null : t.id);
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 transition-all cursor-pointer inline-flex items-center"
                                        title={isExpanded ? "Collapse Details" : "Expand Details"}
                                      >
                                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-amber-700' : ''}`} />
                                      </button>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap border-r border-slate-200/70">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-[11px] font-black text-amber-700 bg-amber-50/90 border border-amber-200/80 px-2 py-0.5 rounded-md inline-block shadow-2xs">
                                          #T{t.id}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard?.writeText(String(t.id));
                                            toast.success(`Ticket #T${t.id} copied!`);
                                          }}
                                          title="Copy Ticket ID"
                                          className="p-1 rounded text-slate-350 hover:text-amber-600 hover:bg-amber-100/50 transition-colors cursor-pointer"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-slate-200/70">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 border border-amber-200/70 font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                          {(t.name || 'U').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-slate-850 text-[11px] truncate leading-tight">
                                            {t.name || 'User'}
                                          </p>
                                          <p className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5">
                                            {t.email}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 max-w-[240px] border-r border-slate-200/70">
                                      <p className="font-bold text-slate-800 text-[11px] truncate" title={t.subject}>
                                        {t.subject}
                                      </p>
                                      {t.message && (
                                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                          {t.message}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap border-r border-slate-200/70">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${t.status === 'Resolved'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-2xs'
                                        : t.status === 'Closed'
                                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                                          : 'bg-amber-50 text-amber-700 border-amber-200/90'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Resolved'
                                          ? 'bg-emerald-500'
                                          : t.status === 'Closed'
                                            ? 'bg-slate-400'
                                            : 'bg-amber-500 animate-pulse'
                                          }`}></span>
                                        {t.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTicket(t);
                                            setActiveTab('tickets');
                                          }}
                                          className="px-2 py-0.5 text-[11px] font-bold text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-md border border-slate-200 hover:border-violet-200 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                        >
                                          <span>Reply</span>
                                          <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Expandable Ticket Details Drawer */}
                                  {isExpanded && (
                                    <tr className="bg-amber-50/40 border-b border-slate-200">
                                      <td colSpan="6" className="p-3 sm:p-4 text-left border-r-0">
                                        <div className="bg-white border border-amber-200/80 rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-slate-850 text-xs">
                                                Ticket #T{t.id}: {t.subject}
                                              </span>
                                              <span className="text-[10px] text-slate-400">
                                                from {t.name} ({t.email})
                                              </span>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setActiveTicket(t);
                                                setActiveTab('tickets');
                                              }}
                                              className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                                            >
                                              <span>Open in Support Desk</span>
                                              <ArrowRight className="w-3 h-3" />
                                            </button>
                                          </div>

                                          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                                            {t.message || 'No message body provided.'}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Tickets Table Footer Count */}
                  <div className="px-3.5 py-2 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium gap-2">
                    <span>
                      Showing {Math.min(filteredDashboardTickets.length, 5)} of {filteredDashboardTickets.length} tickets
                      {filteredDashboardTickets.length !== tickets.length ? ` (filtered from ${tickets.length} total)` : ''}
                    </span>
                    {(dashTicketSearch || dashTicketStatus !== 'all') && (
                      <button
                        onClick={() => { setDashTicketSearch(''); setDashTicketStatus('all'); }}
                        className="text-amber-600 hover:text-amber-800 font-bold text-[10px] cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-3.5 animate-fade-in text-left min-w-0 w-full max-w-full">
              {/* Product Catalog Top Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2.5 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-850 tracking-tight">Products Catalog</h3>
                    <span className="bg-violet-50 text-violet-700 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full border border-violet-100">
                      {filteredProducts.length} items
                    </span>
                  </div>

                  {/* Category Filter Dropdown */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => {
                      setProductCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-250 focus:border-violet-500 focus:outline-hidden rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Categories ({products.length})</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name} ({products.filter(p => p.category_name === cat.name || String(p.category_id) === String(cat.id)).length})
                      </option>
                    ))}
                  </select>

                  {/* Search Input Box */}
                  <div className="relative flex items-center">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search name, tags, description..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-6 pr-6 py-1 text-[11px] bg-white border border-slate-250 focus:border-violet-500 focus:outline-hidden rounded-lg text-slate-800 placeholder-slate-400 w-44 sm:w-56 shadow-2xs font-medium"
                    />
                    {productSearchQuery && (
                      <button
                        onClick={() => {
                          setProductSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-1.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
                  {/* Stock Quick Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'in_stock', label: 'In Stock' },
                      { key: 'low_stock', label: 'Low' },
                      { key: 'out_of_stock', label: 'Out' }
                    ].map(st => (
                      <button
                        key={st.key}
                        onClick={() => {
                          setProductStockFilter(st.key);
                          setCurrentPage(1);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${productStockFilter === st.key
                          ? 'bg-white text-slate-900 shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleOpenProductModal()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-extrabold rounded-lg transition-all cursor-pointer shadow-2xs active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Bordered Products Table Container */}
              <div className="bg-white border border-slate-250 rounded-xl overflow-hidden shadow-2xs min-w-0 w-full max-w-full">
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
                    <thead className="bg-slate-100/90 text-slate-700 uppercase font-black text-[9.5px] tracking-wider border-b-2 border-slate-250 select-none">
                      <tr>
                        <th className="px-2 py-2 w-7 text-center border-r border-slate-200/90">
                          <span className="sr-only">Expand</span>
                        </th>
                        <th
                          onClick={() => {
                            if (productSortField === 'name') {
                              setProductSortAsc(!productSortAsc);
                            } else {
                              setProductSortField('name');
                              setProductSortAsc(true);
                            }
                          }}
                          className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90 cursor-pointer hover:bg-slate-200/70 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            <span>Item Details</span>
                            {productSortField === 'name' ? (
                              productSortAsc ? <ArrowUp className="w-2.5 h-2.5 text-violet-600" /> : <ArrowDown className="w-2.5 h-2.5 text-violet-600" />
                            ) : (
                              <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>
                        <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90">Category</th>
                        <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90">Description</th>
                        <th
                          onClick={() => {
                            if (productSortField === 'price') {
                              setProductSortAsc(!productSortAsc);
                            } else {
                              setProductSortField('price');
                              setProductSortAsc(true);
                            }
                          }}
                          className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90 cursor-pointer hover:bg-slate-200/70 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            <span>Price</span>
                            {productSortField === 'price' ? (
                              productSortAsc ? <ArrowUp className="w-2.5 h-2.5 text-violet-600" /> : <ArrowDown className="w-2.5 h-2.5 text-violet-600" />
                            ) : (
                              <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>
                        <th className="px-2 py-2 whitespace-nowrap border-r border-slate-200/90 text-center font-black text-emerald-800 bg-emerald-50/50">
                          <span className="inline-flex items-center gap-0.5">
                            <Plus className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Add</span>
                          </span>
                        </th>
                        <th
                          onClick={() => {
                            if (productSortField === 'stock') {
                              setProductSortAsc(!productSortAsc);
                            } else {
                              setProductSortField('stock');
                              setProductSortAsc(true);
                            }
                          }}
                          className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90 cursor-pointer hover:bg-slate-200/70 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            <span>Stock</span>
                            {productSortField === 'stock' ? (
                              productSortAsc ? <ArrowUp className="w-2.5 h-2.5 text-violet-600" /> : <ArrowDown className="w-2.5 h-2.5 text-violet-600" />
                            ) : (
                              <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                            )}
                          </div>
                        </th>
                        <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90">Tags</th>
                        <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90">Devices</th>
                        <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90">Activation</th>
                        <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90">Additional Info</th>
                        <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90">Packages</th>
                        <th className="px-2.5 py-2 whitespace-nowrap border-r border-slate-200/90">FAQs</th>
                        <th className="px-2.5 py-2 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 font-medium">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="14" className="py-10 text-center text-slate-400 font-medium">
                            <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-bold text-slate-600">
                              {products.length === 0 ? 'No products available.' : 'No matching products found.'}
                            </p>
                            {(productSearchQuery || productCategoryFilter !== 'all' || productStockFilter !== 'all') && (
                              <button
                                onClick={() => {
                                  setProductSearchQuery('');
                                  setProductCategoryFilter('all');
                                  setProductStockFilter('all');
                                  setCurrentPage(1);
                                }}
                                className="mt-2 text-violet-600 hover:text-violet-800 font-bold text-[10px] cursor-pointer"
                              >
                                Reset All Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        displayedProducts.map((prod) => {
                          const isExpanded = expandedProductId === prod.id;
                          const tags = prod.tags ? prod.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                          const visibleTags = tags.slice(0, 2);
                          const remainingTags = tags.slice(2);

                          const devices = prod.device_options ? prod.device_options.split(',').map(d => d.trim()).filter(Boolean) : [];
                          const visibleDevices = devices.slice(0, 2);
                          const remainingDevices = devices.slice(2);

                          const activations = prod.activation_options ? prod.activation_options.split(',').map(a => a.trim()).filter(Boolean) : [];
                          const visibleActivations = activations.slice(0, 1);
                          const remainingActivations = activations.slice(1);

                          return (
                            <React.Fragment key={prod.id}>
                              <tr
                                onClick={() => setExpandedProductId(isExpanded ? null : prod.id)}
                                className={`transition-colors duration-150 cursor-pointer border-b border-slate-200/75 ${isExpanded ? 'bg-violet-50/60' : 'hover:bg-violet-50/25 bg-white'
                                  }`}
                              >
                                {/* Column 0: Expand Chevron */}
                                <td className="px-1.5 py-1.5 text-center border-r border-slate-200/70">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedProductId(isExpanded ? null : prod.id);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-100/50 transition-all cursor-pointer inline-flex items-center"
                                    title={isExpanded ? "Collapse Details" : "Expand Details"}
                                  >
                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-violet-700' : ''}`} />
                                  </button>
                                </td>

                                {/* Column 1: Item Details (Image, Name, Badges) */}
                                <td className="px-2.5 py-1.5 border-r border-slate-200/70">
                                  <div className="flex items-center space-x-2 shrink-0">
                                    {prod.image_url ? (
                                      <img
                                        src={prod.image_url}
                                        alt={prod.name}
                                        className="w-7 h-7 object-cover rounded-md bg-slate-100 border border-slate-200/80 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 bg-slate-100 border border-slate-200/80 rounded-md flex items-center justify-center text-[8px] text-slate-400 shrink-0 font-bold">
                                        No Img
                                      </div>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-bold text-slate-850 text-[11px] leading-tight line-clamp-1 max-w-[130px]" title={prod.name}>
                                        {prod.name}
                                      </span>
                                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                        {!!prod.is_hot && (
                                          <span className="text-[8px] bg-orange-100 text-orange-600 border border-orange-200 px-1 py-0.2 rounded font-black leading-none">HOT</span>
                                        )}
                                        {!!prod.is_highlighted && (
                                          <span className="text-[8px] bg-amber-100 text-amber-600 border border-amber-200 px-1 py-0.2 rounded font-black leading-none">FEATURED</span>
                                        )}
                                        {!!prod.is_hot_discount && (
                                          <span className="text-[8px] bg-red-100 text-red-600 border border-red-200 px-1 py-0.2 rounded font-black leading-none">DISCOUNT</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Column 2: Category */}
                                <td className="px-2.5 py-1.5 whitespace-nowrap border-r border-slate-200/70">
                                  {prod.category_name ? (
                                    <span className="bg-violet-50 text-violet-700 border border-violet-200/80 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                                      {prod.category_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">-</span>
                                  )}
                                </td>

                                {/* Column 3: Description */}
                                <td className="px-2.5 py-1.5 max-w-[120px] border-r border-slate-200/70">
                                  <p
                                    className="truncate text-slate-500 text-[10px]"
                                    title={prod.description ? prod.description.replace(/<[^>]*>?/gm, '') : ''}
                                  >
                                    {prod.description ? prod.description.replace(/<[^>]*>?/gm, '') : <span className="text-slate-400 italic">-</span>}
                                  </p>
                                </td>

                                {/* Column 4: Price */}
                                <td className="px-2.5 py-1.5 font-black text-slate-900 text-[11px] whitespace-nowrap border-r border-slate-200/70">
                                  ৳{parseFloat(prod.price).toFixed(2)}
                                </td>

                                {/* Column 4.5: Add / Manage Package Stock Button */}
                                <td className="px-2 py-1.5 whitespace-nowrap border-r border-slate-200/70 text-center bg-slate-50/40">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenStockModal(prod);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.75 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 rounded-md text-[9.5px] font-black transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group/sbtn"
                                    title={`Increase / Edit Stock for ${prod.name}`}
                                  >
                                    <Plus className="w-3 h-3 text-emerald-600 group-hover/sbtn:text-white transition-colors" />
                                    <span>Add</span>
                                  </button>
                                </td>

                                {/* Column 5: Stock */}
                                <td className="px-2.5 py-1.5 whitespace-nowrap border-r border-slate-200/70">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${prod.stock === 0
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : prod.stock <= 5
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                    {prod.stock} left
                                  </span>
                                </td>

                                {/* Column 6: Tags (Max 2 + remaining count pill) */}
                                <td className="px-2.5 py-1.5 border-r border-slate-200/70">
                                  {tags.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1 max-w-[130px]">
                                      {visibleTags.map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="bg-slate-100 text-slate-700 border border-slate-250 px-1.5 py-0.5 rounded text-[8.5px] font-bold whitespace-nowrap"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      {remainingTags.length > 0 && (
                                        <span
                                          title={remainingTags.join(', ')}
                                          className="bg-slate-200/80 text-slate-600 border border-slate-300 px-1.5 py-0.5 rounded text-[8.5px] font-extrabold cursor-help select-none hover:bg-slate-300 transition-colors"
                                        >
                                          +{remainingTags.length}...
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">-</span>
                                  )}
                                </td>

                                {/* Column 7: Devices (Max 2 + remaining count pill) */}
                                <td className="px-2.5 py-1.5 border-r border-slate-200/70">
                                  {devices.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1 max-w-[110px]">
                                      {visibleDevices.map((device, idx) => (
                                        <span
                                          key={idx}
                                          className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[8.5px] font-bold whitespace-nowrap"
                                        >
                                          {device}
                                        </span>
                                      ))}
                                      {remainingDevices.length > 0 && (
                                        <span
                                          title={remainingDevices.join(', ')}
                                          className="bg-blue-100/70 text-blue-700 border border-blue-200 px-1 py-0.5 rounded text-[8.5px] font-extrabold cursor-help"
                                        >
                                          +{remainingDevices.length}..
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">-</span>
                                  )}
                                </td>

                                {/* Column 8: Activation */}
                                <td className="px-2.5 py-1.5 border-r border-slate-200/70">
                                  <div className="flex items-center gap-1 flex-wrap max-w-[120px]">
                                    {visibleActivations.map((opt, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[8.5px] font-bold whitespace-nowrap"
                                      >
                                        {opt}
                                      </span>
                                    ))}
                                    {remainingActivations.length > 0 && (
                                      <span
                                        title={remainingActivations.join(', ')}
                                        className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-1 py-0.5 rounded text-[8px] font-bold"
                                      >
                                        +{remainingActivations.length}
                                      </span>
                                    )}
                                    <span className={`px-1 py-0.2 rounded text-[8px] font-black border ${prod.activation_process === 'Automatic'
                                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                      {prod.activation_process === 'Automatic' ? 'Auto' : 'Manual'}
                                    </span>
                                  </div>
                                </td>

                                {/* Column 9: Additional Info */}
                                <td className="px-2.5 py-1.5 max-w-[100px] border-r border-slate-200/70">
                                  <p className="truncate text-slate-500 text-[10px]" title={prod.additional_info || ''}>
                                    {prod.additional_info || <span className="text-slate-400 italic">-</span>}
                                  </p>
                                </td>

                                {/* Column 10: Packages (Compact Badge) */}
                                <td className="px-2.5 py-1.5 whitespace-nowrap border-r border-slate-200/70">
                                  {prod.packages && prod.packages.length > 0 ? (
                                    <span
                                      title={prod.packages.map(p => `${p.duration || 'Standard'}: ৳${p.price}`).join(' | ')}
                                      className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded text-[9px] font-extrabold cursor-help"
                                    >
                                      <Package className="w-2.5 h-2.5" />
                                      {prod.packages.length} Pkg
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">-</span>
                                  )}
                                </td>

                                {/* Column 11: FAQs (Compact Badge) */}
                                <td className="px-2.5 py-1.5 whitespace-nowrap border-r border-slate-200/70">
                                  {prod.faqs && prod.faqs.length > 0 ? (
                                    <span
                                      title={prod.faqs.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}
                                      className="text-[9px] text-slate-700 bg-slate-100 border border-slate-250 px-1.5 py-0.5 rounded font-extrabold cursor-help"
                                    >
                                      {prod.faqs.length} FAQs
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">-</span>
                                  )}
                                </td>

                                {/* Column 12: Actions (Horizontal Compact) */}
                                <td className="px-2.5 py-1.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedProductId(isExpanded ? null : prod.id);
                                      }}
                                      title={isExpanded ? "Collapse Details" : "View Full Details"}
                                      className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md border border-transparent hover:border-violet-100 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenProductModal(prod);
                                      }}
                                      title="Edit Product"
                                      className="p-1 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-md border border-transparent hover:border-violet-100 transition-colors cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProduct(prod.id);
                                      }}
                                      title="Delete Product"
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expandable Product Details Drawer */}
                              {isExpanded && (
                                <tr className="bg-slate-50/95 border-b border-slate-200">
                                  <td colSpan="14" className="p-3 sm:p-3.5 text-left border-r-0">
                                    <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2.5">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-slate-850 text-xs">
                                            {prod.name} (ID #{prod.id})
                                          </span>
                                          <span className="bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.2 rounded text-[9.5px] font-bold">
                                            {prod.category_name || 'Uncategorized'}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleOpenProductModal(prod)}
                                          className="px-2 py-0.5 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          <span>Edit Product in Modal</span>
                                        </button>
                                      </div>

                                      {/* All Tags Breakdown */}
                                      {tags.length > 0 && (
                                        <div>
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                            All Tags ({tags.length}):
                                          </span>
                                          <div className="flex flex-wrap gap-1">
                                            {tags.map((tg, idx) => (
                                              <span
                                                key={idx}
                                                className="bg-slate-100 text-slate-750 border border-slate-250 px-2 py-0.5 rounded text-[9px] font-bold select-all"
                                              >
                                                #{tg}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Packages Breakdown */}
                                      {prod.packages && prod.packages.length > 0 && (
                                        <div>
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                            Package Options & Pricing:
                                          </span>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                            {prod.packages.map((pkg, idx) => (
                                              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs flex items-center justify-between">
                                                <div>
                                                  <span className="font-bold text-slate-800">{pkg.duration || 'Package'}</span>
                                                  {pkg.activation && (
                                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1 py-0.2 text-[8.5px] font-bold ml-1.5">
                                                      {pkg.activation}
                                                    </span>
                                                  )}
                                                </div>
                                                <span className="font-black text-violet-700">৳{parseFloat(pkg.price).toFixed(0)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Description & Additional Info */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-2">
                                        <div>
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Description:</span>
                                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 leading-relaxed">
                                            {prod.description ? prod.description.replace(/<[^>]*>?/gm, '') : 'No description provided.'}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Additional Info:</span>
                                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 leading-relaxed">
                                            {prod.additional_info || 'No additional info provided.'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                {totalProductPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 bg-slate-50/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Showing <span className="font-black text-slate-800">{(activePage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-black text-slate-800">
                        {Math.min(activePage * itemsPerPage, filteredProducts.length)}
                      </span>{' '}
                      of <span className="font-black text-slate-800">{filteredProducts.length}</span> items
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={activePage === 1}
                        className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${activePage === 1
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        Prev
                      </button>

                      {getPageNumbers(activePage, totalProductPages).map((page, idx) => {
                        if (page === '...') {
                          return (
                            <span key={idx} className="px-1.5 text-[10px] font-bold text-slate-400">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(page)}
                            className={`w-6 h-6 rounded-md text-[10px] font-black transition-all cursor-pointer select-none flex items-center justify-center ${activePage === page
                              ? 'bg-violet-600 text-white border border-violet-600 shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalProductPages))}
                        disabled={activePage === totalProductPages}
                        className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${activePage === totalProductPages
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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

          {activeTab === 'orders' && (
            <div className="space-y-4 animate-fade-in text-left min-w-0 w-full max-w-full">
              {/* Order Status KPI Cards with Interactive Filter & Dynamic Themes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 min-w-0 w-full max-w-full">
                {[
                  {
                    key: 'Pending',
                    label: 'PENDING',
                    subtitle: 'Awaiting Action',
                    count: pendingOrdersCount,
                    icon: Hourglass,
                    topBar: 'from-amber-400 via-amber-500 to-orange-500',
                    normalBg: 'bg-gradient-to-br from-amber-50 via-amber-50/40 to-white border-amber-200/90 hover:border-amber-400 hover:shadow-amber-100',
                    activeBg: 'bg-gradient-to-br from-amber-100/90 via-amber-50 to-white border-amber-500 ring-2 ring-amber-500/30 shadow-md shadow-amber-200/50',
                    labelColor: 'text-amber-800',
                    countColor: 'text-amber-950',
                    iconBox: 'bg-amber-100/90 text-amber-700 border border-amber-300/80 shadow-2xs group-hover:bg-amber-200/90',
                    accentDot: 'bg-amber-500',
                    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300/70',
                  },
                  {
                    key: 'Processing',
                    label: 'PROCESSING',
                    subtitle: 'In Fulfillment',
                    count: processingOrdersCount,
                    icon: RefreshCw,
                    topBar: 'from-blue-400 via-blue-500 to-sky-500',
                    normalBg: 'bg-gradient-to-br from-blue-50 via-blue-50/40 to-white border-blue-200/90 hover:border-blue-400 hover:shadow-blue-100',
                    activeBg: 'bg-gradient-to-br from-blue-100/90 via-blue-50 to-white border-blue-500 ring-2 ring-blue-500/30 shadow-md shadow-blue-200/50',
                    labelColor: 'text-blue-800',
                    countColor: 'text-blue-950',
                    iconBox: 'bg-blue-100/90 text-blue-700 border border-blue-300/80 shadow-2xs group-hover:bg-blue-200/90',
                    accentDot: 'bg-blue-500',
                    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300/70',
                  },
                  {
                    key: 'Shipped',
                    label: 'SHIPPED',
                    subtitle: 'In Transit',
                    count: shippedOrdersCount,
                    icon: Truck,
                    topBar: 'from-indigo-400 via-indigo-500 to-violet-500',
                    normalBg: 'bg-gradient-to-br from-indigo-50 via-indigo-50/40 to-white border-indigo-200/90 hover:border-indigo-400 hover:shadow-indigo-100',
                    activeBg: 'bg-gradient-to-br from-indigo-100/90 via-indigo-50 to-white border-indigo-500 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-200/50',
                    labelColor: 'text-indigo-800',
                    countColor: 'text-indigo-950',
                    iconBox: 'bg-indigo-100/90 text-indigo-700 border border-indigo-300/80 shadow-2xs group-hover:bg-indigo-200/90',
                    accentDot: 'bg-indigo-500',
                    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300/70',
                  },
                  {
                    key: 'Delivered',
                    label: 'COMPLETED',
                    subtitle: 'Delivered',
                    count: completedOrdersCount,
                    icon: CheckCircle2,
                    topBar: 'from-emerald-400 via-emerald-500 to-teal-500',
                    normalBg: 'bg-gradient-to-br from-emerald-50 via-emerald-50/40 to-white border-emerald-200/90 hover:border-emerald-400 hover:shadow-emerald-100',
                    activeBg: 'bg-gradient-to-br from-emerald-100/90 via-emerald-50 to-white border-emerald-500 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-200/50',
                    labelColor: 'text-emerald-800',
                    countColor: 'text-emerald-950',
                    iconBox: 'bg-emerald-100/90 text-emerald-700 border border-emerald-300/80 shadow-2xs group-hover:bg-emerald-200/90',
                    accentDot: 'bg-emerald-500',
                    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300/70',
                  },
                  {
                    key: 'Cancelled',
                    label: 'CANCELLED',
                    subtitle: 'Void / Refund',
                    count: cancelledOrdersCount,
                    icon: XCircle,
                    topBar: 'from-rose-400 via-rose-500 to-red-500',
                    normalBg: 'bg-gradient-to-br from-rose-50 via-rose-50/40 to-white border-rose-200/90 hover:border-rose-400 hover:shadow-rose-100',
                    activeBg: 'bg-gradient-to-br from-rose-100/90 via-rose-50 to-white border-rose-500 ring-2 ring-rose-500/30 shadow-md shadow-rose-200/50',
                    labelColor: 'text-rose-800',
                    countColor: 'text-rose-950',
                    iconBox: 'bg-rose-100/90 text-rose-700 border border-rose-300/80 shadow-2xs group-hover:bg-rose-200/90',
                    accentDot: 'bg-rose-500',
                    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300/70',
                  },
                ].map((st) => {
                  const isFiltered = orderTabStatus === st.key;
                  const Icon = st.icon;
                  const percentage = orders.length > 0 ? Math.round((st.count / orders.length) * 100) : 0;
                  return (
                    <div
                      key={st.key}
                      onClick={() => {
                        setOrderTabStatus(isFiltered ? 'all' : st.key);
                        setOrderTabPage(1);
                      }}
                      className={`relative overflow-hidden p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-2xs ${isFiltered
                        ? `${st.activeBg} -translate-y-0.5`
                        : `${st.normalBg} hover:-translate-y-0.5 hover:shadow-xs`
                        }`}
                    >
                      {/* Gradient top accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${st.topBar} ${isFiltered ? 'h-1.5' : 'group-hover:h-1.5'} transition-all`} />

                      {/* Top row: Label + Accent Dot and Icon Tile */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.accentDot} ${isFiltered ? 'animate-pulse' : ''}`} />
                          <span className={`text-[9.5px] font-black uppercase tracking-wider truncate ${st.labelColor}`}>
                            {st.label}
                          </span>
                        </div>
                        <div className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${st.iconBox}`}>
                          <Icon className={`w-3.5 h-3.5 ${st.key === 'Processing' ? 'group-hover:animate-spin' : ''}`} />
                        </div>
                      </div>

                      {/* Bottom row: Large Count, % Pill, and Active/Subtitle indicator */}
                      <div className="flex items-end justify-between gap-1 mt-2 pt-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-lg sm:text-xl font-black tracking-tight font-sans ${st.countColor}`}>
                            {st.count}
                          </span>
                          <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md border ${st.badgeBg}`}>
                            {percentage}%
                          </span>
                        </div>
                        {isFiltered ? (
                          <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded-full bg-slate-900 text-white uppercase tracking-wider shadow-2xs animate-fade-in">
                            Active
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-semibold text-slate-400 group-hover:text-slate-600 hidden xl:inline-block tracking-tight">
                            {st.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Filter & Search Toolbar */}
              <div className="bg-white border border-slate-250 p-3 rounded-xl shadow-2xs space-y-2.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-850 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                      <span>Order Logs</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
                        {filteredTabOrders.length}
                        {filteredTabOrders.length !== orders.length ? ` / ${orders.length}` : ''}
                      </span>
                    </h3>
                  </div>

                  {/* Search Input */}
                  <div className="flex-1 max-w-md relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={orderTabSearch}
                      onChange={(e) => {
                        setOrderTabSearch(e.target.value);
                        setOrderTabPage(1);
                      }}
                      placeholder="Search order #, customer, email, phone, product..."
                      className="w-full bg-slate-50 border border-slate-200/90 text-slate-800 text-[11px] rounded-lg pl-8 pr-7 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs placeholder:text-slate-400 font-medium"
                    />
                    {orderTabSearch && (
                      <button
                        onClick={() => { setOrderTabSearch(''); setOrderTabPage(1); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Pills & Selects */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'Pending', label: 'Pending' },
                      { key: 'Processing', label: 'Processing' },
                      { key: 'Shipped', label: 'Shipped' },
                      { key: 'Delivered', label: 'Delivered' },
                      { key: 'Cancelled', label: 'Cancelled' },
                    ].map((tab) => {
                      const isActive = orderTabStatus === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => {
                            setOrderTabStatus(tab.key);
                            setOrderTabPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer border ${isActive
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Payment, Source & Sort Options */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Payment:</span>
                      <select
                        value={orderTabPayment}
                        onChange={(e) => {
                          setOrderTabPayment(e.target.value);
                          setOrderTabPage(1);
                        }}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-[10.5px] font-bold rounded-md px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                      >
                        <option value="all">All Payments</option>
                        <option value="Paid">Paid Only</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Source:</span>
                      <select
                        value={orderTabSource}
                        onChange={(e) => {
                          setOrderTabSource(e.target.value);
                          setOrderTabPage(1);
                        }}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-[10.5px] font-bold rounded-md px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                      >
                        <option value="all">All Sources</option>
                        <option value="website">🌐 Website (ওয়েবসাইট)</option>
                        <option value="manual">✍️ Manual (ম্যানুয়াল)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sort:</span>
                      <select
                        value={`${orderTabSortField}_${orderTabSortAsc ? 'asc' : 'desc'}`}
                        onChange={(e) => {
                          const [field, dir] = e.target.value.split('_');
                          setOrderTabSortField(field);
                          setOrderTabSortAsc(dir === 'asc');
                        }}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-[10.5px] font-bold rounded-md px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                      >
                        <option value="date_desc">Date (Newest)</option>
                        <option value="date_asc">Date (Oldest)</option>
                        <option value="total_desc">Total (High → Low)</option>
                        <option value="total_asc">Total (Low → High)</option>
                        <option value="id_desc">Order # (High → Low)</option>
                        <option value="id_asc">Order # (Low → High)</option>
                        <option value="customer_asc">Customer (A → Z)</option>
                      </select>
                    </div>

                    {(orderTabSearch || orderTabStatus !== 'all' || orderTabPayment !== 'all' || orderTabSource !== 'all') && (
                      <button
                        onClick={() => {
                          setOrderTabSearch('');
                          setOrderTabStatus('all');
                          setOrderTabPayment('all');
                          setOrderTabSource('all');
                          setOrderTabPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Container with Cell Borders */}
              <div className="bg-white border border-slate-250 rounded-xl overflow-hidden shadow-xs min-w-0 w-full max-w-full">
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[920px]">
                    <thead>
                      <tr className="bg-slate-100/95 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b-2 border-slate-250 select-none">
                        <th className="px-3 py-2.5 border-r border-slate-200/90 w-28 whitespace-nowrap">Order Info</th>
                        <th className="px-3 py-2.5 border-r border-slate-200/90 w-44 whitespace-nowrap">Customer</th>
                        <th className="px-3 py-2.5 border-r border-slate-200/90 min-w-[280px]">Details</th>
                        <th className="px-3 py-2.5 border-r border-slate-200/90 w-28 text-right whitespace-nowrap">Total Bill</th>
                        <th className="px-3 py-2.5 border-r border-slate-200/90 w-36 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center justify-center">
                            <span>Payment Source</span>
                            <span className="text-[8px] text-blue-700 font-extrabold normal-case tracking-normal">
                              ওয়েবসাইট / ম্যানুয়াল
                            </span>
                          </div>
                        </th>
                        <th className="px-3 py-2.5 border-r border-slate-200/90 w-28 text-center whitespace-nowrap">Payment</th>
                        <th className="px-3 py-2.5 border-r border-slate-200/90 w-32 whitespace-nowrap">Status</th>
                        <th className="px-3 py-2.5 text-center w-16 whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/75 font-medium">
                      {filteredTabOrders.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                            <div className="flex flex-col items-center justify-center py-6">
                              <ClipboardList className="w-8 h-8 text-slate-300 mb-2" />
                              <p className="text-xs font-bold text-slate-600">No matching orders found</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or search keywords</p>
                              {(orderTabSearch || orderTabStatus !== 'all' || orderTabPayment !== 'all' || orderTabSource !== 'all') && (
                                <button
                                  onClick={() => { setOrderTabSearch(''); setOrderTabStatus('all'); setOrderTabPayment('all'); setOrderTabSource('all'); }}
                                  className="mt-2.5 px-3 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors cursor-pointer"
                                >
                                  Clear Filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedTabOrders.map((ord) => {
                          return (
                            <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                              {/* Order Info Cell */}
                              <td className="px-3 py-2.5 text-left border-r border-b border-slate-200/80 align-top">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] font-extrabold text-blue-700 bg-blue-50/90 border border-blue-200/80 px-2 py-0.5 rounded-md inline-block shadow-2xs">
                                    #{ord.id}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(String(ord.id));
                                      toast.success(`Copied #${ord.id}`);
                                    }}
                                    className="text-slate-300 hover:text-slate-600 p-0.5 rounded transition-colors cursor-pointer"
                                    title="Copy ID"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                {ord.created_at && (
                                  <div className="mt-1.5 space-y-0.5">
                                    <p className="text-[9.5px] text-slate-600 font-semibold flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                                    </p>
                                    <p className="text-[9.5px] text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                  </div>
                                )}
                              </td>

                              {/* Customer Cell */}
                              <td className="px-3 py-2.5 text-left border-r border-b border-slate-200/80 align-top">
                                <p className="font-extrabold text-slate-850 text-[11.5px] tracking-tight">{ord.user_name}</p>
                                <p className="text-[10px] text-slate-500 font-medium break-all mt-0.5">{ord.user_email}</p>
                                {ord.phone && (
                                  <p className="text-[9.5px] text-slate-600 flex items-center gap-1 mt-1 font-semibold">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{ord.phone}</span>
                                  </p>
                                )}
                              </td>

                              {/* Details Cell */}
                              <td className="px-3 py-2.5 text-left border-r border-b border-slate-200/80 align-top">
                                <div className="space-y-1.5">
                                  {ord.items?.map((i, idx) => (
                                    <div key={idx} className="text-slate-700 text-[11px] pb-1.5 border-b border-slate-100 last:border-b-0 last:pb-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-850">{i.product_name}</span>
                                        <span className="text-[10px] font-black bg-blue-100/70 text-blue-700 px-1.5 py-0.2 rounded-md">
                                          x{i.quantity}
                                        </span>
                                      </div>

                                      {(i.package_name || i.selected_device || i.selected_activation) && (
                                        <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-violet-700 font-semibold mt-1">
                                          {i.package_name && (
                                            <span className="bg-violet-50 border border-violet-200/70 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                              📦 Pkg: {i.package_name}
                                            </span>
                                          )}
                                          {i.selected_device && (
                                            <span className="bg-violet-50 border border-violet-200/70 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                              📱 Dev: {i.selected_device}
                                            </span>
                                          )}
                                          {i.selected_activation && (
                                            <span className="bg-violet-50 border border-violet-200/70 px-2 py-0.5 rounded-md inline-flex items-center gap-1 break-all">
                                              🔑 Act: {i.selected_activation}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {i.license_keys && i.license_keys.length > 0 && (
                                        <div className="mt-1 space-y-0.5 text-left">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                            🔑 License Key(s):
                                          </span>
                                          <div className="flex flex-wrap gap-1">
                                            {i.license_keys.map((lic, lIdx) => (
                                              <div key={lIdx} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 rounded text-[9.5px] font-mono">
                                                <span>{lic}</span>
                                                <button
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(lic);
                                                    toast.success('License key copied!');
                                                  }}
                                                  className="hover:text-emerald-900 cursor-pointer"
                                                  title="Copy key"
                                                >
                                                  <Copy className="w-2.5 h-2.5" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {ord.shipping_address && (
                                  <p className="text-[9.5px] text-slate-500 mt-1.5 font-medium leading-tight">
                                    <span className="font-bold text-slate-600">Addr:</span> {ord.shipping_address}
                                  </p>
                                )}

                                {ord.additional_notes && (
                                  <p className="text-[9.5px] text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2 py-1 rounded-md mt-1.5 text-left leading-relaxed max-w-md">
                                    <strong>Notes:</strong> {ord.additional_notes}
                                  </p>
                                )}

                                <div className="text-[9.5px] mt-1.5 flex flex-wrap items-center gap-1.5 text-left">
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Payment Method:</span>
                                  {ord.payment_method?.includes('bKash') ? (
                                    <span className="px-1.5 py-0.2 bg-pink-50 text-pink-700 font-extrabold border border-pink-200/80 rounded text-[9px] uppercase tracking-wide">
                                      {ord.payment_method}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 bg-violet-50 text-violet-700 font-extrabold border border-violet-200/80 rounded text-[9px] uppercase tracking-wide">
                                      {ord.payment_method || 'Manual'}
                                    </span>
                                  )}
                                </div>

                                {ord.status === 'Cancelled' && ord.cancel_reason && (
                                  <p className="text-[9.5px] text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md mt-1.5 text-left leading-relaxed">
                                    <strong>Cancel Reason:</strong> {ord.cancel_reason}
                                  </p>
                                )}
                              </td>

                              {/* Total Bill Cell */}
                              <td className="px-3 py-2.5 text-right border-r border-b border-slate-200/80 align-top whitespace-nowrap">
                                <span className="font-black text-slate-900 text-xs sm:text-[12px] bg-slate-100/80 border border-slate-200/90 px-2 py-1 rounded-md inline-block shadow-2xs">
                                  ৳{parseFloat(ord.total_amount).toFixed(2)}
                                </span>
                              </td>

                              {/* Payment Type Source Cell [Website, Manual] */}
                              <td className="px-3 py-2.5 text-center border-r border-b border-slate-200/80 align-top whitespace-nowrap">
                                {(() => {
                                  const method = (ord.payment_method || '').toLowerCase();
                                  const isWebsite = method.includes('online') || method.includes('gateway') || method.includes('eps') || Boolean(ord.transaction_id && !method.includes('manual') && !method.includes('whatsapp') && !method.includes('cash'));

                                  return (
                                    <div className="flex flex-col items-center gap-1">
                                      {/* Source Badge [Website, Manual] */}
                                      {isWebsite ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200/90 shadow-2xs">
                                          <Globe className="w-3 h-3 text-blue-600" />
                                          <span>ওয়েবসাইট</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200/90 shadow-2xs">
                                          <Edit2 className="w-2.5 h-2.5 text-purple-600" />
                                          <span>ম্যানুয়াল</span>
                                        </span>
                                      )}

                                      {/* Method selector with quick edit */}
                                      <select
                                        value={isWebsite ? 'Online Payment' : (ord.payment_method || 'Manual')}
                                        onChange={(e) => handleUpdatePaymentMethod(ord.id, e.target.value)}
                                        className="text-[9.5px] font-bold text-slate-700 bg-slate-50 hover:bg-white border border-slate-200/90 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none focus:border-blue-400 shadow-2xs transition-colors text-center"
                                        title="Payment Method (Click to change)"
                                      >
                                        <option value="Online Payment">🌐 Online Payment (Web)</option>
                                        <option value="Manual">✍️ Manual (Offline)</option>
                                        <option value="WhatsApp">📱 WhatsApp</option>
                                        <option value="bKash (Manual)">📱 bKash (Manual)</option>
                                        <option value="Nagad (Manual)">📱 Nagad (Manual)</option>
                                        <option value="Cash on Delivery">💵 Cash on Delivery</option>
                                      </select>

                                      {/* TrxID with 1-click copy */}
                                      {ord.transaction_id ? (
                                        <div className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-600 bg-slate-100/80 border border-slate-200 px-1.5 py-0.5 rounded max-w-[125px]">
                                          <span className="truncate" title={`TrxID: ${ord.transaction_id}`}>
                                            {ord.transaction_id}
                                          </span>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(ord.transaction_id);
                                              toast.success('TrxID copied!');
                                            }}
                                            className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                                            title="Copy TrxID"
                                          >
                                            <Copy className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-[8.5px] text-slate-400 font-medium">No TrxID</span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* Payment Status Cell */}
                              <td className="px-3 py-2.5 text-center border-r border-b border-slate-200/80 align-top whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider inline-block border ${ord.payment_status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-2xs'
                                  : ord.payment_status === 'Failed'
                                    ? 'bg-red-50 text-red-600 border-red-200 shadow-2xs'
                                    : ord.payment_status === 'Cancelled'
                                      ? 'bg-slate-100 text-slate-600 border-slate-200 shadow-2xs'
                                      : 'bg-amber-50 text-amber-700 border-amber-200/90 shadow-2xs'
                                  }`}>
                                  {ord.payment_status || 'Pending'}
                                </span>
                              </td>

                              {/* Status Select Cell */}
                              <td className="px-3 py-2.5 border-r border-b border-slate-200/80 align-top whitespace-nowrap">
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                  className={`text-[10.5px] font-extrabold rounded-lg px-2 py-1 border shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors cursor-pointer ${ord.status === 'Delivered'
                                    ? 'text-emerald-700 border-emerald-200 bg-emerald-50/70'
                                    : ord.status === 'Cancelled'
                                      ? 'text-rose-700 border-rose-200 bg-rose-50/70'
                                      : ord.status === 'Shipped'
                                        ? 'text-indigo-700 border-indigo-200 bg-indigo-50/70'
                                        : ord.status === 'Processing'
                                          ? 'text-blue-700 border-blue-200 bg-blue-50/70'
                                          : 'text-amber-700 border-amber-200 bg-amber-50/70'
                                    }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>

                              {/* Action Cell */}
                              <td className="px-3 py-2.5 text-center border-b border-slate-200/80 align-top whitespace-nowrap">
                                <button
                                  onClick={() => handleDeleteOrder(ord.id)}
                                  title="Delete Order"
                                  className="p-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 hover:border-red-200 rounded-lg text-slate-400 transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                {filteredTabOrders.length > 0 && (
                  <div className="px-3.5 py-2 bg-slate-50/90 border-t border-slate-250 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] font-bold text-slate-600">
                    <div>
                      Showing{' '}
                      <span className="font-extrabold text-slate-800">
                        {Math.min((orderTabPage - 1) * ordersPerPage + 1, filteredTabOrders.length)}
                      </span>{' '}
                      to{' '}
                      <span className="font-extrabold text-slate-800">
                        {Math.min(orderTabPage * ordersPerPage, filteredTabOrders.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-extrabold text-slate-800">{filteredTabOrders.length}</span> orders
                    </div>

                    {totalOrderPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          disabled={orderTabPage === 1}
                          onClick={() => setOrderTabPage(p => Math.max(1, p - 1))}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs text-[10px]"
                        >
                          Prev
                        </button>
                        {Array.from({ length: totalOrderPages }, (_, idx) => idx + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => setOrderTabPage(p)}
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold transition-all cursor-pointer ${orderTabPage === p
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          disabled={orderTabPage === totalOrderPages}
                          onClick={() => setOrderTabPage(p => Math.min(totalOrderPages, p + 1))}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs text-[10px]"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-3.5 animate-fade-in text-left min-w-0 w-full max-w-full">

              {/* 4 Interactive Ticket KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 min-w-0 w-full max-w-full">
                {/* Total */}
                <div
                  onClick={() => setTicketStatusFilter('all')}
                  className={`bg-white p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group hover:scale-[1.01] ${ticketStatusFilter === 'all' ? 'border-violet-500 ring-1 ring-violet-500/30' : 'border-slate-200/90 hover:border-violet-300'
                    }`}
                >
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Total Tickets</span>
                    <div className="p-1 rounded-md bg-violet-50 text-violet-600 group-hover:scale-105 transition-transform">
                      <Headphones size={13} />
                    </div>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-slate-900 block">{ticketStats.total}</span>
                </div>

                {/* Pending */}
                <div
                  onClick={() => setTicketStatusFilter('Pending')}
                  className={`bg-white p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group hover:scale-[1.01] ${ticketStatusFilter === 'Pending' ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-200/90 hover:border-amber-300'
                    }`}
                >
                  <div className="flex items-center justify-between text-amber-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Pending</span>
                    <div className="p-1 rounded-md bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                      <Clock size={13} />
                    </div>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-amber-600 block">{ticketStats.pending}</span>
                </div>

                {/* Resolved */}
                <div
                  onClick={() => setTicketStatusFilter('Resolved')}
                  className={`bg-white p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group hover:scale-[1.01] ${ticketStatusFilter === 'Resolved' ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200/90 hover:border-emerald-300'
                    }`}
                >
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Resolved</span>
                    <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                      <CheckCircle2 size={13} />
                    </div>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-emerald-600 block">{ticketStats.resolved}</span>
                </div>

                {/* Closed */}
                <div
                  onClick={() => setTicketStatusFilter('Closed')}
                  className={`bg-white p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shadow-2xs group hover:scale-[1.01] ${ticketStatusFilter === 'Closed' ? 'border-slate-500 ring-1 ring-slate-500/30' : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Closed</span>
                    <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:scale-105 transition-transform">
                      <Layers size={13} />
                    </div>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-slate-600 block">{ticketStats.closed}</span>
                </div>
              </div>

              {/* Filter Toolbar with Status Selector & Search */}
              <div className="p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <MessageSquare size={13} className="text-violet-600" />
                    Tickets ({filteredTickets.length})
                  </span>

                  {/* Status Pills */}
                  {['all', 'Pending', 'Resolved', 'Closed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTicketStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${ticketStatusFilter === st
                        ? 'bg-violet-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {st === 'all' ? 'All Tickets' : st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[200px] justify-end">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Search ID, sender, subject..."
                      value={ticketSearchQuery}
                      onChange={(e) => setTicketSearchQuery(e.target.value)}
                      className="w-full pl-7.5 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 shadow-2xs"
                    />
                  </div>

                  {(ticketSearchQuery || ticketStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setTicketSearchQuery('');
                        setTicketStatusFilter('all');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      title="Reset filters"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Bordered Table */}
              <div className="bg-white border border-slate-250 rounded-xl overflow-hidden shadow-2xs min-w-0 w-full max-w-full">
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[880px]">
                    <thead>
                      <tr className="border-b-2 border-slate-250 bg-slate-100/90 text-slate-700 font-black uppercase text-[10px] tracking-wider select-none">
                        <th
                          onClick={() => {
                            if (ticketSortField === 'id') setTicketSortAsc(!ticketSortAsc);
                            else { setTicketSortField('id'); setTicketSortAsc(true); }
                          }}
                          className="py-2 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span>ID</span>
                            <ArrowUpDown size={10} className={ticketSortField === 'id' ? 'text-violet-600' : 'text-slate-400 opacity-50'} />
                          </div>
                        </th>
                        <th
                          onClick={() => {
                            if (ticketSortField === 'sender') setTicketSortAsc(!ticketSortAsc);
                            else { setTicketSortField('sender'); setTicketSortAsc(true); }
                          }}
                          className="py-2 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span>Sender Details</span>
                            <ArrowUpDown size={10} className={ticketSortField === 'sender' ? 'text-violet-600' : 'text-slate-400 opacity-50'} />
                          </div>
                        </th>
                        <th className="py-2 px-3 border-r border-slate-250">Subject & Message</th>
                        <th
                          onClick={() => {
                            if (ticketSortField === 'status') setTicketSortAsc(!ticketSortAsc);
                            else { setTicketSortField('status'); setTicketSortAsc(true); }
                          }}
                          className="py-2 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span>Status</span>
                            <ArrowUpDown size={10} className={ticketSortField === 'status' ? 'text-violet-600' : 'text-slate-400 opacity-50'} />
                          </div>
                        </th>
                        <th className="py-2 px-3 border-r border-slate-250">Admin Remarks</th>
                        <th
                          onClick={() => {
                            if (ticketSortField === 'date') setTicketSortAsc(!ticketSortAsc);
                            else { setTicketSortField('date'); setTicketSortAsc(true); }
                          }}
                          className="py-2 px-3 border-r border-slate-250 cursor-pointer hover:bg-slate-200/70 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span>Created At</span>
                            <ArrowUpDown size={10} className={ticketSortField === 'date' ? 'text-violet-600' : 'text-slate-400 opacity-50'} />
                          </div>
                        </th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-slate-400 font-medium">
                            No support tickets found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map((ticket) => (
                          <tr key={ticket.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-violet-50/25 transition-colors">
                            {/* Ticket ID */}
                            <td className="py-2 px-3 border-r border-b border-slate-200/80 font-bold text-slate-900 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                                #T{ticket.id}
                              </span>
                            </td>

                            {/* Sender Details */}
                            <td className="py-2 px-3 border-r border-b border-slate-200/80">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block text-[11.5px] truncate max-w-[170px]">{ticket.name}</span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <span className="truncate max-w-[140px]">{ticket.email}</span>
                                  {ticket.email && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(ticket.email);
                                        toast.success(`Copied: ${ticket.email}`, { duration: 1500 });
                                      }}
                                      className="text-slate-400 hover:text-violet-600 transition-colors p-0.5"
                                      title="Copy Email"
                                    >
                                      <Copy size={10} />
                                    </button>
                                  )}
                                </div>
                                <span className={`px-1.5 py-0.2 rounded text-[8.5px] inline-block font-extrabold border mt-0.5 ${ticket.user_name ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                  {ticket.user_name ? 'Registered' : 'Guest'}
                                </span>
                              </div>
                            </td>

                            {/* Subject & Message */}
                            <td className="py-2 px-3 border-r border-b border-slate-200/80 max-w-[240px]">
                              <p className="font-bold text-slate-800 text-[11px] truncate" title={ticket.subject}>{ticket.subject}</p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5" title={ticket.message}>{ticket.message}</p>
                            </td>

                            {/* Status */}
                            <td className="py-2 px-3 border-r border-b border-slate-200/80 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border shadow-2xs ${ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                ticket.status === 'Closed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                {ticket.status}
                              </span>
                            </td>

                            {/* Admin Remarks */}
                            <td className="py-2 px-3 border-r border-b border-slate-200/80 max-w-[160px]">
                              <span className="text-slate-600 italic text-[10px] truncate block" title={ticket.remarks || 'No remarks'}>
                                {ticket.remarks || <span className="text-slate-400">No remarks</span>}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-2 px-3 border-r border-b border-slate-200/80 text-slate-600 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-[10.5px]">
                                <Calendar size={11} className="text-violet-600 shrink-0" />
                                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[9.5px] text-slate-400 mt-0.5">
                                <Clock size={10} className="shrink-0" />
                                <span>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-2 px-3 border-b border-slate-200/80 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleOpenTicketModal(ticket)}
                                className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold text-[10.5px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Edit2 size={11} />
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

          {activeTab === 'categories' && (
            <div className="space-y-3.5 animate-fade-in text-left min-w-0 w-full max-w-full">
              {/* Header & Search Toolbar */}
              <div className="p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                      Product Categories
                      <span className="text-[10px] font-extrabold px-2 py-0.2 bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
                        {filteredCategories.length}
                      </span>
                    </h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Manage store product classification and hierarchy</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="w-full pl-7.5 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 shadow-2xs"
                    />
                  </div>

                  <button
                    onClick={() => handleOpenCategoryModal()}
                    className="flex items-center gap-1 px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add Category</span>
                  </button>
                </div>
              </div>

              {/* Bordered Categories Table */}
              <div className="bg-white border border-slate-250 rounded-xl overflow-hidden shadow-2xs min-w-0 w-full max-w-full">
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[520px]">
                    <thead>
                      <tr className="border-b-2 border-slate-250 bg-slate-100/90 text-slate-700 font-black uppercase text-[10px] tracking-wider select-none">
                        <th className="py-2 px-3 border-r border-slate-250 w-24">Category ID</th>
                        <th className="py-2 px-3 border-r border-slate-250">Category Name</th>
                        <th className="py-2 px-3 border-r border-slate-250 w-36">Linked Products</th>
                        <th className="py-2 px-3 text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {filteredCategories.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-slate-400 font-medium">
                            {categories.length === 0 ? 'No categories found. Create some categories.' : 'No categories match your search.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCategories.map((cat) => {
                          const linkedCount = products.filter(p => p.category === cat.name || p.category_id === cat.id).length;
                          return (
                            <tr key={cat.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-violet-50/25 transition-colors">
                              {/* ID */}
                              <td className="py-2 px-3 border-r border-b border-slate-200/80 font-bold text-slate-900 whitespace-nowrap">
                                <span className="font-mono text-[10.5px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                                  #{cat.id}
                                </span>
                              </td>

                              {/* Category Name */}
                              <td className="py-2 px-3 border-r border-b border-slate-200/80 font-bold text-slate-900 text-[11.5px]">
                                {cat.name}
                              </td>

                              {/* Linked Products Count */}
                              <td className="py-2 px-3 border-r border-b border-slate-200/80 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-violet-50 text-violet-700 border border-violet-200 shadow-2xs">
                                  {linkedCount} {linkedCount === 1 ? 'Product' : 'Products'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-2 px-3 border-b border-slate-200/80 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleOpenCategoryModal(cat)}
                                    className="p-1 bg-slate-50 hover:bg-violet-50 hover:text-violet-600 border border-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer shadow-2xs"
                                    title="Edit Category"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1 bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer shadow-2xs"
                                    title="Delete Category"
                                  >
                                    <Trash2 size={12} />
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
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in text-left max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                      <Database className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Database Backup Console & Automated Delivery
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    প্রতিদিন বিকেল ৫:০৫ টায় স্বয়ংক্রিয় ব্যাকআপ ইমেইল প্রেরণ ও ডেটাবেজ নিরাপত্তা ব্যবস্থাপনা
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchBackupSettings}
                  disabled={backupLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${backupLoading ? 'animate-spin text-violet-600' : 'text-slate-500'}`} />
                  <span>Refresh Status</span>
                </button>
              </div>

              {/* 3 Overview Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Card 1: Schedule Time */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      অটো ব্যাকআপের সময়
                    </span>
                    <div className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
                      প্রতিদিন বিকেল ৫:০৫
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        autoBackupEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${autoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {autoBackupEnabled ? 'শিডিউল সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Destination Email */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      ব্যাকআপ গন্তব্য ইমেইল
                    </span>
                    <div className="text-xs font-extrabold text-slate-800 mt-0.5 truncate font-mono" title={autoBackupEmail || 'কোনো ইমেইল সেট করা নেই'}>
                      {autoBackupEmail ? (
                        <span className="text-slate-800">{autoBackupEmail}</span>
                      ) : (
                        <span className="text-amber-600 italic font-sans text-[11px]">কোনো ইমেইল সেট করা নেই</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {autoBackupEmail ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                          <span>📎</span> .sql File Attachment
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> ব্যাকআপ মেইল দিন
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Last Run Status */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      সর্বশেষ ব্যাকআপ রান
                    </span>
                    <div className="text-xs font-extrabold text-slate-800 mt-0.5 truncate">
                      {backupLastRun || 'এখনও রান হয়নি'}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        backupLastStatus && backupLastStatus.toLowerCase().includes('success')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : backupLastStatus && backupLastStatus.toLowerCase().includes('failed')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {backupLastStatus || 'অপেক্ষমাণ'}
                      </span>
                      {backupLastSize && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          ({backupLastSize})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Auto-Backup Configuration Box */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Send className="w-4 h-4 text-violet-600" />
                        স্বয়ংক্রিয় ব্যাকআপ কনফিগারেশন (Daily Automated Email Settings)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        প্রতিদিন বিকেল ৫:০৫ টায় (Asia/Dhaka টাইমজোন) সম্পূর্ণ ডাটাবেজ ব্যাকআপ ফাইল এই ইমেইলে পৌছে যাবে।
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toggle Enable/Disable */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div className="space-y-0.5 pr-4">
                    <label htmlFor="autoBackupToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                      প্রতিদিন বিকেল ৫:০০ টার পরে স্বয়ংক্রিয় ব্যাকআপ চালু রাখুন
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      সক্রিয় থাকলে নির্ধারিত সময়ে ব্যাকগ্রাউন্ডে ক্রন জব চলবে এবং ইমেইলে ব্যাকআপ ফাইল সেন্ড করবে।
                    </p>
                  </div>
                  <button
                    type="button"
                    id="autoBackupToggle"
                    onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      autoBackupEnabled ? 'bg-violet-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        autoBackupEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Email Address Input & Setup */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-violet-600" />
                      <span>ব্যাকআপ মেইল সেট করুন (Set Backup Recipient Email)</span>
                    </label>
                    {autoBackupEmail ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> সক্রিয় ব্যাকআপ মেইল: {autoBackupEmail}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3 h-3" /> কোনো ব্যাকআপ মেইল সেট করা নেই
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={autoBackupEmail}
                      onChange={(e) => setAutoBackupEmail(e.target.value)}
                      placeholder="আপনার ব্যাকআপ ইমেইল এড্রেস লিখুন (যেমন: your-email@gmail.com)"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition-all shadow-2xs"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 font-medium pt-0.5">
                    <span>* প্রতিদিন বিকেল ৫:০৫ টায় স্বয়ংক্রিয় ব্যাকআপের সম্পূর্ণ .sql ফাইলটি এই ইমেইলে এটাচমেন্ট আকারে পাঠানো হবে।</span>
                    {autoBackupEmail && (
                      <button
                        type="button"
                        onClick={() => setAutoBackupEmail('')}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer self-start sm:self-auto hover:underline"
                      >
                        মেইল ক্লিয়ার করুন
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSaveBackupSettings}
                      disabled={backupSaving}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {backupSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>সংরক্ষণ হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>ব্যাকআপ সেটিংস সেভ করুন (Save Settings)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendTestBackupEmail}
                      disabled={backupSendingEmail}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {backupSendingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>ব্যাকআপ তৈরি ও মেইল পাঠানো হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>এখনই টেস্ট ব্যাকআপ পাঠান (Send Test Now)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 italic">
                    TimeZone: Asia/Dhaka (BST)
                  </span>
                </div>

                {/* Hint Notice */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                  <span className="text-amber-600 shrink-0 text-sm">💡</span>
                  <div>
                    <strong>তাৎক্ষণিক নিশ্চিতকরণ:</strong> 'Send Test Now' বাটনে ক্লিক করলে সিস্টেম এখনই সম্পূর্ণ ডেটাবেজ ডাম্প করে আপনার সেট করা ব্যাকআপ ইমেইলে (.sql এটাচমেন্ট সহ) একটি টেস্ট ইমেইল পাঠাবে। এতে আপনি নিশ্চিত হতে পারবেন যে সার্ভারের মেইলার ও রিসিভার ইমেইল নিখুঁতভাবে কাজ করছে।
                  </div>
                </div>
              </div>

              {/* Direct Manual Download Box */}
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 border border-slate-200">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        সরাসরি SQL ব্যাকআপ ফাইল ডাউনলোড (Direct SQL Download)
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-lg leading-relaxed">
                        ইমেইল ছাড়াও আপনি যেকোনো সময় এক ক্লিকে সম্পূর্ণ ডেটাবেজ ডাম্প ফাইল (.sql) আপনার লোকাল কম্পিউটারে সরাসরি সেভ করে রাখতে পারেন।
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    disabled={backingUp}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50 shrink-0"
                  >
                    {backingUp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Generating Backup SQL...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Download SQL Backup</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="space-y-3.5 animate-fade-in text-left min-w-0 w-full max-w-full">
              {(() => {
                const availableLicCount = licenses.filter(l => !l.is_used).length;
                const usedLicCount = licenses.filter(l => l.is_used).length;
                const uniqueLicProducts = Array.from(new Set(licenses.map(l => l.product_name).filter(Boolean))).sort();

                return (
                  <>
                    {/* Header & Filter Toolbar */}
                    <div className="p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-700 mr-1 flex items-center gap-1">
                          <KeyRound size={14} className="text-violet-600" />
                          Keys ({filteredLicenses.length})
                        </span>

                        {/* Status Pills */}
                        <button
                          type="button"
                          onClick={() => { setLicenseStatusFilter('all'); setLicenseCurrentPage(1); }}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${licenseStatusFilter === 'all'
                            ? 'bg-violet-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          All ({licenses.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => { setLicenseStatusFilter('available'); setLicenseCurrentPage(1); }}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${licenseStatusFilter === 'available'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                            }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Available ({availableLicCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => { setLicenseStatusFilter('used'); setLicenseCurrentPage(1); }}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${licenseStatusFilter === 'used'
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60'
                            }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          Used ({usedLicCount})
                        </button>

                        {/* Product Filter Dropdown */}
                        {uniqueLicProducts.length > 0 && (
                          <select
                            value={licenseProductFilter}
                            onChange={(e) => {
                              setLicenseProductFilter(e.target.value);
                              setLicenseCurrentPage(1);
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-medium focus:outline-none focus:border-violet-500 shadow-2xs cursor-pointer max-w-[160px]"
                          >
                            <option value="all">All Products</option>
                            {uniqueLicProducts.map((pName) => (
                              <option key={pName} value={pName}>{pName}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <div className="relative flex-1 sm:w-52">
                          <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                          <input
                            type="text"
                            placeholder="Search keys, products..."
                            value={licenseSearchQuery}
                            onChange={(e) => {
                              setLicenseSearchQuery(e.target.value);
                              setLicenseCurrentPage(1);
                            }}
                            className="w-full pl-7.5 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 shadow-2xs"
                          />
                        </div>

                        {(licenseSearchQuery || licenseStatusFilter !== 'all' || licenseProductFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setLicenseSearchQuery('');
                              setLicenseStatusFilter('all');
                              setLicenseProductFilter('all');
                              setLicenseCurrentPage(1);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Reset filters"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}

                        <button
                          onClick={handleOpenLicenseModal}
                          className="flex items-center gap-1 px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs shrink-0"
                        >
                          <Plus size={14} />
                          <span>Add Keys</span>
                        </button>
                      </div>
                    </div>

                    {/* Bordered Licenses Table */}
                    <div className="bg-white border border-slate-250 rounded-xl overflow-hidden shadow-2xs min-w-0 w-full max-w-full">
                      <div className="overflow-x-auto w-full max-w-full">
                        <table className="w-full text-left text-[10.5px] border-collapse min-w-[960px]">
                          <thead>
                            <tr className="border-b-2 border-slate-250 bg-slate-100/90 text-slate-700 font-black uppercase text-[9.5px] tracking-wider select-none">
                              <th className="py-2 px-2.5 border-r border-slate-250 w-16">ID</th>
                              <th className="py-2 px-2.5 border-r border-slate-250">Product Name</th>
                              <th className="py-2 px-2.5 border-r border-slate-250">Activation Option</th>
                              <th className="py-2 px-2.5 border-r border-slate-250">Package Option</th>
                              <th className="py-2 px-2.5 border-r border-slate-250">Rules</th>
                              <th className="py-2 px-2.5 border-r border-slate-250">License Key</th>
                              <th className="py-2 px-2.5 border-r border-slate-250 w-24">Status</th>
                              <th className="py-2 px-2.5 border-r border-slate-250 w-24">Created At</th>
                              <th className="py-2 px-2.5 border-r border-slate-250 w-24 text-red-600">Used At</th>
                              <th className="py-2 px-2.5 text-right w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70">
                            {filteredLicenses.length === 0 ? (
                              <tr>
                                <td colSpan="10" className="py-10 text-center text-slate-400 font-medium">
                                  {licenses.length === 0 ? 'No license keys stored in the database yet.' : 'No matching license keys found.'}
                                </td>
                              </tr>
                            ) : (
                              displayedLicenses.map((lic) => (
                                <tr key={lic.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-violet-50/25 transition-colors">
                                  {/* ID */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 font-bold text-slate-900 whitespace-nowrap">
                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                                      #{lic.id}
                                    </span>
                                  </td>

                                  {/* Product Name */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 font-bold text-slate-900 text-[11px] max-w-[180px] truncate" title={lic.product_name}>
                                    {lic.product_name}
                                  </td>

                                  {/* Activation Option */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap">
                                    {lic.activation_option ? (
                                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.2 rounded text-[9.5px] font-bold shadow-2xs">
                                        {lic.activation_option}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic text-[9.5px]">-</span>
                                    )}
                                  </td>

                                  {/* Package Option */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap">
                                    {lic.package_option ? (
                                      <span className="bg-violet-50 text-violet-700 border border-violet-200/80 px-1.5 py-0.2 rounded text-[9.5px] font-bold shadow-2xs">
                                        {lic.package_option}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic text-[9.5px]">-</span>
                                    )}
                                  </td>

                                  {/* Rules */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 max-w-[150px]">
                                    {lic.rules ? (
                                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded text-[9.5px] font-medium truncate block shadow-2xs" title={lic.rules}>
                                        {lic.rules}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic text-[9.5px]">-</span>
                                    )}
                                  </td>

                                  {/* License Key with Copy Button */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 max-w-[220px]">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-mono text-[10px] font-bold text-slate-800 truncate" title={lic.license_key}>
                                        {lic.license_key}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(lic.license_key);
                                          toast.success('License Key copied!', { duration: 1500 });
                                        }}
                                        className="text-slate-400 hover:text-violet-600 transition-colors p-0.5 shrink-0"
                                        title="Copy License Key"
                                      >
                                        <Copy size={10} />
                                      </button>
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border shadow-2xs ${lic.is_used
                                      ? 'bg-red-50 text-red-600 border-red-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}>
                                      {lic.is_used ? 'Used' : 'Available'}
                                    </span>
                                  </td>

                                  {/* Created At */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 text-slate-500 whitespace-nowrap text-[10px]">
                                    {new Date(lic.created_at).toLocaleDateString()}
                                  </td>

                                  {/* Used At */}
                                  <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap">
                                    {lic.is_used ? (
                                      <span className="text-red-600 font-extrabold text-[10px] bg-red-50 border border-red-200/80 px-1.5 py-0.2 rounded shadow-2xs">
                                        {lic.used_at ? new Date(lic.used_at).toLocaleDateString() : 'Used'}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic text-[10px]">-</span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-1.75 px-2.5 border-b border-slate-200/80 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => handleEditLicense(lic)}
                                        className="p-1 bg-slate-50 hover:bg-violet-50 hover:text-violet-600 border border-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer shadow-2xs"
                                        title="Edit License"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLicense(lic.id)}
                                        className="p-1 bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer shadow-2xs"
                                        title="Delete License"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div className="p-2.5 bg-slate-50/70 border-t border-slate-200/90 flex flex-wrap justify-between items-center gap-2 select-none">
                        <span className="text-[10.5px] font-medium text-slate-500">
                          Showing {filteredLicenses.length === 0 ? 0 : ((activeLicensePage - 1) * licenseItemsPerPage) + 1} to {Math.min(activeLicensePage * licenseItemsPerPage, filteredLicenses.length)} of {filteredLicenses.length} keys
                        </span>

                        {totalLicensePages > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setLicenseCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={activeLicensePage === 1}
                              className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                            >
                              Prev
                            </button>

                            {getPageNumbers(activeLicensePage, totalLicensePages).map((page, idx) => {
                              if (page === '...') {
                                return (
                                  <span key={idx} className="px-1 text-[10px] font-bold text-slate-400">
                                    ...
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setLicenseCurrentPage(page)}
                                  className={`w-6 h-6 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${activeLicensePage === page
                                    ? 'bg-violet-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                  {page}
                                </button>
                              );
                            })}

                            <button
                              onClick={() => setLicenseCurrentPage(prev => Math.min(prev + 1, totalLicensePages))}
                              disabled={activeLicensePage === totalLicensePages}
                              className="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-3.5 animate-fade-in text-left min-w-0 w-full max-w-full">
              {/* Header & Filter Toolbar */}
              <div className="p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-700 mr-1 flex items-center gap-1">
                    <Tag size={14} className="text-amber-500" />
                    Coupons ({filteredCoupons.length})
                  </span>

                  {/* Status Pills */}
                  {['all', 'active', 'disabled'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCouponStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer capitalize ${couponStatusFilter === st
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {st === 'all' ? `All (${coupons.length})` : st}
                    </button>
                  ))}

                  {/* Discount Type Dropdown */}
                  <select
                    value={couponTypeFilter}
                    onChange={(e) => setCouponTypeFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-medium focus:outline-none focus:border-amber-400 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (৳)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Search code, type..."
                      value={couponSearchQuery}
                      onChange={(e) => setCouponSearchQuery(e.target.value)}
                      className="w-full pl-7.5 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-2xs"
                    />
                  </div>

                  {(couponSearchQuery || couponStatusFilter !== 'all' || couponTypeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCouponSearchQuery('');
                        setCouponStatusFilter('all');
                        setCouponTypeFilter('all');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      title="Reset filters"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenCouponModal()}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    <Plus size={14} />
                    <span>Create Coupon</span>
                  </button>
                </div>
              </div>

              {/* Bordered Coupons Table */}
              <div className="bg-white border border-slate-250 rounded-xl overflow-hidden shadow-2xs min-w-0 w-full max-w-full">
                <div className="overflow-x-auto w-full max-w-full">
                  <table className="w-full text-left text-[10.5px] border-collapse min-w-[850px]">
                    <thead>
                      <tr className="border-b-2 border-slate-250 bg-slate-100/90 text-slate-700 font-black uppercase text-[9.5px] tracking-wider select-none">
                        <th className="py-2 px-2.5 border-r border-slate-250 w-16">ID</th>
                        <th className="py-2 px-2.5 border-r border-slate-250">Code</th>
                        <th className="py-2 px-2.5 border-r border-slate-250">Type</th>
                        <th className="py-2 px-2.5 border-r border-slate-250">Discount Value</th>
                        <th className="py-2 px-2.5 border-r border-slate-250">Min Order</th>
                        <th className="py-2 px-2.5 border-r border-slate-250">Usage</th>
                        <th className="py-2 px-2.5 border-r border-slate-250 w-24">Status</th>
                        <th className="py-2 px-2.5 border-r border-slate-250">Expires At</th>
                        <th className="py-2 px-2.5 text-right w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {filteredCoupons.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-10 text-center text-slate-400 font-medium">
                            {coupons.length === 0
                              ? 'No coupons created yet. Click "Create Coupon" to add one!'
                              : 'No coupons match your search query.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCoupons.map((c) => (
                          <tr key={c.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-amber-50/20 transition-colors">
                            {/* ID */}
                            <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 font-bold text-slate-900 whitespace-nowrap">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                                #{c.id}
                              </span>
                            </td>

                            {/* Code with Copy Button */}
                            <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-lg shadow-2xs">
                                <span className="font-mono font-black text-amber-700 text-[11px] uppercase tracking-wider">
                                  {c.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(c.code);
                                    toast.success(`Copied: ${c.code}`, { duration: 1500 });
                                  }}
                                  className="text-amber-500 hover:text-amber-800 transition-colors p-0.5"
                                  title="Copy Coupon Code"
                                >
                                  <Copy size={10} />
                                </button>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap capitalize font-bold text-slate-700">
                              {c.discount_type}
                            </td>

                            {/* Discount Value */}
                            <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap">
                              <span className="font-extrabold text-emerald-700 text-[11px]">
                                {c.discount_type === 'percentage' ? `${parseFloat(c.discount_value)}%` : `৳${parseFloat(c.discount_value)}`}
                              </span>
                              {c.max_discount_amount > 0 && c.discount_type === 'percentage' && (
                                <span className="text-[9.5px] text-slate-400 block font-normal">(Max: ৳{c.max_discount_amount})</span>
                              )}
                            </td>

                            {/* Min Order */}
                            <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap font-bold text-slate-700">
                              ৳{parseFloat(c.min_order_amount || 0)}
                            </td>

                            {/* Usage */}
                            <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap">
                              <span className="bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs">
                                {c.used_count} / {c.usage_limit ? c.usage_limit : '∞'}
                              </span>
                            </td>

                            {/* Status Toggle */}
                            <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleCouponStatus(c)}
                                className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold cursor-pointer border transition-all shadow-2xs ${c.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                  }`}
                              >
                                {c.is_active ? 'Active' : 'Disabled'}
                              </button>
                            </td>

                            {/* Expires At */}
                            <td className="py-1.75 px-2.5 border-r border-b border-slate-200/80 text-slate-500 whitespace-nowrap text-[10px]">
                              {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No Expiry'}
                            </td>

                            {/* Actions */}
                            <td className="py-1.75 px-2.5 border-b border-slate-200/80 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenCouponModal(c)}
                                  className="p-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer shadow-2xs"
                                  title="Edit Coupon"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(c.id)}
                                  className="p-1 bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer shadow-2xs"
                                  title="Delete Coupon"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
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
          {activeTab === 'eps_history' && (
            <div className="animate-fade-in space-y-6 min-w-0 w-full max-w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-violet-600" />
                    EPS Payment History
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">View transaction details and the license keys provided.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto relative min-w-0 w-full max-w-full">
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

          {activeTab === 'slides' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-between items-center pt-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Home Carousel Slides ({slides.length})</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs h-fit">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-750 mb-4 pb-2 border-b border-slate-100">Add New Slide Image</h4>
                  <form onSubmit={handleSlideSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Slide Image URL *
                      </label>
                      <input
                        type="url"
                        value={slideImageUrl}
                        onChange={(e) => setSlideImageUrl(e.target.value)}
                        placeholder="https://example.com/slide-banner.png"
                        className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={slideFormSubmitting}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {slideFormSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Slide</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-750 mb-4 pb-2 border-b border-slate-100">Active Slides</h4>
                  {slides.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium text-xs">
                      No slides loaded. Home page will fall back to default slides.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {slides.map((slide) => (
                        <div key={slide.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xxxxs flex flex-col justify-between bg-slate-50 relative group">
                          <div className="aspect-[1663/945] w-full bg-slate-900 overflow-hidden flex items-center justify-center relative">
                            <img src={slide.image_url} alt="Slide Preview" className="w-full h-full object-cover" />
                          </div>

                          <div className="p-3 bg-white border-t border-slate-150 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-slate-500 truncate select-all flex-1" title={slide.image_url}>
                              {slide.image_url}
                            </span>
                            <button
                              onClick={() => handleDeleteSlide(slide.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 border border-red-200/40 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Delete Slide"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme_settings' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-850">Website Color Palette & Theme Settings</h3>
                    <p className="text-xs text-slate-500">Customize the visual theme, primary brand color, and call-to-action accent colors across your store.</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Select Theme Preset</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(THEME_PRESETS).map((key) => {
                      const item = THEME_PRESETS[key];
                      const isSelected = theme.id === item.id;
                      return (
                        <div
                          key={key}
                          onClick={() => {
                            selectPreset(key);
                            toast.success(`Selected theme: ${item.name}`);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'border-[#005F53] bg-teal-50/20 shadow-sm'
                            : 'border-slate-200/80 hover:border-slate-300 bg-white'
                            }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-extrabold text-xs text-slate-800">{item.name}</span>
                              {isSelected && <span className="text-[10px] bg-[#005F53] text-white px-2 py-0.5 rounded-full font-bold">Active</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                          </div>

                          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center space-x-1">
                              <span className="w-5 h-5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: item.primaryColor }} title="Primary" />
                              <span className="w-5 h-5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: item.accentColor }} title="Accent CTA" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{item.primaryColor} / {item.accentColor}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-8 p-5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4">Custom Color Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Primary Brand Color</label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={theme.primaryColor || '#005F53'}
                          onChange={(e) => updateTheme({ primaryColor: e.target.value, id: 'custom' })}
                          className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={theme.primaryColor || '#005F53'}
                          onChange={(e) => updateTheme({ primaryColor: e.target.value, id: 'custom' })}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 w-32 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Accent CTA Color (Buy Buttons & Highlights)</label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={theme.accentColor || '#FF6D00'}
                          onChange={(e) => updateTheme({ accentColor: e.target.value, id: 'custom' })}
                          className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={theme.accentColor || '#FF6D00'}
                          onChange={(e) => updateTheme({ accentColor: e.target.value, id: 'custom' })}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 w-32 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Live UI Components Preview</h4>
                  <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-100/60 backdrop-blur-md flex flex-wrap items-center gap-4">
                    <button
                      className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md transition-transform active:scale-95 cursor-pointer"
                      style={{ backgroundColor: theme.primaryColor || '#005F53' }}
                    >
                      Primary Header Button
                    </button>

                    <button
                      className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md transition-transform active:scale-95 cursor-pointer"
                      style={{ backgroundColor: theme.accentColor || '#FF6D00' }}
                    >
                      🛒 Buy Now (Accent CTA)
                    </button>

                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{
                        backgroundColor: theme.primaryColor ? `${theme.primaryColor}15` : '#005F5315',
                        color: theme.primaryColor || '#005F53',
                        borderColor: theme.primaryColor ? `${theme.primaryColor}30` : '#005F5330'
                      }}
                    >
                      Badge Preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marquee_settings' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-xs">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-850">Moving Text & Top Bar Announcements</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Customize the scrolling promotional text, offers, badges, colors, and speed across the top bar.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleResetMarqueeDefaults}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset to store default announcements"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveMarquee}
                      disabled={marqueeSaving}
                      className="px-5 py-2 rounded-xl bg-[#005F53] hover:bg-[#00473e] text-xs font-extrabold text-white flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      {marqueeSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Top Bar Preview Card */}
                <div className="mt-6 mb-8 p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px]">Live Storefront Top Bar Preview</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Duration: {marqueeSpeed}s {marqueeEnabled ? '(Active)' : '(Disabled)'}
                    </span>
                  </div>

                  {marqueeEnabled ? (
                    <div className="bg-slate-50 text-slate-800 rounded-xl p-2.5 border border-slate-200 shadow-inner overflow-hidden flex items-center h-10 select-none">
                      <div className="hidden sm:flex items-center gap-2 shrink-0 mr-3 pr-3 border-r border-slate-200">
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">
                          WhatsApp
                        </span>
                      </div>

                      <div className="flex-1 overflow-hidden relative flex items-center">
                        <div
                          className="animate-topbar-marquee flex items-center gap-10 text-xs font-bold"
                          style={{ animationDuration: `${marqueeSpeed}s` }}
                        >
                          {[...marqueeItems, ...marqueeItems].map((item, idx) => {
                            const badgeStyle = item.badgeColor === 'emerald'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : item.badgeColor === 'amber'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : item.badgeColor === 'blue'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : item.badgeColor === 'rose'
                                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                                    : 'bg-purple-100 text-purple-700 border-purple-200';

                            const textClass = item.textColor === 'emerald'
                              ? 'text-emerald-600'
                              : item.textColor === 'amber'
                                ? 'text-amber-700'
                                : item.textColor === 'blue'
                                  ? 'text-blue-600'
                                  : item.textColor === 'rose'
                                    ? 'text-rose-600'
                                    : item.textColor === 'slate'
                                      ? 'text-slate-700'
                                      : 'text-violet-700';

                            return (
                              <div key={`preview-${idx}`} className="flex items-center gap-2 shrink-0">
                                {item.badge && (
                                  <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                    {item.badge}
                                  </span>
                                )}
                                <span className={`font-extrabold ${textClass}`}>
                                  {item.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 shrink-0 ml-3 pl-3 border-l border-slate-200">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          ⭐ 4.9
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/80 rounded-xl p-4 text-center text-slate-400 text-xs font-semibold">
                      Announcement marquee is currently disabled and will not be displayed on the storefront.
                    </div>
                  )}
                </div>

                {/* Settings Configuration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  {/* Enabled Toggle */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">Display Moving Text Bar</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Toggle announcement bar visibility on the site</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMarqueeEnabled(!marqueeEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${marqueeEnabled ? 'bg-[#005F53]' : 'bg-slate-300'
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${marqueeEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Speed Selector */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-extrabold text-slate-800">Scrolling Speed</h4>
                      <span className="text-[11px] font-mono text-slate-600 font-bold">{marqueeSpeed} seconds</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Fast', speed: 20 },
                        { label: 'Normal', speed: 35 },
                        { label: 'Moderate', speed: 50 },
                        { label: 'Slow', speed: 70 }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setMarqueeSpeed(preset.speed)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${marqueeSpeed === preset.speed
                            ? 'bg-[#005F53] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          {preset.label} ({preset.speed}s)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Announcement Items List */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Announcement Messages ({marqueeItems.length})</h4>
                      <p className="text-xs text-slate-500">Edit, reorder, or add messages displayed in the moving bar.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMarqueeItem}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Message</span>
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {marqueeItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center">
                              #{index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-600">Announcement Item</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMoveMarqueeItem(index, -1)}
                              disabled={index === 0}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMarqueeItem(index, 1)}
                              disabled={index === marqueeItems.length - 1}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMarqueeItem(index)}
                              className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                              title="Delete Message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Badge Text */}
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Badge / Tag (Optional)</label>
                            <input
                              type="text"
                              value={item.badge || ''}
                              onChange={(e) => handleUpdateMarqueeItem(index, 'badge', e.target.value)}
                              placeholder="e.g. বিশেষ অফার, Hot, New"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Badge Color */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Badge Color</label>
                            <select
                              value={item.badgeColor || 'purple'}
                              onChange={(e) => handleUpdateMarqueeItem(index, 'badgeColor', e.target.value)}
                              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400 bg-white"
                            >
                              <option value="purple">🟣 Purple</option>
                              <option value="emerald">🟢 Emerald</option>
                              <option value="amber">🟡 Amber</option>
                              <option value="blue">🔵 Blue</option>
                              <option value="rose">🔴 Rose</option>
                            </select>
                          </div>

                          {/* Message Text */}
                          <div className="md:col-span-5">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Announcement Message Text</label>
                            <input
                              type="text"
                              value={item.text || ''}
                              onChange={(e) => handleUpdateMarqueeItem(index, 'text', e.target.value)}
                              placeholder="Type announcement message..."
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          {/* Text Color */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Text Accent</label>
                            <select
                              value={item.textColor || 'violet'}
                              onChange={(e) => handleUpdateMarqueeItem(index, 'textColor', e.target.value)}
                              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400 bg-white"
                            >
                              <option value="violet">Violet</option>
                              <option value="emerald">Emerald</option>
                              <option value="amber">Amber</option>
                              <option value="blue">Blue</option>
                              <option value="rose">Rose</option>
                              <option value="slate">Slate Gray</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    {marqueeItems.length === 0 && (
                      <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">No announcement messages configured.</p>
                        <button
                          type="button"
                          onClick={handleAddMarqueeItem}
                          className="mt-3 px-4 py-1.5 bg-[#005F53] text-white text-xs font-bold rounded-xl"
                        >
                          + Add First Message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support_settings' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                {/* Top Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600 shadow-xs">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-850">Customer Support & Social Media Links</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage your WhatsApp number, support email, and social profiles across the top bar, footer, and support pages.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleResetSupportDefaults}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset to store default contact links"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveSupportSettings}
                      disabled={supportSaving}
                      className="px-5 py-2 rounded-xl bg-[#005F53] hover:bg-[#00473e] text-xs font-extrabold text-white flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      {supportSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="mt-6 mb-8 p-5 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                      <span className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px]">
                        Live Storefront Preview
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Topbar & Footer Representation</span>
                  </div>

                  {/* Topbar simulation */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                      1. Top Bar Elements
                    </span>
                    <div className="bg-slate-50 text-slate-800 rounded-xl p-3 border border-slate-200 shadow-inner flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-white border border-emerald-200 px-2.5 py-1 rounded-full text-emerald-600 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp ({supportForm.support_whatsapp || 'Not set'})</span>
                        </span>

                        <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                          <Mail className="w-3 h-3 text-violet-600" />
                          <span>{supportForm.support_email || 'Not set'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center" title="Facebook">
                          f
                        </span>
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center" title="WhatsApp">
                          <Phone className="w-3 h-3 text-white" />
                        </span>
                        <span className="w-6 h-6 rounded-full bg-pink-600 text-white font-black text-[10px] flex items-center justify-center" title="Instagram">
                          ig
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer simulation */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                      2. Footer Contact & Social Links
                    </span>
                    <div className="bg-slate-800 rounded-xl p-3.5 border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{supportForm.support_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp: {supportForm.support_whatsapp}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 font-semibold text-[11px]">
                          Facebook
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 font-semibold text-[11px]">
                          LinkedIn
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 font-semibold text-[11px]">
                          YouTube
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 1: Direct Support & Messaging Channels */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Direct Support & Messaging Channels
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* WhatsApp */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-700">
                          WhatsApp Support Number
                        </label>
                        {supportForm.support_whatsapp && (
                          <a
                            href={`https://wa.me/${supportForm.support_whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Test Chat</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={supportForm.support_whatsapp}
                        onChange={(e) => setSupportForm({ ...supportForm, support_whatsapp: e.target.value })}
                        placeholder="e.g. 8801925112444"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500">
                        Used for Topbar WhatsApp pill, social icons, floating chat widget, and WhatsApp order buttons. Include country code (e.g. 88019...).
                      </p>
                    </div>

                    {/* Support Email */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-700">
                          Support / Business Email
                        </label>
                        {supportForm.support_email && (
                          <a
                            href={`mailto:${supportForm.support_email}`}
                            className="text-[11px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Test Email</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="email"
                        value={supportForm.support_email}
                        onChange={(e) => setSupportForm({ ...supportForm, support_email: e.target.value })}
                        placeholder="e.g. info@elitepassbd.com"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500"
                      />
                      <p className="text-[11px] text-slate-500">
                        Displayed in the Topbar email pill, Footer support area, and Contact Support page.
                      </p>
                    </div>

                    {/* Messenger Link */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 md:col-span-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-700">
                          Facebook Messenger Direct Link
                        </label>
                        {supportForm.social_messenger && (
                          <a
                            href={supportForm.social_messenger}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Messenger</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={supportForm.social_messenger}
                        onChange={(e) => setSupportForm({ ...supportForm, social_messenger: e.target.value })}
                        placeholder="e.g. https://m.me/elitepassbd"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-[11px] text-slate-500">
                        Used in the floating customer chat pill widget in the footer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Social Media Profiles */}
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Social Media Profiles
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Facebook */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">f</span>
                          <span>Facebook Page URL</span>
                        </span>
                        {supportForm.social_facebook && (
                          <a
                            href={supportForm.social_facebook}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={supportForm.social_facebook}
                        onChange={(e) => setSupportForm({ ...supportForm, social_facebook: e.target.value })}
                        placeholder="https://facebook.com/ElitePassBD"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Instagram */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-pink-600 text-white font-bold text-[9px] flex items-center justify-center">ig</span>
                          <span>Instagram Profile URL</span>
                        </span>
                        {supportForm.social_instagram && (
                          <a
                            href={supportForm.social_instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={supportForm.social_instagram}
                        onChange={(e) => setSupportForm({ ...supportForm, social_instagram: e.target.value })}
                        placeholder="https://instagram.com/elitepassbd"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    {/* YouTube */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center">yt</span>
                          <span>YouTube Channel URL</span>
                        </span>
                        {supportForm.social_youtube && (
                          <a
                            href={supportForm.social_youtube}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={supportForm.social_youtube}
                        onChange={(e) => setSupportForm({ ...supportForm, social_youtube: e.target.value })}
                        placeholder="https://youtube.com/elitepassbd"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-700 text-white font-bold text-[9px] flex items-center justify-center">in</span>
                          <span>LinkedIn Profile URL</span>
                        </span>
                        {supportForm.social_linkedin && (
                          <a
                            href={supportForm.social_linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={supportForm.social_linkedin}
                        onChange={(e) => setSupportForm({ ...supportForm, social_linkedin: e.target.value })}
                        placeholder="https://linkedin.com/elitepassbd"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={() => setShowProductModal(false)} />

          <div className="relative bg-white border border-slate-200/90 w-[96vw] max-w-[1550px] mx-auto rounded-2xl overflow-hidden shadow-2xl z-10 animate-slide-up max-h-[94vh] flex flex-col">
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-50 border-b border-slate-200/90 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/70 hidden sm:inline-flex">
                  Full-Screen 5-Grid
                </span>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 text-left">
              {formError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  {formError}
                </div>
              )}

              {/* Row 1: 5-Grid Layout for Primary Product Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Capcut Pro Special offer"
                    className="w-full text-[11px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 font-medium transition-all shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider mb-1">Category (Optional)</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full text-[11px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800 cursor-pointer font-medium transition-all shadow-2xs"
                  >
                    <option value="">No Category / Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/product.jpg"
                    className="w-full text-[11px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 font-medium transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider mb-1">Device Options (Comma-Separated)</label>
                  <input
                    type="text"
                    value={productForm.device_options}
                    onChange={(e) => setProductForm({ ...productForm, device_options: e.target.value })}
                    placeholder="e.g. Phone, PC/MAC, Phone + PC"
                    className="w-full text-[11px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 font-medium transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider mb-1">Activation Options (Comma-Separated)</label>
                  <input
                    type="text"
                    value={productForm.activation_options}
                    onChange={(e) => setProductForm({ ...productForm, activation_options: e.target.value })}
                    placeholder="e.g. Readymade ID, Personal Email"
                    className="w-full text-[11px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 font-medium transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Product Tags (2 cols) & Highlighted Text / Bullet Features (3 cols) in 5-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider mb-1">Product Tags (Comma-Separated)</label>
                    <input
                      type="text"
                      value={productForm.tags}
                      onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                      placeholder="e.g. AI tools, video editing, premium"
                      className="w-full text-[11px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 font-medium transition-all shadow-2xs"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">
                    Comma-separated tags for store search, category filters & SEO.
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider mb-1">
                    Highlighted Text / Bullet Features (One per line or comma-separated)
                  </label>
                  <textarea
                    rows="2"
                    value={productForm.highlighted_text}
                    onChange={(e) => setProductForm({ ...productForm, highlighted_text: e.target.value })}
                    placeholder="e.g. 100% Official License Key | Instant Auto Delivery | Lifetime Warranty"
                    className="w-full text-[11px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-2.5 py-1 text-slate-800 placeholder-slate-400 font-medium transition-all shadow-2xs"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    💡 Displays as key bullet points below the title on the product details page.
                  </span>
                </div>
                {/* Custom Bullet Points Manager */}
                <div className="md:col-span-2">
                  <div className="border border-purple-200/80 p-2.5 rounded-xl space-y-2 bg-purple-50/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] font-black text-violet-800 uppercase tracking-wider">Custom Bullet Points / Feature Highlights</span>
                        <span className="text-[9.5px] text-slate-400 hidden sm:inline">• Highlights displayed on details page</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(productForm.bullet_points || []), ''];
                          setProductForm({ ...productForm, bullet_points: updated });
                        }}
                        className="px-2.5 py-0.75 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Bullet Point</span>
                      </button>
                    </div>

                    {(!productForm.bullet_points || productForm.bullet_points.length === 0) ? (
                      <p className="text-[10px] text-slate-400 italic">No custom bullet points added yet. Click "+ Add Bullet Point" to add features.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                        {productForm.bullet_points.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-purple-100 shadow-2xs">
                            <span className="text-[10px] font-black text-violet-600 pl-1">•</span>
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => {
                                const updated = [...productForm.bullet_points];
                                updated[bIdx] = e.target.value;
                                setProductForm({ ...productForm, bullet_points: updated });
                              }}
                              placeholder="e.g. Official Key with Warranty"
                              className="w-full text-[11px] bg-transparent border-0 focus:outline-none px-1 text-slate-800 font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = productForm.bullet_points.filter((_, i) => i !== bIdx);
                                setProductForm({ ...productForm, bullet_points: updated });
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Product Badges in 5-Grid */}
              <div className="bg-slate-50/80 border border-slate-200/90 p-2.5 rounded-xl space-y-1.5">
                <span className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Product Badges / Special Labels</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[10.5px] text-slate-700 font-bold">
                  <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-emerald-50/40 hover:border-emerald-200 transition-colors cursor-pointer select-none shadow-2xs">
                    <input
                      type="checkbox"
                      checked={!!productForm.is_instant}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProductForm({
                          ...productForm,
                          is_instant: checked,
                          activation_process: checked ? 'Instant' : (productForm.activation_process === 'Instant' ? 'Manual' : productForm.activation_process)
                        });
                      }}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-emerald-700 font-extrabold truncate">⚡ Instant Delivery</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-violet-50/40 hover:border-violet-200 transition-colors cursor-pointer select-none shadow-2xs">
                    <input
                      type="checkbox"
                      checked={productForm.is_hot}
                      onChange={(e) => setProductForm({ ...productForm, is_hot: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer"
                    />
                    <span className="truncate">🔥 Hot Selling</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-violet-50/40 hover:border-violet-200 transition-colors cursor-pointer select-none shadow-2xs">
                    <input
                      type="checkbox"
                      checked={productForm.is_highlighted}
                      onChange={(e) => setProductForm({ ...productForm, is_highlighted: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer"
                    />
                    <span className="truncate">⭐ Highlighted</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-violet-50/40 hover:border-violet-200 transition-colors cursor-pointer select-none shadow-2xs">
                    <input
                      type="checkbox"
                      checked={productForm.is_hot_discount}
                      onChange={(e) => setProductForm({ ...productForm, is_hot_discount: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer"
                    />
                    <span className="truncate">🏷️ Hot Discount</span>
                  </label>

                  <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-amber-50/40 hover:border-amber-200 transition-colors cursor-pointer select-none shadow-2xs">
                    <input
                      type="checkbox"
                      checked={!!productForm.is_top_selling}
                      onChange={(e) => setProductForm({ ...productForm, is_top_selling: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-amber-700 font-extrabold truncate">🏆 Top Selling</span>
                  </label>
                </div>
              </div>

              {/* Description & Additional Info Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="border border-slate-200/90 rounded-xl p-2.5 bg-white shadow-2xs">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Description *</label>
                    <div className="flex rounded-md overflow-hidden border border-slate-200 text-[9.5px] font-bold">
                      <button type="button" onClick={() => setProductForm({ ...productForm, _descMode: 'rich' })}
                        className={`px-2 py-0.5 transition-colors cursor-pointer ${(productForm._descMode || 'rich') === 'rich' ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                        Rich Text
                      </button>
                      <button type="button" onClick={() => setProductForm({ ...productForm, _descMode: 'html' })}
                        className={`px-2 py-0.5 transition-colors cursor-pointer ${productForm._descMode === 'html' ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                        HTML
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden border border-slate-150">
                    {(productForm._descMode || 'rich') === 'rich' ? (
                      <JoditEditor
                        value={productForm.description || ''}
                        config={{ ...joditConfig, height: 180 }}
                        onBlur={(newContent) => setProductForm({ ...productForm, description: newContent })}
                        className="text-[11px] text-slate-800"
                      />
                    ) : (
                      <textarea
                        value={productForm.description || ''}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Paste raw HTML here (tables, custom tags, etc.)"
                        rows={7}
                        className="w-full text-[11px] font-mono bg-slate-50 border-0 focus:outline-none rounded-lg p-2.5 text-slate-800 resize-y"
                      />
                    )}
                  </div>
                </div>

                <div className="border border-slate-200/90 rounded-xl p-2.5 bg-white shadow-2xs">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Additional Information Box</label>
                    <div className="flex rounded-md overflow-hidden border border-slate-200 text-[9.5px] font-bold">
                      <button type="button" onClick={() => setProductForm({ ...productForm, _addMode: 'rich' })}
                        className={`px-2 py-0.5 transition-colors cursor-pointer ${(productForm._addMode || 'rich') === 'rich' ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                        Rich Text
                      </button>
                      <button type="button" onClick={() => setProductForm({ ...productForm, _addMode: 'html' })}
                        className={`px-2 py-0.5 transition-colors cursor-pointer ${productForm._addMode === 'html' ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                        HTML
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden border border-slate-150">
                    {(productForm._addMode || 'rich') === 'rich' ? (
                      <JoditEditor
                        value={productForm.additional_info || ''}
                        config={{ ...joditConfig, height: 180 }}
                        onBlur={(newContent) => setProductForm({ ...productForm, additional_info: newContent })}
                        className="text-[11px] text-slate-800"
                      />
                    ) : (
                      <textarea
                        value={productForm.additional_info || ''}
                        onChange={(e) => setProductForm({ ...productForm, additional_info: e.target.value })}
                        placeholder="Paste raw HTML here (tables, custom tags, etc.)"
                        rows={7}
                        className="w-full text-[11px] font-mono bg-slate-50 border-0 focus:outline-none rounded-lg p-2.5 text-slate-800 resize-y"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Product Packages & FAQs Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="md:col-span-5 border border-slate-200/90 p-3 rounded-xl space-y-2 bg-slate-50/70 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Product Packages</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedPkgs = [...productForm.packages, { activation: '', duration: '', stock: '', discount: '', activation_process: 'Automatic', price: '', original_price: '', retail_price: '' }];
                        setProductForm({ ...productForm, packages: updatedPkgs });
                      }}
                      className="px-2 py-0.75 bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white border border-violet-200 hover:border-transparent rounded-md text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Package Option</span>
                    </button>
                  </div>

                  {productForm.packages.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-2">No packages defined. Base price will apply.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                      <div className="hidden md:grid gap-1.5 text-[8.5px] font-black text-slate-500 uppercase tracking-wider px-1" style={{ gridTemplateColumns: '1fr 1.3fr 1.3fr 0.9fr 0.9fr 1fr 1fr 1fr auto' }}>
                        <div>Type</div>
                        <div>Activation</div>
                        <div>Package</div>
                        <div className="text-center">Stock</div>
                        <div className="text-center">Discount</div>
                        <div className="text-center">Original Price</div>
                        <div className="text-center">Retail Price</div>
                        <div className="text-center">Sell Price</div>
                        <div></div>
                      </div>

                      {productForm.packages.map((pkg, idx) => {
                        const activationOpts = productForm.activation_options
                          ? productForm.activation_options.split(',').map(o => o.trim()).filter(Boolean)
                          : [];
                        return (
                          <div key={idx} className="flex flex-col md:grid gap-1.5 md:items-center bg-white p-2 md:p-1.5 border border-slate-200 rounded-lg mb-1.5 md:mb-0 shadow-2xs" style={{ gridTemplateColumns: '1fr 1.3fr 1.3fr 0.9fr 0.9fr 1fr 1fr 1fr auto' }}>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 md:hidden mb-0.5">Type</span>
                              <select
                                value={pkg.activation_process || 'Automatic'}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].activation_process = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1.5 py-1 text-slate-800 cursor-pointer font-medium"
                              >
                                <option value="Automatic">Auto</option>
                                <option value="Manual">Manual</option>
                              </select>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 md:hidden mb-0.5">Activation</span>
                              {activationOpts.length > 0 ? (
                                <select
                                  value={pkg.activation || ''}
                                  onChange={(e) => {
                                    const updated = [...productForm.packages];
                                    updated[idx].activation = e.target.value;
                                    setProductForm({ ...productForm, packages: updated });
                                  }}
                                  className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1.5 py-1 text-slate-800 cursor-pointer font-medium"
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
                                  className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1.5 py-1 text-slate-800 font-medium"
                                />
                              )}
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 md:hidden mb-0.5">Package/Duration</span>
                              <input
                                type="text"
                                value={pkg.duration}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].duration = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                placeholder="e.g. 1 Month"
                                className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1.5 py-1 text-slate-800 font-medium"
                                required
                              />
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 md:hidden mb-0.5">Stock</span>
                              <input
                                type="number"
                                value={pkg.stock}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].stock = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                placeholder="Qty"
                                className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1 py-1 text-slate-800 text-center font-medium"
                              />
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 md:hidden mb-0.5">Discount</span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={pkg.discount}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].discount = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                placeholder="৳"
                                className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1 py-1 text-slate-800 text-center font-medium"
                              />
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 md:hidden mb-0.5">Orig. Price</span>
                              <input
                                type="number"
                                step="0.01"
                                value={pkg.original_price || ''}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].original_price = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                placeholder="৳"
                                className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1 py-1 text-slate-800 text-center font-medium"
                              />
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 md:hidden mb-0.5">Retail Price</span>
                              <input
                                type="number"
                                step="0.01"
                                value={pkg.retail_price || ''}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].retail_price = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                placeholder="৳"
                                className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1 py-1 text-slate-800 text-center font-medium"
                              />
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-500 md:hidden mb-0.5">Sell Price</span>
                              <input
                                type="number"
                                step="0.01"
                                value={pkg.price}
                                onChange={(e) => {
                                  const updated = [...productForm.packages];
                                  updated[idx].price = e.target.value;
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                placeholder="Price"
                                className="w-full text-[10.5px] bg-slate-50 border border-slate-250 focus:border-violet-500 focus:outline-none rounded px-1.5 py-1 text-slate-800 text-center font-bold"
                                required
                              />
                            </div>

                            <div className="flex justify-end mt-1 md:mt-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = productForm.packages.filter((_, i) => i !== idx);
                                  setProductForm({ ...productForm, packages: updated });
                                }}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0"
                                title="Remove package"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* FAQ Section */}
                <div className="border border-slate-200/90 p-3 rounded-xl space-y-2 bg-slate-50/70 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Frequently Asked Questions (FAQ)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedFaqs = [...productForm.faqs, { q: '', a: '' }];
                        setProductForm({ ...productForm, faqs: updatedFaqs });
                      }}
                      className="px-2 py-0.75 bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white border border-violet-200 hover:border-transparent rounded-md text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add FAQ</span>
                    </button>
                  </div>

                  {productForm.faqs.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-2">No FAQs added yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {productForm.faqs.map((faq, idx) => (
                        <div key={idx} className="space-y-1 p-2 bg-white rounded-lg border border-slate-200 relative shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productForm.faqs.filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, faqs: updated });
                            }}
                            className="absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
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
                            placeholder="Question (e.g. How do I activate?)"
                            className="w-full text-[10.5px] bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white focus:outline-none rounded px-2 py-1 text-slate-800 pr-7 font-medium"
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
                            className="w-full text-[10.5px] bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white focus:outline-none rounded px-2 py-1 text-slate-800 font-medium"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Catalog</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock & Packages Management Modal (Image-1 Style) */}
      {showStockModal && stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={() => !stockSubmitting && setShowStockModal(false)} />

          <div className="relative bg-white border border-slate-200/90 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl z-10 animate-slide-up my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-linear-to-r from-slate-50 via-violet-50/30 to-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-200 flex items-center justify-center text-violet-600 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm md:text-base font-bold text-slate-800 truncate">
                      Manage Stock & Packages
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 border border-violet-200 shrink-0">
                      {stockProduct.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    প্যাকেজ অনুযায়ী স্টক ও মূল্য নির্ধারণ করুন • মোট স্টক স্বয়ংক্রিয়ভাবে হিসাব হবে
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <div className="text-right mr-2 hidden sm:block">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock</span>
                  <span className="text-sm font-black text-emerald-600">
                    {stockPackages.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0)} units
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  disabled={stockSubmitting}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStock} className="p-4 md:p-5 space-y-4">
              {/* Quick Stock Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <span className="text-[10.5px] font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    <span>Quick Stock Increase:</span>
                  </span>
                  {[
                    { label: '+1 to All', val: 1 },
                    { label: '+5 to All', val: 5 },
                    { label: '+10 to All', val: 10 },
                    { label: '+20 to All', val: 20 },
                    { label: '+50 to All', val: 50 },
                  ].map((btn, bIdx) => (
                    <button
                      key={bIdx}
                      type="button"
                      onClick={() => {
                        setStockPackages(stockPackages.map(p => ({
                          ...p,
                          stock: (parseInt(p.stock) || 0) + btn.val
                        })));
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-violet-50 text-slate-700 hover:text-violet-700 border border-slate-200 hover:border-violet-300 rounded-md text-[10px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      {btn.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setStockPackages(stockPackages.map(p => ({
                        ...p,
                        stock: 0
                      })));
                    }}
                    className="px-2 py-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-md text-[10px] font-semibold transition-all shadow-2xs cursor-pointer ml-1"
                  >
                    Reset to 0
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-slate-500">Packages:</span>
                  <span className="px-2 py-0.5 bg-violet-600 text-white rounded-md text-[10.5px] font-bold">
                    {stockPackages.length}
                  </span>
                </div>
              </div>

              {/* Table Section matching Image-1 */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">PRODUCT PACKAGES</span>
                    <span className="text-[10px] text-slate-400 font-medium">(Image-1 Style)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStockPackages([
                        ...stockPackages,
                        {
                          activation_process: 'Manual',
                          activation: '',
                          duration: '1 Month',
                          stock: 5,
                          discount: '',
                          original_price: '',
                          retail_price: '',
                          price: stockProduct.price || 0
                        }
                      ]);
                    }}
                    className="px-2.5 py-1 bg-violet-50 hover:bg-violet-600 text-violet-700 hover:text-white border border-violet-200 hover:border-violet-600 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Package Option</span>
                  </button>
                </div>

                {stockPackages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No packages available for this product.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setStockPackages([{
                          activation_process: 'Manual',
                          activation: 'Standard',
                          duration: '1 Month',
                          stock: 10,
                          discount: '',
                          original_price: stockProduct.price || '',
                          retail_price: stockProduct.price || '',
                          price: stockProduct.price || ''
                        }]);
                      }}
                      className="mt-2 text-xs text-violet-600 font-bold hover:underline cursor-pointer"
                    >
                      + Add Default Package
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[820px] space-y-1.5">
                      {/* Headers matching Image-1 */}
                      <div
                        className="grid gap-2 text-[9px] font-black text-slate-500 uppercase tracking-wider px-2 py-1.5 bg-slate-50/80 rounded-md"
                        style={{ gridTemplateColumns: '1.1fr 1.5fr 1.2fr 1.1fr 1fr 1fr 1fr 1.1fr auto' }}
                      >
                        <div>TYPE</div>
                        <div>ACTIVATION</div>
                        <div>PACKAGE</div>
                        <div className="text-center text-amber-700">STOCK</div>
                        <div className="text-center">DISCOUNT</div>
                        <div className="text-center">ORIGINAL PRICE</div>
                        <div className="text-center">RETAIL PRICE</div>
                        <div className="text-center">SELL PRICE</div>
                        <div className="w-6"></div>
                      </div>

                      {/* Rows matching Image-1 */}
                      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                        {stockPackages.map((pkg, idx) => {
                          const activationOpts = stockProduct.activation_options
                            ? stockProduct.activation_options.split(',').map(o => o.trim()).filter(Boolean)
                            : [];

                          return (
                            <div
                              key={idx}
                              className="grid gap-2 items-center bg-white p-2 border border-slate-200 hover:border-violet-300 rounded-lg shadow-2xs transition-colors"
                              style={{ gridTemplateColumns: '1.1fr 1.5fr 1.2fr 1.1fr 1fr 1fr 1fr 1.1fr auto' }}
                            >
                              {/* TYPE */}
                              <div>
                                <select
                                  value={pkg.activation_process || 'Manual'}
                                  onChange={(e) => {
                                    const updated = [...stockPackages];
                                    updated[idx].activation_process = e.target.value;
                                    setStockPackages(updated);
                                  }}
                                  className="w-full text-[11px] bg-slate-50 border border-slate-300 focus:border-violet-500 focus:bg-white focus:outline-none rounded-md px-2 py-1.5 text-slate-800 font-medium cursor-pointer"
                                >
                                  <option value="Manual">Manual</option>
                                  <option value="Automatic">Automatic</option>
                                </select>
                              </div>

                              {/* ACTIVATION */}
                              <div>
                                {activationOpts.length > 0 ? (
                                  <div className="relative">
                                    <input
                                      type="text"
                                      list={`stock-act-${idx}`}
                                      value={pkg.activation || ''}
                                      onChange={(e) => {
                                        const updated = [...stockPackages];
                                        updated[idx].activation = e.target.value;
                                        setStockPackages(updated);
                                      }}
                                      placeholder="e.g. Personal Mail -100p"
                                      className="w-full text-[11px] bg-slate-50 border border-slate-300 focus:border-violet-500 focus:bg-white focus:outline-none rounded-md px-2 py-1.5 text-slate-800 font-medium"
                                    />
                                    <datalist id={`stock-act-${idx}`}>
                                      {activationOpts.map((opt, oIdx) => (
                                        <option key={oIdx} value={opt} />
                                      ))}
                                      <option value="Personal Mail -100p" />
                                      <option value="Personal Mail -300p" />
                                      <option value="Readmade-100p" />
                                      <option value="Phone Activation" />
                                      <option value="Retail-Phone Activation" />
                                    </datalist>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={pkg.activation || ''}
                                    onChange={(e) => {
                                      const updated = [...stockPackages];
                                      updated[idx].activation = e.target.value;
                                      setStockPackages(updated);
                                    }}
                                    placeholder="e.g. Personal Mail -100p"
                                    className="w-full text-[11px] bg-slate-50 border border-slate-300 focus:border-violet-500 focus:bg-white focus:outline-none rounded-md px-2 py-1.5 text-slate-800 font-medium"
                                  />
                                )}
                              </div>

                              {/* PACKAGE */}
                              <div>
                                <input
                                  type="text"
                                  value={pkg.duration || ''}
                                  onChange={(e) => {
                                    const updated = [...stockPackages];
                                    updated[idx].duration = e.target.value;
                                    setStockPackages(updated);
                                  }}
                                  placeholder="e.g. 1 Month"
                                  className="w-full text-[11px] bg-slate-50 border border-slate-300 focus:border-violet-500 focus:bg-white focus:outline-none rounded-md px-2 py-1.5 text-slate-800 font-medium"
                                  required
                                />
                              </div>

                              {/* STOCK - Highlighted input with quick +/- buttons */}
                              <div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...stockPackages];
                                      const cur = parseInt(updated[idx].stock) || 0;
                                      updated[idx].stock = Math.max(0, cur - 1);
                                      setStockPackages(updated);
                                    }}
                                    className="w-5 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition-colors"
                                    title="Decrease stock by 1"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={pkg.stock !== undefined && pkg.stock !== null ? pkg.stock : 0}
                                    onChange={(e) => {
                                      const updated = [...stockPackages];
                                      updated[idx].stock = parseInt(e.target.value) || 0;
                                      setStockPackages(updated);
                                    }}
                                    className="w-full min-w-[36px] text-[11.5px] bg-amber-50/70 hover:bg-amber-50 focus:bg-white border-2 border-amber-300 focus:border-amber-500 focus:outline-none rounded px-1 py-1 text-slate-900 text-center font-black shadow-2xs"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...stockPackages];
                                      const cur = parseInt(updated[idx].stock) || 0;
                                      updated[idx].stock = cur + 1;
                                      setStockPackages(updated);
                                    }}
                                    className="w-5 h-6 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition-colors"
                                    title="Increase stock by 1"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* DISCOUNT */}
                              <div>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={pkg.discount || ''}
                                  onChange={(e) => {
                                    const updated = [...stockPackages];
                                    updated[idx].discount = e.target.value;
                                    setStockPackages(updated);
                                  }}
                                  placeholder="৳ Discount"
                                  className="w-full text-[11px] bg-slate-50 border border-slate-300 focus:border-violet-500 focus:bg-white focus:outline-none rounded-md px-1.5 py-1.5 text-slate-800 text-center font-medium"
                                />
                              </div>

                              {/* ORIGINAL PRICE */}
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pkg.original_price || ''}
                                  onChange={(e) => {
                                    const updated = [...stockPackages];
                                    updated[idx].original_price = e.target.value;
                                    setStockPackages(updated);
                                  }}
                                  placeholder="৳"
                                  className="w-full text-[11px] bg-slate-50 border border-slate-300 focus:border-violet-500 focus:bg-white focus:outline-none rounded-md px-1.5 py-1.5 text-slate-800 text-center font-medium"
                                />
                              </div>

                              {/* RETAIL PRICE */}
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pkg.retail_price || ''}
                                  onChange={(e) => {
                                    const updated = [...stockPackages];
                                    updated[idx].retail_price = e.target.value;
                                    setStockPackages(updated);
                                  }}
                                  placeholder="৳"
                                  className="w-full text-[11px] bg-slate-50 border border-slate-300 focus:border-violet-500 focus:bg-white focus:outline-none rounded-md px-1.5 py-1.5 text-slate-800 text-center font-medium"
                                />
                              </div>

                              {/* SELL PRICE */}
                              <div>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pkg.price || ''}
                                  onChange={(e) => {
                                    const updated = [...stockPackages];
                                    updated[idx].price = e.target.value;
                                    setStockPackages(updated);
                                  }}
                                  placeholder="৳ Price"
                                  className="w-full text-[11.5px] bg-slate-50 border border-slate-300 focus:border-violet-500 focus:bg-white focus:outline-none rounded-md px-1.5 py-1.5 text-slate-900 text-center font-black"
                                  required
                                />
                              </div>

                              {/* DELETE */}
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = stockPackages.filter((_, i) => i !== idx);
                                    setStockPackages(updated);
                                  }}
                                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Delete package option"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary & Actions Footer */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                    <span>Total Calculated Stock:</span>
                    <span className="text-emerald-700 underline decoration-2">
                      {stockPackages.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-violet-50 text-violet-800 border border-violet-200 px-2.5 py-1 rounded-lg font-bold">
                    <span>Min Sell Price:</span>
                    <span>
                      ৳{stockPackages.map(p => parseFloat(p.price)).filter(p => !isNaN(p) && p > 0).length > 0
                        ? Math.min(...stockPackages.map(p => parseFloat(p.price)).filter(p => !isNaN(p) && p > 0)).toFixed(2)
                        : (parseFloat(stockProduct.price) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    disabled={stockSubmitting}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stockSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-98"
                  >
                    {stockSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Stock...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Stock & Packages</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  License Rules / Instructions (Optional)
                </label>
                <textarea
                  rows="2"
                  value={licenseForm.rules}
                  onChange={(e) => setLicenseForm({ ...licenseForm, rules: e.target.value })}
                  placeholder="e.g. Do not change password. Valid for 1 device. Contact support if locked."
                  className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400"
                />
              </div>

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

      {showCouponModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-850 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</span>
              </h4>
              <button
                onClick={() => setShowCouponModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {couponFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg">
                {couponFormError}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-left">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE10, ELITE100"
                  className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-amber-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Discount Type
                  </label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-800 font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                    placeholder={couponForm.discount_type === 'percentage' ? '10 (for 10%)' : '100 (for ৳100)'}
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-amber-500 focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Min Order Amount (৳)
                  </label>
                  <input
                    type="number"
                    value={couponForm.min_order_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })}
                    placeholder="0"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Max Discount Limit (৳)
                  </label>
                  <input
                    type="number"
                    value={couponForm.max_discount_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })}
                    placeholder="Optional (e.g. 500)"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Usage Limit (Max Uses)
                  </label>
                  <input
                    type="number"
                    value={couponForm.usage_limit}
                    onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                    placeholder="Optional (e.g. 100)"
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={couponForm.expires_at}
                    onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-250 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-550 hover:bg-slate-50 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={couponFormSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  {couponFormSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</span>
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
