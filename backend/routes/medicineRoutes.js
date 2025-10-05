import express from "express";
import Medicine from "../models/medicineModel.js";
const router = express.Router();

// Add a new medicine
router.post("/add", async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.json({ message: "Medicine added", medicine });
  } catch (error) {
    res.status(500).json({ message: "Error adding medicine" });
  }
});

// Get all medicines for a user
router.post("/list", async (req, res) => {
  try {
    const { userId } = req.body;
    const medicines = await Medicine.find({ userId });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching medicines" });
  }
});

export default router;
