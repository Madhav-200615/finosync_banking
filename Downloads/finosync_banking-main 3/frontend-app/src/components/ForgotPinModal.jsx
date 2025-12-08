import React, { useState, useEffect } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import "../pages/payment.css";

export default function ForgotPinModal({ onClose }) {
    const [step, setStep] = useState(1); // 1: Account + Email, 2: OTP, 3: New PIN, 4: Success
    const [accountNumber, setAccountNumber] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6-digit OTP
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [resetToken, setResetToken] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState("");

    // Timer logic
    useEffect(() => {
        if (step === 2 && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [step, timer]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const payload = { email };
            if (accountNumber) {
                payload.accountNumber = accountNumber;
            } else if (phone) {
                payload.phone = phone;
            } else {
                setError("Please enter either Account Number or Phone");
                setLoading(false);
                return;
            }

            const res = await api.post("/auth/forgot-pin", payload);
            setMaskedEmail(res.data.maskedEmail || email);
            setStep(2);
            setTimer(60);
            setCanResend(false);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) { // Changed from 3 to 5 for 6-digit OTP
            const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");

        const otpValue = otp.join("");
        if (otpValue.length !== 6) { // Changed from 4 to 6
            setError("Please enter complete OTP");
            return;
        }

        setLoading(true);
        try {
            const payload = { email, otp: otpValue };
            if (accountNumber) {
                payload.accountNumber = accountNumber;
            } else if (phone) {
                payload.phone = phone;
            }

            console.log("🔍 Verifying OTP with payload:", payload);
            const res = await api.post("/auth/verify-otp", payload);
            console.log("✅ OTP verified, reset token received:", res.data);
            setResetToken(res.data.resetToken);
            setStep(3);
        } catch (err) {
            console.error("❌ OTP verification failed:", err.response?.data);
            setError(err.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPin = async (e) => {
        e.preventDefault();
        setError("");

        if (!/^\d{4}$/.test(newPin)) {
            setError("PIN must be 4 digits");
            return;
        }
        if (newPin !== confirmPin) {
            setError("PINs do not match");
            return;
        }

        setLoading(true);
        try {
            console.log("🔍 Resetting PIN with token:", resetToken?.substring(0, 20) + "...");
            const response = await api.post("/auth/reset-pin", { resetToken, newPin });
            console.log("✅ PIN reset successful:", response.data);
            setStep(4);
        } catch (err) {
            console.error("❌ PIN reset failed:", err.response?.data);
            setError(err.response?.data?.error || "Failed to reset PIN");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setOtp(["", "", "", "", "", ""]); // Reset to 6 digits
        setCanResend(false);
        setTimer(60);
        try {
            const payload = { email };
            if (accountNumber) {
                payload.accountNumber = accountNumber;
            } else if (phone) {
                payload.phone = phone;
            }
            await api.post("/auth/forgot-pin", payload);
        } catch (err) {
            setError("Failed to resend OTP");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="modal-content forgot-pin-modal"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ maxWidth: "500px", padding: "40px" }}
            >
                <button className="modal-close" onClick={onClose}>×</button>

                {step === 1 && (
                    <motion.form
                        onSubmit={handleSendOtp}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 style={{ marginBottom: "10px", fontSize: "24px", color: "var(--text-primary)" }}>Forgot PIN?</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                            Enter your account details and email to reset your PIN
                        </p>

                        <div className="security-notice" style={{ marginBottom: "20px" }}>
                            <span className="security-notice-icon">🔒</span>
                            <span className="security-notice-text">
                                We'll send an OTP to verify your identity
                            </span>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-primary)" }}>
                                Account Number or Phone
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter account number"
                                value={accountNumber}
                                onChange={(e) => {
                                    setAccountNumber(e.target.value);
                                    setPhone("");
                                }}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    fontSize: "14px"
                                }}
                            />
                            <div style={{ margin: "8px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
                                OR
                            </div>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="Enter phone number"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    setAccountNumber("");
                                }}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    fontSize: "14px"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-primary)" }}>
                                Email (for OTP)
                            </label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    fontSize: "14px"
                                }}
                            />
                        </div>

                        {error && <div className="error-msg" style={{ marginBottom: "16px", color: "var(--error-red)", fontSize: "14px" }}>{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary btn-full-width"
                            disabled={loading}
                        >
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </motion.form>
                )}

                {step === 2 && (
                    <motion.form
                        onSubmit={handleVerifyOtp}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 style={{ marginBottom: "10px", fontSize: "24px", color: "var(--text-primary)" }}>Verify OTP</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                            Enter the 6-digit OTP sent to {maskedEmail}
                        </p>

                        <div className="otp-input-container" style={{ marginBottom: "20px" }}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`forgot-otp-${index}`}
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

                        {timer > 0 && (
                            <div className="otp-timer" style={{ marginBottom: "16px" }}>
                                <div className="timer-circle">{timer}</div>
                                <span>OTP expires in {timer} seconds</span>
                            </div>
                        )}

                        {canResend && (
                            <div style={{ textAlign: "center", marginBottom: "16px" }}>
                                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                                    Didn't receive OTP?
                                </p>
                                <a className="resend-otp-link" onClick={handleResendOtp} style={{ cursor: "pointer" }}>
                                    Resend OTP
                                </a>
                            </div>
                        )}

                        {error && <div className="error-msg" style={{ marginBottom: "16px", color: "var(--error-red)", fontSize: "14px" }}>{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary btn-full-width"
                            disabled={loading || otp.join("").length !== 6} // Changed from 4 to 6
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </motion.form>
                )}

                {step === 3 && (
                    <motion.form
                        onSubmit={handleResetPin}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 style={{ marginBottom: "10px", fontSize: "24px", color: "var(--text-primary)" }}>Reset PIN</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                            Create a new 4-digit PIN
                        </p>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-primary)" }}>
                                New PIN
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter 4-digit PIN"
                                value={newPin}
                                maxLength={4}
                                inputMode="numeric"
                                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                                required
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    fontSize: "14px"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--text-primary)" }}>
                                Confirm New PIN
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Re-enter PIN"
                                value={confirmPin}
                                maxLength={4}
                                inputMode="numeric"
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                                required
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    fontSize: "14px"
                                }}
                            />
                        </div>

                        {error && <div className="error-msg" style={{ marginBottom: "16px", color: "var(--error-red)", fontSize: "14px" }}>{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-success btn-full-width"
                            disabled={loading}
                        >
                            {loading ? "Resetting..." : "Reset PIN"}
                        </button>
                    </motion.form>
                )}

                {step === 4 && (
                    <motion.div
                        className="success-step"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ textAlign: "center" }}
                    >
                        <div className="success-icon" style={{ fontSize: "64px", marginBottom: "20px" }}>✅</div>
                        <h2 style={{ marginBottom: "10px", fontSize: "24px", color: "var(--text-primary)" }}>
                            PIN Reset Successful!
                        </h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
                            You can now login with your new PIN.
                        </p>
                        <button className="btn btn-primary btn-full-width" onClick={onClose}>
                            Go to Login
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
