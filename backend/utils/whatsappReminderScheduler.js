import cron from "node-cron";
import Reminder from "../models/reminderModel.js";  // 👈 use your Reminder model here
import sendWhatsApp from "./whatsappService.js";    // 👈 Twilio WhatsApp sender
import Medicine from "../models/medicineModel.js";

const startWhatsAppScheduler = () => {
  console.log("[whatsapp-scheduler] Scheduler started");

  // Runs every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // ✅ Timezone-aware formatting for India
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

      const currentTime = timeFormatter.format(now);  // "HH:MM"
      const todayStr = dateFormatter.format(now);     // "YYYY-MM-DD"
      const todayDate = new Date(todayStr + "T00:00:00+05:30");

      console.log(`[whatsapp-scheduler] running today=${todayStr} currentTime=${currentTime}`);

      // ✅ Fetch reminders whose times array includes the current time
      const reminders = await Reminder.find({ times: { $in: [currentTime] } });
      console.log(`[whatsapp-scheduler] found ${reminders.length} reminders for time ${currentTime}`);

      for (const reminder of reminders) {
        const startsOnOrBefore = reminder.startDate || reminder.startDate <= todayDate;
        const endsOnOrAfter = reminder.endDate || reminder.endDate >= todayDate;

        if (!startsOnOrBefore || !endsOnOrAfter) {
          console.log(`[whatsapp-scheduler] skipping ${reminder.name} (id=${reminder._id}) due to date`);
          continue;
        }

        console.log(`[whatsapp-scheduler] sending WhatsApp to ${reminder.phone} (id=${reminder._id})`);

        try {
          await sendWhatsApp({
            to: reminder.phone,
            message: `💊 Hello! It's time to take your medicine: ${reminder.name} (${reminder.dosage}).`,
          });

          console.log(`✅ WhatsApp reminder sent to ${reminder.phone} for ${reminder.name} at ${currentTime}`);
        } catch (err) {
          console.error(`❌ Failed to send WhatsApp to ${reminder.phone}:`, err);
        }
      }
    } catch (err) {
      console.error("[whatsapp-scheduler] error:", err);
    }
  });
};

export default startWhatsAppScheduler;
