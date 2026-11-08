import React from 'react';
import { HelpCircle, RefreshCw, AlertCircle, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Title */}
        <div className="space-y-2.5 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            <RefreshCw className="w-3.5 h-3.5" />
            গ্রাহক সন্তুষ্টি ও রিটার্ন নীতিমালা
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">রিফান্ড পলিসি (Refund Policy)</h1>
          <p className="text-slate-500 text-xs">সর্বশেষ আপডেট: জুন ২০২৬</p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-6 text-slate-750 text-sm leading-relaxed">
          
          <div className="space-y-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
              <h3>১. ডিজিটাল পণ্যের প্রকৃতি (Nature of Digital Goods)</h3>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm">
              যেহেতু <strong>ElitePassBD</strong> সম্পূর্ণ ডিজিটাল সেবা (যেমন: সাবস্ক্রিপশন অ্যাকাউন্ট, সফটওয়্যার লাইসেন্স কি, গিফট কার্ড ও অ্যাক্টিভেশন লিঙ্ক) সরবরাহ করে, তাই একবার কোনো লাইসেন্স বা অ্যাকাউন্ট ক্রেডেনশিয়াল হোয়াটসঅ্যাপ, ইমেইল অথবা ইউজার ড্যাশবোর্ডে সফলভাবে প্রদান করা হলে তা তাৎক্ষণিকভাবে ব্যবহৃত হিসেবে গণ্য হয়। এই কারণে মনের পরিবর্তন (change-of-mind) বা ভুলবশত অর্ডারের ক্ষেত্রে কোনো সাধারণ রিফান্ড প্রদান করা সম্ভব নয়।
            </p>
          </div>

          <div className="space-y-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3>২. অকার্যকর বা ত্রুটিপূর্ণ লাইসেন্সের ক্ষেত্রে রিপ্লেসমেন্ট ও রিফান্ড</h3>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm">
              আমরা আমাদের প্রতিটি পণ্যের গুণমান ও কার্যকারিতা শতভাগ নিশ্চিত করে ডেলিভারি দিয়ে থাকি। এর পরেও যদি কোনো অনাকাঙ্ক্ষিত কারণে প্রদত্ত কি বা অ্যাকাউন্টে ত্রুটি দেখা দেয়:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-650 text-xs sm:text-sm">
              <li>অর্ডার ডেলিভারির <strong>৪৮ ঘণ্টার মধ্যে</strong> আমাদের সাপোর্ট সেন্টারে টিকিট তৈরি করে অথবা হোয়াটসঅ্যাপ হেল্পলাইনে জানাতে হবে।</li>
              <li>সমস্যার প্রমাণস্বরূপ স্পষ্ট স্ক্রিনশট বা ভিডিও প্রুফ প্রদান করতে হবে।</li>
              <li>আমাদের টেকনিক্যাল টিম সমস্যাটি যাচাই করে প্রথমে দ্রুততম সময়ে নতুন কার্যকর <strong>রিপ্লেসমেন্ট (Replacement)</strong> প্রদান করবে।</li>
              <li>যদি কোনো কারণে রিপ্লেসমেন্ট প্রদান করা সম্ভব না হয়, তবে তাৎক্ষণিকভাবে সম্পূর্ণ অর্থ <strong>রিফান্ড</strong> করে দেওয়া হবে।</li>
            </ul>
          </div>

          <div className="space-y-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3>৩. ভেরিফিকেশন বিলম্ব ও অর্ডার বাতিল</h3>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm">
              যেসব অর্ডারে ম্যানুয়াল পেমেন্ট যাচাইকরণের প্রয়োজন হয় (যেমন বিকাশ/নগদ ট্রানজেকশন), তা সাধারণত ১ থেকে ১২ ঘণ্টার মধ্যে যাচাই সম্পন্ন হয়। যদি স্টক ঘাটতি কিংবা কোনো অনিবার্য কারণে আমরা আপনার অর্ডার সরবরাহ করতে ব্যর্থ হই, তবে অবিলম্বে সম্পূর্ণ অর্থ রিফান্ড করা হবে।
            </p>
          </div>

          <div className="space-y-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              <h3>৪. রিফান্ড প্রসেসিং সময় ও মাধ্যম (Refund Processing)</h3>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm">
              অনুমোদিত রিফান্ডের অর্থ সরাসরি গ্রাহকের মূল পেমেন্ট মাধ্যমে (বিকাশ অথবা নগদ নম্বর) <strong>৩ থেকে ৫ কার্যদিবসের মধ্যে</strong> ফেরত পাঠানো হবে। রিফান্ডের জন্য গ্রাহকের কাছ থেকে কোনো প্রকার অতিরিক্ত ফি বা চার্জ কর্তন করা হবে না।
            </p>
          </div>

          {/* Help Callout */}
          <div className="bg-violet-50 border border-violet-100/60 p-6 rounded-3xl flex items-start space-x-3.5">
            <HelpCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-slate-850 font-bold text-sm">সহায়তা প্রয়োজন?</h4>
              <p className="text-slate-650 text-xs mt-1 leading-relaxed">
                এই নীতিমালা সম্পর্কিত কোনো জিজ্ঞাসা থাকলে কিংবা লাইসেন্স অ্যাক্টিভেশনে কোনো অসুবিধা হলে দ্বিধাহীনভাবে আমাদের সাপোর্ট সেন্টারে টিকিট ওপেন করুন অথবা সরাসরি আমাদের অফিসিয়াল হোয়াটসঅ্যাপ হেল্পলাইনে মেসেজ দিন।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
