// routes/analyticsRoutes.js – FINAL + VALIDATION FIXES (✅ FIXED)
import express from "express";
import mongoose from "mongoose";
import Adherence from "../models/Adherence.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Helper function to safely format a date to YYYY-MM-DD
const toYYYYMMDD = (date) =>
  date ? new Date(date).toISOString().split("T")[0] : null;

// @desc    Get adherence analytics summary and daily history
// @route   POST /api/analytics/data
// @access  Private
router.post("/data", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    let { startDate, endDate } = req.body;

    const start = toYYYYMMDD(startDate);
    const end = toYYYYMMDD(endDate);

    // --- Step 1: Build match stage dynamically ---
    const matchStage = {
      userId: new mongoose.Types.ObjectId(userId), // ✅ FIXED: must use `new`
      status: { $in: ["taken", "missed"] },
    };

    if (start || end) {
      matchStage.scheduledDate = {};
      if (start) matchStage.scheduledDate.$gte = start;
      if (end) matchStage.scheduledDate.$lte = end;
    }

    // --- Step 2: Validate that user has adherence records ---
    const existingRecords = await Adherence.find({
      userId: new mongoose.Types.ObjectId(userId), // ✅ use same ObjectId format
      scheduledDate: { $exists: true },
      status: { $in: ["taken", "missed"] },
    }).limit(1);

    if (existingRecords.length === 0) {
      return res.json({
        total: 0,
        taken: 0,
        missed: 0,
        adherenceRate: 0,
        daily: [],
        message: "No adherence records found for this user.",
      });
    }

    // --- Step 3: Overall Summary ---
    const summaryPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          taken: { $sum: { $cond: [{ $eq: ["$status", "taken"] }, 1, 0] } },
          missed: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
        },
      },
    ];

    const summaryResult = await Adherence.aggregate(summaryPipeline);
    const taken = summaryResult[0]?.taken || 0;
    const missed = summaryResult[0]?.missed || 0;
    const total = taken + missed;

    // --- Step 4: Daily Breakdown ---
    const dailyPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$scheduledDate",
          taken: { $sum: { $cond: [{ $eq: ["$status", "taken"] }, 1, 0] } },
          missed: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          taken: 1,
          missed: 1,
          total: { $add: ["$taken", "$missed"] },
        },
      },
      { $sort: { date: 1 } },
    ];

    const daily = await Adherence.aggregate(dailyPipeline);
    const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

    // --- Step 5: Send Response ---
    res.json({
      total,
      taken,
      missed,
      adherenceRate,
      daily,
    });
  } catch (error) {
    console.error("Analytics Fetch Error:", error);
    res.status(500).json({ message: "Error fetching adherence data." });
  }
});

export default router;

