import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import JoditEditor from 'jodit-react';
import { api } from '../../utils/api';
import {
  FileText,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Globe,
  Info,
  ShieldCheck,
  Handshake,
  Lock,
  Scale,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

// Definitions of the 6 public pages
const PAGES_CONFIG = [
  {
    key: 'about',
    labelEn: 'About Us',
    labelBn: 'আমাদের সম্পর্কে',
    path: '/about',
    icon: Info,
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    description: 'কোম্পানি পরিচিতি, ভিশন, মিশন ও সেবাসমূহ'
  },
  {
    key: 'partners',
    labelEn: 'Our Partners',
    labelBn: 'আমাদের পার্টনার্স',
    path: '/partners',
    icon: Handshake,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'গ্লোবাল পার্টনার, অনুমোদিত ভেন্ডর ও লোকাল চ্যানেল'
  },
  {
    key: 'privacy',
    labelEn: 'Privacy Policy',
    labelBn: 'গোপনীয়তা নীতিমালা',
    path: '/privacy',
    icon: Lock,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'গ্রাহকের তথ্যের সুরক্ষা ও গোপনীয়তা সংক্রান্ত শর্তাবলী'
  },
  {
    key: 'terms',
    labelEn: 'Terms of Service',
    labelBn: 'ব্যবহারের শর্তাবলী',
    path: '/terms',
    icon: Scale,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'প্ল্যাটফর্মের সাধারণ নিয়মনীতি, ক্রয় এবং ওয়ারেন্টি চুক্তি'
  },
  {
    key: 'refund',
    labelEn: 'Refund Policy',
    labelBn: 'রিফান্ড পলিসি',
    path: '/refund',
    icon: RotateCcw,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'টাকা ফেরত, অর্ডার বাতিল ও ওয়ারেন্টি রিপ্লেসমেন্ট নীতিমালা'
  },
  {
    key: 'dmca',
    labelEn: 'DMCA Policy',
    labelBn: 'ডিএমসিএ পলিসি',
    path: '/dmca',
    icon: ShieldCheck,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'কপিরাইট লঙ্ঘন সংক্রান্ত বিজ্ঞপ্তি, পর্যালোচনা ও প্রতিকার'
  }
];

export default function PageSettingsManager() {
  const [activePageKey, setActivePageKey] = useState('about');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reordering, setReordering] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // null = new, or section object
  const [saving, setSaving] = useState(false);
  const [modalForm, setModalForm] = useState({
    title: '',
    content: '',
    sort_order: 1,
    is_active: 1
  });
  const [editorMode, setEditorMode] = useState('rich'); // 'rich' | 'plain'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // section object or null
  const [deleting, setDeleting] = useState(false);

  const editorRef = useRef(null);

  // Jodit WYSIWYG configuration
  const joditConfig = useMemo(() => ({
    readonly: false,
    height: 'auto',
    minHeight: 260,
    enableDragAndDropFileToEditor: true,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html',
    defaultActionOnPasteFromWord: 'insert_as_html',
    processPasteHTML: false,
    processPasteFromWord: false,
    cleanOnPaste: false,
    cleanHTML: {
      cleanOnPaste: false,
      removeEmptyElements: false,
      replaceOldTags: false,
      fillEmptyParagraph: false,
      allowTags: false,
      denyTags: false,
      allowedStyles: false
    },
    beautifyHTML: false,
    toolbarAdaptive: true,
    toolbarButtonSize: 'middle',
    showXPathInStatusbar: false,
    showCharsCounter: true,
    showWordsCounter: true,
    toolbarSticky: false,
    buttons: [
      'source', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser'
    ]
  }), []);

  // Fetch sections for the currently selected page sub-menu
  const fetchSections = async (pageKey = activePageKey) => {
    try {
      setLoading(true);
      const res = await api.get(`/page-sections/admin/all?page_key=${pageKey}`);
      if (res.data?.success) {
        setSections(res.data.sections || []);
      } else {
        setSections([]);
      }
    } catch (err) {
      console.error('Error fetching page sections:', err);
      toast.error('পেইজ সেকশন লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections(activePageKey);
  }, [activePageKey]);

  // Current page config
  const currentPage = useMemo(() => {
    return PAGES_CONFIG.find((p) => p.key === activePageKey) || PAGES_CONFIG[0];
  }, [activePageKey]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    let result = [...sections];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.content && s.content.toLowerCase().includes(q))
      );
    }
    return result;
  }, [sections, searchQuery]);

  // Open modal for adding a new section
  const handleAddNew = () => {
    const nextSort = sections.length > 0
      ? Math.max(...sections.map((s) => s.sort_order || 0)) + 1
      : 1;

    setEditingSection(null);
    setModalForm({
      title: '',
      content: '',
      sort_order: nextSort,
      is_active: 1
    });
    setEditorMode('rich');
    setShowModal(true);
  };

  // Open modal for editing an existing section
  const handleEdit = (section) => {
    setEditingSection(section);
    setModalForm({
      title: section.title || '',
      content: section.content || '',
      sort_order: section.sort_order || 1,
      is_active: section.is_active ? 1 : 0
    });
    setEditorMode('rich');
    setShowModal(true);
  };

  // Toggle active status
  const handleToggleStatus = async (section) => {
    const updatedStatus = section.is_active ? 0 : 1;
    try {
      const res = await api.put(`/page-sections/${section.id}`, {
        is_active: updatedStatus
      });
      if (res.data?.success) {
        toast.success(
          updatedStatus ? 'সেকশন সক্রিয় করা হয়েছে।' : 'সেকশন স্থগিত রাখা হয়েছে।'
        );
        setSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, is_active: updatedStatus } : s))
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।');
    }
  };

  // Move section UP or DOWN
  const handleMoveOrder = async (index, direction) => {
    if (reordering) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updated = [...sections];
    const currentItem = { ...updated[index] };
    const targetItem = { ...updated[targetIndex] };

    // Swap sort_order
    const tempSort = currentItem.sort_order;
    currentItem.sort_order = targetItem.sort_order;
    targetItem.sort_order = tempSort;

    // Swap in array
    updated[index] = targetItem;
    updated[targetIndex] = currentItem;

    setSections(updated);
    setReordering(true);

    try {
      await api.put('/page-sections/reorder/batch', {
        items: [
          { id: currentItem.id, sort_order: currentItem.sort_order },
          { id: targetItem.id, sort_order: targetItem.sort_order }
        ]
      });
      toast.success('সিরিয়াল নম্বর সফলভাবে পরিবর্তন হয়েছে।');
    } catch (err) {
      console.error('Error reordering sections:', err);
      toast.error('সিরিয়াল আপডেট করতে সমস্যা হয়েছে।');
      fetchSections();
    } finally {
      setReordering(false);
    }
  };

  // Save (Create or Update) section
  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) {
      toast.error('দয়া করে সেকশন টাইটেল লিখুন।');
      return;
    }
    if (!modalForm.content.trim()) {
      toast.error('দয়া করে সেকশন বিবরণ লিখুন।');
      return;
    }

    try {
      setSaving(true);
      if (editingSection) {
        // Update
        const res = await api.put(`/page-sections/${editingSection.id}`, {
          page_key: activePageKey,
          title: modalForm.title.trim(),
          content: modalForm.content,
          sort_order: parseInt(modalForm.sort_order, 10) || 1,
          is_active: modalForm.is_active ? 1 : 0
        });
        if (res.data?.success) {
          toast.success('সেকশন সফলভাবে আপডেট হয়েছে!');
          setShowModal(false);
          fetchSections();
        }
      } else {
        // Create
        const res = await api.post('/page-sections', {
          page_key: activePageKey,
          title: modalForm.title.trim(),
          content: modalForm.content,
          sort_order: parseInt(modalForm.sort_order, 10) || 1,
          is_active: modalForm.is_active ? 1 : 0
        });
        if (res.data?.success) {
          toast.success('নতুন সেকশন সফলভাবে যোগ করা হয়েছে!');
          setShowModal(false);
          fetchSections();
        }
      }
    } catch (err) {
      console.error('Error saving page section:', err);
      toast.error(err.response?.data?.message || 'সেকশন সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  // Delete section
  const handleDeleteSection = async () => {
    if (!showDeleteConfirm) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/page-sections/${showDeleteConfirm.id}`);
      if (res.data?.success) {
        toast.success('সেকশন সফলভাবে মুছে ফেলা হয়েছে।');
        setShowDeleteConfirm(null);
        fetchSections();
      }
    } catch (err) {
      console.error('Error deleting section:', err);
      toast.error('সেকশন ডিলিট করতে ব্যর্থ হয়েছে।');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to display snippet without HTML tags
  const getPlainTextSnippet = (htmlString, maxLength = 120) => {
    if (!htmlString) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Banner / Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-850">
                পেইজ সেটিংস ও কনটেন্ট ম্যানেজার (Page Settings)
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                Dynamic CMS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ওয়েবসাইটের তথ্য ও নীতিমালা পেইজগুলোর প্রতিটি সেকশন, টাইটেল, বিবরণ ও সিরিয়াল নম্বর সহজেই এন্ট্রি ও আপডেট করুন।
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchSections()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
          <a
            href={currentPage.path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>লাইভ পেইজ দেখুন</span>
          </a>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সেকশন যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Sub-Menus (ট্যাব নেভিগেশন - ৬টি পেইজের তালিকা) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PAGES_CONFIG.map((page) => {
            const IconComp = page.icon;
            const isSelected = activePageKey === page.key;
            return (
              <button
                key={page.key}
                onClick={() => {
                  setActivePageKey(page.key);
                  setSearchQuery('');
                }}
                className={`flex flex-col items-center justify-center text-center p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-50/40 text-violet-800 shadow-xs'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-650'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                    isSelected
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold leading-tight">{page.labelEn}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {page.labelBn}
                </span>
                {isSelected && (
                  <span className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-100/80 px-2 py-0.2 rounded-full">
                    সক্রিয় সাব-মেনু
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sub-Menu Information & Action Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentPage.badgeColor}`}
            >
              <currentPage.icon className="w-3.5 h-3.5" />
              {currentPage.labelEn}
            </span>
            <h3 className="text-base font-bold text-slate-850">
              {currentPage.labelBn} ({currentPage.path})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{currentPage.description}</p>
        </div>

        {/* Search Input & Total Count */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সেকশন খুঁজুন..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl shrink-0">
            মোট সেকশন: {sections.length}
          </span>
        </div>
      </div>

      {/* Sections List in Serial Order */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-violet-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">সেকশন ডাটা লোড হচ্ছে, অপেক্ষা করুন...</p>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">কোনো সেকশন পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? 'আপনার সার্চ অনুযায়ী কোনো সেকশন খুঁজে পাওয়া যায়নি।'
              : 'এই পেইজের জন্য এখনও কোনো সেকশন এন্ট্রি করা হয়নি। নতুন সেকশন যোগ করতে নিচের বাটনে চাপ দিন।'}
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সেকশন তৈরি করুন</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">সিরিয়াল</th>
                  <th className="py-3 px-4 w-24 text-center">রি-অর্ডার</th>
                  <th className="py-3 px-4">টাইটেল (শিরোনাম)</th>
                  <th className="py-3 px-4">বিবরণ প্রিভিউ</th>
                  <th className="py-3 px-4 w-28 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 w-28 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSections.map((section, idx) => (
                  <tr
                    key={section.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Serial Number Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100/80 text-violet-700 font-bold text-xs border border-violet-200">
                        #{section.sort_order ?? idx + 1}
                      </span>
                    </td>

                    {/* Move Up / Down Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0 || reordering}
                          title="উপরে নিয়ে যান"
                          className="p-1 rounded text-slate-650 hover:bg-white hover:text-violet-600 disabled:opacity-30 disabled:pointer-events-none transition"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === filteredSections.length - 1 || reordering}
                          title="নিচে নামান"
                          className="p-1 rounded text-slate-650 hover:bg-white hover:text-violet-600 disabled:opacity-30 disabled:pointer-events-none transition"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Section Title */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-800">{section.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Key: {section.page_key} • ID: {section.id}
                      </span>
                    </td>

                    {/* Content Preview */}
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {getPlainTextSnippet(section.content, 140)}
                      </p>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(section)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition border ${
                          section.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {section.is_active ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>সক্রিয়</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-slate-400" />
                            <span>স্থগিত</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action buttons (Edit & Delete) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(section)}
                          title="এডিট করুন"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-650 hover:text-violet-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(section)}
                          title="মুছে ফেলুন"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-650 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-850">
                      {editingSection ? 'সেকশন আপডেট করুন' : 'নতুন সেকশন যোগ করুন'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      পেইজ: <span className="font-bold text-violet-600">{currentPage.labelEn}</span> ({currentPage.labelBn})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
                {/* Title & Serial Order Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      সেকশন টাইটেল / শিরোনাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.title}
                      onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                      placeholder="যেমন: ১. তথ্যের গোপনীয়তা ও সুরক্ষা নীতিমালা"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-400"
                    />
                  </div>

                  {/* Serial Order */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      সিরিয়াল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={modalForm.sort_order}
                      onChange={(e) => setModalForm({ ...modalForm, sort_order: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 text-center font-bold"
                    />
                  </div>
                </div>

                {/* Content Editor Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      সেকশন বিবরণ ও কনটেন্ট <span className="text-rose-500">*</span>
                    </label>

                    {/* Mode Toggle (Rich Text vs Plain/HTML) */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setEditorMode('rich')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          editorMode === 'rich'
                            ? 'bg-white text-violet-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Visual (WYSIWYG)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('plain')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          editorMode === 'plain'
                            ? 'bg-white text-violet-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        HTML / Source
                      </button>
                    </div>
                  </div>

                  {/* WYSIWYG Editor */}
                  {editorMode === 'rich' ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-violet-500">
                      <JoditEditor
                        ref={editorRef}
                        value={modalForm.content}
                        config={joditConfig}
                        onBlur={(newContent) =>
                          setModalForm((prev) => ({ ...prev, content: newContent }))
                        }
                      />
                    </div>
                  ) : (
                    <textarea
                      rows={10}
                      value={modalForm.content}
                      onChange={(e) =>
                        setModalForm((prev) => ({ ...prev, content: e.target.value }))
                      }
                      placeholder="এখানে এইচটিএমএল বা সাধারণ টেক্সট লিখুন..."
                      className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500"
                    />
                  )}
                  <p className="text-[11px] text-slate-400">
                    টিপস: প্যারাগ্রাফ, বুলেট পয়েন্ট, টেক্সট হাইলাইট বা লিঙ্ক ব্যবহার করতে পারেন।
                  </p>
                </div>

                {/* Status Toggle & Page Info */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modalForm.is_active === 1}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, is_active: e.target.checked ? 1 : 0 })
                      }
                      className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      এই সেকশনটি লাইভ পেইজে সক্রিয় রাখুন (Publish)
                    </span>
                  </label>

                  <span className="text-[11px] text-slate-400 font-medium">
                    সিরিয়াল অনুযায়ী পেইজে উপরে-নিচে দেখাবে
                  </span>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingSection ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-md text-left animate-scale-up space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">সেকশন মুছে ফেলতে চান?</h4>
                  <p className="text-xs text-slate-500">
                    এটি মুছে ফেললে লাইভ পেইজ থেকেও এটি অপসারিত হবে।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                <p className="font-bold text-slate-800">
                  #{showDeleteConfirm.sort_order} {showDeleteConfirm.title}
                </p>
                <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">
                  {getPlainTextSnippet(showDeleteConfirm.content, 100)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  না, রাখুন
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSection}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>মুছে ফেলা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>হ্যাঁ, মুছে ফেলুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

