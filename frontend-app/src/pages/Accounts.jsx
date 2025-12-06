import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";  // <-- ADD THIS

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [recentTx, setRecentTx] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch accounts + recent transactions
  const loadData = async () => {
    try {
      const accRes = await api.get("/accounts");
      setAccounts(accRes.data.accounts || []);

      const txRes = await api.get("/transactions/history?limit=5");
      setRecentTx(txRes.data.tx || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadData();
    connectWS((msg) => {
      if (msg?.type === "transaction") {
        loadData();
      }
    });
  }, []);

  const handleCreateCurrent = async (e) => {
    e.preventDefault();
    if (!businessName || !gstNo) {
      alert("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      await api.post("/accounts/create-current", {
        businessName,
        gstNo
      });
      alert("Current Account created successfully!");
      setShowModal(false);
      setBusinessName("");
      setGstNo("");
      loadData(); // Refresh list
    } catch (err) {
      console.error("Create Account Error:", err);
      alert(err.response?.data?.message || "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout title="Accounts">
      <div className="grid grid-2">

        {/* ACCOUNT SUMMARY */}
        <article className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>Account summary</h2>
            <button
              className="btn-primary"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              onClick={() => setShowModal(true)}
            >
              + Open Current Account
            </button>
          </div>

          {accounts.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc._id || acc.accountNumber}>
                    <td>
                      {acc.type.charAt(0).toUpperCase() + acc.type.slice(1).toLowerCase()}
                      {acc.businessName && <div style={{ fontSize: "10px", color: "#666" }}>{acc.businessName}</div>}
                    </td>
                    <td>{acc.type === "WALLET" ? "Wallet" : (acc.type === "CURRENT" ? "Business" : "Deposit")}</td>
                    <td style={{ fontWeight: "bold" }}>₹{acc.balance.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Loading accounts...</p>
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
              {recentTx
                ?.filter(t => {
                  const text = (t.description || t.note || "").toLowerCase();
                  return text.includes("top up") || text.includes("initial") || text.includes("deposit") || text.includes("fd");
                })
                .map((t) => (
                  <tr key={t._id || t.id}>
                    <td>{new Date(t.createdAt || t.date).toLocaleDateString("en-IN")}</td>
                    <td>{t.description || t.note}</td>
                    <td>{t.type}</td>
                    <td className={t.type?.trim().toUpperCase() === "CREDIT" ? "amount-positive" : "amount-negative"}>
                      {t.type?.trim().toUpperCase() === "DEBIT" ? "-" : "+"}₹{t.amount}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </article>

      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white", padding: "2rem", borderRadius: "12px",
            width: "90%", maxWidth: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}>
            <h3>Open Current Account</h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "1rem" }}>
              Enter your business details to open a new Current Account.
            </p>

            <form onSubmit={handleCreateCurrent}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Tech Solutions Ltd"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px" }}>GST Number</label>
                <input
                  type="text"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
