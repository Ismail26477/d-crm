"use client"

import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Kanban,
  UserCheck,
  BarChart3,
  Settings,
  Phone,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ListTodo,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useSidebarCollapse } from "@/contexts/SidebarContext"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"

const Sidebar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { collapsed, toggleCollapsed } = useSidebarCollapse()
  const isAdmin = user?.role === "admin"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Leads", path: "/leads" },
    { icon: Kanban, label: "Pipeline", path: "/pipeline" },
    { icon: UserCheck, label: "Customers", path: "/customers" },
    { icon: Calendar, label: "Meetings", path: "/meetings" },
    { icon: ListTodo, label: "Follow-ups", path: "/follow-ups" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    ...(isAdmin ? [{ icon: Phone, label: "Callers", path: "/callers" }] : []),
    ...(isAdmin ? [{ icon: Briefcase, label: "Brokers", path: "/brokers" }] : []),
    ...(isAdmin ? [{ icon: Settings, label: "Settings", path: "/settings" }] : []),
  ]

  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden w-10 h-10 rounded-lg bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
      >
        {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-50",
          "lg:translate-x-0", // Always visible on desktop
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full", // Mobile slide in/out
          collapsed ? "w-20" : "w-64",
        )}
        style={{ background: "var(--gradient-sidebar)" }}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-sidebar-border",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/grabdeal-logo.png" alt="GrabDeal Logo" className="w-52 h-56 object-contain" />
              <span className="text-xl font-bold text-white font-display"></span>
            </div>
          )}
          {collapsed && <img src="/grabdeal-logo-small.png" alt="GrabDeal Logo" className="w-70 h-74 object-contain" />}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          <TooltipProvider>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon

              const linkContent = (
                <NavLink
                  to={item.path}
                  className={cn("sidebar-item", isActive && "sidebar-item-active", collapsed && "justify-center px-0")}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.path}>{linkContent}</div>
            })}
          </TooltipProvider>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          {!collapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-accent-foreground">{user.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent",
              collapsed ? "justify-center px-0" : "justify-start",
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>

        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-md items-center justify-center hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </aside>
    </>
  )
}

export default Sidebar
