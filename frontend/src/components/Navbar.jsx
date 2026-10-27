import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  GraduationCap,
  Bell,
  LogOut,
  User,
  Shield,
  Briefcase,
  Sparkles,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function Navbar({ onNavigate }) {
  const navigate = useNavigate();
  const { user, role, logout, loginAsDemo } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // silent
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchDemo = async (demoAcc) => {
    setShowDemoMenu(false);
    try {
      await loginAsDemo(demoAcc);
      toast.success(`Switched role to: ${demoAcc.label} (${demoAcc.badge})`);
      if (demoAcc.role === 'STUDENT') navigate('/student/dashboard');
      else if (demoAcc.role === 'OFFICER') navigate('/officer/dashboard');
      else navigate('/admin/dashboard');
    } catch (err) {
      toast.error('Failed to switch demo account.');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Title */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Metropolitan
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md font-bold tracking-wider uppercase bg-brand-50 text-brand-700 border border-brand-200">
                  Admissions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Automated University Enrollment Portal</p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-50 to-indigo-50 border border-indigo-200/70 text-indigo-900 hover:shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Demo Switcher</span>
                <span className="md:hidden">Roles</span>
                <ChevronDown className="w-3 h-3 text-indigo-500" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Switch Persona</p>
                    <p className="text-[11px] text-slate-500">Test multi-role workflows instantly</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                    {DEMO_ACCOUNTS.map((acc, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSwitchDemo(acc)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-brand-600 transition">
                            {acc.label}
                          </p>
                          <p className="text-[10px] text-slate-400">{acc.email}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${acc.color}`}>
                          {acc.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) loadNotifications();
                    }}
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-brand-600" />
                          <span className="font-bold text-sm text-slate-800">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-700 font-bold rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No notifications at this time.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkAsRead(n.id)}
                              className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 ${
                                !n.is_read ? 'bg-brand-50/40' : ''
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {n.type === 'SUCCESS' ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : n.type === 'WARNING' || n.type === 'DANGER' ? (
                                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                                ) : (
                                  <Info className="w-4 h-4 text-blue-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800">{n.title}</p>
                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Badge */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <span className="text-[10px] font-semibold text-brand-600 uppercase">
                      {role}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    toast.info('Signed out successfully.');
                    navigate('/login');
                  }}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-brand-600 rounded-xl transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/20 transition"
                >
                  Apply Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
