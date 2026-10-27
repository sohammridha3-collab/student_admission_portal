import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import AcceptanceLetterModal from '../../components/AcceptanceLetterModal';
import confetti from 'canvas-confetti';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  UploadCloud,
  Award,
  ArrowRight,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function StudentDashboard({ onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLetterModal, setShowLetterModal] = useState(false);

  const goTo = (view, path) => {
    if (onNavigate) onNavigate(view);
    navigate(path);
  };

  useEffect(() => {
    loadApplicationData();
  }, []);

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentApplication();
      setData(res);

      if (res.application?.status === 'APPROVED') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const app = data?.application;
  const checklist = data?.checklist || {};
  const policy = data?.policy || {};

  const stepsCompleted = [
    checklist.isFormFilled,
    checklist.hasAllRequiredDocs,
    checklist.isFeePaid,
    app?.status !== 'DRAFT'
  ].filter(Boolean).length;

  const progressPercent = (stepsCompleted / 4) * 100;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Undergraduate Admissions {policy.academic_year || '2026-2027'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Track your application dossier, upload credentials, and review your admission status in real-time.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Application ID</p>
            <p className="text-lg font-mono font-extrabold text-white mt-0.5">
              {app?.application_number || 'PENDING'}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-300">Status:</span>
              <StatusBadge status={app?.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Special Offer of Admission Banner (if APPROVED) */}
      {app?.status === 'APPROVED' && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-in zoom-in-95">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-200">
                Official Admission Decision
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                Congratulations! You Have Been Admitted!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                Your credentials have been certified and approved for {app.course_applied}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLetterModal(true)}
            className="px-6 py-3 bg-white text-emerald-800 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:bg-emerald-50 transition shrink-0 flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            View &amp; Print Admission Letter
          </button>
        </div>
      )}

      {/* Application Workflow Progress Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Application Completion Progress</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict UML workflow requires steps 1, 2, and 3 to be completed before application submission.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-brand-600">{progressPercent.toFixed(0)}% Complete</span>
            {app?.status === 'DRAFT' && (
              <button
                onClick={() => goTo('student-workflow', '/student/workflow')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition flex items-center gap-1.5"
              >
                Continue Application
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 4 Checklist Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Form Filled */}
          <div className={`p-4 rounded-2xl border transition-all ${checklist.isFormFilled ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Step 1</span>
              {checklist.isFormFilled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Application Form</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              {checklist.isFormFilled ? 'Personal & Academic info saved.' : 'Incomplete: Fill personal & academic info.'}
            </p>
          </div>

          {/* Card 2: Documents Uploaded */}
          <div className={`p-4 rounded-2xl border transition-all ${checklist.hasAllRequiredDocs ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Step 2</span>
              {checklist.hasAllRequiredDocs ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Document Uploads</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              {checklist.hasAllRequiredDocs ? 'All mandatory documents uploaded.' : `Missing: ${checklist.missingDocs?.join(', ') || 'Documents'}`}
            </p>
          </div>

          {/* Card 3: Fee Paid */}
          <div className={`p-4 rounded-2xl border transition-all ${checklist.isFeePaid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Step 3</span>
              {checklist.isFeePaid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Application Fee</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              {checklist.isFeePaid ? `Paid $${policy.application_fee || '75'} USD.` : `Required: $${policy.application_fee || '75'} USD.`}
            </p>
          </div>

          {/* Card 4: Submission */}
          <div className={`p-4 rounded-2xl border transition-all ${app?.status !== 'DRAFT' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">Step 4</span>
              {app?.status !== 'DRAFT' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Final Submission</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              {app?.status !== 'DRAFT' ? `Submitted on ${new Date(app.submission_date).toLocaleDateString()}` : 'Awaiting 1-3 completion.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Key Info & Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Track Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Application Timeline</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              View stage-by-stage progression from document verification to entrance test scoring and admission decision.
            </p>
          </div>
          <button
            onClick={() => goTo('student-status', '/student/status')}
            className="mt-6 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            Track Status Timeline
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fee Receipt Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Payment Receipt</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {checklist.isFeePaid
                ? `Transaction verified: ${app.payment?.transaction_id || 'COMPLETED'}`
                : 'Application fee is pending payment in Step 3 of the workflow.'}
            </p>
          </div>
          <button
            onClick={() =>
              checklist.isFeePaid
                ? goTo('student-receipt', '/student/receipt')
                : goTo('student-workflow', '/student/workflow')
            }
            className="mt-6 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            {checklist.isFeePaid ? 'View Official Receipt' : 'Pay Application Fee'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Policy & Deadline Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Official Admissions Notice</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {policy.announcement || 'Admissions for Academic Year 2026-2027 are officially active.'}
            </p>
            <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] text-amber-900">
              Deadline: <strong>{new Date(policy.application_deadline).toLocaleDateString()}</strong>
            </div>
          </div>
          <div className="mt-6 text-[11px] text-slate-400">
            Managed by Office of Admissions
          </div>
        </div>
      </div>

      {/* Acceptance Letter Modal */}
      {showLetterModal && (
        <AcceptanceLetterModal
          isOpen={showLetterModal}
          onClose={() => setShowLetterModal(false)}
          application={app}
          student={user}
        />
      )}
    </div>
  );
}
