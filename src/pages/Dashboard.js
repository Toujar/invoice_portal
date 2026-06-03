import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import PageHeader from '../components/PageHeader';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    dashboardAPI.get()
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your business"
        action={
          <Link to="/invoices/new" className="btn-primary">
            + New Invoice
          </Link>
        }
      />

      <Alert type="error" message={error} onClose={() => setError('')} />

      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(data.stats.total_revenue)}
              icon="💰"
              color="green"
              sub="From paid invoices"
            />
            <StatCard
              label="Pending Payments"
              value={formatCurrency(data.stats.pending_amount)}
              icon="⏳"
              color="yellow"
              sub="Awaiting payment"
            />
            <StatCard
              label="Overdue Invoices"
              value={data.stats.overdue_count}
              icon="🚨"
              color="red"
              sub="Require attention"
            />
            <StatCard
              label="Total Clients"
              value={data.stats.total_clients}
              icon="👥"
              color="blue"
              sub={`${data.stats.total_invoices} invoices total`}
            />
          </div>

          {/* Invoice status breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="card lg:col-span-1">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice Status</h2>
              <div className="space-y-3">
                {['draft','sent','paid','overdue','cancelled'].map((status) => {
                  const count = data.stats.status_counts?.[status] || 0;
                  const total = data.stats.total_invoices || 1;
                  const pct   = Math.round((count / total) * 100);
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <StatusBadge status={status} />
                        <span className="text-gray-600 font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly revenue */}
            <div className="card lg:col-span-2">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue (Last 6 Months)</h2>
              {data.monthly_revenue.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No revenue data yet.</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {data.monthly_revenue.map((row) => {
                    const maxVal = Math.max(...data.monthly_revenue.map((r) => parseFloat(r.revenue)));
                    const height = maxVal > 0 ? (parseFloat(row.revenue) / maxVal) * 100 : 0;
                    return (
                      <div key={row.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500">{formatCurrency(row.revenue)}</span>
                        <div
                          className="w-full bg-blue-500 rounded-t-md transition-all"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${row.month}: ${formatCurrency(row.revenue)}`}
                        />
                        <span className="text-xs text-gray-400">{row.month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent invoices */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Invoices</h2>
              <Link to="/invoices" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>

            {data.recent_invoices.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm mb-3">No invoices yet.</p>
                <Link to="/invoices/new" className="btn-primary text-sm">Create your first invoice</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-medium text-gray-500">Invoice #</th>
                      <th className="text-left py-2 pr-4 font-medium text-gray-500">Client</th>
                      <th className="text-left py-2 pr-4 font-medium text-gray-500">Due Date</th>
                      <th className="text-right py-2 pr-4 font-medium text-gray-500">Amount</th>
                      <th className="text-left py-2 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-gray-700">{inv.client_name}</td>
                        <td className="py-3 pr-4 text-gray-500">{formatDate(inv.due_date)}</td>
                        <td className="py-3 pr-4 text-right font-medium">{formatCurrency(inv.total)}</td>
                        <td className="py-3"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
