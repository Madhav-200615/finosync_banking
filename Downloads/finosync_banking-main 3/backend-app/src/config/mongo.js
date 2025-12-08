const mongoose = require("mongoose");
const { logger } = require("./logger");

async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.info("MongoDB connected");
}

module.exports = { connectMongo, mongoose };
