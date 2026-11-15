
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Utensils,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await register({
        ...formData,
        phone: formData.phone.trim() || null,
      });

      navigate('/login', {
        state: {
          message: 'Account created successfully! Please sign in.',
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Unable to create your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">
            <Utensils size={23} />
          </span>
          <span>CampusBite</span>
        </Link>

        <div className="auth-heading">
          <h1>Create account</h1>
          <p>Join CampusBite and get started.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="full_name">Full name</label>
            <div className="auth-input-wrapper">
              <User size={18} />
              <input
                id="full_name"
                type="text"
                name="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleChange}
                minLength={2}
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} />
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="phone">Phone number (optional)</label>
            <div className="auth-input-wrapper">
              <Phone size={18} />
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                maxLength={20}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} />
              <input
                id="register-password"
                type="password"
                name="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                maxLength={128}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="role">I want to join as</label>
            <div className="auth-input-wrapper">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="CUSTOMER">Customer</option>
                <option value="RESTAURANT_OWNER">
                  Restaurant Owner
                </option>
                <option value="DELIVERY_PARTNER">
                  Delivery Partner
                </option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
