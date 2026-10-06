import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../utils/api';
import {
  Store,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Edit2,
  Trash2,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Building2,
  Tag,
  FileText,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  List,
  ChevronRight,
  X,
  Loader2,
  DollarSign,
  Users,
  Send
} from 'lucide-react';

const CATEGORIES = [
  'General',
  'Gaming Passes',
  'Subscriptions',
  'Software Licenses',
  'Gift Cards',
  'Vouchers & Top-up',
  'Others'
];

export default function VendorManager() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // View Details Modal State
  const [viewingVendor, setViewingVendor] = useState(null);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const initialFormState = {
    name: '',
    company_name: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    email: '',
    address: '',
    payment_details: '',
    category: 'Subscriptions',
    status: 'Active',
    balance: '0.00',
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch Vendors
  const fetchVendors = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await api.get('/vendors');
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch vendors error:', error);
      toast.error('Failed to load vendors list!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.company_name && v.company_name.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.whatsapp && v.whatsapp.toLowerCase().includes(q)) ||
        (v.telegram && v.telegram.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        (v.notes && v.notes.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vendors, searchQuery, statusFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status === 'Active').length;
    const inactive = total - active;
    const uniqueCategories = new Set(vendors.map((v) => v.category).filter(Boolean)).size;
    return { total, active, inactive, uniqueCategories };
  }, [vendors]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingVendor(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name || '',
      company_name: vendor.company_name || '',
      phone: vendor.phone || '',
      whatsapp: vendor.whatsapp || '',
      telegram: vendor.telegram || '',
      email: vendor.email || '',
      address: vendor.address || '',
      payment_details: vendor.payment_details || '',
      category: vendor.category || 'General',
      status: vendor.status || 'Active',
      balance: vendor.balance !== undefined && vendor.balance !== null ? String(vendor.balance) : '0.00',
      notes: vendor.notes || ''
    });
    setModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vendor name is required!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.id}`, formData);
        toast.success('Vendor information updated successfully!');
      } else {
        await api.post('/vendors', formData);
        toast.success('New vendor added successfully!');
      }
      setModalOpen(false);
      fetchVendors(true);
    } catch (error) {
      console.error('Save vendor error:', error);
      toast.error(error.message || 'Failed to save vendor information!');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await api.delete(`/vendors/${id}`);
      toast.success('Vendor deleted successfully!');
      setDeleteConfirmId(null);
      fetchVendors(true);
      if (viewingVendor?.id === id) setViewingVendor(null);
    } catch (error) {
      console.error('Delete vendor error:', error);
      toast.error(error.message || 'Failed to delete vendor!');
    } finally {
      setDeleting(false);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Format WhatsApp Link
  const getWhatsAppLink = (number) => {
    if (!number) return null;
    let clean = number.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
      clean = '88' + clean;
    }
    return `https://wa.me/${clean}`;
  };

  // Format Telegram Link
  const getTelegramLink = (handle) => {
    if (!handle) return null;
    const clean = handle.trim();
    if (clean.startsWith('https://t.me/')) return clean;
    if (clean.startsWith('t.me/')) return `https://${clean}`;
    if (clean.startsWith('@')) return `https://t.me/${clean.slice(1)}`;
    return `https://t.me/${clean}`;
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Vendors & Product Suppliers
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {vendors.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage digital product suppliers, contact channels, balances, and payment details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => fetchVendors(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Total Suppliers</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Active Vendors</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Inactive Vendors</p>
            <p className="text-lg sm:text-xl font-bold text-slate-700 mt-0.5">{stats.inactive}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Categories</p>
            <p className="text-lg sm:text-xl font-bold text-purple-600 mt-0.5">{stats.uniqueCategories}</p>
          </div>
        </div>
      </div>

      {/* Search, Filter & Layout Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 text-slate-700"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 ${viewMode === 'table' ? 'bg-white text-purple-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vendor List / Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading vendors...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Vendors Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No suppliers matched your search query. Try searching with a different term.'
              : 'No product suppliers or vendors have been added yet. Click the button below to add your first vendor.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Vendor</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Vendor / Company</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Contact</th>
                  <th className="py-3 px-3.5">Payment Method</th>
                  <th className="py-3 px-3.5">Balance / Due</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((vendor) => {
                  const waLink = getWhatsAppLink(vendor.whatsapp || vendor.phone);
                  return (
                    <tr
                      key={vendor.id}
                      className="hover:bg-purple-50/20 transition-colors group cursor-pointer"
                      onClick={() => setViewingVendor(vendor)}
                    >
                      {/* Name & Company */}
                      <td className="py-3 px-3.5 font-medium text-slate-900">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                              {vendor.name}
                            </div>
                            {vendor.company_name && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {vendor.company_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {vendor.category || 'General'}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          {vendor.whatsapp && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-500" />
                              <span>{vendor.whatsapp}</span>
                            </a>
                          )}
                          {vendor.telegram && (
                            <a
                              href={getTelegramLink(vendor.telegram)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-medium"
                              title="Chat on Telegram"
                            >
                              <Send className="w-3 h-3 text-sky-500" />
                              <span>{vendor.telegram}</span>
                            </a>
                          )}
                          {vendor.phone && !vendor.whatsapp && (
                            <a
                              href={`tel:${vendor.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-purple-600 font-medium"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{vendor.phone}</span>
                            </a>
                          )}
                          {vendor.email && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              {vendor.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Payment Details */}
                      <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                        {vendor.payment_details ? (
                          <div className="flex items-center gap-1.5 max-w-[160px]">
                            <span className="truncate text-slate-700 text-[11px] font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              {vendor.payment_details}
                            </span>
                            <button
                              onClick={() => handleCopy(vendor.payment_details, 'Payment details')}
                              className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="Copy payment details"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-slate-700">
                        ৳{parseFloat(vendor.balance || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            vendor.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              vendor.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {vendor.status === 'Active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(vendor)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(vendor.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredVendors.map((vendor) => {
            const waLink = getWhatsAppLink(vendor.whatsapp || vendor.phone);
            return (
              <div
                key={vendor.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                onClick={() => setViewingVendor(vendor)}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 uppercase shadow-2xs">
                        {vendor.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors text-sm">
                          {vendor.name}
                        </h4>
                        {vendor.company_name && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {vendor.company_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        vendor.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          vendor.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {vendor.status === 'Active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Card Details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {vendor.category || 'General'}
                      </span>
                    </div>

                    {vendor.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <a
                          href={`tel:${vendor.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-slate-700 hover:text-purple-600"
                        >
                          {vendor.phone}
                        </a>
                      </div>
                    )}

                    {vendor.whatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">WhatsApp:</span>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-500" />
                          {vendor.whatsapp}
                        </a>
                      </div>
                    )}

                    {vendor.telegram && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Telegram:</span>
                        <a
                          href={getTelegramLink(vendor.telegram)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 text-sky-500" />
                          {vendor.telegram}
                        </a>
                      </div>
                    )}

                    {vendor.payment_details && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Payment:</span>
                        <div
                          className="flex items-center gap-1 max-w-[170px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {vendor.payment_details}
                          </span>
                          <button
                            onClick={() => handleCopy(vendor.payment_details, 'Payment details')}
                            className="text-slate-400 hover:text-purple-600"
                            title="Copy"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-mono text-slate-500 text-[11px]">
                    Balance: <strong className="text-slate-800">৳{parseFloat(vendor.balance || 0).toLocaleString()}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(vendor)}
                      className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(vendor.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT VENDOR MODAL */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-xs overflow-y-auto p-3 sm:p-6"
          onClick={() => setModalOpen(false)}
        >
          <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
            <div
              className="bg-white rounded-2xl w-full max-w-4xl xl:max-w-5xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 text-left"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingVendor ? 'Edit Vendor Details' : 'Add New Vendor'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Save and manage product supplier information</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form - 4 Grid Layout */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {/* 1. Name */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor / Contact Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hasan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  />
                </div>

                {/* 2. Company Name */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Shop Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Global Accounts Hub"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  />
                </div>

                {/* 3. Category */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Status */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* 5. Phone */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  />
                </div>

                {/* 6. WhatsApp */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Number <span className="text-[10px] text-slate-400 font-normal">(direct chat)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="88019xxxxxxxx"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  />
                </div>

                {/* 7. Telegram (Number or Username) */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telegram <span className="text-[10px] text-slate-400 font-normal">(Number or @username)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="@username or 017xxxxxxxx"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  />
                </div>

                {/* 8. Email */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  />
                </div>

                {/* 9. Balance */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Balance / Due (BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs font-mono transition-colors"
                  />
                </div>

                {/* 10. Address */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka, Bangladesh"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  />
                </div>

                {/* 11. Payment Details (2 cols) */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Methods & Info{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (bKash, Nagad, Binance Pay ID, USDT, Bank)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. bKash (Personal): 01925xxxxxx, Binance Pay ID: 12345678"
                    value={formData.payment_details}
                    onChange={(e) => setFormData({ ...formData, payment_details: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors"
                  />
                </div>

                {/* 12. Notes (Full 4 cols) */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms / Internal Info</label>
                  <textarea
                    rows={2}
                    placeholder="Internal notes, contract info, or supplier details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white text-xs transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingVendor ? 'Update Vendor' : 'Save Vendor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    )}

      {/* VIEW DETAILS MODAL */}
      {viewingVendor && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-xs overflow-y-auto p-3 sm:p-6"
          onClick={() => setViewingVendor(null)}
        >
          <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
            <div
              className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md text-white font-bold text-base flex items-center justify-center uppercase">
                  {viewingVendor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">{viewingVendor.name}</h3>
                  {viewingVendor.company_name && (
                    <p className="text-xs text-white/80">{viewingVendor.company_name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingVendor(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-800">{viewingVendor.category || 'General'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                    viewingVendor.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {viewingVendor.status === 'Active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              {viewingVendor.phone && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Phone Number</span>
                  <a href={`tel:${viewingVendor.phone}`} className="font-medium text-purple-600 hover:underline">
                    {viewingVendor.phone}
                  </a>
                </div>
              )}

              {viewingVendor.whatsapp && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">WhatsApp</span>
                  <a
                    href={getWhatsAppLink(viewingVendor.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{viewingVendor.whatsapp}</span>
                  </a>
                </div>
              )}

              {viewingVendor.telegram && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Telegram</span>
                  <a
                    href={getTelegramLink(viewingVendor.telegram)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sky-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{viewingVendor.telegram}</span>
                  </a>
                </div>
              )}

              {viewingVendor.email && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email Address</span>
                  <a href={`mailto:${viewingVendor.email}`} className="font-medium text-purple-600 hover:underline">
                    {viewingVendor.email}
                  </a>
                </div>
              )}

              {viewingVendor.payment_details && (
                <div className="py-1 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500">Payment Details</span>
                    <button
                      onClick={() => handleCopy(viewingVendor.payment_details, 'Payment details')}
                      className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800">
                    {viewingVendor.payment_details}
                  </div>
                </div>
              )}

              {viewingVendor.address && (
                <div className="flex items-start justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Address</span>
                  <span className="text-right max-w-[200px] text-slate-800">{viewingVendor.address}</span>
                </div>
              )}

              {viewingVendor.notes && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-1">Notes / Terms:</span>
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 whitespace-pre-wrap">
                    {viewingVendor.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setViewingVendor(null);
                  handleOpenEditModal(viewingVendor);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Vendor</span>
              </button>

              {viewingVendor.whatsapp && (
                <a
                  href={getWhatsAppLink(viewingVendor.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}

              {viewingVendor.telegram && (
                <a
                  href={getTelegramLink(viewingVendor.telegram)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-xs overflow-y-auto p-3 sm:p-4"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
            <div
              className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-xl p-5 text-center animate-in fade-in zoom-in-95 duration-200 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete this vendor?</h3>
            <p className="text-xs text-slate-500 mt-1">
              All records associated with this supplier will be permanently deleted. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </div>
  );
}
