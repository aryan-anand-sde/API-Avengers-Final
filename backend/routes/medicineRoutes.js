import express from "express";
import Medicine from "../models/medicineModel.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Add a new medicine for the logged-in user
// Protected: expects { token, name, dosage, time, email?, notes? }
router.post("/add", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = { ...req.body, userId };
    // normalize scheduledDate if provided
    if (payload.scheduledDate) payload.scheduledDate = new Date(payload.scheduledDate);
    const medicine = new Medicine(payload);
    await medicine.save();
    res.json({ message: "Medicine added", medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding medicine" });
  }
});

// Get all medicines for the logged-in user
// Protected: expects { token }
router.post("/list", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const medicines = await Medicine.find({ userId }).sort({ date: -1 });
    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching medicines" });
  }
});

// Mark medicine as taken or missed
// PUT /api/medicines/:id/taken { token, taken: true/false }
router.put('/:id/taken', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { taken } = req.body;

    const medicine = await Medicine.findById(id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.userId.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });

    medicine.taken = Boolean(taken);
    if (medicine.taken) medicine.takenAt = new Date();
    else medicine.takenAt = undefined;
    await medicine.save();
    res.json({ message: 'Updated', medicine });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating medicine' });
  }
});

// Delete a medicine (only owner)
// DELETE /api/medicines/:id { token }
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const medicine = await Medicine.findById(id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.userId.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });

    await Medicine.findByIdAndDelete(id);
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting medicine' });
  }
});

export default router;
