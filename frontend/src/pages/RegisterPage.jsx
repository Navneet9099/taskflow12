import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientErrors, setClientErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      showToast('Registration successful! Signing you in...', 'success');

      // Automatically sign in upon registration
      try {
        await login(email.trim(), password);
        navigate('/', { replace: true });
      } catch {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const apiMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" aria-hidden="true">✓</div>
          <h1 className="auth-title">Create your Account</h1>
          <p className="auth-subtitle">Get started with organized task tracking</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">✕</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label required">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              className={`form-input ${clientErrors.name ? 'is-invalid' : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (clientErrors.name) setClientErrors((p) => ({ ...p, name: null }));
              }}
              placeholder="e.g. John Doe"
              autoComplete="name"
              disabled={isSubmitting}
              autoFocus
            />
            {clientErrors.name && <span className="form-error">{clientErrors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email" className="form-label required">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              className={`form-input ${clientErrors.email ? 'is-invalid' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (clientErrors.email) setClientErrors((p) => ({ ...p, email: null }));
              }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isSubmitting}
            />
            {clientErrors.email && <span className="form-error">{clientErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password" className="form-label required">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              className={`form-input ${clientErrors.password ? 'is-invalid' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (clientErrors.password) setClientErrors((p) => ({ ...p, password: null }));
              }}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            {clientErrors.password && <span className="form-error">{clientErrors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="reg-confirm-password" className="form-label required">
              Confirm Password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              className={`form-input ${clientErrors.confirmPassword ? 'is-invalid' : ''}`}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (clientErrors.confirmPassword) setClientErrors((p) => ({ ...p, confirmPassword: null }));
              }}
              placeholder="Re-enter password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            {clientErrors.confirmPassword && (
              <span className="form-error">{clientErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

