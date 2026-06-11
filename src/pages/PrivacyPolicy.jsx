import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-left">
      <div className="glass-card rounded-3xl p-8 md:p-10 border border-slate-800/80 animate-fade-in shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xxs font-bold text-violet-400 uppercase tracking-wider">Legal Agreements</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Privacy Policy</h1>
          </div>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed mb-8">
          Last updated: June 09, 2026. At ElitePassBD, we value your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, use, and share your information when you use our platform.
        </p>

        <div className="space-y-8 text-xs">
          {/* Section 1 */}
          <div className="border-t border-slate-850 pt-6">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center">
              <Lock className="w-4 h-4 text-violet-400 mr-2" />
              1. Information We Collect
            </h2>
            <div className="text-slate-400 leading-relaxed space-y-2">
              <p>We collect personal information that you provide to us directly when registering, placing an order, or contacting us. This includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account credentials: Name, Email Address, and Password.</li>
                <li>Contact Details: WhatsApp Number and Phone Number.</li>
                <li>Transactional Information: Payment method choice, items purchased, and billing details.</li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="border-t border-slate-850 pt-6">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center">
              <Eye className="w-4 h-4 text-violet-400 mr-2" />
              2. How We Use Your Information
            </h2>
            <div className="text-slate-400 leading-relaxed space-y-2">
              <p>We use your data to deliver the products and service experience you expect from us, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Processing transactions and delivering premium digital licenses/keys/subscriptions.</li>
                <li>Updating order tracking information and sending status notifications.</li>
                <li>Providing customer support via WhatsApp or email.</li>
                <li>Preventing fraudulent activity and ensuring platform safety.</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="border-t border-slate-850 pt-6">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center">
              <FileText className="w-4 h-4 text-violet-400 mr-2" />
              3. Data Retention & Security
            </h2>
            <div className="text-slate-400 leading-relaxed space-y-2">
              <p>
                We implement robust administrative, technical, and physical security measures to safeguard your information. Your password is encrypted using high-level hashing, and credentials are never stored in plain text.
              </p>
              <p>
                We only retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="border-t border-slate-850 pt-6">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center">
              <Shield className="w-4 h-4 text-violet-400 mr-2" />
              4. Sharing of Information
            </h2>
            <p className="text-slate-400 leading-relaxed">
              ElitePassBD does not sell, rent, or trade your personal information. We do not share your details with third parties except as required to process payments (e.g., bKash, Nagad, Rocket gateways) or comply with applicable legal obligations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
