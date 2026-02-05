"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Phone, Edit2, Trash2, CheckCircle } from "lucide-react"
import type { Meeting } from "@/types/crm"

interface MeetingCardProps {
  meeting: Meeting
  onEdit?: (meeting: Meeting) => void
  onDelete?: (id: string) => void
  onComplete?: (id: string) => void
}

export const MeetingCard = ({ meeting, onEdit, onDelete, onComplete }: MeetingCardProps) => {
  const getStatusColor = (status: Meeting["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no_show":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const meetingDate = new Date(meeting.scheduledAt)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{meeting.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{meeting.leadName}</p>
          </div>
          <Badge className={getStatusColor(meeting.status)}>{meeting.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{meeting.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              {meetingDate.toLocaleDateString()} at{" "}
              {meetingDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{meeting.duration} minutes</span>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{meeting.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <span>{meeting.leadPhone}</span>
          </div>
        </div>

        {meeting.notes && (
          <div className="bg-muted p-3 rounded text-sm">
            <p className="font-medium mb-1">Notes:</p>
            <p className="text-muted-foreground">{meeting.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {meeting.status === "scheduled" && onComplete && (
            <Button size="sm" variant="default" className="flex-1" onClick={() => onComplete(meeting.id)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(meeting)}>
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" onClick={() => onDelete(meeting.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
