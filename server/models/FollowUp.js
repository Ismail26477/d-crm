import mongoose from "mongoose"

const followUpSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    scheduledFor: { type: Date, required: true },
    reason: {
      type: String,
      enum: ["on_request", "not_picked", "not_reachable", "switched_off", "interested", "high_priority", "custom"],
      default: "custom",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "missed", "cancelled"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["call", "email", "sms", "whatsapp"],
      default: "call",
    },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Caller" },
    createdByName: { type: String },
    completedAt: { type: Date },
    completedNotes: { type: String },
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
    outcome: {
      type: String,
      enum: ["interested", "not_interested", "no_answer", "callback_scheduled", "other"],
    },
  },
  {
    timestamps: true,
  },
)

// Index for finding pending follow-ups
followUpSchema.index({ leadId: 1, status: 1 })
followUpSchema.index({ scheduledFor: 1, status: 1 })

export default mongoose.model("FollowUp", followUpSchema)
