import { PrismaClient } from "../generated/prisma/client.js";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword } from "../libs/ownSpice.js";
import redisClient from '../libs/redisClient.js'
const prisma = new PrismaClient();
function generateToken(userId) {
  const jti = crypto.randomUUID();
  return jwt.sign({ userId, jti }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const existing = await prisma.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already exists..." });
    }
    const { salt, hash } = hashPassword(password);
    const user = await prisma.user.create({
      data: { username, email, salt, hash },
    });
    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Registration failed" });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }
    const isValid = verifyPassword(password, user.salt, user.hash);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: "Please check Your password...." });
    }
    const token = generateToken(user.id)
    res.status(200).json({ message: "Succesfully logged In.....",token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Login failed" });
  }
};
const logout = async (req, res) => {
const token = req.headers.authorization?.spilt(" ")[1]
if(!token) {
  return res.status(400).json({error : "No token"})
}
try {
 const decoded = jwt.verify(token,process.env.JWT_SECRET)
 const exp = decoded.exp
 const ttl = exp - Math.floor(Date.now() / 1000)
 await redisClient.setEx(`blacklisted:${decoded.jti}`,ttl,"true")
 res.json({message : "Logged out successfully"})
} catch (error) {
  console.error(error);
  res.status(401).json({error : "Invalid token"})
}

};