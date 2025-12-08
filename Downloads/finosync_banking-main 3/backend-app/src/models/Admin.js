const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    password: {
        type: String,
        required: true,
    },

    name: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        enum: ['super_admin', 'admin', 'viewer'],
        default: 'admin',
    },

    permissions: {
        type: [String],
        default: ['view_dashboard', 'manage_loans', 'manage_cards', 'manage_fd', 'view_customers', 'view_transactions'],
    },

    lastLogin: {
        type: Date,
        default: null,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
AdminSchema.methods.verifyPassword = function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Admin", AdminSchema);
