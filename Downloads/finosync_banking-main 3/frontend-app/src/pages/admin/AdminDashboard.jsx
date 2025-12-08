import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardStats();

        // Lightweight polling so dashboard reflects new users/accounts shortly after changes
        const intervalId = setInterval(() => {
            fetchDashboardStats();
        }, 15000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');

            const response = await axios.get(`${API_BASE}/admin/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard-error">
                <p>{error}</p>
                <button onClick={fetchDashboardStats}>Retry</button>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Customer Accounts',
            value: stats?.totalCustomers || 0,
            icon: '👥',
            color: '#2563EB',
            bgColor: '#EFF6FF',
            change: '+12%',
            changeType: 'positive'
        },
        {
            title: 'Pending Loan Requests',
            value: stats?.pendingLoans || 0,
            icon: '💰',
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            change: '+3',
            changeType: 'neutral'
        },
        {
            title: 'Pending Credit Card Applications',
            value: stats?.pendingCards || 0,
            icon: '💳',
            color: '#10B981',
            bgColor: '#D1FAE5',
            change: '+5',
            changeType: 'positive'
        },
        {
            title: 'New FD Requests',
            value: stats?.newFDRequests || 0,
            icon: '🏦',
            color: '#8B5CF6',
            bgColor: '#EDE9FE',
            change: '+2',
            changeType: 'positive'
        },
        {
            title: 'Daily Transactions Volume',
            value: stats?.dailyTransactions || 0,
            icon: '📈',
            color: '#06B6D4',
            bgColor: '#CFFAFE',
            change: '+18%',
            changeType: 'positive'
        },
        {
            title: 'Fraud Alerts',
            value: stats?.fraudAlerts || 0,
            icon: '⚠️',
            color: '#EF4444',
            bgColor: '#FEE2E2',
            change: '-2',
            changeType: 'negative'
        }
    ];

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="admin-dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back! Here's what's happening with your bank today.</p>
                </div>
                <button className="admin-refresh-btn" onClick={fetchDashboardStats}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                {statCards.map((card, index) => (
                    <div key={index} className="admin-stat-card" style={{ '--card-color': card.color, '--card-bg': card.bgColor }}>
                        <div className="admin-stat-icon" style={{ background: card.bgColor }}>
                            {card.icon}
                        </div>
                        <div className="admin-stat-content">
                            <p className="admin-stat-title">{card.title}</p>
                            <h2 className="admin-stat-value">{card.value.toLocaleString()}</h2>
                            <div className={`admin-stat-change ${card.changeType}`}>
                                {card.changeType === 'positive' && '↑'}
                                {card.changeType === 'negative' && '↓'}
                                {card.change} from last month
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="admin-quick-actions">
                <h2>Quick Actions</h2>
                <div className="admin-action-grid">
                    <button className="admin-action-card">
                        <div className="admin-action-icon" style={{ background: '#DBEAFE' }}>💰</div>
                        <div>
                            <h3>Review Loan Applications</h3>
                            <p>{stats?.pendingLoans || 0} pending applications</p>
                        </div>
                    </button>
                    <button className="admin-action-card">
                        <div className="admin-action-icon" style={{ background: '#D1FAE5' }}>💳</div>
                        <div>
                            <h3>Approve Credit Cards</h3>
                            <p>{stats?.pendingCards || 0} pending approvals</p>
                        </div>
                    </button>
                    <button className="admin-action-card">
                        <div className="admin-action-icon" style={{ background: '#EDE9FE' }}>🏦</div>
                        <div>
                            <h3>Manage FD Requests</h3>
                            <p>{stats?.newFDRequests || 0} new requests</p>
                        </div>
                    </button>
                    <button className="admin-action-card">
                        <div className="admin-action-icon" style={{ background: '#FEE2E2' }}>⚠️</div>
                        <div>
                            <h3>Review Fraud Alerts</h3>
                            <p>{stats?.fraudAlerts || 0} alerts</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Charts Section (Placeholder) */}
            <div className="admin-charts-section">
                <div className="admin-chart-card">
                    <h3>Transaction Volume Trend</h3>
                    <div className="chart-placeholder">
                        <p>📊 Chart visualization will be displayed here</p>
                        <small>Integration with Chart.js or Recharts coming soon</small>
                    </div>
                </div>
                <div className="admin-chart-card">
                    <h3>Customer Growth</h3>
                    <div className="chart-placeholder">
                        <p>📈 Chart visualization will be displayed here</p>
                        <small>Integration with Chart.js or Recharts coming soon</small>
                    </div>
                </div>
            </div>
        </div>
    );
}
