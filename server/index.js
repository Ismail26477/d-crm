import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import leadRoutes from "./routes/leads.js"
import callerRoutes from "./routes/callers.js"
import authRoutes from "./routes/auth.js"
import activityRoutes from "./routes/activities.js"
import callLogRoutes from "./routes/callLogs.js"
import callerStatsRoutes from "./routes/callerStats.js"
import dashboardRoutes from "./routes/dashboard.js"
import reportsRoutes from "./routes/reports.js"
import settingsRoutes from "./routes/settings.js"
import followupRoutes from "./routes/followups.js"
import reminderRoutes from "./routes/reminders.js"
import meetingRoutes from "./routes/meetings.js"
import integrationRoutes from "./routes/integrations.js"
import brokerRoutes from "./routes/brokers.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// CORS configuration for development and production
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? ["https://dcode-crm.vercel.app", "https://*.vercel.app"] 
    : ["http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:5173", "http://127.0.0.1:8080"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI environment variable is not set")
  console.warn("Please add MONGODB_URI to your .env file")
  // Don't exit - let server start and return helpful errors
} else {
  mongoose
    .connect(MONGODB_URI, {})
    .then(async () => {
      console.log("✅ MongoDB Connected Successfully")

      try {
        const Caller = (await import("./models/Caller.js")).default
        const adminExists = await Caller.findOne({ email: "admin@gmail.com" })

        if (!adminExists) {
          await Caller.create({
            username: "admin",
            name: "Admin User",
            email: "admin@gmail.com",
            phone: "+91 98765 43213",
            password: "admin123",
            role: "admin",
            status: "active",
          })
          console.log("✅ Default admin user created successfully")
        } else {
          console.log("✅ Admin user already exists")
        }
      } catch (err) {
        console.error("Error setting up default admin:", err.message)
      }
    })
    .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err.message)
    })
}

// Diagnostic endpoint to check database connection
app.get("/api/health", (req, res) => {
  const mongooseState = mongoose.connection.readyState
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  }
  
  res.json({
    status: "ok",
    mongodb: {
      state: states[mongooseState],
      connected: mongooseState === 1,
    },
    timestamp: new Date().toISOString(),
  })
})

// Test endpoint to create a follow-up directly
app.post("/api/test/create-followup", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "MongoDB not connected",
        state: mongoose.connection.readyState,
      })
    }

    console.log("[v0] TEST: Creating test follow-up...")
    
    // Get first lead
    const lead = await mongoose.model("Lead").findOne()
    if (!lead) {
      return res.status(404).json({ error: "No leads found in database" })
    }

    // Create test follow-up
    const testFollowUp = new (mongoose.model("FollowUp"))({
      leadId: lead._id,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
      reason: "custom",
      type: "call",
      notes: "Test follow-up created",
      createdByName: "Test",
      status: "pending",
    })

    await testFollowUp.save()
    
    // Verify it was saved
    const count = await mongoose.model("FollowUp").countDocuments()
    
    res.json({
      success: true,
      message: "Test follow-up created successfully",
      followUp: testFollowUp,
      totalFollowUps: count,
    })
  } catch (error) {
    console.error("[v0] TEST ERROR:", error)
    res.status(500).json({ error: error.message })
  }
})

// Routes
app.use("/api/leads", leadRoutes)
app.use("/api/callers", callerRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/activities", activityRoutes)
app.use("/api/call-logs", callLogRoutes)
app.use("/api/caller-stats", callerStatsRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/followups", followupRoutes)
app.use("/api/reminders", reminderRoutes)
app.use("/api/meetings", meetingRoutes)
app.use("/api/integrations", integrationRoutes)
app.use("/api/brokers", brokerRoutes)

app.get("/api/health", (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  const hasMongoUri = !!process.env.MONGODB_URI

  res.json({
    status: "ok",
    message: "Server is running",
    database: mongoStatus,
    mongodbConfigured: hasMongoUri,
    nodeEnv: process.env.NODE_ENV || "not-set",
  })
})

app.get("/api/setup-check", async (req, res) => {
  const mongoStatus = mongoose.connection.readyState
  const hasMongoUri = !!process.env.MONGODB_URI

  if (!hasMongoUri) {
    return res.status(400).json({
      error: "MONGODB_URI is not configured",
      message: "Please add MONGODB_URI environment variable to Vercel project settings",
      steps: [
        "1. Go to your Vercel project dashboard",
        "2. Click Settings > Environment Variables",
        "3. Add MONGODB_URI with your MongoDB connection string",
        "4. Redeploy your application",
      ],
    })
  }

  if (mongoStatus !== 1) {
    return res.status(400).json({
      error: "MongoDB is not connected",
      message: "Server is running but cannot connect to MongoDB",
      mongoStatus: mongoStatus,
      mongoStatusName: ["disconnected", "connecting", "connected", "disconnecting"][mongoStatus],
    })
  }

  res.json({
    status: "ready",
    message: "All systems configured and connected",
    database: "connected",
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
