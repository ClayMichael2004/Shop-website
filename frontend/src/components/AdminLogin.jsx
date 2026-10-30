import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onCancel, defaultEmail = "admin@kadianga.store" }) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const candidateKey = password.trim();
    if (!email.trim()) {
      setError('Please enter your staff email address.');
      return;
    }
    if (!candidateKey) {
      setError('Please enter your security key.');
      return;
    }

    setLoading(true);

    try {
      // Authenticate strictly against backend verification endpoint (protected by brute-force limiter)
      const res = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${candidateKey}`
        }
      });

      if (res.ok) {
        onLoginSuccess({
          email: email.trim(),
          token: candidateKey,
          loggedInAt: new Date().toISOString()
        });
        return;
      }

      if (res.status === 429) {
        setError('Too many failed attempts. Security rate-limit active. Please wait 1 minute.');
        return;
      }

      setError('Access denied: Invalid administrator security key.');
    } catch (err) {
      setError('Connection failed. Please ensure the server is online.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-login-title"
    >
      {/* Centered Modal Window */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col relative my-auto">
        
        {/* Modal Top Header with Close Button */}
        <div className="w-full px-6 py-5 flex items-center justify-between border-b border-neutral-100 bg-[#faf9f6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18181b] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              KE
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif font-bold text-sm text-[#18181b] tracking-wider">
                KADIANGA
              </span>
              <span className="text-[9px] uppercase font-sans font-bold tracking-widest text-[#e67e22]">
                Staff Portal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-neutral-200/70 hover:bg-neutral-300 flex items-center justify-center text-neutral-700 hover:text-black transition-colors"
            aria-label="Close Staff Login"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex flex-col">
          
          <div className="mb-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#e67e22] flex items-center justify-center mx-auto mb-3 border border-orange-100">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 id="staff-login-title" className="text-xl font-bold text-neutral-900 tracking-tight">
              Authorized Personnel Access
            </h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
              Sign in with your staff security credentials to manage inventory, respond to customer quotations, and view sales analytics.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200/60 text-xs text-red-700 flex items-start gap-2.5 leading-snug">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Staff Email
              </label>
              <div className="flex items-center gap-2.5 bg-[#f5f5f4] rounded-xl px-3.5 py-2.5 border border-neutral-200 focus-within:border-neutral-900 focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kadianga.store"
                  className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Security Key Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Security Key / Password
              </label>
              <div className="flex items-center gap-2.5 bg-[#f5f5f4] rounded-xl px-3.5 py-2.5 border border-neutral-200 focus-within:border-neutral-900 focus-within:bg-white transition-all">
                <Lock className="w-4 h-4 text-neutral-500 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key"
                  className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-500 hover:text-black transition-colors p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#18181b] hover:bg-[#e67e22] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-md active:scale-95 transition-all text-center disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Authenticate & Open Dashboard'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Encrypted Session • Zero Trust</span>
            <button
              type="button"
              onClick={onCancel}
              className="text-neutral-600 hover:text-black font-semibold hover:underline"
            >
              Return to Storefront
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
