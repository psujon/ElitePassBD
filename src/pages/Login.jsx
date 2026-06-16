import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Loader2, Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password / OTP Flow States
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'verify' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      const msg = 'Please fill in all fields.';
      setError(msg);
      toast.error(msg);
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
      const msg = err.message || 'Invalid email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.error('Google login is not available. Please use email & password.');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      const msg = 'Please enter your email address.';
      setForgotError(msg);
      toast.error(msg);
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError('');
      await api.post('/auth/forgot-password', { email: forgotEmail });
      toast.success('OTP sent successfully! Please check your email.');
      setView('verify');
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Failed to send OTP. Make sure the email is registered.';
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      const msg = 'Please enter the verification code.';
      setForgotError(msg);
      toast.error(msg);
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError('');
      await api.post('/auth/verify-otp', { email: forgotEmail, otp });
      toast.success('OTP verified successfully!');
      setView('reset');
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Invalid or expired OTP.';
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      const msg = 'Please fill in all fields.';
      setForgotError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setForgotError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setForgotError(msg);
      toast.error(msg);
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError('');
      await api.post('/auth/reset-password', { email: forgotEmail, otp, password: newPassword });
      toast.success('Password reset successfully! Please login.');

      // Reset flow and load credentials into Login
      setEmail(forgotEmail);
      setPassword('');
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setForgotError('');
      setView('login');
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Failed to reset password. Please try again.';
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#f5f7fa] py-16 flex flex-col justify-center items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs animate-fade-in">

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Login
                </h2>
              </div>

              {error && (
                <div className="mb-5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl text-left">
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
                      placeholder=""
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
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=""
                      className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-10 py-2.5 text-slate-800 placeholder-slate-400 transition-all shadow-xs"
                      required
                    />
                    <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <label className="flex items-center space-x-2 text-slate-600 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotError('');
                      setView('forgot');
                    }}
                    className="text-violet-600 hover:underline font-medium focus:outline-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
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

                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-slate-150"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-xxs font-bold uppercase tracking-wider">OR</span>
                  <div className="flex-grow border-t border-slate-150"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="relative w-full py-2.5 bg-[#4285F4] hover:bg-[#357ae8] text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 w-7 bg-white rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                  </div>
                  <span className="pl-4">Sign In with Google</span>
                </button>

                {location.state?.from?.pathname === '/checkout' && (
                  <button
                    type="button"
                    onClick={() => navigate('/checkout', { state: { isGuest: true } })}
                    className="w-full mt-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                  >
                    <span>Checkout as Guest</span>
                  </button>
                )}
              </form>

              <div className="mt-6 text-center text-xs text-slate-500">
                New to ElitePassBD?{' '}
                <Link to="/register" className="text-violet-600 hover:text-violet-750 font-semibold underline">
                  Create account
                </Link>
              </div>
            </>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Reset Password
                </h2>
                <p className="text-slate-500 text-xs mt-2">
                  Enter your email address and we'll send you a 6-digit OTP verification code.
                </p>
              </div>

              {forgotError && (
                <div className="mb-5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl text-left">
                  {forgotError}
                </div>
              )}

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-left text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder=""
                      className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 transition-all shadow-xs"
                      required
                    />
                    <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <span>Send OTP</span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-violet-600 hover:text-violet-750 font-semibold underline focus:outline-none cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}

          {/* VIEW: VERIFY OTP */}g
          {view === 'verify' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Verify OTP
                </h2>
                <p className="text-slate-500 text-xs mt-2">
                  An OTP has been sent to <strong>{forgotEmail}</strong>. Please enter the 6-digit code below.
                </p>
                <p className='text-xs text-red-600 mt-1'>Note: If you don't receive OTP in email. Please check your spam folder.</p>
              </div>

              {forgotError && (
                <div className="mb-5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl text-left">
                  {forgotError}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-left text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Verification Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 tracking-widest transition-all shadow-xs"
                      required
                    />
                    <KeyRound className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <span>Verify OTP</span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-slate-550 hover:text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  Back
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-violet-600 hover:text-violet-750 font-semibold underline focus:outline-none cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          {/* VIEW: RESET PASSWORD */}
          {view === 'reset' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  New Password
                </h2>
                <p className="text-slate-500 text-xs mt-2">
                  Create a new secure password for your account.
                </p>
              </div>

              {forgotError && (
                <div className="mb-5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl text-left">
                  {forgotError}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-left text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-10 py-2.5 text-slate-800 placeholder-slate-400 transition-all shadow-xs"
                      required
                    />
                    <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-left text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-10 py-2.5 text-slate-800 placeholder-slate-400 transition-all shadow-xs"
                      required
                    />
                    <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
