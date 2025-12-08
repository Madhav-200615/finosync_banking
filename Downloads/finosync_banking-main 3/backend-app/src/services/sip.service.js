const { pgPool } = require("../config/postgres");

exports.getUserSips = async (userId) => {
    const query = `SELECT * FROM sip_subscriptions WHERE user_id = $1 ORDER BY created_at DESC`;
    const result = await pgPool.query(query, [userId]);
    return result.rows;
};

exports.createSip = async (userId, sipData) => {
    const query = `
    INSERT INTO sip_subscriptions 
    (user_id, fund_name, amount, sip_day, frequency, start_date, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
    RETURNING *;
  `;

    const values = [
        userId,
        sipData.fundName,
        sipData.amount,
        sipData.sipDay,
        sipData.frequency,
        sipData.startDate
    ];

    const result = await pgPool.query(query, values);
    return result.rows[0];
};

exports.cancelSip = async (sipId, userId) => {
    const query = `
    UPDATE sip_subscriptions 
    SET status = 'CANCELLED', updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;

    const result = await pgPool.query(query, [sipId, userId]);
    return result.rows[0];
};
