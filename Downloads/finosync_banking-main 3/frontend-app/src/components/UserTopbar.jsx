import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './UserTopbar.css';

export default function UserTopbar({ title }) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (user) {
            setUserData(JSON.parse(user));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleMyInfo = () => {
        navigate('/my-info');
        setShowProfileMenu(false);
    };

    return (
        <header className="user-topbar">
            <div className="user-topbar-left">
                <h1>{title}</h1>
            </div>
            <div className="user-topbar-right">
                <ThemeToggle />
                
                {/* User Profile */}
                <div className="user-topbar-profile">
                    <button
                        className="user-profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="user-profile-avatar">
                            {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-profile-info">
                            <span className="user-profile-name">{userData?.name || 'User'}</span>
                            <span className="user-profile-role">Customer</span>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>

                    {showProfileMenu && (
                        <div className="user-profile-dropdown">
                            <div className="user-profile-dropdown-header">
                                <div className="user-profile-avatar-large">
                                    {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h4>{userData?.name || 'User'}</h4>
                                    <p>{userData?.email || 'user@example.com'}</p>
                                </div>
                            </div>
                            <div className="user-profile-dropdown-menu">
                                <button onClick={handleMyInfo}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    My Info
                                </button>
                                <button onClick={handleLogout} className="logout">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
