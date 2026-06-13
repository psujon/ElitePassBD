import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Loader2, Mail, Lock, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await api.post('/auth/login', { email, password });

      // Store token and user data in Context (which mirrors it to localStorage)
      login(data.token, data.user);

      // Role-based routing redirection with fallback to previous route
      const from = location.state?.from?.pathname || (data.user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] py-16 flex flex-col justify-center items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-805 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-500 text-xs mt-2">
              Sign in to access your digital assets and orders
            </p>
          </div>

          {error && (
            <div className="mb-5 text-xs font-semibold text-red-650 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-left text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 transition-all shadow-xs"
                  required
                />
                <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 transition-all shadow-xs"
                  required
                />
                <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            New to ElitePassBD?{' '}
            <Link to="/register" className="text-violet-600 hover:text-violet-750 font-semibold underline">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
