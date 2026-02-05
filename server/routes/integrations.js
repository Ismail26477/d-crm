import express from "express"
import Integration from "../models/Integration.js"
import Lead from "../models/Lead.js"
import Activity from "../models/Activity.js"
import { autoAssignLead } from "../utils/leadAssignment.js"

const router = express.Router()

// Get all integrations
router.get("/", async (req, res) => {
  try {
    const integrations = await Integration.find(
      {},
      {
        "credentials.apiKey": 0,
        "credentials.accessToken": 0,
        "credentials.whatsappAccessToken": 0,
      },
    )

    res.json(integrations)
  } catch (error) {
    res.status(500).json({ message: "Error fetching integrations", error: error.message })
  }
})

// Get specific integration
router.get("/:type", async (req, res) => {
  try {
    const integration = await Integration.findOne(
      { type: req.params.type },
      {
        "credentials.apiKey": 0,
        "credentials.accessToken": 0,
        "credentials.whatsappAccessToken": 0,
      },
    )

    res.json(integration || { type: req.params.type, isConnected: false })
  } catch (error) {
    res.status(500).json({ message: "Error fetching integration", error: error.message })
  }
})

// Connect/Configure integration
router.post("/:type/connect", async (req, res) => {
  try {
    const { type } = req.params
    const { credentials, config } = req.body

    if (!["google_sheets", "meta_ads", "whatsapp"].includes(type)) {
      return res.status(400).json({ message: "Invalid integration type" })
    }

    let integration = await Integration.findOne({ type })

    if (!integration) {
      integration = new Integration({
        type,
        webhookUrl: `${process.env.API_URL || "http://localhost:5000"}/api/integrations/${type}/webhook`,
      })
    }

    integration.credentials = {
      ...integration.credentials,
      ...credentials,
    }

    integration.config = {
      ...integration.config,
      ...config,
    }

    integration.connectionStatus = "connected"
    integration.isConnected = true

    await integration.save()

    // Log activity
    const activity = new Activity({
      type: "integration_connected",
      description: `${type} integration connected`,
      userName: "System",
    })
    await activity.save()

    res.json({
      message: `${type} integration connected successfully`,
      integration: {
        type: integration.type,
        isConnected: integration.isConnected,
        connectionStatus: integration.connectionStatus,
      },
    })
  } catch (error) {
    console.error("[v0] Error connecting integration:", error)
    res.status(500).json({ message: "Error connecting integration", error: error.message })
  }
})

// Disconnect integration
router.post("/:type/disconnect", async (req, res) => {
  try {
    const { type } = req.params

    const integration = await Integration.findOne({ type })

    if (!integration) {
      return res.status(404).json({ message: "Integration not found" })
    }

    integration.isConnected = false
    integration.connectionStatus = "disconnected"
    integration.credentials = {}

    await integration.save()

    const activity = new Activity({
      type: "integration_disconnected",
      description: `${type} integration disconnected`,
      userName: "System",
    })
    await activity.save()

    res.json({ message: `${type} integration disconnected successfully` })
  } catch (error) {
    res.status(500).json({ message: "Error disconnecting integration", error: error.message })
  }
})

// Sync data from integration (for Google Sheets)
router.post("/:type/sync", async (req, res) => {
  try {
    const { type } = req.params
    const integration = await Integration.findOne({ type })

    if (!integration || !integration.isConnected) {
      return res.status(400).json({ message: "Integration not connected" })
    }

    if (type === "google_sheets") {
      // Placeholder for Google Sheets sync logic
      // In production, use Google Sheets API
      console.log("[v0] Syncing Google Sheets:", integration.credentials.spreadsheetId)

      integration.lastSyncTime = new Date()
      integration.lastSyncStatus = "success"
      await integration.save()

      return res.json({
        message: "Google Sheets synced successfully",
        leadsImported: 0,
      })
    }

    res.status(400).json({ message: "Manual sync not supported for this integration" })
  } catch (error) {
    console.error("[v0] Error syncing integration:", error)
    res.status(500).json({ message: "Error syncing integration", error: error.message })
  }
})

// Webhook for Meta Ads and WhatsApp
router.post("/:type/webhook", async (req, res) => {
  try {
    const { type } = req.params
    const integration = await Integration.findOne({ type })

    if (!integration || !integration.isConnected) {
      return res.status(401).json({ message: "Integration not connected" })
    }

    console.log(`[v0] Webhook received for ${type}:`, req.body)

    let leadData = {}

    if (type === "meta_ads") {
      // Extract lead data from Meta Ads webhook
      const formData = req.body.entry?.[0]?.changes?.[0]?.value?.lead_gen_data
      if (formData) {
        leadData = {
          name: formData.field_data?.find((f) => f.name === "full_name")?.value || "",
          email: formData.field_data?.find((f) => f.name === "email")?.value || "",
          phone: formData.field_data?.find((f) => f.name === "phone_number")?.value || "",
          city: formData.field_data?.find((f) => f.name === "city")?.value || "",
          source: "meta_ads",
        }
      }
    } else if (type === "whatsapp") {
      // Extract lead data from WhatsApp webhook
      const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
      const contact = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]

      if (message && contact) {
        leadData = {
          name: contact.profile?.name || "",
          phone: message.from || "",
          source: "whatsapp",
          notes: message.text?.body || "",
        }
      }
    }

    if (!leadData.name || !leadData.phone) {
      return res.status(400).json({ message: "Invalid lead data" })
    }

    // Auto-assign if configured
    let assignmentResult = null
    if (integration.config.autoAssign) {
      assignmentResult = await autoAssignLead()
      if (assignmentResult) {
        leadData.assignedCaller = assignmentResult.callerId
        leadData.assignedCallerName = assignmentResult.callerName
      }
    }

    // Set default priority
    leadData.priority = integration.config.defaultPriority

    // Create lead
    const lead = new Lead(leadData)
    await lead.save()

    // Update integration stats
    integration.stats.totalLeadsImported += 1
    integration.stats.leadsImportedToday += 1
    integration.stats.lastLeadImported = new Date()
    integration.lastSyncTime = new Date()
    integration.lastSyncStatus = "success"
    await integration.save()

    // Log activity
    const activity = new Activity({
      leadId: lead._id,
      type: "imported",
      description: `Lead imported from ${type}`,
      userName: "System",
    })
    await activity.save()

    console.log("[v0] Lead created from webhook:", lead._id)

    res.status(201).json({
      message: "Lead created successfully",
      leadId: lead._id,
    })
  } catch (error) {
    console.error("[v0] Error processing webhook:", error)
    res.status(500).json({ message: "Error processing webhook", error: error.message })
  }
})

// Verify webhook (for Meta Ads verification)
router.get("/:type/webhook", async (req, res) => {
  try {
    const { type } = req.params
    const integration = await Integration.findOne({ type })

    if (!integration) {
      return res.status(404).json({ message: "Integration not found" })
    }

    const { "hub.mode": mode, "hub.challenge": challenge, "hub.verify_token": token } = req.query

    // Verify webhook token
    if (mode === "subscribe" && token === integration.credentials.webhookVerifyToken) {
      console.log("[v0] Webhook verified for", type)
      res.status(200).send(challenge)
    } else {
      res.status(403).json({ message: "Webhook verification failed" })
    }
  } catch (error) {
    res.status(500).json({ message: "Error verifying webhook", error: error.message })
  }
})

export default router
