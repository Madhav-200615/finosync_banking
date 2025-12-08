// Script to create default admin user
// Run this once: node create_admin.js

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./src/models/Admin");

async function createDefaultAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: "admin@finosync.com" });

        if (existingAdmin) {
            console.log("ℹ️  Default admin already exists:");
            console.log("   Email: admin@finosync.com");
            console.log("   You can login with existing credentials");
            process.exit(0);
        }

        // Create default admin
        const defaultAdmin = new Admin({
            email: "admin@finosync.com",
            password: "Admin@123", // Will be hashed automatically by pre-save hook
            name: "Super Admin",
            role: "super_admin",
            permissions: [
                "view_dashboard",
                "manage_loans",
                "manage_cards",
                "manage_fd",
                "view_customers",
                "manage_customers",
                "view_transactions",
                "view_reports",
                "manage_admins",
            ],
            isActive: true,
        });

        await defaultAdmin.save();

        console.log("✅ Default admin created successfully!");
        console.log("\n📋 Login Credentials:");
        console.log("   Email: admin@finosync.com");
        console.log("   Password: Admin@123");
        console.log("\n⚠️  IMPORTANT: Change the password after first login!");

        process.exit(0);

    } catch (error) {
        console.error("❌ Error creating admin:", error);
        process.exit(1);
    }
}

createDefaultAdmin();
