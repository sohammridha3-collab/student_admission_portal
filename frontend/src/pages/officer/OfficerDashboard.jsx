import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Award,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function OfficerDashboard({ onNavigate, onSelectApplication }) {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [data, setData] = useState({ applications: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(null);

  const goTo = (path, appId) => {
    if (onSelectApplication && appId) onSelectApplication(appId);
    if (onNavigate) onNavigate(path);
    navigate(path);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [queueRes, policyRes] = await Promise.all([
        api.getOfficerQueue(),
        api.getSystemPolicy()
      ]);
      setData(queueRes);
      setPolicy(policyRes);
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

  const stats = data.stats || {};
  const recentApps = (data.applications || []).slice(0, 5);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Officer Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Office of Undergraduate Admissions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Officer Review Dashboard
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Logged in as <strong className="text-white">{user?.name}</strong>. Inspect student documents, score entrance tests, and issue admission decisions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('officer-queue')}
              className="px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 transition flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Open Application Queue
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Queue */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Queue</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.total || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1">All applications</span>
        </div>

        {/* Submitted */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Awaiting Verification</span>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats.submitted || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1">Status: SUBMITTED</span>
        </div>

        {/* Under Review */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">In Evaluation</span>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats.underReview || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1">Docs under review</span>
        </div>

        {/* Approved */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Accepted</span>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stats.approved || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1">Offers granted</span>
        </div>

        {/* Rejected */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Rejected</span>
          <p className="text-2xl font-black text-rose-700 mt-2">{stats.rejected || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1">Declined</span>
        </div>
      </div>

      {/* Admin Policy Compliance Banner */}
      {policy && (
        <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200">System Policy Enforced by Administrator:</span>
              <span className="text-slate-400 ml-1">
                Deadline: <strong>{new Date(policy.application_deadline).toLocaleDateString()}</strong> • Fee: <strong>${policy.application_fee} USD</strong> • Portal: <strong>{policy.portal_status}</strong>
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
            RBAC-COLLABORATION-OK
          </span>
        </div>
      )}

      {/* Recent Applications Queue Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Applications in Queue</h2>
            <p className="text-xs text-slate-500">Pick an applicant to verify documents, enter test scores, and render decision.</p>
          </div>
          <button
            onClick={() => goTo('/officer/queue')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All ({stats.total || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">App ID</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Course Applied</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Docs Verified</th>
                <th className="py-3 px-4">Test Result</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No applications currently queued.
                  </td>
                </tr>
              ) : (
                recentApps.map((a) => {
                  const totalDocs = a.documents?.length || 0;
                  const verifiedDocs = a.documents?.filter((d) => d.verification_status === 'VERIFIED').length || 0;
                  const allDocsOk = totalDocs > 0 && verifiedDocs === totalDocs;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {a.application_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{a.student?.name}</span>
                        <span className="text-[11px] text-slate-400">{a.student?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{a.course_applied}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${allDocsOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {verifiedDocs}/{totalDocs} Verified
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {a.entrance_test ? (
                          a.entrance_test.status === 'COMPLETED' ? (
                            <span className="font-bold text-purple-700 font-mono">
                              {a.entrance_test.score} / {a.entrance_test.max_score}
                            </span>
                          ) : (
                            <StatusBadge status={a.entrance_test.status} />
                          )
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => goTo(`/officer/review/${a.id}`, a.id)}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl transition inline-flex items-center gap-1"
                        >
                          Review Dossier
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
