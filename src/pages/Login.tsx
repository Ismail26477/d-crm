"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Shield, Phone } from "lucide-react"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (role: "admin" | "caller") => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const success = await login(email, password, role)
      if (success) {
        toast({
          title: "Welcome back!",
          description: `Logged in as ${role === "admin" ? "Administrator" : "Caller"}`,
        })
        navigate("/dashboard")
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const isConnectionError = error.response?.status === 500

      toast({
        title: isConnectionError ? "Server Error" : "Error",
        description: isConnectionError
          ? error.response?.data?.message || "Database connection failed. Please check MONGODB_URI."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-sidebar)" }} />

      <div className="hidden lg:block absolute top-20 left-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl" />
      <div className="hidden lg:block absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-6 lg:mb-8">
          <div className="flex justify-center mb-3 lg:mb-4">
            <img src="/grabdeal-logo.png" alt="GrabDeal" className="h-24 lg:h-32 w-auto" />
          </div>
          <p className="text-sm lg:text-base text-white/70">AI Powered CRM</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl lg:text-2xl font-display">Welcome Back</CardTitle>
            <CardDescription className="text-sm">Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 lg:mb-6">
                <TabsTrigger value="admin" className="flex items-center gap-2 text-xs lg:text-sm">
                  <Shield className="w-3 h-3 lg:w-4 lg:h-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="caller" className="flex items-center gap-2 text-xs lg:text-sm">
                  <Phone className="w-3 h-3 lg:w-4 lg:h-4" />
                  Caller
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleLogin("admin")
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-sm">
                      Email
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-sm">
                      Password
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-gradient-primary text-sm" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in as Admin"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="caller">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleLogin("caller")
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="caller-email" className="text-sm">
                      Email or Username
                    </Label>
                    <Input
                      id="caller-email"
                      type="text"
                      placeholder="email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caller-password" className="text-sm">
                      Password
                    </Label>
                    <Input
                      id="caller-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-gradient-secondary text-sm" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in as Caller"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-border text-center">
              <p className="text-xs lg:text-sm text-muted-foreground">Default: admin@gmail.com / admin123</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/50 text-xs lg:text-sm mt-4 lg:mt-6">
          © 2025 Grab lead. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default Login
