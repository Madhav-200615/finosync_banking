require("dotenv").config();
const { Pool } = require("pg");

// SIMPLE table creation - no MongoDB connection to avoid hanging
async function createInvestmentTables() {
    const pool = new Pool({
        host: process.env.PG_HOST || "localhost",
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD || "postgres",
        database: process.env.PG_DATABASE || "fastbank"
    });

    try {
        console.log("Creating investment tables...\n");

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
      );
    `);
        console.log("✅ investments table created");

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);`);

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
      );
    `);
        console.log("✅ sip_subscriptions table created\n");

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_sip_user ON sip_subscriptions(user_id);`);

        await pool.end();
        console.log("SUCCESS! Tables ready. You can now test investments.\n");
        process.exit(0);
    } catch (error) {
        console.error("ERROR:", error.message);
        process.exit(1);
    }
}

createInvestmentTables();
