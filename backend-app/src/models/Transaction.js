const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: "general" },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
