import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './login.css';
import ThemeToggle from '../components/ThemeToggle';

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
  const [generatedAccountNumber, setGeneratedAccountNumber] = useState('');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate account number (same logic as backend)
  const generateAccountNumber = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Copy account number to clipboard
  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(generatedAccountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Watch for matching PINs and generate account number
  useEffect(() => {
    if (
      formData.pin &&
      formData.confirmPin &&
      formData.pin === formData.confirmPin &&
      formData.pin.length === 4 &&
      /^\d{4}$/.test(formData.pin) &&
      !generatedAccountNumber
    ) {
      const accNo = generateAccountNumber();
      setGeneratedAccountNumber(accNo);
      // Delay animation slightly for smooth effect
      setTimeout(() => setShowAccountNumber(true), 100);
    } else if (formData.pin !== formData.confirmPin && generatedAccountNumber) {
      // Reset if PINs no longer match
      setGeneratedAccountNumber('');
      setShowAccountNumber(false);
    }
  }, [formData.pin, formData.confirmPin, generatedAccountNumber]);

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
        initialDeposit: parseFloat(formData.initialDeposit) || 0,
        accountNumber: generatedAccountNumber // Send the generated account number
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
      {/* Theme Toggle - Top Right */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <ThemeToggle />
      </div>

      <div className="login-side">
        <div className="logo-badge">FinoSync</div>
        <h1 className="login-heading">Create an Account</h1>
        <p className="login-tagline">
          Join FinoSync today and experience seamless banking.
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
                maxLength="10"
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
                maxLength="12"
              />
            </div>

            <div className="field">
              <label>PAN Card Number</label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                placeholder="Enter 10-character PAN (e.g., ABCDE1234F)"
                maxLength="10"
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

            {/* Account Number Reveal - appears when PINs match */}
            {showAccountNumber && (
              <div className="account-number-reveal">
                <div className="account-number-header">
                  <span className="checkmark-icon">✓</span>
                  <label>Your Account Number</label>
                </div>
                <div className="account-number-display">
                  <div className="account-number-input-wrapper">
                    <input
                      type="text"
                      value={generatedAccountNumber}
                      readOnly
                      className="account-number-field"
                    />
                    <button
                      type="button"
                      onClick={handleCopyAccountNumber}
                      className="copy-account-btn"
                      title="Copy account number"
                    >
                      {copied ? (
                        <>
                          <span className="copy-icon">✓</span>
                          <span className="copy-text">Copied!</span>
                        </>
                      ) : (
                        <>
                          <span className="copy-icon">📋</span>
                          <span className="copy-text">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="account-number-hint">
                    📝 Please save this number - you'll need it to login
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="create-account-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="button-icon">✨</span>
                  Create Account
                </>
              )}
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
