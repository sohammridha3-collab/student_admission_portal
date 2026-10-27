import React, { useState } from 'react';
import { X, CheckCircle, XCircle, FileText, Download, ExternalLink } from 'lucide-react';

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  isOfficer = false,
  onVerify,
  onReject,
  canVerify = true
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !document) return null;

  const fileUrl = document.file_url?.startsWith('http')
    ? document.file_url
    : `http://localhost:5000${document.file_url}`;

  const isPdf = document.mime_type === 'application/pdf' || document.file_url?.endsWith('.pdf');
  const isImage = document.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(document.file_url);

  const handleVerify = async () => {
    setSubmitting(true);
    try {
      await onVerify(document.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setSubmitting(true);
    try {
      await onReject(document.id, rejectionReason.trim());
      setShowRejectInput(false);
      setRejectionReason('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">
                {document.document_type}
              </h3>
              <p className="text-xs text-slate-500">
                {document.original_filename} • {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'Uploaded Document'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Tab
            </a>
            <a
              href={fileUrl}
              download={document.original_filename}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[420px]">
          {isPdf ? (
            <iframe
              src={`${fileUrl}#toolbar=0`}
              title={document.document_type}
              className="w-full h-full min-h-[500px] rounded-lg border border-slate-200 bg-white shadow-inner"
            />
          ) : isImage ? (
            <img
              src={fileUrl}
              alt={document.document_type}
              className="max-h-[550px] max-w-full rounded-lg shadow-md object-contain border border-slate-200 bg-white"
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 max-w-md">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Preview not directly available in frame</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Please download or open in a new tab to review this file.</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition"
              >
                Open File
              </a>
            </div>
          )}
        </div>

        {/* Footer / Officer Verification Actions */}
        {isOfficer && canVerify && (
          <div className="p-4 bg-white border-t border-slate-100">
            {showRejectInput ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter specific reason for document rejection (e.g. illegible text, expired ID)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/30"
                />
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || submitting}
                  className="px-4 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition disabled:opacity-50 shrink-0"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Current Status: <span className="font-semibold text-slate-700">{document.verification_status}</span>
                  {document.rejection_reason && (
                    <span className="text-rose-600 block sm:inline sm:ml-2">
                      (Reason: {document.rejection_reason})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={submitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Document
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={submitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify Document Authenticity
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
