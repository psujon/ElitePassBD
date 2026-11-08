import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Sparkles, Layers } from 'lucide-react';

export default function PageSectionsRenderer({
  pageKey,
  fallbackContent = null,
  renderCustomCard = null
}) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPageSections = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/page-sections/${pageKey}`);
        if (isMounted) {
          if (res.data?.success && Array.isArray(res.data.sections)) {
            setSections(res.data.sections);
          } else {
            setSections([]);
          }
        }
      } catch (err) {
        console.error(`Error loading page sections for ${pageKey}:`, err);
        if (isMounted) setSections([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (pageKey) {
      fetchPageSections();
    }
    return () => {
      isMounted = false;
    };
  }, [pageKey]);

  // Helper to render content safely (HTML or plain text)
  const renderFormattedContent = (content) => {
    if (!content) return null;
    const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);
    if (isHtml) {
      return (
        <div
          className="prose prose-sm max-w-none text-slate-650 leading-relaxed space-y-2 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ul>li]:mb-1.5 [&>ol>li]:mb-1.5 [&>strong]:text-slate-850 [&>a]:text-violet-600 [&>a]:underline"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return (
      <div className="whitespace-pre-line text-xs sm:text-sm text-slate-650 leading-relaxed">
        {content}
      </div>
    );
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
            <div className="h-4 bg-slate-100 rounded-md w-full"></div>
            <div className="h-4 bg-slate-100 rounded-md w-5/6"></div>
            <div className="h-4 bg-slate-100 rounded-md w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // 2. If dynamic sections exist in database, render them serially
  if (sections && sections.length > 0) {
    return (
      <div className="space-y-6">
        {sections.map((section, idx) => {
          if (renderCustomCard) {
            return renderCustomCard(section, idx, renderFormattedContent);
          }

          return (
            <div
              key={section.id || idx}
              className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs text-left"
            >
              {/* Section Header with Serial Badge & Title */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 font-bold text-xs shrink-0">
                  সেকশন #{section.sort_order ?? idx + 1}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {section.title}
                </h2>
              </div>

              {/* Section Body */}
              <div className="text-xs sm:text-sm text-slate-650">
                {renderFormattedContent(section.content)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. Fallback to default static content if database returned empty
  return fallbackContent || (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-slate-500 text-xs">
      কোনো কনটেন্ট সেকশন পাওয়া যায়নি।
    </div>
  );
}

