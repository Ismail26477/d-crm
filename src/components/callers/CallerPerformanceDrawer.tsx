'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Phone, IndianRupee, UserPlus, Calendar, Award, Download, Mail, CheckCircle2, XCircle } from "lucide-react"
import type { Caller } from "@/types/crm"
import { mockLeads, mockCallLogs } from "@/data/mockData"
import { useCallerDailyStats } from "@/hooks/useCallerDailyStats"

interface CallerPerformanceDrawerProps {
  caller: Caller | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CallerPerformanceDrawer({ caller, open, onOpenChange }: CallerPerformanceDrawerProps) {
  const [todayLeads, setTodayLeads] = useState([]);
  const [todayCalls, setTodayCalls] = useState([]);
  const [todayWon, setTodayWon] = useState([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [today, setToday] = useState(new Date().toISOString().split("T")[0]);
  const [todayData, setTodayData] = useState({ leadsImported: 0, callsCount: 0, leadsWon: 0, revenue: 0 });

  const { dailyStats = [], todayStats, isLoading, error } = useCallerDailyStats(caller?.id ?? "", 7);

  useEffect(() => {
    if (!caller) return;

    const callerLeads = mockLeads.filter((l) => l.assignedCaller === caller.id);
    const callerCalls = mockCallLogs.filter((c) => c.callerId === caller.id);
    const wonLeads = callerLeads.filter((l) => l.stage === "won");
    const lostLeads = callerLeads.filter((l) => l.stage === "lost");
    const activeLeads = callerLeads.filter((l) => !["won", "lost"].includes(l.stage));

    setTodayLeads(callerLeads);
    setTodayCalls(callerCalls);
    setTodayWon(wonLeads);
    setTodayRevenue(wonLeads.reduce((sum, l) => sum + l.value, 0));

    setTodayData({
      leadsImported: callerLeads.length,
      callsCount: callerCalls.length,
      leadsWon: wonLeads.length,
      revenue: wonLeads.reduce((sum, l) => sum + l.value, 0),
    });
  }, [caller]);

  if (!caller) return null;

  const leadsByStage = {
    new: todayLeads.filter((l) => l.stage === "new").length,
    contacted: todayLeads.filter((l) => l.stage === "contacted").length,
    qualified: todayLeads.filter((l) => l.stage === "qualified").length,
    negotiation: todayLeads.filter((l) => l.stage === "negotiation").length,
    won: todayWon.length,
    lost: todayLeads.filter((l) => l.stage === "lost").length,
  }

  const stageData = [
    { stage: "New", count: leadsByStage.new, color: "hsl(var(--primary))" },
    { stage: "Contacted", count: leadsByStage.contacted, color: "hsl(var(--secondary))" },
    { stage: "Qualified", count: leadsByStage.qualified, color: "hsl(var(--info))" },
    { stage: "Negotiation", count: leadsByStage.negotiation, color: "hsl(var(--warning))" },
    { stage: "Won", count: leadsByStage.won, color: "hsl(var(--success))" },
    { stage: "Lost", count: leadsByStage.lost, color: "hsl(var(--destructive))" },
  ]

  const dailyTrackingData =
    dailyStats.length > 0
      ? dailyStats.map((stat) => ({
          date: stat.dayName,
          fullDate: stat.date,
          imports: stat.leadsImported,
          calls: stat.callsCount,
          conversions: stat.leadsWon,
          revenue: stat.revenue,
        }))
      : Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toISOString().split("T")[0];
          const dateLeads = todayLeads.filter((l) => l.createdAt.startsWith(dateStr));
          const dateCalls = todayCalls.filter((c) => c.createdAt.startsWith(dateStr));
          const dateWon = dateLeads.filter((l) => l.stage === "won");

          return {
            date: date.toLocaleDateString("en-US", { weekday: "short" }),
            fullDate: dateStr,
            imports: dateLeads.length,
            calls: dateCalls.length,
            conversions: dateWon.length,
            revenue: dateWon.reduce((sum, l) => sum + l.value, 0),
          }
        })

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{caller.name.charAt(0)}</span>
            </div>
            <div>
              <SheetTitle className="text-2xl">{caller.name}</SheetTitle>
              <SheetDescription>{caller.email}</SheetDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge variant={caller.status === "active" ? "default" : "secondary"} className="px-3 py-1">
              {caller.status === "active" ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {caller.role === "admin" ? "Admin" : "Caller"}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="daily" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Daily Tracking</TabsTrigger>
            <TabsTrigger value="leads">Lead Status</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            {/* Today's Highlight Stats */}
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Today's Activity - {new Date().toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <UserPlus className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold text-primary">{todayData.leadsImported}</p>
                  <p className="text-xs text-muted-foreground mt-1">Leads Imported</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <Phone className="w-6 h-6 mx-auto mb-2 text-secondary" />
                  <p className="text-3xl font-bold text-secondary">{todayData.callsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Calls Made</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-success" />
                  <p className="text-3xl font-bold text-success">{todayData.leadsWon}</p>
                  <p className="text-xs text-muted-foreground mt-1">Deals Closed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <IndianRupee className="w-6 h-6 mx-auto mb-2 text-warning" />
                  <p className="text-3xl font-bold text-warning">{formatCurrency(todayData.revenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Revenue</p>
                </div>
              </CardContent>
            </Card>

            {/* Last 7 Days Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Last 7 Days Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyTrackingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="imports"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Lead Imports"
                    />
                    <Line type="monotone" dataKey="calls" stroke="hsl(var(--secondary))" strokeWidth={2} name="Calls" />
                    <Line
                      type="monotone"
                      dataKey="conversions"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      name="Conversions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dailyTrackingData.reverse().map((day) => (
                    <div
                      key={day.fullDate}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{day.date}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(day.fullDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {day.fullDate === new Date().toISOString().split("T")[0] ? "Today" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-primary">{day.imports}</p>
                          <p className="text-xs text-muted-foreground">Imports</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-secondary">{day.calls}</p>
                          <p className="text-xs text-muted-foreground">Calls</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-success">{day.conversions}</p>
                          <p className="text-xs text-muted-foreground">Won</p>
                        </div>
                        <div className="text-center min-w-[60px]">
                          <p className="font-bold text-warning text-xs">{formatCurrency(day.revenue)}</p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            {/* Lead Status Overview */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-success/10 to-background border-success/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Leads</p>
                      <p className="text-3xl font-bold text-success">{todayLeads.filter((l) => !["won", "lost"].includes(l.stage)).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deals Won</p>
                      <p className="text-3xl font-bold text-primary">{todayWon.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-destructive/10 to-background border-destructive/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lost Leads</p>
                      <p className="text-3xl font-bold text-destructive">{todayLeads.filter((l) => l.stage === "lost").length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lead Distribution by Stage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Distribution by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {stageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Stage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stage Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stageData.map((stage) => (
                    <div
                      key={stage.stage}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }}></div>
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg">{stage.count}</span>
                        <span className="text-sm text-muted-foreground">
                          {todayLeads.length > 0 ? `${((stage.count / todayLeads.length) * 100).toFixed(0)}%` : "0%"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weekly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Lead Response Rate</span>
                    <span className="text-sm text-muted-foreground">85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Follow-up Completion</span>
                    <span className="text-sm text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Deal Velocity</span>
                    <span className="text-sm text-muted-foreground">68%</span>
                  </div>
                  <Progress value={68} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayCalls.slice(0, 5).map((call) => {
                    const lead = mockLeads.find((l) => l.id === call.leadId);
                    return (
                      <div key={call.id} className="flex gap-3 pb-4 border-b last:border-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{lead?.name || "Unknown Lead"}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{call.notes}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round(call.duration / 60)} mins • {new Date(call.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                <Mail className="w-4 h-4" />
                Email Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
