import React from 'react';
import { Shield, Lock, Eye, FileText, Bell, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/80 shadow-xs">
          
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-violet-50 text-violet-600 border border-violet-100/60 rounded-2xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xxs font-bold text-violet-600 uppercase tracking-wider">আইনি নীতিমালা ও চুক্তি</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">গোপনীয়তা নীতি (Privacy Policy)</h1>
            </div>
          </div>

          <p className="text-slate-500 text-xs leading-relaxed mb-8">
            সর্বশেষ আপডেট: জুন ২০২৬। <strong>ElitePassBD</strong>-এ আমরা আপনার তথ্যের গোপনীয়তাকে সর্বোচ্চ সম্মান জানাই এবং আপনার ব্যক্তিগত তথ্য সুরক্ষায় দৃঢ় প্রতিজ্ঞ। আমাদের ওয়েবসাইট বা সেবা ব্যবহারের সময় আমরা কীভাবে আপনার তথ্য সংগ্রহ, সংরক্ষণ ও ব্যবহার করি—তা এই নীতিমালায় বিস্তারিত তুলে ধরা হলো।
          </p>

          <div className="space-y-8 text-xs">
            {/* Section 1 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Lock className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ১. আমরা কী কী তথ্য সংগ্রহ করি (Information We Collect)
              </h2>
              <div className="text-slate-650 leading-relaxed space-y-2">
                <p>আপনি যখন আমাদের সাইটে অ্যাকাউন্ট তৈরি করেন, অর্ডার সম্পন্ন করেন কিংবা কাস্টমার সাপোর্টে যোগাযোগ করেন, তখন আমরা প্রয়োজনীয় কিছু তথ্য সংগ্রহ করি:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>অ্যাকাউন্ট সম্পর্কিত তথ্য:</strong> আপনার নাম, সক্রিয় ইমেইল অ্যাড্রেস এবং সুরক্ষিত পাসওয়ার্ড।</li>
                  <li><strong>যোগাযোগের বিবরণ:</strong> হোয়াটসঅ্যাপ নম্বর এবং মোবাইল ফোন নম্বর (অর্ডার ডেলিভারি ও আপডেটের সুবিধার্থে)।</li>
                  <li><strong>লেনদেনের তথ্য:</strong> আপনার অর্ডার করা ডিজিটাল প্রোডাক্ট/সাবস্ক্রিপশনের বিবরণ, পেমেন্ট মেথড (যেমন: বিকাশ, নগদ ইত্যাদি) এবং ট্রানজেকশন আইডি। (আমরা কোনো গোপন পিন বা পাসওয়ার্ড সংরক্ষণ করি না)।</li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Eye className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ২. সংগৃহীত তথ্যের ব্যবহার (How We Use Your Information)
              </h2>
              <div className="text-slate-650 leading-relaxed space-y-2">
                <p>আপনাকে নিরবচ্ছিন্ন ও মানসম্মত সেবা প্রদানের স্বার্থেই আপনার তথ্য ব্যবহৃত হয়:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>অর্ডারকৃত ডিজিটাল সাবস্ক্রিপশন, লাইসেন্স কি অথবা অ্যাক্টিভেশন ক্রেডেনশিয়াল সঠিক ঠিকানায় দ্রুত ডেলিভারি নিশ্চিত করতে।</li>
                  <li>অর্ডারের বর্তমান অবস্থা, রিনিউয়াল রিমাইন্ডার এবং ট্র্যাকিং নোটিফিকেশন পাঠাতে।</li>
                  <li>হোয়াটসঅ্যাপ বা ইমেইলের মাধ্যমে সরাসরি কাস্টমার সাপোর্ট ও প্রয়োজনীয় দিকনির্দেশনা দিতে।</li>
                  <li>অননুমোদিত লেনদেন বা জালিয়াতি রোধ করে প্ল্যাটফর্মের সামগ্রিক নিরাপত্তা নিশ্চিত করতে।</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <FileText className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ৩. তথ্যের সুরক্ষা ও নিরাপত্তা (Data Security & Retention)
              </h2>
              <div className="text-slate-650 leading-relaxed space-y-2">
                <p>
                  আপনার তথ্যের সুরক্ষার জন্য আমরা সর্বাধুনিক প্রশাসনিক, প্রযুক্তিগত ও ইলেকট্রনিক সিকিউরিটি প্রটোকল ব্যবহার করি। আপনার অ্যাকাউন্টের পাসওয়ার্ড শক্তিশালী ক্রিপ্টোগ্রাফিক হ্যাশিংয়ের মাধ্যমে সংরক্ষিত থাকে, ফলে কোনো অবস্থাতেই তা প্লেইন টেক্সট হিসেবে দৃশ্যমান থাকে না।
                </p>
                <p>
                  আপনার সাবস্ক্রিপশন ব্যবস্থাপনা ও সেবার প্রয়োজনে যতদিন তথ্য প্রয়োজন ততদিনই তা নিরাপদে সংরক্ষিত রাখা হয়। আইনি বাধ্যবাধকতা ব্যতীত অপ্রয়োজনে আমরা অতিরিক্ত তথ্য সংরক্ষণ করি না।
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Shield className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ৪. তৃতীয় পক্ষের সাথে তথ্য আদান-প্রদান (Information Sharing)
              </h2>
              <p className="text-slate-650 leading-relaxed">
                ElitePassBD কখনোই কোনো ব্যবহারকারীর ব্যক্তিগত তথ্য কোনো বাণিজ্যিক উদ্দেশ্যে বিক্রি, ভাড়া বা বিনিময় করে না। শুধুমাত্র আপনার অর্ডার যাচাইকরণের জন্য পেমেন্ট গেটওয়ে প্রোভাইডার (যেমন বিকাশ বা নগদ) অথবা দেশের প্রচলিত আইনের বাধ্যবাধকতা ছাড়া কোনো তৃতীয় পক্ষের সাথে তথ্য শেয়ার করা হয় না।
              </p>
            </div>

            {/* Section 5 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Bell className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ৫. নীতিমালা পরিবর্তন ও আপনার অধিকার
              </h2>
              <p className="text-slate-650 leading-relaxed">
                ElitePassBD যেকোনো সময় তার নীতিমালায় প্রয়োজনীয় পরিবর্তন বা পরিমার্জন করার অধিকার সংরক্ষণ করে। যেকোনো বড় ধরনের পরিবর্তনে এই পাতায় আপডেট তারিখ প্রকাশ করা হবে। আপনার অ্যাকাউন্ট বা সংরক্ষিত তথ্য আপডেট বা সংশোধন করার প্রয়োজন হলে আমাদের সাপোর্ট সেন্টারে যোগাযোগ করতে পারেন।
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>আপনার গোপনীয়তা ও সুরক্ষা নিশ্চিত করাই ElitePassBD-এর প্রধান অগ্রাধিকার।</span>
          </div>
        </div>
      </div>
    </div>
  );
}
