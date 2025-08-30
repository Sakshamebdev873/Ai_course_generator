import { Router } from "express";
import { register, login, logout } from "../controllers/authControllers.js";
import authMiddleware from '../middleware/authMiddleware.js'
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/logout",authMiddleware ,logout);
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "Welcome!", userId: req.user.id });
});

export default router;
