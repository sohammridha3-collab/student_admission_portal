import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Shield,
  Users,
  CreditCard,
  FileCheck2,
  Settings,
  History,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard({ onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const goTo = (view, path) => {
    if (onNavigate) onNavigate(view);
    navigate(path);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repData, polData, logData] = await Promise.all([
        api.getAdminReports(),
        api.getSystemPolicy(),
        api.getAuditLogs({ limit: 6 })
      ]);
      setReports(repData);
      setPolicy(polData);
      setRecentLogs(logData.logs || []);
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

  const summary = reports?.summary || {};
  const statusDist = reports?.statusDistribution || {};

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-300 text-xs font-semibold mb-3">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>System Administrator Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Metropolitan Portal Governance
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Configure admissions deadlines, manage user access and RBAC permissions, track financial collections, and review audit trail logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('admin-users')}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Manage Users
            </button>
            <button
              onClick={() => onNavigate('admin-settings')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              System Policies
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Collected</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3 font-mono">
            ${summary.totalRevenue?.toFixed(2) || '0.00'}
          </p>
          <span className="text-[11px] text-emerald-700 font-bold mt-1">Application Fees Authorized</span>
        </div>

        {/* Total Users */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Users</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{summary.totalUsers || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1">
            {summary.totalStudents || 0} Students • {summary.totalOfficers || 0} Officers
          </span>
        </div>

        {/* Total Applications */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Applications</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{summary.totalApplications || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1">
            {statusDist.APPROVED || 0} Accepted ({summary.conversionRate || '0%'})
          </span>
        </div>

        {/* Portal Status */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admissions Deadline</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-black text-slate-900 mt-3 truncate">
            {policy?.application_deadline ? new Date(policy.application_deadline).toLocaleDateString() : 'Active'}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Portal State:</span>
            <StatusBadge status={policy?.portal_status || 'OPEN'} />
          </div>
        </div>
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => goTo('admin-users', '/admin/users')}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl w-fit mb-3 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">User Management (CRUD)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create student &amp; officer accounts, edit credentials, deactivate access, and reset passwords directly.
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-brand-600 flex items-center gap-1">
            Manage Accounts <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => goTo('admin-roles', '/admin/roles')}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-3 group-hover:scale-105 transition">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Role-Based Access Control (RBAC)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Assign and toggle granular officer permissions: doc verification, test scoring, and decision authority.
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1">
            Configure Permissions <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => goTo('admin-settings', '/admin/settings')}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-3 group-hover:scale-105 transition">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">System Policies &amp; Fee Setup</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Configure cutoff dates, application fee amount, required document checklist, and pass marks.
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-purple-600 flex items-center gap-1">
            Update Settings <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Recent System Audit Activity Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Recent Audit Trail Activity</h2>
          </div>
          <button
            onClick={() => goTo('admin-audit', '/admin/audit')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View Full Audit Trail
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{l.user_name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">{l.user_role}</td>
                  <td className="py-3 px-4 font-mono font-bold text-brand-700">{l.action}</td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
