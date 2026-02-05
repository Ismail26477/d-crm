"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Trophy, IndianRupee, Users, TrendingUp, Eye, ChevronRight } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState("all")

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
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "vip"
          ? customer.value >= 20000000
          : activeTab === "high"
            ? customer.value >= 10000000 && customer.value < 20000000
            : customer.value < 5000000

    return matchesSearch && matchesValue && matchesSource && matchesCity && matchesTab
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

  const totalValue = allCustomers.reduce((sum, c) => sum + c.value, 0)
  const avgValue = allCustomers.length > 0 ? totalValue / allCustomers.length : 0
  const vipCount = allCustomers.filter((c) => c.value >= 20000000).length

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
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Customers</h1>
        <p className="text-muted-foreground mt-1">Manage and analyze your customer relationships</p>
      </div>

      {/* Stats */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        <Card className="stat-card-gradient bg-gradient-to-br from-success to-emerald-500 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Customers</p>
                <p className="text-3xl font-bold mt-1 font-display">{allCustomers.length}</p>
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

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
        <div className="flex gap-2 min-w-max pb-2">
          {[
            { id: "all", label: "All Customers", count: allCustomers.length },
            { id: "vip", label: "VIP", count: allCustomers.filter((c) => c.value >= 20000000).length },
            {
              id: "high",
              label: "High-Value",
              count: allCustomers.filter((c) => c.value >= 10000000 && c.value < 20000000).length,
            },
            { id: "regular", label: "Regular", count: allCustomers.filter((c) => c.value < 5000000).length },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={`whitespace-nowrap transition-all ${
                activeTab === tab.id ? "bg-primary text-white" : "bg-background hover:bg-muted"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className={`ml-2 ${activeTab === tab.id ? "bg-white/30 text-white" : ""}`}>
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No customers found</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
              style={{
                borderLeftColor:
                  customer.value >= 20000000
                    ? "#a855f7"
                    : customer.value >= 10000000
                      ? "#f97316"
                      : customer.value >= 5000000
                        ? "#3b82f6"
                        : "#6b7280",
              }}
              onClick={() => handleViewCustomer(customer)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header with name and tier */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-success">{customer.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate text-sm md:text-base">
                            {customer.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{customer.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getTierBadge(customer.value)}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Customer info grid */}
                  <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-muted">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Email</p>
                      <p className="text-xs text-foreground truncate">{customer.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">City</p>
                      <p className="text-xs text-foreground truncate">{customer.city}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Deal Value</p>
                      <p className="text-xs font-semibold text-success">{formatCurrency(customer.value)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Project</p>
                      <p className="text-xs text-foreground truncate">{customer.projectName || "-"}</p>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`mailto:${customer.email}`)
                      }}
                    >
                      <Mail className="w-3.5 h-3.5 mr-1" />
                      Email
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`tel:${customer.phone}`)
                      }}
                    >
                      <Phone className="w-3.5 h-3.5 mr-1" />
                      Call
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewCustomer(customer)
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
