// frontend-app/src/pages/Login.jsx
import React, { useState, useEffect, useRef } from "react";
import "../styles.css";        // global styles (already hai)
import "./login.css";          // naya login specific CSS
import api from "../api";
import ForgotPinModal from "../components/ForgotPinModal";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFace, setShowFace] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);

  const cardRef = useRef(null);

  // PIN keypad handling
  const handleDigit = (d) => {
    if (loading) return;
    if (pin.length < 4) {
      const next = pin + d;
      setPin(next);
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
  };

  const resetError = () => {
    if (error) setError("");
  };

  // MAIN LOGIN: backend se real JWT token
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    resetError();

    if (!accountNumber.trim()) {
      setError("Please enter your account number or phone number.");
      return;
    }

    if (pin.length !== 4) {
      setError("Please enter your 4-digit PIN.");
      return;
    }

    try {
      setLoading(true);

      const body = {
        accountNumber: accountNumber.trim(),
        pin,
      };

      // baseURL: http://localhost:8000/api (api.js se)
      const res = await api.post("/auth/login", body);
      const data = res.data;

      if (!data?.token) {
        throw new Error(data?.error || "Token missing from response");
      }

      // Store token for future requests
      localStorage.setItem("token", data.token);
      if (data.user?.name) {
        localStorage.setItem("userName", data.user.name);
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Login failed. Please try again.";
      setError(msg);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  // 3D tilt effect
  const handleTilt = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * 8;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * -8;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  // Face ID animation only (API hook baad mein add kar sakte hain)
  useEffect(() => {
    if (!showFace) return;
    const t = setTimeout(() => {
      setShowFace(false);
    }, 2500);
    return () => clearTimeout(t);
  }, [showFace]);

  // simple keypad layout
  const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, "←", 0];

  return (
    <div className="login-root">
      {/* Theme Toggle - Top Right */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <ThemeToggle />
      </div>

      {/* LEFT BRAND PANEL */}
      <div className="login-side">
        <div className="logo-badge">FinoSync</div>
        <h1 className="login-heading">Welcome back, banker.</h1>
        <p className="login-tagline">
          Track accounts, FDs, loans & investments from one clean dashboard.
          <br />
          Fast, secure & a little over-engineered. Just how you like it.
        </p>

        <div className="stats-strip">
          <div>
            <span className="label">Real-time</span>
            <p>WebSocket-powered updates</p>
          </div>
          <div>
            <span className="label">Secure</span>
            <p>PIN + account validation</p>
          </div>
          <div>
            <span className="label">Playground</span>
            <p>Perfect for DSA / projects</p>
          </div>
        </div>

        {/* <div className="blur-pill" /> */}
      </div>

      {/* RIGHT LOGIN CARD */}
      <div
        className="login-card-outer"
        ref={cardRef}
        onMouseMove={handleTilt}
        onMouseLeave={resetTilt}
      >
        <div className="login-card-inner">
          <header className="login-header">
            <h2>Sign in to FinoSync</h2>
            <p>Use your virtual account details to continue.</p>
          </header>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="field-row">
              <div className="field">
                <label>Account Number or Phone</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit account or 10-digit phone"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  onFocus={resetError}
                />
                <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Enter either your account number or phone number
                </small>
              </div>
            </div>

            {/* PIN + keypad */}
            <div className="field-row pin-row">
              <div className="field">
                <label>4-digit PIN</label>
                <div className="pin-dots">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`pin-dot ${i < pin.length ? "filled" : ""
                        }`}
                    />
                  ))}
                </div>
              </div>

              <div className="field keypad-field">
                <label>Keypad</label>
                <div className="keypad-grid">
                  {KEYS.map((k) => (
                    <button
                      type="button"
                      key={k}
                      disabled={loading}
                      className="key-btn"
                      onClick={() =>
                        k === "←" ? handleBackspace() : handleDigit(k)
                      }
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="login-footer-row">
              <button
                type="button"
                className="ghost-link"
                onClick={() => setShowForgotPin(true)}
              >
                Forgot PIN?
              </button>

              <button
                type="button"
                className="ghost-link face-link"
                onClick={() => setShowFace(true)}
              >
                <span className="face-icon">◉</span> Use Face ID
              </button>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Signing you in..." : "Sign in"}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-hint">
              New user?{' '}
              <a href="/register" className="create-account-link">
                Create Account
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Face scan overlay (visual only) */}
      {showFace && (
        <div className="face-overlay">
          <div className="face-box">
            <div className="face-scanner" />
            <p>Scanning face… (demo)</p>
          </div>
        </div>
      )}
      {/* Forgot PIN Modal */}
      {showForgotPin && (
        <ForgotPinModal onClose={() => setShowForgotPin(false)} />
      )}
    </div>
  );
}
