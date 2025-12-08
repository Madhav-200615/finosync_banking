import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";
import "./loans.css";

export default function Loans() {
  const [loans, setLoans] = useState([]);

  // Form fields
  const [form, setForm] = useState({
    loanType: "Personal",
    principalAmount: "",
    tenureMonths: "",
    collateralDetails: "",
  });
  const [loading, setLoading] = useState(false);

  const loadLoans = async () => {
    try {
      const res = await api.get("/loans");
      setLoans(res.data.loans || []);
    } catch (err) {
      console.error("LOANS LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadLoans();

    connectWS((msg) => {
      if (msg.type === "loan") {
        loadLoans();
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    if (name === "loanType") {
      updatedForm.collateralDetails = "";
    }

    setForm(updatedForm);
  };

  const applyLoan = async () => {
    if (!form.principalAmount || !form.tenureMonths) {
      return alert("Please fill all required fields");
    }

    setLoading(true);
    try {
      const res = await api.post("/loans", {
        loanType: form.loanType,
        principalAmount: Number(form.principalAmount),
        tenureMonths: Number(form.tenureMonths),
        interestRate: 12, // Fixed interest rate
        collateralDetails: form.collateralDetails,
      });

      alert(res.data.message || "Loan applied successfully");
      setForm({
        loanType: "Personal",
        principalAmount: "",
        tenureMonths: "",
        collateralDetails: "",
      });
      loadLoans();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to apply loan";
      alert(msg);
    }
    setLoading(false);
  };

  const payEmi = async (loanId) => {
    try {
      const res = await api.post(`/loans/${loanId}/pay-emi`);
      alert(res.data.message || "EMI paid successfully");
      loadLoans();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to pay EMI");
    }
  };

  const closeLoan = async (id) => {
    if (!window.confirm("Are you sure you want to close this loan? Penalty may apply.")) return;

    try {
      const res = await api.post(`/loans/${id}/preclose`);
      alert(res.data.message || "Loan closed successfully");
      loadLoans();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to close loan");
    }
  };

  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principalAmount, 0);
  const totalEmi = loans.reduce((sum, loan) => sum + (loan.emiAmount || 0), 0);
  const totalInterest = loans.reduce(
    (sum, loan) => sum + (loan.totalInterestPayable || 0),
    0
  );

  return (
    <Layout title="Loans">
      <div className="loans-page">
        <section className="loans-header">
          <div>
            <h1 className="loans-title">Loans & Borrowings</h1>
            <p className="loans-subtitle">
              Apply for a new loan and track all your active liabilities with clear EMI
              insights.
            </p>
          </div>
          <div className="loans-header-summary">
            <div className="pill">
              <span className="pill-label">Total Active Loans</span>
              <span className="pill-value">{loans.length}</span>
            </div>
            <div className="pill">
              <span className="pill-label">Monthly EMI Outflow</span>
              <span className="pill-value">₹{totalEmi.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <div className="loans-grid">
          {/* LOAN APPLY FORM */}
          <article className="loan-card loan-card-form">
            <h2 className="loan-card-title">Apply for a Loan</h2>

            <label className="loan-label">Loan Type</label>
            <select
              name="loanType"
              value={form.loanType}
              onChange={handleChange}
              className="loan-input"
            >
              <option value="Personal">Personal Loan</option>
              <option value="Home">Home Loan</option>
              <option value="Vehicle">Vehicle Loan</option>
              <option value="Education">Education Loan</option>
              <option value="Business">Business Loan</option>
            </select>

            <label className="loan-label" style={{ marginTop: "10px" }}>
              Principal Amount
            </label>
            <input
              type="number"
              name="principalAmount"
              className="loan-input"
              placeholder="Enter amount"
              value={form.principalAmount}
              onChange={handleChange}
            />

            <label className="loan-label" style={{ marginTop: "10px" }}>
              Tenure (Months)
            </label>
            <input
              type="number"
              name="tenureMonths"
              className="loan-input"
              placeholder="Enter tenure"
              value={form.tenureMonths}
              onChange={handleChange}
            />

            <div className="loan-summary-row" style={{ marginTop: "10px" }}>
              <span>Interest Rate</span>
              <span>12% p.a. (Fixed)</span>
            </div>

            <label className="loan-label" style={{ marginTop: "10px" }}>
              Collateral Details (optional)
            </label>
            <input
              type="text"
              name="collateralDetails"
              className="loan-input"
              placeholder="Any collateral info"
              value={form.collateralDetails}
              onChange={handleChange}
            />

            <button
              className="loan-btn-primary"
              onClick={applyLoan}
              disabled={loading}
              style={{ marginTop: "15px" }}
            >
              {loading ? "Applying..." : "Apply Loan"}
            </button>
          </article>

          {/* LOAN LIST */}
          <article className="loan-card">
            <h2 className="loan-card-title">Your Loans</h2>

            {loans.length === 0 && (
              <p className="loan-empty">
                No loans yet. Apply for a loan to see details here.
              </p>
            )}

            <div className="loan-list-grid">
              {loans.map((loan) => (
                <div className="loan-item-card" key={loan._id}>
                  <h3 className="loan-item-title">{loan.loanType} Loan</h3>
                  <p className="loan-item-sub">#{loan._id.slice(-6)}</p>

                  <div className="loan-summary-row">
                    <span>Principal</span>
                    <span>₹{loan.principalAmount.toLocaleString()}</span>
                  </div>

                  <div className="loan-summary-row">
                    <span>Monthly EMI</span>
                    <span>₹{loan.emiAmount.toLocaleString()}</span>
                  </div>

                  <div className="loan-summary-row">
                    <span>Interest Rate</span>
                    <span>{loan.interestRate}% p.a.</span>
                  </div>

                  <div className="loan-summary-row">
                    <span>Tenure</span>
                    <span>{loan.tenureMonths} months</span>
                  </div>

                  <div className="loan-summary-row">
                    <span>Total Interest Payable</span>
                    <span>₹{loan.totalInterestPayable.toLocaleString()}</span>
                  </div>

                  <div className="loan-summary-row">
                    <span>Total Amount Payable</span>
                    <span>₹{loan.totalPayableAmount.toLocaleString()}</span>
                  </div>

                  <div className="loan-summary-row">
                    <span>Remaining Principal</span>
                    <span>₹{loan.remainingPrincipal.toLocaleString()}</span>
                  </div>

                  <div className="loan-summary-row loan-summary-row-status">
                    <span>Status</span>
                    {loan.status === "PENDING" ? (
                      <span style={{ color: "#b45309", fontWeight: "bold" }}>
                        Waiting for admin approval
                      </span>
                    ) : (
                      <span
                        style={{
                          color: loan.status === "ACTIVE" ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {loan.status}
                      </span>
                    )}
                  </div>

                  {loan.status === "ACTIVE" && (
                    <button
                      className="loan-btn-danger"
                      style={{ marginTop: "10px", width: "100%" }}
                      onClick={() => closeLoan(loan._id)}
                    >
                      Close Loan
                    </button>
                  )}
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      {/* LOAN SUMMARY */}
      <article className="loan-card loan-summary-card">
        <h2 className="loan-card-title">Overall Loan Summary</h2>
        <div className="loan-summary-grid">
          <div className="loan-summary-pill">
            <span className="loan-summary-label">Total Principal Borrowed</span>
            <span className="loan-summary-value">
              ₹{totalPrincipal.toLocaleString()}
            </span>
          </div>
          <div className="loan-summary-pill">
            <span className="loan-summary-label">Total Monthly EMI</span>
            <span className="loan-summary-value">
              ₹{totalEmi.toLocaleString()}
            </span>
          </div>
          <div className="loan-summary-pill">
            <span className="loan-summary-label">Total Interest Payable</span>
            <span className="loan-summary-value">
              ₹{totalInterest.toLocaleString()}
            </span>
          </div>
        </div>
      </article>
    </Layout>
  );
}