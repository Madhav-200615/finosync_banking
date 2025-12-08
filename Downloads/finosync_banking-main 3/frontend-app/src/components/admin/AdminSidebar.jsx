import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar({ collapsed, setCollapsed }) {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard', permission: 'view_dashboard' },
        { path: '/admin/loans', icon: '💰', label: 'Loan Management', permission: 'manage_loans' },
        { path: '/admin/cards', icon: '💳', label: 'Credit Card Approvals', permission: 'manage_cards' },
        { path: '/admin/fd', icon: '🏦', label: 'FD Management', permission: 'manage_fd' },
        { path: '/admin/customers', icon: '👥', label: 'Customer Accounts', permission: 'view_customers' },
        { path: '/admin/transactions', icon: '📈', label: 'Transactions', permission: 'view_transactions' },
        { path: '/admin/reports', icon: '📑', label: 'Reports & Analytics', permission: 'view_reports' },
        { path: '/admin/settings', icon: '⚙️', label: 'Admin Settings', permission: 'manage_admins' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        navigate('/admin/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Logo Section */}
            <div className="admin-sidebar-header">
                <div className="admin-sidebar-logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                    {!collapsed && <span className="admin-sidebar-title">FinoSync Admin</span>}
                </div>
                <button
                    className="admin-sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="admin-sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                        title={collapsed ? item.label : ''}
                    >
                        <span className="admin-nav-icon">{item.icon}</span>
                        {!collapsed && <span className="admin-nav-label">{item.label}</span>}
                        {isActive(item.path) && <span className="admin-nav-indicator"></span>}
                    </button>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="admin-sidebar-footer">
                <button className="admin-logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
                    <span className="admin-nav-icon">🚪</span>
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}
