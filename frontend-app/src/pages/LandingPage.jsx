import React from "react";
import { Link } from "react-router-dom";
import "./landing.css";
import ThemeToggle from "../components/ThemeToggle";

export default function LandingPage() {
    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-logo">FinoSync Bank</div>
                <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <ThemeToggle />
                    <Link to="/login" className="nav-btn login">
                        Login
                    </Link>
                    <Link to="/register" className="nav-btn signup">
                        Sign Up
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="floating-card card-1"></div>
                <div className="floating-card card-2"></div>

                <div className="hero-content">
                    <h1 className="hero-title">
                        Welcome to <br /> FinoSync Bank
                    </h1>
                    <p className="hero-subtitle">
                        Experience the future of banking with unmatched speed, security, and style.
                        Your financial journey starts here.
                    </p>
                    <Link to="/register" className="hero-cta">
                        Get Started Now
                    </Link>
                </div>
            </header>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">Why Choose Us?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🛡️</div>
                        <h3>Unbreakable Security</h3>
                        <p>
                            State-of-the-art encryption and fraud detection systems keep your money safe 24/7.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Lightning Fast</h3>
                        <p>
                            Instant transfers, real-time updates, and zero lag. Banking at the speed of thought.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💎</div>
                        <h3>Premium Rewards</h3>
                        <p>
                            Unlock exclusive benefits, cashback, and premium cards tailored to your lifestyle.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>&copy; 2025 FinoSync Bank. All rights reserved.</p>
            </footer>
        </div>
    );
}
