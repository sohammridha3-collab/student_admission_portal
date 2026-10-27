import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Award
} from 'lucide-react';

export default function OfficerReports() {
  const toast = useToast();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadReport();
  }, [statusFilter]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.getOfficerReports('json');
      let filtered = res.report || [];
      if (statusFilter !== 'ALL') {
        filtered = filtered.filter((r) => r.status === statusFilter);
      }
      setReportData(filtered);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admission reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      const csvText = await api.getOfficerReports('csv');
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `admission_officer_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Admission report CSV downloaded!');
    } catch (err) {
      toast.error('Failed to download CSV.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Admission Decisions &amp; Enrollment Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Export official admission records, applicant credentials, and test rankings.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export to CSV / Excel
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'APPROVED', 'REJECTED', 'SUBMITTED', 'UNDER_REVIEW'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Records' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3.5 px-4">Application #</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Degree Applied</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Entrance Score</th>
                <th className="py-3.5 px-4">Fee Paid</th>
                <th className="py-3.5 px-4">Submission</th>
                <th className="py-3.5 px-4">Decision Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Generating report data...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No records found for current filter.
                  </td>
                </tr>
              ) : (
                reportData.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {r.applicationNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{r.studentName}</span>
                      <span className="text-[11px] text-slate-400">{r.studentEmail}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{r.courseApplied}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-purple-700">
                      {r.entranceScore !== 'N/A' ? `${r.entranceScore} / 100` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">{r.feePaid}</td>
                    <td className="py-3 px-4 text-slate-500">{r.submissionDate}</td>
                    <td className="py-3 px-4 text-slate-500">{r.decisionDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
