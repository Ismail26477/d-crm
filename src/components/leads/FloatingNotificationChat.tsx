"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, Bot, MapPin, Target, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchLeads } from "@/lib/api"
import type { Lead } from "@/types/crm"
import { differenceInDays } from "date-fns"

interface ChatMessage {
  id: string
  sender: "bot" | "user"
  type: "text" | "lead"
  message?: string
  lead?: Lead
  timestamp: Date
}

export function FloatingNotificationChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [leads, setLeads] = useState<Lead[]>([])
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      type: "text",
      message: "Hey! 👋 I'm your Lead Assistant. Let me show you all your leads one by one.",
      timestamp: new Date(Date.now() - 10 * 60000),
    },
  ])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const data = await fetchLeads()
        setLeads(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to load leads:", error)
        setLoading(false)
      }
    }
    loadLeads()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!isOpen || leads.length === 0) return

    const interval = setInterval(() => {
      setCurrentLeadIndex((prev) => {
        const nextIndex = (prev + 1) % leads.length
        const currentLead = leads[nextIndex]

        // Add lead as a bot message
        const leadMessage: ChatMessage = {
          id: `lead-${currentLead.id}`,
          sender: "bot",
          type: "lead",
          lead: currentLead,
          timestamp: new Date(),
        }
        setMessages((msgs) => [...msgs, leadMessage])

        return nextIndex
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [isOpen, leads])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hot":
        return "bg-red-600 text-white"
      case "warm":
        return "bg-orange-500 text-white"
      case "cold":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "new":
        return "bg-green-100 text-green-700"
      case "qualified":
        return "bg-blue-100 text-blue-700"
      case "proposal":
        return "bg-purple-100 text-purple-700"
      case "negotiation":
        return "bg-orange-100 text-orange-700"
      case "won":
        return "bg-emerald-100 text-emerald-700"
      case "lost":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getLeadAge = (createdAt: string) => {
    const daysOld = differenceInDays(new Date(), new Date(createdAt))
    return daysOld
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      type: "text",
      message: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    setTimeout(() => {
      const botResponses = [
        "Got it! I'll keep tracking that for you.",
        "Thanks! I'm here to help you manage your leads better.",
        "That's noted! Let me know if you need anything else.",
        "Great insight! Keep pushing those leads forward.",
      ]
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]

      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "bot",
        type: "text",
        message: randomResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    }, 800)
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Lead Assistant Pro</h3>
                <p className="text-xs opacity-85">Smart lead management</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/20 text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Loading your leads...</p>
                </div>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-sm">No leads available yet</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.type === "text" ? (
                      <div className={`flex gap-2 max-w-xs ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                        {msg.sender === "bot" && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-xl text-sm ${
                            msg.sender === "user"
                              ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                              : "bg-gray-200 text-gray-900 rounded-bl-none"
                          }`}
                        >
                          <p className="leading-relaxed break-words">{msg.message}</p>
                          <span className={`text-xs mt-1 block opacity-70`}>{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    ) : (
                      msg.lead && (
                        <div className="w-full">
                          <div className="flex gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 p-4 shadow-sm">
                              {/* Lead Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-bold text-gray-900 text-sm">{msg.lead.name}</h4>
                                  <p className="text-xs text-gray-500">📞 {msg.lead.phone}</p>
                                </div>
                                <div
                                  className={`text-xs font-bold px-2 py-1 rounded-full ${getPriorityColor(msg.lead.priority)}`}
                                >
                                  {msg.lead.priority?.toUpperCase()}
                                </div>
                              </div>

                              {/* Lead Details Grid */}
                              <div className="space-y-2 text-xs">
                                {/* City & Stage Row */}
                                <div className="flex gap-2 flex-wrap">
                                  {msg.lead.city && (
                                    <div className="flex items-center gap-1 bg-white rounded px-2 py-1">
                                      <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                      <span className="text-gray-700">{msg.lead.city}</span>
                                    </div>
                                  )}
                                  <div
                                    className={`flex items-center gap-1 rounded px-2 py-1 font-semibold ${getStageColor(msg.lead.stage)}`}
                                  >
                                    <Target className="w-3 h-3 flex-shrink-0" />
                                    {msg.lead.stage?.toUpperCase()}
                                  </div>
                                </div>

                                {/* Age & Caller Row */}
                                <div className="flex gap-2 flex-wrap">
                                  <div className="flex items-center gap-1 bg-white rounded px-2 py-1">
                                    <Clock className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                    <span className="text-gray-700">{getLeadAge(msg.lead.createdAt)} days old</span>
                                  </div>
                                  {msg.lead.assignedCallerName && (
                                    <div className="flex items-center gap-1 bg-white rounded px-2 py-1">
                                      <User className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                      <span className="text-gray-700">{msg.lead.assignedCallerName}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Notes Preview */}
                                {msg.lead.notes && (
                                  <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-gray-600">
                                    <p className="font-semibold text-xs mb-1">📝 Notes:</p>
                                    <p>
                                      {msg.lead.notes.substring(0, 100)}
                                      {msg.lead.notes.length > 100 ? "..." : ""}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-indigo-100">
                                {formatTime(msg.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                className="h-9 rounded-lg text-sm border-gray-300"
              />
              <Button
                size="icon"
                className="h-9 w-9 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-16 rounded-full shadow-xl hover:shadow-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-600 text-white flex items-center justify-center transition-all duration-300 group relative"
      >
        {/* Bot Avatar with animation */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="relative">
            <Bot className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="text-xs font-bold group-hover:text-[9px] transition-all">AI</span>
        </div>

        {/* Floating animation */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .group:hover {
            animation: float 2s ease-in-out infinite;
          }
        `}</style>
      </Button>
    </div>
  )
}
