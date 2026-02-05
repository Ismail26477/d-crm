"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SlidersHorizontal, X } from "lucide-react"
import { mockCallers } from "@/data/mockData"

export interface PipelineFilters {
  priority: string
  source: string
  assignedCaller: string
  minValue: number | null
  maxValue: number | null
  searchQuery: string
}

interface AdvancedPipelineFiltersProps {
  filters: PipelineFilters
  onFiltersChange: (filters: PipelineFilters) => void
}

export const AdvancedPipelineFilters = ({ filters, onFiltersChange }: AdvancedPipelineFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<PipelineFilters>(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
  }

  const handleReset = () => {
    const resetFilters: PipelineFilters = {
      priority: "all",
      source: "all",
      assignedCaller: "all",
      minValue: null,
      maxValue: null,
      searchQuery: "",
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const activeFiltersCount = Object.values(localFilters).filter((v) => v !== "all" && v !== "" && v !== null).length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative bg-transparent">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>Filter pipeline deals by multiple criteria</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <Input
              placeholder="Search by name, email, phone..."
              value={localFilters.searchQuery}
              onChange={(e) => setLocalFilters({ ...localFilters, searchQuery: e.target.value })}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={localFilters.priority}
              onValueChange={(value) => setLocalFilters({ ...localFilters, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="hot">🔥 Hot</SelectItem>
                <SelectItem value="warm">☀️ Warm</SelectItem>
                <SelectItem value="cold">❄️ Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={localFilters.source}
              onValueChange={(value) => setLocalFilters({ ...localFilters, source: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="walk_in">Walk-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Caller */}
          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Select
              value={localFilters.assignedCaller}
              onValueChange={(value) => setLocalFilters({ ...localFilters, assignedCaller: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Callers</SelectItem>
                {mockCallers.map((caller) => (
                  <SelectItem key={caller.id} value={caller.id}>
                    {caller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deal Value Range */}
          <div className="space-y-2">
            <Label>Deal Value Range</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Min (₹)"
                  value={localFilters.minValue || ""}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      minValue: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Max (₹)"
                  value={localFilters.maxValue || ""}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      maxValue: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
