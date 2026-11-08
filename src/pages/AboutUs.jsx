import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import PageSectionsRenderer from '../components/PageSectionsRenderer';

export default function AboutUs() {
  const fallbackAboutContent = (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <span>আমাদের লক্ষ্য ও উদ্দেশ্য</span>
        </div>
        <p className="text-sm text-slate-650 leading-relaxed">
          <strong>ElitePassBD</strong>-তে আমরা বিশ্বাস করি, প্রত্যেকেরই প্রিমিয়াম ডিজিটাল বিনোদন এবং প্রয়োজনীয় সফটওয়্যার টুলসে নির্বিঘ্ন, নিরাপদ এবং তাৎক্ষণিক অ্যাক্সেস পাওয়ার অধিকার রয়েছে। আপনি কাজের জন্য এআই টুলস (ChatGPT, Gemini), স্ট্রিমিং ও বিনোদন, অফিস প্রোডাক্টিভিটি সফটওয়্যার, কিংবা গেমিং পাস যা-ই খুঁজছেন না কেন—আমরা আপনার বিশ্বস্ত দেশীয় সমাধানদাতা।
        </p>
        <p className="text-sm text-slate-650 leading-relaxed">
          বাংলাদেশে আন্তর্জাতিক পেমেন্ট কার্ড না থাকার কারণে ডিজিটাল সেবা কেনায় যে জটিলতা তৈরি হতো, তা দূর করতেই আমাদের এই উদ্যোগ। আমরা বিকাশ ও নগদের মতো সহজ দেশীয় পেমেন্ট মাধ্যমে দ্রুততম সময়ে আসল এবং ভেরিফায়েড লাইসেন্স ও সাবস্ক্রিপশন সরবরাহ করে থাকি।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          অতি দ্রুত ডেলিভারি (Instant Delivery)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          আপনার মূল্যবান সময়ের গুরুত্ব আমরা বুঝি। পেমেন্ট ভেরিফিকেশনের পর লাইসেন্স কোড বা অ্যাক্টিভেশন নির্দেশনা সরাসরি আপনার হোয়াটসঅ্যাপ অথবা ইমেইলে দ্রুততম সময়ে পৌঁছে দেওয়া হয়।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          নিরাপদ লেনদেন (100% Secure)
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          সম্পূর্ণ নিশ্চিন্তে কেনাকাটা করুন। আমাদের সকল লেনদেন অত্যন্ত সতর্কতার সাথে সুরক্ষিতভাবে পরিচালিত হয় এবং আপনার ব্যক্তিগত তথ্যের সম্পূর্ণ গোপনীয়তা বজায় রাখা হয়।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          প্রিমিয়াম মান ও আসল লাইসেন্স
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          আমরা সরাসরি অফিসিয়াল সোর্স ও ভেরিফায়েড পার্টনারদের থেকে ডিজিটাল কোড ও সাবস্ক্রিপশন সংগ্রহ করি, যা প্রতিটি প্রোডাক্টে নির্দিষ্ট মেয়াদের ওয়ারেন্টি নিশ্চয়তা দেয়।
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          ডেডিকেটেড কাস্টমার সাপোর্ট
        </h3>
        <p className="text-sm text-slate-650 leading-relaxed">
          লাইসেন্স অ্যাক্টিভেশন বা পণ্য সম্পর্কিত যেকোনো প্রশ্ন বা সমস্যায় আমাদের সাপোর্ট টিম এবং হোয়াটসঅ্যাপ হেল্পলাইন সবসময় আপনাকে আন্তরিক সেবা দিতে প্রস্তুত।
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
            <Sparkles className="w-3.5 h-3.5" />
            বিশ্বস্ত ডিজিটাল সার্ভিস পার্টনার
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            আমাদের সম্পর্কে — <span className="text-violet-600">ElitePassBD</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            বাংলাদেশে প্রিমিয়াম ডিজিটাল সাবস্ক্রিপশন, গেমিং পাস এবং অফিসিয়াল লাইসেন্স কি কেনার সবচেয়ে নির্ভরযোগ্য ও নিরাপদ প্ল্যাটফর্ম।
          </p>
        </div>

        {/* Dynamic Sections Rendered Serially */}
        <PageSectionsRenderer
          pageKey="about"
          fallbackContent={fallbackAboutContent}
        />

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            ElitePassBD-কে আপনার আস্থার সঙ্গী হিসেবে বেছে নেওয়ার জন্য আন্তরিক ধন্যবাদ। উপভোগ করুন আপনার প্রিমিয়াম ডিজিটাল সেবা!
          </p>
        </div>
      </div>
    </div>
  );
}
