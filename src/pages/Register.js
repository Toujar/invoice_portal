import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm_password: '',
    business_name: '', phone: '', address: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim())  return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm_password) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      await register({
        name:          form.name,
        email:         form.email,
        password:      form.password,
        business_name: form.business_name,
        phone:         form.phone,
        address:       form.address,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl text-white text-2xl font-bold mb-4">
            IP
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Start managing your invoices today</p>
        </div>

        <div className="card">
          <Alert type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="label">Full name *</label>
                <input id="name" name="name" type="text" required className="input"
                  placeholder="Jane Smith" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="business_name" className="label">Business name</label>
                <input id="business_name" name="business_name" type="text" className="input"
                  placeholder="Acme LLC" value={form.business_name} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">Email address *</label>
              <input id="email" name="email" type="email" required className="input"
                placeholder="you@example.com" value={form.email} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="label">Password *</label>
                <input id="password" name="password" type="password" required className="input"
                  placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="confirm_password" className="label">Confirm password *</label>
                <input id="confirm_password" name="confirm_password" type="password" required className="input"
                  placeholder="Repeat password" value={form.confirm_password} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" name="phone" type="tel" className="input"
                placeholder="+1 555 000 0000" value={form.phone} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="address" className="label">Address</label>
              <textarea id="address" name="address" rows={2} className="input resize-none"
                placeholder="123 Main St, City, Country" value={form.address} onChange={handleChange} />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
