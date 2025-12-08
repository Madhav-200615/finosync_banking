import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminTopbar.css';

export default function AdminTopbar() {
    const navigate = useNavigate();
    const [adminData, setAdminData] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const data = localStorage.getItem('adminData');
        if (data) {
            setAdminData(JSON.parse(data));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        navigate('/admin/login');
    };

    // Mock notifications
    const notifications = [
        { id: 1, type: 'loan', message: 'New loan application from customer #12345', time: '5 min ago' },
        { id: 2, type: 'card', message: 'Credit card approval pending', time: '15 min ago' },
        { id: 3, type: 'alert', message: 'Suspicious transaction detected', time: '1 hour ago' },
    ];

    const unreadCount = notifications.length;

    return (
        <div className="admin-topbar">
            {/* Left Section - Logo and Search */}
            <div className="admin-topbar-left">
                <div className="admin-topbar-logo">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                    <span className="admin-topbar-brand">FinoSync</span>
                </div>

                <div className="admin-search-bar">
                    <svg className="admin-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search customers, transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Right Section - Notifications and Profile */}
            <div className="admin-topbar-right">
                {/* Notifications */}
                <div className="admin-topbar-notifications">
                    <button
                        className="admin-notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && <span className="admin-notification-badge">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="admin-notification-dropdown">
                            <div className="admin-notification-header">
                                <h3>Notifications</h3>
                                <span className="admin-notification-count">{unreadCount} new</span>
                            </div>
                            <div className="admin-notification-list">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className="admin-notification-item">
                                        <div className={`admin-notif-icon ${notif.type}`}>
                                            {notif.type === 'loan' && '💰'}
                                            {notif.type === 'card' && '💳'}
                                            {notif.type === 'alert' && '⚠️'}
                                        </div>
                                        <div className="admin-notif-content">
                                            <p>{notif.message}</p>
                                            <span>{notif.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="admin-view-all-btn">View All Notifications</button>
                        </div>
                    )}
                </div>

                {/* Admin Profile */}
                <div className="admin-topbar-profile">
                    <button
                        className="admin-profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="admin-profile-avatar">
                            {adminData?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="admin-profile-info">
                            <span className="admin-profile-name">{adminData?.name || 'Admin'}</span>
                            <span className="admin-profile-role">{adminData?.role || 'Administrator'}</span>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>

                    {showProfileMenu && (
                        <div className="admin-profile-dropdown">
                            <div className="admin-profile-dropdown-header">
                                <div className="admin-profile-avatar-large">
                                    {adminData?.name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <h4>{adminData?.name}</h4>
                                    <p>{adminData?.email}</p>
                                </div>
                            </div>
                            <div className="admin-profile-dropdown-menu">
                                <button onClick={() => navigate('/admin/settings')}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 1v6m0 6v6" />
                                    </svg>
                                    Settings
                                </button>
                                <button onClick={() => navigate('/admin/profile')}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    My Profile
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
        </div>
    );
}
