const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(JSON.stringify(u, null, 2));
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUsers();
