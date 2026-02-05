import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Target, Upload, CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface IntegrationImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: any[]) => void;
}

export const IntegrationImportDialog = ({ open, onOpenChange, onImport }: IntegrationImportDialogProps) => {
  const { toast } = useToast();
  
  const [integrations, setIntegrations] = useState({
    googleSheets: { connected: false, sheetUrl: '', lastSync: null as string | null },
    metaAds: { connected: false, accessToken: '', adAccountId: '', lastSync: null as string | null },
    googleAds: { connected: false, customerId: '', developerToken: '', lastSync: null as string | null },
  });

  const [isImporting, setIsImporting] = useState<string | null>(null);

  const handleSaveIntegration = (integration: string) => {
    toast({ title: 'Integration saved', description: `${integration} configuration has been saved` });
  };

  const handleImportLeads = async (source: string) => {
    setIsImporting(source);
    
    // Simulate import process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const now = new Date().toLocaleString();
    
    if (source === 'googleSheets') {
      setIntegrations(prev => ({
        ...prev,
        googleSheets: { ...prev.googleSheets, connected: true, lastSync: now }
      }));
    } else if (source === 'metaAds') {
      setIntegrations(prev => ({
        ...prev,
        metaAds: { ...prev.metaAds, connected: true, lastSync: now }
      }));
    } else if (source === 'googleAds') {
      setIntegrations(prev => ({
        ...prev,
        googleAds: { ...prev.googleAds, connected: true, lastSync: now }
      }));
    }
    
    setIsImporting(null);
    
    // Simulate imported leads
    const mockImportedLeads = [
      { name: 'Imported Lead 1', phone: '+91 98765 43210', email: 'lead1@example.com', city: 'Mumbai' },
      { name: 'Imported Lead 2', phone: '+91 98765 43211', email: 'lead2@example.com', city: 'Delhi' },
    ];
    
    onImport(mockImportedLeads);
    
    toast({ 
      title: 'Import complete', 
      description: `Successfully imported leads from ${source === 'googleSheets' ? 'Google Sheets' : source === 'metaAds' ? 'Meta Ads' : 'Google Ads'}` 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-y-auto"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display">Import from Integrations</DialogTitle>
          <DialogDescription>
            Connect and import leads from Google Sheets, Meta Ads, or Google Ads
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Google Sheets */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FileSpreadsheet className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-display">Google Sheets</CardTitle>
                    <CardDescription className="text-xs">Import leads from a Google Spreadsheet</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations.googleSheets.connected ? "default" : "secondary"} className="text-xs">
                  {integrations.googleSheets.connected ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" /> Not Connected</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="sheet-url" className="text-sm">Google Sheet URL</Label>
                <Input
                  id="sheet-url"
                  value={integrations.googleSheets.sheetUrl}
                  onChange={(e) => setIntegrations(prev => ({
                    ...prev,
                    googleSheets: { ...prev.googleSheets, sheetUrl: e.target.value }
                  }))}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">Make sure the sheet is shared publicly or with view access</p>
              </div>
              {integrations.googleSheets.lastSync && (
                <p className="text-xs text-muted-foreground">Last import: {integrations.googleSheets.lastSync}</p>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSaveIntegration('Google Sheets')}
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm"
                  className="btn-gradient-primary"
                  onClick={() => handleImportLeads('googleSheets')}
                  disabled={!integrations.googleSheets.sheetUrl || isImporting === 'googleSheets'}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {isImporting === 'googleSheets' ? 'Importing...' : 'Import Leads'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Meta Ads */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-display">Meta Ads (Facebook/Instagram)</CardTitle>
                    <CardDescription className="text-xs">Import leads from Facebook Lead Ads</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations.metaAds.connected ? "default" : "secondary"} className="text-xs">
                  {integrations.metaAds.connected ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" /> Not Connected</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="meta-token" className="text-sm">Access Token</Label>
                  <Input
                    id="meta-token"
                    type="password"
                    value={integrations.metaAds.accessToken}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      metaAds: { ...prev.metaAds, accessToken: e.target.value }
                    }))}
                    placeholder="Your Meta access token"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-account" className="text-sm">Ad Account ID</Label>
                  <Input
                    id="ad-account"
                    value={integrations.metaAds.adAccountId}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      metaAds: { ...prev.metaAds, adAccountId: e.target.value }
                    }))}
                    placeholder="act_123456789"
                    className="h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your access token from <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Meta Graph API Explorer</a>
              </p>
              {integrations.metaAds.lastSync && (
                <p className="text-xs text-muted-foreground">Last import: {integrations.metaAds.lastSync}</p>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSaveIntegration('Meta Ads')}
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm"
                  className="btn-gradient-primary"
                  onClick={() => handleImportLeads('metaAds')}
                  disabled={!integrations.metaAds.accessToken || !integrations.metaAds.adAccountId || isImporting === 'metaAds'}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {isImporting === 'metaAds' ? 'Importing...' : 'Import Leads'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Google Ads */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Target className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-display">Google Ads</CardTitle>
                    <CardDescription className="text-xs">Import leads from Google Ads campaigns</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations.googleAds.connected ? "default" : "secondary"} className="text-xs">
                  {integrations.googleAds.connected ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" /> Not Connected</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="google-customer-id" className="text-sm">Customer ID</Label>
                  <Input
                    id="google-customer-id"
                    value={integrations.googleAds.customerId}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      googleAds: { ...prev.googleAds, customerId: e.target.value }
                    }))}
                    placeholder="123-456-7890"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="developer-token" className="text-sm">Developer Token</Label>
                  <Input
                    id="developer-token"
                    type="password"
                    value={integrations.googleAds.developerToken}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      googleAds: { ...prev.googleAds, developerToken: e.target.value }
                    }))}
                    placeholder="Your developer token"
                    className="h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your credentials from <a href="https://ads.google.com/aw/apicenter" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads API Center</a>
              </p>
              {integrations.googleAds.lastSync && (
                <p className="text-xs text-muted-foreground">Last import: {integrations.googleAds.lastSync}</p>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSaveIntegration('Google Ads')}
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm"
                  className="btn-gradient-primary"
                  onClick={() => handleImportLeads('googleAds')}
                  disabled={!integrations.googleAds.customerId || !integrations.googleAds.developerToken || isImporting === 'googleAds'}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {isImporting === 'googleAds' ? 'Importing...' : 'Import Leads'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
