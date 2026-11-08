import React from 'react';
import { Scale, Info, HelpCircle, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/80 shadow-xs">
          
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-violet-50 text-violet-600 border border-violet-100/60 rounded-2xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xxs font-bold text-violet-600 uppercase tracking-wider">আইনি নীতিমালা ও চুক্তি</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">ব্যবহারের শর্তাবলী (Terms of Service)</h1>
            </div>
          </div>

          <p className="text-slate-500 text-xs leading-relaxed mb-8">
            <strong>ElitePassBD</strong> প্ল্যাটফর্মে আপনাকে স্বাগতম। আমাদের ওয়েবসাইট ভিজিট, ব্যবহার কিংবা কোনো পণ্য ক্রয়ের মাধ্যমে আপনি নিচের সকল শর্তাবলী মেনে নিতে সম্মত হচ্ছেন। অর্ডার সম্পন্ন করার পূর্বে অনুগ্রহ করে নিয়মাবলী ভালো করে পড়ে নিন।
          </p>

          <div className="space-y-8 text-xs">
            {/* Section 1 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Info className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ১. শর্তাবলীর স্বীকৃতি (Acceptance of Terms)
              </h2>
              <p className="text-slate-650 leading-relaxed">
                আমাদের ওয়েবসাইটে অ্যাকাউন্ট তৈরি কিংবা অর্ডার প্রদান করে আপনি নিশ্চিত করছেন যে আপনার বয়স ন্যূনতম ১৮ বছর (অথবা অভিভাবকের অনুমতি রয়েছে) এবং আপনি এই শর্তাবলীর প্রতি পূর্ণাঙ্গভাবে দায়বদ্ধ থাকতে সম্মত। আপনি যদি এই শর্তাবলী মেনে নিতে সম্মত না হন, তবে অনুগ্রহ করে আমাদের প্ল্যাটফর্ম ব্যবহার করা থেকে বিরত থাকুন।
              </p>
            </div>

            {/* Section 2 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <FileText className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ২. ডিজিটাল পণ্য ও ডেলিভারি নীতিমালা (Digital Products & Delivery)
              </h2>
              <div className="text-slate-650 leading-relaxed space-y-2">
                <p>
                  ElitePassBD প্রিমিয়াম ডিজিটাল লাইসেন্স কি, সাবস্ক্রিপশন অ্যাকাউন্ট এবং ভেরিফায়েড অ্যাক্টিভেশন সেবা সরবরাহ করে। যেহেতু এগুলো সম্পূর্ণ ডিজিটাল সেবা, তাই নিচের ডেলিভারি নীতিমালা প্রযোজ্য হবে:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>ইলেকট্রনিক ডেলিভারি:</strong> পেমেন্ট সফলভাবে যাচাই হওয়ার পর ডিজিটাল লাইসেন্স বা অ্যাকাউন্টের বিবরণী আপনার ড্যাশবোর্ডের "Order Tracking" সেকশনে আপডেট করা হবে এবং স্বয়ংক্রিয়ভাবে হোয়াটসঅ্যাপ ও ইমেইলে পাঠিয়ে দেওয়া হবে।</li>
                  <li><strong>কার্যকারিতা যাচাই:</strong> প্রতিটি লাইসেন্স বা অ্যাকাউন্ট ক্রেডেনশিয়াল গ্রাহকের কাছে পাঠানোর পূর্বে আমাদের সিস্টেমে শতভাগ কার্যকারিতা যাচাই করে নেওয়া হয়।</li>
                  <li><strong>চূড়ান্ত ক্রয়:</strong> ডিজিটাল পণ্যের প্রকৃতির কারণে একবার সফল ডেলিভারির পর স্বাভাবিক ক্ষেত্রে অর্ডার বাতিল করা যায় না। তবে কোড বা অ্যাকাউন্টে কোনো সমস্যা থাকলে আমরা নিয়ম অনুযায়ী তাৎক্ষণিক রিপ্লেসমেন্ট প্রদান করি।</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ৩. পেমেন্ট ও মূল্য নির্ধারণ পলিসি (Payment & Pricing Policy)
              </h2>
              <div className="text-slate-650 leading-relaxed space-y-2">
                <p>ওয়েবসাইটে প্রদর্শিত সকল পণ্যের মূল্য বাংলাদেশি টাকা (BDT / ৳)-তে নির্ধারিত। আন্তর্জাতিক বাজার ও ডলারের মূল্য ওঠানামার ওপর ভিত্তি করে পূর্ব নোটিশ ছাড়াই যেকোনো সময় মূল্য সমন্বয়ের অধিকার আমাদের থাকবে।</p>
                <p>
                  পেমেন্ট সম্পন্ন করার সময় গ্রাহককে সঠিক ট্রানজেকশন আইডি ও প্রেরক নম্বর প্রদান করতে হবে। কোনো সন্দেহজনক বা অনিয়মিত লেনদেনের ক্ষেত্রে সুরক্ষার স্বার্থে অর্ডার সাময়িকভাবে স্থগিত রেখে অতিরিক্ত যাচাই সম্পন্ন করা হতে পারে।
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <HelpCircle className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ৪. দায়বদ্ধতার সীমাবদ্ধতা (Limitations of Liability)
              </h2>
              <p className="text-slate-650 leading-relaxed">
                ElitePassBD ডিজিটাল সার্ভিসের বৈধ অ্যাক্টিভেশন নিশ্চিত করে। তবে কোনো তৃতীয় পক্ষ প্ল্যাটফর্ম (যেমন: Netflix, Spotify, OpenAI, Microsoft ইত্যাদি) যদি তাদের অভ্যন্তরীণ নীতিমালা পরিবর্তন করে কিংবা ব্যবহারকারীর নিজস্ব ভুলের কারণে অ্যাকাউন্টে কোনো সীমাবদ্ধতা আরোপ করে, তবে সেক্ষেত্রে আমাদের সহায়তা নীতিমালা অনুযায়ী পদক্ষেপ নেওয়া হবে, কিন্তু কোনো প্রকার পরোক্ষ ক্ষতিপূরণ দাবি প্রযোজ্য হবে না।
              </p>
            </div>

            {/* Section 5 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Scale className="w-4 h-4 text-violet-600 mr-2 shrink-0" />
                ৫. গ্রাহকের দায়িত্ব ও সততা
              </h2>
              <p className="text-slate-650 leading-relaxed">
                গ্রাহক হিসেবে আপনি প্রদত্ত লাইসেন্স বা অ্যাকাউন্ট ব্যবহারের সময় নির্দিষ্ট নিয়মাবলী মেনে চলতে সম্মত। শেয়ার্ড অ্যাকাউন্টের ক্ষেত্রে পাসওয়ার্ড বা প্রোফাইল সেটিংস পরিবর্তন করা সম্পূর্ণ নিষিদ্ধ এবং এমন কার্যকলাপের ফলে ওয়ারেন্টি বাতিল হতে পারে।
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>স্বচ্ছতা ও বিশ্বস্ত সেবাই ElitePassBD-এর মূল লক্ষ্য। যেকোনো তথ্যের জন্য আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।</span>
          </div>
        </div>
      </div>
    </div>
  );
}
