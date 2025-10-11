import mongoose from "mongoose";

// Normalize time format (e.g. "9:0" → "09:00")
const normalizeTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};

const reminderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine/Reminder name is required"],
      trim: true,
    },

    dosage: {
      type: String,
      trim: true,
    },

    // Contact preference: either email or WhatsApp
    contactType: {
      type: String,
      enum: ["email", "whatsapp"],
      default: "email",
    },

    email: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (this.contactType === "email") {
            return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
          }
          return true;
        },
        message: "Invalid email address",
      },
    },

    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (this.contactType === "whatsapp") {
            // ✅ Must start with + and be 8–15 digits total
            return /^\+[1-9]\d{7,14}$/.test(v);
          }
          return true;
        },
        message: "Invalid phone number format (use +countrycode...)",
      },
    },

    times: {
      type: [String],
      required: [true, "Reminder times are required"],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one time is required",
      },
      set: (arr) => arr.map(normalizeTime),
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Normalize times before saving
reminderSchema.pre("save", function (next) {
  if (this.times && this.times.length > 0) {
    this.times = this.times.map(normalizeTime);
  }
  next();
});

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
