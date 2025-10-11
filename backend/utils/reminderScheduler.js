import cron from "node-cron";
import Medicine from "../models/medicineModel.js";
import { sendMail } from "./mailer.js";

const startReminderScheduler = () => {
  console.log("[scheduler] Scheduler started");

  // Runs every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Timezone-aware formatting for India
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

      const currentTime = timeFormatter.format(now); // "HH:MM"
      const todayStr = dateFormatter.format(now);    // "YYYY-MM-DD"
      const todayDate = new Date(todayStr + "T00:00:00+05:30"); // IST midnight

      console.log(`[scheduler] running today=${todayStr} currentTime=${currentTime}`);

      // Fetch medicines whose times array includes current time
      const medicines = await Medicine.find({ times: { $in: [currentTime] } });
      console.log(`[scheduler] found ${medicines.length} medicines for time ${currentTime}`);

      for (const med of medicines) {
        const startsOnOrBefore = med.startDate || med.startDate <= todayDate;
        const endsOnOrAfter = med.endDate || med.endDate >= todayDate;

        if (!startsOnOrBefore || !endsOnOrAfter) {
          console.log(`[scheduler] skipping ${med.name} (med=${med._id}) due to start/end date`);
          continue;
        }

        console.log(`[scheduler] sending email to ${med.email} (med=${med._id})`);
        try {
          await sendMail({
            to: med.email,
            subject: "Medicine Reminder 💊",
            text: `Hello! It's time to take your medicine: ${med.name} (${med.dosage}).`,
          });
          console.log(`✅ Reminder sent to ${med.email} for ${med.name} at ${currentTime}`);
        } catch (err) {
          console.error(`❌ Failed to send email to ${med.email}:`, err);
        }
      }
    } catch (err) {
      console.error("Reminder scheduler error:", err);
    }
  });
};


export default startReminderScheduler;