import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Receipt, CheckCircle2, Printer, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PaymentReceipt({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.getStudentApplication();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const app = data?.application;
  const payment = app?.payment;

  if (!payment || payment.status !== 'COMPLETED') {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <Receipt className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">No Payment Recorded</h2>
        <p className="text-xs text-slate-500">
          Application fee payment has not been processed for application #{app?.application_number}.
        </p>
        <button
          onClick={() => onNavigate('student-workflow')}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition"
        >
          Go to Fee Payment Step
        </button>
      </div>
    );
  }

  const personal = app.personal_info ? JSON.parse(app.personal_info) : {};

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => onNavigate('student-dashboard')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>

      {/* Printable Receipt Paper */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-lg space-y-8">
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Metropolitan University</h1>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mt-0.5">
              Office of The Bursar • Application Fee Receipt
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Payment Confirmed
            </span>
            <p className="text-xs font-mono text-slate-500 mt-1">Txn: {payment.transaction_id}</p>
          </div>
        </div>

        {/* Billed To Details */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Student Candidate</span>
            <p className="font-bold text-slate-800 text-sm">{personal.fullName || 'Registered Applicant'}</p>
            <p className="text-slate-500">{personal.phone || 'Phone on record'}</p>
            <p className="text-slate-500">{personal.address || 'Address on record'}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Payment Details</span>
            <p className="text-slate-700"><strong>Application Ref:</strong> {app.application_number}</p>
            <p className="text-slate-700"><strong>Program:</strong> {app.course_applied}</p>
            <p className="text-slate-700"><strong>Payment Method:</strong> {payment.payment_method}</p>
            <p className="text-slate-700"><strong>Date Paid:</strong> {new Date(payment.paid_at || payment.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-center">Academic Year</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-800">
                  Undergraduate Application &amp; Entrance Assessment Fee
                </td>
                <td className="py-3.5 px-4 text-center text-slate-500">{app.academic_year}</td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                  ${payment.amount.toFixed(2)} USD
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-right text-slate-600">Total Paid</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm">
                  ${payment.amount.toFixed(2)} USD
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Verification Note */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Authorized Electronic Payment Receipt • Non-Transferable</span>
          </div>
          <span className="font-mono text-[10px]">AUTH_OK</span>
        </div>
      </div>
    </div>
  );
}
