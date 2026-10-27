import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  GraduationCap,
  ArrowRight,
  Shield,
  FileCheck2,
  Calendar,
  CreditCard,
  Award,
  Sparkles,
  Users,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function Home({ onNavigate }) {
  const navigate = useNavigate();
  const { loginAsDemo, isAuthenticated, role } = useAuth();
  const toast = useToast();
  const [policy, setPolicy] = useState(null);

  const goTo = (path) => {
    if (onNavigate) onNavigate(path);
    navigate(path);
  };

  useEffect(() => {
    async function fetchPolicy() {
      try {
        const data = await api.getSystemPolicy();
        setPolicy(data);
      } catch (e) {
        // silent
      }
    }
    fetchPolicy();
  }, []);

  const handleDemoLaunch = async (account) => {
    try {
      await loginAsDemo(account);
      toast.success(`Logged in as ${account.label}`);
      if (account.role === 'STUDENT') goTo('/student/dashboard');
      else if (account.role === 'OFFICER') goTo('/officer/dashboard');
      else goTo('/admin/dashboard');
    } catch (err) {
      toast.error('Failed to log in as demo user.');
    }
  };

  const deadlineFormatted = policy?.application_deadline
    ? new Date(policy.application_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'December 15, 2026';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,170,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_50%)]" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-brand-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Academic Year 2026-2027 Admissions Open</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Seamless, Automated <br />
            <span className="bg-gradient-to-r from-brand-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
              University Admission Portal
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            A unified digital ecosystem connecting prospective students, admission officers, and administrators with strict workflow enforcement, automated verification, and instant status tracking.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  if (role === 'STUDENT') goTo('/student/dashboard');
                  else if (role === 'OFFICER') goTo('/officer/dashboard');
                  else goTo('/admin/dashboard');
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/25 transition"
              >
                Go to My Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => goTo('/register')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white shadow-xl shadow-brand-500/25 transition"
                >
                  Start Student Application
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goTo('/login')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition"
                >
                  Sign In to Existing Account
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Key Admission Policy Bar */}
      <div className="max-w-5xl mx-auto w-full -mt-10 px-4 z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Application Deadline</p>
              <p className="text-sm font-extrabold text-slate-800">{deadlineFormatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Application Fee</p>
              <p className="text-sm font-extrabold text-slate-800">
                ${policy ? policy.application_fee.toFixed(2) : '75.00'} USD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Admission Evaluation</p>
              <p className="text-sm font-extrabold text-slate-800">
                Aptitude Test Score: {policy ? `${policy.passing_score}% Passing` : '60% Passing'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Persona Launchpad (One-click instant login for grading & testing) */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Interactive Test Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            One-Click Persona Test Switcher
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mt-2">
            Click any seeded role account below to jump directly into their tailored dashboard and explore their workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin Persona Tile */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                  Admin Role
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">System Administrator</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Full governance: User management (CRUD), RBAC permissions, audit trail logging, and global system configuration.
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-mono text-slate-600">
                <p>User: <span className="font-bold">admin@admission.edu</span></p>
                <p>Pass: <span className="font-bold">Admin@123</span></p>
              </div>
            </div>
            <button
              onClick={() => handleDemoLaunch(DEMO_ACCOUNTS[0])}
              className="mt-6 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
            >
              Launch Admin Dashboard
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Admission Officer Persona Tile */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Officer Role
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Admission Officer</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Document authenticity inspection, Entrance exam scoring, and final Approve/Reject decision engine.
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-mono text-slate-600">
                <p>User: <span className="font-bold">officer@admission.edu</span></p>
                <p>Pass: <span className="font-bold">Officer@123</span></p>
              </div>
            </div>
            <button
              onClick={() => handleDemoLaunch(DEMO_ACCOUNTS[1])}
              className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
            >
              Launch Officer Review Queue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Student Persona Tile */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Student Role
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Applicant (Alice Morgan)</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Submitted application workflow: Form filled, documents uploaded, fee paid, real-time status tracker active.
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-mono text-slate-600">
                <p>User: <span className="font-bold">alice@student.edu</span></p>
                <p>Pass: <span className="font-bold">Student@123</span></p>
              </div>
            </div>
            <button
              onClick={() => handleDemoLaunch(DEMO_ACCOUNTS[2])}
              className="mt-6 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              Launch Student Portal
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4-Step Student Workflow Architecture Highlights */}
      <section className="bg-white border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              UML Workflow Model
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Strict Multi-Step Application Pipeline
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto mt-2">
              Based strictly on the UML Use Case specifications with enforced &lt;&lt;include&gt;&gt; relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                1
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Fill Application Form</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Prospective students enter personal identity, contact data, guardian info, and high school academic history.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                2
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Upload Documents</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Multer-powered upload for official transcripts, government-issued IDs, and passport photos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                3
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Pay Application Fee</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Integrated payment gateway simulator with instant transaction receipts and verified status.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                4
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Submit &amp; Review</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Final validation unlocking real-time review by Admission Officers and official decision letters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-800">
        <p className="font-semibold text-slate-300">Student Admission Portal System</p>
        <p className="mt-1">Architected with React, Tailwind CSS, Node.js Express, Prisma ORM, and JWT RBAC.</p>
      </footer>
    </div>
  );
}
