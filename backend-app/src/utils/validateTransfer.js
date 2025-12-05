module.exports = function validateTransfer({ fromAccountId, toAccountId, amount }) {
  if (!fromAccountId || !toAccountId) {
    return "Both from and to account are required";
  }
  if (fromAccountId === toAccountId) {
    return "Cannot transfer to same account";
  }
  if (!amount || amount <= 0) {
    return "Amount must be positive";
  }
  return null;
};
