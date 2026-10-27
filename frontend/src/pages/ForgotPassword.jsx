import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { KeyRound, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword({ onNavigate, setResetTokenContext }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState(null);
  const [error, setError] = useState('');

  const goTo = (path) => {
    if (onNavigate) onNavigate(path);
    navigate(path);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.forgotPassword({ email });
      setTokenResult(data);
      toast.success('Password reset instructions generated.');
    } catch (err) {
      setError(err.message || 'Failed to process request.');
      toast.error(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToReset = () => {
    if (tokenResult?.resetToken) {
      if (setResetTokenContext) setResetTokenContext(tokenResult.resetToken);
      goTo(`/reset-password?token=${tokenResult.resetToken}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Password Recovery
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your account email to receive reset instructions
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tokenResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Reset Token Generated</span>
                </div>
                <p className="leading-relaxed">
                  In production, a password reset link is delivered via SMTP. For local testing convenience, your secure reset token is provided below:
                </p>
                <div className="p-2.5 bg-white border border-emerald-300 rounded-xl font-mono text-[11px] text-slate-800 break-all select-all">
                  {tokenResult.resetToken}
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToReset}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
              >
                Proceed to Reset Password
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Generating Reset Token...' : 'Generate Reset Token'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            Remembered your credentials?{' '}
            <button
              type="button"
              onClick={() => goTo('/login')}
              className="font-bold text-brand-600 hover:text-brand-700"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
