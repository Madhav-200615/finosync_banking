import React from "react";

export default function InvestModal({ visible, onClose, onSubmit, title, children }) {
    if (!visible) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-container">
                <h3>{title}</h3>

                <div>{children}</div>

                <button onClick={onSubmit} className="btn-primary" style={{ marginTop: 10 }}>
                    Submit
                </button>

                <button onClick={onClose} className="btn-secondary" style={{ marginTop: 10 }}>
                    Close
                </button>
            </div>
        </div>
    );
}
