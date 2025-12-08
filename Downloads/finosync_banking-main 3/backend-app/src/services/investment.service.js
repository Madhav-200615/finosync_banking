// backend-app/src/services/investment.service.js

const { pgPool } = require("../config/postgres");
const { broadcastInvestmentUpdate } = require("./ws");

// -------------------------------------------------------
// GET all investments for user
// -------------------------------------------------------
async function getInvestmentsByUser(userId) {
    const query = `
      SELECT
        id,
        user_id,
        account_id,
        type,
        product_name,
        category,
        risk_level,
        amount_invested,
        current_value,
        cagr_3y,
        status,
        started_on,
        created_at,
        updated_at
      FROM investments
      WHERE user_id = $1
      ORDER BY created_at DESC
  `;

    const result = await pgPool.query(query, [userId]);
    return result.rows;
}

// -------------------------------------------------------
// CREATE investment
// -------------------------------------------------------
async function createInvestment(userId, payload) {
    const query = `
      INSERT INTO investments (
        user_id, account_id, type, product_name,
        category, risk_level, amount_invested,
        current_value, cagr_3y
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
  `;

    const values = [
        userId,
        payload.accountId || null,
        payload.type,
        payload.productName,
        payload.category,
        payload.riskLevel,
        payload.amount,
        payload.amount,     // current_value starts same as invested
        payload.cagr3Y || null,
    ];

    const result = await pgPool.query(query, values);

    // WebSocket push
    broadcastInvestmentUpdate(userId, result.rows[0]);

    return result.rows[0];
}

// -------------------------------------------------------
// Mutual fund recommendations (static for now)
// -------------------------------------------------------
async function getMutualFundRecommendations() {
    return [
        {
            id: 1,
            name: "HDFC Silver ETF Fund Of Fund Regular Growth",
            category: "Commodities: Silver",
            cagr3Y: 35.92,
        },
        {
            id: 2,
            name: "Aditya Birla Sun Life Silver ETF FOF-Regular Plan-Growth",
            category: "Commodities: Silver",
            cagr3Y: 35.91,
        },
        {
            id: 3,
            name: "Nippon India Silver ETF FOF - Growth",
            category: "Commodities: Silver",
            cagr3Y: 35.87,
        },
    ];
}

module.exports = {
    getInvestmentsByUser,
    createInvestment,
    getMutualFundRecommendations,
};
