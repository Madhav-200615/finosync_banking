import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api";
import "./payment.css";

export default function BillPayment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState("");
  const [walletAccount, setWalletAccount] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

  const amount = params.get("amount") || "";
  const type = params.get("type") || ""; // loan | card
  const name = params.get("name") || "";
  const loanId = params.get("loanId") || "";
  const cardId = params.get("cardId") || "";

  const description =
    type === "loan"
      ? `Loan EMI Payment - ${name}`
      : type === "card"
      ? `Card Bill Payment - ${name}`
      : name || "Bill Payment";

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await api.get("/accounts");
        const list = res.data.accounts || [];
        setAccounts(list);

        const savings = list.find((a) => a.type === "SAVINGS");
        if (savings) setFromAccount(savings.accountNumber);

        const wallet = list.find((a) => a.type === "WALLET");
        if (wallet) setWalletAccount(wallet.accountNumber);
      } catch (err) {
        console.error("Failed to load accounts for bill payment", err);
      }
    };

    loadAccounts();
  }, []);

  const validate = () => {
    const e = {};
    if (!fromAccount) e.fromAccount = "Select account to pay from";
    if (!customerName) e.customerName = "Enter your name";
    if (!mobile || mobile.length < 10) e.mobile = "Enter valid mobile number";
    if (!amount || Number(amount) <= 0) e.amount = "Invalid amount";
    if (!pin || pin.length < 4) e.pin = "PIN must be at least 4 digits";
    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter valid email";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceed = () => {
    if (!validate()) return;

    setLoading(true);

    // Fallback: if no wallet account, just use fromAccount as recipient for demo
    const recipient = walletAccount || fromAccount;

    navigate("/payments/otp", {
      state: {
        fromAccount,
        recipientAccount: recipient,
        accountHolder: customerName,
        amount,
        description,
        transferMethod: "online",
        pin,
        email,
        billType: type,
        loanId: type === "loan" ? loanId : undefined,
        cardId: type === "card" ? cardId : undefined,
      },
    });
  };

  return (
    <Layout title="Bill Payment">
      <div className="payment-form-container">
        <div className="payment-form-card" style={{ maxWidth: "720px" }}>
          <div className="form-header">
            <h1 className="form-title">Pay {type === "loan" ? "Loan EMI" : type === "card" ? "Credit Card Bill" : "Bill"}</h1>
            <p className="form-subtitle">
              Review your bill details and confirm payment using OTP.
            </p>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Payer Details</h3>

            <div className="input-group">
              <label className="input-label">From Account *</label>
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
              {errors.fromAccount && (
                <p className="input-error-text">{errors.fromAccount}</p>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                className={`input-field ${customerName ? "validated" : ""}`}
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              {errors.customerName && (
                <p className="input-error-text">{errors.customerName}</p>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Mobile Number *</label>
              <input
                type="tel"
                className={`input-field ${mobile.length >= 10 ? "validated" : ""}`}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={10}
              />
              {errors.mobile && <p className="input-error-text">{errors.mobile}</p>}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Bill Details</h3>

            <div className="input-group">
              <label className="input-label">Amount (₹)</label>
              <input
                type="number"
                className="input-field"
                value={amount}
                disabled
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <input
                type="text"
                className="input-field"
                value={description}
                disabled
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Security</h3>

            <div className="input-group">
              <label className="input-label">Confirm PIN *</label>
              <input
                type="password"
                className={`input-field ${pin.length >= 4 ? "validated" : ""}`}
                placeholder="Enter your PIN"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              {errors.pin && <p className="input-error-text">{errors.pin}</p>}
            </div>

            <div className="input-group">
              <label className="input-label">Email for OTP *</label>
              <input
                type="email"
                className={`input-field ${
                  email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "validated" : ""
                }`}
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="input-error-text">{errors.email}</p>}
              <p className="input-helper-text">
                📧 OTP will be sent to this email address for final confirmation.
              </p>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full-width"
            onClick={handleProceed}
            disabled={loading}
          >
            {loading ? "Processing..." : "Proceed to OTP"}
          </button>

          <button
            className="btn btn-secondary btn-full-width"
            onClick={() => navigate("/payments/bills")}
            style={{ marginTop: "12px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  );
}
