import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    "nav-item" + (isActive ? " nav-item-active" : "");

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-circle">FB</div>
        <div className="logo-text">
          <span className="logo-title">FinoSync</span>
          <span className="logo-sub">Real-time Banking</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={linkClass}>
          <span className="nav-icon">🏠</span>
          <span>Overview</span>
        </NavLink>
        <NavLink to="/accounts" className={linkClass}>
          <span className="nav-icon">🏦</span>
          <span>Accounts</span>
        </NavLink>
        <NavLink to="/transactions" className={linkClass}>
          <span className="nav-icon">💳</span>
          <span>Transactions</span>
        </NavLink>
        <NavLink to="/statements" className={linkClass}>
          <span className="nav-icon">📄</span>
          <span>Statements</span>
        </NavLink>
        <NavLink to="/cards" className={linkClass}>
          <span className="nav-icon">💳</span>
          <span>Cards</span>
        </NavLink>
        <NavLink to="/loans" className={linkClass}>
          <span className="nav-icon">📉</span>
          <span>Loans</span>
        </NavLink>
        <NavLink to="/fd" className={linkClass}>
          <span className="nav-icon">📦</span>
          <span>Fixed Deposits</span>
        </NavLink>
        <NavLink to="/investments" className={linkClass}>
          <span className="nav-icon">📈</span>
          <span>Investments</span>
        </NavLink>
        <NavLink to="/analytics" className={linkClass}>
          <span className="nav-icon">📊</span>
          <span>Analytics</span>
        </NavLink>

        <NavLink to="/role-selection" className={linkClass}>
          <span className="nav-icon">👥</span>
          <span>Switch Portal</span>
        </NavLink>

        <button className="nav-item nav-logout" onClick={logout}>
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
