const Admin = require('../models/Admin');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require("../models/Loan");
const { redisClient } = require("../config/redis");
const FD = require('../models/FD');
const jwt = require('jsonwebtoken');

// Admin Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });

        if (!admin) {
            return res.status(404).json({ error: 'Invalid credentials' });
        }

        if (!admin.isActive) {
            return res.status(403).json({ error: 'Account is deactivated. Contact super admin.' });
        }

        // Verify password
        const isValidPassword = await admin.verifyPassword(password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate JWT token with admin type
        const token = jwt.sign(
            { sub: admin._id, type: 'admin', role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
            },
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [
            totalCustomers,
            accountsAgg,
            todayTxAgg,
            pendingLoans,
            fdAgg,
            customerGrowth,
            txVolumeTrend,
            fdVolumeTrend,
            loanVolumeTrend,
        ] = await Promise.all([
            // Total unique customers
            User.countDocuments(),

            // Total balance and avg balance
            Account.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBalance: { $sum: '$balance' },
                        avgBalance: { $avg: '$balance' },
                    },
                },
            ]),

            // Today's transactions volume and count
            Transaction.aggregate([
                {
                    $match: {
                        createdAt: { $gte: today },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalVolume: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]),

            // Pending loans
            Loan.countDocuments({ status: 'ACTIVE' }),

            // FD aggregates (by status and total principal)
            FD.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalPrincipal: { $sum: '$principalAmount' },
                    },
                },
            ]),

            // Customer growth over time (by user createdAt, monthly)
            User.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),

            // Transaction volume trend (monthly)
            Transaction.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        totalVolume: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),

            // FD volume trend (by startDate, monthly)
            FD.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' },
                        },
                        totalPrincipal: { $sum: '$principalAmount' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),

            // Loan issuance trend (by createdAt, monthly)
            Loan.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        totalPrincipal: { $sum: '$principalAmount' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
        ]);

        const accountsData = accountsAgg[0] || { totalBalance: 0, avgBalance: 0 };
        const todayTx = todayTxAgg[0] || { totalVolume: 0, count: 0 };

        const pendingFdEntry = fdAgg.find((x) => x._id === 'PENDING');
        const newFDRequests = pendingFdEntry ? pendingFdEntry.count : 0;

        const fraudAlerts = 0; // Placeholder for future fraud detection logic

        const mapTimeSeries = (items, valueKey) =>
            items.map((item) => ({
                year: item._id.year,
                month: item._id.month,
                value: item[valueKey],
            }));

        const stats = {
            totalCustomers,
            pendingLoans,
            pendingCards: 0,
            newFDRequests,
            dailyTransactions: todayTx.count,
            dailyTransactionVolume: todayTx.totalVolume,
            fraudAlerts,
            totalBalance: accountsData.totalBalance,
            avgBalance: accountsData.avgBalance,
            charts: {
                customerGrowth: mapTimeSeries(customerGrowth, 'count'),
                transactionVolumeTrend: mapTimeSeries(txVolumeTrend, 'totalVolume'),
                fdVolumeTrend: mapTimeSeries(fdVolumeTrend, 'totalPrincipal'),
                loanIssuanceTrend: mapTimeSeries(loanVolumeTrend, 'totalPrincipal'),
            },
        };

        const recentTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name accountNumber');

        return res.json({
            success: true,
            stats,
            recentTransactions,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};

// Customer Accounts list (per account, joined with user)
exports.getCustomerAccounts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const [accounts, total] = await Promise.all([
            Account.find()
                .populate('userId', 'name accountNumber createdAt')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Account.countDocuments(),
        ]);

        const items = accounts.map((acc) => ({
            id: acc._id,
            accountHolderName: acc.userId ? acc.userId.name : 'Unknown',
            accountNumber: acc.accountNumber,
            accountType: acc.type,
            balance: acc.balance,
            createdAt: acc.createdAt,
        }));

        return res.json({
            success: true,
            accounts: items,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get customer accounts error:', error);
        return res.status(500).json({ error: 'Failed to fetch customer accounts' });
    }
};

// Fixed Deposits list (admin view using FD model)
exports.getFixedDeposits = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const query = {};
        if (status && status !== 'all') {
            // FD model uses lowercase status values: 'active', 'closed'
            query.status = status.toLowerCase();
        }

        const [fds, total] = await Promise.all([
            FD.find(query)
                .populate('user', 'name accountNumber')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            FD.countDocuments(query),
        ]);

        const items = fds.map((fd) => {
            // FD schema stores principal as amount, interestRate as decimal (e.g. 0.07)
            const principal = fd.amount;
            const rate = fd.interestRate;
            const tenureMonths = fd.tenureMonths;

            // Approximate maturity amount if not yet closed
            let maturityAmount = fd.closingAmount;
            if (!maturityAmount) {
                const interest = Math.round(principal * rate * (tenureMonths / 12));
                maturityAmount = principal + interest;
            }

            return {
                id: fd._id,
                fdId: fd._id, // use Mongo ID as FD identifier
                userName: fd.user ? fd.user.name : 'Unknown',
                principalAmount: principal,
                interestRate: rate * 100, // convert to percentage
                maturityAmount,
                tenure: tenureMonths,
                startDate: fd.startDate,
                endDate: fd.maturityDate,
                status: fd.status.toUpperCase(),
            };
        });

        return res.json({
            success: true,
            fixedDeposits: items,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get fixed deposits error:', error);
        return res.status(500).json({ error: 'Failed to fetch fixed deposits' });
    }
};

// Loans list
exports.getLoans = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'all' } = req.query;

        const query = {};
        if (status !== 'all') {
            query.status = status.toUpperCase();
        }

        const [loans, total] = await Promise.all([
            Loan.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            Loan.countDocuments(query),
        ]);

        const userIds = [...new Set(loans.map((l) => l.userId))];
        const users = await User.find({ _id: { $in: userIds } }).select('name accountNumber');
        const userMap = new Map(users.map((u) => [String(u._id), u]));

        const items = loans.map((loan) => {
            const user = userMap.get(String(loan.userId));
            return {
                id: loan._id,
                loanId: loan._id,
                userName: user ? user.name : 'Unknown',
                loanAmount: loan.principalAmount,
                interestRate: loan.interestRate,
                tenure: loan.tenureMonths,
                emiAmount: loan.emiAmount,
                totalInterestPayable: loan.totalInterestPayable,
                totalPayableAmount: loan.totalPayableAmount,
                remainingPrincipal: loan.remainingPrincipal,
                repaymentStatus: loan.status,
                paidEmiCount: loan.paidEmiCount,
                startDate: loan.startDate,
                preclosurePenaltyPercent: loan.preclosurePenaltyPercent,
                repayments: loan.repayments || [],
            };
        });

        return res.json({
            success: true,
            loans: items,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get loans error:', error);
        return res.status(500).json({ error: 'Failed to fetch loans' });
    }
};

// Helper: redis key for user loans cache (must match loanController)
function userLoansKey(userId) {
    return `user:${userId}:loans`;
}

// Approve loan (admin) – disburse amount and activate loan
exports.approveLoan = async (req, res) => {
    try {
        const { loanId } = req.params;

        const loan = await Loan.findById(loanId);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        if (loan.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending loans can be approved' });
        }

        const userId = loan.userId;

        // Find user's WALLET account to credit the loan amount
        const account = await Account.findOne({
            userId,
            type: { $regex: /^wallet$/i },
        });

        if (!account) {
            return res.status(404).json({ error: 'Wallet account not found for user' });
        }

        const principalNum = loan.principalAmount;

        // Credit the account
        account.balance += principalNum;
        await account.save();

        // Create Credit Transaction
        const tx = await Transaction.create({
            user: userId,
            amount: principalNum,
            type: 'CREDIT',
            category: 'loan_disbursement',
            description: `Loan approved & disbursed: ${loan.loanType} #${String(loan._id).slice(-6)}`,
        });

        // Update loan status
        loan.status = 'ACTIVE';
        loan.startDate = new Date();
        await loan.save();

        // Invalidate user loans cache so user sees updated status
        try {
            await redisClient.del(userLoansKey(userId));
        } catch (e) {
            console.warn('Failed to clear loans cache after admin approve', e.toString());
        }

        return res.json({
            success: true,
            message: 'Loan approved and disbursed successfully',
            loan,
            transaction: tx,
        });
    } catch (error) {
        console.error('Approve loan error:', error);
        return res.status(500).json({ error: 'Failed to approve loan' });
    }
};

// Reject loan (admin)
exports.rejectLoan = async (req, res) => {
    try {
        const { loanId } = req.params;

        const loan = await Loan.findById(loanId);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        if (loan.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending loans can be rejected' });
        }

        loan.status = 'REJECTED';
        await loan.save();

        // Invalidate user loans cache so user sees updated status
        try {
            await redisClient.del(userLoansKey(String(loan.userId)));
        } catch (e) {
            console.warn('Failed to clear loans cache after admin reject', e.toString());
        }

        return res.json({
            success: true,
            message: 'Loan rejected successfully',
            loan,
        });
    } catch (error) {
        console.error('Reject loan error:', error);
        return res.status(500).json({ error: 'Failed to reject loan' });
    }
};

// Get All Customers
exports.getCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status = 'all' } = req.query;

        const query = {};

        // Search by name, phone, or account number
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { accountNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const customers = await User.find(query)
            .select('-pinHash')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        // Get account balances for each customer
        const customersWithBalance = await Promise.all(
            customers.map(async (customer) => {
                const account = await Account.findOne({ userId: customer._id, type: { $ne: 'WALLET' } });
                return {
                    ...customer.toObject(),
                    balance: account?.balance || 0,
                    accountType: account?.type || 'N/A',
                };
            })
        );

        return res.json({
            success: true,
            customers: customersWithBalance,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Get customers error:', error);
        return res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

// Get Customer Details
exports.getCustomerDetails = async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await User.findById(customerId).select('-pinHash');

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get all accounts
        const accounts = await Account.find({ userId: customerId });

        // Get recent transactions
        const transactions = await Transaction.find({ user: customerId })
            .sort({ createdAt: -1 })
            .limit(50);

        return res.json({
            success: true,
            customer,
            accounts,
            transactions,
        });

    } catch (error) {
        console.error('Get customer details error:', error);
        return res.status(500).json({ error: 'Failed to fetch customer details' });
    }
};

// Get All Transactions
exports.getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 50, type = 'all', startDate, endDate } = req.query;

        const query = {};

        // Filter by type
        if (type !== 'all') {
            query.type = type.toUpperCase();
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .populate('user', 'name accountNumber')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(query);

        // Calculate total volume
        const volumeData = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalVolume: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        return res.json({
            success: true,
            transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
            totalVolume: volumeData[0]?.totalVolume || 0,
            totalCount: volumeData[0]?.count || 0,
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

// Freeze/Unfreeze Customer Account
exports.toggleAccountStatus = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { action, reason } = req.body; // action: 'freeze' or 'unfreeze'

        const customer = await User.findById(customerId);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Add status field to User model or use a separate status collection
        // For now, we'll log the action
        console.log(`Account ${action} requested for customer ${customerId}: ${reason}`);

        return res.json({
            success: true,
            message: `Account ${action} successful`,
        });

    } catch (error) {
        console.error('Toggle account status error:', error);
        return res.status(500).json({ error: 'Failed to update account status' });
    }
};

// Get Admin Profile
exports.getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id).select('-password');

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        return res.json({
            success: true,
            admin,
        });

    } catch (error) {
        console.error('Get admin profile error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
};
