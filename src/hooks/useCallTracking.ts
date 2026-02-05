'use client';

import { useState, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "./use-toast"

interface CallLogData {
  leadId: string
  callerId: string
  callerName: string
  type: "inbound" | "outbound"
  duration: number
  notes: string
  status: "completed" | "missed" | "cancelled"
  nextFollowUp?: string
}

interface CallSession {
  leadId: string
  startTime: Date
  isActive: boolean
}

export function useCallTracking() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [callSession, setCallSession] = useState<CallSession | null>(null)
  const [isLoggingCall, setIsLoggingCall] = useState(false)

  const startCall = useCallback(
    (leadId: string) => {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        })
        return false
      }

      console.log("[v0] Starting call for lead:", leadId, "by caller:", user.id)
      setCallSession({
        leadId,
        startTime: new Date(),
        isActive: true,
      })

      toast({
        title: "Call Started",
        description: "Call tracking is now active",
      })

      return true
    },
    [user, toast],
  )

  const endCall = useCallback(
    async (callNotes: string, callStatus: "completed" | "missed" | "cancelled" = "completed") => {
      if (!callSession || !user?.id) {
        toast({
          title: "Error",
          description: "No active call session",
          variant: "destructive",
        })
        return false
      }

      setIsLoggingCall(true)

      try {
        const duration = Math.floor((new Date().getTime() - callSession.startTime.getTime()) / 1000)

        console.log("[v0] Logging call - Duration:", duration, "Status:", callStatus)

        const response = await fetch("http://localhost:5000/api/call-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leadId: callSession.leadId,
            callerId: user.id,
            callerName: user.name || user.email,
            type: "outbound",
            duration,
            notes: callNotes,
            status: callStatus,
            nextFollowUp: undefined,
          } as CallLogData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to log call")
        }

        const result = await response.json()
        console.log("[v0] Call logged successfully:", result)

        setCallSession(null)
        toast({
          title: "Call Logged",
          description: `Call duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
        })

        return true
      } catch (error) {
        console.error("[v0] Error logging call:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to log call",
          variant: "destructive",
        })
        return false
      } finally {
        setIsLoggingCall(false)
      }
    },
    [callSession, user, toast],
  )

  const cancelCall = useCallback(() => {
    setCallSession(null)
    toast({
      title: "Call Cancelled",
      description: "Call tracking has been cancelled",
    })
  }, [toast])

  const getCallDuration = useCallback(() => {
    if (!callSession?.isActive) return 0
    return Math.floor((new Date().getTime() - callSession.startTime.getTime()) / 1000)
  }, [callSession])

  return {
    callSession,
    isLoggingCall,
    startCall,
    endCall,
    cancelCall,
    getCallDuration,
    isCallActive: callSession?.isActive ?? false,
  }
}
