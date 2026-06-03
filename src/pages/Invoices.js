import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { invoicesAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'];

export default function Invoices() {
  const [invoices, setInvoices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [search, setSearch]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const fetchInvoices = useCallback(() => {
    setLoading(true);
    const params = statusFilter !== 'all' ? { status: statusFilter } : {};
    invoicesAPI.getAll(params)
      .then((res) => setInvoices(res.invoices))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await invoicesAPI.delete(deleteTarget.id);
      setSuccess('Invoice deleted.');
      setDeleteTarget(null);
      fetchInvoices();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = invoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
        action={
          <Link to="/invoices/new" className="btn-primary">+ New Invoice</Link>
        }
      />

      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          className="input max-w-xs"
          placeholder="Search invoices…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-gray-500 mb-4">
            {search || statusFilter !== 'all'
              ? 'No invoices match your filters.'
              : 'No invoices yet. Create your first one!'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link to="/invoices/new" className="btn-primary">Create Invoice</Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Invoice #</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Issue Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Due Date</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Paid</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{inv.client_name}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(inv.issue_date)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(inv.due_date)}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="px-6 py-4 text-right text-green-700">{formatCurrency(inv.amount_paid)}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/invoices/${inv.id}`} className="btn-secondary text-xs px-3 py-1.5">
                          View
                        </Link>
                        <Link to={`/invoices/${inv.id}/edit`} className="btn-secondary text-xs px-3 py-1.5">
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(inv)}
                          className="btn-danger text-xs px-3 py-1.5"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Invoice"
        message={`Delete invoice "${deleteTarget?.invoice_number}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
