import React, { useState } from "react";

export default function NPSForm({ onClose, onSubmit }) {
    const [amount, setAmount] = useState("");

    return (
        <div className="invest-modal-backdrop">
            <div className="invest-modal">
                <h2>National Pension Scheme</h2>

                <input
                    className="invest-input"
                    placeholder="NPS Contribution"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                />

                <button className="btn btn-primary" onClick={() => onSubmit(amount)}>
                    Submit
                </button>

                <button className="invest-modal-close" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
