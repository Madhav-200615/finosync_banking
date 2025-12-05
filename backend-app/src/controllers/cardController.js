const Card = require("../models/Card");
const Account = require("../models/Account");
const { pgPool } = require("../config/postgres");
const { logger } = require("../config/logger");

// Get all cards for user
exports.getCards = async (req, res) => {
    try {
        const userId = req.user.id;
        let cards = await Card.find({ userId }).sort({ createdAt: -1 });

        // If no cards exist, create sample cards for demonstration
        // if (cards.length === 0) {
        //     // Demo cards removed as per user request
        // }

        const credit = cards.filter(c => c.type === "credit");
        const debit = cards.filter(c => c.type === "debit");

        res.json({ credit, debit });
    } catch (err) {
        logger.error("Error fetching cards", { err: err.toString() });
        res.status(500).json({ error: "Failed to fetch cards" });
    }
};

// Get credit card due bills
exports.getDueBills = async (req, res) => {
    try {
        const userId = req.user.id;
        const cards = await Card.find({
            userId,
            type: "credit",
            status: "active",
            due: { $gt: 0 }
        });

        const bills = cards.map(c => ({
            cardId: c._id,
            cardName: c.name,
            amountDue: c.due,
            minAmount: c.minDue,
            dueDate: c.dueDate
        }));

        res.json(bills);
    } catch (err) {
        logger.error("Error fetching card bills", { err: err.toString() });
        res.status(500).json({ error: "Failed to fetch card bills" });
    }
};

// Create/Request new card
exports.createCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, name, linkedAccount, limit, cardholderName, brand, color } = req.body;

        if (!type || !name || !cardholderName) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Generate card number (simplified - in production use proper card number generation)
        const cardNumber = generateCardNumber();
        const last4 = cardNumber.slice(-4);

        // Generate expiry (3 years from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 3);
        const expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
        const expiryYear = String(expiryDate.getFullYear()).slice(-2);

        // Generate CVV
        const cvv = String(Math.floor(Math.random() * 900) + 100);

        const cardData = {
            userId,
            type,
            name,
            cardNumber,
            last4,
            expiryMonth,
            expiryYear,
            cvv,
            cardholderName,
            brand: brand || "Visa",
            color: color || (type === "credit" ? "blue" : "green"),
            status: "active"
        };

        if (type === "credit") {
            cardData.limit = limit || 50000;
            cardData.used = 0;
            cardData.due = 0;
            cardData.minDue = 0;
            // Set due date to 15th of next month
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            cardData.dueDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-15`;
        } else {
            cardData.linkedAccount = linkedAccount;
            cardData.dailyLimit = 50000;
        }

        const card = await Card.create(cardData);

        logger.info("Card created", { userId, cardId: card._id, type });
        res.json({ message: "Card created successfully", card });
    } catch (err) {
        logger.error("Error creating card", { err: err.toString() });
        res.status(500).json({ error: "Failed to create card" });
    }
};

// Update card (limits, status, etc.)
exports.updateCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        const card = await Card.findOne({ _id: id, userId });
        if (!card) {
            return res.status(404).json({ error: "Card not found" });
        }

        // Allow updating certain fields
        const allowedUpdates = ["dailyLimit", "limit", "color", "name"];
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                card[key] = updates[key];
            }
        });

        await card.save();

        logger.info("Card updated", { userId, cardId: id });
        res.json({ message: "Card updated successfully", card });
    } catch (err) {
        logger.error("Error updating card", { err: err.toString() });
        res.status(500).json({ error: "Failed to update card" });
    }
};

// Toggle card status (active/blocked)
exports.toggleCardStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const card = await Card.findOne({ _id: id, userId });
        if (!card) {
            return res.status(404).json({ error: "Card not found" });
        }

        card.status = card.status === "active" ? "blocked" : "active";
        await card.save();

        logger.info("Card status toggled", { userId, cardId: id, newStatus: card.status });
        res.json({ message: `Card ${card.status}`, card });
    } catch (err) {
        logger.error("Error toggling card status", { err: err.toString() });
        res.status(500).json({ error: "Failed to toggle card status" });
    }
};

// Pay credit card bill
exports.payCardBill = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { amount, fromAccount } = req.body;

        if (!amount || !fromAccount) {
            return res.status(400).json({ error: "Missing amount or account" });
        }

        const card = await Card.findOne({ _id: id, userId, type: "credit" });
        if (!card) {
            return res.status(404).json({ error: "Credit card not found" });
        }

        if (amount > card.due) {
            return res.status(400).json({ error: "Amount exceeds due amount" });
        }

        // Check if user has sufficient balance in the account
        const pgClient = await pgPool.connect();
        try {
            await pgClient.query("BEGIN");

            const accountRes = await pgClient.query(
                "SELECT balance FROM accounts WHERE account_number = $1 AND user_id = $2",
                [fromAccount, userId]
            );

            if (accountRes.rows.length === 0) {
                throw new Error("Account not found");
            }

            const balance = parseFloat(accountRes.rows[0].balance);
            if (balance < amount) {
                throw new Error("Insufficient balance");
            }

            // Deduct from account
            await pgClient.query(
                "UPDATE accounts SET balance = balance - $1 WHERE account_number = $2",
                [amount, fromAccount]
            );

            // Record transaction
            await pgClient.query(
                `INSERT INTO transactions (user_id, account_number, type, amount, description, category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, fromAccount, "debit", amount, `Credit card payment - ${card.name}`, "Bills & Utilities"]
            );

            await pgClient.query("COMMIT");

            // Update card
            card.used = Math.max(0, card.used - amount);
            card.due = Math.max(0, card.due - amount);
            card.minDue = Math.max(0, card.minDue - amount);
            await card.save();

            logger.info("Card bill paid", { userId, cardId: id, amount });
            res.json({ message: "Payment successful", card });

        } catch (err) {
            await pgClient.query("ROLLBACK");
            throw err;
        } finally {
            pgClient.release();
        }

    } catch (err) {
        logger.error("Error paying card bill", { err: err.toString() });
        res.status(500).json({ error: err.message || "Failed to pay bill" });
    }
};

// Get card transactions
exports.getCardTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const card = await Card.findOne({ _id: id, userId });
        if (!card) {
            return res.status(404).json({ error: "Card not found" });
        }

        // For simplicity, return mock transactions
        // In production, you'd have a separate transactions table linked to cards
        const transactions = [
            {
                id: 1,
                date: new Date().toISOString(),
                description: "Amazon Purchase",
                amount: 2499,
                type: "debit"
            },
            {
                id: 2,
                date: new Date(Date.now() - 86400000).toISOString(),
                description: "Swiggy Food Order",
                amount: 450,
                type: "debit"
            }
        ];

        res.json({ transactions });
    } catch (err) {
        logger.error("Error fetching card transactions", { err: err.toString() });
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
};

// Helper function to generate card number
function generateCardNumber() {
    // Simplified card number generation (16 digits)
    // In production, use proper Luhn algorithm
    let cardNumber = "4"; // Visa starts with 4
    for (let i = 0; i < 15; i++) {
        cardNumber += Math.floor(Math.random() * 10);
    }
    return cardNumber;
}
