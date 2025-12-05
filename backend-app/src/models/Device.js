const { mongoose } = require("../config/mongo");

const deviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deviceId: String,
    lastSeen: Date
  },
  { timestamps: true }
);

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
