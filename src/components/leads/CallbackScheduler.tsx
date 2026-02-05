"use client"

import { useState } from "react"
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isPast,
  differenceInDays,
} from "date-fns"
import { ChevronLeft, ChevronRight, Bell, Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface ScheduledCallback {
  id: string
  leadId: string
  leadName: string
  scheduledFor: Date
  reason: string
  reminderBefore: "15min" | "1hour" | "1day"
  reminderSent: boolean
  smsReminder: boolean
  emailReminder: boolean
  notes: string
  status: "pending" | "completed" | "missed"
}

interface CallbackSchedulerProps {
  leadId: string
  leadName: string
  leadPhone: string
  leadEmail: string
}

export function CallbackScheduler({ leadId, leadName, leadPhone, leadEmail }: CallbackSchedulerProps) {
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [scheduledCallbacks, setScheduledCallbacks] = useState<ScheduledCallback[]>([])

  const [scheduleForm, setScheduleForm] = useState({
    time: "09:00",
    reason: "on_request" as string,
    reminderBefore: "1hour" as "15min" | "1hour" | "1day",
    reminderSent: false,
    smsReminder: true,
    emailReminder: true,
    notes: "",
  })

  // Calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get callbacks for a specific day
  const getCallbacksForDay = (day: Date) => {
    return scheduledCallbacks.filter((cb) => isSameDay(new Date(cb.scheduledFor), day))
  }

  const handleSelectDate = (day: Date) => {
    if (isPast(new Date(format(day, "yyyy-MM-dd") + "T00:00:00"))) {
      toast({ title: "Cannot schedule in the past", variant: "destructive" })
      return
    }
    setSelectedDate(day)
    setShowScheduleDialog(true)
  }

  const handleScheduleCallback = async () => {
    if (!selectedDate) return

    const scheduledDateTime = new Date(selectedDate)
    const [hours, minutes] = scheduleForm.time.split(":").map(Number)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    const newCallback: ScheduledCallback = {
      id: `callback-${Date.now()}`,
      leadId,
      leadName,
      scheduledFor: scheduledDateTime,
      reason: scheduleForm.reason,
      reminderBefore: scheduleForm.reminderBefore,
      reminderSent: scheduleForm.reminderSent,
      smsReminder: scheduleForm.smsReminder,
      emailReminder: scheduleForm.emailReminder,
      notes: scheduleForm.notes,
      status: "pending",
    }

    setScheduledCallbacks([...scheduledCallbacks, newCallback])
    setShowScheduleDialog(false)
    setSelectedDate(null)
    setScheduleForm({
      time: "09:00",
      reason: "on_request",
      reminderBefore: "1hour",
      reminderSent: false,
      smsReminder: true,
      emailReminder: true,
      notes: "",
    })

    toast({
      title: "Callback scheduled",
      description: `Callback scheduled for ${format(scheduledDateTime, "dd MMM yyyy, hh:mm a")}`,
    })
  }

  const handleSendReminder = async (callbackId: string) => {
    const callback = scheduledCallbacks.find((cb) => cb.id === callbackId)
    if (!callback) return

    const reminders = []
    if (callback.smsReminder) reminders.push("SMS")
    if (callback.emailReminder) reminders.push("Email")

    setScheduledCallbacks(scheduledCallbacks.map((cb) => (cb.id === callbackId ? { ...cb, reminderSent: true } : cb)))

    toast({
      title: "Reminder sent",
      description: `${reminders.join(" & ")} reminder sent to ${leadName}`,
    })
  }

  const handleCompleteCallback = (callbackId: string) => {
    setScheduledCallbacks(scheduledCallbacks.map((cb) => (cb.id === callbackId ? { ...cb, status: "completed" } : cb)))
    toast({ title: "Callback marked as completed" })
  }

  const pendingCallbacks = scheduledCallbacks.filter((cb) => cb.status === "pending")
  const upcomingCallbacks = pendingCallbacks.filter((cb) => !isPast(cb.scheduledFor))
  const overdueCallbacks = pendingCallbacks.filter((cb) => isPast(cb.scheduledFor))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Callback Calendar</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, -32))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, 32))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{format(currentMonth, "MMMM yyyy")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, idx) => {
                    const dayCallbacks = getCallbacksForDay(day)
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isToday = isSameDay(day, new Date())
                    const isOverdue = dayCallbacks.some((cb) => isPast(cb.scheduledFor) && cb.status === "pending")

                    return (
                      <button
                        key={idx}
                        onClick={() => isCurrentMonth && handleSelectDate(day)}
                        disabled={!isCurrentMonth || isPast(new Date(format(day, "yyyy-MM-dd") + "T00:00:00"))}
                        className={`
                          aspect-square p-2 rounded-lg text-sm transition-all relative group
                          ${!isCurrentMonth && "opacity-30 cursor-not-allowed"}
                          ${isPast(new Date(format(day, "yyyy-MM-dd") + "T00:00:00")) && isCurrentMonth && "opacity-50 cursor-not-allowed"}
                          ${isToday && "border-2 border-primary bg-primary/5"}
                          ${isCurrentMonth && !isPast(new Date(format(day, "yyyy-MM-dd") + "T00:00:00")) && !isToday && "border border-border hover:bg-muted cursor-pointer"}
                          ${isOverdue && "bg-orange-50 border-orange-200"}
                          ${dayCallbacks.length > 0 && !isOverdue && "bg-blue-50 border-blue-200"}
                        `}
                      >
                        <div className="font-medium">{format(day, "d")}</div>
                        {dayCallbacks.length > 0 && (
                          <div className="text-xs font-semibold text-primary mt-1">
                            {dayCallbacks.length} callback{dayCallbacks.length !== 1 ? "s" : ""}
                          </div>
                        )}
                        {isOverdue && <AlertCircle className="w-3 h-3 text-orange-600 absolute top-1 right-1" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Callbacks Sidebar */}
        <div className="space-y-4">
          {/* Overdue Alert */}
          {overdueCallbacks.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-orange-900">
                      {overdueCallbacks.length} overdue callback{overdueCallbacks.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-orange-800 mt-1">
                      {Math.max(...overdueCallbacks.map((cb) => differenceInDays(new Date(), cb.scheduledFor)))} days
                      overdue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Callbacks List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Upcoming Callbacks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingCallbacks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No upcoming callbacks scheduled</p>
              ) : (
                upcomingCallbacks.map((callback) => (
                  <div key={callback.id} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-sm">{format(callback.scheduledFor, "MMM dd, hh:mm a")}</p>
                        <Badge variant="secondary" className="text-xs mt-1 capitalize">
                          {callback.reason}
                        </Badge>
                      </div>
                    </div>
                    {callback.notes && <p className="text-xs text-gray-700 mb-2 line-clamp-2">{callback.notes}</p>}
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendReminder(callback.id)}
                        disabled={callback.reminderSent}
                        className="flex-1 text-xs h-7"
                      >
                        <Bell className="w-3 h-3 mr-1" />
                        {callback.reminderSent ? "Sent" : "Remind"}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCompleteCallback(callback.id)}
                        className="flex-1 text-xs h-7"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Callback Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Callback</DialogTitle>
          </DialogHeader>

          {selectedDate && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">{format(selectedDate, "EEEE, MMMM dd, yyyy")}</p>
                <p className="text-xs text-muted-foreground mt-1">for {leadName}</p>
              </div>

              <div>
                <Label htmlFor="callback-time" className="text-xs">
                  Preferred Time
                </Label>
                <Input
                  id="callback-time"
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="callback-reason" className="text-xs">
                  Reason for Callback
                </Label>
                <Select
                  value={scheduleForm.reason}
                  onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger id="callback-reason" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_request">On Request</SelectItem>
                    <SelectItem value="not_picked">Not Picked Up</SelectItem>
                    <SelectItem value="not_reachable">Not Reachable</SelectItem>
                    <SelectItem value="switched_off">Switched Off</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="high_priority">High Priority Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-medium">Send Reminders</p>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sms-reminder"
                    checked={scheduleForm.smsReminder}
                    onCheckedChange={(checked) =>
                      setScheduleForm((prev) => ({ ...prev, smsReminder: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="sms-reminder" className="text-xs cursor-pointer">
                    SMS to {leadPhone}
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="email-reminder"
                    checked={scheduleForm.emailReminder}
                    onCheckedChange={(checked) =>
                      setScheduleForm((prev) => ({ ...prev, emailReminder: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="email-reminder" className="text-xs cursor-pointer">
                    Email to {leadEmail}
                  </Label>
                </div>

                <div>
                  <Label htmlFor="reminder-before" className="text-xs">
                    Remind before
                  </Label>
                  <Select
                    value={scheduleForm.reminderBefore}
                    onValueChange={(value: any) => setScheduleForm((prev) => ({ ...prev, reminderBefore: value }))}
                  >
                    <SelectTrigger id="reminder-before" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">15 minutes before</SelectItem>
                      <SelectItem value="1hour">1 hour before</SelectItem>
                      <SelectItem value="1day">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="callback-notes" className="text-xs">
                  Notes
                </Label>
                <Textarea
                  id="callback-notes"
                  placeholder="Add any notes about this callback..."
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 h-20"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleCallback} className="gap-2">
              <Send className="w-4 h-4" />
              Schedule Callback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
