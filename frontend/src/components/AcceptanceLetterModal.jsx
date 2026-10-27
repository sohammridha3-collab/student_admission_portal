import React from 'react';
import { X, Printer, Award, CheckCircle, ShieldCheck } from 'lucide-react';

export default function AcceptanceLetterModal({ isOpen, onClose, application, student }) {
  if (!isOpen || !application) return null;

  const personal = application.personal_info ? JSON.parse(application.personal_info) : {};
  const studentName = personal.fullName || student?.name || 'Prospective Student';
  const issueDate = application.decision_date
    ? new Date(application.decision_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">Official University Admission Offer</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Letter Document */}
        <div id="printable-admission-letter" className="flex-1 overflow-auto p-8 sm:p-12 bg-white text-slate-800 leading-relaxed font-serif">
          {/* Institution Header */}
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
              <Award className="w-9 h-9" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider uppercase text-slate-900 font-sans">
              Metropolitan University
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-sans mt-1">
              Office of Undergraduate Admissions & Collegiate Affairs
            </p>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              100 University Plaza, Academic Grove • admissions@admission.edu
            </p>
          </div>

          {/* Metadata Block */}
          <div className="flex flex-col sm:flex-row justify-between text-xs font-sans text-slate-600 mb-8 border-b border-slate-100 pb-4">
            <div>
              <p><strong className="text-slate-800">Date of Offer:</strong> {issueDate}</p>
              <p><strong className="text-slate-800">Application Reference:</strong> {application.application_number}</p>
            </div>
            <div className="mt-2 sm:mt-0 text-left sm:text-right">
              <p><strong className="text-slate-800">Academic Year:</strong> {application.academic_year}</p>
              <p><strong className="text-slate-800">Admission Status:</strong> Confirmed & Enrolled</p>
            </div>
          </div>

          {/* Addressee */}
          <div className="mb-6 font-sans">
            <p className="text-sm font-semibold text-slate-900">Dear {studentName},</p>
            <p className="text-xs text-slate-500">{personal.address || 'Applicant Address on File'}</p>
          </div>

          {/* Letter Body */}
          <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
            <p>
              On behalf of the Admissions Committee and Faculty of Metropolitan University, it is my distinct honor and profound privilege to inform you that you have been <strong>formally admitted</strong> for undergraduate studies in the <strong>{application.course_applied}</strong> program for the <strong>{application.academic_year}</strong> academic session.
            </p>
            <p>
              Our Admissions Committee rigorously reviewed thousands of applications, and your outstanding scholastic dedication, personal character, and exceptional performance on our Entrance Evaluation distinguished you amongst an extraordinary applicant pool.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans my-6 text-sm">
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 block">Admitted Program</span>
                  <span className="font-bold text-slate-800">{application.course_applied}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Enrollment Term</span>
                  <span className="font-bold text-slate-800">Fall Semester {application.academic_year}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Entrance Exam Result</span>
                  <span className="font-bold text-emerald-700">
                    {application.entrance_test?.score ? `${application.entrance_test.score} / ${application.entrance_test.max_score} (Passed)` : 'Requirement Waived'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Document Verification</span>
                  <span className="font-bold text-emerald-700">100% Certified Authentic</span>
                </div>
              </div>
            </div>
            <p>
              Please accept our heartfelt congratulations on this remarkable academic milestone. We look forward with great anticipation to welcoming you to our collegiate community this upcoming fall.
            </p>
          </div>

          {/* Signatures & University Seal */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans">
            <div>
              <div className="font-serif italic text-lg text-slate-900 font-semibold mb-1">
                Dr. Eleanor Vance, Ph.D.
              </div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dean of University Admissions</p>
              <p className="text-xs text-slate-500">Board of Regents, Metropolitan University</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Digitally Certified & Sealed</p>
                <p className="text-[10px] text-emerald-600">Ref: {application.application_number} • SHA256-AUTHENTIC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
