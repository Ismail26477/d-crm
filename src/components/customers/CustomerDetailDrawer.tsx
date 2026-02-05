"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import type { Lead } from "@/types/crm"
import {
  X,
  Mail,
  Phone,
  MapPin,
  IndianRupee,
  Calendar,
  Building2,
  TrendingUp,
  Activity,
  MessageSquare,
  Clock,
  CheckCircle2,
  Target,
} from "lucide-react"
import { mockCallLogs, mockActivities } from "@/data/mockData"

interface CustomerDetailDrawerProps {
  customer: Lead | null
  open: boolean
  onClose: () => void
}

export default function CustomerDetailDrawer({ customer, open, onClose }: CustomerDetailDrawerProps) {
  if (!customer) return null

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
    return `₹${value.toLocaleString()}`
  }

  const customerCallLogs = mockCallLogs.filter((log) => log.leadId === customer.id)
  const customerActivities = mockActivities.filter((act) => act.leadId === customer.id)

  // Calculate customer metrics
  const daysSinceClose = Math.floor((Date.now() - new Date(customer.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
  const engagementScore = Math.min(100, customerCallLogs.length * 10 + customerActivities.length * 5)
  const lifetimeValue = customer.value

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-2xl font-bold">{customer.name}</SheetTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Customer
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    lifetimeValue >= 20000000
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : lifetimeValue >= 10000000
                        ? "bg-orange-100 text-orange-700 border-orange-200"
                        : lifetimeValue >= 5000000
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                  }
                >
                  {lifetimeValue >= 20000000
                    ? "VIP Customer"
                    : lifetimeValue >= 10000000
                      ? "High-Value"
                      : lifetimeValue >= 5000000
                        ? "Regular"
                        : "Low-Value"}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Contact Information */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Contact Information
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{customer.city}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal Information */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Deal Information
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IndianRupee className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Deal Value</span>
                    </div>
                    <span className="text-sm font-semibold text-success">{formatCurrency(customer.value)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Project</span>
                    </div>
                    <span className="text-sm font-medium">{customer.projectName || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Closed Date</span>
                    </div>
                    <span className="text-sm">
                      {new Date(customer.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Source</span>
                    </div>
                    <Badge variant="outline">{customer.source.replace("_", " ")}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => window.open(`mailto:${customer.email}`)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => window.open(`tel:${customer.phone}`)}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            {/* Call Logs */}
            {customerCallLogs.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                    Call History
                  </h3>
                  <div className="space-y-4">
                    {customerCallLogs.map((call) => (
                      <div key={call.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {call.type === "outbound" ? "Outbound Call" : "Inbound Call"}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {Math.floor(call.duration / 60)}m {call.duration % 60}s
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{call.notes}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(call.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            {customerActivities.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                    Activity Timeline
                  </h3>
                  <div className="space-y-4">
                    {customerActivities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1">{activity.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{activity.userName}</span>
                            <span>•</span>
                            <span>
                              {new Date(activity.createdAt).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {customerCallLogs.length === 0 && customerActivities.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No activity history available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-4">
            {/* Customer Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lifetime Value</p>
                      <p className="text-lg font-bold">{formatCurrency(lifetimeValue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <p className="text-lg font-bold">{engagementScore}/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Days as Customer</p>
                      <p className="text-lg font-bold">{daysSinceClose}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Interactions</p>
                      <p className="text-lg font-bold">{customerCallLogs.length + customerActivities.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upsell Opportunities */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                  Upsell Opportunities
                </h3>
                <div className="space-y-3">
                  {lifetimeValue >= 10000000 && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-purple-900">Premium Property Portfolio</p>
                          <p className="text-xs text-purple-700 mt-1">
                            High-value customer. Consider presenting luxury property portfolios.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-blue-900">Investment Opportunities</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Customer may be interested in similar properties in {customer.city}.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-green-900">Referral Program</p>
                        <p className="text-xs text-green-700 mt-1">
                          Satisfied customer. Good candidate for referral rewards program.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
