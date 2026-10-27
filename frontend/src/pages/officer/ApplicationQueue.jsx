import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  Search,
  Filter,
  ArrowRight,
  FileCheck2,
  Calendar,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ApplicationQueue({ onNavigate, onSelectApplication }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');

  // Sorting & Pagination
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadQueue();
  }, [statusFilter, courseFilter]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (courseFilter !== 'ALL') params.course = courseFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.getOfficerQueue(params);
      setApplications(res.applications || []);
      setStats(res.stats || {});
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadQueue();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorted and Paginated Data
  const sortedApplications = useMemo(() => {
    const list = [...applications];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'studentName') {
        aVal = a.student?.name || '';
        bVal = b.student?.name || '';
      } else if (sortField === 'score') {
        aVal = a.entrance_test?.score ?? -1;
        bVal = b.entrance_test?.score ?? -1;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [applications, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedApplications.length / itemsPerPage) || 1;
  const paginatedApplications = sortedApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs = [
    { key: 'ALL', label: 'All Applications', count: stats.total || 0 },
    { key: 'SUBMITTED', label: 'Submitted', count: stats.submitted || 0 },
    { key: 'UNDER_REVIEW', label: 'Under Review', count: stats.underReview || 0 },
    { key: 'TEST_SCHEDULED', label: 'Test Scheduled', count: stats.testScheduled || 0 },
    { key: 'APPROVED', label: 'Approved', count: stats.approved || 0 },
    { key: 'REJECTED', label: 'Rejected', count: stats.rejected || 0 }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Application Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process, inspect, and evaluate submitted undergraduate admission applications.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/officer/reports')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export Admission Reports
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Course Filter Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, application number, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 w-full sm:w-auto"
          >
            <option value="ALL">All Degree Programs</option>
            <option value="Bachelor of Computer Science">B.S. Computer Science</option>
            <option value="Bachelor of Software Engineering">B.S. Software Engineering</option>
            <option value="Bachelor of Data Science & AI">B.S. Data Science &amp; AI</option>
            <option value="Bachelor of Electrical Engineering">B.S. Electrical Engineering</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase select-none">
              <tr>
                <th
                  onClick={() => handleSort('application_number')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Application #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('studentName')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Degree Applied</th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Document Verification</th>
                <th
                  onClick={() => handleSort('score')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Entrance Test</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('submission_date')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Submitted</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading applications...
                  </td>
                </tr>
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileCheck2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No applications matching current filters.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try resetting search keywords or changing the status filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((a) => {
                  const totalDocs = a.documents?.length || 0;
                  const verifiedDocs = a.documents?.filter((d) => d.verification_status === 'VERIFIED').length || 0;
                  const allDocsOk = totalDocs > 0 && verifiedDocs === totalDocs;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {a.application_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{a.student?.name}</span>
                        <span className="text-[11px] text-slate-400">{a.student?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {a.course_applied}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${allDocsOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {allDocsOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-amber-500" />}
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
                      <td className="py-3.5 px-4 text-slate-500">
                        {a.submission_date ? new Date(a.submission_date).toLocaleDateString() : 'Draft'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onSelectApplication) onSelectApplication(a.id);
                            if (onNavigate) onNavigate(`/officer/review/${a.id}`);
                            navigate(`/officer/review/${a.id}`);
                          }}
                          className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                        >
                          Review
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

        {/* Pagination Bar */}
        {!loading && sortedApplications.length > 0 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * itemsPerPage, sortedApplications.length)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{sortedApplications.length}</span> applications
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    currentPage === page
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
