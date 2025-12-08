import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import './AdminLayout.css';

export default function AdminLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if admin is authenticated
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            navigate('/admin/login');
        }
    }, [navigate]);

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            <div className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <AdminTopbar />

                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
