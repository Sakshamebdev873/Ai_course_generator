import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/client.js";
import redisClient from "../libs/redisClient.js";
import { hashPassword, verifyPassword } from "../libs/ownSpice.js";
import crypto from "crypto";

const prisma = new PrismaClient();

const generateToken = (userId) => {
  const jti = crypto.randomUUID();
  return jwt.sign({ userId, jti }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const { salt, hash } = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name: username, email, salt, hash },
    });

    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isValid = await verifyPassword(password, user.salt, user.hash);
    if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user.id);
    res.status(200).json({ message: "Login successful", token  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};

export const logout = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(400).json({ error: "No token provided" });

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if Redis client is connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    
    // Calculate remaining time until token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - currentTime;
    
    if (ttl > 0) {
      // Add to blacklist with the remaining TTL
      await redisClient.setEx(`blacklist:${decoded.jti}`, ttl, "true");
      res.json({ message: "Logged out successfully" });
    } else {
      // Token is already expired
      res.json({ message: "Token already expired" });
    }
  } catch (err) {
    console.error("Logout error:", err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    
    res.status(500).json({ error: "Logout failed" });
  }
};
