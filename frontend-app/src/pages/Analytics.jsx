import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";  // <-- Real-time updates

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);

  // Fetch analytics from backend
  const loadAnalytics = async () => {
    try {
      const res = await api.get("/analytics/monthly");

      setSummary(res.data.summary);
      setByCategory(res.data.byCategory || []);
    } catch (err) {
      console.error("Analytics load error:", err);
    }
  };

  useEffect(() => {
    loadAnalytics();

    // Real-time WebSocket listener
    connectWS((msg) => {
      if (msg.type === "transaction") {
        console.log("Live update (Analytics):", msg.tx);
        loadAnalytics();   // Recalculate everything
      }
    });
  }, []);

  return (
    <Layout title="Analytics">
      <p className="page-sub">
        Graphical representation of credit vs debit and spending categories.
      </p>

      <div className="grid grid-3">

        {/* CREDIT vs DEBIT */}
        <article className="card">
          <h2>Credit vs Debit</h2>
          {summary ? (
            <>
              <div className="analytics-bar-row">
                <span className="analytics-bar-label">Credit</span>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{ width: `${summary.creditPct}%` }}
                  />
                </div>
                <span>{summary.creditPct}%</span>
              </div>

              <div className="analytics-bar-row">
                <span className="analytics-bar-label">Debit</span>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{
                      width: `${summary.debitPct}%`,
                      background: "#e53935",
                    }}
                  />
                </div>
                <span>{summary.debitPct}%</span>
              </div>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </article>

        {/* CATEGORY-WISE SPENDING */}
        <article className="card">
          <h2>By category</h2>

          {byCategory.length === 0 && <p>No data</p>}

          {byCategory.map((c) => (
            <div key={c.category} className="analytics-bar-row">
              <span className="analytics-bar-label">{c.category}</span>
              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill"
                  style={{ width: `${c.percent}%` }}
                />
              </div>
              <span>₹{c.amount}</span>
            </div>
          ))}
        </article>

        {/* MONTHLY FLOW PLACEHOLDER (Later chart add karenge) */}
        <article className="card">
          <h2>Monthly flow</h2>
          <p className="page-sub">
            Later add a line chart for the project report.
          </p>
        </article>

      </div>
    </Layout>
  );
}
