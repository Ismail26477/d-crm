"use client"

import { useState, useEffect } from "react"
import { format, isPast } from "date-fns"
import { Clock, AlertCircle, Phone, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CallbackLead {
  id: string
  name: string
  phone: string
  email: string
  nextCallbackAt?: string
  callbackReason?: string
  callsCount: number
}

export function CallbackDashboard() {
  const [callbacks, setCallbacks] = useState<CallbackLead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - in production, fetch from API
    const mockCallbacks: CallbackLead[] = [
      {
        id: "1",
        name: "John Doe",
        phone: "+91 9999999999",
        email: "john@example.com",
        nextCallbackAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        callbackReason: "Not picked up",
        callsCount: 2,
      },
      {
        id: "2",
        name: "Jane Smith",
        phone: "+91 8888888888",
        email: "jane@example.com",
        nextCallbackAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
        callbackReason: "Interested",
        callsCount: 1,
      },
    ]
    setCallbacks(mockCallbacks)
    setIsLoading(false)
  }, [])

  const overdue = callbacks.filter((cb) => cb.nextCallbackAt && isPast(new Date(cb.nextCallbackAt)))
  const upcoming = callbacks.filter((cb) => cb.nextCallbackAt && !isPast(new Date(cb.nextCallbackAt)))

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{callbacks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Callbacks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{overdue.length}</div>
              <p className="text-xs text-orange-700 mt-1">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{upcoming.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            {overdue.length} callback{overdue.length !== 1 ? "s" : ""} overdue. Prioritize these leads!
          </AlertDescription>
        </Alert>
      )}

      {/* Overdue Callbacks */}
      {overdue.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Overdue Callbacks</h3>
          <div className="space-y-2">
            {overdue.map((callback) => (
              <Card key={callback.id} className="border-orange-200 bg-orange-50">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{callback.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {callback.callbackReason}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {callback.callsCount} call{callback.callsCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="default" className="gap-2">
                      <Phone className="w-4 h-4" />
                      Call Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Callbacks */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Upcoming Callbacks</h3>
          <div className="space-y-2">
            {upcoming.map((callback) => (
              <Card key={callback.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{callback.name}</p>
                      {callback.nextCallbackAt && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(callback.nextCallbackAt), "dd MMM, hh:mm a")}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {callback.callbackReason}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Callbacks */}
      {callbacks.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No callbacks scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Schedule callbacks to manage lead follow-ups</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
