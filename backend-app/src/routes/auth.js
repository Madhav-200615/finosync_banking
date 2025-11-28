const router = require("express").Router();
const {
  register,
  login,
  forgotPin,
  verifyOtp
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-pin", forgotPin);
router.post("/verify-otp", verifyOtp);

module.exports = router;
