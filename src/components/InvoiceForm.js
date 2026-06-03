import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI, invoicesAPI } from '../services/api';
import Alert from './Alert';
import Spinner from './Spinner';

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: '' };

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export default function InvoiceForm({ existingInvoice }) {
  const navigate = useNavigate();
  const isEdit   = !!existingInvoice;

  const [clients, setClients]   = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const [form, setForm] = useState({
    client_id:  existingInvoice?.client_id  || '',
    issue_date: existingInvoice?.issue_date || new Date().toISOString().slice(0, 10),
    due_date:   existingInvoice?.due_date   || '',
    tax_rate:   existingInvoice?.tax_rate   || 0,
    status:     existingInvoice?.status     || 'draft',
    notes:      existingInvoice?.notes      || '',
  });

  const [items, setItems] = useState(
    existingInvoice?.items?.length
      ? existingInvoice.items.map((i) => ({
          description: i.description,
          quantity:    i.quantity,
          unit_price:  i.unit_price,
        }))
      : [{ ...EMPTY_ITEM }]
  );

  useEffect(() => {
    clientsAPI.getAll()
      .then((res) => setClients(res.clients))
      .catch(() => setError('Failed to load clients.'))
      .finally(() => setLoadingClients(false));
  }, []);

  // ── Calculations ─────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => {
    const qty   = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + qty * price;
  }, 0);
  const taxAmount = subtotal * ((parseFloat(form.tax_rate) || 0) / 100);
  const total     = subtotal + taxAmount;

  // ── Item handlers ─────────────────────────────────────────
  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  const addItem    = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!form.client_id)  { setError('Please select a client.'); return; }
    if (!form.issue_date) { setError('Issue date is required.'); return; }
    if (!form.due_date)   { setError('Due date is required.'); return; }
    if (form.due_date < form.issue_date) { setError('Due date must be after issue date.'); return; }

    const validItems = items.filter(
      (i) => i.description.trim() && parseFloat(i.quantity) > 0 && parseFloat(i.unit_price) >= 0
    );
    if (validItems.length === 0) { setError('Add at least one valid line item.'); return; }

    setSaving(true);
    try {
      const payload = { ...form, items: validItems };
      if (isEdit) {
        await invoicesAPI.update(existingInvoice.id, payload);
        navigate(`/invoices/${existingInvoice.id}`);
      } else {
        const res = await invoicesAPI.create(payload);
        navigate(`/invoices/${res.invoice.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingClients) return <Spinner size="lg" className="mt-16" />;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column – main fields */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client & dates */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Invoice Details</h2>

            <div>
              <label className="label">Client *</label>
              {clients.length === 0 ? (
                <p className="text-sm text-red-600">
                  No clients found.{' '}
                  <a href="/clients" className="underline">Add a client first.</a>
                </p>
              ) : (
                <select
                  className="input"
                  value={form.client_id}
                  onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
                  required
                >
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` – ${c.company}` : ''}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Issue Date *</label>
                <input type="date" className="input" value={form.issue_date}
                  onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Due Date *</label>
                <input type="date" className="input" value={form.due_date}
                  onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.01" className="input"
                  value={form.tax_rate}
                  onChange={(e) => setForm((p) => ({ ...p, tax_rate: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Line Items</h2>

            <div className="space-y-3">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>

              {items.map((item, index) => {
                const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        type="text"
                        className="input"
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="input text-right"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input text-right"
                        placeholder="0.00"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right text-sm font-medium text-gray-700">
                      {formatCurrency(lineTotal)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={addItem} className="btn-secondary mt-4 text-sm">
              + Add Line Item
            </button>
          </div>

          {/* Notes */}
          <div className="card">
            <label className="label">Notes / Terms</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Payment terms, thank you note, etc."
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>

        {/* Right column – summary */}
        <div className="space-y-4">
          <div className="card sticky top-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({form.tax_rate || 0}%)</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-blue-700">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Update Invoice' : 'Create Invoice'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary w-full"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
