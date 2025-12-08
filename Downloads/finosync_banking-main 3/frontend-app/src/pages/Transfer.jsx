import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { useSearchParams } from "react-router-dom";

export default function Transfer() {
  const [params] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");

  const [billType, setBillType] = useState("");
  const [billName, setBillName] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetchAcc = async () => {
      const res = await api.get("/accounts");
      setAccounts(res.data.accounts || []);
    };
    fetchAcc().catch(console.error);
  }, []);

  useEffect(() => {
    const amt = params.get("amount");
    const type = params.get("type");
    const name = params.get("name");
    const due = params.get("due");

    if (amt) setAmount(amt);

    if (type === "loan") {
      setBillType("loan");
      setBillName(name);
      setNote("Loan EMI Payment");
      setDueDate(due);
      setToAccount("LOAN-REPAYMENT");
    }

    if (type === "card") {
      setBillType("card");
      setBillName(name);
      setNote("Credit Card Bill Payment");
      setDueDate(due);
      setToAccount("CREDIT-CARD-SETTLEMENT");
    }
  }, [params]);

  const handleTransfer = async () => {
    if (!fromAccount || !toAccount || !amount || !pin)
      return alert("All fields required");

    if (fromAccount === toAccount)
      return alert("Sender and receiver cannot be the same.");

    setLoading(true);

    try {
      await api.post("/transactions/transfer", {
        fromAccountNumber: fromAccount,
        toAccountNumber: toAccount,
        amount: Number(amount),
        pin,
        note,
      });

      setTimeout(() => {
        setDone(true);
        setTimeout(() => setLoading(false), 1200);
      }, 1400);
    } catch (err) {
      alert(err.response?.data?.error || "Transfer failed");
      setLoading(false);
    }
  };

  return (
    <Layout title="Transfer Funds">
      <div className="card">

        {billType && (
          <div className="bill-box">
            <h3>{billName}</h3>
            <p>Amount: ₹{amount}</p>
            <p>Due Date: {new Date(dueDate).toLocaleDateString()}</p>
          </div>
        )}

        <h2>Send Money</h2>

        <label>From Account</label>
        <select
          value={fromAccount}
          onChange={(e) => setFromAccount(e.target.value)}
        >
          <option value="">Select Account</option>
          {accounts.map((a) => (
            <option key={a._id} value={a.accountNumber}>
              {a.type} — ₹{a.balance} — {a.accountNumber}
            </option>
          ))}
        </select>

        <label>Receiver Account</label>
        <input type="text" value={toAccount} readOnly />

        <label>Amount</label>
        <input type="number" value={amount} readOnly />

        <label>Note</label>
        <input type="text" value={note} readOnly />

        <label>Enter PIN</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <button className="btn-primary" onClick={handleTransfer}>
          Pay Now
        </button>
      </div>

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
                <p>Payment Successful!</p>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
