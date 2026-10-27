import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import AcceptanceLetterModal from '../../components/AcceptanceLetterModal';
import {
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Award,
  AlertCircle,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function ApplicationStatus({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLetterModal, setShowLetterModal] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentApplication();
      setData(res);
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
  const status = app?.status || 'DRAFT';

  // Compute Stage States
  const isDraft = status === 'DRAFT';
  const isSubmitted = ['SUBMITTED', 'UNDER_REVIEW', 'TEST_SCHEDULED', 'APPROVED', 'REJECTED'].includes(status);
  const isUnderReview = ['UNDER_REVIEW', 'TEST_SCHEDULED', 'APPROVED', 'REJECTED'].includes(status);
  const isTestStage = ['TEST_SCHEDULED', 'APPROVED', 'REJECTED'].includes(status);
  const isDecisionMade = ['APPROVED', 'REJECTED'].includes(status);

  const test = app?.entrance_test;
  const docs = app?.documents || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Admission Tracker
            </span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Real-Time Application Status
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Application Reference: <strong className="font-mono text-slate-800">{app?.application_number}</strong> • Degree: {app?.course_applied}
          </p>
        </div>

        {status === 'APPROVED' && (
          <button
            onClick={() => setShowLetterModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 shrink-0"
          >
            <Award className="w-4 h-4 text-amber-300" />
            View Admission Letter
          </button>
        )}
      </div>

      {/* Decision Callout Banner */}
      {status === 'APPROVED' ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Admission Offer Confirmed!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                {app.review_notes || 'Welcome to Metropolitan University. Your application was officially approved.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLetterModal(true)}
            className="px-4 py-2 bg-white text-emerald-800 rounded-xl font-bold text-xs hover:bg-emerald-50 transition shrink-0"
          >
            Download Letter
          </button>
        </div>
      ) : status === 'REJECTED' ? (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm flex items-start gap-4">
          <XCircle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold">Application Status: Not Admitted</h3>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              {app.review_notes || 'We regret to inform you that your application was not accepted for this academic cycle.'}
            </p>
          </div>
        </div>
      ) : null}

      {/* Visual Timeline Pipeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-8">
        <h2 className="text-lg font-bold text-slate-900">Admissions Pipeline Timeline</h2>

        <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 space-y-8 pl-6 sm:pl-8">
          {/* Stage 1: Submission */}
          <div className="relative">
            <div
              className={`absolute -left-[33px] sm:-left-[41px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                isSubmitted
                  ? 'bg-emerald-600 border-white text-white shadow-md'
                  : 'bg-slate-200 border-white text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Application Submitted</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSubmitted ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isSubmitted ? 'Completed' : 'Draft In-Progress'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {app?.submission_date
                  ? `Submitted on ${new Date(app.submission_date).toLocaleDateString()} at ${new Date(app.submission_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Application dossier is still in draft state.'}
              </p>
            </div>
          </div>

          {/* Stage 2: Document Verification */}
          <div className="relative">
            <div
              className={`absolute -left-[33px] sm:-left-[41px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                docs.length > 0 && docs.every((d) => d.verification_status === 'VERIFIED')
                  ? 'bg-emerald-600 border-white text-white shadow-md'
                  : isUnderReview
                  ? 'bg-amber-500 border-white text-white shadow-md animate-pulse'
                  : 'bg-slate-200 border-white text-slate-500'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Official Document Verification</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {docs.filter(d => d.verification_status === 'VERIFIED').length} of {docs.length} Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Admissions Officers inspect transcript authenticity, identity credentials, and prerequisite completion.
              </p>

              {/* Document verification checklist */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-700 truncate mr-2">{doc.document_type}</span>
                    <StatusBadge status={doc.verification_status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stage 3: Entrance Test */}
          <div className="relative">
            <div
              className={`absolute -left-[33px] sm:-left-[41px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                test && (test.status === 'COMPLETED' || test.status === 'WAIVED')
                  ? 'bg-emerald-600 border-white text-white shadow-md'
                  : isTestStage
                  ? 'bg-purple-600 border-white text-white shadow-md animate-pulse'
                  : 'bg-slate-200 border-white text-slate-500'
              }`}
            >
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Entrance Aptitude Evaluation</h3>
                {test && <StatusBadge status={test.status} />}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Undergraduate Academic Aptitude Test (UAAT) administered and recorded by Admission Officers.
              </p>

              {test && test.status === 'COMPLETED' && (
                <div className="mt-3 p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-900 block">Test Score Recorded</span>
                    <span className="text-purple-700">Evaluation Date: {new Date(test.test_date || test.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-purple-900">{test.score} / {test.max_score}</span>
                    <span className={`block text-[10px] font-bold ${test.score >= test.passing_score ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {test.score >= test.passing_score ? 'Passed Requirement' : 'Below Standard'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stage 4: Committee Decision */}
          <div className="relative">
            <div
              className={`absolute -left-[33px] sm:-left-[41px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                status === 'APPROVED'
                  ? 'bg-emerald-600 border-white text-white shadow-md'
                  : status === 'REJECTED'
                  ? 'bg-rose-600 border-white text-white shadow-md'
                  : 'bg-slate-200 border-white text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Final Admissions Decision</h3>
                <StatusBadge status={status === 'APPROVED' || status === 'REJECTED' ? status : 'PENDING'} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isDecisionMade
                  ? `Decision finalized on ${new Date(app.decision_date || app.updated_at).toLocaleDateString()}`
                  : 'Pending completion of document verification and aptitude exam.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acceptance Letter Modal */}
      {showLetterModal && (
        <AcceptanceLetterModal
          isOpen={showLetterModal}
          onClose={() => setShowLetterModal(false)}
          application={app}
          student={data?.application?.student}
        />
      )}
    </div>
  );
}
