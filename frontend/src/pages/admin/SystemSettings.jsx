import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Settings,
  Calendar,
  CreditCard,
  FileText,
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  Megaphone,
  Power
} from 'lucide-react';

export default function SystemSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [policy, setPolicy] = useState({
    application_deadline: '',
    application_fee: 75,
    academic_year: '2026-2027',
    portal_status: 'OPEN',
    passing_score: 60,
    required_documents: ['High School Transcript', 'Government ID', 'Passport Photo'],
    announcement: ''
  });

  const [newDocName, setNewDocName] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemPolicy();
      setPolicy({
        ...res,
        application_deadline: res.application_deadline ? res.application_deadline.split('T')[0] : '',
        required_documents: res.required_documents || ['High School Transcript', 'Government ID', 'Passport Photo']
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSystemPolicy({
        ...policy,
        application_deadline: new Date(policy.application_deadline).toISOString()
      });
      toast.success('System policies and admission rules saved successfully!');
      await loadSettings();
    } catch (err) {
      toast.error(err.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRequiredDoc = () => {
    if (!newDocName.trim()) return;
    if (policy.required_documents.includes(newDocName.trim())) {
      toast.warning('Document type already in list.');
      return;
    }
    setPolicy({
      ...policy,
      required_documents: [...policy.required_documents, newDocName.trim()]
    });
    setNewDocName('');
  };

  const handleRemoveRequiredDoc = (docToRemove) => {
    setPolicy({
      ...policy,
      required_documents: policy.required_documents.filter((d) => d !== docToRemove)
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Global Admission Policies &amp; Rules
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforce submission deadlines, application fee schedules, and required documentation mandates.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Core Policy Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            Admissions Cycle Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Application Deadline Date *
              </label>
              <input
                type="date"
                required
                value={policy.application_deadline}
                onChange={(e) => setPolicy({ ...policy, application_deadline: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Submissions automatically locked after this date.
              </span>
            </div>

            {/* Fee Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Application Fee Amount (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={policy.application_fee}
                  onChange={(e) => setPolicy({ ...policy, application_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Required fee amount before final submission.
              </span>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Academic Year
              </label>
              <input
                type="text"
                required
                value={policy.academic_year}
                onChange={(e) => setPolicy({ ...policy, academic_year: e.target.value })}
                placeholder="2026-2027"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Portal Open / Closed */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Portal Admission State
              </label>
              <select
                value={policy.portal_status}
                onChange={(e) => setPolicy({ ...policy, portal_status: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500"
              >
                <option value="OPEN">OPEN (Accepting Submissions)</option>
                <option value="CLOSED">CLOSED (Submissions Paused)</option>
              </select>
            </div>

            {/* Passing Entrance Score */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Aptitude Passing Cutoff (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={policy.passing_score}
                onChange={(e) => setPolicy({ ...policy, passing_score: parseFloat(e.target.value) || 60 })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Mandatory Document Checklist Manager */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Mandatory Document Checklist Specification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every prospective applicant must upload each document defined below before they can submit.
            </p>
          </div>

          <div className="space-y-2">
            {policy.required_documents.map((docName, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">{docName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRequiredDoc(docName)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Remove required document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new doc input */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="e.g. Recommendation Letter, SAT Scorecard..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={handleAddRequiredDoc}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Mandatory File
            </button>
          </div>
        </div>

        {/* Global Announcement */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              Portal Broadcast Announcement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Displayed prominently on the public homepage and student dashboards.
            </p>
          </div>

          <textarea
            rows={3}
            value={policy.announcement}
            onChange={(e) => setPolicy({ ...policy, announcement: e.target.value })}
            placeholder="Important message for applicants regarding dates, guidelines, or system notices..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? 'Saving System Policies...' : 'Save & Enforce Global Policies'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
