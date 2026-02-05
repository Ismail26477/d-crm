import mongoose from "mongoose"

const activitySchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    type: {
      type: String,
      enum: ["created", "assigned", "stage_changed", "call_logged", "note_added", "updated", "merged"],
      required: true,
    },
    description: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Caller" },
    userName: { type: String },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Activity", activitySchema)
