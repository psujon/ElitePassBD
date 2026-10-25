import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, Check, Package } from 'lucide-react';

export default function ProductSearchSelect({
  products = [],
  value = '',
  onChange,
  existingRuleProductIds = new Set(),
  ruleCounts = null,
  allowAllOption = false,
  allOptionLabel = 'All Catalog Products',
  allOptionCount = undefined,
  placeholder = 'Type to search or select product...',
  required = false,
  disabled = false,
  size = 'md', // 'sm' | 'md'
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Check if "All" is currently selected
  const isAllSelected = allowAllOption && (value === 'all' || !value);

  // Text representation for "All" option
  const allOptionDisplayText = useMemo(() => {
    if (allOptionCount !== undefined) {
      return `📦 ${allOptionLabel} (${allOptionCount})`;
    }
    return `📦 ${allOptionLabel}`;
  }, [allOptionLabel, allOptionCount]);

  // Find currently selected product
  const selectedProduct = useMemo(() => {
    if (!value || value === 'all') return null;
    return products.find((p) => String(p.id) === String(value)) || null;
  }, [products, value]);

  // Sync displayed search term when selection changes or dropdown closes
  useEffect(() => {
    if (!isOpen) {
      if (isAllSelected) {
        setSearchTerm(allOptionDisplayText);
      } else {
        setSearchTerm(selectedProduct ? selectedProduct.name : '');
      }
      setHasTyped(false);
    }
  }, [selectedProduct, isAllSelected, allOptionDisplayText, isOpen]);

  // Filter products list based on typing
  const filteredProducts = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();

    // If dropdown just opened and user hasn't typed anything new, show all products
    if (!hasTyped || !q) {
      return products;
    }

    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category_name || p.category || '').toLowerCase();
      const id = String(p.id);
      return name.includes(q) || cat.includes(q) || id === q;
    });
  }, [products, searchTerm, hasTyped]);

  // Whether the "All" option should be shown in dropdown
  const showAllOptionInList = useMemo(() => {
    if (!allowAllOption) return false;
    if (!hasTyped) return true;
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return true;
    return allOptionLabel.toLowerCase().includes(q) || 'all'.includes(q);
  }, [allowAllOption, hasTyped, searchTerm, allOptionLabel]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHasTyped(false);
        if (isAllSelected) {
          setSearchTerm(allOptionDisplayText);
        } else {
          setSearchTerm(selectedProduct ? selectedProduct.name : '');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedProduct, isAllSelected, allOptionDisplayText]);

  // Open dropdown and select input text
  const handleOpenDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setHasTyped(false);

    // Find index to highlight
    if (isAllSelected) {
      setHighlightedIndex(0);
    } else if (selectedProduct) {
      const idx = products.findIndex((p) => String(p.id) === String(selectedProduct.id));
      if (idx >= 0) setHighlightedIndex(idx);
    }
    setTimeout(() => {
      inputRef.current?.select();
    }, 20);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        handleOpenDropdown();
      } else {
        setHighlightedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        handleOpenDropdown();
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredProducts.length - 1)));
      }
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault();
        if (showAllOptionInList && highlightedIndex === 0 && allowAllOption) {
          handleSelectAll();
        } else {
          const targetIndex = showAllOptionInList ? highlightedIndex - 1 : highlightedIndex;
          if (filteredProducts[targetIndex]) {
            handleSelect(filteredProducts[targetIndex]);
          } else if (filteredProducts[0]) {
            handleSelect(filteredProducts[0]);
          }
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHasTyped(false);
      setSearchTerm(isAllSelected ? allOptionDisplayText : (selectedProduct ? selectedProduct.name : ''));
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setHasTyped(false);
      setSearchTerm(isAllSelected ? allOptionDisplayText : (selectedProduct ? selectedProduct.name : ''));
    }
  };

  // Handle selection of a specific product
  const handleSelect = (product) => {
    if (onChange) {
      onChange(String(product.id), product);
    }
    setSearchTerm(product.name);
    setHasTyped(false);
    setIsOpen(false);
  };

  // Handle selection of "All Products"
  const handleSelectAll = () => {
    if (onChange) {
      onChange('all', null);
    }
    setSearchTerm(allOptionDisplayText);
    setHasTyped(false);
    setIsOpen(false);
  };

  // Clear current selection / search
  const handleClear = (e) => {
    e.stopPropagation();
    setSearchTerm('');
    setHasTyped(true);
    if (onChange) {
      onChange(allowAllOption ? 'all' : '', null);
    }
    inputRef.current?.focus();
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  // Toggle dropdown chevron
  const handleToggle = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      setHasTyped(false);
      setSearchTerm(isAllSelected ? allOptionDisplayText : (selectedProduct ? selectedProduct.name : ''));
    } else {
      handleOpenDropdown();
      inputRef.current?.focus();
    }
  };

  // Styling variations
  const isSm = size === 'sm';
  const containerHeightClass = isSm ? 'py-1.5 rounded-lg' : 'py-2 rounded-xl';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML form validation */}
      <input
        type="text"
        value={value || ''}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="opacity-0 absolute pointer-events-none w-0 h-0 bottom-0 left-0"
        onChange={() => {}}
      />

      {/* Main Combobox Input Field */}
      <div
        onClick={handleOpenDropdown}
        className={`relative flex items-center bg-slate-50 border transition-all cursor-text ${containerHeightClass} ${
          isOpen
            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/90'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        {/* Search / Magnifier Icon */}
        <div className="pl-2.5 pr-1.5 text-slate-400 flex items-center pointer-events-none">
          <Search className={`w-3.5 h-3.5 transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-400'}`} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={handleOpenDropdown}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHasTyped(true);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent pl-0 pr-14 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none truncate ${
            isAllSelected && !hasTyped ? 'text-blue-900' : ''
          }`}
        />

        {/* Right Controls: Category badge + Clear button + Chevron */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {selectedProduct?.category_name && !hasTyped && !isOpen && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-slate-200/70 text-slate-600 rounded max-w-[90px] truncate">
              {selectedProduct.category_name}
            </span>
          )}

          {((value && value !== 'all') || (hasTyped && searchTerm)) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear selection / search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
            title={isOpen ? 'Close menu' : 'Open options list'}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-[280px]">
          {/* Header Bar */}
          <div className="px-3.5 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Catalog Products</span>
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-bold text-[10px]">
                {filteredProducts.length}
              </span>
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Type to filter • ↑↓ to navigate • Enter to pick
            </span>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-slate-100/80 overscroll-contain"
          >
            {/* Optional "All Products" Item at Top */}
            {showAllOptionInList && (
              <div
                onClick={handleSelectAll}
                className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors border-b border-slate-100 ${
                  isAllSelected
                    ? 'bg-blue-50 text-blue-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isAllSelected ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      📦 {allOptionLabel}
                    </span>
                    {allOptionCount !== undefined && (
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-bold text-[10px]">
                        {allOptionCount}
                      </span>
                    )}
                  </div>
                </div>

                {isAllSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            )}

            {filteredProducts.length === 0 && !showAllOptionInList ? (
              <div className="py-7 px-4 text-center">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-700">No matching products found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try searching with another keyword or category name
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setHasTyped(false);
                      setHighlightedIndex(0);
                    }}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View all {products.length} products
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map((p, idx) => {
                const isSelected = String(p.id) === String(value);
                const isHighlighted = showAllOptionInList ? idx + 1 === highlightedIndex : idx === highlightedIndex;

                const countFromRuleCounts = ruleCounts ? ruleCounts[p.id] : undefined;
                const hasRule =
                  countFromRuleCounts !== undefined
                    ? countFromRuleCounts > 0
                    : existingRuleProductIds?.has?.(p.id) ||
                      existingRuleProductIds?.has?.(Number(p.id)) ||
                      existingRuleProductIds?.has?.(String(p.id));

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    onMouseEnter={() => setHighlightedIndex(showAllOptionInList ? idx + 1 : idx)}
                    className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-blue-50/90 text-blue-900'
                        : isSelected
                        ? 'bg-blue-50/40 text-slate-900'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-slate-300'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs truncate ${
                              isSelected ? 'font-black text-blue-900' : 'font-semibold text-slate-800'
                            }`}
                          >
                            {p.name}
                          </span>
                          {(p.category_name || p.category) && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded border border-slate-200/60 shrink-0">
                              {p.category_name || p.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span>ID: #{p.id}</span>
                          {countFromRuleCounts !== undefined ? (
                            countFromRuleCounts > 0 ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                • {countFromRuleCounts} {countFromRuleCounts === 1 ? 'Rule' : 'Rules'}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">
                                • No Rules
                              </span>
                            )
                          ) : hasRule ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                              • Existing Rule
                            </span>
                          ) : (
                            <span className="text-blue-500 font-medium">
                              • No Rule Yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
