import React, { useState } from 'react';
import { MobLogo } from '../brand/MobLogo.js';
import { Pharmacy } from '../../types/pharmacy.js';
import { Lock, Phone, Mail, Building, MapPin, FileText, CheckCircle, AlertCircle, X, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (pharmacy: Pharmacy, isSuperAdmin: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [emailOrPhone, setEmailOrPhone] = useState('rajesh@sanjivanimedical.in');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register form state
  const [regData, setRegData] = useState({
    name: '',
    ownerName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    gstin: '',
    dlNumber: '',
    fssaiNumber: '',
    upiVpa: ''
  });

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailOrPhone,
          password,
          deviceName: 'Web Terminal ' + (navigator.platform || 'Desktop'),
          platform: 'Web'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.role === 'superadmin') {
        onLoginSuccess(null as any, true);
      } else {
        onLoginSuccess(data.pharmacy, false);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      onLoginSuccess(data.pharmacy, false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick switch helpers
  const fillDemoPharmacy = () => {
    setEmailOrPhone('rajesh@sanjivanimedical.in');
    setPassword('password123');
    setMode('login');
  };

  const fillSuperAdmin = () => {
    setEmailOrPhone('admin@medione.in');
    setPassword('admin@123');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header with Brand */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <MobLogo size="md" showSubtitle={true} />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 text-sm">
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`pb-2.5 font-bold px-4 transition-colors ${
                mode === 'login'
                  ? 'border-b-2 border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In to Store
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`pb-2.5 font-bold px-4 transition-colors ${
                mode === 'register'
                  ? 'border-b-2 border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register New Pharmacy (24h Free Trial)
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Mobile or Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. 9820198201 or rajesh@sanjivanimedical.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors mt-2"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Pharmacy'}
              </button>

              {/* Quick Preset Buttons for Instant Testing */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block text-center">
                  Quick Access Profiles:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={fillDemoPharmacy}
                    className="p-2 border rounded-lg text-left hover:bg-teal-50 dark:hover:bg-slate-800"
                  >
                    <span className="font-bold text-slate-900 dark:text-white block">Demo Pharmacy</span>
                    <span className="text-[10px] text-slate-500">Sanjivani Medical Store</span>
                  </button>
                  <button
                    type="button"
                    onClick={fillSuperAdmin}
                    className="p-2 border rounded-lg text-left hover:bg-amber-50 dark:hover:bg-slate-800"
                  >
                    <span className="font-bold text-amber-700 dark:text-amber-400 block">Super Admin</span>
                    <span className="text-[10px] text-slate-500">Platform Owner Console</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5">Pharmacy / Store Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LifeCare Medicos"
                    value={regData.name}
                    onChange={e => setRegData({ ...regData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5">Owner / Pharmacist Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arvind Verma"
                    value={regData.ownerName}
                    onChange={e => setRegData({ ...regData, ownerName: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="98XXXXXXXX"
                    value={regData.mobile}
                    onChange={e => setRegData({ ...regData, mobile: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="store@pharmacy.in"
                    value={regData.email}
                    onChange={e => setRegData({ ...regData, email: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-0.5">Store Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Shop No. 1, Main Market Road"
                  value={regData.address}
                  onChange={e => setRegData({ ...regData, address: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5">City / District *</label>
                  <input
                    type="text"
                    required
                    placeholder="Pune"
                    value={regData.city}
                    onChange={e => setRegData({ ...regData, city: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="Maharashtra"
                    value={regData.state}
                    onChange={e => setRegData({ ...regData, state: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="411001"
                    value={regData.pincode}
                    onChange={e => setRegData({ ...regData, pincode: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5">Drug License Number (DL)</label>
                  <input
                    type="text"
                    placeholder="20B/21B-XXXXX"
                    value={regData.dlNumber}
                    onChange={e => setRegData({ ...regData, dlNumber: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5">GSTIN (If registered)</label>
                  <input
                    type="text"
                    placeholder="27XXXXX0000X1Z1"
                    value={regData.gstin}
                    onChange={e => setRegData({ ...regData, gstin: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-lg text-[11px] text-teal-800 dark:text-teal-300">
                ✓ <strong>24-Hour Instant Full Access Trial</strong> will be activated automatically upon registration with anti-tamper server timestamp protection.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors mt-2"
              >
                {isLoading ? 'Creating Account...' : 'Register Pharmacy & Start ₹1 Trial'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
