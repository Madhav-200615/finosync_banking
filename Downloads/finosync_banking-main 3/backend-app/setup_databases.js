require("dotenv").config();
const { Pool } = require("pg");
const mongoose = require("mongoose");

/**
 * Database Setup Script
 * This script initializes both PostgreSQL and MongoDB databases
 * Run with: node setup_databases.js
 */

async function setupPostgres() {
    console.log("\n=== Setting up PostgreSQL ===");

    // First connect to default 'postgres' database to create our database
    const adminPool = new Pool({
        host: process.env.PG_HOST || "localhost",
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD || "postgres",
        database: "postgres" // Connect to default database first
    });

    try {
        // Check if database exists
        const dbName = process.env.PG_DATABASE || "finosync";
        const checkDb = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (checkDb.rows.length === 0) {
            console.log(`Creating database '${dbName}'...`);
            await adminPool.query(`CREATE DATABASE ${dbName}`);
            console.log(`✓ Database '${dbName}' created`);
        } else {
            console.log(`✓ Database '${dbName}' already exists`);
        }

        await adminPool.end();

        // Now connect to the finosync database to create tables
        const appPool = new Pool({
            host: process.env.PG_HOST || "localhost",
            port: process.env.PG_PORT || 5432,
            user: process.env.PG_USER || "postgres",
            password: process.env.PG_PASSWORD || "postgres",
            database: dbName
        });

        console.log("Creating tables...");

        // Create accounts table
        await appPool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL,
        balance NUMERIC(14,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✓ Table 'accounts' created");

        // Create transactions table
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
        console.log("✓ Table 'transactions' created");

        // Create indexes
        await appPool.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
    `);
        console.log("✓ Indexes created");

        await appPool.end();
        console.log("✓ PostgreSQL setup complete!\n");

    } catch (error) {
        console.error("❌ PostgreSQL setup error:", error.message);
        throw error;
    }
}

async function setupMongoDB() {
    console.log("=== Setting up MongoDB ===");

    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI not set in .env file");
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("✓ Connected to MongoDB");

        // MongoDB will automatically create the database when you insert data
        // Just verify the connection works
        const dbName = mongoose.connection.db.databaseName;
        console.log(`✓ Using database: ${dbName}`);

        // List collections (will be empty initially)
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`✓ Current collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'none (will be created automatically)'}`);

        await mongoose.connection.close();
        console.log("✓ MongoDB setup complete!\n");

    } catch (error) {
        console.error("❌ MongoDB setup error:", error.message);
        throw error;
    }
}

async function main() {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║  FinoSync Database Setup Script       ║");
    console.log("╚════════════════════════════════════════╝\n");

    try {
        await setupPostgres();
        await setupMongoDB();

        console.log("╔════════════════════════════════════════╗");
        console.log("║  ✓ All databases setup successfully!  ║");
        console.log("╚════════════════════════════════════════╝\n");
        console.log("You can now run: npm start\n");

    } catch (error) {
        console.error("\n❌ Setup failed:", error.message);
        console.log("\nPlease check:");
        console.log("1. PostgreSQL is running (default port 5432)");
        console.log("2. MongoDB is running (default port 27017)");
        console.log("3. Your .env file has correct credentials");
        console.log("4. The database user has necessary permissions\n");
        process.exit(1);
    }
}

main();
