import mongoose from "mongoose"

const settingsSchema = new mongoose.Schema(
  {
    // Email settings
    emailConfig: {
      smtpServer: { type: String, default: "smtp.gmail.com" },
      smtpPort: { type: String, default: "587" },
      senderEmail: { type: String, default: "" },
      senderPassword: { type: String, default: "" },
      enableNotifications: { type: Boolean, default: false },
      notifyOnAssignment: { type: Boolean, default: false },
      notifyOnStageChange: { type: Boolean, default: false },
    },
    // Lead assignment settings
    leadAssignment: {
      autoAssign: { type: Boolean, default: false },
      roundRobin: { type: Boolean, default: false },
      defaultStage: { type: String, default: "new" },
      defaultCallType: { type: String, default: "outbound" },
      defaultFollowUpHours: { type: Number, default: 24 },
      lastAssignedCallerId: { type: mongoose.Schema.Types.ObjectId, ref: "Caller" },
    },
    // Singleton pattern - only one settings document
    type: { type: String, default: "global", unique: true },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Settings", settingsSchema)
