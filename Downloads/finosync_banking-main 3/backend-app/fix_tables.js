// Simple direct table creation
const { pgPool } = require("./src/config/postgres");

async function createTables() {
    try {
        console.log("\n🔧 Creating investment tables...\n");

        // Create investments table
        await pgPool.query(`
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

        await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);`);

        // Create SIP table
        await pgPool.query(`
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

        await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_sip_user ON sip_subscriptions(user_id);`);

        console.log("✅ SUCCESS! Tables are ready.\n");
        console.log("Now restart your backend and test investments!\n");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        console.error("\nMake sure PostgreSQL is running and fastbank database exists.\n");
        process.exit(1);
    }
}

createTables();
