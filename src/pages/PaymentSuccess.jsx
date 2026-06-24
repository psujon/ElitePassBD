import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Mail, ShieldCheck, Clock } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const activationType = searchParams.get('activationType') || 'automatic';

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] py-20 flex flex-col justify-center items-center text-left animate-fade-in">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white border border-slate-250/80 rounded-3xl p-8 text-center shadow-lg relative overflow-hidden">
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500"></div>

          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 mb-6 shadow-sm border border-emerald-100/50 animate-bounce">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <h2 className="text-3xl font-extrabold text-[#411f52] tracking-tight">
            Payment Successful!
          </h2>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            Your transaction was processed successfully. Thank you for your purchase with ElitePass BD.
          </p>

          {/* Order Details Badge */}
          {orderId && (
            <div className="my-6 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl inline-flex flex-col items-center justify-center min-w-[200px]">
              <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">Order Reference</span>
              <span className="text-lg font-black text-violet-600 mt-1">#{orderId}</span>
            </div>
          )}

          {/* Instructions Box */}
          {activationType === 'manual' ? (
            <div className="bg-amber-50/40 border border-amber-100/60 rounded-2xl p-5 mb-8 text-left space-y-3.5">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Manual Activation</strong>: Your order contains items that require manual activation. Please wait, the administrator will verify and send the license keys to your email or WhatsApp number within 1 hour.
                </p>
              </div>
              <div className="flex items-start space-x-3 pt-3 border-t border-amber-100/50">
                <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Guest Accounts</strong>: If you checked out as a guest, we have emailed you temporary credentials. Use them to log in and track your order.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-violet-50/40 border border-violet-100/60 rounded-2xl p-5 mb-8 text-left space-y-3.5">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Instant Dispatch</strong>: Your digital keys have been sent to your delivery email address. You can also view them instantly in your dashboard.
                </p>
              </div>
              <div className="flex items-start space-x-3 pt-3 border-t border-violet-100/50">
                <Mail className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Guest Accounts</strong>: If you checked out as a guest, we have emailed you temporary credentials. Use them to log in and access your codes.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/"
              className="block w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-sm transition-colors border border-slate-200 text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
