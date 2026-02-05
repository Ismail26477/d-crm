import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import authRoutes from "../server/routes/auth.js"
import callerRoutes from "../server/routes/callers.js"
import activityRoutes from "../server/routes/activities.js"
import leadsRoutes from "../server/routes/leads.js"
import callLogsRoutes from "../server/routes/callLogs.js"
import dashboardRoutes from "../server/routes/dashboard.js"
import settingsRoutes from "../server/routes/settings.js"
import reportsRoutes from "../server/routes/reports.js"
import Caller from "../server/models/Caller.js"
import meetingRoutes from "../server/routes/meetings.js"
import brokersRoutes from "../server/routes/brokers.js"
import followupsRoutes from "../server/routes/followups.js"
import integrationsRoutes from "../server/routes/integrations.js"

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
let mongoConnecting = false
let cachedDb = null

const connectDB = async () => {
  // If already connected, return cached connection
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb
  }

  // Prevent multiple simultaneous connection attempts
  if (mongoConnecting) {
    console.log("[v0] MongoDB connection already in progress, waiting...")
    // Wait for connection to complete
    for (let i = 0; i < 30; i++) {
      if (mongoose.connection.readyState === 1) {
        return cachedDb
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  // Check if MONGODB_URI exists
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI not configured. " +
        "1. Go to https://mongodb.com/cloud/atlas (create free account) " +
        "2. Create a database cluster " +
        "3. Get connection string " +
        "4. Add to Vercel: Settings > Environment Variables > MONGODB_URI",
    )
  }

  try {
    mongoConnecting = true
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    cachedDb = await mongoose.connect(process.env.MONGODB_URI, opts)
    mongoConnecting = false
    console.log("[v0] MongoDB connected successfully")

    await createDefaultAdmin()

    return cachedDb
  } catch (error) {
    mongoConnecting = false
    console.error("[v0] MongoDB connection failed:", error.message)
    throw error
  }
}

const createDefaultAdmin = async () => {
  try {
    const adminExists = await Caller.findOne({ username: "admin" })

    if (!adminExists) {
      console.log("[v0] Creating default admin user...")
      const admin = new Caller({
        username: "admin",
        name: "Administrator",
        email: "admin@gmail.com",
        password: "admin123", // Plain text stored as-is (NOT hashed in current schema)
        role: "admin",
        status: "active",
        phone: "+1234567890",
      })

      await admin.save()
      console.log("[v0] Default admin user created successfully")
    } else {
      console.log("[v0] Admin user already exists")
    }
  } catch (error) {
    console.error("[v0] Error creating default admin:", error.message)
    // Don't fail the entire app if admin creation fails
  }
}

app.use(async (req, res, next) => {
  // Check if this is a health check or setup endpoint
  if (req.path === "/api/health" || req.path === "/api/setup") {
    return next()
  }

  try {
    await connectDB()
    next()
  } catch (error) {
    console.error("[v0] Database connection error:", error.message)
    // Don't crash - return helpful error to client
    return res.status(503).json({
      success: false,
      message: "Database not configured",
      error: error.message,
      setup: "Visit /api/setup for configuration instructions",
    })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1
  res.json({
    status: "ok",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  })
})

// Setup/diagnostics endpoint
app.get("/api/setup", (req, res) => {
  const hasMongoUri = !!process.env.MONGODB_URI
  res.json({
    environment: process.env.NODE_ENV || "production",
    mongoUri: hasMongoUri ? "✓ Configured" : "✗ Missing",
    databaseConnected: mongoose.connection.readyState === 1,
    instructions: hasMongoUri
      ? "MongoDB URI is set. Login should work now. Try: admin@gmail.com / admin123"
      : [
          "1. Create MongoDB Atlas account: https://mongodb.com/cloud/atlas",
          "2. Create free database cluster",
          "3. Get connection string (include password)",
          "4. Go to Vercel Dashboard > Settings > Environment Variables",
          "5. Add: MONGODB_URI = <your_connection_string>",
          "6. Redeploy project",
        ],
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/callers", callerRoutes)
app.use("/api/activities", activityRoutes)
app.use("/api/leads", leadsRoutes)
app.use("/api/call-logs", callLogsRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/meetings", meetingRoutes)
app.use("/api/brokers", brokersRoutes)
app.use("/api/followups", followupsRoutes)
app.use("/api/integrations", integrationsRoutes)

// 404 handler
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error("[v0] Unhandled error:", err)
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Server error",
  })
})

// Export for Vercel serverless
export default app
