const mongoose = require("mongoose");
const Card = require("../src/models/Card");
require("dotenv").config();

async function cleanup() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        console.log("Deleting demo cards...");
        const result = await Card.deleteMany({ cardholderName: "JOHN DOE" });
        console.log(`Deleted ${result.deletedCount} demo cards.`);

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

cleanup();
