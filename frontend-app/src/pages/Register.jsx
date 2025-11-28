import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './login.css';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    aadhar: '',
    pan: '',
    address: '',
    accountType: 'SAVINGS',
    initialDeposit: '',
    pin: '',
    confirmPin: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.age || !formData.phone || !formData.aadhar || !formData.pan || !formData.address || !formData.pin) {
      setError('All fields are required');
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      setError('PIN must be 4 digits');
      return;
    }

    if (formData.initialDeposit < 0) {
      setError('Initial deposit cannot be negative');
      return;
    }

    if (isNaN(parseInt(formData.age)) || formData.age < 18) {
      setError('You must be at least 18 years old');
      return;
    }

    try {
      setLoading(true);

      // Register user
      const response = await api.post('/auth/register', {
        name: formData.name,
        age: parseInt(formData.age),
        phone: formData.phone,
        pin: formData.pin,
        aadhar: formData.aadhar,
        pan: formData.pan,
        address: formData.address,
        accountType: formData.accountType,
        initialDeposit: parseFloat(formData.initialDeposit) || 0
      });

      console.log('Registration successful:', response.data);

      // Save token and user data from registration response
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('Token saved, redirecting to dashboard...');

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Removed success page as we're redirecting to dashboard

  return (
    <div className="login-root">
      <div className="login-side">
        <div className="logo-badge">FastBank</div>
        <h1 className="login-heading">Create New Account</h1>
        <p className="login-tagline">
          Join FastBank today and experience seamless banking.
          <br />
          Open your account in minutes.
        </p>
        <div className="blur-pill" />
      </div>

      <div className="login-card-outer">
        <div className="login-card-inner">
          <header className="login-header">
            <h2>Open New Account</h2>
            <p>Fill in your details to get started</p>
          </header>

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="field">
              <label>Age*</label>
              <input
                type="number"
                name="age"
                min="18"
                value={formData.age}
                onChange={handleChange}
                required
                placeholder="Enter your age"
              />
            </div>

            <div className="field">
              <label>Phone Number*</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your 10-digit mobile number"
                pattern="[0-9]{10}"
              />
            </div>

            <div className="field">
              <label>Aadhar Number (12 digits)</label>
              <input
                type="text"
                name="aadhar"
                value={formData.aadhar}
                onChange={handleChange}
                placeholder="Enter 12-digit Aadhar number"
                pattern="[0-9]{12}"
              />
            </div>

            <div className="field">
              <label>PAN Card Number</label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                placeholder="Enter 10-digit PAN number"
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="field">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full address"
                rows="3"
              />
            </div>

            <div className="field">
              <label>Account Type*</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
              >
                <option value="SAVINGS">Savings Account</option>
                <option value="CURRENT">Current Account</option>
              </select>
            </div>

            <div className="field">
              <label>Initial Deposit (₹)</label>
              <input
                type="number"
                name="initialDeposit"
                value={formData.initialDeposit}
                onChange={handleChange}
                placeholder="Enter initial deposit amount"
                min="0"
              />
            </div>

            <div className="field">
              <label>Create 4-digit PIN*</label>
              <input
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                required
                placeholder="Enter 4-digit PIN"
                pattern="[0-9]{4}"
                maxLength="4"
              />
            </div>

            <div className="field">
              <label>Confirm 4-digit PIN*</label>
              <input
                type="password"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleChange}
                required
                placeholder="Confirm your 4-digit PIN"
                pattern="[0-9]{4}"
                maxLength="4"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="login-footer">
              Already have an account?{' '}
              <button
                type="button"
                className="text-button"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
