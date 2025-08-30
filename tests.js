import jwt from 'jsonwebtoken'
const tokenBlacklist = new Set();

export const logout = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(400).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    tokenBlacklist.add(decoded.jti);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware to check in-memory blacklist
export const checkBlacklist = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (tokenBlacklist.has(decoded.jti)) {
      return res.status(401).json({ error: "Token revoked" });
    }
    
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};