import mongoose from "mongoose"

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    city: { type: String },
    value: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ["website", "google_ads", "referral", "social_media", "walk_in", "other"],
      default: "other",
    },
    stage: {
      type: String,
      enum: ["new", "qualified", "proposal", "negotiation", "won", "lost"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "cold",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "paused", "not_interested"],
      default: "active",
    },
    category: {
      type: String,
      enum: ["property", "loans", "other"],
      default: "property",
    },
    subcategory: {
      type: String,
      enum: [
        "india_property",
        "australia_property",
        "dubai_property",
        "personal_loan",
        "home_loan",
        "business_loan",
        "other",
      ],
      default: "india_property",
    },
    assignedCaller: { type: mongoose.Schema.Types.ObjectId, ref: "Caller" },
    assignedCallerName: { type: String },
    assignedBroker: { type: mongoose.Schema.Types.ObjectId, ref: "Broker" },
    assignedBrokerName: { type: String },
    projectName: { type: String },
    nextFollowUp: { type: Date },
    followUpReason: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Lead", leadSchema)
