import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Linkedin,
  Youtube,
  MessageSquare,
  Send,
  X,
  Mail,
  ShieldCheck,
  Zap,
  Headphones
} from 'lucide-react';

export default function Footer() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleStartChat = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Construct WhatsApp link with support phone number
    const phoneNumber = '8801925112444';
    const encodedText = encodeURIComponent(message.trim());
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
    setMessage('');
    setIsChatOpen(false);
  };

  return (
    <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 mt-auto text-slate-800 text-left relative z-30">
      <div className="max-w-full mx-auto">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">

          {/* Column 1: Brand details */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-slate-900">
              <span className="text-blue-600 font-black text-2xl">
                ElitePassBD
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Your trusted source for genuine software licenses at affordable prices. Instant delivery, dedicated activation support, and 24/7 customer service.
            </p>
            <div className="space-y-2 text-xs text-slate-600 font-bold">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>support@elitepassbd.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <Link to="https://wa.me/8801925112444" target="_blank" rel="noreferrer" className="hover:underline hover:text-blue-600 cursor-pointer text-left bg-transparent border-none p-0 font-bold">
                  WhatsApp Support
                </Link>
              </div>
            </div>
            {/* Social icons */}
            <div className="flex space-x-3.5 pt-2">
              <a href="https://facebook.com/elitepassbd" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-500 transition-colors shadow-xxs">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/elitepassbd" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-700 hover:text-white flex items-center justify-center text-slate-500 transition-colors shadow-xxs">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://youtube.com/elitepassbd" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-655 hover:text-white flex items-center justify-center text-slate-500 transition-colors shadow-xxs">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Products */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
              Products
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-bold">
              <li><Link to="/products?category=Windows" className="hover:text-blue-600 transition-colors">Windows</Link></li>
              <li><Link to="/products?category=Microsoft%20Office" className="hover:text-blue-600 transition-colors">Microsoft Office</Link></li>
              <li><Link to="/products?category=Antivirus" className="hover:text-blue-600 transition-colors">Antivirus</Link></li>
              <li><Link to="/products?category=Creative%20Software" className="hover:text-blue-600 transition-colors">Creative Software</Link></li>
              <li><Link to="/products?category=Subscription" className="hover:text-blue-600 transition-colors">Subscription</Link></li>
              <li><Link to="/products?category=Gift%20Card" className="hover:text-blue-600 transition-colors">Gift Card</Link></li>
              <li className="pt-1"><Link to="/products" className="text-blue-600 hover:underline flex items-center gap-1">Browse All &rarr;</Link></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Support
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-bold">
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact Support</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-bold">
              <li><Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link to="/about" className="hover:text-blue-600 transition-colors">Our Partners</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund-policy" className="hover:text-blue-600 transition-colors">Refund Policy</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">DMCA Policy</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar Payment & Trust Badges */}
        <div className="border-t border-slate-200 justify-between items-center gap-2 text-xs text-slate-500 font-semibold">

          {/* Payment Methods */}
          <div className="w-full">
            {/* Desktop Version */}
            <img
              src="/Footer-Desktop-Light-Version.png.png"
              alt="ElitePassBD Features"
              className="hidden lg:block w-full h-auto"
            />
            {/* Mobile Version */}
            <img
              src="/Footer-Mobile-Light-Version.png.png"
              alt="ElitePassBD Features"
              className="block md:hidden w-full h-auto"
            />
          </div>

          {/* Trust badges */}
          {/* <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider mt-5">
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full select-none shadow-xxs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% Genuine
            </span>
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full select-none shadow-xxs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Instant Delivery
            </span>
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full select-none shadow-xxs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              24/7 Support
            </span>
          </div> */}

        </div>

        {/* Copyright */}
        <div className="text-center text-[10px] text-slate-400 font-bold border-t border-slate-150 p-2">
          &copy; {new Date().getFullYear()} ElitePassBD. All rights reserved.
        </div>

      </div>

      {/* ================= FLOATING WHATSAPP CHATBOX WIDGET ================= */}
      <div className="fixed bottom-18 md:bottom-6 right-6 z-50 flex flex-col items-end">

        {/* Chat window bubble */}
        {isChatOpen && (
          <div className="mb-3 w-80 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up text-left">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-white font-extrabold text-sm relative">
                  EP
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-600 rounded-full" />
                </div>
                <div>
                  <h5 className="text-xs font-black leading-tight">ElitePassBD Support</h5>
                  <span className="text-[10px] text-emerald-100 font-medium">Replies within minutes</span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:text-emerald-100 hover:scale-105 transition-all cursor-pointer bg-transparent border-none p-1 focus:outline-none"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-slate-50 min-h-[110px] flex flex-col justify-end text-slate-800">
              <div className="bg-white border border-slate-150 p-3 rounded-xl rounded-tl-none text-[11px] md:text-xs font-semibold leading-relaxed shadow-xxs max-w-[90%] text-left">
                Hello! Welcome to ElitePassBD Support. How can we help you today? Type your query below.
              </div>
            </div>

            {/* Chat Input Footer */}
            <form onSubmit={handleStartChat} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-grow bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0 border-none"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Floating buttons row */}
        <div className="flex items-center gap-3">
          {/* Green WhatsApp button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-none"
            aria-label="Contact Support on WhatsApp"
          >
            {isChatOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-6.5 h-6.5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            )}
          </button>
        </div>

      </div>
    </footer>
  );
}
