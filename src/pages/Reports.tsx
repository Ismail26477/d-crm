"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { leadSourceLabels } from "@/data/mockData"
import { fetchReportStats } from "@/lib/api"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts"
import {
  Download,
  TrendingUp,
  Building2,
  Clock,
  IndianRupee,
  Phone,
  Users,
  CheckCircle2,
  Award,
  PhoneCall,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

const Reports = () => {
  const [dateRange, setDateRange] = useState("30days")
  const [selectedCaller, setSelectedCaller] = useState("all")
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true)
        const data = await fetchReportStats()
        console.log("[v0] Report data loaded:", data)
        setReportData(data)
      } catch (error) {
        console.error("[v0] Error loading report data:", error)
        toast({
          title: "Error loading reports",
          description: "Failed to fetch report data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadReportData()
  }, [])

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  const callerPerformance = reportData.callerPerformance || []
  const sourceData = Object.entries(reportData.sourceData || {}).map(([source, count]) => ({
    name: leadSourceLabels[source] || source,
    value: count,
  }))
  const stageData = reportData.stageData || []
  const monthlyData = reportData.monthlyData || []
  const priorityData = reportData.priorityData || []
  const conversionFunnelData = [
    { stage: "Total Leads", value: reportData.stats?.activeListings || 0, percentage: 100 },
    { stage: "Qualified", value: Math.floor((reportData.stats?.activeListings || 0) * 0.75), percentage: 75 },
    { stage: "Proposal", value: Math.floor((reportData.stats?.activeListings || 0) * 0.5), percentage: 50 },
    { stage: "Negotiation", value: Math.floor((reportData.stats?.activeListings || 0) * 0.3), percentage: 30 },
    { stage: "Won", value: reportData.stats?.soldThisMonth || 0, percentage: 18 },
  ]
  const revenueByCategory = reportData.revenueByCategory || []
  const callAnalytics = reportData.callAnalytics || {}
  const stats = reportData.stats || {}

  const topPerformers = [...callerPerformance].sort((a, b) => b.dealsWon - a.dealsWon).slice(0, 3)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights into your sales performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-bold font-display">{stats.activeListings || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold font-display">
                  {((stats.soldThisMonth / (stats.activeListings || 1)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sold This Month</p>
                <p className="text-2xl font-bold font-display">{stats.soldThisMonth || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Days on Market</p>
                <p className="text-2xl font-bold font-display">{stats.avgDaysOnMarket || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <PhoneCall className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold font-display">{stats.totalCalls || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Callers</p>
                <p className="text-2xl font-bold font-display">{stats.activeCallers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display">Caller Performance Tracking</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Individual caller metrics and work progress</p>
          </div>
          <Select value={selectedCaller} onValueChange={setSelectedCaller}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select caller" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Callers</SelectItem>
              {callerPerformance.map((caller) => (
                <SelectItem key={caller.id} value={caller.id}>
                  {caller.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {callerPerformance
              .filter((cp) => selectedCaller === "all" || cp.id === selectedCaller)
              .map((caller) => (
                <div key={caller.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{caller.name}</h3>
                        <p className="text-sm text-muted-foreground">Performance Overview</p>
                      </div>
                    </div>
                    <Badge variant={caller.conversionRate >= 30 ? "default" : "secondary"}>
                      {caller.conversionRate}% Conversion
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Leads Assigned</p>
                      <p className="text-2xl font-bold">{caller.leadsAssigned}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Calls Made</p>
                      <p className="text-2xl font-bold">{caller.callsMade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deals Won</p>
                      <p className="text-2xl font-bold text-success">{caller.dealsWon}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold text-secondary">{formatCurrency(caller.totalValue)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Avg Call Duration:</span>
                      <span className="font-medium">{caller.avgCallDuration}s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Active Leads:</span>
                      <span className="font-medium">{caller.activeLeads}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Follow-ups Scheduled:</span>
                      <span className="font-medium">{caller.followUpsScheduled}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Work Progress</span>
                      <span className="font-medium">
                        {caller.dealsWon} / {caller.leadsAssigned} closed
                      </span>
                    </div>
                    <Progress value={caller.conversionRate} className="h-2" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-warning" />
            Top Performers This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0
                      ? "bg-warning text-warning-foreground"
                      : index === 1
                        ? "bg-muted-foreground/20 text-foreground"
                        : "bg-primary/20 text-primary"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{performer.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {performer.dealsWon} deals won • {formatCurrency(performer.totalValue)} revenue
                  </p>
                </div>
                <Badge variant="outline">{performer.conversionRate}% CR</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorLeadsReport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(234, 89%, 34%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(234, 89%, 34%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(234, 89%, 34%)"
                  fillOpacity={1}
                  fill="url(#colorLeadsReport)"
                  name="Leads"
                />
                <Area
                  type="monotone"
                  dataKey="deals"
                  stroke="hsl(142, 76%, 36%)"
                  fillOpacity={1}
                  fill="url(#colorDeals)"
                  name="Deals"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Call Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={3}
                  name="Total Calls"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnelData.map((item, index) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.stage}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.value} leads ({item.percentage}%)
                    </span>
                  </div>
                  <div className="relative h-12 rounded-lg overflow-hidden bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        background: `linear-gradient(to right, hsl(270, 100%, 50%), hsl(255, 90%, 60%), hsl(240, 85%, 65%))`,
                        opacity: 1 - index * 0.12,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-bold text-white drop-shadow-lg">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Lead Quality by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis type="category" dataKey="priority" axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(270, 100%, 50%)" radius={[0, 4, 4, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Lead Source Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Call Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Calls</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.totalCalls || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm text-muted-foreground">Completed</span>
                  </div>
                  <p className="text-3xl font-bold">{callAnalytics.completedCalls || 0}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Avg Call Duration</span>
                  <span className="font-bold text-lg">
                    {Math.floor(callAnalytics.avgCallDuration / 60)}m {callAnalytics.avgCallDuration % 60}s
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Follow-ups Scheduled</span>
                  <span className="font-bold text-lg">{callAnalytics.followUpsScheduled || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="font-bold text-lg">
                    {Math.round((callAnalytics.completedCalls / callAnalytics.totalCalls) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stageData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-4">
                {priorityData.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(item.value / reportData.stats?.activeListings) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Reports
