import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";

export default function Cards() {
  const [credit, setCredit] = useState([]);
  const [debit, setDebit] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get("/cards");
      setCredit(res.data.credit || []);
      setDebit(res.data.debit || []);
    };
    fetchData().catch(console.error);
  }, []);

  return (
    <Layout title="Cards">
      <div className="grid grid-2">
        <article className="card">
          <h2>Credit cards</h2>
          {credit.map((c) => {
            const utilization = Math.round((c.used / c.limit) * 100);
            return (
              <div key={c.id} className="mini-card">
                <p>
                  <strong>{c.name}</strong>
                </p>
                <p className="page-sub">Limit: ₹{c.limit}</p>
                <div className="summary-row">
                  <span>Used</span>
                  <span className="amount-negative">-₹{c.used}</span>
                </div>
                <div className="summary-row">
                  <span>Available</span>
                  <span className="amount-positive">₹{c.limit - c.used}</span>
                </div>
                <div className="summary-row">
                  <span>Bill due</span>
                  <span>
                    ₹{c.due} on {c.dueDate}
                  </span>
                </div>
                <div className="analytics-bar-row">
                  <span className="analytics-bar-label">Utilization</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill"
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                  <span style={{ fontSize: 12 }}>{utilization}%</span>
                </div>
              </div>
            );
          })}
        </article>

        <article className="card">
          <h2>Debit cards</h2>
          {debit.map((c) => (
            <div key={c.id} className="mini-card">
              <p>
                <strong>{c.name}</strong>
              </p>
              <p className="page-sub">Linked account: {c.linked}</p>
              <div className="summary-row">
                <span>Daily limit</span>
                <span>₹{c.dailyLimit}</span>
              </div>
            </div>
          ))}
        </article>
      </div>
    </Layout>
  );
}
