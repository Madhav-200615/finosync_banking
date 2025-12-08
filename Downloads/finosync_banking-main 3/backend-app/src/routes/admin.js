const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth, checkPermission } = require('../middleware/adminAuth');

// Public routes
router.post('/login', adminController.login);

// Protected admin routes
router.get('/profile', adminAuth, adminController.getProfile);
router.get('/dashboard/stats', adminAuth, checkPermission('view_dashboard'), adminController.getDashboardStats);

// Customer management
router.get('/customers', adminAuth, checkPermission('view_customers'), adminController.getCustomers);
router.get('/customers/:customerId', adminAuth, checkPermission('view_customers'), adminController.getCustomerDetails);
router.put('/customers/:customerId/status', adminAuth, checkPermission('manage_customers'), adminController.toggleAccountStatus);
router.get('/customer-accounts', adminAuth, checkPermission('view_customers'), adminController.getCustomerAccounts);

// Transaction monitoring
router.get('/transactions', adminAuth, checkPermission('view_transactions'), adminController.getTransactions);

// Fixed Deposits
router.get('/fixed-deposits', adminAuth, checkPermission('view_dashboard'), adminController.getFixedDeposits);

// Loans
router.get('/loans', adminAuth, checkPermission('view_dashboard'), adminController.getLoans);
router.post('/loans/:loanId/approve', adminAuth, checkPermission('view_dashboard'), adminController.approveLoan);
router.post('/loans/:loanId/reject', adminAuth, checkPermission('view_dashboard'), adminController.rejectLoan);

module.exports = router;
