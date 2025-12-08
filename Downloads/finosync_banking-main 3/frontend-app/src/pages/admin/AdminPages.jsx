import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPages.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

export function CreditCardApprovals() {
    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1>💳 Credit Card Approvals</h1>
                <p>Process credit card applications</p>
            </div>
            <div className="coming-soon-card">
                <div className="coming-soon-icon">🚧</div>
                <h2>Credit Card Approval System</h2>
                <p>Complete card approval workflow with verification checklists and approval controls.</p>
            </div>
        </div>
    );
}

export function FDManagement() {
    const [fds, setFds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFds = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');
                const res = await axios.get(`${API_BASE}/admin/fixed-deposits`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success) {
                    setFds(res.data.fixedDeposits || []);
                }
            } catch (err) {
                console.error('Failed to fetch fixed deposits', err);
                setError('Failed to load fixed deposits');
            } finally {
                setLoading(false);
            }
        };

        fetchFds();
    }, []);

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1>🏦 FD Management</h1>
                <p>Manage fixed deposit requests</p>
            </div>

            {loading && <p>Loading fixed deposits...</p>}
            {error && <p className="admin-error-text">{error}</p>}

            {!loading && !error && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>FD ID</th>
                                <th>Customer</th>
                                <th>Principal</th>
                                <th>Interest Rate</th>
                                <th>Maturity Amount</th>
                                <th>Tenure (months)</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fds.map((fd) => (
                                <tr key={fd.id}>
                                    <td>{fd.fdId}</td>
                                    <td>{fd.userName}</td>
                                    <td>{fd.principalAmount}</td>
                                    <td>{fd.interestRate}%</td>
                                    <td>{fd.maturityAmount}</td>
                                    <td>{fd.tenure}</td>
                                    <td>{fd.startDate && new Date(fd.startDate).toLocaleDateString()}</td>
                                    <td>{fd.endDate && new Date(fd.endDate).toLocaleDateString()}</td>
                                    <td>
                                        <span
                                            className={
                                                `fd-status ${fd.status === 'ACTIVE' ? 'fd-status-active' : 'fd-status-closed'}`
                                            }
                                        >
                                            {fd.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {fds.length === 0 && <p>No fixed deposits found.</p>}
                </div>
            )}
        </div>
    );
}

export function CustomerAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');
                const res = await axios.get(`${API_BASE}/admin/customer-accounts`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success) {
                    setAccounts(res.data.accounts || []);
                }
            } catch (err) {
                console.error('Failed to fetch customer accounts', err);
                setError('Failed to load customer accounts');
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1>👥 Customer Accounts</h1>
                <p>View and manage customer accounts</p>
            </div>

            {loading && <p>Loading customer accounts...</p>}
            {error && <p className="admin-error-text">{error}</p>}

            {!loading && !error && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Account Holder</th>
                                <th>Account Number</th>
                                <th>Account Type</th>
                                <th>Balance</th>
                                <th>Opened On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc) => (
                                <tr key={acc.id}>
                                    <td>{acc.accountHolderName}</td>
                                    <td>{acc.accountNumber}</td>
                                    <td>{acc.accountType}</td>
                                    <td>{acc.balance}</td>
                                    <td>{acc.createdAt && new Date(acc.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {accounts.length === 0 && <p>No customer accounts found.</p>}
                </div>
            )}
        </div>
    );
}

export function TransactionsMonitoring() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');
                const res = await axios.get(`${API_BASE}/admin/transactions`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success) {
                    setTransactions(res.data.transactions || []);
                }
            } catch (err) {
                console.error('Failed to fetch transactions', err);
                setError('Failed to load transactions');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1>📈 Transactions Monitoring</h1>
                <p>Real-time transaction monitoring and fraud detection</p>
            </div>

            {loading && <p>Loading transactions...</p>}
            {error && <p className="admin-error-text">{error}</p>}

            {!loading && !error && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => {
                                const type = (tx.type || '').toUpperCase();
                                return (
                                    <tr key={tx._id}>
                                        <td>{tx._id}</td>
                                        <td>{tx.user && tx.user.name}</td>
                                        <td>{tx.type}</td>
                                        <td>
                                            <span
                                                className={
                                                    type === 'CREDIT'
                                                        ? 'amount-credit'
                                                        : type === 'DEBIT'
                                                            ? 'amount-debit'
                                                            : 'amount-emi'
                                                }
                                            >
                                                {tx.amount}
                                            </span>
                                        </td>
                                        <td>{tx.createdAt && new Date(tx.createdAt).toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {transactions.length === 0 && <p>No transactions found.</p>}
                </div>
            )}
        </div>
    );
}

export function ReportsAnalytics() {
    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1>📑 Reports & Analytics</h1>
                <p>Business intelligence and reporting</p>
            </div>
            <div className="coming-soon-card">
                <div className="coming-soon-icon">🚧</div>
                <h2>Reports & Analytics System</h2>
                <p>Key metrics, charts, export options, and custom report builder.</p>
            </div>
        </div>
    );
}

export function AdminSettings() {
    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1>⚙️ Admin Settings</h1>
                <p>Configure system settings</p>
            </div>
            <div className="coming-soon-card">
                <div className="coming-soon-icon">🚧</div>
                <h2>Admin Settings</h2>
                <p>User management, system config, notifications, security, API keys.</p>
            </div>
        </div>
    );
}
