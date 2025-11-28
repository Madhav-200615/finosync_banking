const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createFD, getFDs, closeFD } = require("../controllers/fdController");

// Create new FD
router.post("/create", auth, createFD);

// List all FDs of logged-in user
router.get("/list", auth, getFDs);

// Close / withdraw FD
router.post("/close/:id", auth, closeFD);

module.exports = router;
