import React from 'react';
import { Shield, Sparkles, Zap, Headphones } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Title Section */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            About <span className="text-violet-600">ElitePassBD</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
            Your premier gateway to premium digital subscriptions, gaming passes, and gift card activations.
          </p>
        </div>

        {/* Brand Mission Info */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
          <p className="text-sm text-slate-650 leading-relaxed">
            At <strong>ElitePassBD</strong>, we believe everyone deserves seamless, safe, and instant access to premium digital entertainment. Whether you are seeking gaming battle passes, subscription streaming gift cards, premium activation keys, or digital wallet codes, we serve as your trusted local provider.
          </p>
          <p className="text-sm text-slate-650 leading-relaxed">
            Established to bridge the accessibility gap for digital goods in Bangladesh, we offer localized payment solutions (including bKash and Nagad) with rapid manual processing and verification systems, ensuring you receive your keys as quickly as possible.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl flex items-start space-x-4 shadow-xs">
            <div className="p-2.5 bg-violet-50 border border-violet-100/60 rounded-2xl text-violet-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">Ultra-Fast Delivery</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                We know time is valuable. Once verified, subscription codes and activation instructions are delivered straight to your WhatsApp or Email.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl flex items-start space-x-4 shadow-xs">
            <div className="p-2.5 bg-violet-50 border border-violet-100/60 rounded-2xl text-violet-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">Secure Transactions</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Shop with complete peace of mind. All payments are verified securely, and your personal credentials are kept confidential.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl flex items-start space-x-4 shadow-xs">
            <div className="p-2.5 bg-violet-50 border border-violet-100/60 rounded-2xl text-violet-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">Premium Quality</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                We only source official digital codes and subscription gift cards, guaranteeing full-duration warranty coverage.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl flex items-start space-x-4 shadow-xs">
            <div className="p-2.5 bg-violet-50 border border-violet-100/60 rounded-2xl text-violet-600">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">Dedicated Support</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Have questions or need help with code activation? Our ticket center and WhatsApp support are always ready to assist.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Thank you for choosing ElitePassBD. Enjoy your premium access!
          </p>
        </div>
      </div>
    </div>
  );
}
