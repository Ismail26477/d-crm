"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PhoneOff, Phone } from "lucide-react"

interface CallLoggingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogCall: (notes: string, status: "completed" | "missed" | "cancelled") => Promise<boolean>
  isLoading: boolean
  callDuration: number
}

export function CallLoggingDialog({
  open,
  onOpenChange,
  onLogCall,
  isLoading,
  callDuration,
}: CallLoggingDialogProps) {
  const [notes, setNotes] = useState("")
  const [callStatus, setCallStatus] = useState<"completed" | "missed" | "cancelled">("completed")
  const [displayDuration, setDisplayDuration] = useState(callDuration)

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async () => {
    if (!notes.trim()) {
      return
    }

    const success = await onLogCall(notes, callStatus)
    if (success) {
      setNotes("")
      setCallStatus("completed")
      onOpenChange(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Call</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-accent/50 p-4 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Call Duration</p>
            <p className="text-2xl font-bold font-mono">{formatDuration(displayDuration)}</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Call Status</Label>
            <RadioGroup value={callStatus} onValueChange={(value: any) => setCallStatus(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completed" id="completed" />
                <Label htmlFor="completed" className="font-normal cursor-pointer flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  Completed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="missed" id="missed" />
                <Label htmlFor="missed" className="font-normal cursor-pointer flex items-center gap-2">
                  <PhoneOff className="w-4 h-4 text-red-600" />
                  Missed / No Response
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cancelled" id="cancelled" />
                <Label htmlFor="cancelled" className="font-normal cursor-pointer flex items-center gap-2">
                  <PhoneOff className="w-4 h-4 text-amber-600" />
                  Cancelled
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="call-notes" className="text-sm font-medium">
              Call Notes *
            </Label>
            <Textarea
              id="call-notes"
              placeholder="Add details about the call - what was discussed, next steps, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24 resize-none"
            />
            <p className="text-xs text-muted-foreground">{notes.length} characters</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="bg-transparent"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !notes.trim()} className="gap-2">
            {isLoading ? "Saving..." : "Save Call Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
