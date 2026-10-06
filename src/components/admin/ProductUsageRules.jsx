import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../utils/api';
import {
  ScrollText,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  X,
  MessageCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Eye,
  Share2,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export default function ProductUsageRules() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [copiedId, setCopiedId] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null); // null = new
  const [savingRule, setSavingRule] = useState(false);
  const [modalForm, setModalForm] = useState({
    product_id: '',
    title: 'Standard Usage Rules',
    rules_text: '',
    is_active: 1
  });

  const textareaRef = useRef(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, prodsRes] = await Promise.all([
        api.get('/product-usage-rules').catch((err) => {
          console.error('Failed to load rules:', err);
          return [];
        }),
        api.get('/products').catch((err) => {
          console.error('Failed to load products:', err);
          return [];
        })
      ]);

      const rulesData = Array.isArray(rulesRes) ? rulesRes : (rulesRes?.data || []);
      const prodsData = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.data || []);

      setRules(rulesData);
      setCatalogProducts(prodsData);
    } catch (err) {
      console.error('ProductUsageRules fetch error:', err);
      toast.error('Failed to load product usage rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchProd = productFilter === 'all' || String(r.product_id) === String(productFilter);
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (r.product_name && r.product_name.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.rules_text && r.rules_text.toLowerCase().includes(q)) ||
        (r.category_name && r.category_name.toLowerCase().includes(q));
      return matchProd && matchQuery;
    });
  }, [rules, productFilter, searchQuery]);

  // Copy rule text to clipboard exactly as it is
  const handleCopyText = (text, id = null) => {
    if (!text) {
      toast.error('No rules text to copy.');
      return;
    }

    try {
      navigator.clipboard.writeText(text);
      if (id !== null) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2200);
      }
      toast.success('Rules text copied as-is! Ready to paste into WhatsApp / Messenger.');
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      if (id !== null) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2200);
      }
      toast.success('Rules text copied as-is!');
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = (defaultProductId = '') => {
    setEditingRule(null);
    const prodId = defaultProductId || (catalogProducts[0]?.id ? String(catalogProducts[0].id) : '');
    const selectedProd = catalogProducts.find((p) => String(p.id) === String(prodId));
    const prodName = selectedProd ? selectedProd.name : 'Product';

    setModalForm({
      product_id: prodId,
      title: 'Standard Usage Rules & Terms',
      rules_text: `📌 ${prodName} - Usage Rules & Instructions:\n─────────────────────────────────────────────\n1. 🔐 Account & Security:\n   - Do NOT change the registered account credentials or recovery info.\n   - Single designated profile login only.\n2. 💻 Device Limit:\n   - Only use on authorized device.\n   - No unauthorized reselling or multi-sharing.\n3. ⚠️ Warranty Policy:\n   - Full replacement warranty during the active subscription period.\n   - Violation of these rules voids the warranty without refund.\n─────────────────────────────────────────────\n📞 Support WhatsApp: 01355667788 | ElitePassBD`,
      is_active: 1
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (rule) => {
    setEditingRule(rule);
    setModalForm({
      product_id: String(rule.product_id),
      title: rule.title || 'Standard Usage Rules',
      rules_text: rule.rules_text || '',
      is_active: rule.is_active !== undefined ? rule.is_active : 1
    });
    setShowModal(true);
  };

  // Insert helper snippet into textarea at current cursor
  const handleInsertSnippet = (snippet) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setModalForm((prev) => ({
        ...prev,
        rules_text: prev.rules_text ? `${prev.rules_text}\n${snippet}` : snippet
      }));
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = modalForm.rules_text;
    const newText = text.substring(0, start) + snippet + text.substring(end);

    setModalForm((prev) => ({ ...prev, rules_text: newText }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  // Quick Starter Templates
  const handleApplyTemplate = (type) => {
    const selectedProd = catalogProducts.find((p) => String(p.id) === String(modalForm.product_id));
    const prodName = selectedProd ? selectedProd.name : 'Digital License';

    let tpl = '';
    if (type === 'shared_account') {
      tpl = `📌 ${prodName} (Shared Account Rules):
─────────────────────────────────────────────
1. 🔐 Login Policy:
   - Login only on your designated profile/screen.
   - Do NOT edit or alter other profile names or PINs.
2. 🚫 Strictly Prohibited:
   - Changing email, password, or subscription settings.
   - Sharing credentials with friends or family.
3. ⚠️ Warranty Terms:
   - 100% active warranty during your subscription validity.
   - Account breach or password modification will lock your access.
─────────────────────────────────────────────
📞 Support WhatsApp: 01355667788 | ElitePassBD`;
    } else if (type === 'license_key') {
      tpl = `🔑 ${prodName} - Official License Activation Guide:
─────────────────────────────────────────────
1. 🛡️ Genuine Activation:
   - License key is 100% official and valid for 1 PC/Device.
   - Redeem/activate directly inside the official software settings.
2. ⚠️ Important Notes:
   - Do not attempt to activate on multiple machines simultaneously.
   - Keep a copy of your invoice and key safe for reinstallations.
3. 📞 Need Activation Help?
   - Send us a screenshot if you encounter any error code.
─────────────────────────────────────────────
Official Website: elitepassbd.com | Support WhatsApp: 01355667788`;
    } else if (type === 'vpn') {
      tpl = `🛡️ ${prodName} - VPN Usage Instructions:
─────────────────────────────────────────────
1. 🌐 Connection Rules:
   - Maximum 1 device connection at any given time.
   - Log out when switching between PC and Phone.
2. ⚠️ Security Warnings:
   - Do not tamper with account credentials.
   - Torrenting or malicious activity will result in ban.
3. 🔄 Renewal & Help:
   - Renew before expiration to keep current configuration.
─────────────────────────────────────────────
ElitePassBD Digital Support: 01355667788`;
    }

    setModalForm((prev) => ({
      ...prev,
      rules_text: tpl
    }));
    toast.success('Template applied! You can customize and save.');
  };

  // Save rule (Create or Update)
  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!modalForm.product_id) {
      toast.error('Please select a catalog product.');
      return;
    }
    if (!modalForm.rules_text.trim()) {
      toast.error('Please enter the usage rules text.');
      return;
    }

    try {
      setSavingRule(true);
      if (editingRule) {
        await api.put(`/product-usage-rules/${editingRule.id}`, modalForm);
        toast.success('Usage rules updated successfully!');
      } else {
        await api.post('/product-usage-rules', modalForm);
        toast.success('Usage rules created successfully!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save usage rules.');
    } finally {
      setSavingRule(false);
    }
  };

  // Delete rule
  const handleDeleteRule = async (rule) => {
    if (!window.confirm(`Are you sure you want to delete usage rules for "${rule.product_name}"?`)) {
      return;
    }
    try {
      await api.delete(`/product-usage-rules/${rule.id}`);
      toast.success('Usage rule deleted successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete usage rule.');
    }
  };

  // Products that do not have rules yet
  const productsWithoutRules = useMemo(() => {
    const coveredProductIds = new Set(rules.map((r) => r.product_id));
    return catalogProducts.filter((p) => !coveredProductIds.has(p.id));
  }, [catalogProducts, rules]);

  return (
    <div className="space-y-4 max-w-full text-slate-800 pb-12">
      {/* Top Header & Stats Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Product Usages Rules
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {rules.length} Policies
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Save product-wise instructions and terms. Copy & paste as-is directly into WhatsApp, Messenger & Email.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reload list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Usage Rule</span>
            </button>
          </div>
        </div>

        {/* Quick Product Missing Notice Bar */}
        {productsWithoutRules.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200/80">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <span className="font-bold">{productsWithoutRules.length} catalog products</span> do not have usage rules yet.
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Create:</span>
              {productsWithoutRules.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleOpenCreateModal(p.id)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>{p.name.length > 25 ? `${p.name.slice(0, 25)}...` : p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, rules content, or category..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Product Filter Dropdown */}
          <div className="w-full sm:w-64">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="all">📦 All Catalog Products ({rules.length})</option>
              {catalogProducts.map((p) => {
                const count = rules.filter((r) => r.product_id === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              viewMode === 'cards' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Card View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">Loading product usage rules...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRules.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ScrollText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Product Usage Rules Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || productFilter !== 'all'
              ? 'No rules match your search or filter. Try clearing filters or creating a new rule.'
              : 'Start by creating your first product-wise usage rules and guidelines for customers.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Usage Rules</span>
          </button>
        </div>
      )}

      {/* Card View */}
      {!loading && filteredRules.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredRules.map((rule) => {
            const isCopied = copiedId === rule.id;
            return (
              <div
                key={rule.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 tracking-wider">
                        {rule.category_name || 'Product Policy'}
                      </span>
                      {rule.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      {rule.product_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">{rule.title}</p>
                  </div>

                  {/* Actions Top Right */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(rule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Rule"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Formatted Content Viewer (AS-IT-IS Preserved) */}
                <div className="p-4 sm:p-5 flex-1 space-y-3">
                  <div className="relative group">
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <button
                        type="button"
                        onClick={() => handleCopyText(rule.rules_text, rule.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                        title="Copy exact formatted text for WhatsApp/Messenger"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied ✓' : 'Copy Text'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto selection:bg-blue-200 selection:text-blue-900 select-all shadow-inner">
                      {rule.rules_text}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Lines: <strong className="text-slate-600">{rule.rules_text ? rule.rules_text.split('\n').length : 0}</strong> • Chars:{' '}
                    <strong className="text-slate-600">{rule.rules_text?.length || 0}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(rule.rules_text, rule.id)}
                      className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy for Customer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {!loading && filteredRules.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">Rule Title</th>
                  <th className="py-3 px-4">Content Preview (As-is)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredRules.map((rule) => {
                  const isCopied = copiedId === rule.id;
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rule.product_name}</div>
                        <div className="text-[10.5px] text-blue-600 font-semibold">{rule.category_name || 'Standard'}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{rule.title}</td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70 font-mono text-[11px] text-slate-700 whitespace-pre-wrap line-clamp-3">
                          {rule.rules_text}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {rule.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(rule.rules_text, rule.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title="Copy exact rules text"
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rule)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
      )}

      {/* CREATE / EDIT MODAL - Full Fidelity Pre-wrap Text Preservation */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs overflow-y-auto p-3 sm:p-6"
          onClick={() => setShowModal(false)}
        >
          <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
            <div
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl p-5 sm:p-7 text-left space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                    <ScrollText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      {editingRule ? 'Edit Product Usage Rules' : 'Create Product Usage Rules'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Exact formatting, line breaks, bullet points & emojis are 100% preserved.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveRule} className="space-y-4">
                {/* Product & Title Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      Select Product <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalForm.product_id}
                      onChange={(e) => setModalForm({ ...modalForm, product_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    >
                      <option value="">Select a Catalog Product...</option>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.category_name ? `(${p.category_name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      Rule Title / Heading
                    </label>
                    <input
                      type="text"
                      value={modalForm.title}
                      onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                      placeholder="e.g. Standard Usage Rules, Account Policy..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Quick Snippets & Template Bar */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Quick Templates & Snippets:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('shared_account')}
                        className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        ⚡ Shared Account
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('license_key')}
                        className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        ⚡ License Key
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate('vpn')}
                        className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        ⚡ VPN Policy
                      </button>
                    </div>
                  </div>

                  {/* Quick Insert Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
                    <span className="text-[10.5px] font-bold text-slate-400">Insert:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertSnippet('📌 ')}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100 transition-colors"
                    >
                      📌 Pin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSnippet('🔐 ')}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100 transition-colors"
                    >
                      🔐 Lock
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSnippet('💻 ')}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100 transition-colors"
                    >
                      💻 Device
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSnippet('⚠️ ')}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100 transition-colors"
                    >
                      ⚠️ Warning
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSnippet('─────────────────────────────────────────────\n')}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100 transition-colors"
                    >
                      ── Separator
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSnippet('📞 Support WhatsApp: 01355667788\n')}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100 transition-colors"
                    >
                      📞 Support Contact
                    </button>
                  </div>
                </div>

                {/* Main Split: Textarea + Live "Send Anywhere" Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Input Textarea */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Rules Text (Type or Paste here) *</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {modalForm.rules_text.split('\n').length} lines • {modalForm.rules_text.length} chars
                      </span>
                    </div>
                    <textarea
                      ref={textareaRef}
                      rows="14"
                      value={modalForm.rules_text}
                      onChange={(e) => setModalForm({ ...modalForm, rules_text: e.target.value })}
                      placeholder="Paste your rules here exactly as you want to send them to customers..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap transition-colors shadow-inner"
                      required
                    />
                    <p className="text-[11px] text-slate-400">
                      💡 Tip: Every line break, emoji, indent and symbol will be preserved exactly as typed.
                    </p>
                  </div>

                  {/* Right: Live Preview Box (How it looks when sent) */}
                  <div className="space-y-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Live Customer Message Preview
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(modalForm.rules_text)}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Test copy to clipboard"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Test Copy</span>
                      </button>
                    </div>

                    <div className="flex-1 bg-gradient-to-b from-[#e5ddd5]/40 to-[#ece5dd]/60 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between overflow-hidden shadow-inner">
                      {/* WhatsApp / Messenger Chat bubble */}
                      <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-slate-200/60 max-h-[310px] overflow-y-auto whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed select-all">
                        {modalForm.rules_text || (
                          <span className="text-slate-400 italic">
                            Your message preview will appear here in real-time...
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10.5px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ready for WhatsApp & Messenger
                        </span>
                        <span>Delivered ✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Toggle & Submit Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(modalForm.is_active)}
                      onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-700">Active Rule</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingRule}
                      className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/25"
                    >
                      {savingRule ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{editingRule ? 'Save Changes' : 'Create Usage Rule'}</span>
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
