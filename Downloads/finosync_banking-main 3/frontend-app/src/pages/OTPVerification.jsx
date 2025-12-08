import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import "./payment.css";

export default function OTPVerification() {
    const navigate = useNavigate();
    const location = useLocation();
    const transferData = location.state || {};

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (otpSent && timer > 0) {
            const interval = setInterval(() => {
                setTimer(t => {
                    if (t <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [otpSent, timer]);

    const handleGenerateOTP = async () => {
        setOtpSending(true);

        try {
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            console.log("🔐 Auth token exists:", !!token);

            if (!token) {
                alert("You are not logged in. Please log in again.");
                window.location.href = '/login';
                return;
            }

            // Send email in the request body
            console.log("🔄 Generating OTP for email:", transferData.email);
            console.log("📧 Email value:", transferData.email || "MISSING!");

            if (!transferData.email) {
                alert("Email is required to send OTP. Please go back and enter your email.");
                return;
            }

            const res = await api.post("/otp/generate", {
                email: transferData.email // Email from payment form
            });

            console.log("✅ OTP API Response:", res.data);

            setOtpSent(true);
            setTimer(30);
            setCanResend(false);

            // Console log for demo
            console.log("📧 OTP sent to:", transferData.email);
            alert(`✅ OTP sent successfully to ${transferData.email}`);
        } catch (err) {
            console.error("❌ OTP generation failed:", err);
            console.error("Error details:", err.response?.data);
            console.error("Error status:", err.response?.status);
            console.error("Transfer data:", transferData);

            const errorMsg = err.response?.data?.error || err.message || "Unknown error";
            const statusCode = err.response?.status || "No status";
            alert(`Failed to send OTP\n\nError: ${errorMsg}\nStatus: ${statusCode}\n\nCheck console for details.`);
        } finally {
            setOtpSending(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);
    };

    const resendOTP = () => {
        setOtp(["", "", "", "", "", ""]);
        setCanResend(false);
        handleGenerateOTP();
    };

    const handlePayment = async () => {
        const otpValue = otp.join("");
        if (otpValue.length !== 6) {
            alert("Please enter complete OTP");
            return;
        }

        if (!agreed) {
            alert("Please agree to terms and conditions");
            return;
        }

        setLoading(true);

        try {
            // Verify OTP first
            await api.post("/otp/verify", {
                userId: transferData.userId,
                otp: otpValue
            });

            let referenceId = `REF-${Date.now()}`;
            let recipientName = transferData.accountHolder;
            let recipientAccount = transferData.recipientAccount;

            // If this is a loan EMI bill, use dedicated loan EMI endpoint
                if (transferData.billType === "loan" && transferData.loanId) {
                    const loanRes = await api.post(`/loans/${transferData.loanId}/pay-emi`);
                    referenceId = loanRes.data?.referenceId || referenceId;
                    recipientName = "Loan EMI Payment";
                    recipientAccount = "Deducted from your account";
                } 
                else {
                // Generic transfer (self / others / card bills)
                const response = await api.post("/transactions/transfer", {
                    fromAccountNumber: transferData.fromAccount,
                    toAccountNumber: transferData.recipientAccount,
                    amount: Number(transferData.amount),
                    pin: transferData.pin,
                    note: transferData.description || "Fund Transfer"
                });

                referenceId = response.data.referenceId || referenceId;
            }

                navigate("/payments/result", {
                    state: {
                        success: true,
                        amount: transferData.amount,
                        recipient: recipientName,
                        recipientAccount,
                        description: transferData.description,
                        referenceId,
                        timestamp: new Date().toISOString()
                    }
                });

        } catch (err) {
            console.error("Payment Error:", err);
            console.error("Error Response:", err.response?.data);
            
            setLoading(false);
            const backendMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Payment failed";

            // For EMI payments, show more specific message
            const displayMessage = transferData.billType === "loan" 
                ? `EMI Payment Failed: ${backendMessage}`
                : backendMessage;

            navigate("/payments/result", {
                state: {
                    success: false,
                    error: displayMessage,
                    amount: transferData.amount,
                    recipient: transferData.billType === "loan" ? "Loan EMI Payment" : transferData.accountHolder
                }
    });

    }
    };

    const isOtpComplete = otp.every(digit => digit !== "");

    return (
        <Layout title="OTP Verification">
            <div className="otp-container">
                <motion.div
                    className="otp-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Security Notice */}
                    <div className="security-notice">
                        <span className="security-notice-icon">🔒</span>
                        <span className="security-notice-text">
                            <strong>Secure Transaction:</strong> Your payment is protected with OTP verification.
                            Never share your OTP with anyone.
                        </span>
                    </div>

                    <h2 className="form-title">Verify Transaction</h2>
                    <p className="form-subtitle">
                        Enter OTP to complete your payment
                    </p>

                    {/* Transaction Summary */}
                    <div className="transaction-summary">
                        <div className="summary-row">
                            <span className="summary-label">Paying To:</span>
                            <span className="summary-value">{transferData.accountHolder || "N/A"}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Account:</span>
                            <span className="summary-value">{transferData.recipientAccount || "N/A"}</span>
                        </div>
                        <div className="summary-amount">
                            ₹{Number(transferData.amount || 0).toLocaleString()}
                        </div>
                        {transferData.description && (
                            <div className="summary-row">
                                <span className="summary-label">Description:</span>
                                <span className="summary-value">{transferData.description}</span>
                            </div>
                        )}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="terms-checkbox">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <label htmlFor="terms" className="terms-text">
                            I agree that the details are correct and authorize this transaction. I understand
                            that this payment is non-reversible once processed.
                        </label>
                    </div>

                    {/* Generate OTP Button */}
                    {!otpSent && (
                        <motion.button
                            className={`btn btn-primary btn-full-width ${otpSending ? "btn-loading" : ""}`}
                            onClick={handleGenerateOTP}
                            disabled={!agreed || otpSending}
                            whileHover={{ scale: agreed ? 1.02 : 1 }}
                            whileTap={{ scale: agreed ? 0.98 : 1 }}
                        >
                            {otpSending ? "Sending OTP..." : "Generate OTP"}
                        </motion.button>
                    )}

                    {/* OTP Input */}
                    <AnimatePresence>
                        {otpSent && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                    style={{
                                        background: "var(--success-bg)",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        marginBottom: "20px",
                                        textAlign: "center",
                                        color: "var(--success-green)",
                                        fontWeight: "600",
                                        fontSize: "14px"
                                    }}
                                >
                                    ✓ OTP sent successfully to your registered email address
                                </motion.div>

                                <div className="otp-input-container" onPaste={handlePaste}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className={`otp-digit-input ${digit ? "filled" : ""}`}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                        />
                                    ))}
                                </div>

                                {/* Timer */}
                                {timer > 0 && (
                                    <div className="otp-timer">
                                        <div className="timer-circle">{timer}</div>
                                        <span>OTP expires in {timer} seconds</span>
                                    </div>
                                )}

                                {/* Resend OTP */}
                                {canResend && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ textAlign: "center", marginTop: "16px" }}
                                    >
                                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                                            Didn't receive OTP?
                                        </p>
                                        <a className="resend-otp-link" onClick={resendOTP}>
                                            Resend OTP
                                        </a>
                                    </motion.div>
                                )}

                                {/* Pay Button */}
                                <motion.button
                                    className={`btn btn-success btn-full-width ${loading ? "btn-loading" : ""}`}
                                    onClick={handlePayment}
                                    disabled={!isOtpComplete || loading}
                                    style={{ marginTop: "24px" }}
                                    whileHover={{ scale: isOtpComplete ? 1.02 : 1 }}
                                    whileTap={{ scale: isOtpComplete ? 0.98 : 1 }}
                                >
                                    {loading ? "Processing..." : "Pay Now"}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        className="btn btn-secondary btn-full-width"
                        onClick={() => navigate("/payments")}
                        style={{ marginTop: "12px" }}
                    >
                        Cancel
                    </button>
                </motion.div>
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        className="loading-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="loading-content">
                            <div className="loading-spinner"></div>
                            <p className="loading-text">Processing Payment...</p>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px" }}>
                                Please do not close this window
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
}
