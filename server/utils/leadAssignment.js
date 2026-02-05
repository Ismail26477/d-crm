import Caller from "../models/Caller.js"
import Settings from "../models/Settings.js"

export async function autoAssignLead(leadId) {
  try {
    // Get settings
    const settings = await Settings.findOne({ type: "global" })

    if (!settings || !settings.leadAssignment.autoAssign) {
      console.log("[v0] Auto-assign is disabled")
      return null
    }

    // Get all active callers
    const activeCallers = await Caller.find({ status: "active", role: "caller" }).sort({ _id: 1 })

    if (activeCallers.length === 0) {
      console.log("[v0] No active callers available")
      return null
    }

    let selectedCaller

    if (settings.leadAssignment.roundRobin && activeCallers.length > 1) {
      const lastAssignedId = settings.leadAssignment.lastAssignedCallerId

      if (!lastAssignedId) {
        // First assignment - assign to first caller
        selectedCaller = activeCallers[0]
      } else {
        // Find the index of the last assigned caller
        const lastIndex = activeCallers.findIndex((c) => c._id.toString() === lastAssignedId.toString())

        if (lastIndex === -1 || lastIndex === activeCallers.length - 1) {
          // Last assigned caller not found or was the last one - start from beginning
          selectedCaller = activeCallers[0]
        } else {
          // Assign to next caller
          selectedCaller = activeCallers[lastIndex + 1]
        }
      }

      // Update last assigned caller
      settings.leadAssignment.lastAssignedCallerId = selectedCaller._id
      await settings.save()

      console.log("[v0] Round-robin assigned to:", selectedCaller.name)
    } else {
      selectedCaller = activeCallers[0]
      console.log("[v0] Assigned to first active caller:", selectedCaller.name)
    }

    return {
      callerId: selectedCaller._id,
      callerName: selectedCaller.name,
      callerEmail: selectedCaller.email,
    }
  } catch (error) {
    console.error("[v0] Error in auto-assign:", error)
    return null
  }
}
