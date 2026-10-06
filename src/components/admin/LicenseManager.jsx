import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../utils/api';
import {
  ShieldCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  Copy,
  Eye,
  EyeOff,
  Clock,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Calendar,
  CreditCard,
  Building,
  User,
  X,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  MoreVertical,
  Mail,
  Key,
  Shield,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  FileText,
  UserPlus,
  HelpCircle,
  Hash,
  Store,
  Phone,
  MessageCircle,
  ScrollText
} from 'lucide-react';

export default function LicenseManager() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [vendorList, setVendorList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null); // null means new
  const [accountForm, setAccountForm] = useState({
    product_id: '',
    product_name: '',
    account_email: '',
    account_password: '',
    recovery_email: '',
    two_factor_status: 'Enabled',
    two_factor_key: '',
    total_slots: 5,
    status: 'Active',
    expiry_date: '',
    vendor_id: '',
    vendor_name: '',
    purchased_date: '',
    renewal_date: '',
    purchase_price: '',
    renewal_cost: '',
    payment_method: 'bKash',
    invoice_no: '',
    notes: ''
  });
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [accountProductSearch, setAccountProductSearch] = useState('');
  const [accountProductDropdownOpen, setAccountProductDropdownOpen] = useState(false);
  const accountProductRef = useRef(null);

  // Slot Assignment Modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({
    order_id: '',
    assigned_to: '',
    customer_name: '',
    customer_phone: '',
    start_date: '',
    end_date: '',
    status: 'Active',
    notes: ''
  });
  const [submittingSlot, setSubmittingSlot] = useState(false);
  const [orderLookupId, setOrderLookupId] = useState('');
  const [lookingUpOrder, setLookingUpOrder] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, prodRes, vendRes] = await Promise.all([
        api.get('/digital-licenses').catch((err) => {
          console.error('digital-licenses fetch error:', err);
          return [];
        }),
        api.get('/products').catch((err) => {
          console.error('products fetch error:', err);
          return [];
        }),
        api.get('/vendors').catch((err) => {
          console.error('vendors fetch error:', err);
          return [];
        })
      ]);

      const accData = Array.isArray(accRes) ? accRes : (accRes?.data || []);
      const prodData = Array.isArray(prodRes) ? prodRes : (prodRes?.data || prodRes?.products || []);
      const vendData = Array.isArray(vendRes) ? vendRes : (vendRes?.data || []);

      setAccounts(accData);
      setCatalogProducts(prodData);
      setVendorList(vendData);

      // If no account selected yet, select the first one
      if (accData.length > 0) {
        setSelectedAccountId(prev => (prev && accData.some(a => a.id === prev) ? prev : accData[0].id));
      }
    } catch (err) {
      console.error('Failed to load license manager data:', err);
      toast.error('Failed to load accounts and licenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Products available for combo list - prioritized from products table
  const productOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. All products from the database products table
    if (Array.isArray(catalogProducts)) {
      catalogProducts.forEach((p) => {
        if (p && p.name && !seen.has(p.name)) {
          seen.add(p.name);
          const count = accounts.filter(
            (a) => a.product_name === p.name || (p.id && a.product_id === p.id)
          ).length;
          list.push({
            id: p.id,
            name: p.name,
            category: p.category_name || '',
            count
          });
        }
      });
    }

    // 2. Any additional product names that exist in accounts
    if (Array.isArray(accounts)) {
      accounts.forEach((a) => {
        if (a && a.product_name && !seen.has(a.product_name)) {
          seen.add(a.product_name);
          const count = accounts.filter((acc) => acc.product_name === a.product_name).length;
          list.push({
            id: a.product_id || null,
            name: a.product_name,
            category: 'License Account',
            count
          });
        }
      });
    }

    return list;
  }, [catalogProducts, accounts]);

  const filteredModalProductOptions = useMemo(() => {
    const q = (accountProductSearch || '').trim().toLowerCase();
    if (!q) return productOptions;
    return productOptions.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  }, [productOptions, accountProductSearch]);

  const handleSelectAccountProduct = (item) => {
    setAccountForm(prev => ({
      ...prev,
      product_name: item.name,
      product_id: item.id || ''
    }));
    setAccountProductSearch(item.name);
    setAccountProductDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountProductRef.current && !accountProductRef.current.contains(e.target)) {
        setAccountProductDropdownOpen(false);
        if (accountForm.product_name) {
          setAccountProductSearch(accountForm.product_name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountForm.product_name]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchProd = selectedProduct === 'all' || acc.product_name === selectedProduct;
      const matchStatus = statusFilter === 'all' || acc.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (acc.account_email && acc.account_email.toLowerCase().includes(q)) ||
        (acc.product_name && acc.product_name.toLowerCase().includes(q)) ||
        (acc.vendor_name && acc.vendor_name.toLowerCase().includes(q)) ||
        (acc.invoice_no && acc.invoice_no.toLowerCase().includes(q)) ||
        (acc.slots && acc.slots.some(s =>
          (s.assigned_to && s.assigned_to.toLowerCase().includes(q)) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q))
        ));
      return matchProd && matchStatus && matchSearch;
    });
  }, [accounts, selectedProduct, statusFilter, searchQuery]);

  // Pagination slice
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage) || 1;
  const displayedAccounts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(start, start + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  // Currently selected account for Right Details Panel
  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return filteredAccounts[0] || accounts[0] || null;
    return accounts.find(a => a.id === selectedAccountId) || filteredAccounts[0] || accounts[0] || null;
  }, [accounts, selectedAccountId, filteredAccounts]);

  // Current vendor details matched from database vendors table for Right Details Panel
  const currentVendor = useMemo(() => {
    if (!selectedAccount) return null;
    return (
      vendorList.find(v => selectedAccount.vendor_id && v.id === selectedAccount.vendor_id) ||
      vendorList.find(v => v.name && selectedAccount.vendor_name && v.name.toLowerCase() === selectedAccount.vendor_name.toLowerCase()) ||
      vendorList.find(v => v.company_name && selectedAccount.vendor_name && v.company_name.toLowerCase() === selectedAccount.vendor_name.toLowerCase()) ||
      null
    );
  }, [selectedAccount, vendorList]);

  // Top 5 Stats based on current product filter
  const stats = useMemo(() => {
    const targetAccounts = selectedProduct === 'all'
      ? accounts
      : accounts.filter(a => a.product_name === selectedProduct);

    const totalAccounts = targetAccounts.length;
    let totalSlots = 0;
    let usedSlots = 0;
    let expiringSoon = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    targetAccounts.forEach(acc => {
      totalSlots += parseInt(acc.total_slots, 10) || 0;
      if (acc.slots && Array.isArray(acc.slots)) {
        usedSlots += acc.slots.filter(s => s.status === 'Active').length;
      } else {
        usedSlots += parseInt(acc.used_slots, 10) || 0;
      }

      if (acc.status === 'Expiring') {
        expiringSoon++;
      } else if (acc.expiry_date) {
        const exp = new Date(acc.expiry_date);
        exp.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 30) {
          expiringSoon++;
        }
      }
    });

    const availableSlots = Math.max(0, totalSlots - usedSlots);

    return {
      totalAccounts,
      totalSlots,
      usedSlots,
      availableSlots,
      expiringSoon
    };
  }, [accounts, selectedProduct]);

  // Renewal alerts accounts
  const renewalAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return accounts
      .filter(acc => {
        let isAlert = false;
        let daysLeft = null;
        if (acc.expiry_date) {
          const exp = new Date(acc.expiry_date);
          exp.setHours(0, 0, 0, 0);
          daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft >= 0 && daysLeft <= 30) {
            isAlert = true;
          }
        }
        if (acc.status === 'Expiring' || acc.available_slots === 0) {
          isAlert = true;
        }
        return isAlert;
      })
      .map(acc => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let daysLeft = null;
        if (acc.expiry_date) {
          const exp = new Date(acc.expiry_date);
          exp.setHours(0, 0, 0, 0);
          daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
        return {
          ...acc,
          daysLeft
        };
      })
      .slice(0, 4);
  }, [accounts]);

  // Helper copy text
  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Copy product usage rules for customer sending
  const handleCopyProductRules = async (productId, productName) => {
    try {
      let targetId = productId;
      if (!targetId && catalogProducts.length > 0) {
        const matched = catalogProducts.find(p => p.name === productName);
        if (matched) targetId = matched.id;
      }

      if (!targetId) {
        toast.error(`Please link a catalog product first.`);
        return;
      }

      const res = await api.get(`/product-usage-rules/by-product/${targetId}`);
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (list.length > 0 && list[0].rules_text) {
        navigator.clipboard.writeText(list[0].rules_text);
        toast.success(`✓ Usage rules for "${productName}" copied! Ready to paste & send.`);
      } else {
        toast.error(`No usage rules saved for "${productName}" yet. Create them in Product Usages Rules menu.`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not fetch usage rules.');
    }
  };

  // Toggle reveal password
  const togglePasswordReveal = (id) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Auto-load vendor details when selecting vendor from dropdown in modal
  const handleVendorSelect = (vendorName) => {
    if (!vendorName) {
      setAccountForm(prev => ({
        ...prev,
        vendor_id: '',
        vendor_name: ''
      }));
      return;
    }

    if (vendorName === '__custom__') {
      setAccountForm(prev => ({
        ...prev,
        vendor_id: '',
        vendor_name: ''
      }));
      return;
    }

    const vendor = vendorList.find(
      v => v.name === vendorName || (v.company_name && v.company_name === vendorName) || String(v.id) === String(vendorName)
    );

    if (vendor) {
      // Auto-detect payment method from vendor's payment_details
      let paymentMethod = accountForm.payment_method || 'bKash';
      const pd = (vendor.payment_details || '').toLowerCase();
      if (pd.includes('bkash')) paymentMethod = 'bKash';
      else if (pd.includes('nagad')) paymentMethod = 'Nagad';
      else if (pd.includes('rocket')) paymentMethod = 'Rocket';
      else if (pd.includes('bank') || pd.includes('transfer')) paymentMethod = 'Bank Transfer';
      else if (pd.includes('card') || pd.includes('visa') || pd.includes('master')) paymentMethod = 'Card';
      else if (pd.includes('cash')) paymentMethod = 'Cash';

      setAccountForm(prev => ({
        ...prev,
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        payment_method: paymentMethod
      }));
      toast.success(`Vendor details loaded for "${vendor.name}"`);
    } else {
      setAccountForm(prev => ({
        ...prev,
        vendor_id: '',
        vendor_name: vendorName
      }));
    }
  };

  // Selected vendor details in the modal
  const selectedVendorDetails = useMemo(() => {
    if (!accountForm.vendor_name && !accountForm.vendor_id) return null;
    return (
      vendorList.find(v => accountForm.vendor_id && v.id === accountForm.vendor_id) ||
      vendorList.find(v => v.name && v.name.toLowerCase() === (accountForm.vendor_name || '').toLowerCase()) ||
      vendorList.find(v => v.company_name && v.company_name.toLowerCase() === (accountForm.vendor_name || '').toLowerCase()) ||
      null
    );
  }, [accountForm.vendor_name, accountForm.vendor_id, vendorList]);

  // Open modal to Add Account
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    const defaultVendor = vendorList[0] || null;
    let paymentMethod = 'bKash';
    if (defaultVendor?.payment_details) {
      const pd = defaultVendor.payment_details.toLowerCase();
      if (pd.includes('bkash')) paymentMethod = 'bKash';
      else if (pd.includes('nagad')) paymentMethod = 'Nagad';
      else if (pd.includes('rocket')) paymentMethod = 'Rocket';
      else if (pd.includes('bank')) paymentMethod = 'Bank Transfer';
    }

    setAccountForm({
      product_id: '',
      product_name: '',
      account_email: '',
      account_password: '',
      recovery_email: '',
      two_factor_status: 'Enabled',
      two_factor_key: '',
      total_slots: 5,
      status: 'Active',
      expiry_date: '',
      vendor_id: defaultVendor ? defaultVendor.id : '',
      vendor_name: defaultVendor ? defaultVendor.name : '',
      purchased_date: new Date().toISOString().split('T')[0],
      renewal_date: '',
      purchase_price: '',
      renewal_cost: '',
      payment_method: paymentMethod,
      invoice_no: '',
      notes: ''
    });
    setAccountProductSearch('');
    setAccountProductDropdownOpen(false);
    setShowAccountModal(true);
  };

  // Open modal to Edit Account
  const handleOpenEditAccount = (acc) => {
    setEditingAccount(acc);
    setAccountForm({
      product_id: acc.product_id || '',
      product_name: acc.product_name || '',
      account_email: acc.account_email || '',
      account_password: acc.account_password || '',
      recovery_email: acc.recovery_email || '',
      two_factor_status: acc.two_factor_status || 'Enabled',
      two_factor_key: acc.two_factor_key || '',
      total_slots: acc.total_slots || 5,
      status: acc.status || 'Active',
      expiry_date: acc.expiry_date ? acc.expiry_date.split('T')[0] : '',
      vendor_id: acc.vendor_id || '',
      vendor_name: acc.vendor_name || '',
      purchased_date: acc.purchased_date ? acc.purchased_date.split('T')[0] : '',
      renewal_date: acc.renewal_date ? acc.renewal_date.split('T')[0] : '',
      purchase_price: acc.purchase_price || '',
      renewal_cost: acc.renewal_cost || '',
      payment_method: acc.payment_method || 'bKash',
      invoice_no: acc.invoice_no || '',
      notes: acc.notes || ''
    });
    setAccountProductSearch(acc.product_name || '');
    setAccountProductDropdownOpen(false);
    setShowAccountModal(true);
  };

  // Save account (create or update)
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.account_email || !accountForm.product_name) {
      toast.error('Please select a catalog product and enter account email.');
      return;
    }

    try {
      setSubmittingAccount(true);
      if (editingAccount) {
        await api.put(`/digital-licenses/${editingAccount.id}`, accountForm);
        toast.success('Account updated successfully!');
      } else {
        const res = await api.post('/digital-licenses', accountForm);
        toast.success('Account created successfully with slots!');
        if (res.data?.accountId) {
          setSelectedAccountId(res.data.accountId);
        }
      }
      setShowAccountModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save account.');
    } finally {
      setSubmittingAccount(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this digital license account? All slots will be removed.')) {
      return;
    }
    try {
      await api.delete(`/digital-licenses/${id}`);
      toast.success('Account deleted successfully!');
      if (selectedAccountId === id) {
        setSelectedAccountId(null);
      }
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete account.');
    }
  };

  // Fetch recent orders for quick auto-fill in slot modal
  const fetchRecentOrders = async () => {
    try {
      const res = await api.get('/digital-licenses/orders/recent');
      const list = Array.isArray(res) ? res : (res?.data || []);
      setRecentOrders(list);
    } catch (err) {
      console.error('Failed to fetch recent orders:', err);
    }
  };

  // Lookup Order by ID to auto-fill customer info
  const handleLookupOrder = async (orderIdToSearch) => {
    const raw = orderIdToSearch !== undefined ? orderIdToSearch : orderLookupId;
    if (!raw) {
      toast.error('Please enter an Order ID.');
      return;
    }
    const cleanId = raw.toString().replace(/[^0-9]/g, '').trim();
    if (!cleanId) {
      toast.error('Please enter a valid numeric Order ID.');
      return;
    }

    try {
      setLookingUpOrder(true);
      const res = await api.get(`/digital-licenses/order-lookup/${cleanId}`);
      if (res && res.order_id) {
        setSlotForm(prev => ({
          ...prev,
          order_id: res.order_id,
          assigned_to: res.customer_email || prev.assigned_to,
          customer_name: res.customer_name || prev.customer_name,
          customer_phone: res.customer_phone || prev.customer_phone,
          notes: prev.notes && !prev.notes.includes(`Order #${res.order_id}`)
            ? `${prev.notes} | Order #${res.order_id}`
            : `Order #${res.order_id} (${res.product_summary || 'Digital License'})`
        }));
        setOrderLookupId(String(res.order_id));
        toast.success(`✓ Order #${res.order_id} customer details loaded!`);
      } else {
        toast.error(`Order #${cleanId} not found.`);
      }
    } catch (err) {
      console.error('Order lookup error:', err);
      toast.error(err.message || `Order #${cleanId} not found.`);
    } finally {
      setLookingUpOrder(false);
    }
  };

  // Open modal to Assign / Edit slot
  const handleOpenAssignSlot = (slot) => {
    setSelectedSlot(slot);
    setOrderLookupId(slot.order_id ? String(slot.order_id) : '');
    setSlotForm({
      order_id: slot.order_id || '',
      assigned_to: slot.assigned_to || '',
      customer_name: slot.customer_name || '',
      customer_phone: slot.customer_phone || '',
      start_date: slot.start_date ? slot.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: slot.end_date ? slot.end_date.split('T')[0] : (selectedAccount?.expiry_date ? selectedAccount.expiry_date.split('T')[0] : ''),
      status: slot.status || 'Active',
      notes: slot.notes || ''
    });
    setShowSlotModal(true);
    fetchRecentOrders();
  };

  // Save slot assignment
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!selectedAccount || !selectedSlot) return;

    try {
      setSubmittingSlot(true);
      await api.put(`/digital-licenses/${selectedAccount.id}/slots/${selectedSlot.id}`, {
        ...slotForm,
        order_id: slotForm.order_id ? parseInt(slotForm.order_id, 10) : null,
        status: slotForm.assigned_to ? (slotForm.status || 'Active') : 'Available'
      });
      toast.success(`Slot #${selectedSlot.slot_number} assigned successfully!`);
      setShowSlotModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign slot.');
    } finally {
      setSubmittingSlot(false);
    }
  };

  // Unassign slot
  const handleUnassignSlot = async (slot) => {
    if (!window.confirm(`Unassign user from Slot #${slot.slot_number}? This will make the slot Available.`)) {
      return;
    }
    try {
      await api.delete(`/digital-licenses/${selectedAccount.id}/slots/${slot.id}`);
      toast.success(`Slot #${slot.slot_number} is now Available.`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to unassign slot.');
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left min-w-0 w-full max-w-full pb-10">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* 1. Products Combo List */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 px-3">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Selected Product
          </label>
          <div className="relative">
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer min-w-[180px]"
            >
              <option value="all">🌐 All Products ({accounts.length})</option>
              {productOptions.map((item) => (
                <option key={item.name} value={item.name}>
                  📦 {item.name} {item.count > 0 ? `(${item.count})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Top 5 Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Total Accounts */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Total Accounts</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{stats.totalAccounts}</h3>
          </div>
        </div>

        {/* Total Slots */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Total Slots</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{stats.totalSlots}</h3>
          </div>
        </div>

        {/* Used */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Used</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{stats.usedSlots}</h3>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Available</p>
            <h3 className="text-xl sm:text-2xl font-black text-cyan-600 mt-0.5">{stats.availableSlots}</h3>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-2xs col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Expiring Soon</p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5">{stats.expiringSoon}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Accounts Overview & Renewal Alerts) & Right (Account Details 4, 5, 6) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column (xl:col-span-7) */}
        <div className="xl:col-span-7 space-y-4">
          {/* Accounts Overview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
            {/* Header, Search & + Add Account */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800">
                Accounts Overview
              </h2>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* 3. + Add Account Button */}
                <button
                  type="button"
                  onClick={handleOpenAddAccount}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  Add Account
                </button>
              </div>
            </div>

            {/* 2. Accounts Overview Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10.5px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-2 text-center">Slots</th>
                    <th className="py-2.5 px-2 text-center">Used</th>
                    <th className="py-2.5 px-2 text-center">Left</th>
                    <th className="py-2.5 px-2.5">Expiry</th>
                    <th className="py-2.5 px-2.5">Vendor</th>
                    <th className="py-2.5 px-2.5">Status</th>
                    <th className="py-2.5 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading accounts...
                      </td>
                    </tr>
                  ) : displayedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No accounts found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedAccounts.map((acc) => {
                      const isSelected = selectedAccount?.id === acc.id;
                      return (
                        <tr
                          key={acc.id}
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={`cursor-pointer transition-colors ${isSelected
                            ? 'bg-blue-50/70 border-l-4 border-l-blue-600 font-semibold text-slate-900'
                            : 'hover:bg-slate-50/80 text-slate-700'
                            }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="truncate max-w-[160px] sm:max-w-[190px] text-blue-700 font-bold hover:underline" title={acc.account_email}>
                              {acc.account_email}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal truncate">
                              {acc.product_name}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700">
                            {acc.total_slots}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-emerald-600">
                            {acc.used_slots || 0}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-cyan-600">
                            {acc.available_slots || 0}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap text-[11px]">
                            {formatDate(acc.expiry_date)}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap text-[11px] truncate max-w-[90px]">
                            {acc.vendor_name || 'Vendor A'}
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            {acc.status === 'Active' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            )}
                            {acc.status === 'Expiring' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Expiring
                              </span>
                            )}
                            {acc.status === 'Expired' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Expired
                              </span>
                            )}
                            {acc.status === 'Inactive' && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActionMenuOpen(actionMenuOpen === acc.id ? null : acc.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Action Menu */}
                            {actionMenuOpen === acc.id && (
                              <div className="absolute right-2 top-8 z-30 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-left text-xs animate-in fade-in zoom-in-95">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenEditAccount(acc);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                  Edit Account
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteAccount(acc.id);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
              <span className="text-[11px]">
                Showing {filteredAccounts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} of {filteredAccounts.length} accounts
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[11px]">
                  {currentPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Renewal Alerts Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-rose-500 fill-rose-500" />
                Renewal Alerts
              </h3>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Expiring' ? 'all' : 'Expiring')}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {statusFilter === 'Expiring' ? 'Show All' : 'View All Expiring'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {renewalAlerts.length === 0 ? (
                <div className="sm:col-span-3 text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  ✅ No urgent renewal alerts at this time.
                </div>
              ) : (
                renewalAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAccountId(alert.id)}
                    className="p-2.5 rounded-lg border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{alert.product_name}</p>
                      <p className="text-[10px] text-amber-700 truncate mt-0.5">
                        {alert.account_email} {alert.daysLeft !== null ? `expires in ${alert.daysLeft} days` : '0 slots remaining'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Account Details (xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-3.5">
          {selectedAccount ? (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
              {/* Header with Edit Button */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-800">
                  Account Details
                </h2>
                <button
                  type="button"
                  onClick={() => handleOpenEditAccount(selectedAccount)}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>

              {/* 5. Card 1: Account Information */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  1. Account Information
                </h3>

                <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 space-y-2 text-xs">
                  {/* Product */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">Product</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="p-1 rounded bg-white border border-slate-200 text-blue-600">
                          <Layers className="w-3 h-3" />
                        </span>
                        {selectedAccount.product_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyProductRules(selectedAccount.product_id, selectedAccount.product_name)}
                        className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer ml-1"
                        title="Copy customer usage rules for this product"
                      >
                        <ScrollText className="w-3 h-3 text-blue-600" />
                        <span>Rules</span>
                      </button>
                    </div>
                  </div>

                  {/* Account Email */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">Account Email</span>
                    <div className="flex items-center gap-1 font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5">
                      <span className="truncate max-w-[190px]">{selectedAccount.account_email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedAccount.account_email, 'Email')}
                        className="text-slate-400 hover:text-slate-700 ml-1"
                        title="Copy Email"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">Password</span>
                    <div className="flex items-center gap-1 font-mono text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5">
                      <span>
                        {revealedPasswords[selectedAccount.id]
                          ? selectedAccount.account_password
                          : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordReveal(selectedAccount.id)}
                        className="text-slate-400 hover:text-slate-700 ml-1.5"
                        title={revealedPasswords[selectedAccount.id] ? 'Hide' : 'Reveal'}
                      >
                        {revealedPasswords[selectedAccount.id] ? (
                          <EyeOff className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedAccount.account_password, 'Password')}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy Password"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Recovery Email */}
                  {selectedAccount.recovery_email && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">Recovery Email</span>
                      <div className="flex items-center gap-1 text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5">
                        <span className="truncate max-w-[190px]">{selectedAccount.recovery_email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedAccount.recovery_email, 'Recovery Email')}
                          className="text-slate-400 hover:text-slate-700 ml-1"
                          title="Copy Recovery Email"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2FA & Status */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                    <span className="text-slate-500 font-medium">2FA</span>
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${selectedAccount.two_factor_status === 'Enabled'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                      {selectedAccount.two_factor_status || 'Enabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${selectedAccount.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedAccount.status === 'Expiring'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                      {selectedAccount.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Card 2: License / Slot Information */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    2. License / Slot Information
                  </h3>
                </div>

                {/* 3 Sub-stat Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase font-bold text-purple-600">Total Slots</p>
                    <p className="text-base font-black text-purple-700 mt-0.5">{selectedAccount.total_slots}</p>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-600">Used</p>
                    <p className="text-base font-black text-emerald-700 mt-0.5">{selectedAccount.used_slots || 0}</p>
                  </div>
                  <div className="bg-cyan-50/60 border border-cyan-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase font-bold text-cyan-600">Available</p>
                    <p className="text-base font-black text-cyan-700 mt-0.5">{selectedAccount.available_slots || 0}</p>
                  </div>
                </div>

                {/* Seat Assignments Table */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Seat Assignments</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Click a slot to assign or edit
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase">
                        <tr>
                          <th className="py-2 px-2.5">Slot</th>
                          <th className="py-2 px-2">Assigned To</th>
                          <th className="py-2 px-2">Customer</th>
                          <th className="py-2 px-2">Start</th>
                          <th className="py-2 px-2">End</th>
                          <th className="py-2 px-2 text-center">Status</th>
                          <th className="py-2 px-1 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!selectedAccount.slots || selectedAccount.slots.length === 0) ? (
                          <tr>
                            <td colSpan="7" className="py-6 text-center text-slate-400 text-xs">
                              No slot records found for this account.
                            </td>
                          </tr>
                        ) : (
                          selectedAccount.slots.map((slot) => {
                            const isAssigned = slot.status === 'Active' && slot.assigned_to;
                            return (
                              <tr
                                key={slot.id}
                                className={`transition-colors ${isAssigned ? 'hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-50'}`}
                              >
                                <td className="py-2 px-2.5 font-bold text-slate-700">
                                  #{slot.slot_number}
                                </td>
                                <td className="py-2 px-2 max-w-[125px]" title={slot.assigned_to || ''}>
                                  {slot.assigned_to ? (
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-800 truncate">{slot.assigned_to}</span>
                                      {slot.order_id && (
                                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-blue-600">
                                          <Hash className="w-2.5 h-2.5" />
                                          Order #{slot.order_id}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 truncate max-w-[95px]" title={slot.customer_name || ''}>
                                  {slot.customer_name || '—'}
                                </td>
                                <td className="py-2 px-2 text-[10.5px] text-slate-500 whitespace-nowrap">
                                  {formatDate(slot.start_date)}
                                </td>
                                <td className="py-2 px-2 text-[10.5px] text-slate-500 whitespace-nowrap">
                                  {formatDate(slot.end_date)}
                                </td>
                                <td className="py-2 px-2 text-center whitespace-nowrap">
                                  {isAssigned ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                      Available
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-1 text-center whitespace-nowrap">
                                  {isAssigned ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAssignSlot(slot)}
                                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                        title="Edit Slot"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUnassignSlot(slot)}
                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        title="Unassign"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAssignSlot(slot)}
                                      className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10.5px] font-bold border border-blue-200 cursor-pointer"
                                    >
                                      Assign
                                    </button>
                                  )}
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

              {/* 4. Card 3: Purchase & Vendor Information */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    3. Purchase &amp; Vendor Information
                  </h3>
                  {currentVendor && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Store className="w-3 h-3 text-emerald-600" />
                      Auto-loaded from Vendor DB
                    </span>
                  )}
                </div>

                <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 text-xs grid grid-cols-2 gap-y-2.5 gap-x-4">
                  {/* Vendor Name & Company */}
                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Vendor / Supplier</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-purple-600" />
                      {selectedAccount.vendor_name || '—'}
                    </span>
                    {currentVendor?.company_name && currentVendor.company_name !== selectedAccount.vendor_name && (
                      <span className="text-[10.5px] text-slate-500 block mt-0.5">
                        {currentVendor.company_name}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Renewal Date</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{formatDate(selectedAccount.renewal_date)}</span>
                  </div>

                  {/* Vendor Contact (Phone, WhatsApp, Email) if vendor exists in DB */}
                  {currentVendor && (currentVendor.phone || currentVendor.whatsapp || currentVendor.email) && (
                    <div className="col-span-2 p-2 bg-white rounded-lg border border-slate-200/90 flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="font-bold text-slate-700">Contact:</span>
                      {currentVendor.phone && (
                        <a href={`tel:${currentVendor.phone}`} className="text-purple-600 hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{currentVendor.phone}</span>
                        </a>
                      )}
                      {currentVendor.whatsapp && (
                        <a
                          href={`https://wa.me/${currentVendor.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WA: {currentVendor.whatsapp}</span>
                        </a>
                      )}
                      {currentVendor.email && (
                        <a href={`mailto:${currentVendor.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{currentVendor.email}</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Purchased Date</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{formatDate(selectedAccount.purchased_date)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Expiry Date</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{formatDate(selectedAccount.expiry_date)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Purchase Price</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      ৳{parseFloat(selectedAccount.purchase_price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Payment Method</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">{selectedAccount.payment_method || 'bKash'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Renewal Cost</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      ৳{parseFloat(selectedAccount.renewal_cost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10.5px]">Invoice No.</span>
                    <span className="font-mono text-slate-700 font-semibold mt-0.5 block">{selectedAccount.invoice_no || '—'}</span>
                  </div>

                  {/* Vendor Payment Details from DB */}
                  {currentVendor?.payment_details && (
                    <div className="col-span-2 p-2 bg-purple-50/70 border border-purple-100 rounded-lg text-[11px] text-purple-900 font-mono">
                      <span className="font-bold font-sans text-purple-700 block text-[10px] uppercase">Vendor Payment Info (from DB):</span>
                      {currentVendor.payment_details}
                    </div>
                  )}

                  {selectedAccount.notes && (
                    <div className="col-span-2 pt-1 border-t border-slate-200">
                      <span className="text-slate-500 block text-[10.5px]">Notes</span>
                      <p className="text-slate-700 text-[11px] whitespace-pre-wrap">{selectedAccount.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              Select an account from the table to view its full details.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Digital Account Modal */}
      {showAccountModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-xs overflow-y-auto p-3 sm:p-6"
          onClick={() => setShowAccountModal(false)}
        >
          <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl xl:max-w-6xl overflow-hidden flex flex-col text-left space-y-0 my-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {editingAccount ? 'Edit Digital License Account' : 'Add New Digital License Account'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure license credentials, 5-grid slot details, and supplier purchase records
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content - 5 Grid on Desktop */}
              <form onSubmit={handleSaveAccount} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[82vh]">
                {/* 1. PRODUCT & STATUS - 5 Grid */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Product Catalog & Status (5 Grids)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Col 1-2: Product Catalog */}
                    <div ref={accountProductRef} className="lg:col-span-2 relative">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Product Catalog <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required
                          value={accountProductDropdownOpen ? accountProductSearch : (accountForm.product_name || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccountProductSearch(val);
                            const matched = catalogProducts.find(p => p.name?.toLowerCase() === val.toLowerCase()) ||
                              productOptions.find(p => p.name?.toLowerCase() === val.toLowerCase());
                            setAccountForm(prev => ({
                              ...prev,
                              product_name: val,
                              product_id: matched ? matched.id : ''
                            }));
                            if (!accountProductDropdownOpen) setAccountProductDropdownOpen(true);
                          }}
                          onFocus={() => {
                            setAccountProductSearch(accountForm.product_name || '');
                            setAccountProductDropdownOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (filteredModalProductOptions.length > 0) {
                                handleSelectAccountProduct(filteredModalProductOptions[0]);
                              } else if (accountProductSearch.trim()) {
                                const val = accountProductSearch.trim();
                                const matched = catalogProducts.find(p => p.name?.toLowerCase() === val.toLowerCase()) ||
                                  productOptions.find(p => p.name?.toLowerCase() === val.toLowerCase());
                                setAccountForm(prev => ({
                                  ...prev,
                                  product_name: val,
                                  product_id: matched ? matched.id : ''
                                }));
                                setAccountProductDropdownOpen(false);
                              }
                            } else if (e.key === 'Escape') {
                              setAccountProductDropdownOpen(false);
                              setAccountProductSearch(accountForm.product_name || '');
                            }
                          }}
                          placeholder="Type to search catalog product..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-16 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
                        />

                        {/* Controls inside input */}
                        <div className="absolute right-2 flex items-center gap-1">
                          {(accountProductSearch || accountForm.product_name) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAccountForm(prev => ({ ...prev, product_name: '', product_id: '' }));
                                setAccountProductSearch('');
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Clear product"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (!accountProductDropdownOpen) {
                                setAccountProductSearch(accountForm.product_name || '');
                              }
                              setAccountProductDropdownOpen(prev => !prev);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                            title="Toggle products list"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${accountProductDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      {accountProductDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                          <div className="px-3 py-1.5 text-[9.5px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <span>Catalog Products ({filteredModalProductOptions.length})</span>
                            <span className="text-[9px] text-slate-400 font-normal">Type to filter</span>
                          </div>
                          <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                            {filteredModalProductOptions.map((item) => {
                              const isSelected = accountForm.product_name?.toLowerCase() === item.name.toLowerCase();
                              return (
                                <div
                                  key={item.name}
                                  onClick={() => handleSelectAccountProduct(item)}
                                  className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-blue-50 text-blue-700 font-bold'
                                      : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="truncate font-bold text-slate-800 text-[11.5px]" title={item.name}>
                                      {item.name}
                                    </span>
                                    {item.category && (
                                      <span className="text-[9.5px] text-slate-400 font-medium">
                                        {item.category}
                                      </span>
                                    )}
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                </div>
                              );
                            })}

                            {filteredModalProductOptions.length === 0 && (
                              <div className="px-3 py-4 text-xs text-slate-400 text-center italic">
                                No products found matching "{accountProductSearch}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Col 3: Total Slots */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Total Slots
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={accountForm.total_slots}
                        onChange={(e) => setAccountForm({ ...accountForm, total_slots: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-colors"
                      />
                    </div>

                    {/* Col 4: Account Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Account Status
                      </label>
                      <select
                        value={accountForm.status}
                        onChange={(e) => setAccountForm({ ...accountForm, status: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <option value="Active">🟢 Active</option>
                        <option value="Expiring">🟠 Expiring</option>
                        <option value="Expired">🔴 Expired</option>
                        <option value="Inactive">⚪ Inactive</option>
                      </select>
                    </div>

                    {/* Col 5: Expiry Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={accountForm.expiry_date}
                        onChange={(e) => setAccountForm({ ...accountForm, expiry_date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ACCOUNT CREDENTIALS & SECURITY - 5 Grid */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    <Key className="w-3.5 h-3.5 text-purple-600" />
                    <span>2. Account Credentials & Security (5 Grids)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Col 1: Account Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Account Email / Login <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={accountForm.account_email}
                        onChange={(e) => setAccountForm({ ...accountForm, account_email: e.target.value })}
                        placeholder="e.g. office01@email.com"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        required
                      />
                    </div>

                    {/* Col 2: Password with Reveal */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Account Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showModalPassword ? 'text' : 'password'}
                          value={accountForm.account_password}
                          onChange={(e) => setAccountForm({ ...accountForm, account_password: e.target.value })}
                          placeholder="Password"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowModalPassword(!showModalPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={showModalPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Col 3: Recovery Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Recovery Email / Phone
                      </label>
                      <input
                        type="text"
                        value={accountForm.recovery_email}
                        onChange={(e) => setAccountForm({ ...accountForm, recovery_email: e.target.value })}
                        placeholder="e.g. recovery@email.com"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    {/* Col 4: 2FA Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        2FA Status
                      </label>
                      <select
                        value={accountForm.two_factor_status}
                        onChange={(e) => setAccountForm({ ...accountForm, two_factor_status: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <option value="Enabled">Enabled</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    </div>

                    {/* Col 5: 2FA Secret Key / Backup */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        2FA Key / Backup Code
                      </label>
                      <input
                        type="text"
                        value={accountForm.two_factor_key || ''}
                        onChange={(e) => setAccountForm({ ...accountForm, two_factor_key: e.target.value })}
                        placeholder="e.g. JBSWY3DPEHPK3PXP"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. PURCHASE & VENDOR INFORMATION - 5 Grid */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    <Building className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Purchase & Vendor Information (5 Grids)</span>
                  </div>

                  {/* Row 1 of Vendor Info - 5 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Col 1: Vendor Name (Dropdown from vendors table + Custom option) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Vendor / Supplier <span className="text-rose-500">*</span>
                        </label>
                        {vendorList.length > 0 && (
                          <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                            Auto DB
                          </span>
                        )}
                      </div>
                      <select
                        value={accountForm.vendor_name}
                        onChange={(e) => handleVendorSelect(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <option value="">Select Vendor from Database...</option>
                        {vendorList.map((v) => (
                          <option key={v.id} value={v.name}>
                            🏪 {v.name} {v.company_name && v.company_name !== v.name ? `(${v.company_name})` : ''}
                          </option>
                        ))}
                        <option value="__custom__">➕ Custom / Other Vendor</option>
                      </select>

                      {/* If custom vendor selected or user wants to type a custom name */}
                      {(accountForm.vendor_name === '__custom__' || (!vendorList.some(v => v.name === accountForm.vendor_name) && accountForm.vendor_name)) && (
                        <input
                          type="text"
                          value={accountForm.vendor_name === '__custom__' ? '' : accountForm.vendor_name}
                          onChange={(e) => setAccountForm({ ...accountForm, vendor_name: e.target.value, vendor_id: '' })}
                          placeholder="Type custom vendor name..."
                          className="w-full mt-1.5 bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium transition-colors"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* Col 2: Purchased Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Purchased Date
                      </label>
                      <input
                        type="date"
                        value={accountForm.purchased_date}
                        onChange={(e) => setAccountForm({ ...accountForm, purchased_date: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    {/* Col 3: Renewal Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Renewal Date
                      </label>
                      <input
                        type="date"
                        value={accountForm.renewal_date}
                        onChange={(e) => setAccountForm({ ...accountForm, renewal_date: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    {/* Col 4: Purchase Price */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Purchase Price (৳)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={accountForm.purchase_price}
                        onChange={(e) => setAccountForm({ ...accountForm, purchase_price: e.target.value })}
                        placeholder="4500"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-colors"
                      />
                    </div>

                    {/* Col 5: Renewal Cost */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Renewal Cost (৳)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={accountForm.renewal_cost}
                        onChange={(e) => setAccountForm({ ...accountForm, renewal_cost: e.target.value })}
                        placeholder="4500"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-colors"
                      />
                    </div>
                  </div>

                  {/* Auto-loaded Vendor Quick Details Banner in Modal */}
                  {selectedVendorDetails && (
                    <div className="p-2.5 px-3 bg-gradient-to-r from-purple-50/80 to-blue-50/80 border border-purple-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-bold flex items-center gap-1.5 text-purple-900">
                          <Store className="w-3.5 h-3.5 text-purple-600" />
                          <span>{selectedVendorDetails.name}</span>
                          {selectedVendorDetails.company_name && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({selectedVendorDetails.company_name})
                            </span>
                          )}
                        </span>

                        {selectedVendorDetails.phone && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-purple-200 px-2 py-0.5 rounded-md text-slate-700 shadow-2xs">
                            <Phone className="w-3 h-3 text-purple-500" />
                            {selectedVendorDetails.phone}
                          </span>
                        )}

                        {selectedVendorDetails.whatsapp && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-emerald-800 font-medium shadow-2xs">
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            WA: {selectedVendorDetails.whatsapp}
                          </span>
                        )}

                        {selectedVendorDetails.email && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 shadow-2xs">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {selectedVendorDetails.email}
                          </span>
                        )}
                      </div>

                      {selectedVendorDetails.payment_details && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-white px-2.5 py-1 rounded-lg border border-purple-200 text-purple-900 shadow-2xs">
                          <CreditCard className="w-3 h-3 text-purple-600" />
                          <span className="font-bold">Payment Info:</span>
                          <span>{selectedVendorDetails.payment_details}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 2 of Vendor Info - 5 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                    {/* Col 1: Payment Method */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={accountForm.payment_method}
                        onChange={(e) => setAccountForm({ ...accountForm, payment_method: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Card">Card</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>

                    {/* Col 2: Invoice No */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Invoice No.
                      </label>
                      <input
                        type="text"
                        value={accountForm.invoice_no}
                        onChange={(e) => setAccountForm({ ...accountForm, invoice_no: e.target.value })}
                        placeholder="e.g. INV-00256"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-colors"
                      />
                    </div>

                    {/* Col 3,4,5: Internal Notes / Remarks (spans 3 cols on desktop) */}
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Internal Notes / Remarks
                      </label>
                      <input
                        type="text"
                        value={accountForm.notes || ''}
                        onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                        placeholder="e.g. Purchased with 1-year guarantee, vendor contact Tanvir..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAccount}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
                  >
                    {submittingAccount ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Account...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingAccount ? 'Update Account' : 'Create Account'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Assign / Edit Slot Modal - 3 Grid Layout on Desktop */}
      {showSlotModal && selectedSlot && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-xs overflow-y-auto p-3 sm:p-6"
          onClick={() => setShowSlotModal(false)}
        >
          <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl p-5 sm:p-7 text-left space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-800">
                        Assign Slot #{selectedSlot.slot_number}
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedSlot.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {selectedSlot.status || 'Available'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Account: <span className="font-bold text-slate-700">{selectedAccount?.product_name}</span> ({selectedAccount?.account_email})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order ID Auto-fill Lookup Bar (3 Grid on Desktop) */}
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 rounded-xl p-3.5 border border-blue-100/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                    <Hash className="w-3.5 h-3.5 text-blue-600" />
                    <span>Auto-fill Customer Details by Order ID</span>
                  </div>
                  {slotForm.order_id && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-2xs">
                      <Check className="w-3 h-3" />
                      Linked Order #{slotForm.order_id}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* Grid 1: Order ID Input & Search Button */}
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                        #
                      </span>
                      <input
                        type="text"
                        value={orderLookupId}
                        onChange={(e) => setOrderLookupId(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLookupOrder();
                          }
                        }}
                        placeholder="Order ID (e.g. 53)"
                        className="w-full pl-6 pr-2 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLookupOrder()}
                      disabled={lookingUpOrder}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                      title="Fetch customer info from this Order ID"
                    >
                      {lookingUpOrder ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>Fetch</span>
                    </button>
                  </div>

                  {/* Grid 2-3: Quick Pick Recent Orders Selector */}
                  <div className="md:col-span-2">
                    <select
                      value={orderLookupId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOrderLookupId(val);
                        if (val) handleLookupOrder(val);
                      }}
                      className="w-full py-2 px-3 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <option value="">⚡ Or Select Recent Order to Auto-Fill...</option>
                      {recentOrders.map((ord) => (
                        <option key={ord.id} value={ord.id}>
                          Order #{ord.id} — {ord.user_name || 'Customer'} • {ord.delivery_email || ord.user_email || ''} • {ord.phone || ''} ({ord.product_name || 'Product'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Slot Assignment Form - 3 Grids on Desktop */}
              <form onSubmit={handleSaveSlot} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Grid Col 1: Customer Email / Assigned To */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      Customer Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={slotForm.assigned_to}
                      onChange={(e) => setSlotForm({ ...slotForm, assigned_to: e.target.value })}
                      placeholder="e.g. user@email.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Grid Col 2: Customer Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      Customer / User Name
                    </label>
                    <input
                      type="text"
                      value={slotForm.customer_name}
                      onChange={(e) => setSlotForm({ ...slotForm, customer_name: e.target.value })}
                      placeholder="e.g. Tarek Ahmed"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Grid Col 3: WhatsApp / Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp / Phone
                    </label>
                    <input
                      type="text"
                      value={slotForm.customer_phone}
                      onChange={(e) => setSlotForm({ ...slotForm, customer_phone: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Grid Col 4: Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={slotForm.start_date}
                      onChange={(e) => setSlotForm({ ...slotForm, start_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Grid Col 5: End Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={slotForm.end_date}
                      onChange={(e) => setSlotForm({ ...slotForm, end_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Grid Col 6: Slot Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Slot Status
                    </label>
                    <select
                      value={slotForm.status}
                      onChange={(e) => setSlotForm({ ...slotForm, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Available">⚪ Available</option>
                      <option value="Expired">🔴 Expired</option>
                      <option value="Suspended">🟠 Suspended</option>
                    </select>
                  </div>

                  {/* Grid Col 7: Notes (Spans all 3 columns) */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Internal Notes / Order Remarks
                    </label>
                    <textarea
                      rows="2"
                      value={slotForm.notes}
                      onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                      placeholder="e.g. Assigned for Order #53, 1-year personal profile guarantee..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    {selectedSlot.assigned_to && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowSlotModal(false);
                          handleUnassignSlot(selectedSlot);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      >
                        Unassign Slot
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSlotModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingSlot}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                    >
                      {submittingSlot ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Slot Assignment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
