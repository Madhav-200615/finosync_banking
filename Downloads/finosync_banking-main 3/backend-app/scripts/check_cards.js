const mongoose = require("mongoose");
const Card = require("../src/models/Card");
require("dotenv").config();

async function checkCards() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const cards = await Card.find({});
        console.log(`Found ${cards.length} cards.`);
        cards.forEach(c => {
            console.log(`- ${c.name} (${c.cardholderName})`);
        });

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkCards();
