import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ContactSupport() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all the fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await api.post('/tickets', formData);
      
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit support request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] text-slate-800 py-12 text-left animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center">
          <span className="text-xxs font-bold text-violet-600 bg-violet-50 border border-violet-100/60 px-3 py-1 rounded-full uppercase tracking-wider">
            Help Desk
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mt-3">
            Contact Support
          </h1>
          <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto">
            Need help with your subscription or order activation? Our dedicated support team is available to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Contact Info & WhatsApp Integration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-full">
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Get in Touch</h3>
                
                <div className="space-y-4 text-xs">
                  <div className="flex items-start space-x-3 text-slate-600">
                    <Mail className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">Email Support</span>
                      <a href="mailto:support@elitepassbd.com" className="hover:text-violet-600 transition-colors">support@elitepassbd.com</a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-slate-600">
                    <MessageSquare className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">Response Time</span>
                      <span>Typically responds within 1-2 hours.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="border-t border-slate-150 pt-6 mt-6 text-center space-y-3">
                <span className="text-xxs font-bold text-slate-400 uppercase block tracking-wider">Fastest Channel</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Connect with our support representatives directly via WhatsApp chat for instant order assistance and troubleshooting.
                </p>
                
                <a
                  href="https://wa.me/8801700000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-95 duration-150 cursor-pointer"
                >
                  {/* SVG WhatsApp Icon */}
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97-1.861-1.867-4.333-2.897-6.963-2.898-5.437 0-9.864 4.37-9.868 9.801-.001 1.77.463 3.5 1.34 5.013l-.974 3.561 3.661-.958zm11.367-7.24c-.266-.134-1.58-.78-1.822-.867-.243-.088-.419-.133-.596.134-.176.265-.682.866-.837 1.043-.154.177-.309.199-.575.066-.266-.134-1.123-.414-2.139-1.32-.79-.705-1.323-1.575-1.478-1.841-.155-.265-.017-.409.117-.541.12-.12.266-.31.399-.464.133-.155.177-.265.266-.442.088-.177.044-.332-.022-.464-.067-.133-.596-1.437-.817-1.967-.215-.518-.452-.447-.622-.456-.16-.008-.344-.01-.528-.01-.184 0-.485.069-.74.348-.254.278-.97.949-.97 2.316 0 1.367 1.002 2.69 1.14 2.872.139.182 1.97 3.01 4.77 4.21.667.285 1.187.456 1.593.585.67.213 1.28.183 1.76.111.537-.08 1.58-.646 1.802-1.238.221-.593.221-1.096.155-1.203-.066-.107-.242-.177-.508-.31z"/>
                  </svg>
                  <span>WhatsApp Live Chat</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right: Support Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Send Message</h3>

              {success ? (
                <div className="py-12 text-center space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 animate-scale">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">Message Sent Successfully!</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Thank you for contacting support. We have received your query and a representative will email you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="px-5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs text-left">
                  {error && (
                    <div className="text-xxs text-red-650 bg-red-50 border border-red-100 p-2.5 rounded-lg font-bold">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="w-full bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Your email address"
                        className="w-full bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What do you need help with?"
                      className="w-full bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Describe your issue in detail..."
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-250 focus:border-violet-500 focus:bg-white focus:outline-none rounded-xl p-4 text-xs text-slate-800 placeholder-slate-400 transition-all resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 active:scale-95 duration-150 flex items-center space-x-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Message...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
