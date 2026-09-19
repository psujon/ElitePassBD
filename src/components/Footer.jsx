import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
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
  Headphones,
  Phone
} from 'lucide-react';

export default function Footer() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const location = useLocation();
  const isProductDetailsPage = location.pathname.startsWith('/product/');

  const [supportLinks, setSupportLinks] = useState({
    support_whatsapp: '8801925112444',
    support_email: 'support@elitepassbd.com',
    social_facebook: 'https://facebook.com/elitepassbd',
    social_linkedin: 'https://linkedin.com/elitepassbd',
    social_youtube: 'https://youtube.com/elitepassbd',
    social_messenger: 'https://m.me/elitepassbd'
  });

  useEffect(() => {
    let isMounted = true;
    const loadSupportSettings = async () => {
      try {
        const data = await api.get('/settings/public');
        if (data && isMounted) {
          setSupportLinks({
            support_whatsapp: data.support_whatsapp || '8801925112444',
            support_email: data.support_email || 'support@elitepassbd.com',
            social_facebook: data.social_facebook || 'https://facebook.com/elitepassbd',
            social_linkedin: data.social_linkedin || 'https://linkedin.com/elitepassbd',
            social_youtube: data.social_youtube || 'https://youtube.com/elitepassbd',
            social_messenger: data.social_messenger || 'https://m.me/elitepassbd'
          });
        }
      } catch (e) {
        // Fallback to default
      }
    };

    loadSupportSettings();

    const handleSupportUpdate = (e) => {
      if (e?.detail) {
        setSupportLinks(prev => ({ ...prev, ...e.detail }));
      } else {
        loadSupportSettings();
      }
    };

    window.addEventListener('support-settings-updated', handleSupportUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('support-settings-updated', handleSupportUpdate);
    };
  }, []);

  const handleStartChat = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const phoneNumber = (supportLinks.support_whatsapp || '8801925112444').replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(message.trim());
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
    setMessage('');
    setIsChatOpen(false);
  };

  return (
    <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 mt-auto text-slate-800 text-left relative z-30">
      <div className="w-full max-w-[95%] mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">

          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5 text-xl font-bold tracking-tight text-slate-900">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                <img src="/logo.png" alt="ElitePass BD Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-lg font-black tracking-tight leading-none flex items-center gap-1">
                <span className="text-[#005F4B]">ELITE</span>
                <span className="text-[#FF6D00]">PASS</span>
                <span className="text-[#005F4B] border border-[#005F4B] px-1 py-0.5 rounded-md text-[10px] font-black leading-none">
                  BD
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Your trusted source for genuine software licenses at affordable prices. Instant delivery, dedicated activation support, and 24/7 customer service.
            </p>
            <div className="space-y-2 text-xs text-slate-600 font-bold">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${supportLinks.support_email || 'support@elitepassbd.com'}`} className="hover:underline hover:text-blue-600">
                  {supportLinks.support_email || 'support@elitepassbd.com'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <a
                  href={`https://wa.me/${(supportLinks.support_whatsapp || '8801925112444').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline hover:text-blue-600 cursor-pointer text-left bg-transparent border-none p-0 font-bold"
                >
                  WhatsApp Support
                </a>
              </div>
            </div>
            <div className="flex space-x-3.5 pt-2">
              <a href={supportLinks.social_facebook || "https://facebook.com/elitepassbd"} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-500 transition-colors shadow-xxs" title="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={supportLinks.social_linkedin || "https://linkedin.com/elitepassbd"} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-700 hover:text-white flex items-center justify-center text-slate-500 transition-colors shadow-xxs" title="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href={supportLinks.social_youtube || "https://youtube.com/elitepassbd"} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-655 hover:text-white flex items-center justify-center text-slate-500 transition-colors shadow-xxs" title="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

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

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Support
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-bold">
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact Support</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
            </ul>
          </div>

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

        <div className="border-t border-slate-200 justify-between items-center gap-2 text-xs text-slate-500 font-semibold">

          <div className="w-full">
            <img
              src="/Footer-Desktop-Light-Version.png.png"
              alt="ElitePassBD Features"
              className="hidden lg:block w-full h-auto"
            />
            <img
              src="/Footer-Mobile-Light-Version.png.png"
              alt="ElitePassBD Features"
              className="block md:hidden w-full h-auto"
            />
          </div>

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

        <div className="text-center text-[10px] text-slate-400 font-bold border-t border-slate-150 p-2">
          &copy; {new Date().getFullYear()} ElitePassBD. All rights reserved.
        </div>

      </div>

      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">

        {isChatOpen && (
          <div className="mb-4 flex flex-col items-end gap-3.5 animate-fade-in-up">

            {/* Messenger Option Pill */}
            <a
              href={supportLinks.social_messenger || "https://m.me/elitepassbd"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-72 sm:w-80 bg-white/95 backdrop-blur-xl border border-purple-200/90 hover:border-blue-500 p-3 rounded-full shadow-2xl hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-600 shadow-md shadow-blue-500/30 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-900 leading-tight">Messenger</h5>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Chat on Messenger</p>
                </div>
              </div>
              <div className="pr-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all font-bold text-sm">
                →
              </div>
            </a>

            {/* WhatsApp Chat Option Pill */}
            <a
              href={`https://wa.me/${(supportLinks.support_whatsapp || '8801925112444').replace(/[^0-9]/g, '')}?text=Hello%20ElitePassBD%20Support,%20I%20need%20assistance.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-72 sm:w-80 bg-white/95 backdrop-blur-xl border border-purple-200/90 hover:border-emerald-500 p-3 rounded-full shadow-2xl hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-md shadow-emerald-500/30 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-900 leading-tight">WhatsApp</h5>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Chat on WhatsApp</p>
                </div>
              </div>
              <div className="pr-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all font-bold text-sm">
                →
              </div>
            </a>

            <div className="bg-white/95 backdrop-blur-xl border border-purple-200/90 px-4 py-1.5 rounded-full shadow-lg text-xs font-black text-violet-900 flex items-center gap-2 mr-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Which one do you prefer?</span>
            </div>

          </div>
        )}

        <div className="relative group flex items-center justify-center">

          {!isChatOpen && (
            <>
              <span className="absolute w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-purple-400/40 animate-ping opacity-75"></span>
              <span className="absolute w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 opacity-40 blur-md group-hover:opacity-80 transition-opacity animate-pulse"></span>
            </>
          )}

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`relative rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-md z-10 ${isChatOpen
              ? 'w-13 h-13 bg-purple-50/90 text-purple-700 border-2 border-purple-200 shadow-purple-500/10'
              : 'w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-400 via-indigo-500 to-violet-600 text-white border-2 border-white/50'
              }`}
            aria-label="Contact Support Options"
          >
            {isChatOpen ? (
              <X className="w-6 h-6 text-purple-700 stroke-[2.5]" />
            ) : (
              <div className="relative flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none stroke-white stroke-[2] drop-shadow-md">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.635m3.365 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.01m3.365 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 border-2 border-white rounded-full shadow-md z-20" />
              </div>
            )}
          </button>
        </div>

      </div>

    </footer>
  );
}
