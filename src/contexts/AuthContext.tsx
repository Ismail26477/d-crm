"use client"

import type React from "react"
import { createContext, useContext, useState, type ReactNode } from "react"
import type { User, UserRole } from "@/types/crm"
import { login as apiLogin } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("vedavi_user")
    return stored ? JSON.parse(stored) : null
  })

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await apiLogin(email, password)

      const mockUser: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        avatar: undefined,
        callerId: role === "caller" ? response.id : undefined,
      }

      setUser(mockUser)
      localStorage.setItem("vedavi_user", JSON.stringify(mockUser))
      return true
    } catch (error: any) {
      console.error("[v0] Login error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })

      // Re-throw if it's a server error so Login.tsx can show a better message
      if (error.response?.status === 500) {
        throw error
      }
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("vedavi_user")
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
