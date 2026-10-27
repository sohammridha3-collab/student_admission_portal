import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import confetti from 'canvas-confetti';
import {
  FileText,
  UploadCloud,
  CreditCard,
  Send,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function ApplicationWorkflow({ onNavigate }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  const goToStatus = () => {
    if (onNavigate) onNavigate('student-status');
    navigate('/student/status');
  };

  // Form State
  const [courseApplied, setCourseApplied] = useState('Bachelor of Computer Science');
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dob: '',
    gender: 'Female',
    phone: '',
    address: '',
    guardianName: '',
    guardianPhone: ''
  });
  const [academicInfo, setAcademicInfo] = useState({
    highSchool: '',
    board: '',
    graduationYear: '2024',
    gpaOrPercentage: '',
    majorStream: 'Science, Mathematics & Computing',
    achievements: ''
  });

  // Upload State
  const [uploadingDocType, setUploadingDocType] = useState('');
  const [uploading, setUploading] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4111 •••• •••• 1111',
    expiry: '12/28',
    cvv: '921',
    cardholderName: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentApplication();
      setData(res);

      const app = res.application;
      if (app) {
        if (app.course_applied) setCourseApplied(app.course_applied);
        if (app.personal_info) {
          const p = JSON.parse(app.personal_info);
          setPersonalInfo((prev) => ({ ...prev, ...p }));
          if (p.fullName && !cardDetails.cardholderName) {
            setCardDetails((prev) => ({ ...prev, cardholderName: p.fullName }));
          }
        }
        if (app.academic_info) {
          setAcademicInfo((prev) => ({ ...prev, ...JSON.parse(app.academic_info) }));
        }

        // Jump to appropriate step if already partially completed
        const chk = res.checklist;
        if (!chk.isFormFilled) setActiveStep(1);
        else if (!chk.hasAllRequiredDocs) setActiveStep(2);
        else if (!chk.isFeePaid) setActiveStep(3);
        else setActiveStep(4);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load application data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async (e) => {
    if (e) e.preventDefault();
    try {
      await api.saveStudentForm({
        courseApplied,
        personalInfo,
        academicInfo
      });
      toast.success('Application form saved successfully!');
      await loadWorkflowData();
      setActiveStep(2);
    } catch (err) {
      toast.error(err.message || 'Failed to save form.');
    }
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;
    setUploadingDocType(documentType);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('file', file);

      await api.uploadStudentDocument(formData);
      toast.success(`${documentType} uploaded successfully!`);
      await loadWorkflowData();
    } catch (err) {
      toast.error(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
      setUploadingDocType('');
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await api.deleteStudentDocument(docId);
      toast.info('Document removed.');
      await loadWorkflowData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete document.');
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);
    try {
      await api.payApplicationFee({
        paymentMethod,
        cardholderName: cardDetails.cardholderName || personalInfo.fullName
      });
      toast.success('Payment completed successfully! Transaction receipt generated.');
      await loadWorkflowData();
      setActiveStep(4);
    } catch (err) {
      toast.error(err.message || 'Payment processing failed.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubmitFinalApplication = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitApplication();
      toast.success('Application submitted successfully! It is now queued for officer review.');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      await loadWorkflowData();
      goToStatus();
    } catch (err) {
      toast.error(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
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
  const isSubmitted = app?.status && app.status !== 'DRAFT';

  const steps = [
    { num: 1, title: 'Fill Form', icon: FileText, complete: checklist.isFormFilled },
    { num: 2, title: 'Upload Docs', icon: UploadCloud, complete: checklist.hasAllRequiredDocs },
    { num: 3, title: 'Pay Fee', icon: CreditCard, complete: checklist.isFeePaid },
    { num: 4, title: 'Submit', icon: Send, complete: isSubmitted }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Application ID: {app?.application_number}
            </span>
            <StatusBadge status={app?.status} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Application Submission Workflow
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow the mandatory multi-step procedure to file your admissions dossier.
          </p>
        </div>

        {isSubmitted && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-900 block">Application is Submitted</span>
              <span className="text-emerald-700">Dossier is locked and currently in review.</span>
            </div>
            <button
              onClick={goToStatus}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              Track Status
            </button>
          </div>
        )}
      </div>

      {/* Step Navigation Tabs */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : s.complete
                    ? 'bg-emerald-50/60 text-slate-800 border border-emerald-200/60 hover:bg-emerald-50'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : s.complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {s.complete ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <div>
                  <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    {s.title}
                  </p>
                  <span className={`text-[10px] ${isActive ? 'text-brand-100' : s.complete ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    {s.complete ? 'Completed' : isActive ? 'Active Step' : 'Pending'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: FILL APPLICATION FORM */}
      {activeStep === 1 && (
        <form onSubmit={handleSaveForm} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1: Applicant Details &amp; Academic History</h2>
              <p className="text-xs text-slate-500">Provide legal identification and prior secondary academic records.</p>
            </div>
            {isSubmitted && (
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-semibold border border-amber-200">
                Read-Only (Submitted)
              </span>
            )}
          </div>

          {/* Program Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Degree Program Applied For
            </label>
            <select
              disabled={isSubmitted}
              value={courseApplied}
              onChange={(e) => setCourseApplied(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Bachelor of Computer Science">Bachelor of Computer Science</option>
              <option value="Bachelor of Software Engineering">Bachelor of Software Engineering</option>
              <option value="Bachelor of Data Science & AI">Bachelor of Data Science &amp; AI</option>
              <option value="Bachelor of Electrical Engineering">Bachelor of Electrical Engineering</option>
              <option value="Bachelor of Business Administration">Bachelor of Business Administration</option>
            </select>
          </div>

          {/* Section: Personal Info */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-brand-600">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitted}
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                  placeholder="e.g. Alice Morgan"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  disabled={isSubmitted}
                  value={personalInfo.dob}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, dob: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender Identity</label>
                <select
                  disabled={isSubmitted}
                  value={personalInfo.gender}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  disabled={isSubmitted}
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Residential Street Address *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitted}
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                  placeholder="Street, City, State / Province, Postal Code, Country"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={personalInfo.guardianName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, guardianName: e.target.value })}
                  placeholder="Guardian Name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Guardian Phone Number</label>
                <input
                  type="tel"
                  disabled={isSubmitted}
                  value={personalInfo.guardianPhone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, guardianPhone: e.target.value })}
                  placeholder="Guardian Contact"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Academic History */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-brand-600">
              Secondary Academic Record
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">High School / Academy Name *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitted}
                  value={academicInfo.highSchool}
                  onChange={(e) => setAcademicInfo({ ...academicInfo, highSchool: e.target.value })}
                  placeholder="e.g. Springfield High Academy"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Examination Board / System</label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={academicInfo.board}
                  onChange={(e) => setAcademicInfo({ ...academicInfo, board: e.target.value })}
                  placeholder="State Board / IB / AP / Cambridge"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Graduation Year *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitted}
                  value={academicInfo.graduationYear}
                  onChange={(e) => setAcademicInfo({ ...academicInfo, graduationYear: e.target.value })}
                  placeholder="2024"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cumulative GPA / Percentage *</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitted}
                  value={academicInfo.gpaOrPercentage}
                  onChange={(e) => setAcademicInfo({ ...academicInfo, gpaOrPercentage: e.target.value })}
                  placeholder="e.g. 3.85 / 4.0 or 92%"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Honors &amp; Extra-Curriculars</label>
                <textarea
                  rows={2}
                  disabled={isSubmitted}
                  value={academicInfo.achievements}
                  onChange={(e) => setAcademicInfo({ ...academicInfo, achievements: e.target.value })}
                  placeholder="Olympiads, science fairs, club leadership, athletics..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">Step 1 of 4</span>
            {isSubmitted ? (
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                Proceed to Document Uploads
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                Save Details &amp; Proceed to Uploads
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      )}

      {/* STEP 2: UPLOAD DOCUMENTS */}
      {activeStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 2: Upload Required Documents</h2>
              <p className="text-xs text-slate-500">
                Official documents are verified for authenticity by an Admission Officer before application review.
              </p>
            </div>
            <span className="text-xs text-slate-400">Step 2 of 4</span>
          </div>

          {/* Required Docs Grid */}
          <div className="space-y-4">
            {(policy.required_documents || [
              'High School Transcript',
              'Government ID',
              'Passport Photo'
            ]).map((reqDocType, idx) => {
              const uploadedDoc = app?.documents?.find((d) => d.document_type === reqDocType);
              const isCurrentlyUploading = uploading && uploadingDocType === reqDocType;

              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{reqDocType}</h4>
                        {uploadedDoc ? (
                          <StatusBadge status={uploadedDoc.verification_status} />
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Required Upload
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {uploadedDoc
                          ? `${uploadedDoc.original_filename} (${uploadedDoc.file_size ? `${(uploadedDoc.file_size / 1024).toFixed(1)} KB` : 'Uploaded'})`
                          : 'Accepted formats: PDF, JPG, PNG (Max: 10MB)'}
                      </p>
                      {uploadedDoc?.verification_status === 'REJECTED' && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          Officer Note: {uploadedDoc.rejection_reason || 'Document was rejected. Please re-upload.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {uploadedDoc && (
                      <>
                        <a
                          href={`http://localhost:5000${uploadedDoc.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Preview
                        </a>
                        {!isSubmitted && (
                          <button
                            onClick={() => handleDeleteDocument(uploadedDoc.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Remove Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {!isSubmitted && (
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50">
                        <UploadCloud className="w-4 h-4" />
                        <span>{isCurrentlyUploading ? 'Uploading...' : uploadedDoc ? 'Replace File' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={isCurrentlyUploading}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(reqDocType, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveStep(1)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Form
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              Proceed to Fee Payment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAY APPLICATION FEE */}
      {activeStep === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 3: Pay Application Fee</h2>
              <p className="text-xs text-slate-500">
                Official university application evaluation fee processing.
              </p>
            </div>
            <span className="text-xs text-slate-400">Step 3 of 4</span>
          </div>

          {checklist.isFeePaid ? (
            <div className="p-8 text-center bg-emerald-50/60 rounded-3xl border border-emerald-200 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-900">Fee Payment Completed</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Your admission processing fee of <strong>${app.payment?.amount?.toFixed(2) || '75.00'} USD</strong> was successfully authorized.
              </p>
              <div className="p-3 bg-white border border-emerald-200 rounded-xl inline-block text-xs font-mono text-slate-800">
                Transaction ID: <strong>{app.payment?.transaction_id}</strong>
              </div>
              <div>
                <button
                  onClick={() => onNavigate('student-receipt')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  View Printable Transaction Receipt
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Order Summary */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Secured Checkout</span>
                  </div>
                  <h3 className="text-base font-bold">Admissions Processing Fee</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Non-refundable credential evaluation and entrance testing fee for {app?.course_applied}.
                  </p>
                </div>
                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Base Evaluation</span>
                    <span>${policy.application_fee?.toFixed(2) || '75.00'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Processing &amp; Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                    <span>Total Due</span>
                    <span className="text-emerald-400">${policy.application_fee?.toFixed(2) || '75.00'} USD</span>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleProcessPayment} className="md:col-span-2 space-y-4">
                {/* Payment Methods */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      paymentMethod === 'UPI'
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NET_BANKING')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      paymentMethod === 'NET_BANKING'
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Net Banking
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardDetails.cardholderName}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                    placeholder="Full name as printed on card"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                    placeholder="4111 0000 0000 1111"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      placeholder="12/28"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      required
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      placeholder="921"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processingPayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingPayment ? 'Processing Gateway Payment...' : `Authorize & Pay $${policy.application_fee?.toFixed(2) || '75.00'} USD`}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveStep(2)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documents
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              Proceed to Final Submission
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUBMIT APPLICATION (STRICT <<INCLUDE>> VALIDATION) */}
      {activeStep === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 4: Review Dossier &amp; Final Submission</h2>
              <p className="text-xs text-slate-500">
                All prerequisites (Form, Documents, and Fee) must be certified before final filing.
              </p>
            </div>
            <span className="text-xs text-slate-400">Step 4 of 4</span>
          </div>

          {/* Strict <<include>> Checklist Box */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              UML &lt;&lt;include&gt;&gt; Prerequisite Checklist
            </h3>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {checklist.isFormFilled ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Personal &amp; Academic Form</span>
                    <span className="text-[11px] text-slate-500">Candidate identification and scholastic credentials</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStep(1)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  {checklist.isFormFilled ? 'Edit Form' : 'Complete Form'}
                </button>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {checklist.hasAllRequiredDocs ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  )}
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Required Document Uploads</span>
                    <span className="text-[11px] text-slate-500">
                      {checklist.hasAllRequiredDocs
                        ? 'All mandatory certificates attached'
                        : `Missing: ${checklist.missingDocs?.join(', ') || 'Files'}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStep(2)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  {checklist.hasAllRequiredDocs ? 'View Files' : 'Upload Files'}
                </button>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {checklist.isFeePaid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  )}
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Application Fee Payment</span>
                    <span className="text-[11px] text-slate-500">
                      {checklist.isFeePaid
                        ? `Authorized ($${app.payment?.amount?.toFixed(2)})`
                        : 'Unpaid mandatory fee'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStep(3)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  {checklist.isFeePaid ? 'View Receipt' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>

          {/* Submission Action */}
          {isSubmitted ? (
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-emerald-900 text-base">Application Successfully Filed</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Submitted on {new Date(app.submission_date).toLocaleDateString()}. Your dossier is currently in the verification pipeline.
              </p>
              <button
                onClick={() => onNavigate('student-status')}
                className="mt-3 px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
              >
                Track Review Status
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!checklist.isReadyToSubmit && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Submission Locked</span>
                    <p>
                      You cannot submit until all 3 prior steps (Fill Form, Upload Docs, and Pay Fee) are 100% completed.
                    </p>
                  </div>
                </div>
              )}

              {policy.isDeadlinePassed && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Admissions Deadline Passed</span>
                    <p>The deadline to submit new applications for this cycle has expired.</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitFinalApplication}
                disabled={!checklist.isReadyToSubmit || policy.isDeadlinePassed || submitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting Application Dossier...' : 'Submit Final Application'}
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveStep(3)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Fee
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
