
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    setLoading(true);

    try {
      const user = await login(formData);
      const dashboardPaths = {
      CUSTOMER: '/customer',
      RESTAURANT_OWNER: '/owner',
      DELIVERY_PARTNER: '/delivery',
    };
    
  navigate(dashboardPaths[user.role] || '/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Unable to log in. Please check your credentials.'
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
          <h1>Welcome back!</h1>
          <p>Sign in to continue your food journey.</p>
        </div>

        {location.state?.message && (
          <div className="auth-success">
            {location.state.message}
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} />
              <input
                id="email"
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
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
