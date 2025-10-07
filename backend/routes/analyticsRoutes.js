import express from "express";
import Medicine from "../models/medicineModel.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// POST /api/analytics/data
// body: { token, startDate, endDate }
// returns overall stats and daily breakdown between start and end (inclusive)
router.post("/data", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    // Build base query
    const query = { userId };

    // If a date range is provided, use scheduledDate if present else date
    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;
    if (start && end) {
      // normalize end to end of day
      end.setHours(23, 59, 59, 999);
      query.$or = [
        { scheduledDate: { $gte: start, $lte: end } },
        { date: { $gte: start, $lte: end } },
      ];
    }

    const total = await Medicine.countDocuments(query);
    const taken = await Medicine.countDocuments({ ...query, taken: true });
    const missed = total - taken;

    // Daily breakdown
    let daily = [];
    if (start && end) {
      // iterate days
      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }

      for (const day of days) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const dayQuery = {
          userId,
          $or: [
            { scheduledDate: { $gte: dayStart, $lte: dayEnd } },
            { date: { $gte: dayStart, $lte: dayEnd } },
          ],
        };

        const dayTotal = await Medicine.countDocuments(dayQuery);
        const dayTaken = await Medicine.countDocuments({
          ...dayQuery,
          taken: true,
        });

        daily.push({
          date: dayStart.toISOString().slice(0, 10),
          total: dayTotal,
          taken: dayTaken,
          missed: dayTotal - dayTaken,
        });
      }
    }

    res.json({
      adherenceRate: total > 0 ? (taken / total) * 100 : 0,
      total,
      taken,
      missed,
      daily,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

export default router;
