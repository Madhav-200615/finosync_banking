const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const { getStatements } = require("../controllers/statementsController");
const { exportStatementsPDF } = require("../controllers/statementsPDF");

router.get("/", auth, getStatements);
router.get("/export/pdf", auth, exportStatementsPDF);

module.exports = router;
