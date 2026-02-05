import mongoose from "mongoose"

const integrationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["google_sheets", "meta_ads", "whatsapp"],
      required: true,
    },
    // Connection status
    isConnected: { type: Boolean, default: false },
    connectionStatus: {
      type: String,
      enum: ["disconnected", "connecting", "connected", "error"],
      default: "disconnected",
    },
    lastSyncTime: { type: Date },
    lastSyncStatus: { type: String },
    errorMessage: { type: String },

    // Auth credentials (encrypted in production)
    credentials: {
      // For Google Sheets
      spreadsheetId: { type: String },
      sheetRange: { type: String, default: "Sheet1!A:F" },
      apiKey: { type: String },

      // For Meta Ads
      accessToken: { type: String },
      adAccountId: { type: String },
      webhookVerifyToken: { type: String },

      // For WhatsApp
      phoneNumberId: { type: String },
      businessAccountId: { type: String },
      whatsappAccessToken: { type: String },
      webhookUrl: { type: String },
    },

    // Configuration
    config: {
      // Auto-create leads on sync
      autoCreateLeads: { type: Boolean, default: true },
      // Default lead priority for imported leads
      defaultPriority: { type: String, default: "warm" },
      // Auto-assign imported leads
      autoAssign: { type: Boolean, default: false },
      // Sync interval in minutes (for Google Sheets polling)
      syncInterval: { type: Number, default: 15 },
    },

    // Webhook for receiving live data
    webhookUrl: { type: String },
    webhookActive: { type: Boolean, default: false },

    // Lead count stats
    stats: {
      totalLeadsImported: { type: Number, default: 0 },
      leadsImportedToday: { type: Number, default: 0 },
      lastLeadImported: { type: Date },
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Integration", integrationSchema)
