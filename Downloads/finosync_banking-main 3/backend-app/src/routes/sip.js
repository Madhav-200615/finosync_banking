const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/sipController");

router.use(auth);

router.get("/", controller.getMySips);
router.post("/", controller.createSip);
router.post("/:id/cancel", controller.cancelSip);

module.exports = router;
