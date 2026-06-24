import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, RefreshCw, HelpCircle } from 'lucide-react';

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason');

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] py-20 flex flex-col justify-center items-center text-left animate-fade-in">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white border border-slate-250/80 rounded-3xl p-8 text-center shadow-lg relative overflow-hidden">
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-400 via-red-500 to-rose-500"></div>

          {/* Failure Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-rose-50 text-rose-600 mb-6 shadow-sm border border-rose-100/50">
            <XCircle className="h-12 w-12" />
          </div>

          <h2 className="text-3xl font-extrabold text-[#411f52] tracking-tight">
            Payment Failed
          </h2>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            We couldn't process your payment transaction. Your account has not been charged for this order.
          </p>

          {/* Detail parameters */}
          {(orderId || reason) && (
            <div className="my-6 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-2 text-left">
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Order ID:</span>
                  <span className="text-slate-800 font-extrabold">#{orderId}</span>
                </div>
              )}
              {reason && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Issue:</span>
                  <span className="text-rose-600 font-bold uppercase tracking-wider text-[10px]">
                    {reason === 'VerificationFailed' ? 'Gateway Verification Failed' : 'Payment Aborted or Denied'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Guidelines Box */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 mb-8 text-left space-y-3.5">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-slate-455 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-650 leading-relaxed">
                <p className="font-extrabold text-slate-850">What should you do next?</p>
                <ul className="list-disc pl-4 mt-2.5 space-y-1 text-slate-500">
                  <li>Check if you have sufficient funds in your wallet or card.</li>
                  <li>Ensure your internet connection is stable.</li>
                  <li>Double-check your credentials and OTP input.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/checkout"
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span>Retry Payment</span>
            </Link>
            <Link
              to="/"
              className="block w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-sm transition-colors border border-slate-200 text-center"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
