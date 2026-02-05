import mongoose from "mongoose"

const meetingSchema = new mongoose.Schema(
  {
    leadId: { 
      type: mongoose.Schema.Types.Mixed,
      required: true 
    },
    leadName: { type: String, required: true },
    leadPhone: { type: String },
    leadEmail: { type: String },
    callerId: { 
      type: mongoose.Schema.Types.Mixed,
      required: true 
    },
    callerName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30 }, // in minutes
    timezone: { type: String, default: "UTC" },
    location: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },
    notes: { type: String },
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Meeting", meetingSchema)
