import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { connectWS } from "../ws";

export default function FD() {
  const [fds, setFds] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Form fields
  const [accountType, setAccountType] = useState("SAVINGS");
  const [amount, setAmount] = useState("");

  const loadFDs = async () => {

    try {
      const res = await api.get("/fd/list");
      setFds(res.data || []);
    } catch (err) {
      console.error("FD LOAD ERROR:", err);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.get("/accounts");
      const accountsList = res.data.accounts || [];

      const arr = accountsList.map((acc) => ({
        type: acc.type,
        name: acc.type === "SAVINGS" ? "Savings Account" : "Wallet",
        balance: acc.balance,
      }));


      setAccounts(arr);
      if (arr.length > 0) {
        setAccountType(arr[0].type);
      }
    } catch (err) {
      console.error("ACCOUNTS LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadFDs();
    loadAccounts();

    connectWS((msg) => {
      if (msg.type === "transaction") {
        loadFDs();
        loadAccounts();
      }
    });
  }, []);

  const createFD = async () => {
    if (!accountType) {
      return alert("Please select an account first");
    }

    if (!amount || Number(amount) < 1000) {
      return alert("Minimum FD amount is ₹1000");
    }

    try {
      console.log("Creating FD with:", { accountType, amount: Number(amount) });
      const res = await api.post("/fd/create", {
        accountType,
        amount: Number(amount),
      });

      alert(res.data.message || "FD created successfully");
      setAmount("");
      loadFDs();
      loadAccounts();
    } catch (err) {
      console.error("FD creation error:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "FD creation failed";
      alert(errorMsg);
    }
  };

  const closeFD = async (id) => {
    try {
      const res = await api.post(`/fd/close/${id}`);
      alert(res.data.message);
      loadFDs();
      loadAccounts();
    } catch (err) {
      alert("Failed to close FD");
    }
  };

  const totalPrincipal = fds.reduce((sum, fd) => sum + fd.amount, 0);

  return (
    <Layout title="Fixed Deposits">
      <div className="grid grid-2">
        {/* FD CREATE FORM */}
        <article className="card">
          <h2>Create New FD</h2>

          <label>Choose Account</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="input"
          >
            {accounts.map((a) => (
              <option key={a.type} value={a.type}>
                {a.name} (₹{a.balance})
              </option>
            ))}
          </select>

          <label style={{ marginTop: "10px" }}>Amount (min 1000)</label>
          <input
            type="number"
            className="input"
            value={amount}
            placeholder="Enter FD amount"
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="summary-row" style={{ marginTop: "10px" }}>
            <span>Tenure</span>
            <span>12 months</span>
          </div>

          <div className="summary-row">
            <span>Interest Rate</span>
            <span>7% per annum</span>
          </div>

          <button
            className="btn-primary"
            onClick={createFD}
            style={{ marginTop: "15px" }}
          >
            Create FD
          </button>
        </article>

        {/* FD LIST */}
        <article className="card">
          <h2>Your Fixed Deposits</h2>

          {fds.length === 0 && <p>No FD created yet.</p>}

          <div className="grid grid-2">
            {fds.map((fd) => (
              <div className="card" key={fd._id}>
                <h3>FD #{fd._id.slice(-6)}</h3>

                <div className="summary-row">
                  <span>Amount</span>
                  <span>₹{fd.amount}</span>
                </div>

                <div className="summary-row">
                  <span>Interest</span>
                  <span>{fd.interestRate * 100}%</span>
                </div>

                <div className="summary-row">
                  <span>Maturity</span>
                  <span>
                    {new Date(fd.maturityDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="summary-row total">
                  <span>Status</span>
                  <span
                    style={{
                      color: fd.status === "active" ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {fd.status.toUpperCase()}
                  </span>
                </div>

                {fd.status === "active" && (
                  <button
                    className="btn-secondary"
                    style={{ marginTop: "10px" }}
                    onClick={() => closeFD(fd._id)}
                  >
                    Close FD
                  </button>
                )}

                {fd.status === "closed" && (
                  <div style={{ marginTop: "10px" }}>
                    <p className="page-sub">
                      Credited: ₹{fd.closingAmount}
                    </p>
                    <p className="page-sub">
                      Interest Earned: ₹{fd.interestEarned}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* FD SUMMARY */}
      <article className="card" style={{ marginTop: "20px" }}>
        <h2>FD Summary</h2>
        <div className="summary-row">
          <span>Total Principal Invested</span>
          <span>₹{totalPrincipal}</span>
        </div>
      </article>
    </Layout>
  );
}
