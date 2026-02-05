import mongoose from "mongoose"

const callLogSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: "Caller", required: true },
    callerName: { type: String },
    type: {
      type: String,
      enum: ["inbound", "outbound"],
      default: "outbound",
    },
    duration: { type: Number, default: 0 }, // in seconds
    notes: { type: String },
    status: {
      type: String,
      enum: ["completed", "missed", "cancelled"],
      default: "completed",
    },
    nextFollowUp: { type: Date },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("CallLog", callLogSchema)
