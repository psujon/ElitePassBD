import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  User, Lock, Mail, Phone, MapPin, Key, Eye, EyeOff, 
  ShieldCheck, Loader2, Save, Info, CheckCircle2, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserProfileView() {
  const { user, updateUser } = useAuth();

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    whatsapp_number: user?.whatsapp_number || '',
    address: user?.address || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await api.get('/auth/profile');
      if (res?.user) {
        setProfileForm({
          name: res.user.name || '',
          email: res.user.email || '',
          whatsapp_number: res.user.whatsapp_number || '',
          address: res.user.address || ''
        });
        updateUser(res.user);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        name: prev.name || user.name || '',
        email: user.email || '',
        whatsapp_number: prev.whatsapp_number !== undefined && prev.whatsapp_number !== '' ? prev.whatsapp_number : (user.whatsapp_number || ''),
        address: prev.address !== undefined && prev.address !== '' ? prev.address : (user.address || '')
      }));
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Full Name is required.');
      return;
    }

    try {
      setProfileUpdating(true);
      const res = await api.put('/auth/profile', {
        name: profileForm.name.trim(),
        whatsapp_number: profileForm.whatsapp_number ? profileForm.whatsapp_number.trim() : '',
        address: profileForm.address ? profileForm.address.trim() : ''
      });

      if (res?.user) {
        updateUser(res.user, res.token);
        toast.success(res.message || 'Profile updated successfully!');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    try {
      setPasswordUpdating(true);
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success(res.message || 'Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Change password error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Customer';

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Identity Card */}
      <div className="bg-gradient-to-r from-[#0d1627] via-[#15233c] to-[#0d1627] text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg shadow-blue-500/30 ring-4 ring-white/10 shrink-0 uppercase">
              {profileForm.name ? profileForm.name.substring(0, 2) : 'US'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {profileForm.name || 'User Profile'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verified Account
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-200">{profileForm.email}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400 text-xxs">
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs border border-white/10 px-3.5 py-2 rounded-xl text-xxs text-amber-300 font-bold max-w-sm">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Email address is permanent and cannot be modified to ensure order security and warranty records.</span>
          </div>
        </div>
      </div>

      {/* Profile Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Personal Information */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-850">Personal Details</h3>
                <p className="text-xxs text-slate-450 mt-0.5">Manage your personal and contact details</p>
              </div>
            </div>
            {profileLoading && (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Email Address - Strictly Read-Only */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Permanent (Cannot be changed)
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  readOnly
                  value={profileForm.email}
                  className="w-full bg-slate-100 text-slate-500 font-semibold border border-slate-200/90 rounded-xl pl-10 pr-10 py-2.5 text-xs cursor-not-allowed select-none transition-all outline-none shadow-inner"
                  title="Email address cannot be changed"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" title="Locked by system">
                  <Shield className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Your email is your permanent account identity tied to all purchases, invoices, and software licenses. For security, email changes are disabled.</span>
              </p>
            </div>

            {/* WhatsApp / Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                WhatsApp / Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={profileForm.whatsapp_number}
                  onChange={(e) => setProfileForm({ ...profileForm, whatsapp_number: e.target.value })}
                  placeholder="e.g. 017xxxxxxxx"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none font-medium"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span className="text-[11px] text-slate-450 mt-1 block">
                Used for instant WhatsApp delivery updates, order confirmation, and customer support.
              </span>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Delivery / Shipping Address
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="House no, Road no, Area, City, Postcode..."
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none font-medium resize-none"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              <span className="text-[11px] text-slate-450 mt-1 block">
                Default shipping and billing address for physical items or billing receipts.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileUpdating}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
              >
                {profileUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Change Password */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-850">Change Password</h3>
              <p className="text-xxs text-slate-450 mt-0.5">Keep your account secure with a new password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none font-medium"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-450 mt-1 block">
                Must be at least 6 characters. Use letters and numbers.
              </span>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordUpdating}
                className="w-full inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-slate-900/20 disabled:opacity-50 cursor-pointer"
              >
                {passwordUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Password security tip box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xxs text-slate-500 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Password Security Advice</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-0.5 leading-relaxed">
              <li>Minimum 6 characters or more.</li>
              <li>Avoid reusing passwords from other websites.</li>
              <li>Keep your login credentials private and secure.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
