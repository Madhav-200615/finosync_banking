import React from 'react';
import { useNavigate } from 'react-router-dom';
import './roleSelection.css';
import ThemeToggle from '../components/ThemeToggle';

export default function RoleSelection() {
    const navigate = useNavigate();

    const handleAdminClick = () => {
        navigate('/admin/login');
    };

    const handleUserClick = () => {
        navigate('/login');
    };

    return (
        <div className="role-selection-container">
            {/* Theme Toggle */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
                <ThemeToggle />
            </div>

            {/* Header */}
            <header className="role-header">
                <div className="logo-badge">FinoSync</div>
                <h1>Welcome to FinoSync Banking</h1>
                <p>Choose your portal to continue</p>
            </header>

            {/* Split Selection Cards */}
            <div className="role-cards-container">

                {/* Admin Portal Card */}
                <div className="role-card admin-card" onClick={handleAdminClick}>
                    <div className="role-card-inner">
                        <div className="role-icon admin-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h2>Admin Portal</h2>
                        <p>
                            Manage loans, credit cards, FD requests, customer accounts, and monitor transactions in real-time.
                        </p>
                        <div className="role-features">
                            <span>✓ Dashboard Analytics</span>
                            <span>✓ Loan Approvals</span>
                            <span>✓ Customer Management</span>
                            <span>✓ Transaction Monitoring</span>
                        </div>
                        <button className="role-btn admin-btn">
                            Access Admin Dashboard →
                        </button>
                    </div>
                </div>

                {/* User Portal Card */}
                <div className="role-card user-card" onClick={handleUserClick}>
                    <div className="role-card-inner">
                        <div className="role-icon user-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h2>User Portal</h2>
                        <p>
                            Access your accounts, make transfers, apply for loans, track investments, and manage your finances.
                        </p>
                        <div className="role-features">
                            <span>✓ Account Dashboard</span>
                            <span>✓ Fund Transfers</span>
                            <span>✓ Loan Applications</span>
                            <span>✓ Investment Tracking</span>
                        </div>
                        <button className="role-btn user-btn">
                            Access User Dashboard →
                        </button>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <footer className="role-footer">
                <p>© 2024 FinoSync Bank. All rights reserved. | Secure Banking Platform</p>
            </footer>
        </div>
    );
}
