const { mongoose } = require("../config/mongo");

const cardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["credit", "debit"], required: true },
    last4: String,
    limit: Number,
    used: Number,
    dueDate: Date
  },
  { timestamps: true }
);

const Card = mongoose.model("Card", cardSchema);

module.exports = Card;
