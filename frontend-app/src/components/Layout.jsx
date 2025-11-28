import React from "react";
import { Link } from "react-router-dom";

export default function Layout({ title, children }) {
  return (
    <div className="layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>FastBank</h2>

        <nav className="nav-links">
          <Link to="/dashboard">📊 Overview</Link>
          <Link to="/accounts">🏦 Accounts</Link>
          <Link to="/transactions">💸 Transactions</Link>
          <Link to="/statements">📄 Statements</Link>
          <Link to="/cards">💳 Cards</Link>
          <Link to="/loans">🧾 Loans</Link>
          <Link to="/fd">📦 Fixed Deposits</Link>
          <Link to="/investments">📈 Investments</Link>
          <Link to="/analytics">📊 Analytics</Link>
          <Link to="/search">🔍 Search</Link>
        </nav>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">
        <h1 className="page-title">{title}</h1>
        {children}
      </main>

    </div>
  );
}
