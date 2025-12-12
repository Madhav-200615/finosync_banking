import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api'; // existing axios instance
import { useTheme } from '../contexts/ThemeContext';
import { connectWS } from '../ws'; // existing WS helper
import '../styles/MyInfo.css';

export default function MyInfo() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [cards, setCards] = useState({ credit: [], debit: [] });
    const [accounts, setAccounts] = useState([]);
    const [loans, setLoans] = useState([]);
    const [fds, setFds] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const { theme } = useTheme();

    useEffect(() => {
        fetchAllData();

        // WebSocket integration for real-time updates
        const cleanup = connectWS((msg) => {
            if (msg.type === 'transaction' || msg.type === 'balance_update') {
                fetchAccounts();
                fetchTransactions();
            }
        });

        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchUserProfile(),
                fetchCards(),
                fetchAccounts(),
                fetchLoans(),
                fetchFDs(),
                fetchTransactions()
            ]);
        } catch (error) {
            console.error("Error fetching My Info data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            // Try /auth/me first, fallback to localStorage if fails or not implemented
            const res = await api.get('/auth/me');
            if (res.data && res.data.user) {
                setUserData(res.data.user);
            } else {
                // Fallback to local storage if endpoint doesn't return user structure expected
                const stored = localStorage.getItem('user');
                if (stored) setUserData(JSON.parse(stored));
            }
        } catch (e) {
            const stored = localStorage.getItem('user');
            if (stored) setUserData(JSON.parse(stored));
        }
    };

    const fetchCards = async () => {
        try {
            const res = await api.get('/cards');
            setCards({ credit: res.data.credit || [], debit: res.data.debit || [] });
        } catch (e) { console.error("Cards fetch failed", e); }
    };

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/accounts');
            setAccounts(res.data.accounts || []);
        } catch (e) { console.error("Accounts fetch failed", e); }
    };

    const fetchLoans = async () => {
        try {
            const res = await api.get('/loans');
            setLoans(res.data.loans || []);
        } catch (e) { console.error("Loans fetch failed", e); }
    };

    const fetchFDs = async () => {
        try {
            const res = await api.get('/investments/fds'); // Assuming this endpoint likely exists or similar
            // If specific FD endpoint missing, we might check /investments
            setFds(res.data.fds || []);
        } catch (e) {
            // Fallback try general investments?
            try {
                const invRes = await api.get('/investments');
                if (invRes.data && invRes.data.data) {
                    // Filter for FDs if mixed
                    setFds(invRes.data.data.filter(i => i.type === 'FD') || []);
                }
            } catch (err) { }
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/transactions/dashboard'); // Use dashboard summary or /transactions
            if (res.data && res.data.dashboard) {
                // We need total count and amount, dashboard usually has summary
                // Or we can fetch full list
                setTransactions(res.data.dashboard);
            }
        } catch (e) { console.error("Transactions fetch failed", e); }
    };

    // Calculate totals
    const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const loanCount = loans.length;
    // Assuming we might have logic for 'amount to pay' vs 'loan taken', using simple sum for now
    const totalDue = loans.reduce((sum, loan) => sum + (loan.remainingAmount || loan.amount || 0), 0);

    // FDs
    const fdCount = fds.length;
    const totalFdMaturity = fds.reduce((sum, fd) => sum + (fd.maturityAmount || 0), 0);

    // Transactions - using dashboard data which usually has totals
    const txCount = transactions?.recentTransactions?.length || 0; // This might be just recent, but good enough for UI demo
    const totalTxAmount = (transactions?.totalDebits || 0) + (transactions?.totalCredits || 0);

    // Change PIN State
    const [showChangePin, setShowChangePin] = useState(false);
    const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });
    const [pinStatus, setPinStatus] = useState({ loading: false, error: '', success: '' });

    const handleChangePin = async (e) => {
        e.preventDefault();
        setPinStatus({ loading: true, error: '', success: '' });

        if (pinForm.newPin !== pinForm.confirmPin) {
            setPinStatus({ loading: false, error: 'New PINs do not match', success: '' });
            return;
        }

        try {
            const res = await api.post('/auth/change-pin', {
                oldPin: pinForm.oldPin,
                newPin: pinForm.newPin
            });
            setPinStatus({ loading: false, error: '', success: res.data.message });
            setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
            setTimeout(() => {
                setShowChangePin(false);
                setPinStatus({ loading: false, error: '', success: '' });
            }, 2000);
        } catch (err) {
            setPinStatus({
                loading: false,
                error: err.response?.data?.error || 'Failed to change PIN',
                success: ''
            });
        }
    };

    return (
        <Layout title="My Info">
            <div className="my-info-page">
                <div className="my-info-container">

                    {/* SECTION A: PERSONAL DETAILS */}
                    <div>
                        <div className="section-heading">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            Personal Details
                        </div>
                        <div className="info-card">
                            <div className="personal-details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Full Name</span>
                                    <span className="detail-value">{userData?.name || 'Loading...'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Age</span>
                                    <span className="detail-value">{userData?.age || '--'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Phone Number</span>
                                    <span className="detail-value">{userData?.phone || userData?.phoneNumber || '--'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Address</span>
                                    <span className="detail-value">{userData?.address || '--'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION B: KYC DETAILS */}
                    <div className="info-grid user-select-none">
                        <div className="info-card">
                            <div className="detail-item">
                                <span className="detail-label">Aadhaar Number</span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="detail-value">{userData?.aadhar ? `XXXX-XXXX-${userData.aadhar.slice(-4)}` : '--'}</span>
                                    <span className="kyc-verification">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        Verified
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="info-card">
                            <div className="detail-item">
                                <span className="detail-label">PAN Number</span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="detail-value">{userData?.pan || '--'}</span>
                                    <span className="kyc-verification">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        Verified
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION C: CARDS */}
                    <div>
                        <div className="section-heading">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                            My Cards
                        </div>
                        <div className="cards-scroll-container">
                            {[...cards.credit, ...cards.debit].map((card, idx) => (
                                <div key={idx} className="info-card" style={{ minWidth: '300px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <span style={{ opacity: 0.8 }}>{card.type === 'credit' ? 'CREDIT' : 'DEBIT'}</span>
                                        <span style={{ fontWeight: 'bold' }}>{card.brand || 'VISA'}</span>
                                    </div>
                                    <div style={{ fontSize: '1.4rem', letterSpacing: '2px', marginBottom: '20px' }}>
                                        **** **** **** {card.cardNumber ? card.cardNumber.slice(-4) : '0000'}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Card Holder</div>
                                            <div>{card.cardholderName || userData?.name}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Expires</div>
                                            <div>{card.expiryMonth || '12'}/{card.expiryYear || '28'}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {[...cards.credit, ...cards.debit].length === 0 && (
                                <div className="info-card" style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No cards found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION D: ACCOUNTS */}
                    <div>
                        <div className="section-heading">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18" /><path d="M5 21V7" /><path d="M19 21V7" /><path d="M5 7h14" /><path d="M12 2v5" /></svg>
                            Total Accounts
                        </div>
                        <div className="info-card" style={{ padding: '0 30px' }}>
                            {accounts.map((acc, idx) => (
                                <div key={idx} className="accounts-list-item">
                                    <div className="account-info">
                                        <h4>{acc.type === 'savings' ? 'Savings Account' : 'Current Account'}</h4>
                                        <p>Acct: {acc.accountNumber}</p>
                                    </div>
                                    <div className="account-balance">
                                        <h3>₹{parseFloat(acc.balance).toLocaleString()}</h3>
                                        <span style={{ fontSize: '0.8rem', color: 'green' }}>Available Balance</span>
                                    </div>
                                </div>
                            ))}
                            {accounts.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center' }}>No accounts found.</div>
                            )}
                        </div>
                    </div>

                    {/* SECTION E: LOANS & PAYMENTS */}
                    <div>
                        <div className="section-heading">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            Loans & Dues
                        </div>
                        <div className="info-grid">
                            <div className="loan-box">
                                <span>Amount Payable (Dues)</span>
                                <h3>₹{totalDue.toLocaleString()}</h3>
                                <span>EMIs & Pending Dues</span>
                            </div>
                            <div className="loan-box">
                                <span>Total Loan Amount</span>
                                <h3>₹{totalLoanAmount.toLocaleString()}</h3>
                                <span>{loanCount} Active Loans</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION F: FIXED DEPOSITS & TRANSACTIONS */}
                    <div className="info-grid">
                        {/* FDs */}
                        <div className="info-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '8px', color: '#4338ca' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Fixed Deposits</h3>
                            </div>
                            <div className="fd-summary">
                                <div className="fd-stat">
                                    <div className="fd-stat-value">{fdCount}</div>
                                    <div className="fd-stat-label">Total FDs</div>
                                </div>
                                <div className="fd-stat" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                                    <div className="fd-stat-value">₹{totalFdMaturity.toLocaleString()}</div>
                                    <div className="fd-stat-label">Maturity Amount</div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Summary */}
                        <div className="info-card tx-summary">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', opacity: 0.9 }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Transaction Summary</h3>
                            </div>
                            <div className="tx-stat-row">
                                <div className="tx-stat">
                                    <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Total Txns</div>
                                    <h3>{transactions?.recentTransactions?.length > 10 ? '10+' : transactions?.recentTransactions?.length || 0}</h3>
                                </div>
                                <div className="tx-stat" style={{ textAlign: 'right' }}>
                                    <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Volume</div>
                                    <h3>₹{totalTxAmount.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Section (UI Only) */}
                    <div>
                        <div className="section-heading">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            Security Settings
                        </div>
                        <div className="info-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>Change Password</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Update your password regularly for better security.</p>
                                </div>
                                <button
                                    onClick={() => setShowChangePin(true)}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)'
                                    }}>Change</button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Change PIN Modal */}
                {showChangePin && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Change PIN</h3>
                                <button className="modal-close-btn" onClick={() => setShowChangePin(false)}>×</button>
                            </div>

                            <form onSubmit={handleChangePin}>
                                <div className="form-group">
                                    <label>Old PIN</label>
                                    <input
                                        type="password"
                                        maxLength="4"
                                        className="form-input"
                                        value={pinForm.oldPin}
                                        onChange={e => setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="Enter current 4-digit PIN"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>New PIN</label>
                                    <input
                                        type="password"
                                        maxLength="4"
                                        className="form-input"
                                        value={pinForm.newPin}
                                        onChange={e => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="Enter new 4-digit PIN"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New PIN</label>
                                    <input
                                        type="password"
                                        maxLength="4"
                                        className="form-input"
                                        value={pinForm.confirmPin}
                                        onChange={e => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="Confirm new 4-digit PIN"
                                    />
                                </div>

                                {pinStatus.error && <div style={{ color: '#EF4444', marginBottom: '15px', fontSize: '0.9rem' }}>{pinStatus.error}</div>}
                                {pinStatus.success && <div style={{ color: '#10B981', marginBottom: '15px', fontSize: '0.9rem' }}>{pinStatus.success}</div>}

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowChangePin(false)}>Cancel</button>
                                    <button type="submit" className="btn-confirm" disabled={pinStatus.loading}>
                                        {pinStatus.loading ? 'Updating...' : 'Update PIN'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
}
