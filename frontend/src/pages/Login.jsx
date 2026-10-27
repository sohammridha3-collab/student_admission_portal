import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  GraduationCap,
  Shield,
  Briefcase,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function Login({ onNavigate }) {
  const navigate = useNavigate();
  const { login, loginAsDemo } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('STUDENT'); // 'STUDENT', 'OFFICER', 'ADMIN'
  const [email, setEmail] = useState('alice@student.edu');
  const [password, setPassword] = useState('Student@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const goTo = (path) => {
    if (onNavigate) onNavigate(path);
    navigate(path);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'STUDENT') {
      setEmail('alice@student.edu');
      setPassword('Student@123');
    } else if (tab === 'OFFICER') {
      setEmail('officer@admission.edu');
      setPassword('Officer@123');
    } else if (tab === 'ADMIN') {
      setEmail('admin@admission.edu');
      setPassword('Admin@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password, activeTab);
      toast.success(`Welcome back, ${data.user.name}!`);

      if (data.user.role === 'STUDENT') goTo('/student/dashboard');
      else if (data.user.role === 'OFFICER') goTo('/officer/dashboard');
      else goTo('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoAcc) => {
    try {
      await loginAsDemo(demoAcc);
      toast.success(`Logged in as ${demoAcc.label}`);
      if (demoAcc.role === 'STUDENT') goTo('/student/dashboard');
      else if (demoAcc.role === 'OFFICER') goTo('/officer/dashboard');
      else goTo('/admin/dashboard');
    } catch (err) {
      toast.error('Failed to log in as demo user.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/25">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Portal Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your role category to access your portal space
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('STUDENT')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'STUDENT'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('OFFICER')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'OFFICER'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Officer
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('ADMIN')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ADMIN'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@admission.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => goTo('/forgot-password')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : `Sign In as ${activeTab}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* New student register link */}
          {activeTab === 'STUDENT' && (
            <div className="mt-5 text-center text-xs text-slate-500">
              Don't have an application account yet?{' '}
              <button
                type="button"
                onClick={() => goTo('/register')}
                className="font-bold text-brand-600 hover:text-brand-700"
              >
                Create Applicant Profile
              </button>
            </div>
          )}

          {/* Instant Demo Launcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Demo Login</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEMO_ACCOUNTS.filter(a => a.role === activeTab).map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickDemo(acc)}
                  className="p-2 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 rounded-xl text-left transition"
                >
                  <p className="font-bold text-slate-800 text-[11px] truncate">{acc.label}</p>
                  <span className="text-[10px] text-brand-600 font-semibold">{acc.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
