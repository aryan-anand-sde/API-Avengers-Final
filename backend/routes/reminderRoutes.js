import express from "express";
import Reminder from "../models/reminderModel.js";

const router = express.Router();

// POST /api/reminders
router.post("/add", async (req, res) => {
  try {
    const { name, phone, message, dosage, times, startDate, endDate } = req.body;

    // Validation
    if (!name || !phone || !message || !times || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const reminder = new Reminder({
      name,
      phone,
      message,
      dosage,
      times,
      startDate,
      endDate,
    });

    await reminder.save();
    res.status(201).json({ success: true, reminder });
  } catch (error) {
    console.error("Error creating WhatsApp reminder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
