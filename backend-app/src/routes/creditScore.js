const express = require("express");
const router = express.Router();
const creditScoreController = require("../controllers/creditScoreController");
const auth = require("../middleware/auth");

router.get("/", auth, creditScoreController.getCreditScore);

module.exports = router;
