import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileEdit,
  Activity,
  Receipt,
  Users,
  ShieldCheck,
  Settings,
  FileSpreadsheet,
  History,
  CheckCircle2,
  Clock,
  Award
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  if (!role) return null;

  let navItems = [];

  if (role === 'STUDENT') {
    navItems = [
      { path: '/student/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      { path: '/student/workflow', label: 'Application Workflow', icon: FileEdit, badge: '4 Steps' },
      { path: '/student/status', label: 'Track Status', icon: Activity },
      { path: '/student/receipt', label: 'Payment Receipt', icon: Receipt },
    ];
  } else if (role === 'OFFICER') {
    navItems = [
      { path: '/officer/dashboard', label: 'Officer Dashboard', icon: LayoutDashboard },
      { path: '/officer/queue', label: 'Application Queue', icon: Clock },
      { path: '/officer/reports', label: 'Admission Reports', icon: FileSpreadsheet },
    ];
  } else if (role === 'ADMIN') {
    navItems = [
      { path: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
      { path: '/admin/users', label: 'User Management', icon: Users, badge: 'CRUD' },
      { path: '/admin/roles', label: 'Role & Permissions', icon: ShieldCheck, badge: 'RBAC' },
      { path: '/admin/settings', label: 'System Policies', icon: Settings },
      { path: '/admin/audit', label: 'Audit Trail Logs', icon: History },
      { path: '/admin/reports', label: 'System Analytics', icon: FileSpreadsheet },
    ];
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role Banner */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Scope</p>
        <p className="text-xs font-extrabold text-slate-800 capitalize mt-0.5">
          {role === 'STUDENT' ? 'Applicant Portal' : role === 'OFFICER' ? 'Admission Office' : 'System Administration'}
        </p>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Policy Mini Badge */}
      <div className="p-4 border-t border-slate-100 m-3 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-1.5">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">Metropolitan Univ.</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Academic Year 2026-2027 Admission Cycle Active.
        </p>
      </div>
    </aside>
  );
}
