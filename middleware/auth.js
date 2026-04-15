const jwt = require("jsonwebtoken");
const { isCurrentAdminSession } = require("../auth/adminSession");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    if (decoded.role === "admin" && !isCurrentAdminSession(decoded)) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = authMiddleware;
