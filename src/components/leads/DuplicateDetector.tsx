"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Merge, X } from "lucide-react"
import type { Lead } from "@/types/crm"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DuplicateDetectorProps {
  leads: Lead[]
  onMergeDuplicates: (duplicateIds: string[], keepId: string) => void
}

interface DuplicateGroup {
  leads: Lead[]
  reason: string
}

export function DuplicateDetector({ leads, onMergeDuplicates }: DuplicateDetectorProps) {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [showDuplicates, setShowDuplicates] = useState(false)

  useEffect(() => {
    const findDuplicates = () => {
      const duplicateGroups: DuplicateGroup[] = []
      const processed = new Set<string>()

      leads.forEach((lead, index) => {
        if (!lead?.id || processed.has(lead.id)) return

        const matches: Lead[] = []

        leads.slice(index + 1).forEach((otherLead) => {
          if (!otherLead?.id || processed.has(otherLead.id)) return

          // SAFE values from Excel
          const name1 = (lead.name || "").toLowerCase().trim()
          const name2 = (otherLead.name || "").toLowerCase().trim()
          const city1 = (lead.city || "").toLowerCase().trim()
          const city2 = (otherLead.city || "").toLowerCase().trim()
          const phone1 = (lead.phone || "").trim()
          const phone2 = (otherLead.phone || "").trim()
          const email1 = (lead.email || "").toLowerCase().trim()
          const email2 = (otherLead.email || "").toLowerCase().trim()

          // Same phone
          if (phone1 && phone2 && phone1 === phone2) {
            matches.push(otherLead)
            processed.add(otherLead.id)
          }
          // Same email
          else if (email1 && email2 && email1 === email2) {
            matches.push(otherLead)
            processed.add(otherLead.id)
          }
          // Same name & city
          else if (name1 && name2 && city1 && city2 && name1 === name2 && city1 === city2) {
            matches.push(otherLead)
            processed.add(otherLead.id)
          }
        })

        if (matches.length > 0) {
          matches.unshift(lead)
          processed.add(lead.id)

          duplicateGroups.push({
            leads: matches,
            reason:
              (matches[0].phone || "").trim() === (matches[1].phone || "").trim()
                ? "Same phone number"
                : (matches[0].email || "").trim() === (matches[1].email || "").trim()
                ? "Same email address"
                : "Same name and city",
          })
        }
      })

      setDuplicates(duplicateGroups)
    }

    findDuplicates()
  }, [leads])

  if (duplicates.length === 0) return null

  return (
    <>
      <Alert
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setShowDuplicates(true)}
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <span className="font-semibold">
            {duplicates.length} duplicate group(s) detected
          </span>{" "}
          - Click to review and merge
        </AlertDescription>
      </Alert>

      {showDuplicates && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Duplicate Leads Detected
                </CardTitle>
                <CardDescription>
                  Review and merge duplicate entries to keep your data clean
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDuplicates(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {duplicates.map((group, groupIndex) => (
              <Card key={groupIndex}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant="outline"
                      className="text-orange-600 border-orange-600"
                    >
                      {group.reason}
                    </Badge>

                    <Button
                      size="sm"
                      onClick={() => {
                        const keepId = group.leads[0].id
                        const duplicateIds = group.leads
                          .slice(1)
                          .map((l) => l.id)
                        onMergeDuplicates(duplicateIds, keepId)
                      }}
                      className="gap-2"
                    >
                      <Merge className="w-4 h-4" />
                      Merge All
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {group.leads.map((lead, index) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {(lead.name || "?").charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {lead.name || "No Name"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(lead.phone || "No Phone")} •{" "}
                              {(lead.city || "No City")}
                            </p>
                          </div>
                        </div>
                        {index === 0 && <Badge>Keep</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  )
}
