"use client"

import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import { cn } from "@/lib/utils"
import { Bell, Search, UserPlus, Users, PhoneCall, ArrowUpRight, Clock, ActivityIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSidebarCollapse } from "@/contexts/SidebarContext"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { fetchActivities } from "@/lib/api"
import type { Activity } from "@/types/crm"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"

const MainLayout = () => {
  const { collapsed } = useSidebarCollapse()
  const [activities, setActivities] = useState<Activity[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await fetchActivities()
        setActivities(data.slice(0, 10)) // Get last 10 activities
        // Count activities from last 24 hours as "unread"
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        const recentCount = data.filter((a: Activity) => new Date(a.createdAt).getTime() > oneDayAgo).length
        setUnreadCount(recentCount)
      } catch (error) {
        console.error("Error fetching activities:", error)
      }
    }

    loadActivities()

    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "created":
        return <UserPlus className="w-4 h-4" />
      case "assigned":
        return <Users className="w-4 h-4" />
      case "stage_changed":
        return <ArrowUpRight className="w-4 h-4" />
      case "call_logged":
        return <PhoneCall className="w-4 h-4" />
      case "note_added":
        return <Clock className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "created":
        return "bg-blue-500/10 text-blue-600"
      case "assigned":
        return "bg-purple-500/10 text-purple-600"
      case "stage_changed":
        return "bg-green-500/10 text-green-600"
      case "call_logged":
        return "bg-orange-500/10 text-orange-600"
      case "note_added":
        return "bg-gray-500/10 text-gray-600"
      default:
        return "bg-primary/10 text-primary"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className={cn("transition-all duration-300", "lg:pl-64", collapsed && "lg:pl-20", "pl-0")}>
        <header className="sticky top-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 flex-1 max-w-md ml-12 lg:ml-0">
            {/* Mobile: Logo */}
            <div className="lg:hidden absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <img src="/grabdeal-logo.png" alt="GrabDeal Logo" className="w-29 h-32 object-contain" />
              <span className="font-bold text-foreground font-display"></span>
            </div>

            {/* Desktop: Search bar */}
            <div className="hidden lg:block relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 input-search text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} new` : "No new notifications"}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setUnreadCount(0)}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="p-2">
                    {activities.length > 0 ? (
                      activities.map((activity, index) => (
                        <div key={activity.id}>
                          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}
                            >
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground leading-snug">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{activity.userName || "System"}</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {index < activities.length - 1 && <Separator className="my-1" />}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground text-center">No notifications yet</p>
                        <p className="text-xs text-muted-foreground/70 text-center mt-1">
                          You'll see activity updates here
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View All Activity
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
