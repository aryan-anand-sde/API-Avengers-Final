import cron from "node-cron";
import Reminder from "../models/reminderModel.js";
import sendWhatsApp from "./whatsappService.js";

// Helper to normalize time: "9:0" → "09:00"
const normalizeTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};

export const startWhatsAppReminderScheduler = () => {
  console.log("[scheduler] WhatsApp Scheduler started");

  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // --- FORMAT CURRENT TIME IN IST ---
      const timeFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      const dateFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const currentTime = normalizeTime(timeFormatter.format(now)); // "HH:MM"
      const todayStr = dateFormatter.format(now); // "YYYY-MM-DD"
      const todayDate = new Date(todayStr + "T00:00:00+05:30");

      console.log(`[scheduler] running today=${todayStr} currentTime=${currentTime}`);

      // --- FETCH REMINDERS ---
      const reminders = await Reminder.find();

      // --- FILTER REMINDERS ---
      const dueReminders = reminders.filter((rem) => {
        // 1. Normalize all times
        const normalizedTimes = rem.times.map(normalizeTime);

        // 2. Current time match
        if (!normalizedTimes.includes(currentTime)) return false;

        // 3. Start/End date check
        const start = rem.startDate ? new Date(rem.startDate + "T00:00:00+05:30") : null;
        const end = rem.endDate ? new Date(rem.endDate + "T23:59:59+05:30") : null;

        if (start && todayDate < start) return false;
        if (end && todayDate > end) return false;

        // 4. Phone check for WhatsApp
        if (!rem.phone || rem.contactType !== "whatsapp") return false;

        return true;
      });

      console.log(`[scheduler] found ${dueReminders.length} due reminders for time ${currentTime}`);

      // --- SEND WHATSAPP REMINDERS ---
      for (const rem of dueReminders) {
        try {
          await sendWhatsApp({
            to: rem.phone,
            message: `Hello ${rem.name}! It's time for your medicine: ${rem.message || rem.name} (${rem.dosage || "no dosage info"}).`,
          });
          console.log(`✅ Reminder sent to ${rem.phone} for ${rem.name} at ${currentTime}`);
        } catch (err) {
          console.error(`❌ Failed to send WhatsApp to ${rem.phone}:`, err);
        }
      }
    } catch (err) {
      console.error("WhatsApp reminder scheduler error:", err);
    }
  });
};
