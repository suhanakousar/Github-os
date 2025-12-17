import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Github, 
  Bell, 
  Shield,
  Palette,
  Key,
  Save,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState("");
  const [notifications, setNotifications] = useState({
    highRiskPR: true,
    architectureDrift: true,
    sprintRisk: false,
    dailyDigest: true,
  });
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleTestConnection = () => {
    toast({
      title: "Connection Test",
      description: "GitHub API connection successful!",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure GitMind OS preferences and integrations
        </p>
      </div>

      <Tabs defaultValue="github" className="space-y-6">
        <TabsList>
          <TabsTrigger value="github" data-testid="tab-github">
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github">
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                GitHub Integration
              </CardTitle>
              <CardDescription>
                Configure your GitHub connection for repository analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="github-token">Personal Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    data-testid="input-github-token"
                  />
                  <Button variant="outline" onClick={handleTestConnection} data-testid="button-test-connection">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required scopes: repo, read:org, read:user
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">API Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate Limit Buffer</Label>
                    <Input type="number" defaultValue={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cache Duration (minutes)</Label>
                    <Input type="number" defaultValue={15} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Use GraphQL API</Label>
                  <p className="text-xs text-muted-foreground">Faster queries for large repositories</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "highRiskPR", label: "High Risk PR Detected", description: "Alert when a PR exceeds risk threshold" },
                { key: "architectureDrift", label: "Architecture Drift", description: "Notify on new architectural issues" },
                { key: "sprintRisk", label: "Sprint Risk Alerts", description: "Warn about sprint completion risks" },
                { key: "dailyDigest", label: "Daily Digest", description: "Summary of repository health each morning" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, [item.key]: checked }))
                    }
                    data-testid={`toggle-${item.key}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of GitMind OS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <Switch 
                  checked={theme === "dark"} 
                  onCheckedChange={toggleTheme}
                  data-testid="toggle-dark-mode"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduce spacing for more information density
                  </p>
                </div>
                <Switch data-testid="toggle-compact" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Line Numbers in Code</Label>
                  <p className="text-xs text-muted-foreground">
                    Display line numbers in code snippets
                  </p>
                </div>
                <Switch defaultChecked data-testid="toggle-line-numbers" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require API Key for CLI</Label>
                  <p className="text-xs text-muted-foreground">
                    Authenticate CLI commands with API key
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    type="password" 
                    value="gm_xxxxxxxxxxxxxxxxxxxxxxxx" 
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" data-testid="button-regenerate-key">
                    <Key className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Audit Logging</Label>
                  <p className="text-xs text-muted-foreground">
                    Log all analysis and governance actions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Data Retention (days)</Label>
                  <p className="text-xs text-muted-foreground">
                    How long to keep historical analysis data
                  </p>
                </div>
                <Input type="number" defaultValue={90} className="w-24" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} data-testid="button-save-settings">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
