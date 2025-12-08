import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api";
import "./payment.css";

export default function PayBills() {
  const navigate = useNavigate();
  const [loanBills, setLoanBills] = useState([]);
  const [cardBills, setCardBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBills = async () => {
    try {
      const [loanRes, cardRes] = await Promise.all([
        api.get("/loans/due-bills"),
        api.get("/cards/due-bills"),
      ]);
      setLoanBills(loanRes.data || []);
      setCardBills(cardRes.data || []);
    } catch (err) {
      console.error("Failed to load bills", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const formatCurrency = (v) =>
    v?.toLocaleString("en-IN", { style: "currency", currency: "INR" });

  return (
    <Layout title="Pay Bills">
      <div className="payment-form-container">
        <div className="payment-hub-header" style={{ marginBottom: 24 }}>
          <h1 className="payment-hub-title">Pay Bills</h1>
          <p className="payment-hub-subtitle">
            Quickly pay your loan EMIs and credit card bills from a single place.
          </p>
        </div>

        {loading && <div className="loading">Loading bills...</div>}

        {!loading && (
          <div className="payment-options-grid">
            {/* Loan Bills */}
            <div className="table-card" style={{ margin: 0 }}>
              <h3 className="chart-title">Loan EMIs</h3>
              {loanBills.length === 0 ? (
                <p className="no-data">No pending loan EMIs.</p>
              ) : (
                <table className="txn-table">
                  <thead>
                    <tr>
                      <th>Loan</th>
                      <th>EMI Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanBills.map((b) => (
                      <tr key={b.loanId}>
                        <td>{b.type}</td>
                        <td>{formatCurrency(b.amount)}</td>
                        <td>{new Date(b.dueDate).toLocaleDateString()}</td>
                        <td
                          className={
                            b.status === "Pending" || b.status === "Overdue"
                              ? "pill debit"
                              : "pill credit"
                          }
                        >
                          {b.status}
                        </td>
                        <td>
                          <button
                            className="pay-btn"
                            onClick={() =>
                              navigate(
                                `/payments/bill-pay?amount=${b.amount}&type=loan&loanId=${b.loanId}&name=${encodeURIComponent(
                                  b.type
                                )}&due=${b.dueDate}`
                              )
                            }
                          >
                            Pay Loan EMI
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Card Bills */}
            <div className="table-card" style={{ margin: 0 }}>
              <h3 className="chart-title">Credit Card Bills</h3>
              {cardBills.length === 0 ? (
                <p className="no-data">No pending credit card bills.</p>
              ) : (
                <table className="txn-table">
                  <thead>
                    <tr>
                      <th>Card</th>
                      <th>Amount Due</th>
                      <th>Min Due</th>
                      <th>Due Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cardBills.map((c) => (
                      <tr key={c.cardId}>
                        <td>{c.cardName}</td>
                        <td>{formatCurrency(c.amountDue)}</td>
                        <td>{formatCurrency(c.minAmount)}</td>
                        <td>{new Date(c.dueDate).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="pay-btn"
                            onClick={() =>
                              navigate(
                                `/payments/bill-pay?amount=${c.amountDue}&type=card&cardId=${c.cardId}&name=${encodeURIComponent(
                                  c.cardName
                                )}&due=${c.dueDate}`
                              )
                            }
                          >
                            Pay Card Bill
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
