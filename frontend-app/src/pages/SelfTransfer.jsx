import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import "./payment.css";

export default function SelfTransfer() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);

    const [fromAccount, setFromAccount] = useState("");
    const [toAccount, setToAccount] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [pin, setPin] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadUserData();
        loadAccounts();
    }, []);

    const loadUserData = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data.user);
        } catch (err) {
            console.error("Failed to load user:", err);
        }
    };

    const loadAccounts = async () => {
        try {
            const res = await api.get("/accounts");
            setAccounts(res.data.accounts || []);
        } catch (err) {
            console.error("Failed to load accounts:", err);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!fromAccount) newErrors.fromAccount = "Please select source account";
        if (!toAccount) newErrors.toAccount = "Please select destination account";
        if (!amount || amount <= 0) newErrors.amount = "Please enter valid amount";
        if (!pin || pin.length < 4) newErrors.pin = "PIN must be at least 4 digits";
        if (fromAccount && toAccount && fromAccount === toAccount) {
            newErrors.toAccount = "Source and destination cannot be same";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePay = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            await api.post("/transactions/transfer", {
                fromAccountNumber: fromAccount,
                toAccountNumber: toAccount,
                amount: Number(amount),
                pin,
                note: description || "Self Transfer"
            });

            // Show Google Pay style success animation
            setTimeout(() => {
                setShowSuccess(true);
                setTimeout(() => {
                    navigate("/payments/result", {
                        state: {
                            success: true,
                            amount,
                            recipient: "Your Account",
                            description: description || "Self Transfer",
                            timestamp: new Date().toISOString()
                        }
                    });
                }, 1500);
            }, 1000);

        } catch (err) {
            setLoading(false);
            alert(err.response?.data?.error || "Transfer failed");
        }
    };

    return (
        <Layout title="Self Transfer">
            <div className="payment-form-container">
                <motion.div
                    className="payment-form-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="form-header">
                        <h1 className="form-title">Self Transfer / Top-Up</h1>
                        <p className="form-subtitle">
                            Transfer money between your own accounts
                        </p>
                    </div>

                    {/* User Info */}
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Account Holder</label>
                            <input
                                type="text"
                                className="input-field validated"
                                value={user?.name || "Loading..."}
                                readOnly
                            />
                            <span className="input-tick">✓</span>
                        </div>
                    </div>

                    {/* From Account */}
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">
                                From Account <span className="input-required">*</span>
                            </label>
                            <select
                                className={`select-field ${fromAccount ? "validated" : ""} ${errors.fromAccount ? "error" : ""}`}
                                value={fromAccount}
                                onChange={(e) => {
                                    setFromAccount(e.target.value);
                                    setErrors({ ...errors, fromAccount: null });
                                }}
                            >
                                <option value="">Select Source Account</option>
                                {accounts.map((acc) => (
                                    <option key={acc._id} value={acc.accountNumber}>
                                        {acc.type} - ₹{acc.balance?.toLocaleString()} ({acc.accountNumber})
                                    </option>
                                ))}
                            </select>
                            {fromAccount && <span className="input-tick">✓</span>}
                            {errors.fromAccount && (
                                <p className="input-error-text">{errors.fromAccount}</p>
                            )}
                        </div>
                    </div>

                    {/* To Account */}
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">
                                To Account <span className="input-required">*</span>
                            </label>
                            <select
                                className={`select-field ${toAccount ? "validated" : ""} ${errors.toAccount ? "error" : ""}`}
                                value={toAccount}
                                onChange={(e) => {
                                    setToAccount(e.target.value);
                                    setErrors({ ...errors, toAccount: null });
                                }}
                            >
                                <option value="">Select Destination Account</option>
                                {accounts.map((acc) => (
                                    <option key={acc._id} value={acc.accountNumber}>
                                        {acc.type} - ₹{acc.balance?.toLocaleString()} ({acc.accountNumber})
                                    </option>
                                ))}
                            </select>
                            {toAccount && fromAccount !== toAccount && <span className="input-tick">✓</span>}
                            {errors.toAccount && (
                                <p className="input-error-text">{errors.toAccount}</p>
                            )}
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">
                                Amount (₹) <span className="input-required">*</span>
                            </label>
                            <input
                                type="number"
                                className={`input-field ${amount && amount > 0 ? "validated" : ""} ${errors.amount ? "error" : ""}`}
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setErrors({ ...errors, amount: null });
                                }}
                            />
                            {amount && amount > 0 && <span className="input-tick">✓</span>}
                            {errors.amount && (
                                <p className="input-error-text">{errors.amount}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">Description (Optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g., Wallet top-up"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* PIN */}
                    <div className="form-section">
                        <div className="input-group">
                            <label className="input-label">
                                Enter PIN <span className="input-required">*</span>
                            </label>
                            <input
                                type="password"
                                className={`input-field ${pin && pin.length >= 4 ? "validated" : ""} ${errors.pin ? "error" : ""}`}
                                placeholder="Enter your 4-digit PIN"
                                value={pin}
                                maxLength={6}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setErrors({ ...errors, pin: null });
                                }}
                            />
                            {pin && pin.length >= 4 && <span className="input-tick">✓</span>}
                            {errors.pin && (
                                <p className="input-error-text">{errors.pin}</p>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        className="btn btn-primary btn-full-width"
                        onClick={handlePay}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? "Processing..." : "Pay Now"}
                    </motion.button>

                    <button
                        className="btn btn-secondary btn-full-width"
                        onClick={() => navigate("/payments")}
                        style={{ marginTop: "12px" }}
                    >
                        Cancel
                    </button>
                </motion.div>
            </div>

            {/* Loading Overlay with Success Animation */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        className="loading-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="loading-content"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                        >
                            {!showSuccess ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    <p className="loading-text">Processing Payment...</p>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                >
                                    <div className="success-animation">
                                        <div className="success-circle">
                                            <span className="success-checkmark">✓</span>
                                        </div>
                                    </div>
                                    <p className="loading-text" style={{ color: "var(--success-green)" }}>
                                        Payment Successful!
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
}
