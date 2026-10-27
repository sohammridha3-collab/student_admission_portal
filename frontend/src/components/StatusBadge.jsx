import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const config = {
    APPROVED: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-sm shadow-emerald-500/10',
      dot: 'bg-emerald-500',
      ring: 'pulse-emerald'
    },
    VERIFIED: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-sm shadow-emerald-500/10',
      dot: 'bg-emerald-500',
      ring: 'pulse-emerald'
    },
    COMPLETED: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-sm shadow-emerald-500/10',
      dot: 'bg-emerald-500',
      ring: 'pulse-emerald'
    },
    ACTIVE: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      dot: 'bg-emerald-500',
      ring: 'pulse-emerald'
    },
    OPEN: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      dot: 'bg-emerald-500',
      ring: 'pulse-emerald'
    },
    UNDER_REVIEW: {
      badge: 'bg-amber-50 text-amber-900 border-amber-200/80 shadow-sm shadow-amber-500/10',
      dot: 'bg-amber-500',
      ring: 'pulse-amber'
    },
    PENDING: {
      badge: 'bg-amber-50 text-amber-900 border-amber-200/80 shadow-sm shadow-amber-500/10',
      dot: 'bg-amber-500',
      ring: 'pulse-amber'
    },
    SUBMITTED: {
      badge: 'bg-blue-50 text-blue-700 border-blue-200/80 shadow-sm shadow-blue-500/10',
      dot: 'bg-blue-500',
      ring: ''
    },
    TEST_SCHEDULED: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200/80 shadow-sm shadow-purple-500/10',
      dot: 'bg-purple-500',
      ring: ''
    },
    WAIVED: {
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      dot: 'bg-indigo-500',
      ring: ''
    },
    REJECTED: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-sm shadow-rose-500/10',
      dot: 'bg-rose-500',
      ring: ''
    },
    CLOSED: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
      ring: ''
    },
    DRAFT: {
      badge: 'bg-slate-100/90 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      ring: ''
    },
    INACTIVE: {
      badge: 'bg-slate-100 text-slate-500 border-slate-200',
      dot: 'bg-slate-400',
      ring: ''
    }
  };

  const item = config[normalized] || {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    ring: ''
  };

  const label = normalized.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-tight border ${item.badge} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot} ${item.ring}`} />
      <span>{label}</span>
    </span>
  );
}
