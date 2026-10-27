import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  FileCheck2,
  Award,
  FileSpreadsheet,
  Settings,
  Users
} from 'lucide-react';

export default function RoleManagement() {
  const toast = useToast();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadOfficers();
  }, []);

  const loadOfficers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers({ role: 'OFFICER' });
      setOfficers(res.users || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admission officers.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (officer, permKey) => {
    const currentPerms = officer.permissions || {};
    const updatedPerms = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey]
    };

    setSavingId(officer.id);
    try {
      await api.updatePermissions(officer.id, { permissions: updatedPerms });
      toast.success(`Updated ${permKey} for ${officer.name}!`);
      await loadOfficers();
    } catch (err) {
      toast.error(err.message || 'Failed to update permissions.');
    } finally {
      setSavingId(null);
    }
  };

  const permissionsList = [
    {
      key: 'canVerifyDocs',
      label: 'Document Verification',
      desc: 'Can inspect and mark student documents as VERIFIED or REJECTED.',
      icon: FileCheck2
    },
    {
      key: 'canGradeTest',
      label: 'Score Entrance Tests',
      desc: 'Can input exam scores, aptitude evaluations, and interview observations.',
      icon: Award
    },
    {
      key: 'canMakeDecision',
      label: 'Decision Authority',
      desc: 'Can render final APPROVE or REJECT admission offers (Triggering Acceptance Letters).',
      icon: ShieldCheck
    },
    {
      key: 'canExportReports',
      label: 'Export Reports',
      desc: 'Can generate and download CSV reports of candidates.',
      icon: FileSpreadsheet
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Role-Based Access Control (RBAC)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign and enforce granular operational capabilities for Admission Officers.
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading officer accounts...
          </div>
        ) : officers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            No officer accounts found. Create one in User Management.
          </div>
        ) : (
          officers.map((officer) => (
            <div
              key={officer.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-extrabold text-sm flex items-center justify-center">
                    {officer.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{officer.name}</h3>
                    <p className="text-xs text-slate-400">{officer.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase self-start sm:self-auto">
                  Admission Reviewer
                </span>
              </div>

              {/* Grid of Permission Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {permissionsList.map((perm) => {
                  const Icon = perm.icon;
                  const isEnabled = Boolean(officer.permissions?.[perm.key]);
                  const isSaving = savingId === officer.id;

                  return (
                    <div
                      key={perm.key}
                      onClick={() => !isSaving && handleTogglePermission(officer, perm.key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isEnabled
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-4 h-4 ${isEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isEnabled ? 'GRANTED' : 'REVOKED'}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900">{perm.label}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{perm.desc}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
                        <span className={isEnabled ? 'text-emerald-700' : 'text-slate-400'}>
                          {isEnabled ? 'Active Capability' : 'Restricted'}
                        </span>
                        <span className="text-brand-600 hover:underline">Toggle</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
