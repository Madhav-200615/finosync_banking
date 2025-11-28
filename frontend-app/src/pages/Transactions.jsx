import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws"; // <-- ADD THIS

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("all");
  const [term, setTerm] = useState("");

  // Load all transactions
  const loadTx = async () => {
    try {
      const res = await api.get("/transactions/history");
      setTransactions(res.data.tx || []);
      setFiltered(res.data.tx || []);
    } catch (err) {
      console.error("TX load error:", err);
    }
  };

  useEffect(() => {
    loadTx();

    // Listen to live WebSocket updates
    connectWS((msg) => {
      if (msg.type === "transaction") {
        console.log("Live TX received:", msg.tx);
        loadTx(); // <-- Auto refresh list
      }
    });
  }, []);

  // Apply filters
  useEffect(() => {
    let data = [...transactions];

    if (from) data = data.filter((t) => t.date >= from);
    if (to) data = data.filter((t) => t.date <= to);
    if (type !== "all") data = data.filter((t) => t.type === type);

    if (term) {
      const lower = term.toLowerCase();
      data = data.filter(
        (t) =>
          t.description.toLowerCase().includes(lower) ||
          t.category?.toLowerCase().includes(lower)
      );
    }

    setFiltered(data);
  }, [from, to, type, term, transactions]);

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setType("all");
    setTerm("");
  };

  return (
    <Layout title="Transactions">
      <div className="filter-bar">
        <div>
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>
        <div className="flex-1">
          <label>Search</label>
          <input
            type="text"
            placeholder="UPI, merchant, category"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {/* Table */}
      <table className="table">
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
          {filtered.map((t) => (
            <tr key={t._id || t.id}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{t.category}</td>
              <td>{t.type}</td>
              <td className={t.type === "credit" ? "amount-positive" : "amount-negative"}>
                {t.type === "debit" ? "-" : ""}₹{t.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
