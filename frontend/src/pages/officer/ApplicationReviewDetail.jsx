import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
  ArrowLeft,
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Calendar,
  User,
  GraduationCap,
  Eye,
  FileText,
  ShieldCheck,
  Lock,
  Sparkles
} from 'lucide-react';

export default function ApplicationReviewDetail({ applicationId, onNavigate }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const activeAppId = applicationId || paramId || 1;
  const { user, permissions } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const goTo = (path) => {
    if (onNavigate) onNavigate(path);
    navigate(path);
  };

  useEffect(() => {
    if (activeAppId) {
      loadApplication();
    }
  }, [activeAppId]);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // Entrance Test State
  const [testScore, setTestScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [testStatus, setTestStatus] = useState('COMPLETED');
  const [testNotes, setTestNotes] = useState('');
  const [savingTest, setSavingTest] = useState(false);

  // Decision Modal
  const [decisionType, setDecisionType] = useState(null); // 'APPROVED' or 'REJECTED'
  const [decisionNotes, setDecisionNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const res = await api.getOfficerApplicationDetail(activeAppId);
      setData(res);

      if (res.application?.entrance_test) {
        const t = res.application.entrance_test;
        if (t.score !== null && t.score !== undefined) setTestScore(String(t.score));
        if (t.max_score) setMaxScore(String(t.max_score));
        if (t.status) setTestStatus(t.status);
        if (t.notes) setTestNotes(t.notes);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (docId) => {
    try {
      await api.verifyDocument(docId, { status: 'VERIFIED' });
      toast.success('Document certified authentic!');
      await loadApplication();
    } catch (err) {
      toast.error(err.message || 'Failed to verify document.');
    }
  };

  const handleRejectDocument = async (docId, rejectionReason) => {
    try {
      await api.verifyDocument(docId, { status: 'REJECTED', rejectionReason });
      toast.warning('Document marked as rejected.');
      await loadApplication();
    } catch (err) {
      toast.error(err.message || 'Failed to reject document.');
    }
  };

  const handleSaveEntranceTest = async (e) => {
    e.preventDefault();
    setSavingTest(true);
    try {
      await api.recordEntranceTest(activeAppId, {
        score: testStatus === 'WAIVED' ? null : parseFloat(testScore),
        maxScore: parseFloat(maxScore),
        passingScore: data?.policy?.passing_score || 60,
        status: testStatus,
        notes: testNotes
      });
      toast.success('Entrance test evaluation recorded successfully!');
      await loadApplication();
    } catch (err) {
      toast.error(err.message || 'Failed to record test scores.');
    } finally {
      setSavingTest(false);
    }
  };

  const triggerDecisionModal = (type) => {
    setDecisionType(type);
    setDecisionNotes(
      type === 'APPROVED'
        ? 'Candidate exhibits exceptional academic merits and passed entrance examination.'
        : 'Applicant does not meet minimum academic threshold for this cycle.'
    );
    setShowConfirmModal(true);
  };

  const handleConfirmDecision = async () => {
    setSubmittingDecision(true);
    try {
      await api.makeDecision(activeAppId, {
        decision: decisionType,
        notes: decisionNotes
      });
      toast.success(`Application successfully marked as ${decisionType}! Student notified.`);
      setShowConfirmModal(false);
      await loadApplication();
    } catch (err) {
      toast.error(err.message || 'Failed to record decision.');
    } finally {
      setSubmittingDecision(false);
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
  if (!app) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Application not found.</p>
        <button onClick={() => goTo('/officer/queue')} className="mt-4 text-xs font-bold text-brand-600">
          Back to Queue
        </button>
      </div>
    );
  }

  const personal = app.personal_info ? JSON.parse(app.personal_info) : {};
  const academic = app.academic_info ? JSON.parse(app.academic_info) : {};
  const workflow = data?.workflowCheck || {};
  const canMakeDecision = permissions?.canMakeDecision !== false; // Admin or Officer with permission

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goTo('/officer/queue')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications Queue
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Dossier #{app.application_number}</span>
          <StatusBadge status={app.status} />
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
            {app.student?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{app.student?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {app.student?.email} • Applied for <strong className="text-slate-800">{app.course_applied}</strong>
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span>Term: <strong className="text-slate-700">{app.academic_year}</strong></span>
              <span>•</span>
              <span>Submitted: <strong className="text-slate-700">{app.submission_date ? new Date(app.submission_date).toLocaleDateString() : 'Draft'}</strong></span>
              <span>•</span>
              <span>Fee: <strong className="text-emerald-700">{app.payment?.status === 'COMPLETED' ? 'Paid ($75)' : 'Unpaid'}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Decision Preview if already finalized */}
        {(app.status === 'APPROVED' || app.status === 'REJECTED') && (
          <div className={`p-4 rounded-2xl border text-xs min-w-[200px] ${
            app.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <span className="font-bold uppercase tracking-wider block text-[10px]">Decision Finalized</span>
            <p className="font-extrabold text-sm mt-0.5">{app.status}</p>
            <p className="text-[11px] mt-1">{app.review_notes}</p>
          </div>
        )}
      </div>

      {/* Grid: Candidate Profile & Academic Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Dossier */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-brand-600">
            <User className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Candidate Identification</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Date of Birth</span>
              <span className="font-bold text-slate-800">{personal.dob || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Gender</span>
              <span className="font-bold text-slate-800">{personal.gender || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Contact Phone</span>
              <span className="font-bold text-slate-800">{personal.phone || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Guardian</span>
              <span className="font-bold text-slate-800">{personal.guardianName || 'None'} ({personal.guardianPhone || 'N/A'})</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block font-semibold">Mailing Address</span>
              <span className="font-bold text-slate-800">{personal.address || 'Address not listed'}</span>
            </div>
          </div>
        </div>

        {/* Academic Credentials */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-brand-600">
            <GraduationCap className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Academic Background</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <span className="text-slate-400 block font-semibold">Secondary Institution</span>
              <span className="font-bold text-slate-800">{academic.highSchool || 'High school not recorded'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Board / System</span>
              <span className="font-bold text-slate-800">{academic.board || 'State / National'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Graduation Year</span>
              <span className="font-bold text-slate-800">{academic.graduationYear || '2024'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Cumulative GPA / Score</span>
              <span className="font-bold text-brand-700 text-sm">{academic.gpaOrPercentage || 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Stream / Major</span>
              <span className="font-bold text-slate-800">{academic.majorStream || 'General Studies'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block font-semibold">Honors &amp; Extra-Curriculars</span>
              <span className="text-slate-700">{academic.achievements || 'None listed'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: DOCUMENT AUTHENTICITY VERIFICATION (STRICT <<INCLUDE>> RULE) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">
                1. Uploaded Credentials Verification (Mandatory &lt;&lt;include&gt;&gt;)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rule: Officers must verify all documents before proceeding to review or final decision.
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            workflow.allDocsVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {workflow.verifiedDocs} of {workflow.totalDocs} Documents Verified
          </span>
        </div>

        {/* Document list */}
        <div className="space-y-3">
          {app.documents?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No documents uploaded by student yet.</p>
          ) : (
            app.documents?.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{doc.document_type}</h4>
                      <StatusBadge status={doc.verification_status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {doc.original_filename} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Uploaded'}
                    </p>
                    {doc.verification_status === 'VERIFIED' && doc.verified_by && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Verified by {doc.verified_by.name} on {new Date(doc.verified_at).toLocaleDateString()}
                      </p>
                    )}
                    {doc.verification_status === 'REJECTED' && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        Rejection reason: {doc.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect File
                  </button>
                  {doc.verification_status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerifyDocument(doc.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 2: CONDUCT / RECORD ENTRANCE TEST */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">
                2. Entrance Test &amp; Interview Evaluation
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rule: Officer must record entrance test scores (or mark waived) before final decision.
            </p>
          </div>
          {app.entrance_test && <StatusBadge status={app.entrance_test.status} />}
        </div>

        {!workflow.allDocsVerified ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Testing Stage Locked</span>
              <p>You must certify all student documents as VERIFIED before entering aptitude test scores.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveEntranceTest} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Evaluation Status
                </label>
                <select
                  value={testStatus}
                  onChange={(e) => setTestStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500"
                >
                  <option value="COMPLETED">COMPLETED (Score Recorded)</option>
                  <option value="WAIVED">WAIVED (Honor Student / Olympiad Exemption)</option>
                  <option value="SCHEDULED">SCHEDULED (Awaiting Date)</option>
                </select>
              </div>

              {testStatus !== 'WAIVED' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Exam Score (0 - 100) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={testScore}
                      onChange={(e) => setTestScore(e.target.value)}
                      placeholder="e.g. 85.5"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Passing Standard
                    </label>
                    <div className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs text-slate-600 font-bold">
                      {data?.policy?.passing_score || 60}% Required Passing
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Officer Evaluator Notes &amp; Interview Observations
              </label>
              <textarea
                rows={2}
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                placeholder="Log candidate problem solving abilities, logic reasoning, and interview feedback..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingTest}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {savingTest ? 'Saving Score...' : 'Save Entrance Test Results'}
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {/* SECTION 3: DECISION ENGINE (APPROVE / REJECT APPLICATION) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            3. Final Committee Decision Engine
          </h2>
          <p className="text-xs text-slate-500">
            Render official admission acceptance or rejection. Triggers real-time notification to the student portal.
          </p>
        </div>

        {/* Workflow prerequisites checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            workflow.allDocsVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            {workflow.allDocsVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
            <span className="font-semibold">Prerequisite 1: All Documents Certified Authenticated</span>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            workflow.testCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            {workflow.testCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
            <span className="font-semibold">Prerequisite 2: Entrance Test Scored or Waived</span>
          </div>
        </div>

        {!canMakeDecision ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Your officer account does not have the <strong>canMakeDecision</strong> permission assigned by Administrator. You may verify documents and score tests, but final decisions must be rendered by a Senior Officer or Admin.
            </span>
          </div>
        ) : !workflow.canMakeDecision ? (
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Decision buttons are locked until both Prerequisites (100% Document Verification &amp; Entrance Test Scoring) are fulfilled.
            </span>
          </div>
        ) : (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => triggerDecisionModal('APPROVED')}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve &amp; Grant Admission
            </button>

            <button
              onClick={() => triggerDecisionModal('REJECTED')}
              className="w-full sm:w-auto px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject Application
            </button>
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          isOfficer={true}
          canVerify={permissions?.canVerifyDocs !== false}
          onVerify={handleVerifyDocument}
          onReject={handleRejectDocument}
        />
      )}

      {/* Decision Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDecision}
          loading={submittingDecision}
          isDanger={decisionType === 'REJECTED'}
          title={decisionType === 'APPROVED' ? 'Grant Admission Offer' : 'Decline Application'}
          message={
            decisionType === 'APPROVED'
              ? `Confirming this decision will change status to APPROVED, notify student ${app.student?.name}, and generate their formal Acceptance Letter.`
              : `Declining will update application status to REJECTED and dispatch notification feedback to ${app.student?.name}.`
          }
          confirmText={decisionType === 'APPROVED' ? 'Confirm Official Admission' : 'Confirm Rejection'}
        />
      )}
    </div>
  );
}
