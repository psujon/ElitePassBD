import React from 'react';
import { RotateCcw } from 'lucide-react';
import PageSectionsRenderer from '../components/PageSectionsRenderer';

export default function RefundPolicy() {
  const fallbackRefundContent = (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ১. ডিজিটাল পণ্যের রিফান্ড সংক্রান্ত সাধারণ নিয়ম (General Refund Policy)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          যেহেতু আমাদের পণ্যগুলো ভার্চুয়াল এবং ডিজিটাল কোড/লাইসেন্স যা হস্তান্তরের সাথে সাথেই সক্রিয় হয়ে যায়, তাই সাধারণত ডেলিভারি সম্পন্ন হওয়ার পর রিফান্ড প্রযোজ্য হয় না। তবে গ্রাহকদের স্বার্থ রক্ষায় আমরা সুনির্দিষ্ট ত্রুটির ক্ষেত্রে পূর্ণ রিফান্ড ও রিপ্লেসমেন্ট সুবিধা দিয়ে থাকি।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ২. যেসকল ক্ষেত্রে রিফান্ড পাওয়ার যোগ্য (Eligibility for Refund)
        </h3>
        <div className="text-sm text-slate-650 leading-relaxed space-y-2">
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>অকার্যকর কোড বা ত্রুটিযুক্ত লাইসেন্স:</strong> যদি ডেলিভারিকৃত লাইসেন্সটি শুরু থেকেই কাজ না করে এবং আমাদের সাপোর্ট টিম ২৪ ঘণ্টার মধ্যে তা সমাধান বা বিকল্প দিতে ব্যর্থ হয়।</li>
            <li><strong>স্টক ঘাটতি বা ডেলিভারিতে ব্যর্থতা:</strong> পেমেন্ট সফল হওয়ার পর যদি নির্দিষ্ট মেয়াদের মধ্যে আমরা কাঙ্ক্ষিত প্রোডাক্ট ডেলিভারি দিতে অক্ষম হই।</li>
            <li><strong>দ্বৈত বা অতিরিক্ত পেমেন্ট:</strong> প্রযুক্তিগত ত্রুটির কারণে গ্রাহকের অ্যাকাউন্ট থেকে একই অর্ডারের জন্য একাধিকবার টাকা কেটে নেওয়া হলে।</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৩. যেসকল ক্ষেত্রে রিফান্ড প্রযোজ্য নয় (Non-Refundable Circumstances)
        </h3>
        <div className="text-sm text-slate-650 leading-relaxed space-y-2">
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>ভুলবশত অন্য কোনো পণ্য অর্ডার করে তা ডেলিভারি গ্রহণ করার পর।</li>
            <li>গ্রাহকের ডিভাইস বা ইন্টারনেট সমস্যাজনিত কারণে সফটওয়্যার ব্যবহারে অক্ষমতা।</li>
            <li>শেয়ার্ড অ্যাকাউন্টের রুলস ভঙ্গ করা (যেমন পাসওয়ার্ড পরিবর্তন বা অতিরিক্ত ডিভাইসে লগইন)।</li>
            <li>সাবস্ক্রিপশনের মেয়াদ শেষের পর রিফান্ড দাবি করা।</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৪. রিফান্ড প্রক্রিয়া ও সময়সীমা (Refund Process & Timeline)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          রিফান্ড অনুমোদনের পর অর্থ গ্রাহকের প্রেরিত মূল মাধ্যমে (বিকাশ বা নগদ নম্বর) <strong>৩ থেকে ৫ কার্যদিবসের মধ্যে</strong> ফেরত পাঠানো হবে। রিফান্ডের জন্য গ্রাহকের কাছ থেকে কোনো প্রকার অতিরিক্ত ফি বা চার্জ কর্তন করা হবে না।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৫. সহায়তা প্রয়োজন? (Support & Claims)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          এই নীতিমালা সম্পর্কিত কোনো জিজ্ঞাসা থাকলে কিংবা লাইসেন্স অ্যাক্টিভেশনে কোনো অসুবিধা হলে দ্বিধাহীনভাবে আমাদের সাপোর্ট সেন্টারে টিকিট ওপেন করুন অথবা সরাসরি আমাদের অফিসিয়াল হোয়াটসঅ্যাপ হেল্পলাইনে মেসেজ দিন।
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            <RotateCcw className="w-3.5 h-3.5" />
            স্বচ্ছ ও নির্ভরযোগ্য আর্থিক নীতি
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            রিফান্ড পলিসি — <span className="text-violet-600">Refund Policy</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            ElitePassBD-এ গ্রাহক সন্তুষ্টিই আমাদের সর্বোচ্চ অগ্রাধিকার। আমাদের রিফান্ড ও রিটার্ন শর্তাবলী জেনে নিন।
          </p>
        </div>

        {/* Dynamic Sections Rendered Serially */}
        <PageSectionsRenderer
          pageKey="refund"
          fallbackContent={fallbackRefundContent}
        />

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            রিফান্ড বা পেমেন্ট সংক্রান্ত সহায়তার জন্য ট্রানজেকশন আইডিসহ আমাদের হোয়াটসঅ্যাপ হেল্পলাইনে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
}
