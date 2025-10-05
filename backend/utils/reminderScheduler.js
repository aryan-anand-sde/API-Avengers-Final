import nodemailer from "nodemailer";
import cron from "node-cron";
import Medicine from "../models/medicineModel.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "youremail@gmail.com", // 🔹 Replace
    pass: "yourpassword",       // 🔹 Replace or use env var
  },
});

export const startReminderScheduler = () => {
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const medicines = await Medicine.find({ time: currentTime });
    medicines.forEach((med) => {
      const mailOptions = {
        from: "youremail@gmail.com",
        to: med.email,
        subject: "Medicine Reminder 💊",
        text: `Hey! It's time to take your medicine: ${med.name} (${med.dosage}).`,
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log("Reminder sent:", info.response);
      });
    });
  });
};
