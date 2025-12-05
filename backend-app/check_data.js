const mongoose = require('mongoose');
const Account = require('./src/models/Account');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const accounts = await Account.find({});
        console.log(`Found ${accounts.length} accounts:`);
        accounts.forEach(a => {
            console.log(`- Type: "${a.type}", User: ${a.userId}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkData();
