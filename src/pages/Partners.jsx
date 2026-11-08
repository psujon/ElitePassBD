import React from 'react';
import { Users, Globe, ShieldCheck, Award, Handshake, Building, Mail, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Partners() {
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

        {/* Intro Card */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <Globe className="w-5 h-5 text-violet-600" />
            <span>পার্টনারশিপের মাধ্যমে প্রিমিয়াম সেবার নিশ্চয়তা</span>
          </div>
          <p className="text-sm text-slate-650 leading-relaxed">
            <strong>ElitePassBD</strong> শুধুমাত্র শীর্ষস্থানীয় আন্তর্জাতিক ডিজিটাল সোর্স এবং ভেরিফায়েড গ্লোবাল ডিস্ট্রিবিউটরদের সাথে অংশীদারিত্বের মাধ্যমে কাজ করে। এর মাধ্যমে আমরা নিশ্চিত করি যে আমাদের গ্রাহকরা পাচ্ছেন ১০০% আসল, বৈধ এবং মেয়াদের পূর্ণ নিশ্চয়তাযুক্ত ডিজিটাল কি ও প্রিমিয়াম সাবস্ক্রিপশন।
          </p>
          <p className="text-sm text-slate-650 leading-relaxed">
            আমরা স্থানীয় পেমেন্ট গেটওয়ে প্রোভাইডার এবং নির্ভরযোগ্য ভেন্ডরদের সাথে নিয়মিত সমন্বয় করে বাংলাদেশের ব্যবহারকারীদের জন্য ডিজিটাল কেনাকাটাকে সহজ, নিরাপদ এবং দ্রুততর করে তুলছি।
          </p>
        </div>

        {/* Partner Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Global Platforms */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 shadow-xs">
            <div className="p-3 bg-violet-50 border border-violet-100/60 rounded-2xl text-violet-600 w-fit">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">গ্লোবাল ডিজিটাল সার্ভিসেস</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              বিশ্বখ্যাত ডিজিটাল প্ল্যাটফর্ম যেমন Microsoft 365, Google Workspace, OpenAI (ChatGPT Plus), Canva Pro, Spotify এবং অন্যান্য শীর্ষ ব্র্যান্ডের জেনুইন অ্যাক্টিভেশন সোর্সিং।
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>অফিসিয়াল ডিস্ট্রিবিউশন চ্যানেল</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>পূর্ণ মেয়াদের সক্রিয় ওয়ারেন্টি সুবিধা</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Local Payment Gateways */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 shadow-xs">
            <div className="p-3 bg-violet-50 border border-violet-100/60 rounded-2xl text-violet-600 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">বিশ্বস্ত পেমেন্ট পার্টনার্স</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              বাংলাদেশের সবচেয়ে জনপ্রিয় মোবাইল ফিনান্সিয়াল সার্ভিসেস (bKash, Nagad, Rocket) ও লোকাল ব্যাংকিং ব্যবস্থার সাথে নিরাপদ ইন্টিগ্রেশন ও ম্যানুয়াল ভেরিফিকেশন ব্যবস্থা।
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>তাত্ক্ষণিক ট্রানজেকশন ট্র্যাকিং</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>জিরো হিডেন ফি ও সম্পূর্ণ স্বচ্ছতা</span>
              </li>
            </ul>
          </div>

          {/* Card 3: B2B & Bulk Vendors */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-3 shadow-xs">
            <div className="p-3 bg-violet-50 border border-violet-100/60 rounded-2xl text-violet-600 w-fit">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">ভেন্ডর ও রিসেলার পার্টনার্স</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              অনুমোদিত স্থানীয় ও আন্তর্জাতিক সফটওয়্যার ভেন্ডরদের সাথে যৌথ কোলাবোরেশন, যা আমাদের স্টক সবসময় সমৃদ্ধ রাখতে এবং সাশ্রয়ী মূল্যে পণ্য সরবরাহ করতে সহায়তা করে।
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>সরাসরি অথরাইজড সাপ্লায়ার নেটওয়ার্ক</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>বাল্ক অর্ডার ও করপোরেট অ্যাক্সেস</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Join as Partner Section */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Users className="w-5 h-5 text-violet-200" />
              <h3 className="text-lg font-bold">আমাদের সাথে পার্টনার হিসেবে কাজ করতে চান?</h3>
            </div>
            <p className="text-xs sm:text-sm text-violet-100 max-w-xl leading-relaxed">
              আপনি যদি কোনো ডিজিটাল সেবার ভেন্ডর, সাপ্লায়ার বা রিসেলার হয়ে থাকেন এবং আমাদের সাথে অংশীদারিত্ব স্থাপন করতে আগ্রহী হন, তবে সরাসরি আমাদের সাথে যোগাযোগ করুন।
            </p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-2.5 rounded-xl bg-white text-violet-700 hover:bg-violet-50 font-extrabold text-xs transition-colors shrink-0 shadow-xs flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>যোগাযোগ করুন</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

