const express = require("express");
const router = express.Router();
const cardController = require("../controllers/cardController");
const authMiddleware = require("../middleware/auth");

// All routes require authentication
router.use(authMiddleware);

// GET /api/cards - Get all cards
router.get("/", cardController.getCards);

// POST /api/cards - Create/request new card
router.post("/", cardController.createCard);

// PUT /api/cards/:id - Update card details
router.put("/:id", cardController.updateCard);

// PUT /api/cards/:id/toggle - Toggle card status (active/blocked)
router.put("/:id/toggle", cardController.toggleCardStatus);

// POST /api/cards/:id/pay - Pay credit card bill
router.post("/:id/pay", cardController.payCardBill);

// GET /api/cards/:id/transactions - Get card transactions
router.get("/:id/transactions", cardController.getCardTransactions);

module.exports = router;
