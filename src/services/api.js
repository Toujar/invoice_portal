import axios from 'axios';

// Base URL pointing to XAMPP backend
const BASE_URL = 'http://localhost/invoice-portal/backend/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send session cookies
  headers: { 'Content-Type': 'application/json' },
});

// ── Response interceptor: unwrap data or throw error ─────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ============================================================
// AUTH
// ============================================================
export const authAPI = {
  register: (data) => api.post('/auth.php?action=register', data),
  login:    (data) => api.post('/auth.php?action=login', data),
  logout:   ()     => api.post('/auth.php?action=logout'),
  me:       ()     => api.get('/auth.php?action=me'),
};

// ============================================================
// CLIENTS
// ============================================================
export const clientsAPI = {
  getAll:    ()       => api.get('/clients.php'),
  getOne:    (id)     => api.get(`/clients.php?id=${id}`),
  create:    (data)   => api.post('/clients.php', data),
  update:    (id, data) => api.put(`/clients.php?id=${id}`, data),
  delete:    (id)     => api.delete(`/clients.php?id=${id}`),
};

// ============================================================
// INVOICES
// ============================================================
export const invoicesAPI = {
  getAll:       (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/invoices.php${qs ? '?' + qs : ''}`);
  },
  getOne:       (id)          => api.get(`/invoices.php?id=${id}`),
  create:       (data)        => api.post('/invoices.php', data),
  update:       (id, data)    => api.put(`/invoices.php?id=${id}`, data),
  updateStatus: (id, status)  => api.put(`/invoices.php?id=${id}&action=status`, { status }),
  delete:       (id)          => api.delete(`/invoices.php?id=${id}`),
};

// ============================================================
// PAYMENTS
// ============================================================
export const paymentsAPI = {
  getByInvoice: (invoiceId) => api.get(`/payments.php?invoice_id=${invoiceId}`),
  create:       (data)      => api.post('/payments.php', data),
  delete:       (id)        => api.delete(`/payments.php?id=${id}`),
};

// ============================================================
// DASHBOARD
// ============================================================
export const dashboardAPI = {
  get: () => api.get('/dashboard.php'),
};

export default api;
