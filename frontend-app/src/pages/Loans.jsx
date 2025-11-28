import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";

export default function Loans() {
  const [loans, setLoans] = useState([]);

  // Form fields
  const [form, setForm] = useState({
    loanType: "PERSONAL",
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

    // Autofill collateral for specific loan types
    if (name === "loanType") {
      if (value === "GOLD") {
        updatedForm.collateralDetails = "Gold";
      } else if (value === "PROPERTY") {
        updatedForm.collateralDetails = "Property";
      } else {
        updatedForm.collateralDetails = "";
      }
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
        loanType: "PERSONAL",
        principalAmount: "",
        tenureMonths: "",
        collateralDetails: "",
      });
      loadLoans();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to apply loan");
    }
    setLoading(false);
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

  return (
    <Layout title="Loans">
      <div className="grid grid-2">
        {/* LOAN APPLY FORM */}
        <article className="card">
          <h2>Apply for a Loan</h2>

          <label>Loan Type</label>
          <select
            name="loanType"
            value={form.loanType}
            onChange={handleChange}
            className="input"
          >
            <option value="PERSONAL">Personal Loan</option>
            <option value="HOME">Home Loan</option>
            <option value="CAR">Car Loan</option>
            <option value="EDUCATION">Education Loan</option>
            <option value="GOLD">Gold Loan</option>
            <option value="PROPERTY">Property Loan</option>
          </select>

          <label style={{ marginTop: "10px" }}>Principal Amount</label>
          <input
            type="number"
            name="principalAmount"
            className="input"
            placeholder="Enter amount"
            value={form.principalAmount}
            onChange={handleChange}
          />

          <label style={{ marginTop: "10px" }}>Tenure (Months)</label>
          <input
            type="number"
            name="tenureMonths"
            className="input"
            placeholder="Enter tenure"
            value={form.tenureMonths}
            onChange={handleChange}
          />

          <div className="summary-row" style={{ marginTop: "10px" }}>
            <span>Interest Rate</span>
            <span>12% (Fixed)</span>
          </div>

          <label style={{ marginTop: "10px" }}>Collateral Details (optional)</label>
          <input
            type="text"
            name="collateralDetails"
            className="input"
            placeholder="Any collateral info"
            value={form.collateralDetails}
            onChange={handleChange}
            disabled={form.loanType === "GOLD" || form.loanType === "PROPERTY"}
          />

          <button
            className="btn-primary"
            onClick={applyLoan}
            disabled={loading}
            style={{ marginTop: "15px" }}
          >
            {loading ? "Applying..." : "Apply Loan"}
          </button>
        </article>

        {/* LOAN LIST */}
        <article className="card">
          <h2>Your Loans</h2>

          {loans.length === 0 && <p>No active loans.</p>}

          <div className="grid grid-2">
            {loans.map((loan) => (
              <div className="card" key={loan._id}>
                <h3>{loan.loanType} Loan</h3>
                <p className="page-sub" style={{ fontSize: "0.8rem", marginBottom: "10px" }}>
                  #{loan._id.slice(-6)}
                </p>

                <div className="summary-row">
                  <span>Principal</span>
                  <span>₹{loan.principalAmount}</span>
                </div>

                <div className="summary-row">
                  <span>EMI</span>
                  <span>₹{loan.emiAmount}</span>
                </div>

                <div className="summary-row">
                  <span>Rate</span>
                  <span>{loan.interestRate}%</span>
                </div>

                <div className="summary-row">
                  <span>Remaining</span>
                  <span>₹{loan.remainingPrincipal}</span>
                </div>

                <div className="summary-row total">
                  <span>Status</span>
                  <span
                    style={{
                      color: loan.status === "ACTIVE" ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {loan.status}
                  </span>
                </div>

                {loan.status === "ACTIVE" && (
                  <button
                    className="btn-secondary"
                    style={{ marginTop: "10px", width: "100%", backgroundColor: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a" }}
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

      {/* LOAN SUMMARY */}
      <article className="card" style={{ marginTop: "20px" }}>
        <h2>Loan Summary</h2>
        <div className="summary-row">
          <span>Total Principal Borrowed</span>
          <span>₹{totalPrincipal}</span>
        </div>
      </article>
    </Layout>
  );
}
