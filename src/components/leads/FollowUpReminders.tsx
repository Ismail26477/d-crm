"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow, isPast } from "date-fns"
import { Bell, X, Check, AlertCircle, Clock, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Reminder {
  id: string
  leadId: string
  leadName: string
  leadPhone: string
  followUpTime: Date
  reason: string
  type: "call" | "email" | "sms" | "whatsapp"
  status: "pending" | "dismissed" | "completed"
  reminderTime: Date
  message: string
}

export function FollowUpReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showReminders, setShowReminders] = useState(false)
  const [timeLeft, setTimeLeft] = useState("")

  // Mock data - in production, fetch from API
  useEffect(() => {
    const mockReminders: Reminder[] = [
      {
        id: "rem-1",
        leadId: "lead-1",
        leadName: "John Doe",
        leadPhone: "+91 9999999999",
        followUpTime: new Date(Date.now() + 15 * 60 * 1000), // 15 mins from now
        reason: "Not picked up",
        type: "call",
        status: "pending",
        reminderTime: new Date(Date.now() + 10 * 60 * 1000), // 10 mins from now
        message: "Reminder: Call John Doe in 5 minutes",
      },
      {
        id: "rem-2",
        leadId: "lead-2",
        leadName: "Jane Smith",
        leadPhone: "+91 8888888888",
        followUpTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        reason: "Interested",
        type: "call",
        status: "pending",
        reminderTime: new Date(Date.now() + 55 * 60 * 1000), // 55 mins from now
        message: "Reminder: Call Jane Smith in 5 minutes",
      },
    ]

    setReminders(mockReminders)
  }, [])

  // Update time left for first pending reminder
  useEffect(() => {
    const timer = setInterval(() => {
      const pending = reminders.find((r) => r.status === "pending")
      if (pending && !isPast(pending.followUpTime)) {
        setTimeLeft(formatDistanceToNow(pending.followUpTime, { addSuffix: false }))
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(timer)
  }, [reminders])

  const handleDismiss = (reminderId: string) => {
    setReminders(reminders.map((r) => (r.id === reminderId ? { ...r, status: "dismissed" } : r)))
  }

  const handleComplete = (reminderId: string) => {
    setReminders(reminders.map((r) => (r.id === reminderId ? { ...r, status: "completed" } : r)))
  }

  const pendingReminders = reminders.filter((r) => r.status === "pending")
  const overdueReminders = pendingReminders.filter((r) => isPast(r.followUpTime))
  const upcomingReminders = pendingReminders.filter((r) => !isPast(r.followUpTime))

  return (
    <div className="fixed bottom-6 right-6 z-40 space-y-3 max-w-sm">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowReminders(!showReminders)}
        className={cn(
          "relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110",
          pendingReminders.length > 0
            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
            : "bg-slate-700 text-white hover:bg-slate-800",
        )}
      >
        <Bell className="w-6 h-6" />
        {pendingReminders.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {pendingReminders.length}
          </span>
        )}
      </button>

      {/* Reminders Panel */}
      {showReminders && (
        <Card className="shadow-xl border-0">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Follow-up Reminders</h3>
                <p className="text-xs text-slate-300">
                  {pendingReminders.length} pending follow-up{pendingReminders.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReminders(false)}
                className="text-white h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Overdue Alert */}
            {overdueReminders.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-red-900">
                      {overdueReminders.length} overdue follow-up{overdueReminders.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-red-800 mt-1">Contact these leads immediately</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reminders List */}
            <div className="max-h-96 overflow-y-auto">
              {pendingReminders.length === 0 ? (
                <div className="p-6 text-center">
                  <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {/* Overdue Section */}
                  {overdueReminders.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-red-600 uppercase">Overdue</p>
                      {overdueReminders.map((reminder) => (
                        <div key={reminder.id} className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <p className="font-medium text-sm">{reminder.leadName}</p>
                                <p className="text-xs text-muted-foreground">{reminder.leadPhone}</p>
                              </div>
                              <Badge variant="destructive" className="text-xs">
                                {reminder.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              {reminder.reason}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleComplete(reminder.id)}
                              className="flex-1 text-xs h-7 bg-red-600 hover:bg-red-700"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Call Now
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDismiss(reminder.id)}
                              className="flex-1 text-xs h-7"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upcoming Section */}
                  {upcomingReminders.length > 0 && (
                    <div className="space-y-2">
                      {overdueReminders.length > 0 && (
                        <p className="text-xs font-semibold text-blue-600 uppercase pt-2 border-t">Upcoming</p>
                      )}
                      {upcomingReminders.map((reminder) => (
                        <div key={reminder.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <p className="font-medium text-sm">{reminder.leadName}</p>
                                <p className="text-xs text-muted-foreground">{reminder.leadPhone}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {reminder.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              in {formatDistanceToNow(reminder.followUpTime, { addSuffix: false })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleComplete(reminder.id)}
                              className="flex-1 text-xs h-7"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Done
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDismiss(reminder.id)}
                              className="flex-1 text-xs h-7"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
