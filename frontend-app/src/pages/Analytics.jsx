import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";
import { useTheme } from "../contexts/ThemeContext";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./Analytics.css";

export default function Analytics() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [recent, setRecent] = useState([]);

  const [creditScore, setCreditScore] = useState(null);
  const [loanBills, setLoanBills] = useState([]);
  const [cardBills, setCardBills] = useState([]);

  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const loadAnalytics = async () => {
    try {
      const res = await api.get("/analytics/monthly");
      setSummary(res.data.summary);
      setTrend(res.data.trend || []);
      setByCategory(res.data.byCategory || []);
      setRecent(res.data.recent || []);
    } catch (err) {
      console.error("Analytics Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCreditScore = async () => {
    try {
      const res = await api.get("/credit-score");
      setCreditScore(res.data);
    } catch (err) { }
  };

  const loadLoanBills = async () => {
    try {
      const res = await api.get("/loans/due-bills");
      setLoanBills(res.data || []);
    } catch (err) { }
  };

  const loadCardBills = async () => {
    try {
      const res = await api.get("/cards/due-bills");
      setCardBills(res.data || []);
    } catch (err) { }
  };

  useEffect(() => {
    loadAnalytics();
    loadCreditScore();
    loadLoanBills();
    loadCardBills();

    connectWS((msg) => {
      if (msg.type === "transaction") {
        loadAnalytics();
        loadCreditScore();
        loadLoanBills();
        loadCardBills();
      }
    });
  }, []);

  const formatCurrency = (v) =>
    v?.toLocaleString("en-IN", { style: "currency", currency: "INR" });

  const pieColors = [
    "#22C55E",
    "#3B82F6",
    "#F97316",
    "#EF4444",
    "#A855F7",
    "#14B8A6",
    "#FACC15",
  ];

  const textColor = theme === 'dark' ? '#e4e6eb' : '#1f1f1f';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <Layout title="Analytics">
      <div className="analytics-root">

        <div className="analytics-header">
          <h1 className="analytics-title">Analytics Dashboard</h1>
          {summary && <p className="analytics-month">{summary.month}</p>}
        </div>

        {loading && <div className="loading">Loading...</div>}

        {/* SUMMARY CARDS */}
        {summary && (
          <div className="cards-grid">
            <div className="card card-1">
              <p className="label">Total Credits</p>
              <h2 className="value">{formatCurrency(summary.totalCredit)}</h2>
              <p className="note">{summary.creditCount} credits</p>
            </div>

            <div className="card card-2">
              <p className="label">Total Debits</p>
              <h2 className="value">{formatCurrency(summary.totalDebit)}</h2>
              <p className="note">{summary.debitCount} debits</p>
            </div>

            <div className="card card-3">
              <p className="label">Net Cash Flow</p>
              <h2 className={summary.netFlow >= 0 ? "value positive" : "value negative"}>
                {formatCurrency(summary.netFlow)}
              </h2>
              <p className="note">
                {summary.netFlow >= 0 ? "You saved money 🎉" : "High spending ⚠️"}
              </p>
            </div>

            <div className="card card-4">
              <p className="label">Avg Ticket Size</p>
              <h2 className="value">{formatCurrency(summary.avgTxnAmount)}</h2>
              <p className="note">
                Largest: {formatCurrency(summary.largestTxn)}
              </p>
            </div>

            <div className="card card-5">
              <p className="label">Credit Score</p>
              <h2 className="value">{creditScore?.score || "Loading..."}</h2>
              <p className="note">{creditScore?.rating}</p>
            </div>
          </div>
        )}

        {/* GRAPHS */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">Daily Trend</h3>

            {trend.length === 0 ? (
              <p className="no-data">No transaction history.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trend}>
                  <CartesianGrid stroke={gridColor} />
                  <XAxis dataKey="day" tick={{ fill: textColor }} />
                  <YAxis tick={{ fill: textColor }} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1a1f2e' : '#fff', borderColor: gridColor, color: textColor }} />
                  <Legend wrapperStyle={{ color: textColor }} />
                  <Bar dataKey="credit" fill="#22C55E" />
                  <Bar dataKey="debit" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Spending by Category</h3>

            {byCategory.length === 0 ? (
              <p className="no-data">No category data.</p>
            ) : (
              <div className="pie-wrapper">
                <ResponsiveContainer width="55%" height={260}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="debit"
                      nameKey="category"
                      outerRadius={110}
                      innerRadius={55}
                    >
                      {byCategory.map((entry, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="pie-legend">
                  {byCategory.map((item, i) => (
                    <div key={i} className="legend-row">
                      <span
                        className="legend-dot"
                        style={{ backgroundColor: pieColors[i % pieColors.length] }}
                      ></span>
                      <span>{item.category}</span>
                      <span>{formatCurrency(item.debit)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="table-card">
          <h3 className="chart-title">Recent Transactions</h3>

          {recent.length === 0 ? (
            <p className="no-data">No recent transactions.</p>
          ) : (
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {recent
                  .filter((tx) => {
                    const desc = (tx.description || "").toLowerCase();
                    return (
                      !desc.includes("fd") &&
                      !desc.includes("wallet top up") &&
                      !desc.includes("initial deposit")
                    );
                  })
                  .slice(0, 8)
                  .map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        {new Date(tx.date).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>{tx.description}</td>
                      <td>{tx.category}</td>
                      <td>
                        <span className={tx.type === "CREDIT" ? "pill credit" : "pill debit"}>
                          {tx.type}
                        </span>
                      </td>
                      <td>{formatCurrency(tx.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* LOAN BILLS */}
        <div className="table-card">
          <h3 className="chart-title">Loan Due Bills</h3>

          {loanBills.length === 0 ? (
            <p className="no-data">No pending loan bills.</p>
          ) : (
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Amount</th>
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
                          ? "pill debit" // red style for pending or overdue
                          : "pill credit" // green style for paid/other positive statuses
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
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          )}
        </div>

        {/* CARD BILLS */}
        <div className="table-card">
          <h3 className="chart-title">Credit Card Bills</h3>

          {cardBills.length === 0 ? (
            <p className="no-data">No credit card dues.</p>
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
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
