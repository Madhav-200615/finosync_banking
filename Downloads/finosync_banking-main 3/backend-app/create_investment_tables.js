require("dotenv").config();
const { Pool } = require("pg");

/**
 * Create Investment Tables Script
 * Run with: node create_investment_tables.js
 */

async function createTables() {
    const pool = new Pool({
        host: process.env.PG_HOST || "localhost",
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD || "postgres",
        database: process.env.PG_DATABASE || "fastbank"
    });

    try {
        console.log("\n╔════════════════════════════════════════╗");
        console.log("║  Creating Investment Tables           ║");
        console.log("╚════════════════════════════════════════╝\n");

        // Create investments table
        console.log("Creating investments table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        risk_level VARCHAR(30),
        amount_invested NUMERIC(14,2) NOT NULL DEFAULT 0,
        current_value NUMERIC(14,2) NOT NULL DEFAULT 0,
        cagr_3y NUMERIC(5,2),
        status VARCHAR(30) DEFAULT 'ACTIVE',
        started_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        console.log("✅ investments table created");

        // Create indexes
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
      CREATE INDEX IF NOT EXISTS idx_investments_account_id ON investments(account_id);
    `);
        console.log("✅ investments indexes created");

        // Create SIP subscriptions table
        console.log("\nCreating sip_subscriptions table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS sip_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        fund_name VARCHAR(255) NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        sip_day INTEGER NOT NULL,
        frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
        start_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        console.log("✅ sip_subscriptions table created");

        // Create index
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sip_user ON sip_subscriptions(user_id);
    `);
        console.log("✅ sip_subscriptions index created");

        await pool.end();

        console.log("\n╔════════════════════════════════════════╗");
        console.log("║  ✅ SUCCESS! Tables created           ║");
        console.log("╚════════════════════════════════════════╝\n");
        console.log("You can now test your investments feature!");
        console.log("Try submitting IPO, NPS, APY, or Gold Bond investments.\n");

    } catch (error) {
        console.error("\n❌ Error creating tables:", error.message);
        console.error("\nMake sure:");
        console.error("1. PostgreSQL is running");
        console.error("2. Database 'fastbank' exists");
        console.error("3. Your .env file has correct PG_DATABASE, PG_PASSWORD, etc.\n");
        process.exit(1);
    }
}

createTables();
