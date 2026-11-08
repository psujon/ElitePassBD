import React from 'react';
import { ShieldAlert, FileText, CheckCircle2, Mail, AlertTriangle, Send } from 'lucide-react';

export default function DmcaPolicy() {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/80 shadow-xs">
          
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-violet-50 text-violet-600 border border-violet-100/60 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xxs font-bold text-violet-600 uppercase tracking-wider">কপিরাইট ও বৌদ্ধিক সম্পত্তি</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">ডিএমসিএ পলিসি (DMCA Policy)</h1>
            </div>
          </div>

          <p className="text-slate-500 text-xs leading-relaxed mb-8">
            সর্বশেষ আপডেট: জুন ২০২৬। <strong>ElitePassBD</strong> অন্যের কপিরাইট ও মেধা-সম্পদের অধিকারকে সম্পূর্ণ শ্রদ্ধা করে এবং ডিজিটাল মিলেনিয়াম কপিরাইট অ্যাক্ট (Digital Millennium Copyright Act - DMCA)-সহ সকল প্রযোজ্য বুদ্ধিবৃত্তিক সম্পত্তি আইন মেনে চলতে প্রতিশ্রুতিবদ্ধ। এই পাতায় আমাদের কপিরাইট লঙ্ঘন সংক্রান্ত নোটিশ ও নীতিমালা বিস্তারিত উল্লেখ করা হলো।
          </p>

          <div className="space-y-8 text-xs">
            
            {/* Section 1 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <FileText className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ১. কপিরাইট লঙ্ঘন সংক্রান্ত বিজ্ঞপ্তি (Copyright Infringement Notice)
              </h2>
              <p className="text-slate-650 leading-relaxed mb-2">
                আপনি যদি কোনো কপিরাইট স্বত্বাধিকারী হন কিংবা তার অনুমোদিত প্রতিনিধি হন এবং বিশ্বাস করেন যে আমাদের ওয়েবসাইটে প্রদর্শিত কোনো কনটেন্ট, লোগো বা উপাদান আপনার কপিরাইট লঙ্ঘন করেছে, তবে অনুগ্রহ করে আমাদের নির্দিষ্ট কপিরাইট প্রতিনিধির নিকট লিখিত ডিএমসিএ নোটিশ প্রেরণ করুন।
              </p>
            </div>

            {/* Section 2 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
                ২. নোটিশে যেসকল তথ্য থাকা আবশ্যক (Required Information)
              </h2>
              <div className="text-slate-650 leading-relaxed space-y-2">
                <p>একটি কার্যকর নোটিশে নিচের বিষয়গুলো স্পষ্টভাবে উল্লেখ থাকতে হবে:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>কপিরাইট স্বত্বাধিকারী বা তার আইনানুগ প্রতিনিধির একটি ভৌত (physical) বা ইলেকট্রনিক স্বাক্ষর।</li>
                  <li>যে কপিরাইটযুক্ত কাজের লঙ্ঘন হয়েছে বলে দাবি করা হচ্ছে, তার স্পষ্ট শনাক্তকরণ বিবরণ।</li>
                  <li>লঙ্ঘনকারী কনটেন্টটির সুনির্দিষ্ট লিঙ্ক (URL) বা আমাদের সাইটে তার সঠিক অবস্থান।</li>
                  <li>আপনার সাথে যোগাযোগের সম্পূর্ণ তথ্য: নাম, ঠিকানা, টেলিফোন/মোবাইল নম্বর এবং সক্রিয় ইমেইল অ্যাড্রেস।</li>
                  <li>একটি শপথযুক্ত বিবৃতি যে, উক্ত কনটেন্ট ব্যবহারে মূল কপিরাইট মালিক বা আইনের কোনো সম্মতি নেই।</li>
                  <li>একটি বিবৃতি যে নোটিশে প্রদত্ত সকল তথ্য নির্ভুল এবং মিথ্যা সাক্ষ্য আইনের আওতায় আপনি উক্ত কপিরাইট মালিকের পক্ষে কাজ করার ক্ষমতাপ্রাপ্ত।</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                ৩. নোটিশ প্রাপ্তির পর আমাদের পদক্ষেপ (Our Actions)
              </h2>
              <p className="text-slate-650 leading-relaxed">
                সঠিক ও আইনানুগ ডিএমসিএ নোটিশ পাওয়ার পর, ElitePassBD অবিলম্বে উল্লিখিত লঙ্ঘনকারী উপাদান পর্যালোচনা করবে এবং প্রযোজ্য ক্ষেত্রে অনতিবিলম্বে তা সাইট থেকে অপসারণ বা প্রবেশাধিকার স্থগিত করবে। একই সাথে সংশ্লিষ্ট আপলোডকারী বা ব্যবহারকারীকে অবহিত করা হবে।
              </p>
            </div>

            {/* Section 4 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Send className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ৪. কাউন্টার নোটিফিকেশন প্রক্রিয়া (Counter-Notification)
              </h2>
              <p className="text-slate-650 leading-relaxed">
                যদি কোনো ব্যবহারকারী বিশ্বাস করেন যে ভুলবশত বা ভুল পরিচয়ের কারণে তার কোনো উপাদান অপসারণ করা হয়েছে, তবে তিনি প্রয়োজনীয় প্রমাণ ও আইনি সম্মতির মাধ্যমে আমাদের কাছে একটি লিখিত কাউন্টার নোটিফিকেশন দাখিল করতে পারেন।
              </p>
            </div>

            {/* Section 5: Contact Info */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Mail className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ৫. কপিরাইট সংক্রান্ত যোগাযোগের ঠিকানা (Designated Contact)
              </h2>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1 text-slate-700">
                <p className="font-semibold text-slate-900">ElitePassBD Legal & DMCA Department</p>
                <p>ইমেইল: <a href="mailto:support@elitepassbd.com" className="text-violet-600 font-bold hover:underline">support@elitepassbd.com</a></p>
                <p>হেল্পলাইন: হোয়াটসঅ্যাপ সাপোর্ট সেন্টার</p>
                <p>ঠিকানা: ঢাকা, বাংলাদেশ</p>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>আইনসম্মত ও সৎ ডিজিটাল সেবা বজায় রাখতে ElitePassBD প্রতিশ্রুতিবদ্ধ।</span>
          </div>

        </div>
      </div>
    </div>
  );
}

