import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !whatsappNumber) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/auth/register', { name, email, password, whatsappNumber });
      
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-16 flex flex-col justify-center min-h-[75vh]">
      <div className="glass-card rounded-2xl p-8 shadow-xl animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-white tracking-tight glow-primary">
            Create Account
          </h2>
          <p className="text-slate-400 text-xs mt-2">
            Register to track purchases and products
          </p>
        </div>

        {error && (
          <div className="mb-5 text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900 px-3 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 text-xs font-semibold text-emerald-400 bg-emerald-950/20 border border-emerald-900 px-3 py-2.5 rounded-xl">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full text-sm bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 transition-colors"
                required
              />
              <User className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-sm bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 transition-colors"
                required
              />
              <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              WhatsApp Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. +88017XXXXXXXX"
                className="w-full text-sm bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 transition-colors"
                required
              />
              <Phone className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full text-sm bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 transition-colors"
                required
              />
              <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
