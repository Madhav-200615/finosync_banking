import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPages.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

export default function LoanManagement() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_BASE}/admin/loans`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setLoans(res.data.loans || []);
            }
        } catch (err) {
            console.error('Failed to fetch loans', err);
            setError('Failed to load loans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const handleLoanAction = async (loanId, action) => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = `${API_BASE}/admin/loans/${loanId}/${action}`;
            await axios.post(url, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchLoans();
        } catch (err) {
            console.error(`Failed to ${action} loan`, err);
            alert(`Failed to ${action} loan`);
        }
    };
    
    useEffect(() => {
        fetchLoans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1>💰 Loan Management</h1>
                <p>Review and monitor loan applications and EMIs</p>
            </div>

            {loading && <p>Loading loans...</p>}
            {error && <p className="admin-error-text">{error}</p>}

            {!loading && !error && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Loan ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Interest Rate</th>
                                <th>Tenure (months)</th>
                                <th>EMI Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                                <th>Paid EMIs</th>
                                <th>Remaining Principal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map((loan) => (
                                <tr key={loan.id}>
                                    <td>{loan.loanId}</td>
                                    <td>{loan.userName}</td>
                                    <td>{loan.loanAmount}</td>
                                    <td>{loan.interestRate}%</td>
                                    <td>{loan.tenure}</td>
                                    <td>{loan.emiAmount}</td>
                                    <td>
                                        <span
                                            className={
                                                loan.repaymentStatus === 'PENDING'
                                                    ? 'fd-status fd-status-closed'
                                                    : loan.repaymentStatus === 'ACTIVE'
                                                        ? 'fd-status fd-status-active'
                                                        : 'fd-status'
                                            }
                                        >
                                            {loan.repaymentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        {loan.repaymentStatus === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="loan-approve-btn"
                                                    onClick={() => handleLoanAction(loan.loanId, 'approve')}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="loan-reject-btn"
                                                    onClick={() => handleLoanAction(loan.loanId, 'reject')}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td>{loan.paidEmiCount}</td>
                                    <td>{loan.remainingPrincipal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loans.length === 0 && <p>No loans found.</p>}
                </div>
            )}
        </div>
    );
}
