import React from 'react';
import { Handshake } from 'lucide-react';
import PageSectionsRenderer from '../components/PageSectionsRenderer';

export default function Partners() {
  const fallbackPartnersContent = (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          পার্টনারশিপের মাধ্যমে প্রিমিয়াম সেবার নিশ্চয়তা
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          <strong>ElitePassBD</strong> শুধুমাত্র শীর্ষস্থানীয় আন্তর্জাতিক ডিজিটাল সোর্স এবং ভেরিফায়েড গ্লোবাল ডিস্ট্রিবিউটরদের সাথে অংশীদারিত্বের মাধ্যমে কাজ করে। এর মাধ্যমে আমরা নিশ্চিত করি যে আমাদের গ্রাহকরা পাচ্ছেন ১০০% আসল, বৈধ এবং মেয়াদের পূর্ণ নিশ্চয়তাযুক্ত ডিজিটাল কি ও প্রিমিয়াম সাবস্ক্রিপশন।
        </p>
        <p className="text-sm text-slate-650 leading-relaxed">
          আমরা স্থানীয় পেমেন্ট গেটওয়ে প্রোভাইডার এবং নির্ভরযোগ্য ভেন্ডরদের সাথে নিয়মিত সমন্বয় করে বাংলাদেশের ব্যবহারকারীদের জন্য ডিজিটাল কেনাকাটাকে সহজ, নিরাপদ এবং দ্রুততর করে তুলছি।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          গ্লোবাল ডিজিটাল সার্ভিসেস (Global Platforms)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          বিশ্বখ্যাত ডিজিটাল প্ল্যাটফর্ম যেমন Microsoft 365, Google Workspace, OpenAI (ChatGPT Plus), Canva Pro, Spotify এবং অন্যান্য শীর্ষ ব্র্যান্ডের জেনুইন অ্যাক্টিভেশন সোর্সিং।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          অনুমোদিত লোকাল ভেন্ডর নেটওয়ার্ক (Verified Vendors)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          আমাদের প্ল্যাটফর্মে তালিকাভুক্ত প্রত্যেক ভেন্ডর কঠোর নিরাপত্তা যাচাই এবং গুণগত মান পরীক্ষার পর যুক্ত হন। ফলে সেবা গ্রহণে কোনো প্রকার কারিগরি বা ওয়ারেন্টি ত্রুটি থাকে না।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          নিরাপদ পেমেন্ট পার্টনার্স (Payment Gateways)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          বিকাশ (bKash), নগদ (Nagad), রকেট (Rocket) সহ দেশের প্রধান এমএফএস নেটওয়ার্কের মাধ্যমে শতভাগ এনক্রিপ্টেড ও সুরক্ষিত লেনদেনের ব্যবস্থা।
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Title Section */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            <Handshake className="w-3.5 h-3.5" />
            গ্লোবাল ও লোকাল পার্টনারশিপ নেটওয়ার্ক
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            আমাদের পার্টনার্স — <span className="text-violet-600">Our Partners</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            আন্তর্জাতিক প্ল্যাটফর্ম প্রোভাইডার, অনুমোদিত ভেন্ডর এবং নির্ভরযোগ্য লোকাল পেমেন্ট পার্টনারদের সমন্বয়ে গঠিত আমাদের শক্তিশালী সহযোগী নেটওয়ার্ক।
          </p>
        </div>

        {/* Dynamic Sections Rendered Serially */}
        <PageSectionsRenderer
          pageKey="partners"
          fallbackContent={fallbackPartnersContent}
        />

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            আমাদের সাথে পার্টনার বা ভেন্ডর হিসেবে যুক্ত হতে চাইলে যোগাযোগ করুন আমাদের অফিসিয়াল সাপোর্টে।
          </p>
        </div>
      </div>
    </div>
  );
}
