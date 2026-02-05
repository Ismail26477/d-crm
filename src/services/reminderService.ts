export interface ReminderConfig {
  enableBrowserNotifications: boolean
  enableEmailNotifications: boolean
  enableSMSNotifications: boolean
  reminderTimes: ("15min" | "1hour" | "1day")[]
}

export class ReminderService {
  private config: ReminderConfig = {
    enableBrowserNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    reminderTimes: ["1hour", "1day"],
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("[v0] Browser notifications not supported")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  }

  /**
   * Send browser notification
   */
  sendBrowserNotification(title: string, options?: NotificationOptions): void {
    if (!this.config.enableBrowserNotifications || Notification.permission !== "granted") {
      console.log("[v0] Browser notifications not enabled")
      return
    }

    try {
      new Notification(title, {
        icon: "/grabdeal-logo-small.png",
        badge: "/grabdeal-logo-small.png",
        ...options,
      })
    } catch (error) {
      console.error("[v0] Error sending notification:", error)
    }
  }

  /**
   * Send follow-up reminder via email
   */
  async sendEmailReminder(
    email: string,
    leadName: string,
    followUpDetails: { reason: string; type: string; time: string },
  ): Promise<boolean> {
    if (!this.config.enableEmailNotifications) {
      return false
    }

    try {
      const response = await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          type: "follow-up-reminder",
          data: {
            leadName,
            ...followUpDetails,
          },
        }),
      })

      return response.ok
    } catch (error) {
      console.error("[v0] Error sending email reminder:", error)
      return false
    }
  }

  /**
   * Send follow-up reminder via SMS
   */
  async sendSMSReminder(phone: string, leadName: string, followUpTime: string): Promise<boolean> {
    if (!this.config.enableSMSNotifications) {
      return false
    }

    try {
      const response = await fetch("/api/notifications/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: `Reminder: Follow-up with ${leadName} at ${followUpTime}`,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("[v0] Error sending SMS reminder:", error)
      return false
    }
  }

  /**
   * Schedule reminders for a follow-up
   */
  async scheduleReminders(
    leadId: string,
    leadName: string,
    followUpTime: Date,
    reminderTimes: ("15min" | "1hour" | "1day")[] = this.config.reminderTimes,
  ): Promise<void> {
    reminderTimes.forEach((time) => {
      let remindTime: Date

      switch (time) {
        case "15min":
          remindTime = new Date(followUpTime.getTime() - 15 * 60 * 1000)
          break
        case "1hour":
          remindTime = new Date(followUpTime.getTime() - 60 * 60 * 1000)
          break
        case "1day":
          remindTime = new Date(followUpTime.getTime() - 24 * 60 * 60 * 1000)
          break
      }

      // Store reminder in database
      this.storeReminder(leadId, leadName, followUpTime, remindTime)
    })
  }

  /**
   * Store reminder in database
   */
  private async storeReminder(leadId: string, leadName: string, followUpTime: Date, remindTime: Date): Promise<void> {
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          leadName,
          followUpTime,
          remindTime,
          status: "pending",
        }),
      })
    } catch (error) {
      console.error("[v0] Error storing reminder:", error)
    }
  }

  /**
   * Get pending reminders
   */
  async getPendingReminders(): Promise<any[]> {
    try {
      const response = await fetch("/api/reminders?status=pending")
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("[v0] Error fetching reminders:", error)
    }
    return []
  }

  /**
   * Check and send due reminders
   */
  async checkAndSendReminders(): Promise<void> {
    const reminders = await this.getPendingReminders()
    const now = new Date()

    for (const reminder of reminders) {
      const remindTime = new Date(reminder.remindTime)

      if (remindTime <= now) {
        // Send notifications
        this.sendBrowserNotification(`Follow-up Reminder: ${reminder.leadName}`, {
          body: `Time to contact ${reminder.leadName} about ${reminder.reason}`,
          tag: `reminder-${reminder.id}`,
          requireInteraction: true,
        })

        // Mark as sent
        await fetch(`/api/reminders/${reminder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reminderSent: true }),
        })
      }
    }
  }

  /**
   * Set up auto-check interval
   */
  startAutoReminders(intervalMs = 60000): NodeJS.Timeout {
    return setInterval(() => {
      this.checkAndSendReminders()
    }, intervalMs)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReminderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): ReminderConfig {
    return { ...this.config }
  }
}

// Singleton instance
export const reminderService = new ReminderService()
