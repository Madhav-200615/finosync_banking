const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Load environment variables
require('dotenv').config({ path: '.env' });

// Models
const User = require('../src/models/User');
const Account = require('../src/models/Account');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finosync')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to generate a 6-digit account number
function generateAccountNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to generate a 4-digit PIN
function generatePIN() {


  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function createUserWithBalance() {
  try {
    // User details
    const userData = {
      name: 'Keshav Rathi',
      age: 30,
      address: '123 Main Street, Mumbai, Maharashtra',
      phone: '9876543210',
      aadhar: '123456789012',
      pan: 'ABCDE1234F',
      accountType: 'SAVINGS',
      initialDeposit: 50000,  // Initial deposit amount
      pin: generatePIN()      // Generate a random 4-digit PIN
    };

    // Check if user already exists with same phone, aadhar, or pan
    const existingUser = await User.findOne({
      $or: [
        { phone: userData.phone },
        { aadhar: userData.aadhar },
        { pan: userData.pan }
      ]
    });

    if (existingUser) {
      console.log('User already exists with these details:');
      console.log(existingUser);
      process.exit(0);
    }

    // Generate 6-digit account number
    const accountNumber = generateAccountNumber();

    // Hash the 4-digit PIN
    const pinHash = await bcrypt.hash(userData.pin, 10);

    // Create user
    const user = await User.create({
      name: userData.name,
      age: userData.age,
      address: userData.address,
      phone: userData.phone,
      aadhar: userData.aadhar,
      pan: userData.pan,
      accountNumber: accountNumber,
      pinHash: pinHash
    });

    console.log('User created successfully!');

    // Create account with initial balance
    const account = await Account.create({
      userId: user._id,
      type: userData.accountType,
      accountNumber: accountNumber,
      balance: userData.initialDeposit
    });

    // Create wallet account
    await Account.create({
      userId: user._id,
      type: 'WALLET',
      accountNumber: accountNumber + '02',
      balance: 0
    });

    // Display account details in a clear format
    console.log('\n✅ Account Created Successfully!');
    console.log('='.repeat(50));
    console.log('\n🔐 Login Credentials:');
    console.log('  • Account Number:', accountNumber);
    console.log('  • 4-Digit PIN:', userData.pin);

    console.log('\n👤 Personal Details:');
    console.log('  • Name:', userData.name);
    console.log('  • Age:', userData.age);
    console.log('  • Phone:', userData.phone);
    console.log('  • Address:', userData.address);

    console.log('\n🏦 Account Details:');
    console.log('  • Account Type:', userData.accountType);
    console.log('  • Initial Balance: ₹' + userData.initialDeposit.toLocaleString('en-IN'));
    console.log('  • Aadhar: ' + userData.aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1-XXXX-XXXX'));
    console.log('  • PAN: ' + userData.pan);

    console.log('\n⚠️  IMPORTANT: Please save these credentials securely!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createUserWithBalance();
