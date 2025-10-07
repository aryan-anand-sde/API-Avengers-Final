import express from "express";
import User from "../models/User.js";
const router = express.Router();

// Get user by token
router.post("/me", async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
