// middleware/auth.js
import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle different payload formats
    // Case 1: { user: { id: "..." } }
    if (decoded.user && decoded.user.id) {
      req.user = { id: decoded.user.id };
    } 
    // Case 2: { id: "..." }
    else if (decoded.id) {
      req.user = { id: decoded.id };
    } 
    else {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid or has expired" });
  }
};

export default auth;
