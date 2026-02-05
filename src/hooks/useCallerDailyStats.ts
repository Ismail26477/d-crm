'use client';

import { useState, useEffect } from "react"

export interface DailyStat {
  date: string
  dayName: string
  callsCount: number
  completedCalls: number
  missedCalls: number
  cancelledCalls: number
  totalDuration: number
  leadsImported: number
  leadsWon: number
  revenue: number
}

export interface TodayStat {
  date: string
  callsCount: number
  completedCalls: number
  missedCalls: number
  cancelledCalls: number
  totalDuration: number
  leadsImported: number
  leadsWon: number
  revenue: number
}

export function useCallerDailyStats(callerId: string | undefined, days: number = 7) {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [todayStats, setTodayStats] = useState<TodayStat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!callerId) {
      setDailyStats([])
      setTodayStats(null)
      return
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("[v0] Fetching daily stats for caller:", callerId)

        // Fetch daily stats
        const dailyResponse = await fetch(
          `http://localhost:5000/api/caller-stats/caller/${callerId}/daily?days=${days}`,
        )
        if (!dailyResponse.ok) throw new Error("Failed to fetch daily stats")
        const daily = await dailyResponse.json()
        console.log("[v0] Daily stats received:", daily)
        setDailyStats(daily)

        // Fetch today's stats
        const todayResponse = await fetch(
          `http://localhost:5000/api/caller-stats/caller/${callerId}/today`,
        )
        if (!todayResponse.ok) throw new Error("Failed to fetch today stats")
        const today = await todayResponse.json()
        console.log("[v0] Today stats received:", today)
        setTodayStats(today)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        console.error("[v0] Error fetching caller stats:", errorMessage)
        setError(errorMessage)
        // Fallback to empty data
        setDailyStats([])
        setTodayStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [callerId, days])

  return { dailyStats, todayStats, isLoading, error }
}
