import React from 'react';
import { ShieldCheck } from 'lucide-react';
import PageSectionsRenderer from '../components/PageSectionsRenderer';

export default function DmcaPolicy() {
  const fallbackDmcaContent = (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ১. কপিরাইট লঙ্ঘন সংক্রান্ত বিজ্ঞপ্তি (Copyright Infringement Notice)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          আপনি যদি কোনো কপিরাইট স্বত্বাধিকারী হন কিংবা তার অনুমোদিত প্রতিনিধি হন এবং বিশ্বাস করেন যে আমাদের ওয়েবসাইটে প্রদর্শিত কোনো কনটেন্ট, লোগো বা উপাদান আপনার কপিরাইট লঙ্ঘন করেছে, তবে অনুগ্রহ করে আমাদের নির্দিষ্ট কপিরাইট প্রতিনিধির নিকট লিখিত ডিএমসিএ নোটিশ প্রেরণ করুন।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ২. নোটিশে যেসকল তথ্য থাকা আবশ্যক (Required Information)
        </h3>
        <div className="text-sm text-slate-650 leading-relaxed space-y-2">
          <p>একটি কার্যকর নোটিশে অবশ্যই নিচের তথ্যসমূহ অন্তর্ভুক্ত থাকতে হবে:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>কপিরাইট স্বত্বাধিকারীর শারীরিক বা ইলেকট্রনিক স্বাক্ষর।</li>
            <li>যে কপিরাইটযুক্ত উপাদান লঙ্ঘিত হয়েছে বলে দাবি করা হচ্ছে তার স্পষ্ট বিবরণ।</li>
            <li>আমাদের ওয়েবসাইটে লঙ্ঘনকারী উপাদানের সুনির্দিষ্ট ইউআরএল (URL) বা লিংক।</li>
            <li>আপনার সাথে যোগাযোগের পর্যাপ্ত ঠিকানা, সক্রিয় টেলিফোন/হোয়াটসঅ্যাপ নম্বর এবং ইমেইল অ্যাড্রেস।</li>
            <li>একটি লিখিত ঘোষণা যে আপনি বিশ্বাস করেন বিরোধপূর্ণ ব্যবহারটি স্বত্বাধিকারী দ্বারা অনুমোদিত নয়।</li>
            <li>মিথ্যা সাক্ষ্য আইনের আওতায় একটি বিবৃতি যে নোটিশের তথ্যসমূহ সঠিক ও নির্ভুল।</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৩. নোটিশ প্রাপ্তির পর আমাদের পদক্ষেপ (Our Actions)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          সঠিক ও আইনানুগ ডিএমসিএ নোটিশ পাওয়ার পর, ElitePassBD অবিলম্বে উল্লিখিত লঙ্ঘনকারী উপাদান পর্যালোচনা করবে এবং প্রযোজ্য ক্ষেত্রে অনতিবিলম্বে তা সাইট থেকে অপসারণ বা প্রবেশাধিকার স্থগিত করবে।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৪. কাউন্টার নোটিফিকেশন প্রক্রিয়া (Counter-Notification)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          যদি কোনো ব্যবহারকারী বিশ্বাস করেন যে ভুলবশত বা ভুল পরিচয়ের কারণে তার কোনো উপাদান অপসারণ করা হয়েছে, তবে তিনি প্রয়োজনীয় প্রমাণ ও আইনি সম্মতির মাধ্যমে আমাদের কাছে একটি লিখিত কাউন্টার নোটিফিকেশন দাখিল করতে পারেন।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৫. কপিরাইট সংক্রান্ত যোগাযোগের ঠিকানা (Designated Contact)
        </h3>
        <div className="text-sm text-slate-650 leading-relaxed">
          <p><strong>ElitePassBD Legal & DMCA Department</strong></p>
          <p>ইমেইল: <a href="mailto:support@elitepassbd.com" className="text-violet-600 underline">support@elitepassbd.com</a></p>
          <p>হেল্পলাইন: অফিসিয়াল হোয়াটসঅ্যাপ সাপোর্ট সেন্টার</p>
          <p>ঠিকানা: ঢাকা, বাংলাদেশ</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            ডিজিটাল মিলেনিয়াম কপিরাইট আইন নীতিমালা
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            ডিএমসিএ পলিসি — <span className="text-violet-600">DMCA Policy</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            মেধাসম্পদ অধিকার ও কপিরাইট লঙ্ঘন সংক্রান্ত নোটিশ ও প্রত্যাহারের আনুষ্ঠানিক নীতিমালা।
          </p>
        </div>

        {/* Dynamic Sections Rendered Serially */}
        <PageSectionsRenderer
          pageKey="dmca"
          fallbackContent={fallbackDmcaContent}
        />

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            কপিরাইট নোটিশ বা অনুসন্ধানের জন্য অনুগ্রহ করে সরাসরি আমাদের লিগ্যাল ইমেইলে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
}
