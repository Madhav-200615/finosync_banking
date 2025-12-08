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
        console.log('✅ Connected to MongoDB');

        const name = "Madhav Sharma";
        const phone = "9876543210";
        const pin = "1234";

        // Check if user exists with this phone
        const existing = await User.findOne({ phone });
        if (existing) {
            console.log('\n✅ User already exists:');
            console.log(`   Name: ${existing.name}`);
            console.log(`   Account: ${existing.accountNumber}`);
            console.log(`   Phone: ${existing.phone}`);
            console.log(`   PIN: 1234\n`);
            await mongoose.disconnect();
            return;
        }

        const pinHash = await bcrypt.hash(pin, 10);
        const accountNumber = generateAccNo();

        const user = await User.create({
            name,
            age: 28,
            address: "123 MG Road, Bangalore, Karnataka 560001",
            phone,
            aadhar: "123456789012",
            pan: "ABCDE1234F",
            pinHash,
            accountNumber,
        });

        console.log('\n✅ User created successfully:');
        console.log(`   Name: ${user.name}`);
        console.log(`   Account Number: ${user.accountNumber}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   PIN: ${pin}\n`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createUser();
