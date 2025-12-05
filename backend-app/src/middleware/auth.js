const jwt = require("jsonwebtoken");

// Export the middleware function directly so routes can `require("../middleware/auth")`
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.sub };

    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);

    // Log specific error types for debugging
    if (err.name === 'TokenExpiredError') {
      console.error("Token expired at:", err.expiredAt);
      return res.status(401).json({ error: "Token expired" });
    } else if (err.name === 'JsonWebTokenError') {
      console.error("Invalid token:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    } else {
      console.error("Unknown JWT error:", err);
      return res.status(401).json({ error: "Authentication failed" });
    }
  }
};
