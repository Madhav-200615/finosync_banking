// frontend-app/src/pages/Investments.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
  fetchMyInvestments,
  fetchMutualFundRecommendations,
  createInvestment,
} from "../api";
import { onInvestmentUpdate, offInvestmentUpdate } from "../ws";
import "./Investments.css";
import SIPSection from "./Investments/SIPSection.jsx";

export default function Investments() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [mfRecs, setMfRecs] = useState([]);
  const [selectedTenure, setSelectedTenure] = useState("3 years");
  const [creating, setCreating] = useState(false);
  const [quickForm, setQuickForm] = useState(null); // for SIP bottom sheet

  // modal state for IPO / NPS / APY / GOLD BOND
  const [activeModal, setActiveModal] = useState(null); // 'ipo' | 'nps' | 'apy' | 'sov-gold' | null
  const [modalAmount, setModalAmount] = useState("");
  const [modalLabel, setModalLabel] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  useEffect(() => {
    loadData();

    const handler = (msg) => {
      if (msg.type === "investment_update") {
        setInvestments((prev) => [msg.investment, ...prev]);
      }
    };

    onInvestmentUpdate(handler);
    return () => offInvestmentUpdate(handler);
  }, []);

  async function loadData() {
    try {
      const [myInv, mf] = await Promise.all([
        fetchMyInvestments(),
        fetchMutualFundRecommendations(),
      ]);
      setInvestments(myInv || []);
      setMfRecs(mf || []);
    } catch (e) {
      console.error("Failed to load investments page data", e);
    }
  }

  const totalInvested = investments.reduce(
    (acc, inv) => acc + Number(inv.amount_invested || 0),
    0
  );
  const currentValue = investments.reduce(
    (acc, inv) => acc + Number(inv.current_value || 0),
    0
  );
  const profit = currentValue - totalInvested;

  async function handleQuickInvest(mf) {
    setCreating(true);
    try {
      await createInvestment({
        accountId: null,
        type: "MUTUAL_FUND",
        productName: mf.name,
        category: mf.category,
        riskLevel: "High",
        amount: 1000,
        cagr3Y: mf.cagr3Y,
      });
      // reload investments list
      await loadData();
    } catch (e) {
      console.error("Quick invest failed", e);
      alert("Failed to invest. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const MF_FILTERS = ["3 years", "5 years", "10 years"];

  function openModal(key, label, title) {
    setActiveModal(key);
    setModalLabel(label);
    setModalTitle(title);
    setModalAmount("");
    setModalError("");
    setModalSuccess("");
  }

  function closeModal() {
    setActiveModal(null);
    setModalAmount("");
    setModalError("");
    setModalSuccess("");
  }

  async function handleModalSubmit(e) {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!modalAmount || Number(modalAmount) <= 0) {
      setModalError("Please enter a valid amount.");
      return;
    }

    let type = "";
    let productName = "";
    let category = "";

    switch (activeModal) {
      case "ipo":
        type = "IPO";
        productName = "IPO Application";
        category = "Primary Market";
        break;
      case "nps":
        type = "NPS";
        productName = "National Pension System";
        category = "Retirement";
        break;
      case "apy":
        type = "APY";
        productName = "Atal Pension Yojana";
        category = "Pension";
        break;
      case "sov-gold":
        type = "SOVEREIGN_GOLD_BOND";
        productName = "Sovereign Gold Bond";
        category = "Gold";
        break;
      default:
        setModalError("Something went wrong.");
        return;
    }

    try {
      await createInvestment({
        accountId: null,
        type,
        productName,
        category,
        riskLevel: "Medium",
        amount: Number(modalAmount),
        cagr3Y: null,
      });

      setModalSuccess("Submitted successfully ✅");
      await loadData();

      setTimeout(() => {
        closeModal();
      }, 800);
    } catch (err) {
      console.error("Modal investment failed", err);
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to submit. Please try again.";
      setModalError(errorMsg);
    }
  }

  function handleQuickActionClick(key) {
    if (key === "your-investments") {
      document
        .getElementById("your-investments-section")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (key === "start-sip") {
      setQuickForm("SIP");
      return;
    }

    // For IPO / NPS / APY / GOLD BOND → open modal
    if (key === "ipo") {
      openModal("ipo", "IPO investment amount (₹)", "Apply for IPO");
    } else if (key === "nps") {
      openModal("nps", "Annual NPS contribution (₹)", "Invest in NPS");
    } else if (key === "apy") {
      openModal("apy", "Monthly APY contribution (₹)", "Join Atal Pension Yojana");
    } else if (key === "sov-gold") {
      openModal("sov-gold", "Gold bond amount (₹)", "Buy Sovereign Gold Bond");
    }
  }

  return (
    <Layout title="Invest">
      <div className="invest-page">
        {/* PAGE HEADER */}
        <header className="invest-header">
          <span className="invest-header-pill" />
          <div>
            <h1>Investments &amp; Wealth</h1>
            <p className="invest-header-sub">Plan, grow and track all your investments in one place.</p>
          </div>
        </header>

        {/* TOP SUMMARY */}
        <section className="invest-summary-section">
          <header className="invest-section-title-row">
            <div className="invest-header-left">
              <span className="invest-section-pill" />
              <h2>Portfolio Overview</h2>
            </div>
          </header>

          <div className="invest-summary-cards">
            <div className="invest-summary-card">
              <span className="label">Total invested</span>
              <span className="value">₹ {totalInvested.toFixed(2)}</span>
            </div>

            <div className="invest-summary-card">
              <span className="label">Current value</span>
              <span className="value">₹ {currentValue.toFixed(2)}</span>
            </div>

            <div className="invest-summary-card">
              <span className={`value ${profit >= 0 ? "green" : "red"}`}>
                ₹ {profit.toFixed(2)}
              </span>
              <span className="label">Profit / Loss</span>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="invest-quick-actions-section">
          <header className="invest-section-title-row">
            <div className="invest-header-left">
              <span className="invest-section-pill" />
              <h2>Quick Actions</h2>
            </div>
          </header>

          <div className="invest-quick-actions-grid">
            <button
              className="invest-quick-action"
              onClick={() => navigate("/fd")}
            >
              <span className="invest-quick-action-icon">FD</span>
              <span className="invest-quick-action-label">Fixed Deposits</span>
            </button>

            <button
              className="invest-quick-action"
              onClick={() => navigate("/transactions")}
            >
              <span className="invest-quick-action-icon">TX</span>
              <span className="invest-quick-action-label">Transactions</span>
            </button>

            <button
              className="invest-quick-action"
              onClick={() => setQuickForm("SIP")}
            >
              <span className="invest-quick-action-icon">SIP</span>
              <span className="invest-quick-action-label">Start SIP</span>
            </button>

            <button
              className="invest-quick-action"
              onClick={() => handleQuickActionClick("ipo")}
            >
              <span className="invest-quick-action-icon">IPO</span>
              <span className="invest-quick-action-label">IPO</span>
            </button>

            <button
              className="invest-quick-action"
              onClick={() => handleQuickActionClick("nps")}
            >
              <span className="invest-quick-action-icon">NPS</span>
              <span className="invest-quick-action-label">NPS</span>
            </button>

            <button
              className="invest-quick-action"
              onClick={() => handleQuickActionClick("apy")}
            >
              <span className="invest-quick-action-icon">APY</span>
              <span className="invest-quick-action-label">Atal Pension Yojana</span>
            </button>

            <button
              className="invest-quick-action"
              onClick={() => handleQuickActionClick("sov-gold")}
            >
              <span className="invest-quick-action-icon">G</span>
              <span className="invest-quick-action-label">Sovereign Gold Bond</span>
            </button>
          </div>
        </section>

        {/* MUTUAL FUNDS SECTION */}
        <section id="mutual-funds-section" className="invest-mutual-section">
          <header className="invest-section-title-row">
            <div className="invest-header-left">
              <span className="invest-section-pill" />
              <h2>Mutual Funds</h2>
            </div>
          </header>

          <div className="invest-chip-row">
            {MF_FILTERS.map((t) => (
              <button
                key={t}
                className={`invest-chip ${selectedTenure === t ? "invest-chip--active" : ""
                  }`}
                onClick={() => setSelectedTenure(t)}
              >
                {t}
              </button>
            ))}

            <button className="invest-chip invest-chip--outline">
              Returns (high to low)
            </button>
            <button className="invest-chip invest-chip--outline">Filter</button>
          </div>

          {/* Mutual Fund List */}
          <div className="invest-mf-list">
            {mfRecs.map((mf) => (
              <article className="invest-mf-card" key={mf.id}>
                <div className="invest-mf-left">
                  <div className="invest-mf-logo">
                    {mf.amcLogo ? mf.amcLogo[0] : "F"}
                  </div>
                  <div>
                    <h4>{mf.name}</h4>
                    <p>{mf.category}</p>
                  </div>
                </div>

                <div className="invest-mf-right">
                  <span className="invest-mf-cagr-label">3Y CAGR</span>
                  <span className="invest-mf-cagr-value">
                    {mf.cagr3Y?.toFixed(2)}%
                  </span>

                  <button
                    className="invest-small-cta"
                    disabled={creating}
                    onClick={() => handleQuickInvest(mf)}
                  >
                    Invest
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* YOUR INVESTMENTS */}
        <section
          id="your-investments-section"
          className="invest-summary-section"
        >
          <header className="invest-section-title-row">
            <div className="invest-header-left">
              <span className="invest-section-pill" />
              <h2>Your investments</h2>
            </div>
          </header>

          <div className="invest-existing-list">
            {investments.map((inv) => (
              <article className="invest-existing-card" key={inv.id}>
                <div>
                  <h4>{inv.product_name}</h4>
                  <p>
                    {inv.type} • {inv.category || "—"}
                  </p>
                </div>

                <div className="invest-existing-right">
                  <span className="small-label">Invested</span>
                  <span className="amount">
                    ₹ {Number(inv.amount_invested).toFixed(2)}
                  </span>
                  <span className="small-label">Current</span>
                  <span className="amount">
                    ₹ {Number(inv.current_value).toFixed(2)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SIP FULL PAGE (CHANGED FROM BOTTOM SHEET) */}
        {quickForm === "SIP" && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#FFF',
            zIndex: 9999,
            overflow: 'auto'
          }}>
            <SIPSection onClose={() => setQuickForm(null)} refreshSips={loadData} />
          </div>
        )}

        {/* MODAL FOR IPO / NPS / APY / GOLD BOND */}
        {activeModal && (
          <div className="invest-modal-backdrop">
            <div className="invest-modal">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h3>{modalTitle}</h3>
                <button
                  className="invest-modal-close"
                  type="button"
                  onClick={closeModal}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleModalSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", marginBottom: 4 }}>
                    {modalLabel}
                  </label>
                  <input
                    className="invest-input"
                    type="number"
                    min="1"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="Enter amount in ₹"
                    required
                  />
                </div>

                {modalError && (
                  <div style={{ color: "red", marginBottom: 8 }}>
                    {modalError}
                  </div>
                )}
                {modalSuccess && (
                  <div style={{ color: "green", marginBottom: 8 }}>
                    {modalSuccess}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={closeModal}
                    style={{ background: "#eee" }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit
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