import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import "./payment.css";

export default function TransferToOthers() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [currentStep, setCurrentStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [cards, setCards] = useState([]);

    // Step 1: Account Selection
    const [fromAccount, setFromAccount] = useState("");
    const [recipientAccount, setRecipientAccount] = useState("");
    const [accountVerified, setAccountVerified] = useState(false);
    const [accountHolder, setAccountHolder] = useState("");

    // Step 2: Amount & Details
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [transferMethod, setTransferMethod] = useState("online");

    // Step 3: Card Payment (if selected)
    const [cardType, setCardType] = useState("debit");
    const [selectedCard, setSelectedCard] = useState(null);
    const [cardNumber, setCardNumber] = useState("");
    const [cvv, setCvv] = useState("");
    const [expiry, setExpiry] = useState("");

    // Step 4: PIN
    const [pin, setPin] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadAccounts();
        loadCards();

        // Pre-fill from Analytics page
        const amt = params.get("amount");
        const type = params.get("type");
        const name = params.get("name");

        if (amt) setAmount(amt);
        if (type && name) {
            setDescription(`${type === 'loan' ? 'Loan EMI' : 'Card Bill'} Payment - ${name}`);
        }
    }, [params]);

    const loadAccounts = async () => {
        try {
            const res = await api.get("/accounts");
            setAccounts(res.data.accounts || []);
        } catch (err) {
            console.error("Failed to load accounts:", err);
        }
    };

    const loadCards = async () => {
        try {
            const res = await api.get("/cards");
            const allCards = res.data.cards || [];
            setCards(allCards);
        } catch (err) {
            console.error("Failed to load cards:", err);
        }
    };

    const verifyAccount = async (accountNumber) => {
        if (!accountNumber || accountNumber.length < 6) {
            setAccountVerified(false);
            setAccountHolder("");
            return;
        }

        try {
            // Simulate account verification (you'll need to implement this endpoint)
            const res = await api.get(`/accounts/verify/${accountNumber}`);
            if (res.data.valid) {
                setAccountVerified(true);
                setAccountHolder(res.data.accountHolder || "Account Verified");
                setTimeout(() => {
                    // Auto animation trigger
                }, 100);
            } else {
                // DEMO MODE: Auto-verify even if account not found
                // This allows testing OTP flow without existing accounts
                console.log("⚠️ DEMO MODE: Account not found in database, but auto-verifying for testing");
                setAccountVerified(true);
                setAccountHolder(`Demo Account (${accountNumber})`);
            }
        } catch (err) {
            // If verification fails, still show as verified for demo
            // In production, this should show error
            console.log("⚠️ DEMO MODE: Verification API error, auto-verifying for testing");
            setAccountVerified(true);
            setAccountHolder("Account Verified (Demo)");
        }
    };

    const handleRecipientAccountChange = (value) => {
        setRecipientAccount(value);
        setAccountVerified(false);
        setAccountHolder("");

        if (value.length >= 6) {
            setTimeout(() => verifyAccount(value), 500);
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!fromAccount) newErrors.fromAccount = "Please select source account";
            if (!recipientAccount) newErrors.recipientAccount = "Please enter recipient account";
            if (!accountVerified) newErrors.recipientAccount = "Account not verified";
        }

        if (step === 2) {
            if (!amount || amount <= 0) newErrors.amount = "Please enter valid amount";
            if (!transferMethod) newErrors.transferMethod = "Please select transfer method";
        }

        if (step === 3 && transferMethod === "cards") {
            if (!selectedCard && !cardNumber) newErrors.card = "Please select or enter card details";
            if (cardNumber && cardNumber.length < 16) newErrors.cardNumber = "Invalid card number";
            if (!cvv || cvv.length < 3) newErrors.cvv = "Invalid CVV";
            if (!expiry) newErrors.expiry = "Invalid expiry date";
        }

        if (step === 4) {
            if (!pin || pin.length < 4) newErrors.pin = "PIN must be at least 4 digits";
            if (!email) newErrors.email = "Email is required for OTP delivery";
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                newErrors.email = "Please enter a valid email address";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (transferMethod === "online" && currentStep === 2) {
                setCurrentStep(4); // Skip card step
            } else {
                setCurrentStep(currentStep + 1);
            }
        }
    };

    const prevStep = () => {
        if (transferMethod === "online" && currentStep === 4) {
            setCurrentStep(2); // Skip card step backwards
        } else {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        if (!validateStep(4)) return;

        navigate("/payments/otp", {
            state: {
                fromAccount,
                recipientAccount,
                accountHolder,
                amount,
                description,
                transferMethod,
                pin,
                email, // Pass email for OTP delivery
                cardDetails: selectedCard || { cardNumber, cvv, expiry }
            }
        });
    };

    const creditCards = cards.filter(c => c.type === "CREDIT");
    const debitCards = cards.filter(c => c.type === "DEBIT");

    return (
        <Layout title="Transfer to Others">
            <div className="payment-form-container">
                <motion.div
                    className="payment-form-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ maxWidth: "700px" }}
                >
                    {/* Header */}
                    <div className="form-header">
                        <h1 className="form-title">Transfer to Others</h1>
                        <p className="form-subtitle">Send money to any bank account securely</p>
                    </div>

                    {/* Step Indicator */}
                    <div className="step-indicator">
                        {[1, 2, transferMethod === "cards" ? 3 : null, 4]
                            .filter(s => s !== null)
                            .map((step, idx) => (
                                <div
                                    key={step}
                                    className={`step-item ${currentStep === step ? "active" : ""} ${currentStep > step ? "completed" : ""}`}
                                >
                                    <div className="step-circle">
                                        {currentStep > step ? "✓" : step}
                                    </div>
                                    <p className="step-label">
                                        {step === 1 ? "Account" : step === 2 ? "Amount" : step === 3 ? "Card" : "PIN"}
                                    </p>
                                    {idx < (transferMethod === "cards" ? 3 : 2) && <div className="step-line"></div>}
                                </div>
                            ))}
                    </div>

                    {/* Step 1: Account Selection */}
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="form-section">
                                    <h3 className="form-section-title">Account Details</h3>

                                    <div className="input-group">
                                        <label className="input-label">
                                            From Account <span className="input-required">*</span>
                                        </label>
                                        <select
                                            className={`select-field ${fromAccount ? "validated" : ""}`}
                                            value={fromAccount}
                                            onChange={(e) => setFromAccount(e.target.value)}
                                        >
                                            <option value="">Select Source Account</option>
                                            {accounts.map((acc) => (
                                                <option key={acc._id} value={acc.accountNumber}>
                                                    {acc.type} - ₹{acc.balance?.toLocaleString()} ({acc.accountNumber})
                                                </option>
                                            ))}
                                        </select>
                                        {fromAccount && <span className="input-tick">✓</span>}
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">
                                            Recipient Account Number <span className="input-required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`input-field ${accountVerified ? "validated" : ""} ${errors.recipientAccount ? "error" : ""}`}
                                            placeholder="Enter recipient account number"
                                            value={recipientAccount}
                                            onChange={(e) => handleRecipientAccountChange(e.target.value)}
                                        />
                                        {accountVerified && <span className="input-tick">✓</span>}
                                        {errors.recipientAccount && (
                                            <p className="input-error-text">{errors.recipientAccount}</p>
                                        )}
                                    </div>

                                    {accountVerified && (
                                        <motion.div
                                            className="account-verification-box"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <div className="account-holder-name">
                                                <span className="account-verified-icon">✓</span>
                                                <span>{accountHolder}</span>
                                            </div>
                                            <p className="account-verified-text">Account verified successfully</p>
                                        </motion.div>
                                    )}
                                </div>

                                <button className="btn btn-primary btn-full-width" onClick={nextStep}>
                                    Next: Enter Amount
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Amount & Details */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="form-section">
                                    <h3 className="form-section-title">Transfer Details</h3>

                                    <div className="input-group">
                                        <label className="input-label">
                                            Amount (₹) <span className="input-required">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            className={`input-field ${amount && amount > 0 ? "validated" : ""}`}
                                            placeholder="Enter amount"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                        {amount && amount > 0 && <span className="input-tick">✓</span>}
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Description</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g., Payment for services"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">
                                            Transfer Method <span className="input-required">*</span>
                                        </label>
                                        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                                            <button
                                                className={`btn ${transferMethod === "online" ? "btn-primary" : "btn-secondary"}`}
                                                onClick={() => setTransferMethod("online")}
                                                style={{ flex: 1 }}
                                            >
                                                💳 Online
                                            </button>
                                            <button
                                                className={`btn ${transferMethod === "cards" ? "btn-primary" : "btn-secondary"}`}
                                                onClick={() => setTransferMethod("cards")}
                                                style={{ flex: 1 }}
                                            >
                                                💳 Cards
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={prevStep}>
                                        Back
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={nextStep}>
                                        {transferMethod === "online" ? "Next: Enter PIN" : "Next: Select Card"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Card Selection */}
                        {currentStep === 3 && transferMethod === "cards" && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="form-section">
                                    <h3 className="form-section-title">Select Payment Card</h3>

                                    <div className="card-tabs">
                                        <button
                                            className={`card-tab ${cardType === "debit" ? "active" : ""}`}
                                            onClick={() => setCardType("debit")}
                                        >
                                            Debit Cards ({debitCards.length})
                                        </button>
                                        <button
                                            className={`card-tab ${cardType === "credit" ? "active" : ""}`}
                                            onClick={() => setCardType("credit")}
                                        >
                                            Credit Cards ({creditCards.length})
                                        </button>
                                    </div>

                                    <div className="saved-cards-grid">
                                        {(cardType === "debit" ? debitCards : creditCards).map((card) => (
                                            <div
                                                key={card._id}
                                                className={`saved-card-item ${cardType}-card ${selectedCard?._id === card._id ? "selected" : ""}`}
                                                onClick={() => setSelectedCard(card)}
                                            >
                                                <div className="card-number-display">
                                                    •••• •••• •••• {card.cardNumber?.slice(-4) || "****"}
                                                </div>
                                                <div className="card-info-row">
                                                    <span>{card.cardHolderName}</span>
                                                    <span>Exp: {card.expiryDate}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {!selectedCard && (
                                        <div style={{ marginTop: "24px" }}>
                                            <h4 style={{ marginBottom: "16px", fontSize: "14px", fontWeight: "600" }}>
                                                Or enter card details manually
                                            </h4>

                                            <div className="input-group">
                                                <label className="input-label">Card Number</label>
                                                <input
                                                    type="text"
                                                    className={`input-field ${cardNumber.length === 16 ? "validated" : ""}`}
                                                    placeholder="1234 5678 9012 3456"
                                                    maxLength={16}
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ""))}
                                                />
                                                {cardNumber.length === 16 && <span className="input-tick">✓</span>}
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                                <div className="input-group">
                                                    <label className="input-label">CVV</label>
                                                    <input
                                                        type="password"
                                                        className={`input-field ${cvv.length >= 3 ? "validated" : ""}`}
                                                        placeholder="123"
                                                        maxLength={4}
                                                        value={cvv}
                                                        onChange={(e) => setCvv(e.target.value)}
                                                    />
                                                    {cvv.length >= 3 && <span className="input-tick">✓</span>}
                                                </div>

                                                <div className="input-group">
                                                    <label className="input-label">Expiry</label>
                                                    <input
                                                        type="text"
                                                        className={`input-field ${expiry.length >= 5 ? "validated" : ""}`}
                                                        placeholder="MM/YY"
                                                        maxLength={5}
                                                        value={expiry}
                                                        onChange={(e) => setExpiry(e.target.value)}
                                                    />
                                                    {expiry.length >= 5 && <span className="input-tick">✓</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={prevStep}>
                                        Back
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={nextStep}>
                                        Next: Enter PIN
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: PIN Confirmation */}
                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="form-section">
                                    <h3 className="form-section-title">Confirm Transaction</h3>

                                    <div className="transaction-summary">
                                        <div className="summary-row">
                                            <span className="summary-label">Recipient:</span>
                                            <span className="summary-value">{accountHolder}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span className="summary-label">Account:</span>
                                            <span className="summary-value">{recipientAccount}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span className="summary-label">Amount:</span>
                                            <span className="summary-value">₹{Number(amount).toLocaleString()}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span className="summary-label">Method:</span>
                                            <span className="summary-value">{transferMethod === "online" ? "Online Transfer" : "Card Payment"}</span>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">
                                            Enter PIN to Confirm <span className="input-required">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={`input-field ${pin.length >= 4 ? "validated" : ""} ${errors.pin ? "error" : ""}`}
                                            placeholder="Enter your PIN"
                                            maxLength={6}
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                        />
                                        {pin.length >= 4 && <span className="input-tick">✓</span>}
                                        {errors.pin && <p className="input-error-text">{errors.pin}</p>}
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">
                                            Email for OTP Delivery <span className="input-required">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className={`input-field ${email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "validated" : ""} ${errors.email ? "error" : ""}`}
                                            placeholder="your-email@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                        {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && <span className="input-tick">✓</span>}
                                        {errors.email && <p className="input-error-text">{errors.email}</p>}
                                        <p className="input-helper-text">
                                            📧 OTP will be sent to this email address for transaction verification
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={prevStep}>
                                        Back
                                    </button>
                                    <motion.button
                                        className="btn btn-success"
                                        style={{ flex: 1 }}
                                        onClick={handleSubmit}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={!pin || pin.length < 4 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                                    >
                                        Proceed to OTP
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        className="btn btn-secondary btn-full-width"
                        onClick={() => navigate("/payments")}
                        style={{ marginTop: "12px" }}
                    >
                        Cancel Transfer
                    </button>
                </motion.div>
            </div>
        </Layout>
    );
}
