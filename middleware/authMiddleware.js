import jwt from "jsonwebtoken";
import redisClient from "../libs/redisClient.js";

const authMiddleware = async (req, res, next) => {
  // console.log(req.headers)
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) return res.status(401).json({ error: "No token provided" });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check Redis connection
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    
    // Check if token is blacklisted
    const blacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
    
    if (blacklisted) {
      return res.status(401).json({ error: "Token revoked" });
    }
    
    req.user = decoded; // Optional: Attach decoded token to request
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
export default authMiddleware;
