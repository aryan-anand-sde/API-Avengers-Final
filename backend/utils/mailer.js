import nodemailer from "nodemailer";

// Use environment variables for credentials
let EMAIL_USER = process.env.EMAIL_USER || "ramlinghule10@gmail.com";
let EMAIL_PASS = process.env.EMAIL_PASS || "dyiy yruh aicp erpn"; // 16-char App Password

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verify transporter immediately
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Transporter verification failed:", err);
  } else {
    console.log("✅ Transporter ready to send emails");
  }
});

// Send email
export const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${info.response}`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    throw err;
  }
};

export default transporter;
