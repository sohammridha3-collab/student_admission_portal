import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  Download,
  CreditCard,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  PieChart
} from 'lucide-react';

export default function AdminReports() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminReports();
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSystemSummary = () => {
    if (!data) return;
    const summary = data.summary;
    const dist = data.statusDistribution;

    const csvContent = [
      'Metropolitan University Admission System Report',
      `Generated At,"${new Date().toISOString()}"`,
      '',
      'Metric,Value',
      `Total Revenue Collected,$${summary.totalRevenue?.toFixed(2) || '0.00'}`,
      `Total Registered Users,${summary.totalUsers}`,
      `Total Applicants,${summary.totalStudents}`,
      `Total Officers,${summary.totalOfficers}`,
      `Total Applications Filed,${summary.totalApplications}`,
      `Offer Conversion Rate,${summary.conversionRate}`,
      '',
      'Application Status Breakdown,Count',
      `Draft Applications,${dist.DRAFT || 0}`,
      `Submitted (Queued),${dist.SUBMITTED || 0}`,
      `Under Review (Verification),${dist.UNDER_REVIEW || 0}`,
      `Entrance Test Scheduled,${dist.TEST_SCHEDULED || 0}`,
      `Approved (Admitted),${dist.APPROVED || 0}`,
      `Rejected,${dist.REJECTED || 0}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `system_admission_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('System analytics exported to CSV!');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const dist = data?.statusDistribution || {};
  const totalApps = summary.totalApplications || 1;

  const statuses = [
    { key: 'APPROVED', label: 'Approved (Admission Offers Issued)', count: dist.APPROVED || 0, color: 'bg-emerald-500' },
    { key: 'TEST_SCHEDULED', label: 'Entrance Aptitude Stage', count: dist.TEST_SCHEDULED || 0, color: 'bg-purple-500' },
    { key: 'UNDER_REVIEW', label: 'Document Verification Stage', count: dist.UNDER_REVIEW || 0, color: 'bg-amber-500' },
    { key: 'SUBMITTED', label: 'Queued for Initial Review', count: dist.SUBMITTED || 0, color: 'bg-blue-500' },
    { key: 'DRAFT', label: 'In-Progress Drafts', count: dist.DRAFT || 0, color: 'bg-slate-400' },
    { key: 'REJECTED', label: 'Declined Applications', count: dist.REJECTED || 0, color: 'bg-rose-500' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Enrollment Analytics &amp; Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive oversight of applicant conversion, revenue intake, and admissions funnel health.
          </p>
        </div>

        <button
          onClick={handleExportSystemSummary}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Executive Report
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gross Fee Revenue</span>
          <p className="text-3xl font-black text-slate-900 font-mono">
            ${summary.totalRevenue?.toFixed(2) || '0.00'} USD
          </p>
          <p className="text-xs text-emerald-700 font-semibold">100% Authorized via Secure Gateway</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl w-fit">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Acceptance Rate</span>
          <p className="text-3xl font-black text-brand-600 font-mono">
            {summary.conversionRate || '0.0%'}
          </p>
          <p className="text-xs text-slate-500">Ratio of admitted applicants to total dockets</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Applications</span>
          <p className="text-3xl font-black text-slate-900 font-mono">
            {summary.totalApplications || 0}
          </p>
          <p className="text-xs text-slate-500">Across all degree streams</p>
        </div>
      </div>

      {/* Pipeline Funnel Distribution */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-brand-600" />
          Admissions Pipeline Stage Distribution
        </h2>

        <div className="space-y-4">
          {statuses.map((item) => {
            const pct = ((item.count / totalApps) * 100).toFixed(1);

            return (
              <div key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="font-mono text-slate-600 font-semibold">
                    {item.count} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${item.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
