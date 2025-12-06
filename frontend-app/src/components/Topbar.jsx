import React from "react";
import ThemeToggle from "./ThemeToggle";

export default function Topbar({ title }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
      </div>
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ThemeToggle />

      </div>
    </header>
  );
}
