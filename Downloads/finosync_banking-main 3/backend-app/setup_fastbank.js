require("dotenv").config();
const { Pool } = require("pg");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * COMPLETE DATABASE SETUP FOR FASTBANK
 * This script will:
 * 1. Create PostgreSQL database and tables
 * 2. Create admin account in MongoDB
 * 3. Create a test user account
 * 
 * Run with: node setup_fastbank.js
 */

async function setupPostgres() {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║  PostgreSQL Setup                     ║");
    console.log("╚════════════════════════════════════════╝\n");

    const adminPool = new Pool({
        host: process.env.PG_HOST || "localhost",
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD || "postgres",
        database: "postgres"
    });

    try {
        const dbName = process.env.PG_DATABASE || "fastbank";
        console.log(`📊 Database name: ${dbName}`);

        const checkDb = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (checkDb.rows.length === 0) {
            console.log(`Creating database '${dbName}'...`);
            await adminPool.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database '${dbName}' created`);
        } else {
            console.log(`✅ Database '${dbName}' already exists`);
        }

        await adminPool.end();

        const appPool = new Pool({
            host: process.env.PG_HOST || "localhost",
            port: process.env.PG_PORT || 5432,
            user: process.env.PG_USER || "postgres",
            password: process.env.PG_PASSWORD || "postgres",
            database: dbName
        });

        console.log("\n📋 Creating tables...");

        await appPool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL,
        balance NUMERIC(14,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("  ✓ accounts");

        await appPool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        balance_after NUMERIC(14,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      )
    `);
        console.log("  ✓ transactions");

        await appPool.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
    `);
        console.log("  ✓ indexes");

        await appPool.end();
        console.log("\n✅ PostgreSQL setup complete!");

    } catch (error) {
        console.error("❌ PostgreSQL error:", error.message);
        throw error;
    }
}

async function setupMongoDB() {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║  MongoDB Setup                         ║");
    console.log("╚════════════════════════════════════════╝\n");

    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI not set in .env file");
        }

        await mongoose.connect(uri);
        const dbName = mongoose.connection.db.databaseName;
        console.log(`✅ Connected to MongoDB: ${dbName}`);

        // Import models
        const Admin = require("./src/models/Admin");
        const User = require("./src/models/User");

        // Create admin account
        console.log("\n👤 Creating admin account...");
        const existingAdmin = await Admin.findOne({ email: "admin@finosync.com" });

        if (existingAdmin) {
            console.log("  ℹ️  Admin already exists");
        } else {
            const admin = new Admin({
                email: "admin@finosync.com",
                password: "Admin@123",
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
            await admin.save();
            console.log("  ✅ Admin created");
            console.log("     Email: admin@finosync.com");
            console.log("     Password: Admin@123");
        }

        // Create test user
        console.log("\n👤 Creating test user...");

        const testPhone = "9876543210";
        const existingUser = await User.findOne({ phone: testPhone });

        if (existingUser) {
            console.log("  ℹ️  Test user already exists");
            console.log(`     Account: ${existingUser.accountNumber}`);
            console.log(`     Phone: ${existingUser.phone}`);
        } else {
            const pinHash = await bcrypt.hash("1234", 10);
            const accountNumber = Math.floor(100000 + Math.random() * 900000).toString();

            const user = await User.create({
                name: "Madhav Sharma",
                age: 28,
                address: "123 MG Road, Bangalore, Karnataka 560001",
                phone: testPhone,
                aadhar: "123456789012",
                pan: "ABCDE1234F",
                pinHash: pinHash,
                accountNumber: accountNumber,
            });

            console.log("  ✅ Test user created");
            console.log(`     Name: ${user.name}`);
            console.log(`     Account: ${user.accountNumber}`);
            console.log(`     Phone: ${user.phone}`);
            console.log(`     PIN: 1234`);
        }

        await mongoose.connection.close();
        console.log("\n✅ MongoDB setup complete!");

    } catch (error) {
        console.error("❌ MongoDB error:", error.message);
        throw error;
    }
}

async function main() {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════╗");
    console.log("║  FastBank Complete Database Setup             ║");
    console.log("╚════════════════════════════════════════════════╝");

    try {
        await setupPostgres();
        await setupMongoDB();

        console.log("\n");
        console.log("╔════════════════════════════════════════════════╗");
        console.log("║  ✅ SETUP COMPLETE!                           ║");
        console.log("╚════════════════════════════════════════════════╝");
        console.log("\n📋 Login Credentials:\n");
        console.log("🔐 ADMIN LOGIN:");
        console.log("   Email: admin@finosync.com");
        console.log("   Password: Admin@123\n");
        console.log("🔐 USER LOGIN:");
        console.log("   Account/Phone: 287454 (or check output above)");
        console.log("   PIN: 1234\n");
        console.log("▶️  Run: npm start\n");

    } catch (error) {
        console.error("\n❌ Setup failed:", error.message);
        console.log("\n⚠️  Troubleshooting:");
        console.log("   1. Make sure PostgreSQL is running (port 5432)");
        console.log("   2. Make sure MongoDB is running (port 27017)");
        console.log("   3. Check your .env file has:");
        console.log("      - MONGO_URI=mongodb://localhost:27017/fastbank");
        console.log("      - PG_DATABASE=fastbank (NOT PG_DB)");
        console.log("      - PG_PASSWORD=your_password\n");
        process.exit(1);
    }
}

main();
