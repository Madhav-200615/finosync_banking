import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import "./cards.css";

export default function Cards() {
  const [credit, setCredit] = useState([]);
  const [debit, setDebit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState({});
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    fetchData();
    fetchAccounts();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/cards");
      setCredit(res.data.credit || []);
      setDebit(res.data.debit || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/accounts");
      console.log("Accounts API response:", res.data); // Debug log
      // The API returns { success: true, accounts: [...] }
      const accountsData = res.data?.accounts || [];
      console.log("Accounts data:", accountsData); // Debug log
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]); // Set empty array on error
    }
  };

  const toggleCardFlip = (cardId) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const toggleCardStatus = async (card) => {
    try {
      await api.put(`/cards/${card._id}/toggle`);
      fetchData();
    } catch (error) {
      console.error("Error toggling card status:", error);
      alert("Failed to toggle card status");
    }
  };

  const openPaymentModal = (card) => {
    setSelectedCard(card);
    setShowPaymentModal(true);
  };

  const handlePayBill = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get("amount"));
    const fromAccount = formData.get("fromAccount");

    try {
      await api.post(`/cards/${selectedCard._id}/pay`, {
        amount,
        fromAccount
      });
      alert("Payment successful!");
      setShowPaymentModal(false);
      fetchData();
      fetchAccounts();
    } catch (error) {
      console.error("Error paying bill:", error);
      alert(error.response?.data?.error || "Payment failed");
    }
  };

  const handleRequestCard = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const cardData = {
      type: formData.get("type"),
      name: formData.get("name"),
      cardholderName: formData.get("cardholderName"),
      brand: formData.get("brand"),
      color: formData.get("color")
    };

    if (cardData.type === "credit") {
      cardData.limit = parseFloat(formData.get("limit"));
    } else {
      cardData.linkedAccount = formData.get("linkedAccount");
    }

    try {
      await api.post("/cards", cardData);
      alert("Card requested successfully!");
      setShowRequestModal(false);
      fetchData();
    } catch (error) {
      console.error("Error requesting card:", error);
      alert(error.response?.data?.error || "Failed to request card");
    }
  };

  const formatCardNumber = (number) => {
    return number.replace(/(\d{4})/g, "$1 ").trim();
  };

  const getCardColorClass = (card) => {
    if (card.type === "credit") {
      return card.color === "gold" ? "credit-gold" :
        card.color === "purple" ? "credit-purple" : "credit-blue";
    } else {
      return card.color === "teal" ? "debit-teal" :
        card.color === "blue" ? "debit-blue" : "debit-green";
    }
  };

  const renderCard = (card) => {
    const isFlipped = flippedCards[card._id];
    const colorClass = getCardColorClass(card);

    return (
      <div key={card._id}>
        <div className={`card-3d-container ${isFlipped ? 'flipped' : ''}`}>
          <div className="card-3d-inner">
            {/* Card Front */}
            <div className={`card-face card-front ${colorClass}`}>
              <div className="card-pattern"></div>
              <div className="card-chip"></div>
              <div className="card-brand">{card.brand}</div>
              <div className="card-number">
                {formatCardNumber(card.cardNumber)}
              </div>
              <div className="card-details">
                <div className="card-holder">
                  <div className="card-label">Card Holder</div>
                  <div className="card-value">{card.cardholderName}</div>
                </div>
                <div className="card-expiry">
                  <div className="card-label">Expires</div>
                  <div className="card-value">{card.expiryMonth}/{card.expiryYear}</div>
                </div>
              </div>
              <button
                className="flip-card-btn"
                onClick={() => toggleCardFlip(card._id)}
              >
                View CVV
              </button>
            </div>

            {/* Card Back */}
            <div className="card-face card-back">
              <div className="card-magnetic-strip"></div>
              <div className="card-cvv-section">
                <span className="card-cvv-label">CVV</span>
                <span className="card-cvv-value">{card.cvv}</span>
              </div>
              <div className="card-back-info">
                <p>This card is property of FinoSync Banking.</p>
                <p>If found, please return to nearest branch.</p>
                <p>24/7 Customer Service: 1800-XXX-XXXX</p>
              </div>
              <button
                className="flip-card-btn"
                onClick={() => toggleCardFlip(card._id)}
              >
                Flip Back
              </button>
            </div>
          </div>
        </div>

        {/* Card Info Section */}
        <div className="card-info-section">
          <div className="card-info-header">
            <h3 className="card-info-title">{card.name}</h3>
            <span className={`card-status-badge ${card.status}`}>
              {card.status}
            </span>
          </div>

          {card.type === "credit" ? (
            <>
              <div className="card-stats">
                <div className="card-stat">
                  <div className="card-stat-label">Credit Limit</div>
                  <div className="card-stat-value">₹{card.limit?.toLocaleString()}</div>
                </div>
                <div className="card-stat">
                  <div className="card-stat-label">Available</div>
                  <div className="card-stat-value positive">₹{card.available?.toLocaleString()}</div>
                </div>
                <div className="card-stat">
                  <div className="card-stat-label">Bill Due</div>
                  <div className="card-stat-value negative">₹{card.due?.toLocaleString()}</div>
                </div>
                <div className="card-stat">
                  <div className="card-stat-label">Due Date</div>
                  <div className="card-stat-value">{card.dueDate}</div>
                </div>
              </div>

              <div className="utilization-bar">
                <div className="utilization-label">
                  <span>Credit Utilization</span>
                  <span><strong>{card.utilization}%</strong></span>
                </div>
                <div className="utilization-track">
                  <div
                    className={`utilization-fill ${card.utilization > 70 ? 'high' : ''}`}
                    style={{ width: `${card.utilization}%` }}
                  ></div>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="card-action-btn primary"
                  onClick={() => openPaymentModal(card)}
                  disabled={card.due === 0}
                >
                  💳 Pay Bill
                </button>
                <button
                  className={`card-action-btn ${card.status === 'active' ? 'danger' : 'success'}`}
                  onClick={() => toggleCardStatus(card)}
                >
                  {card.status === 'active' ? '🔒 Block Card' : '🔓 Unblock Card'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="card-stats">
                <div className="card-stat">
                  <div className="card-stat-label">Linked Account</div>
                  <div className="card-stat-value">{card.linkedAccount}</div>
                </div>
                <div className="card-stat">
                  <div className="card-stat-label">Daily Limit</div>
                  <div className="card-stat-value">₹{card.dailyLimit?.toLocaleString()}</div>
                </div>
              </div>

              <div className="card-actions">
                <button className="card-action-btn secondary">
                  📊 View Transactions
                </button>
                <button
                  className={`card-action-btn ${card.status === 'active' ? 'danger' : 'success'}`}
                  onClick={() => toggleCardStatus(card)}
                >
                  {card.status === 'active' ? '🔒 Block Card' : '🔓 Unblock Card'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout title="Cards">
        <div className="loading-cards">
          <div className="loading-card"></div>
          <div className="loading-card"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Cards">
      <div className="cards-page">
        <div className="cards-header">
          <h1>My Cards</h1>
          <button
            className="request-card-btn"
            onClick={() => setShowRequestModal(true)}
          >
            ➕ Request New Card
          </button>
        </div>

        {/* Credit Cards Section */}
        <div className="cards-section">
          <div className="section-header">
            <span className="section-icon">💳</span>
            <h2 className="section-title">Credit Cards</h2>
            <span className="section-count">{credit.length}</span>
          </div>
          {credit.length > 0 ? (
            <div className="cards-grid">
              {credit.map(renderCard)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <h3 className="empty-title">No Credit Cards</h3>
              <p className="empty-text">
                Request a credit card to enjoy rewards and cashback benefits
              </p>
            </div>
          )}
        </div>

        {/* Section Divider */}
        <div className="section-divider"></div>

        {/* Debit Cards Section */}
        <div className="cards-section">
          <div className="section-header">
            <span className="section-icon">💰</span>
            <h2 className="section-title">Debit Cards</h2>
            <span className="section-count">{debit.length}</span>
          </div>
          {debit.length > 0 ? (
            <div className="cards-grid">
              {debit.map(renderCard)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h3 className="empty-title">No Debit Cards</h3>
              <p className="empty-text">
                Request a debit card linked to your account for easy transactions
              </p>
            </div>
          )}
        </div>

        {/* Request Card Modal */}
        {showRequestModal && (
          <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Request New Card</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowRequestModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleRequestCard}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Card Type</label>
                    <select name="type" className="form-select" required>
                      <option value="">Select Type</option>
                      <option value="credit">Credit Card</option>
                      <option value="debit">Debit Card</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="e.g., Platinum Rewards"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <input
                      type="text"
                      name="cardholderName"
                      className="form-input"
                      placeholder="Name as on card"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Brand</label>
                    <select name="brand" className="form-select" required>
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="RuPay">RuPay</option>
                      <option value="AmEx">American Express</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Color Theme</label>
                    <select name="color" className="form-select" required>
                      <option value="blue">Blue</option>
                      <option value="purple">Purple</option>
                      <option value="gold">Gold</option>
                      <option value="green">Green</option>
                      <option value="teal">Teal</option>
                    </select>
                  </div>

                  <div className="form-group" id="creditLimitGroup">
                    <label className="form-label">Credit Limit (for Credit Cards)</label>
                    <input
                      type="number"
                      name="limit"
                      className="form-input"
                      placeholder="50000"
                    />
                  </div>

                  <div className="form-group" id="linkedAccountGroup">
                    <label className="form-label">Linked Account (for Debit Cards)</label>
                    <select name="linkedAccount" className="form-select">
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.accountNumber} value={acc.accountNumber}>
                          {acc.accountNumber} - {acc.type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={() => setShowRequestModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn primary">
                    Request Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedCard && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Pay Credit Card Bill</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowPaymentModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handlePayBill}>
                <div className="modal-body">
                  <div className="card-stats" style={{ marginBottom: '20px' }}>
                    <div className="card-stat">
                      <div className="card-stat-label">Card</div>
                      <div className="card-stat-value">{selectedCard.name}</div>
                    </div>
                    <div className="card-stat">
                      <div className="card-stat-label">Total Due</div>
                      <div className="card-stat-value negative">₹{selectedCard.due?.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pay From Account</label>
                    <select name="fromAccount" className="form-select" required>
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.accountNumber} value={acc.accountNumber}>
                          {acc.accountNumber} - {acc.type} - ₹{parseFloat(acc.balance).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount to Pay</label>
                    <input
                      type="number"
                      name="amount"
                      className="form-input"
                      placeholder="Enter amount"
                      max={selectedCard.due}
                      required
                    />
                    <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Minimum due: ₹{selectedCard.minDue?.toLocaleString()}
                    </small>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn primary">
                    Pay Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
