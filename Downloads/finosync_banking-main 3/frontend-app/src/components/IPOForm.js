import React, { useState } from "react";

export default function IPOForm({ onClose, onSubmit }) {
    const [company, setCompany] = useState("");
    const [amount, setAmount] = useState("");

    return (
        <div className="invest-modal-backdrop">
            <div className="invest-modal">
                <h2>Invest in IPO</h2>

                <input
                    className="invest-input"
                    placeholder="Company Name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                />

                <input
                    className="invest-input"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                />

                <button
                    className="btn btn-primary"
                    onClick={() => onSubmit(company, amount)}
                >
                    Submit
                </button>

                <button className="invest-modal-close" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
