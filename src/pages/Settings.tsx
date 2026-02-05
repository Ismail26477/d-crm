"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Mail, Users, Bell, Save, Loader2, Zap, Check } from "lucide-react"
import {
  fetchSettings,
  updateEmailSettings,
  updateLeadAssignmentSettings,
  fetchIntegrations,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
} from "@/lib/api"

const Settings = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [isSavingLead, setIsSavingLead] = useState(false)
  const [integrations, setIntegrations] = useState<Record<string, any>>({})
  const [integrationLoading, setIntegrationLoading] = useState<Record<string, boolean>>({})
  const [showIntegrationModal, setShowIntegrationModal] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    senderEmail: "",
    senderPassword: "",
    enableNotifications: false,
    notifyOnAssignment: false,
    notifyOnStageChange: false,
  })

  const [leadSettings, setLeadSettings] = useState({
    autoAssign: false,
    roundRobin: false,
    defaultStage: "new",
    defaultCallType: "outbound",
    defaultFollowUpHours: 24,
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setError(null)
        const settings = await fetchSettings().catch(() => null)
        const integrationsData = await fetchIntegrations().catch(() => [])

        if (settings) {
          if (settings.emailConfig) {
            setEmailSettings({
              smtpServer: settings.emailConfig.smtpServer || "smtp.gmail.com",
              smtpPort: settings.emailConfig.smtpPort || "587",
              senderEmail: settings.emailConfig.senderEmail || "",
              senderPassword: settings.emailConfig.senderPassword || "",
              enableNotifications: settings.emailConfig.enableNotifications || false,
              notifyOnAssignment: settings.emailConfig.notifyOnAssignment || false,
              notifyOnStageChange: settings.emailConfig.notifyOnStageChange || false,
            })
          }

          if (settings.leadAssignment) {
            setLeadSettings({
              autoAssign: settings.leadAssignment.autoAssign || false,
              roundRobin: settings.leadAssignment.roundRobin || false,
              defaultStage: settings.leadAssignment.defaultStage || "new",
              defaultCallType: settings.leadAssignment.defaultCallType || "outbound",
              defaultFollowUpHours: settings.leadAssignment.defaultFollowUpHours || 24,
            })
          }
        } else {
          setError("Backend API not available. Using default settings.")
        }

        if (integrationsData && Array.isArray(integrationsData)) {
          const integrationsMap: Record<string, any> = {}
          integrationsData.forEach((integration: any) => {
            integrationsMap[integration.type] = integration
          })
          setIntegrations(integrationsMap)
        }
      } catch (error: any) {
        console.error("[v0] Error loading settings:", error)
        setError(error?.message || "Failed to load settings. Backend API may not be available.")
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  const handleSaveEmailSettings = async () => {
    setIsSavingEmail(true)
    try {
      await updateEmailSettings(emailSettings)
      toast({
        title: "Settings saved",
        description: "Email notification settings have been updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error saving email settings:", error)
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleSaveLeadSettings = async () => {
    setIsSavingLead(true)
    try {
      await updateLeadAssignmentSettings(leadSettings)
      toast({
        title: "Settings saved",
        description: "Lead assignment settings have been updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error saving lead settings:", error)
      toast({
        title: "Error",
        description: "Failed to save lead assignment settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingLead(false)
    }
  }

  const handleConnectIntegration = async (type: string, credentials: any) => {
    setIntegrationLoading((prev) => ({ ...prev, [type]: true }))
    try {
      const result = await connectIntegration(type, credentials, {
        autoCreateLeads: true,
        defaultPriority: "warm",
        autoAssign: false,
      })

      setIntegrations((prev) => ({
        ...prev,
        [type]: { ...result.integration },
      }))

      toast({
        title: "Connected",
        description: `${type} integration connected successfully`,
      })
      setShowIntegrationModal(null)
    } catch (error) {
      console.error("[v0] Error connecting integration:", error)
      toast({
        title: "Error",
        description: "Failed to connect integration",
        variant: "destructive",
      })
    } finally {
      setIntegrationLoading((prev) => ({ ...prev, [type]: false }))
    }
  }

  const handleDisconnectIntegration = async (type: string) => {
    setIntegrationLoading((prev) => ({ ...prev, [type]: true }))
    try {
      await disconnectIntegration(type)
      setIntegrations((prev) => ({
        ...prev,
        [type]: { ...prev[type], isConnected: false },
      }))

      toast({
        title: "Disconnected",
        description: `${type} integration disconnected`,
      })
    } catch (error) {
      console.error("[v0] Error disconnecting integration:", error)
      toast({
        title: "Error",
        description: "Failed to disconnect integration",
        variant: "destructive",
      })
    } finally {
      setIntegrationLoading((prev) => ({ ...prev, [type]: false }))
    }
  }

  const handleSyncIntegration = async (type: string) => {
    setIntegrationLoading((prev) => ({ ...prev, [type]: true }))
    try {
      const result = await syncIntegration(type)
      toast({
        title: "Synced",
        description: `Imported ${result.leadsImported} new leads from ${type}`,
      })
    } catch (error) {
      console.error("[v0] Error syncing integration:", error)
      toast({
        title: "Error",
        description: "Failed to sync integration",
        variant: "destructive",
      })
    } finally {
      setIntegrationLoading((prev) => ({ ...prev, [type]: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your CRM preferences</p>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-amber-900">API Connection Issue</h4>
              <p className="text-sm text-amber-700 mt-1">{error}</p>
              <p className="text-xs text-amber-600 mt-2">You can still configure settings locally, but changes may not persist.</p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="w-4 h-4" />
            Lead Assignment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Zap className="w-4 h-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Configuration
              </CardTitle>
              <CardDescription>Configure SMTP settings for sending email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input
                    id="smtp-server"
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpServer: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPort: e.target.value }))}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-email">Sender Email</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings((prev) => ({ ...prev, senderEmail: e.target.value }))}
                    placeholder="noreply@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-password">Sender Password</Label>
                  <Input
                    id="sender-password"
                    type="password"
                    value={emailSettings.senderPassword}
                    onChange={(e) => setEmailSettings((prev) => ({ ...prev, senderPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Email Triggers</h4>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Enable Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Send automated emails for important events</p>
                  </div>
                  <Switch
                    checked={emailSettings.enableNotifications}
                    onCheckedChange={(checked) =>
                      setEmailSettings((prev) => ({ ...prev, enableNotifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Notify on Lead Assignment</p>
                    <p className="text-sm text-muted-foreground">Email caller when a new lead is assigned</p>
                  </div>
                  <Switch
                    checked={emailSettings.notifyOnAssignment}
                    onCheckedChange={(checked) =>
                      setEmailSettings((prev) => ({ ...prev, notifyOnAssignment: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Notify on Stage Change</p>
                    <p className="text-sm text-muted-foreground">Email when lead stage is updated</p>
                  </div>
                  <Switch
                    checked={emailSettings.notifyOnStageChange}
                    onCheckedChange={(checked) =>
                      setEmailSettings((prev) => ({ ...prev, notifyOnStageChange: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="btn-gradient-primary gap-2"
                  onClick={handleSaveEmailSettings}
                  disabled={isSavingEmail}
                >
                  {isSavingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Email Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Assignment Settings */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Lead Assignment Rules
              </CardTitle>
              <CardDescription>Configure how new leads are distributed to your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Auto-assign New Leads</p>
                    <p className="text-sm text-muted-foreground">Automatically assign incoming leads to callers</p>
                  </div>
                  <Switch
                    checked={leadSettings.autoAssign}
                    onCheckedChange={(checked) => setLeadSettings((prev) => ({ ...prev, autoAssign: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Round-robin Assignment</p>
                    <p className="text-sm text-muted-foreground">Distribute leads evenly among active callers</p>
                  </div>
                  <Switch
                    checked={leadSettings.roundRobin}
                    onCheckedChange={(checked) => setLeadSettings((prev) => ({ ...prev, roundRobin: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Lead Stage</Label>
                  <Select
                    value={leadSettings.defaultStage}
                    onValueChange={(value) => setLeadSettings((prev) => ({ ...prev, defaultStage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Lead</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Call Type</Label>
                  <Select
                    value={leadSettings.defaultCallType}
                    onValueChange={(value) => setLeadSettings((prev) => ({ ...prev, defaultCallType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Follow-up Time (hours)</Label>
                  <Input
                    type="number"
                    value={leadSettings.defaultFollowUpHours}
                    onChange={(e) =>
                      setLeadSettings((prev) => ({
                        ...prev,
                        defaultFollowUpHours: Number.parseInt(e.target.value) || 24,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="btn-gradient-primary gap-2" onClick={handleSaveLeadSettings} disabled={isSavingLead}>
                  {isSavingLead ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Lead Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Manage your in-app notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Browser Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Follow-up Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified before scheduled follow-ups</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">New Lead Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when new leads arrive</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Deal Won Celebrations</p>
                  <p className="text-sm text-muted-foreground">Celebrate when deals are closed</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Lead Source Integrations
              </CardTitle>
              <CardDescription>Connect external platforms to automatically import leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Sheets Integration */}
              <IntegrationCard
                type="google_sheets"
                title="Google Sheets"
                description="Import leads from a Google Sheet automatically"
                icon={Zap}
                isConnected={integrations.google_sheets?.isConnected || false}
                isLoading={integrationLoading.google_sheets || false}
                stats={integrations.google_sheets?.stats}
                onConnect={() => setShowIntegrationModal("google_sheets")}
                onDisconnect={() => handleDisconnectIntegration("google_sheets")}
                onSync={() => handleSyncIntegration("google_sheets")}
              />

              {/* Meta Ads Integration */}
              <IntegrationCard
                type="meta_ads"
                title="Meta Ads"
                description="Automatically receive leads from Meta lead forms"
                icon={Zap}
                isConnected={integrations.meta_ads?.isConnected || false}
                isLoading={integrationLoading.meta_ads || false}
                stats={integrations.meta_ads?.stats}
                onConnect={() => setShowIntegrationModal("meta_ads")}
                onDisconnect={() => handleDisconnectIntegration("meta_ads")}
              />

              {/* WhatsApp Integration */}
              <IntegrationCard
                type="whatsapp"
                title="WhatsApp"
                description="Automatically create leads from WhatsApp messages"
                icon={Zap}
                isConnected={integrations.whatsapp?.isConnected || false}
                isLoading={integrationLoading.whatsapp || false}
                stats={integrations.whatsapp?.stats}
                onConnect={() => setShowIntegrationModal("whatsapp")}
                onDisconnect={() => handleDisconnectIntegration("whatsapp")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Modal */}
      {showIntegrationModal && (
        <IntegrationModal
          type={showIntegrationModal}
          onClose={() => setShowIntegrationModal(null)}
          onConnect={handleConnectIntegration}
          isLoading={integrationLoading[showIntegrationModal] || false}
        />
      )}
    </div>
  )
}

// Integration Card Component
const IntegrationCard = ({
  type,
  title,
  description,
  icon: Icon,
  isConnected,
  isLoading,
  stats,
  onConnect,
  onDisconnect,
  onSync,
}: any) => (
  <div className="p-4 rounded-lg border border-border bg-card">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isConnected && <Check className="w-5 h-5 text-green-500" />}
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>

    {isConnected && stats && (
      <div className="mb-3 p-3 rounded bg-muted/50 text-sm space-y-1">
        <p>
          Total leads imported: <span className="font-semibold">{stats.totalLeadsImported}</span>
        </p>
        <p>
          Leads today: <span className="font-semibold">{stats.leadsImportedToday}</span>
        </p>
      </div>
    )}

    <div className="flex gap-2">
      {isConnected ? (
        <>
          {onSync && (
            <Button variant="outline" size="sm" onClick={onSync} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync Now"}
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={onDisconnect} disabled={isLoading}>
            Disconnect
          </Button>
        </>
      ) : (
        <Button className="btn-gradient-primary" size="sm" onClick={onConnect} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
        </Button>
      )}
    </div>
  </div>
)

// Integration Modal Component
const IntegrationModal = ({ type, onClose, onConnect, isLoading }: any) => {
  const [credentials, setCredentials] = useState<any>({})

  const handleConnect = () => {
    onConnect(type, credentials)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="capitalize">{type.replace("_", " ")} Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === "google_sheets" && (
            <>
              <div className="space-y-2">
                <Label>Google Sheets ID</Label>
                <Input
                  placeholder="1a2b3c4d5e6f7g8h9i0j"
                  value={credentials.spreadsheetId || ""}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, spreadsheetId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Sheet Range (optional)</Label>
                <Input
                  placeholder="Sheet1!A:F"
                  value={credentials.sheetRange || "Sheet1!A:F"}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, sheetRange: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Google API Key</Label>
                <Input
                  type="password"
                  placeholder="Your API key"
                  value={credentials.apiKey || ""}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
            </>
          )}

          {type === "meta_ads" && (
            <>
              <div className="space-y-2">
                <Label>Meta Access Token</Label>
                <Input
                  type="password"
                  placeholder="Your Meta access token"
                  value={credentials.accessToken || ""}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ad Account ID</Label>
                <Input
                  placeholder="act_1234567890"
                  value={credentials.adAccountId || ""}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, adAccountId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook Verify Token</Label>
                <Input
                  placeholder="Random string for webhook verification"
                  value={credentials.webhookVerifyToken || ""}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, webhookVerifyToken: e.target.value }))}
                />
              </div>
            </>
          )}

          {type === "whatsapp" && (
            <>
              <div className="space-y-2">
                <Label>WhatsApp Access Token</Label>
                <Input
                  type="password"
                  placeholder="Your WhatsApp access token"
                  value={credentials.whatsappAccessToken || ""}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, whatsappAccessToken: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input
                  placeholder="123456789012345"
                  value={credentials.phoneNumberId || ""}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, phoneNumberId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Business Account ID</Label>
                <Input
                  placeholder="987654321098765"
                  value={credentials.businessAccountId || ""}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, businessAccountId: e.target.value }))}
                />
              </div>
            </>
          )}
        </CardContent>
        <div className="flex gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="btn-gradient-primary" onClick={handleConnect} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Settings
