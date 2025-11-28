import React from "react";

export default function Topbar({ title }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
      </div>
      <div className="topbar-right">
        <div className="user-pill">
          <span className="user-avatar">U</span>
          <span className="user-name">User</span>
        </div>
      </div>
    </header>
  );
}
