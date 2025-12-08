const { searchTransactions } = require("../services/search.service");

async function search(req, res, next) {
  try {
    const term = req.query.q || "";
    if (!term) return res.json([]);

    const userId = 1; // demo
    const results = await searchTransactions(userId, term);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
