import express from "express";
import Reminder from "../models/reminderModel.js";

const router = express.Router();

// POST /api/reminders
router.post("/add", async (req, res) => {
  try {
    const { name, phone, email, message, dosage, times, startDate, endDate, contactType } = req.body;

    // Basic validation
    if (!name || !times || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Name, times, startDate and endDate are required" });
    }

    // Determine contact type: prefer explicit contactType, otherwise infer from presence of phone/email
    let resolvedContactType = contactType;
    if (!resolvedContactType) {
      if (phone) resolvedContactType = 'whatsapp';
      else if (email) resolvedContactType = 'email';
    }

    if (!resolvedContactType) {
      return res.status(400).json({ success: false, message: 'Either phone (for WhatsApp) or email (for Email) must be provided' });
    }

    const reminder = new Reminder({
      name,
      phone,
      email,
      message,
      dosage,
      times,
      startDate,
      endDate,
      contactType: resolvedContactType,
    });

    await reminder.save();
    res.status(201).json({ success: true, reminder });
  } catch (error) {
    console.error("Error creating reminder:", error);
    // If validation error, return 400 with details
    if (error && error.name === 'ValidationError') {
      const errors = Object.keys(error.errors || {}).reduce((acc, k) => {
        acc[k] = error.errors[k].message || true;
        return acc;
      }, {});
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
