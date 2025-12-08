// Run this: node create_investment_tables_final.js
require("dotenv").config();
const { Pool } = require("pg");

async function createTables() {
    const pool = new Pool({
        host: process.env.PG_HOST || "localhost",
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE || "finosync"
    });

    try {
        console.log("\n========================================");
        console.log("Creating Investment Tables");
        console.log("========================================\n");

        console.log(`Database: ${process.env.PG_DATABASE || "finosync"}`);
        console.log(`User: ${process.env.PG_USER || "postgres"}\n`);

        // Create investments table
        console.log("Creating investments table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_id INTEGER,
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
        console.log("✓ investments table created");

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id)`);
        console.log("✓ investments index created");

        // Create SIP table
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
        console.log("✓ sip_subscriptions table created");

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_sip_user ON sip_subscriptions(user_id)`);
        console.log("✓ sip_subscriptions index created");

        // Verify
        console.log("\nVerifying tables...");
        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('investments', 'sip_subscriptions')
    `);

        console.log(`Found ${result.rows.length} tables:`);
        result.rows.forEach(row => console.log(`  - ${row.table_name}`));

        await pool.end();

        console.log("\n========================================");
        console.log("SUCCESS! Tables Created!");
        console.log("========================================\n");
        console.log("Now restart your backend and test!\n");

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        console.error("\nFull error:", error);
        process.exit(1);
    }
}

createTables();
