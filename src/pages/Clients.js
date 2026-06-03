import React, { useEffect, useState, useCallback } from 'react';
import { clientsAPI } from '../services/api';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', address: '' };

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

export default function Clients() {
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');

  const fetchClients = useCallback(() => {
    setLoading(true);
    clientsAPI.getAll()
      .then((res) => setClients(res.clients))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openCreate = () => {
    setEditClient(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (client) => {
    setEditClient(client);
    setForm({
      name:    client.name,
      email:   client.email || '',
      phone:   client.phone || '',
      company: client.company || '',
      address: client.address || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Client name is required.'); return; }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      setFormError('Enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      if (editClient) {
        await clientsAPI.update(editClient.id, form);
        setSuccess('Client updated successfully.');
      } else {
        await clientsAPI.create(form);
        setSuccess('Client created successfully.');
      }
      setShowForm(false);
      fetchClients();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await clientsAPI.delete(deleteTarget.id);
      setSuccess('Client deleted.');
      setDeleteTarget(null);
      fetchClients();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={openCreate} className="btn-primary">+ Add Client</button>
        }
      />

      <Alert type="error"   message={error}   onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          className="input max-w-xs"
          placeholder="Search clients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500 mb-4">
            {search ? 'No clients match your search.' : 'No clients yet. Add your first client!'}
          </p>
          {!search && (
            <button onClick={openCreate} className="btn-primary">Add Client</button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Company</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Invoices</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Total Paid</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                    <td className="px-6 py-4 text-gray-500">{client.company || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{client.email || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{client.phone || '—'}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{client.invoice_count}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-700">
                      {formatCurrency(client.total_paid)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(client)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(client)}
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

      {/* Client Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editClient ? 'Edit Client' : 'Add New Client'}
            </h2>

            <Alert type="error" message={formError} onClose={() => setFormError('')} />

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input name="name" type="text" required className="input"
                  placeholder="John Doe" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Company</label>
                <input name="company" type="text" className="input"
                  placeholder="Acme Corp" value={form.company} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input"
                  placeholder="john@example.com" value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" type="tel" className="input"
                  placeholder="+1 555 000 0000" value={form.phone} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea name="address" rows={2} className="input resize-none"
                  placeholder="123 Main St, City" value={form.address} onChange={handleChange} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving…' : editClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all their invoices.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
