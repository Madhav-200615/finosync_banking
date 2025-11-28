import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";  // <-- ADD THIS

export default function Accounts() {
  const [accounts, setAccounts] = useState(null);
  const [recentTx, setRecentTx] = useState([]);

  // Fetch accounts + recent transactions
  const loadData = async () => {
    try {
      const accRes = await api.get("/accounts");
      setAccounts(accRes.data);

      const txRes = await api.get("/transactions/history?limit=5");
      setRecentTx(txRes.data.tx || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadData();

    // Initialize WebSocket
    connectWS((msg) => {
      if (!msg || !msg.type) return;

      // When a new transaction is created, refresh the UI
      if (msg.type === "transaction") {
        console.log("Live transaction:", msg.tx);
        loadData(); // Reload everything live
      }
    });
  }, []);

  return (
    <Layout title="Accounts">
      <div className="grid grid-2">

        {/* ACCOUNT SUMMARY */}
        <article className="card">
          <h2>Account summary</h2>
          {accounts ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Savings</td>
                  <td>Deposit</td>
                  <td>₹{accounts.savings}</td>
                </tr>
                <tr>
                  <td>Wallet</td>
                  <td>Wallet</td>
                  <td>₹{accounts.wallet}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p>Loading...</p>
          )}
        </article>

        {/* RECENT TRANSACTIONS */}
        <article className="card">
          <h2>Recent transactions</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Desc</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTx?.map((t) => (
                <tr key={t._id || t.id}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td>{t.type}</td>
                  <td className={t.type === "credit" ? "amount-positive" : "amount-negative"}>
                    {t.type === "debit" ? "-" : ""}₹{t.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

      </div>
    </Layout>
  );
}
