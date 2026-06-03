import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';

// Pages
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import Clients        from './pages/Clients';
import Invoices       from './pages/Invoices';
import CreateInvoice  from './pages/CreateInvoice';
import EditInvoice    from './pages/EditInvoice';
import InvoiceDetail  from './pages/InvoiceDetail';

// Layout
import Layout from './components/Layout';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes wrapped in Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"          element={<Dashboard />} />
            <Route path="clients"            element={<Clients />} />
            <Route path="invoices"           element={<Invoices />} />
            <Route path="invoices/new"       element={<CreateInvoice />} />
            <Route path="invoices/:id"       element={<InvoiceDetail />} />
            <Route path="invoices/:id/edit"  element={<EditInvoice />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
