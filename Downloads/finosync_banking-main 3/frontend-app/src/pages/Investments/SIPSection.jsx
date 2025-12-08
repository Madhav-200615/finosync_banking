// frontend-app/src/pages/investments/SIPSection.jsx
import React, { useState } from "react";
import api from "../../api";
import "./sip.css";

export default function SIPSection({ onClose, refreshSips }) {
    const [fund, setFund] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("MONTHLY");
    const [startDate, setStartDate] = useState("");
    const [months, setMonths] = useState(12);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const submitSIP = async () => {
        setErrorMsg("");
        setSuccessMsg("");

        if (!fund.trim()) return setErrorMsg("Enter fund name");
        if (amount < 500) return setErrorMsg("Minimum SIP is ₹500");
        if (!startDate) return setErrorMsg("Select start date");

        try {
            setLoading(true);

            const body = {
                fundName: fund,
                amount: Number(amount),
                frequency,
                startDate,
                sipDay: new Date(startDate).getDate(),
                months: Number(months),
            };

            // 1) Create SIP (existing behaviour)
            const res = await api.post("/sip", body);

            if (res.data.success) {
                // 2) ALSO create an investment row so it appears under "Your investments"
                try {
                    await api.post("/investments", {
                        accountId: null,
                        type: "SIP", // mark this as SIP-origin investment
                        productName: fund,
                        category: "SIP",
                        riskLevel: frequency === "WEEKLY" ? "High" : "Moderate",
                        amount: Number(amount),
                        cagr3Y: null,
                    });
                } catch (invErr) {
                    // Don't break the UI if this fails, just log it
                    console.error("Failed to create SIP investment row", invErr);
                }

                setSuccessMsg("SIP created successfully!");

                // Ask parent to refresh investments/SIPs if it passed a function
                if (typeof refreshSips === "function") {
                    refreshSips();
                }

                setTimeout(onClose, 1200);
            } else {
                setErrorMsg("Failed to create SIP");
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Failed to create SIP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sip-container">
            <h2>Start SIP</h2>
            <p className="sip-sub">Create a systematic investment plan.</p>

            <div className="sip-field">
                <label>Mutual Fund Name</label>
                <input
                    type="text"
                    placeholder="HDFC Silver ETF Fund"
                    value={fund}
                    onChange={(e) => setFund(e.target.value)}
                />
            </div>

            <div className="sip-field">
                <label>Monthly Amount (₹)</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="500"
                />
            </div>

            <div className="sip-field">
                <label>Frequency</label>
                <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                </select>
            </div>

            <div className="sip-field">
                <label>Start Date</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>

            <div className="sip-field">
                <label>Duration (months)</label>
                <input
                    type="number"
                    value={months}
                    min="1"
                    onChange={(e) => setMonths(e.target.value)}
                />
            </div>

            {errorMsg && <div className="sip-error">{errorMsg}</div>}
            {successMsg && <div className="sip-success">{successMsg}</div>}

            <button className="sip-submit" onClick={submitSIP} disabled={loading}>
                {loading ? "Creating..." : "Start SIP"}
            </button>

            <button className="sip-close" onClick={onClose}>
                Close
            </button>
        </div>
    );
}
