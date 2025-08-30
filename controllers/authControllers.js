import { PrismaClient } from "../generated/prisma/client.js";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword } from "../libs/ownSpice.js";

const prisma = new PrismaClient();
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
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({ message: "Succesfully logged In....." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Login failed" });
  }
};
const logout = async (req, res) => {
  // With JWT we can’t "invalidate" easily without blacklist.
  // Easiest: let client delete token from storage (localStorage/cookie).
  res.json({ message: "Logout successful (delete token on client)" });
};