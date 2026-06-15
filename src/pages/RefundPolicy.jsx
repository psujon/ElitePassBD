import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-6 space-y-8">
        {/* Title */}
        <div className="space-y-2.5 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900">Refund Policy</h1>
          <p className="text-slate-500 text-xs">Last updated: June 2026</p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-6 text-slate-750 text-sm leading-relaxed">
          <div className="space-y-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
            <h3 className="text-slate-900 font-bold text-base">1. Nature of Digital Goods</h3>
            <p className="text-slate-600">
              Because ElitePassBD delivers intangible digital items (activation codes, game keys, gift cards, subscription tokens), once a code is successfully delivered via WhatsApp, Email, or user portal, it is immediately deemed consumed. Therefore, we generally do not offer refunds, exchanges, or store credits for change-of-mind purchases or accidental orders.
            </p>
          </div>

          <div className="space-y-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
            <h3 className="text-slate-900 font-bold text-base">2. Defective or Invalid Codes</h3>
            <p className="text-slate-600">
              We stand behind the quality of the products we source. In the highly unlikely event that a code delivered is defective, invalid, or already used:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1.5 text-slate-650">
              <li>You must contact our support center within <strong>48 hours</strong> of purchase.</li>
              <li>Provide screenshots/video proof showing the code activation failure.</li>
              <li>Once verified, we will issue a replacement code or process a full refund.</li>
            </ul>
          </div>

          <div className="space-y-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
            <h3 className="text-slate-900 font-bold text-base">3. Verification Delays</h3>
            <p className="text-slate-600">
              Orders requiring manual verification (such as bKash/Nagad transactions) will be reviewed within 1 to 12 hours. If your order cannot be verified, or if we request further transaction proof and you refuse to comply, we reserve the right to cancel the order and process a full refund to your original payment channel.
            </p>
          </div>

          <div className="space-y-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
            <h3 className="text-slate-900 font-bold text-base">4. Refund Processing Time</h3>
            <p className="text-slate-600">
              Approved refunds are processed back to the customer's original mobile financial service (bKash/Nagad) within <strong>3-5 business days</strong>. No processing fees will be charged to the user.
            </p>
          </div>

          {/* Help Callout */}
          <div className="bg-violet-50 border border-violet-100/60 p-6 rounded-3xl flex items-start space-x-3.5">
            <HelpCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-slate-850 font-bold">Need assistance?</h4>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                If you have questions regarding this policy or require help with key activation, please submit a request in our support center or contact us on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
