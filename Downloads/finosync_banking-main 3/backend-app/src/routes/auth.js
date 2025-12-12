const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  register,
  login,
  forgotPin,
  verifyOtp,
  resetPin,
  getMe,
  changePin
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-pin", forgotPin);
router.post("/verify-otp", verifyOtp);
router.post("/reset-pin", resetPin);
router.get("/me", auth, getMe);
router.post("/change-pin", auth, changePin);

module.exports = router;
