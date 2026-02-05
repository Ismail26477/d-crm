"use client"

import { useState, useEffect } from "react"
import { X, Mail, Phone, Building, Percent, Calendar, AlertCircle } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Broker, Lead } from "@/types/crm"
import { fetchBrokerLeads } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface BrokerDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  broker: Broker | null
}

export default function BrokerDetailDrawer({ open, onOpenChange, broker }: BrokerDetailDrawerProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && broker) {
      loadBrokerLeads()
    }
  }, [open, broker])

  const loadBrokerLeads = async () => {
    if (!broker) return

    try {
      setLoading(true)
      const data = await fetchBrokerLeads(broker.id)
      setLeads(data)
    } catch (error) {
      console.error("Error loading broker leads:", error)
      toast({
        title: "Error",
        description: "Failed to load related leads",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!broker) return null

  const createdDate = new Date(broker.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-2xl">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-2xl">{broker.name}</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">{broker.company}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto max-h-[calc(100vh-120px)] p-6 space-y-6">
          {/* Broker Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Broker Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{broker.email || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{broker.phone || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{broker.company || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Percent className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="font-medium">{broker.commissionPercentage}%</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{createdDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={broker.status === "active" ? "default" : "secondary"}>
                      {broker.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {broker.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{broker.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Leads Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Related Leads ({leads.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No leads assigned to this broker yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.stage}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                lead.priority === "hot"
                                  ? "destructive"
                                  : lead.priority === "warm"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {lead.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">₹{lead.value.toLocaleString("en-IN")}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
