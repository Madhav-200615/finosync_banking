const { elasticClient } = require("../config/elastic");

const INDEX = "transactions";

async function indexTransaction(tx) {
  await elasticClient.index({
    index: INDEX,
    id: tx.id,
    document: {
      user_id: tx.user_id,
      description: tx.description,
      type: tx.type,
      amount: tx.amount,
      created_at: tx.created_at
    }
  });
}

async function searchTransactions(userId, term) {
  const { hits } = await elasticClient.search({
    index: INDEX,
    query: {
      bool: {
        must: [
          { match: { description: term } },
          { term: { user_id: userId } }
        ]
      }
    }
  });

  return hits.hits.map((h) => h._source);
}

module.exports = { indexTransaction, searchTransactions };
