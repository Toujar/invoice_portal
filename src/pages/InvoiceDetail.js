import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoicesAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash',          label: 'Cash' },
  { value: 'credit_card',   label: 'Credit Card' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'other',         label: 'Other' },
];

export default function InvoiceDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoice, setInvoice]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Payment form
  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: '', payment_date: new Date().toISOString().slice(0, 10),
    method: 'bank_transfer', reference: '', notes: '',
  });
  const [payError, setPayError]   = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Delete invoice
  const [showDeleteInv, setShowDeleteInv] = useState(false);
  const [deletingInv, setDeletingInv]     = useState(false);

  // Delete payment
  const [deletePayTarget, setDeletePayTarget] = useState(null);
  const [deletingPay, setDeletingPay]         = useState(false);

  const fetchInvoice = useCallback(() => {
    setLoading(true);
    invoicesAPI.getOne(id)
      .then((res) => setInvoice(res.invoice))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  // ── Record payment ────────────────────────────────────────
  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setPayError('');
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) { setPayError('Enter a valid amount.'); return; }

    const remaining = parseFloat(invoice.total) - parseFloat(invoice.amount_paid);
    if (amount > remaining + 0.001) {
      setPayError(`Amount exceeds remaining balance of ${formatCurrency(remaining)}.`);
      return;
    }

    setPayLoading(true);
    try {
      await paymentsAPI.create({ ...payForm, invoice_id: invoice.id, amount });
      setSuccess('Payment recorded.');
      setShowPayment(false);
      setPayForm({ amount: '', payment_date: new Date().toISOString().slice(0, 10), method: 'bank_transfer', reference: '', notes: '' });
      fetchInvoice();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  // ── Delete invoice ────────────────────────────────────────
  const handleDeleteInvoice = async () => {
    setDeletingInv(true);
    try {
      await invoicesAPI.delete(id);
      navigate('/invoices');
    } catch (err) {
      setError(err.message);
      setShowDeleteInv(false);
    } finally {
      setDeletingInv(false);
    }
  };

  // ── Delete payment ────────────────────────────────────────
  const handleDeletePayment = async () => {
    if (!deletePayTarget) return;
    setDeletingPay(true);
    try {
      await paymentsAPI.delete(deletePayTarget.id);
      setSuccess('Payment removed.');
      setDeletePayTarget(null);
      fetchInvoice();
    } catch (err) {
      setError(err.message);
      setDeletePayTarget(null);
    } finally {
      setDeletingPay(false);
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;
  if (error && !invoice) return <Alert type="error" message={error} />;

  const remaining = parseFloat(invoice.total) - parseFloat(invoice.amount_paid);
  const paidPct   = invoice.total > 0 ? Math.min(100, (invoice.amount_paid / invoice.total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={invoice.invoice_number}
        subtitle={`Issued ${formatDate(invoice.issue_date)} · Due ${formatDate(invoice.due_date)}`}
        action={
          <div className="flex gap-2 flex-wrap">
            <Link to={`/invoices/${id}/edit`} className="btn-secondary">Edit</Link>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button onClick={() => setShowPayment(true)} className="btn-success">
                Record Payment
              </button>
            )}
            <button onClick={() => setShowDeleteInv(true)} className="btn-danger">Delete</button>
          </div>
        }
      />

      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – invoice body */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client info */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Bill To</h2>
                <p className="text-lg font-bold text-gray-900 mt-1">{invoice.client_name}</p>
                {invoice.client_company && <p className="text-gray-500 text-sm">{invoice.client_company}</p>}
                {invoice.client_email   && <p className="text-gray-500 text-sm">{invoice.client_email}</p>}
                {invoice.client_phone   && <p className="text-gray-500 text-sm">{invoice.client_phone}</p>}
                {invoice.client_address && <p className="text-gray-500 text-sm mt-1 whitespace-pre-line">{invoice.client_address}</p>}
              </div>
              <StatusBadge status={invoice.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-sm">
              <div>
                <p className="text-gray-400">Invoice #</p>
                <p className="font-medium">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-gray-400">Issue Date</p>
                <p className="font-medium">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-gray-400">Due Date</p>
                <p className="font-medium">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Line Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Description</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Qty</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Unit Price</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-gray-700">{item.description}</td>
                      <td className="px-6 py-3 text-right text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="px-6 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-500">Subtotal</td>
                    <td className="px-6 py-2 text-right font-medium">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-500">
                      Tax ({invoice.tax_rate}%)
                    </td>
                    <td className="px-6 py-2 text-right font-medium">{formatCurrency(invoice.tax_amount)}</td>
                  </tr>
                  <tr className="font-bold text-base">
                    <td colSpan={3} className="px-6 py-3 text-right">Total</td>
                    <td className="px-6 py-3 text-right text-blue-700">{formatCurrency(invoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Payments */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Payment History</h2>
            {invoice.payments?.length === 0 ? (
              <p className="text-sm text-gray-400">No payments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {invoice.payments?.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(pay.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(pay.payment_date)} · {PAYMENT_METHODS.find(m => m.value === pay.method)?.label || pay.method}
                        {pay.reference && ` · Ref: ${pay.reference}`}
                      </p>
                      {pay.notes && <p className="text-xs text-gray-400 mt-0.5">{pay.notes}</p>}
                    </div>
                    <button
                      onClick={() => setDeletePayTarget(pay)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right – payment summary */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Total</span>
                <span className="font-medium">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-medium text-green-700">{formatCurrency(invoice.amount_paid)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
                <span>Balance Due</span>
                <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Paid</span>
                <span>{Math.round(paidPct)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>

            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={() => setShowPayment(true)}
                className="btn-success w-full mt-4"
              >
                Record Payment
              </button>
            )}
          </div>

          {/* From (business info) */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">From</h2>
            <p className="font-medium text-gray-900">{user?.name}</p>
            {user?.business_name && <p className="text-sm text-gray-500">{user.business_name}</p>}
            {user?.email         && <p className="text-sm text-gray-500">{user.email}</p>}
            {user?.phone         && <p className="text-sm text-gray-500">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPayment(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h2>
            <p className="text-sm text-gray-500 mb-4">
              Remaining balance: <strong>{formatCurrency(remaining)}</strong>
            </p>

            <Alert type="error" message={payError} onClose={() => setPayError('')} />

            <form onSubmit={handlePaySubmit} noValidate className="space-y-4">
              <div>
                <label className="label">Amount *</label>
                <input type="number" min="0.01" step="0.01" className="input"
                  placeholder="0.00" value={payForm.amount}
                  onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Payment Date *</label>
                <input type="date" className="input" value={payForm.payment_date}
                  onChange={(e) => setPayForm((p) => ({ ...p, payment_date: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Method</label>
                <select className="input" value={payForm.method}
                  onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Reference / Transaction ID</label>
                <input type="text" className="input" placeholder="Optional"
                  value={payForm.reference}
                  onChange={(e) => setPayForm((p) => ({ ...p, reference: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea rows={2} className="input resize-none" placeholder="Optional"
                  value={payForm.notes}
                  onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayment(false)} className="btn-secondary flex-1" disabled={payLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-success flex-1" disabled={payLoading}>
                  {payLoading ? 'Saving…' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete invoice confirm */}
      <ConfirmModal
        isOpen={showDeleteInv}
        title="Delete Invoice"
        message={`Delete invoice "${invoice.invoice_number}"? This cannot be undone.`}
        onConfirm={handleDeleteInvoice}
        onCancel={() => setShowDeleteInv(false)}
        loading={deletingInv}
      />

      {/* Delete payment confirm */}
      <ConfirmModal
        isOpen={!!deletePayTarget}
        title="Remove Payment"
        message={`Remove payment of ${formatCurrency(deletePayTarget?.amount)}? The invoice balance will be updated.`}
        onConfirm={handleDeletePayment}
        onCancel={() => setDeletePayTarget(null)}
        loading={deletingPay}
      />
    </div>
  );
}
