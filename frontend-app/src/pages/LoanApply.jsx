import { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function LoanApply() {
  const [form, setForm] = useState({
    loanType: "PERSONAL",
    principalAmount: "",
    tenureMonths: "",
    interestRate: "",
    collateralDetails: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const applyLoan = async () => {
    setLoading(true);
    setMessage("");

    // Validation
    if (!form.principalAmount || !form.tenureMonths || !form.interestRate) {
      setMessage("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const payload = {
        loanType: form.loanType,
        principalAmount: Number(form.principalAmount),
        tenureMonths: Number(form.tenureMonths),
        interestRate: Number(form.interestRate),
        collateralDetails: form.collateralDetails,
      };

      console.log("Applying for loan with:", payload);

      const res = await axios.post(
        `${API_BASE}/api/loans`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("Loan applied successfully!");
      setForm({
        loanType: "PERSONAL",
        principalAmount: "",
        tenureMonths: "",
        interestRate: "",
        collateralDetails: "",
      });
    } catch (err) {
      console.error("Loan application error:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to apply loan";
      setMessage(msg);
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="fd-page-container">
      <div className="fd-form-card">
        <h2>Apply for a Loan</h2>

        <label>Loan Type</label>
        <select
          name="loanType"
          value={form.loanType}
          onChange={handleChange}
          className="fd-input"
        >
          <option value="PERSONAL">Personal Loan</option>
          <option value="HOME">Home Loan</option>
          <option value="CAR">Car Loan</option>
          <option value="EDUCATION">Education Loan</option>
        </select>

        <label>Principal Amount</label>
        <input
          type="number"
          name="principalAmount"
          className="fd-input"
          placeholder="Enter amount"
          value={form.principalAmount}
          onChange={handleChange}
        />

        <label>Tenure (Months)</label>
        <input
          type="number"
          name="tenureMonths"
          className="fd-input"
          placeholder="Enter tenure"
          value={form.tenureMonths}
          onChange={handleChange}
        />

        <label>Interest Rate (%)</label>
        <input
          type="number"
          name="interestRate"
          className="fd-input"
          placeholder="e.g., 14"
          value={form.interestRate}
          onChange={handleChange}
        />

        <label>Collateral Details (optional)</label>
        <input
          type="text"
          name="collateralDetails"
          className="fd-input"
          placeholder="Any collateral info"
          value={form.collateralDetails}
          onChange={handleChange}
        />

        <button className="fd-btn" onClick={applyLoan} disabled={loading}>
          {loading ? "Applying..." : "Apply Loan"}
        </button>

        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
      </div>
    </div>
  );
}
