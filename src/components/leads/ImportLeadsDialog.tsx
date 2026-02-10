"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Lead, LeadSource, LeadStage, LeadPriority, LeadStatus, LeadCategory, LeadSubcategory } from "@/types/crm"
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { leadCategoryLabels, leadSubcategoryLabels, categorySubcategoryMap } from "@/data/mockData"
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
  { key: "category", label: "Category", required: false },
  { key: "subcategory", label: "Subcategory", required: false },
  { key: "projectName", label: "Project Name", required: false },
  { key: "notes", label: "Notes", required: false },
]

const sourceMapping: Record<string, LeadSource> = {
  website: "website",
  web: "website",
  google: "google_ads",
  "google ads": "google_ads",
  ads: "google_ads",
  referral: "referral",
  referred: "referral",
  social: "social_media",
  "social media": "social_media",
  facebook: "social_media",
  instagram: "social_media",
  "walk in": "walk_in",
  walkin: "walk_in",
  "walk-in": "walk_in",
  other: "other",
}

const stageMapping: Record<string, LeadStage> = {
  new: "new",
  "new lead": "new",
  qualified: "qualified",
  proposal: "proposal",
  negotiation: "negotiation",
  won: "won",
  "closed won": "won",
  lost: "lost",
  "closed lost": "lost",
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

  const [defaultCategory, setDefaultCategory] = useState<LeadCategory>("property")
  const [defaultSubcategory, setDefaultSubcategory] = useState<LeadSubcategory>("india_property")

  const availableSubcategories = categorySubcategoryMap[defaultCategory] || []

  useEffect(() => {
    const loadCallers = async () => {
      try {
        const data = await fetchCallers()
        // and made it more resilient by including a fallback check
        const activeUsers = data.filter(
          (u: any) => (u.role === "caller" || u.role === "admin") && u.status !== "inactive",
        )
        console.log("[v0] Loaded active users for assignment:", activeUsers.length)
        setCallers(activeUsers)
      } catch (error) {
        console.error("Error loading callers:", error)
      }
    }
    if (open) {
      loadCallers()
    }
  }, [open])

  useEffect(() => {
    if (defaultCategory && availableSubcategories.length > 0) {
      if (!availableSubcategories.includes(defaultSubcategory)) {
        setDefaultSubcategory(availableSubcategories[0] as LeadSubcategory)
      }
    }
  }, [defaultCategory, availableSubcategories, defaultSubcategory])

  const resetState = () => {
    setStep("upload")
    setFile(null)
    setRawData([])
    setColumns([])
    setColumnMapping({})
    setParsedLeads([])
    setDuplicates(0)
    setIsProcessing(false)
    setAssignmentMode("auto")
    setSelectedCaller("")
    setDefaultCategory("property")
    setDefaultSubcategory("india_property")
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return

      setFile(selectedFile)
      setIsProcessing(true)

      try {
        const data = await selectedFile.arrayBuffer()
        const workbook = XLSX.read(data)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        if (jsonData.length < 2) {
          toast({
            title: "Error",
            description: "File must have at least a header row and one data row",
            variant: "destructive",
          })
          setFile(null)
          setIsProcessing(false)
          return
        }

        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell !== undefined && cell !== ""))

        setColumns(headers.map((h) => String(h || "Unnamed")))
        setRawData(
          rows.map((row) => {
            const obj: Record<string, any> = {}
            headers.forEach((header, idx) => {
              obj[String(header || `Column${idx}`)] = row[idx]
            })
            return obj
          }),
        )

        const autoMapping: Record<string, string> = {}
        headers.forEach((header) => {
          const headerLower = String(header).toLowerCase().trim()
          leadFields.forEach((field) => {
            const fieldLower = field.label.toLowerCase()
            const keyLower = field.key.toLowerCase()
            if (
              headerLower === fieldLower ||
              headerLower === keyLower ||
              headerLower.includes(fieldLower) ||
              headerLower.includes(keyLower)
            ) {
              if (!autoMapping[field.key]) {
                autoMapping[field.key] = String(header)
              }
            }
          })
        })
        setColumnMapping(autoMapping)
        setStep("mapping")
      } catch (error) {
        toast({ title: "Error", description: "Failed to parse file. Please check the format.", variant: "destructive" })
        setFile(null)
      } finally {
        setIsProcessing(false)
      }
    },
    [toast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile &&
        (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls") || droppedFile.name.endsWith(".csv"))
      ) {
        const input = document.createElement("input")
        input.type = "file"
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(droppedFile)
        input.files = dataTransfer.files
        handleFileChange({ target: input } as any)
      } else {
        toast({ title: "Invalid file", description: "Please upload an Excel or CSV file", variant: "destructive" })
      }
    },
    [handleFileChange, toast],
  )

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
        category: defaultCategory,
        subcategory: defaultSubcategory,
      }

      Object.entries(columnMapping).forEach(([fieldKey, columnName]) => {
        const value = row[columnName]
        if (value === undefined || value === null || value === "") return

        switch (fieldKey) {
          case "name":
            lead.name = String(value).trim()
            break
          case "phone":
            lead.phone = String(value).trim()
            break
          case "email":
            lead.email = String(value).trim()
            break
          case "city":
            lead.city = String(value).trim()
            break
          case "value":
            lead.value = Number.parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0
            break
          case "source":
            const sourceLower = String(value).toLowerCase().trim()
            lead.source = sourceMapping[sourceLower] || "other"
            break
          case "stage":
            const stageLower = String(value).toLowerCase().trim()
            lead.stage = stageMapping[stageLower] || "new"
            break
          case "priority":
            const priorityLower = String(value).toLowerCase().trim()
            lead.priority = priorityMapping[priorityLower] || "warm"
            break
          case "projectName":
            lead.projectName = String(value).trim()
            break
          case "notes":
            lead.notes = String(value).trim()
            break
          case "category":
            const categoryValue = String(value).toLowerCase().trim()
            if (categoryValue.includes("property")) lead.category = "property"
            else if (categoryValue.includes("loan")) lead.category = "loans"
            else lead.category = "other"
            break
          case "subcategory":
            const subcategoryValue = String(value).toLowerCase().trim()
            if (subcategoryValue.includes("india")) lead.subcategory = "india_property"
            else if (subcategoryValue.includes("australia")) lead.subcategory = "australia_property"
            else if (subcategoryValue.includes("dubai")) lead.subcategory = "dubai_property"
            else if (subcategoryValue.includes("personal")) lead.subcategory = "personal_loan"
            else if (subcategoryValue.includes("home")) lead.subcategory = "home_loan"
            else if (subcategoryValue.includes("business")) lead.subcategory = "business_loan"
            else lead.subcategory = "other"
            break
        }
      })

      if (!lead.name || !lead.phone) return

      const normalizedPhone = lead.phone.replace(/\s/g, "")
      if (phoneSet.has(normalizedPhone)) {
        dupCount++
        return
      }
      phoneSet.add(normalizedPhone)

      if (assignmentMode === "single" && selectedCaller) {
        const caller = callers.find((c) => c.id === selectedCaller)
        if (caller) {
          lead.assignedCaller = caller.id
          lead.assignedCallerName = caller.name
        }
      }

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

  const requiredFieldsMapped = columnMapping.name && columnMapping.phone

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import Leads from Excel/CSV
          </DialogTitle>
          <DialogDescription>Upload your spreadsheet and map columns to lead fields</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-4">
          {["upload", "mapping", "assignment", "preview", "complete"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["mapping", "assignment", "preview", "complete"].indexOf(step) > i - 1
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {["mapping", "assignment", "preview", "complete"].indexOf(step) > i - 1 ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 4 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1",
                    ["mapping", "assignment", "preview", "complete"].indexOf(step) > i - 1 ? "bg-success" : "bg-muted",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === "upload" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Drop your file here or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports Excel (.xlsx, .xls) and CSV files</p>
              {isProcessing && (
                <div className="mt-4">
                  <Progress value={50} className="w-48 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Processing file...</p>
                </div>
              )}
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-foreground">{file?.name}</p>
                      <p className="text-sm text-muted-foreground">{rawData.length} rows detected</p>
                    </div>
                    <Badge variant={requiredFieldsMapped ? "default" : "destructive"}>
                      {requiredFieldsMapped ? "Ready to proceed" : "Map required fields"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leadFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={columnMapping[field.key] || ""}
                      onValueChange={(value) =>
                        setColumnMapping((prev) => ({
                          ...prev,
                          [field.key]: value === "_none_" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger
                        className={cn(field.required && !columnMapping[field.key] && "border-destructive")}
                      >
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-[300px]">
                        <SelectItem value="_none_">-- Not mapped --</SelectItem>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {rawData.length > 0 && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Sample data (first row):</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(rawData[0])
                        .slice(0, 6)
                        .map(([key, value]) => (
                          <div key={key} className="bg-muted/50 rounded p-2">
                            <span className="text-muted-foreground">{key}:</span>{" "}
                            <span className="font-medium">{String(value || "-")}</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === "assignment" && (
            <div className="space-y-6">
              <Card>
              
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Lead Assignment Options</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choose how to assign the imported leads to callers
                  </p>

                  <RadioGroup value={assignmentMode} onValueChange={(val: "auto" | "single") => setAssignmentMode(val)}>
                    <div className="space-y-4">
                      <div
                        className="flex items-start space-x-3 p-4 rounded-lg border-2 hover:border-primary transition-colors cursor-pointer"
                        onClick={() => setAssignmentMode("auto")}
                      >
                        <RadioGroupItem value="auto" id="auto" className="mt-0.5" />
                        <Label htmlFor="auto" className="flex-1 cursor-pointer">
                          <div className="font-medium mb-1">Auto Assign</div>
                          <p className="text-sm text-muted-foreground">
                            Automatically distribute leads evenly among all active callers
                          </p>
                        </Label>
                      </div>

                      <div
                        className="flex items-start space-x-3 p-4 rounded-lg border-2 hover:border-primary transition-colors cursor-pointer"
                        onClick={() => setAssignmentMode("single")}
                      >
                        <RadioGroupItem value="single" id="single" className="mt-0.5" />
                        <Label htmlFor="single" className="flex-1 cursor-pointer">
                          <div className="font-medium mb-1">Single Caller Assignment</div>
                          <p className="text-sm text-muted-foreground">
                            Assign all imported leads to a specific caller
                          </p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {assignmentMode === "single" && (
                    <div className="mt-6 space-y-2">
                      <Label htmlFor="caller-select">Select Caller</Label>
                      <Select value={selectedCaller} onValueChange={setSelectedCaller}>
                        <SelectTrigger id="caller-select">
                          <SelectValue placeholder="Choose a caller..." />
                        </SelectTrigger>
                        <SelectContent>
                          {callers.map((caller) => (
                            <SelectItem key={caller.id} value={caller.id}>
                              {caller.name} - {caller.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedCaller && (
                        <p className="text-sm text-destructive">Please select a caller to continue</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Card className="flex-1">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-display">{parsedLeads.length}</p>
                      <p className="text-sm text-muted-foreground">Leads to import</p>
                    </div>
                  </CardContent>
                </Card>
                {duplicates > 0 && (
                  <Card className="flex-1">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold font-display">{duplicates}</p>
                        <p className="text-sm text-muted-foreground">Duplicates skipped</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Assignment Method:</p>
                  <Badge variant="secondary">
                    {assignmentMode === "auto"
                      ? "Auto Assign (Distributed Evenly)"
                      : `Assigned to ${callers.find((c) => c.id === selectedCaller)?.name || "Selected Caller"}`}
                  </Badge>
                </CardContent>
              </Card>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedLeads.slice(0, 5).map((lead, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{lead.email || "-"}</TableCell>
                        <TableCell>{lead.city || "-"}</TableCell>
                        <TableCell>{leadCategoryLabels[lead.category || "other"]}</TableCell>
                        <TableCell>{leadSubcategoryLabels[lead.subcategory || "other"]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedLeads.length > 5 && (
                  <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                    And {parsedLeads.length - 5} more leads...
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground mb-2">Import Complete!</h3>
              <p className="text-muted-foreground">Successfully imported {parsedLeads.length} leads</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("assignment")}
                disabled={!requiredFieldsMapped}
                className="btn-gradient-primary"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          {step === "assignment" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={processLeads}
                disabled={assignmentMode === "single" && !selectedCaller}
                className="btn-gradient-primary"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("assignment")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleImport} className="btn-gradient-primary">
                Import {parsedLeads.length} Leads
                <Check className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button onClick={handleClose} className="btn-gradient-primary">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
