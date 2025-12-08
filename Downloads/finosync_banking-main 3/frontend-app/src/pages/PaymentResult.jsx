import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./payment.css";

export default function PaymentResult() {
    const navigate = useNavigate();
    const location = useLocation();
    const result = location.state || {};

    const {
        success = false,
        amount = 0,
        recipient = "Unknown",
        recipientAccount = "",
        description = "",
        referenceId = "",
        timestamp = new Date().toISOString(),
        error = ""
    } = result;

    useEffect(() => {
        // Auto-redirect after 10 seconds for success
        if (success) {
            const timer = setTimeout(() => {
                navigate("/dashboard");
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    const handleDone = () => {
        navigate("/dashboard");
    };

    const handleTryAgain = () => {
        navigate("/payments");
    };

    const handleViewTransactions = () => {
        navigate("/transactions");
    };

    const handleSaveReceipt = async () => {
        const input = document.querySelector(".payment-result-card");
        if (!input) return;

        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                backgroundColor: "#ffffff",
                logging: false,
                useCORS: true
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Center the image vertically if it's smaller than page height
            const pageHeight = 297; // A4 height in mm
            let yPos = 0;
            if (imgHeight < pageHeight) {
                yPos = (pageHeight - imgHeight) / 2;
            }

            pdf.addImage(imgData, "PNG", 0, yPos, imgWidth, imgHeight);
            pdf.save(`FinoSync_Receipt_${referenceId || Date.now()}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate receipt PDF");
        }
    };

    return (
        <Layout title={success ? "Payment Successful" : "Payment Failed"}>
            <div className="payment-result-container">
                <motion.div
                    className="payment-result-card"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                >
                    {success ? (
                        <>
                            {/* Success Animation */}
                            <motion.div
                                className="success-animation"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                    delay: 0.2
                                }}
                            >
                                <div className="success-circle">
                                    <motion.span
                                        className="success-checkmark"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            delay: 0.4
                                        }}
                                    >
                                        ✓
                                    </motion.span>
                                </div>
                            </motion.div>

                            <motion.h2
                                className="result-title success"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                Payment Successful!
                            </motion.h2>

                            <motion.p
                                className="result-message"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                {recipientAccount === "Deducted from your account" 
                                    ? (
                                        <>
                                            ₹{Number(amount).toLocaleString()} has been deducted from your account for <strong>{recipient}</strong>
                                        </>
                                    )
                                    : (
                                        <>
                                            Your payment to <strong>{recipient}</strong> was successful
                                        </>
                                    )
                                }
                            </motion.p>

                            {/* Transaction Details */}
                            <motion.div
                                className="result-details"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <div className="result-detail-row">
                                    <span className="detail-label">Amount Paid</span>
                                    <span className="detail-value" style={{ fontSize: "18px", color: "var(--success-green)" }}>
                                        ₹{Number(amount).toLocaleString()}
                                    </span>
                                </div>

                                <div className="result-detail-row">
                                    <span className="detail-label">{recipientAccount === "Deducted from your account" ? "Payment Type" : "Paid To"}</span>
                                    <span className="detail-value">{recipient}</span>
                                </div>

                                {recipientAccount && (
                                    <div className="result-detail-row">
                                        <span className="detail-label">Account Number</span>
                                        <span className="detail-value">{recipientAccount}</span>
                                    </div>
                                )}

                                {description && (
                                    <div className="result-detail-row">
                                        <span className="detail-label">Description</span>
                                        <span className="detail-value">{description}</span>
                                    </div>
                                )}

                                <div className="result-detail-row">
                                    <span className="detail-label">Reference ID</span>
                                    <span className="detail-value reference-number">
                                        {referenceId || `REF-${Date.now()}`}
                                    </span>
                                </div>

                                <div className="result-detail-row">
                                    <span className="detail-label">Date & Time</span>
                                    <span className="detail-value">{formatDate(timestamp)}</span>
                                </div>

                                <div className="result-detail-row">
                                    <span className="detail-label">Status</span>
                                    <span className="detail-value" style={{ color: "var(--success-green)", fontWeight: "700" }}>
                                        COMPLETED
                                    </span>
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                className="result-actions"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                            >
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={handleDone}
                                >
                                    Done
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={handleViewTransactions}
                                >
                                    View Transactions
                                </button>
                            </motion.div>

                            <motion.button
                                className="btn btn-secondary btn-full-width"
                                onClick={handleSaveReceipt}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 }}
                                style={{ marginTop: "12px" }}
                            >
                                📥 Save Receipt (PDF)
                            </motion.button>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                style={{
                                    fontSize: "12px",
                                    color: "var(--text-light)",
                                    marginTop: "16px",
                                    textAlign: "center"
                                }}
                            >
                                Redirecting to dashboard in 10 seconds...
                            </motion.p>
                        </>
                    ) : (
                        <>
                            {/* Failure Animation */}
                            <motion.div
                                className="failure-animation"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                    delay: 0.2
                                }}
                            >
                                <div className="failure-circle">
                                    <motion.span
                                        className="failure-cross"
                                        initial={{ scale: 0, rotate: 180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            delay: 0.4
                                        }}
                                    >
                                        ✕
                                    </motion.span>
                                </div>
                            </motion.div>

                            <motion.h2
                                className="result-title failure"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                Payment Failed
                            </motion.h2>

                            <motion.p
                                className="result-message"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                {recipient === "Loan EMI Payment" 
                                    ? `We couldn't process your ${recipient}`
                                    : `We couldn't process your payment to ${recipient}`
                                }
                            </motion.p>

                            {/* Error Details */}
                            <motion.div
                                className="result-details"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <div className="result-detail-row">
                                    <span className="detail-label">Attempted Amount</span>
                                    <span className="detail-value">₹{Number(amount).toLocaleString()}</span>
                                </div>

                                <div className="result-detail-row">
                                    <span className="detail-label">Recipient</span>
                                    <span className="detail-value">{recipient}</span>
                                </div>

                                <div className="result-detail-row">
                                    <span className="detail-label">Reason</span>
                                    <span className="detail-value" style={{ color: "var(--error-red)" }}>
                                        {error || "Transaction declined. Please try again or contact support."}
                                    </span>
                                </div>

                                <div className="result-detail-row">
                                    <span className="detail-label">Date & Time</span>
                                    <span className="detail-value">{formatDate(timestamp)}</span>
                                </div>

                                <div className="result-detail-row">
                                    <span className="detail-label">Status</span>
                                    <span className="detail-value" style={{ color: "var(--error-red)", fontWeight: "700" }}>
                                        FAILED
                                    </span>
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                className="result-actions"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                            >
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={handleTryAgain}
                                >
                                    Try Again
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={handleDone}
                                >
                                    Cancel
                                </button>
                            </motion.div>

                            <motion.button
                                className="btn btn-secondary btn-full-width"
                                onClick={() => alert("Contact support: support@finosync.com")}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 }}
                                style={{ marginTop: "12px" }}
                            >
                                📞 Contact Support
                            </motion.button>
                        </>
                    )}
                </motion.div>
            </div>
        </Layout>
    );
}
