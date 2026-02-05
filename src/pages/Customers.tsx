"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Trophy, IndianRupee, Users, TrendingUp, Eye, ArrowUpDown, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import type { Lead } from "@/types/crm"
import CustomerDetailDrawer from "@/components/customers/CustomerDetailDrawer"
import CustomerFilters from "@/components/customers/CustomerFilters"
import { BulkCampaignDialog } from "@/components/leads/BulkCampaignDialog"
import { useToast } from "@/hooks/use-toast"
import { fetchLeads } from "@/lib/api"

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [valueFilter, setValueFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "value" | "date">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false)
  const { toast } = useToast()
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true)
        const data = await fetchLeads()
        console.log("[v0] Fetched leads for customers:", data)
        setAllLeads(data)
      } catch (error) {
        console.error("[v0] Error fetching leads:", error)
        toast({
          title: "Error",
          description: "Failed to load customers data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadLeads()
  }, [toast])

  const allCustomers = allLeads.filter((lead) => lead.stage === "won")

  let customers = allCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.city.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesValue =
      valueFilter === "all"
        ? true
        : valueFilter === "vip"
          ? customer.value >= 20000000
          : valueFilter === "high"
            ? customer.value >= 10000000 && customer.value < 20000000
            : valueFilter === "regular"
              ? customer.value >= 5000000 && customer.value < 10000000
              : customer.value < 5000000

    const matchesSource = sourceFilter === "all" ? true : customer.source === sourceFilter
    const matchesCity = cityFilter === "all" ? true : customer.city === cityFilter

    return matchesSearch && matchesValue && matchesSource && matchesCity
  })

  customers = [...customers].sort((a, b) => {
    let comparison = 0
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy === "value") {
      comparison = a.value - b.value
    } else if (sortBy === "date") {
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  const totalValue = customers.reduce((sum, c) => sum + c.value, 0)
  const avgValue = customers.length > 0 ? totalValue / customers.length : 0
  const vipCount = customers.filter((c) => c.value >= 20000000).length

  const activeFiltersCount = [
    searchQuery !== "",
    valueFilter !== "all",
    sourceFilter !== "all",
    cityFilter !== "all",
  ].filter(Boolean).length

  const handleClearFilters = () => {
    setSearchQuery("")
    setValueFilter("all")
    setSourceFilter("all")
    setCityFilter("all")
  }

  const handleSort = (column: "name" | "value" | "date") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "City", "Project", "Deal Value", "Closed Date", "Source"]
    const rows = customers.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.city,
      c.projectName || "-",
      c.value.toString(),
      new Date(c.updatedAt).toLocaleDateString(),
      c.source,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customers_${new Date().toISOString().split("T")[0]}.csv`
    a.click()

    toast({
      title: "Export Successful",
      description: `Exported ${customers.length} customers to CSV`,
    })
  }

  const handleViewCustomer = (customer: Lead) => {
    setSelectedCustomer(customer)
    setDrawerOpen(true)
  }

  const getTierBadge = (value: number) => {
    if (value >= 20000000) {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200">VIP</Badge>
    } else if (value >= 10000000) {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">High-Value</Badge>
    } else if (value >= 5000000) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Regular</Badge>
    }
    return <Badge variant="outline">Low-Value</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Customers</h1>
        <p className="text-muted-foreground mt-1">Manage and analyze your customer relationships</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card-gradient bg-gradient-to-br from-success to-emerald-500 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Customers</p>
                <p className="text-3xl font-bold mt-1 font-display">{customers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card-gradient bg-gradient-to-br from-secondary to-orange-500 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Revenue</p>
                <p className="text-3xl font-bold mt-1 font-display">{formatCurrency(totalValue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card-gradient bg-gradient-to-br from-primary to-purple-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Avg. Deal Size</p>
                <p className="text-3xl font-bold mt-1 font-display">{formatCurrency(avgValue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card-gradient bg-gradient-to-br from-purple-600 to-pink-500 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">VIP Customers</p>
                <p className="text-3xl font-bold mt-1 font-display">{vipCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <CustomerFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        valueFilter={valueFilter}
        onValueFilterChange={setValueFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        onExport={handleExport}
        onBulkEmail={() => setBulkEmailOpen(true)}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
      />

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Tier</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      onClick={() => handleSort("name")}
                    >
                      Customer
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      onClick={() => handleSort("value")}
                    >
                      Deal Value
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 -ml-2 hover:bg-transparent"
                      onClick={() => handleSort("date")}
                    >
                      Closed Date
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewCustomer(customer)}
                  >
                    <TableCell>{getTierBadge(customer.value)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-success">{customer.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{customer.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{customer.city}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{customer.projectName || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-success">{formatCurrency(customer.value)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {new Date(customer.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewCustomer(customer)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`mailto:${customer.email}`)
                          }}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`tel:${customer.phone}`)
                          }}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="space-y-3">
          {customers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
              style={{
                borderLeftColor:
                  customer.value >= 20000000
                    ? "#9333ea"
                    : customer.value >= 10000000
                      ? "#ea580c"
                      : customer.value >= 5000000
                        ? "#2563eb"
                        : "#999999",
              }}
              onClick={() => handleViewCustomer(customer)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-success">{customer.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer.city}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">{getTierBadge(customer.value)}</div>
                </div>

                <div className="flex items-center justify-between mb-3 pb-3 border-b">
                  <span className="text-sm text-muted-foreground">Deal Value</span>
                  <span className="font-bold text-success text-sm">{formatCurrency(customer.value)}</span>
                </div>

                <div className="flex items-center justify-between mb-3 pb-3 border-b">
                  <span className="text-xs text-muted-foreground">Project</span>
                  <span className="text-xs font-medium truncate">{customer.projectName || "-"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(customer.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}

          {customers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">No customers found</CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedCustomer(null)
        }}
      />

      {/* Bulk Email Dialog */}
      <BulkCampaignDialog
        open={bulkEmailOpen}
        onOpenChange={setBulkEmailOpen}
        selectedCount={customers.length}
        onSend={(type, data) => {
          toast({
            title: "Campaign Sent",
            description: `${type === "email" ? "Email" : "SMS"} sent to ${customers.length} customers`,
          })
          setBulkEmailOpen(false)
        }}
      />
    </div>
  )
}

export default Customers
