"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchBrokers, createBroker, updateBroker, deleteBroker } from "@/lib/api"
import { Broker } from "@/types/crm"
import AddBrokerDialog from "@/components/brokers/AddBrokerDialog"
import EditBrokerDialog from "@/components/brokers/EditBrokerDialog"
import BrokerDetailDrawer from "@/components/brokers/BrokerDetailDrawer"
import { useToast } from "@/hooks/use-toast"

export default function Brokers() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [filteredBrokers, setFilteredBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadBrokers()
  }, [])

  useEffect(() => {
    const filtered = brokers.filter((broker) =>
      broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.phone?.includes(searchTerm) ||
      broker.company?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredBrokers(filtered)
  }, [searchTerm, brokers])

  const loadBrokers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchBrokers()
      setBrokers(data || [])
    } catch (error: any) {
      console.error("Error loading brokers:", error)
      const errorMsg = error?.message || "Failed to load brokers. Backend API may not be available."
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddBroker = async (brokerData: any) => {
    try {
      const newBroker = await createBroker(brokerData)
      setBrokers([newBroker, ...brokers])
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Broker added successfully",
      })
    } catch (error) {
      console.error("Error adding broker:", error)
      toast({
        title: "Error",
        description: "Failed to add broker",
        variant: "destructive",
      })
    }
  }

  const handleUpdateBroker = async (brokerData: any) => {
    if (!selectedBroker) return

    try {
      const updatedBroker = await updateBroker(selectedBroker.id, brokerData)
      setBrokers(brokers.map((b) => (b.id === selectedBroker.id ? updatedBroker : b)))
      setIsEditDialogOpen(false)
      setSelectedBroker(null)
      toast({
        title: "Success",
        description: "Broker updated successfully",
      })
    } catch (error) {
      console.error("Error updating broker:", error)
      toast({
        title: "Error",
        description: "Failed to update broker",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBroker = async (brokerId: string) => {
    if (!confirm("Are you sure you want to delete this broker?")) return

    try {
      await deleteBroker(brokerId)
      setBrokers(brokers.filter((b) => b.id !== brokerId))
      toast({
        title: "Success",
        description: "Broker deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting broker:", error)
      toast({
        title: "Error",
        description: "Failed to delete broker",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Brokers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your broker network and assignments</p>
        </div>
        <Button
          onClick={() => {
            setSelectedBroker(null)
            setIsAddDialogOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Broker
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, email, phone, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-red-900">Failed to Load Brokers</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <Button size="sm" variant="outline" onClick={loadBrokers} className="mt-3 bg-transparent">
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading brokers...</div>
          ) : filteredBrokers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {brokers.length === 0 ? "No brokers yet. Add your first broker!" : "No brokers match your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Commission %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBrokers.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell className="font-medium">{broker.name}</TableCell>
                      <TableCell>{broker.email || "-"}</TableCell>
                      <TableCell>{broker.phone || "-"}</TableCell>
                      <TableCell>{broker.company || "-"}</TableCell>
                      <TableCell>{broker.commissionPercentage}%</TableCell>
                      <TableCell>
                        <Badge variant={broker.status === "active" ? "default" : "secondary"}>
                          {broker.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBroker(broker)
                              setIsDetailDrawerOpen(true)
                            }}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBroker(broker)
                              setIsEditDialogOpen(true)
                            }}
                            className="gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBroker(broker.id)}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddBrokerDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSubmit={handleAddBroker} />
      {selectedBroker && (
        <>
          <EditBrokerDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            broker={selectedBroker}
            onSubmit={handleUpdateBroker}
          />
          <BrokerDetailDrawer
            open={isDetailDrawerOpen}
            onOpenChange={setIsDetailDrawerOpen}
            broker={selectedBroker}
          />
        </>
      )}
    </div>
  )
}

