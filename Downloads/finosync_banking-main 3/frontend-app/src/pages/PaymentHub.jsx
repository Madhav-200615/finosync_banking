import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import "./payment.css";

export default function PaymentHub() {
    const navigate = useNavigate();

    const paymentOptions = [
        {
            id: "self",
            icon: "💳",
            title: "Self Transfer / Top-Up",
            description: "Quick transfer between your own accounts - Savings, Wallet, or Current",
            route: "/payments/self",
            color: "#0a58ff"
        },
        {
            id: "transfer",
            icon: "📤",
            title: "Transfer to Others",
            description: "Send money to any bank account with real-time verification",
            route: "/payments/transfer",
            color: "#00c853"
        },
        {
            id: "bills",
            icon: "💰",
            title: "Pay Bills",
            description: "Pay loan EMI, credit card bills, and other dues instantly",
            route: "/payments/bills",
            color: "#ffa500"
        }
    ];

    return (
        <Layout title="Payments">
            <div className="payment-hub-container">
                <motion.div
                    className="payment-hub-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="payment-hub-title">Payment Center</h1>
                    <p className="payment-hub-subtitle">
                        Choose your payment method below
                    </p>
                </motion.div>

                <div className="payment-options-grid">
                    {paymentOptions.map((option, index) => (
                        <motion.div
                            key={option.id}
                            className="payment-option-card"
                            onClick={() => navigate(option.route)}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="payment-option-icon">{option.icon}</div>
                            <h3 className="payment-option-title">{option.title}</h3>
                            <p className="payment-option-description">{option.description}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="payment-form-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ marginTop: '40px' }}
                >
                    <div className="form-header">
                        <h2 className="form-title">Quick Tips</h2>
                    </div>
                    <div style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.8' }}>
                        <p>✓ <strong>Secure Payments:</strong> All transactions are protected with PIN and OTP verification</p>
                        <p>✓ <strong>Instant Transfer:</strong> Money reaches the recipient account within seconds</p>
                        <p>✓ <strong>24/7 Support:</strong> Our customer care is available round the clock</p>
                        <p>✓ <strong>Transaction History:</strong> View all your payments in the Analytics section</p>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
}
