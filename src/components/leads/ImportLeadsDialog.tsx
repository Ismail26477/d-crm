"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import * as XLSX from "xlsx"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Lead, LeadSource, LeadStage, LeadPriority, LeadStatus } from "@/types/crm"
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { fetchCallers } from "@/lib/api"

interface ImportLeadsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (leads: Partial<Lead>[]) => void
}

type Step = "upload" | "mapping" | "assignment" | "preview" | "complete"

const leadFields = [
  { key: "name", label: "Name", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "email", label: "Email", required: false },
  { key: "city", label: "City", required: false },
  { key: "value", label: "Lead Value", required: false },
  { key: "source", label: "Source", required: false },
  { key: "stage", label: "Stage", required: false },
  { key: "priority", label: "Priority", required: false },
  { key: "status", label: "Status", required: false },
  { key: "projectName", label: "Project Name", required: false },
  { key: "notes", label: "Notes", required: false },
]

const sourceMapping: Record<string, LeadSource> = {
  website: "website",
  google: "google_ads",
  referral: "referral",
  social: "social_media",
  other: "other",
}

const stageMapping: Record<string, LeadStage> = {
  new: "new",
  qualified: "qualified",
  proposal: "proposal",
  negotiation: "negotiation",
  won: "won",
  lost: "lost",
}

const priorityMapping: Record<string, LeadPriority> = {
  hot: "hot",
  warm: "warm",
  cold: "cold",
}

export const ImportLeadsDialog = ({ open, onOpenChange, onImport }: ImportLeadsDialogProps) => {
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [parsedLeads, setParsedLeads] = useState<Partial<Lead>[]>([])
  const [duplicates, setDuplicates] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const [assignmentMode, setAssignmentMode] = useState<"auto" | "single">("auto")
  const [selectedCaller, setSelectedCaller] = useState<string>("")
  const [callers, setCallers] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      fetchCallers().then((data) => {
        setCallers(data.filter((u: any) => u.role === "caller"))
      })
    }
  }, [open])

  const resetState = () => {
    setStep("upload")
    setFile(null)
    setRawData([])
    setColumns([])
    setColumnMapping({})
    setParsedLeads([])
    setDuplicates(0)
    setIsProcessing(false)
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setIsProcessing(true)
    const data = await selectedFile.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

    const headers = json[0] as string[]
    const rows = json.slice(1)

    setColumns(headers)
    setRawData(rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]]))))
    setStep("mapping")
    setIsProcessing(false)
  }, [])

  const processLeads = () => {
    const leads: Partial<Lead>[] = []
    const phoneSet = new Set<string>()
    let dupCount = 0

    rawData.forEach((row, index) => {
      const lead: Partial<Lead> = {
        id: `import_${Date.now()}_${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active" as LeadStatus,
        stage: "new" as LeadStage,
        priority: "warm" as LeadPriority,

        // ✅ ALWAYS DEFAULT
        category: "property",
        subcategory: "india_property",
      }

      Object.entries(columnMapping).forEach(([key, col]) => {
        const val = row[col]
        if (!val) return

        switch (key) {
          case "name": lead.name = String(val); break
          case "phone": lead.phone = String(val); break
          case "email": lead.email = String(val); break
          case "city": lead.city = String(val); break
          case "value": lead.value = Number(val) || 0; break
          case "source": lead.source = sourceMapping[String(val).toLowerCase()] || "other"; break
          case "stage": lead.stage = stageMapping[String(val).toLowerCase()] || "new"; break
          case "priority": lead.priority = priorityMapping[String(val).toLowerCase()] || "warm"; break
          case "projectName": lead.projectName = String(val); break
          case "notes": lead.notes = String(val); break
        }
      })

      if (!lead.name || !lead.phone) return

      const phone = lead.phone.replace(/\s/g, "")
      if (phoneSet.has(phone)) { dupCount++; return }
      phoneSet.add(phone)

      leads.push(lead)
    })

    setDuplicates(dupCount)
    setParsedLeads(leads)
    setStep("preview")
  }

  const handleImport = () => {
    onImport(parsedLeads)
    setStep("complete")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
        </DialogHeader>

        {step === "preview" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedLeads.slice(0,5).map((l, i) => (
                <TableRow key={i}>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.phone}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{l.city}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogFooter>
          {step === "preview" && (
            <Button onClick={handleImport}>Import {parsedLeads.length} Leads</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
