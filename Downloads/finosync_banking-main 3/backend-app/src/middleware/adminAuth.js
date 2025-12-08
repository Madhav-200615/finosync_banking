const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Verify admin JWT token and attach admin to request
const adminAuth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided. Admin access denied.' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired. Please login again.' });
            }
            return res.status(401).json({ error: 'Invalid token.' });
        }

        // Check if this is an admin token
        if (decoded.type !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        // Get admin from database
        const admin = await Admin.findById(decoded.sub).select('-password');

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found.' });
        }

        if (!admin.isActive) {
            return res.status(403).json({ error: 'Admin account is deactivated.' });
        }

        // Attach admin to request
        req.admin = admin;
        next();

    } catch (error) {
        console.error('Admin auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication failed.' });
    }
};

// Check specific permission
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ error: 'Admin not authenticated.' });
        }

        // Super admin has all permissions
        if (req.admin.role === 'super_admin') {
            return next();
        }

        // Check if admin has the required permission
        if (!req.admin.permissions.includes(permission)) {
            return res.status(403).json({ error: `Permission denied. Required: ${permission}` });
        }

        next();
    };
};

module.exports = { adminAuth, checkPermission };
