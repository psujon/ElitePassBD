import React from 'react';
import { Shield } from 'lucide-react';
import PageSectionsRenderer from '../components/PageSectionsRenderer';

export default function PrivacyPolicy() {
  const fallbackPrivacyContent = (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ১. আমরা কী কী তথ্য সংগ্রহ করি (Information We Collect)
        </h3>
        <div className="text-sm text-slate-650 leading-relaxed space-y-2">
          <p>আপনি যখন আমাদের সাইটে অ্যাকাউন্ট তৈরি করেন, অর্ডার সম্পন্ন করেন কিংবা কাস্টমার সাপোর্টে যোগাযোগ করেন, তখন আমরা প্রয়োজনীয় কিছু তথ্য সংগ্রহ করি:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>অ্যাকাউন্ট সম্পর্কিত তথ্য:</strong> আপনার নাম, সক্রিয় ইমেইল অ্যাড্রেস এবং সুরক্ষিত পাসওয়ার্ড।</li>
            <li><strong>যোগাযোগের বিবরণ:</strong> হোয়াটসঅ্যাপ নম্বর এবং মোবাইল ফোন নম্বর (অর্ডার ডেলিভারি ও আপডেটের সুবিধার্থে)।</li>
            <li><strong>লেনদেনের তথ্য:</strong> আপনার অর্ডার করা ডিজিটাল প্রোডাক্ট/সাবস্ক্রিপশনের বিবরণ, পেমেন্ট মেথড (যেমন: বিকাশ, নগদ ইত্যাদি) এবং ট্রানজেকশন আইডি। (আমরা কোনো গোপন পিন বা পাসওয়ার্ড সংরক্ষণ করি না)।</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ২. সংগৃহীত তথ্যের ব্যবহার (How We Use Your Information)
        </h3>
        <div className="text-sm text-slate-650 leading-relaxed space-y-2">
          <p>আপনাকে নিরবচ্ছিন্ন ও মানসম্মত সেবা প্রদানের স্বার্থেই আপনার তথ্য ব্যবহৃত হয়:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>অর্ডারকৃত ডিজিটাল সাবস্ক্রিপশন, লাইসেন্স কি অথবা অ্যাক্টিভেশন ক্রেডেনশিয়াল সঠিক ঠিকানায় দ্রুত ডেলিভারি নিশ্চিত করতে।</li>
            <li>অর্ডারের বর্তমান অবস্থা, রিনিউয়াল রিমাইন্ডার এবং ট্র্যাকিং নোটিফিকেশন পাঠাতে।</li>
            <li>হোয়াটসঅ্যাপ বা ইমেইলের মাধ্যমে সরাসরি কাস্টমার সাপোর্ট ও প্রয়োজনীয় দিকনির্দেশনা দিতে।</li>
            <li>অননুমোদিত লেনদেন বা জালিয়াতি রোধ করে প্ল্যাটফর্মের সামগ্রিক নিরাপত্তা নিশ্চিত করতে।</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৩. তথ্যের নিরাপত্তা ও সংরক্ষণ (Data Protection & Storage)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          আপনার ব্যক্তিগত ও লেনদেনের তথ্যের সুরক্ষায় আমরা আধুনিক এনক্রিপশন (SSL) প্রযুক্তি এবং সুরক্ষিত ডাটাবেজ আর্কিটেকচার ব্যবহার করি। আপনার সম্মতি ছাড়া আমরা কোনো তৃতীয় পক্ষের নিকট আপনার ব্যক্তিগত তথ্য বিক্রয়, বিনিময় বা বাণিজ্যিক উদ্দেশ্যে হস্তান্তর করি না।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৪. কুকিজ ও ট্র্যাকিং টেকনোলজি (Cookies & Tracking)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          আমাদের প্ল্যাটফর্মে আপনার ব্রাউজিং অভিজ্ঞতা উন্নত করতে এবং কার্ট ও সেশন বজায় রাখতে কুকিজ ব্যবহৃত হয়। আপনি চাইলে আপনার ব্রাউজার সেটিংস থেকে যেকোনো সময় কুকিজ নিষ্ক্রিয় করতে পারেন।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৫. যোগাযোগ ও সহায়তার ঠিকানা (Contact & Inquiries)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          আমাদের গোপনীয়তা নীতি সম্পর্কে কোনো প্রশ্ন, পরামর্শ কিংবা তথ্যের সংশোধন প্রয়োজন হলে আমাদের অফিশিয়াল ইমেইল <strong>support@elitepassbd.com</strong> অথবা হোয়াটসঅ্যাপ হেল্পলাইনে সরাসরি যোগাযোগ করতে পারেন।
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
            <Shield className="w-3.5 h-3.5" />
            আইনি নীতিমালা ও গ্রাহক নিরাপত্তা
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            গোপনীয়তা নীতি — <span className="text-violet-600">Privacy Policy</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            ElitePassBD-এ আমরা আপনার তথ্যের গোপনীয়তাকে সর্বোচ্চ সম্মান জানাই এবং ব্যক্তিগত তথ্যের সুরক্ষায় দৃঢ় প্রতিজ্ঞ।
          </p>
        </div>

        {/* Dynamic Sections Rendered Serially */}
        <PageSectionsRenderer
          pageKey="privacy"
          fallbackContent={fallbackPrivacyContent}
        />

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            সর্বশেষ পরিমার্জন ও অনুমোদন: জুন ২০২৬ | ElitePassBD সকল অধিকার সংরক্ষিত।
          </p>
        </div>
      </div>
    </div>
  );
}
