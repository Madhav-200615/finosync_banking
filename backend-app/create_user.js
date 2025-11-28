const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Generate 6 digit account no
function generateAccNo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const name = "Madhav Sharma";
        const phone = "9876543210";
        const pin = "1234";

        // Check if user exists with this phone
        const existing = await User.findOne({ phone });
        if (existing) {
            console.log('User with this phone already exists. Deleting...');
            await User.deleteOne({ phone });
        }

        const pinHash = await bcrypt.hash(pin, 10);
        const accountNumber = generateAccNo();

        const user = await User.create({
            name,
            phone,
            pinHash,
            accountNumber,
        });

        console.log('User created successfully:');
        console.log(`Name: ${user.name}`);
        console.log(`Account Number: ${user.accountNumber}`);
        console.log(`Phone: ${user.phone}`);
        console.log(`PIN: ${pin}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

createUser();
