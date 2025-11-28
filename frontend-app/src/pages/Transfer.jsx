// frontend-app/src/pages/Transfer.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";

export default function Transfer() {
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetchAcc = async () => {
      const res = await api.get("/accounts");
      setAccounts(res.data.accounts || []);
    };
    fetchAcc().catch(console.error);
  }, []);

  const handleTransfer = async () => {
    if (!fromAccount || !toAccount || !amount || !pin)
      return alert("All fields required");

    if (fromAccount === toAccount)
      return alert("Sender and receiver cannot be same");

    setLoading(true);
    setDone(false);

    try {
      await api.post("/transactions/transfer", {
        fromAccountNumber: fromAccount,
        toAccountNumber: toAccount,
        amount: Number(amount),
        pin,
        note
      });

      setTimeout(() => {
        setDone(true);
        setTimeout(() => {
          setLoading(false);
        }, 1200);
      }, 1400);

    } catch (err) {
      console.log(err);
      alert(err.response?.data?.error || "Transfer failed");
      setLoading(false);
    }
  };

  return (
    <Layout title="Transfer Funds">
      <div className="card">
        <h2>Send Money</h2>

        {/* Sender Account */}
        <label>From Account</label>
        <select
          value={fromAccount}
          onChange={(e) => setFromAccount(e.target.value)}
        >
          <option value="">Select Account</option>
          {accounts.map((a) => (
            <option key={a._id} value={a.accountNumber}>
              {a.type} (₹{a.balance}) — {a.accountNumber}
            </option>
          ))}
        </select>

        {/* Receiver Manual Input */}
        <label>Receiver Account Number</label>
        <input
          type="text"
          placeholder="Enter receiver account no"
          value={toAccount}
          onChange={(e) => setToAccount(e.target.value)}
        />

        {/* Amount */}
        <label>Amount</label>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* Note */}
        <label>Note (optional)</label>
        <input
          type="text"
          placeholder="Lunch payment, rent, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* PIN */}
        <label>Enter PIN</label>
        <input
          type="password"
          placeholder="****"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <br />
        <button className="btn-primary" onClick={handleTransfer}>
          Send Money
        </button>
      </div>

      {/* Animation */}
      {loading && (
        <div className="transfer-overlay">
          <div className="transfer-box">
            {!done ? (
              <>
                <div className="loader-circle"></div>
                <p>Processing...</p>
              </>
            ) : (
              <>
                <div className="success-check">&#10004;</div>
                <p>Transfer Successful!</p>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
