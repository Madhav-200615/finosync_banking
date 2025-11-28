const mongoose = require('mongoose');
const User = require('./src/models/User');
const Account = require('./src/models/Account');
const Transaction = require('./src/models/Transaction');
require('dotenv').config();

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const phone = "9876543210";
        const user = await User.findOne({ phone });

        if (!user) {
            console.error("User not found! Run create_user.js first.");
            process.exit(1);
        }

        console.log(`Seeding data for user: ${user.name} (${user._id})`);

        // 1. Create Accounts
        await Account.deleteMany({ userId: user._id });

        const savings = await Account.create({
            userId: user._id,
            type: "SAVINGS",
            accountNumber: user.accountNumber,
            balance: 50000
        });

        const wallet = await Account.create({
            userId: user._id,
            type: "WALLET",
            accountNumber: Math.floor(100000 + Math.random() * 900000).toString(),
            balance: 2500
        });

        console.log("Accounts created");

        // 2. Create Transactions
        await Transaction.deleteMany({ user: user._id });

        const txs = [
            {
                user: user._id,
                type: "credit",
                amount: 15000,
                category: "Salary",
                description: "November Salary",
                date: new Date()
            },
            {
                user: user._id,
                type: "debit",
                amount: 500,
                category: "Food",
                description: "Lunch at Cafe",
                date: new Date(Date.now() - 86400000) // yesterday
            },
            {
                user: user._id,
                type: "debit",
                amount: 2000,
                category: "Shopping",
                description: "Grocery",
                date: new Date(Date.now() - 172800000) // 2 days ago
            },
            {
                user: user._id,
                type: "credit",
                amount: 500,
                category: "Refund",
                description: "Refund from Amazon",
                date: new Date(Date.now() - 259200000) // 3 days ago
            }
        ];

        await Transaction.insertMany(txs);
        console.log("Transactions created");

        await mongoose.disconnect();
        console.log("Done!");
    } catch (err) {
        console.error('Error:', err);
    }
}

seedData();
