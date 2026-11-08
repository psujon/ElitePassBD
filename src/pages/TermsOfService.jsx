import React from 'react';
import { Scale } from 'lucide-react';
import PageSectionsRenderer from '../components/PageSectionsRenderer';

export default function TermsOfService() {
  const fallbackTermsContent = (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ১. সাধারণ শর্তাবলী ও গ্রহণযোগ্যতা (Acceptance of Terms)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          <strong>ElitePassBD</strong> প্ল্যাটফর্মে প্রবেশ, অ্যাকাউন্ট তৈরি কিংবা কোনো ডিজিটাল পণ্য ক্রয়ের মাধ্যমে আপনি এই শর্তাবলীর প্রতি পূর্ণ সম্মতি প্রকাশ করছেন। যদি আপনি এই শর্তগুলোর কোনো অংশের সাথে একমত না হন, তবে অনুগ্রহ করে আমাদের পরিষেবা গ্রহণ থেকে বিরত থাকুন।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ২. ডিজিটাল পণ্য ও লাইসেন্স ব্যবহার নীতি (Product Usage Rules)
        </h3>
        <div className="text-sm text-slate-650 leading-relaxed space-y-2">
          <p>আমাদের কাছ থেকে কেনা প্রতিটি ডিজিটাল সাবস্ক্রিপশন ও সফটওয়্যার লাইসেন্স ব্যবহারের ক্ষেত্রে নির্দিষ্ট নিয়মাবলী প্রযোজ্য:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>শেয়ার্ড অ্যাকাউন্ট (Shared Access):</strong> শুধুমাত্র অনুমোদিত নির্দিষ্ট ডিভাইসে ব্যবহার করতে হবে। অ্যাকাউন্টের ইমেইল, পাসওয়ার্ড বা রিকভারি তথ্যে কোনো পরিবর্তন আনা সম্পূর্ণ নিষিদ্ধ।</li>
            <li><strong>প্রাইভেট / পার্সোনাল লাইসেন্স (Private Account):</strong> গ্রাহকের নিজস্ব ইমেইলে অ্যাক্টিভ করা হলে তিনি নিজ দায়িত্বে তা পরিচালনা করবেন।</li>
            <li><strong>অননুমোদিত পুনর্বিক্রয়:</strong> আমাদের অনুমতি ব্যতীত কোনো লাইসেন্স বা সাবস্ক্রিপশন তৃতীয় পক্ষের কাছে পুনরায় বিক্রয় বা বিতরণ করা যাবে না।</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৩. পেমেন্ট ও ডেলিভারি সংক্রান্ত শর্ত (Payment & Delivery)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          গ্রাহককে অবশ্যই সঠিক ও বৈধ বিকাশ, নগদ বা ব্যাংকিং চ্যানেলের মাধ্যমে পূর্ণ পেমেন্ট সম্পন্ন করতে হবে। পেমেন্ট যাচাইয়ের পর ডিজিটাল কোড বা লগইন অ্যাক্সেস দ্রুততম সময়ে সরবরাহ করা হবে। ভুল মোবাইল বা ইমেইল দেওয়ার কারণে ডেলিভারিতে বিলম্ব ঘটলে গ্রাহক তাৎক্ষণিক সাপোর্ট টিমে যোগাযোগ করবেন।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৪. ওয়ারেন্টি ও রিপ্লেসমেন্ট গ্যারান্টি (Warranty Policy)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          ক্রয়কৃত প্রতিটি সাবস্ক্রিপশনের মেয়াদ চলাকালীন সময়ে যদি কোনো প্রাতিষ্ঠানিক কারিগরি বা লগইন ত্রুটি দেখা দেয়, তবে আমাদের সাপোর্ট টিম তা সমাধান বা সমমূল্যের রিপ্লেসমেন্ট প্রদান করবে। কিন্তু গ্রাহক কর্তৃক নিয়ম ভঙ্গ বা পাসওয়ার্ড পরিবর্তনের কারণে সমস্যা হলে ওয়ারেন্টি বাতিল বলে গণ্য হবে।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ৫. শর্তাবলীর পরিমার্জন ও পরিবর্তন (Modifications)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          ElitePassBD কর্তৃপক্ষ যেকোনো সময় পূর্ব ঘোষণা ছাড়াই এই শর্তাবলীতে পরিবর্তন বা পরিমার্জন আনার অধিকার সংরক্ষণ করে। পরিবর্তনের পর সাইট ব্যবহার অব্যাহত রাখলে আপনি সংশোধিত শর্তাবলীর প্রতি সম্মতি দিয়েছেন বলে গণ্য হবে।
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
            <Scale className="w-3.5 h-3.5" />
            আইনি নীতিমালা ও ব্যবহার চুক্তি
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            ব্যবহারের শর্তাবলী — <span className="text-violet-600">Terms of Service</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            ElitePassBD-এর প্ল্যাটফর্ম ও ডিজিটাল পরিসেবা ব্যবহারের সাধারণ নীতিমালা, ক্রয় ও ওয়ারেন্টি নিয়মাবলী।
          </p>
        </div>

        {/* Dynamic Sections Rendered Serially */}
        <PageSectionsRenderer
          pageKey="terms"
          fallbackContent={fallbackTermsContent}
        />

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            শর্তাবলী বিষয়ে আপনার কোনো প্রশ্ন থাকলে সরাসরি আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
}
