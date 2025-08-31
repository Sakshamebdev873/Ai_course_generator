import jwt from "jsonwebtoken";
import redisClient from "../libs/redisClient.js";

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if Redis has this token blacklisted
    const blacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
    if (blacklisted) {
      return res.status(401).json({ error: "Token revoked" });
    }

    // Attach only what you need
    req.user = { id: decoded.userId };
console.log("AuthMiddleware req.user:", req.user);
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;
