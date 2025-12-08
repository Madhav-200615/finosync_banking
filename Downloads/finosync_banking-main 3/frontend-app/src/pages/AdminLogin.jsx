import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './adminLogin.css';
import ThemeToggle from '../components/ThemeToggle';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email || !formData.password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(`${API_BASE}/admin/login`, {
                email: formData.email,
                password: formData.password,
            });

            if (response.data.success && response.data.token) {
                // Store admin token and data
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('adminData', JSON.stringify(response.data.admin));

                // Redirect to admin dashboard
                navigate('/admin/dashboard');
            } else {
                setError('Invalid response from server');
            }

        } catch (err) {
            console.error('Admin login error:', err);
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToSelection = () => {
        navigate('/role-selection');
    };

    return (
        <div className="admin-login-container">
            {/* Theme Toggle */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
                <ThemeToggle />
            </div>

            {/* Left Branding Panel */}
            <div className="admin-login-left">
                <div className="admin-brand">
                    <div className="admin-logo">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1>FinoSync Admin</h1>
                    <p>Banking Management Portal</p>
                </div>

                <div className="admin-features">
                    <div className="admin-feature-item">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <div>
                            <h3>Loan Management</h3>
                            <p>Approve and manage loan applications</p>
                        </div>
                    </div>

                    <div className="admin-feature-item">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <div>
                            <h3>Credit Card Approvals</h3>
                            <p>Process credit card applications</p>
                        </div>
                    </div>

                    <div className="admin-feature-item">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <div>
                            <h3>Real-time Analytics</h3>
                            <p>Monitor transactions and customer activity</p>
                        </div>
                    </div>
                </div>

                <button className="back-to-selection-btn" onClick={handleBackToSelection}>
                    ← Back to Role Selection
                </button>
            </div>

            {/* Right Login Form */}
            <div className="admin-login-right">
                <div className="admin-login-card">
                    <header className="admin-login-header">
                        <h2>Admin Sign In</h2>
                        <p>Enter your credentials to access the admin dashboard</p>
                    </header>

                    {error && <div className="admin-error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="admin-login-form">
                        <div className="admin-form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="admin@finosync.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="admin-form-options">
                            <label className="admin-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>Remember me</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="admin-login-btn"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In to Admin Portal'}
                        </button>
                    </form>

                    <div className="admin-login-footer">
                        <p className="admin-security-notice">
                            🔒 This is a secure admin portal. All activities are logged.
                        </p>
                        <p className="admin-default-creds">
                            <strong>Default credentials:</strong><br />
                            Email: admin@finosync.com | Password: Admin@123
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
