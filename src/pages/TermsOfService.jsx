import React from 'react';
import { Scale, Info, HelpCircle, AlertTriangle, FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-violet-50 text-violet-600 border border-violet-100/60 rounded-2xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xxs font-bold text-violet-600 uppercase tracking-wider">Legal Agreements</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Terms of Service</h1>
            </div>
          </div>

          <p className="text-slate-500 text-xs leading-relaxed mb-8">
            Welcome to ElitePassBD. By accessing or purchasing from our platform, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
          </p>

          <div className="space-y-8 text-xs">
            {/* Section 1 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <Info className="w-4 h-4 text-violet-600 mr-2" />
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-600 leading-relaxed">
                By registering an account or placing an order on ElitePassBD, you confirm that you are at least 18 years old (or have parent/guardian consent) and agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use our site.
              </p>
            </div>

            {/* Section 2 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <FileText className="w-4 h-4 text-violet-600 mr-2" />
                2. Digital Products and Delivery
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>ElitePassBD sells premium digital keys, subscription accounts, and digital top-ups. Since these items are digital products, the following delivery rules apply:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Delivery is electronic. Once payment is verified, details are updated in your Order Tracking panel on the User Dashboard.</li>
                  <li>Digital codes and account subscriptions are verified as working prior to delivery.</li>
                  <li>Due to the nature of digital keys, all purchases are final. We do not issue refunds unless the key/account provided is proven to be defective at the time of delivery.</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 text-violet-600 mr-2" />
                3. Payment & Pricing Policy
              </h2>
              <div className="text-slate-600 leading-relaxed space-y-2">
                <p>All prices displayed on the site are in Bangladeshi Taka (BDT/৳). We reserve the right to alter pricing at any time without notice.</p>
                <p>
                  Payments are made via cash on delivery or other available checkout options. If any transaction is deemed suspicious, we reserve the right to temporarily freeze the order for verification.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-bold text-slate-850 mb-3 flex items-center">
                <HelpCircle className="w-4 h-4 text-violet-600 mr-2" />
                4. Limitations of Liability
              </h2>
              <p className="text-slate-600 leading-relaxed">
                ElitePassBD shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our digital products, including but not limited to suspension of subscription accounts by third-party providers (Netflix, Spotify, OpenAI, etc.) due to their respective platform policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
