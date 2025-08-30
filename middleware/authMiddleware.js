import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/client";
import redisClient from '../libs/redisClient.js'
const prisma = new PrismaClient();
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check blacklist
    const isBlacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: "Token blacklisted. Please log in again." });
    }

    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
