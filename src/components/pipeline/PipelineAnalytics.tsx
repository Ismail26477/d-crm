"use client"

import { useMemo } from "react"
import type { Lead, LeadStage } from "@/types/crm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Clock, Target, Users, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { DollarSign } from "lucide-react" // Added DollarSign import

interface PipelineAnalyticsProps {
  leads: Lead[]
}

const stages: LeadStage[] = ["new", "qualified", "proposal", "negotiation", "won", "lost"]

export const PipelineAnalytics = ({ leads }: PipelineAnalyticsProps) => {
  const analytics = useMemo(() => {
    const stageLeads = stages.reduce(
      (acc, stage) => {
        acc[stage] = leads.filter((l) => l.stage === stage)
        return acc
      },
      {} as Record<LeadStage, Lead[]>,
    )

    const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0)
    const wonValue = stageLeads["won"].reduce((sum, lead) => sum + lead.value, 0)
    const lostValue = stageLeads["lost"].reduce((sum, lead) => sum + lead.value, 0)
    const activeValue = totalValue - wonValue - lostValue

    // Conversion rates
    const newToQualified =
      stageLeads["new"].length > 0 ? (stageLeads["qualified"].length / stageLeads["new"].length) * 100 : 0

    const qualifiedToProposal =
      stageLeads["qualified"].length > 0 ? (stageLeads["proposal"].length / stageLeads["qualified"].length) * 100 : 0

    const proposalToWon =
      stageLeads["proposal"].length > 0 ? (stageLeads["won"].length / stageLeads["proposal"].length) * 100 : 0

    const overallWinRate = leads.length > 0 ? (stageLeads["won"].length / leads.length) * 100 : 0

    // Average deal size
    const avgDealSize = leads.length > 0 ? totalValue / leads.length : 0
    const avgWonDealSize = stageLeads["won"].length > 0 ? wonValue / stageLeads["won"].length : 0

    // Pipeline velocity (mock calculation - in real app, use date differences)
    const avgDaysInPipeline = 28 // Mock value
    const dealsAtRisk = leads.filter(
      (l) => ["proposal", "negotiation"].includes(l.stage) && l.priority === "cold",
    ).length

    return {
      totalValue,
      activeValue,
      wonValue,
      avgDealSize,
      avgWonDealSize,
      newToQualified,
      qualifiedToProposal,
      proposalToWon,
      overallWinRate,
      avgDaysInPipeline,
      dealsAtRisk,
      totalDeals: leads.length,
      wonDeals: stageLeads["won"].length,
      lostDeals: stageLeads["lost"].length,
    }
  }, [leads])

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
    return `₹${value.toLocaleString()}`
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Active Lead Count */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Total Active Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{analytics.totalDeals - analytics.wonDeals - analytics.lostDeals}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(analytics.activeValue)} in pipeline
          </p>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="border-l-4 border-l-success">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Win Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground flex items-center gap-2">
            {formatPercent(analytics.overallWinRate)}
            {analytics.overallWinRate > 30 ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.wonDeals} won / {analytics.lostDeals} lost
          </p>
        </CardContent>
      </Card>

      {/* Your Mine / Top Metric Placeholder */}
      <Card className="border-l-4 border-l-warning">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Conversion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatPercent(analytics.newToQualified)}</div>
          <p className="text-xs text-muted-foreground mt-1">New to Qualified</p>
        </CardContent>
      </Card>

      {/* Pipeline Health */}
      <Card className={cn("border-l-4", analytics.dealsAtRisk > 5 ? "border-l-destructive" : "border-l-info")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pipeline Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{analytics.avgDaysInPipeline} days</div>
          <p className="text-xs text-muted-foreground mt-1">{analytics.dealsAtRisk} deals at risk</p>
        </CardContent>
      </Card>
    </div>
  )
}
