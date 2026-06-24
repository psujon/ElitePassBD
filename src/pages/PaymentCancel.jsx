import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] py-20 flex flex-col justify-center items-center text-left animate-fade-in">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white border border-slate-250/80 rounded-3xl p-8 text-center shadow-lg relative overflow-hidden">
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500"></div>

          {/* Cancel Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-50 text-amber-600 mb-6 shadow-sm border border-amber-100/50">
            <AlertCircle className="h-12 w-12" />
          </div>

          <h2 className="text-3xl font-extrabold text-[#411f52] tracking-tight">
            Payment Cancelled
          </h2>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            The payment process was cancelled. No charges were made, and your order was not completed.
          </p>

          {/* Details */}
          {orderId && (
            <div className="my-6 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl inline-flex flex-col items-center justify-center min-w-[200px]">
              <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">Cancelled Order ID</span>
              <span className="text-md font-bold text-amber-600 mt-1">#{orderId}</span>
            </div>
          )}

          {/* Guidelines Box */}
          <p className="text-slate-500 text-xs mb-8 max-w-xs mx-auto leading-relaxed">
            If this was an accident or you encountered issues, you can return to the checkout page and try again.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/checkout"
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Return to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/"
              className="block w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-sm transition-colors border border-slate-200 text-center"
            >
              Back to Store Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
