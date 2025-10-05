import express from "express";
import Medicine from "../models/medicineModel.js";
const router = express.Router();

// Get adherence data
router.post("/data", async (req, res) => {
  try {
    const { userId } = req.body;
    const total = await Medicine.countDocuments({ userId });
    const taken = await Medicine.countDocuments({ userId, taken: true });
    const missed = total - taken;

    res.json({
      adherenceRate: total > 0 ? (taken / total) * 100 : 0,
      total,
      taken,
      missed,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

export default router;
