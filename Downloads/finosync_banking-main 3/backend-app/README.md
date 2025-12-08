# FinoSync Backend Setup

## Quick Start After Database Name Change

After changing your database names from `fastbank` to `finosync` in the `.env` file, you need to initialize the databases.

### Prerequisites

Make sure these services are running:
- **PostgreSQL** (port 5432)
- **MongoDB** (port 27017)
- **Redis** (port 6379)
- **RabbitMQ** (port 5672) - optional initially

### Step 1: Verify Your .env File

Your `.env` file should have:
```env
MONGO_URI=mongodb://localhost:27017/finosync
PG_DATABASE=finosync
```

See `.env.example` for a complete template.

### Step 2: Run Database Setup

Run the automated setup script to create the databases and tables:

```bash
npm run setup
```

This script will:
- Create the PostgreSQL `finosync` database
- Create required tables (`accounts`, `transactions`)
- Create indexes for performance
- Verify MongoDB connection

### Step 3: Start the Server

```bash
npm start
```

## Manual Setup (Alternative)

If you prefer to set up PostgreSQL manually:

```bash
psql -U postgres -f init_databases.sql
```

## Troubleshooting

### Error: "database does not exist"
- Run `npm run setup` to create the database

### Error: "connection refused"
- Make sure PostgreSQL is running: `pg_isready`
- Make sure MongoDB is running: Check if mongod process is active
- Make sure Redis is running: `redis-cli ping`

### Error: "permission denied"
- Check your PostgreSQL user has CREATE DATABASE permission
- Update PG_USER and PG_PASSWORD in `.env`

## Additional Scripts

### Create Admin User
```bash
node create_admin.js
```

### Create Test User
```bash
node create_user.js
```

### Seed Sample Data
```bash
node seed_data.js
```

## Database Structure

### PostgreSQL Tables
- `accounts` - User account information
- `transactions` - Transaction records

### MongoDB Collections
- `users` - User authentication and profile data
- `loans` - Loan applications
- `cards` - Credit/debit card data
- `otps` - OTP verification codes

## Support

If you encounter issues:
1. Check all services are running
2. Verify `.env` credentials
3. Check logs in `./logs` directory
4. Review connection errors in the terminal
