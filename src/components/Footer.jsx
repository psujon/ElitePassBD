import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-8 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>
          <span className="text-violet-500 font-extrabold text-lg">
            ElitePassBD
          </span>
          <p className="text-xs text-slate-500 mt-1">
            Premium digital subscription e-commerce platform. Very fast and secure.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end space-y-2">
          <div className="flex space-x-4 text-xs text-slate-400">
            <Link to="/privacy" className="hover:text-violet-400 cursor-pointer transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-violet-400 cursor-pointer transition-colors">Refund Policy</Link>
            <Link to="/terms" className="hover:text-violet-400 cursor-pointer transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-violet-400 cursor-pointer transition-colors">Contact Support</Link>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ElitePassBD. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
