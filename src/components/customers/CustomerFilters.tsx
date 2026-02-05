"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, Filter, Download, Mail } from "lucide-react"

interface CustomerFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  valueFilter: string
  onValueFilterChange: (value: string) => void
  sourceFilter: string
  onSourceFilterChange: (value: string) => void
  cityFilter: string
  onCityFilterChange: (value: string) => void
  onExport: () => void
  onBulkEmail: () => void
  activeFiltersCount: number
  onClearFilters: () => void
}

export default function CustomerFilters({
  searchQuery,
  onSearchChange,
  valueFilter,
  onValueFilterChange,
  sourceFilter,
  onSourceFilterChange,
  cityFilter,
  onCityFilterChange,
  onExport,
  onBulkEmail,
  activeFiltersCount,
  onClearFilters,
}: CustomerFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, city..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Value Filter */}
          <Select value={valueFilter} onValueChange={onValueFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="vip">VIP (₹20L+)</SelectItem>
              <SelectItem value="high">High-Value (₹10L+)</SelectItem>
              <SelectItem value="regular">Regular (₹5L+)</SelectItem>
              <SelectItem value="low">Low-Value (&lt;₹5L)</SelectItem>
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Sources" />
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

          {/* City Filter */}
          <Select value={cityFilter} onValueChange={onCityFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="Mumbai">Mumbai</SelectItem>
              <SelectItem value="Delhi">Delhi</SelectItem>
              <SelectItem value="Bangalore">Bangalore</SelectItem>
              <SelectItem value="Hyderabad">Hyderabad</SelectItem>
              <SelectItem value="Chennai">Chennai</SelectItem>
              <SelectItem value="Pune">Pune</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Filter className="w-3 h-3" />
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
                </Badge>
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 px-2">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBulkEmail} className="gap-2 bg-transparent">
              <Mail className="w-4 h-4" />
              Bulk Email
            </Button>
            <Button variant="outline" size="sm" onClick={onExport} className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
