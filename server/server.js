// Import necessary modules
import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import followupsRouter from "./routes/followups.js"
import brokersRouter from "./routes/brokers.js"
import leadsRouter from "./routes/leads.js"
import callersRouter from "./routes/callers.js"
import activitiesRouter from "./routes/activities.js"
import callLogsRouter from "./routes/callLogs.js"
import meetingsRouter from "./routes/meetings.js"
import dashboardRouter from "./routes/dashboard.js"
import reportsRouter from "./routes/reports.js"
import settingsRouter from "./routes/settings.js"
import authRouter from "./routes/auth.js"
import integrationsRouter from "./routes/integrations.js"

// Create an instance of express
const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS configuration - allow requests from frontend
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/grabdeal"
    console.log("[v0] Attempting to connect to MongoDB:", mongoURI.replace(/\/\/.*:.*@/, "//***:***@"))
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    
    console.log("[v0] MongoDB connected successfully")
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error.message)
    console.log("[v0] Continuing without database connection - mock mode enabled")
  }
}

// Connect to database
connectDB()

// Use routers
app.use("/api/leads", leadsRouter)
app.use("/api/followups", followupsRouter)
app.use("/api/brokers", brokersRouter)
app.use("/api/callers", callersRouter)
app.use("/api/activities", activitiesRouter)
app.use("/api/call-logs", callLogsRouter)
app.use("/api/meetings", meetingsRouter)
app.use("/api/dashboard", dashboardRouter)
app.use("/api/reports", reportsRouter)
app.use("/api/settings", settingsRouter)
app.use("/api/auth", authRouter)
app.use("/api/integrations", integrationsRouter)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected" })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", path: req.path, method: req.method })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[v0] Unhandled error:", err)
  res.status(500).json({ error: "Internal server error", message: err.message })
})

// Start the server
const PORT = process.env.PORT || 5000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[v0] Server is running on port ${PORT}`)
  console.log(`[v0] Frontend should connect to http://localhost:${PORT}/api`)
})
