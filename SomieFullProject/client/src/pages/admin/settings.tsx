import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Save, Settings2, Shield, Database, Globe, BellRing, MailCheck, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  value: string;
  dataType: string;
  description: string;
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/settings"],
    retry: false,
    onSuccess: (data) => {
      // Convert array to record for easier access
      const settingsRecord: Record<string, SystemSetting> = {};
      data.settings.forEach((setting: SystemSetting) => {
        settingsRecord[setting.id] = setting;
      });
      setSettings(settingsRecord);
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: SystemSetting[]) => {
      return apiRequest("/api/admin/settings", {
        method: "PUT",
        data: { settings: updatedSettings },
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "System settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the settings.",
        variant: "destructive",
      });
    },
  });

  // Handle settings change
  const handleSettingChange = (id: string, value: any) => {
    if (!settings[id]) return;
    
    const updatedSettings = {
      ...settings,
      [id]: {
        ...settings[id],
        value: value.toString()
      }
    };
    
    setSettings(updatedSettings);
  };

  // Save all settings
  const saveSettings = () => {
    const settingsArray = Object.values(settings);
    updateSettingsMutation.mutate(settingsArray);
  };

  // Create a controlled input for a setting
  const SettingControl = ({ id, label, description }: { id: string, label: string, description?: string }) => {
    if (!settings[id]) return null;
    
    const setting = settings[id];
    const value = setting.value;
    
    switch (setting.dataType) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between space-y-0 rounded-md border p-4">
            <div className="space-y-0.5">
              <Label htmlFor={id}>{label}</Label>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <Switch
              id={id}
              checked={value === 'true'}
              onCheckedChange={(checked) => handleSettingChange(id, checked)}
            />
          </div>
        );
      
      case 'number':
        return (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={id}>{label}</Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground">
                {value}
              </span>
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <Slider
              id={id}
              min={0}
              max={100}
              step={1}
              value={[parseInt(value) || 0]}
              onValueChange={([newValue]) => handleSettingChange(id, newValue)}
            />
          </div>
        );
      
      case 'text':
        return (
          <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <Input
              id={id}
              value={value}
              onChange={(e) => handleSettingChange(id, e.target.value)}
            />
          </div>
        );
      
      case 'longtext':
        return (
          <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <Textarea
              id={id}
              value={value}
              onChange={(e) => handleSettingChange(id, e.target.value)}
              rows={3}
            />
          </div>
        );
      
      default:
        return (
          <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <Input
              id={id}
              value={value}
              onChange={(e) => handleSettingChange(id, e.target.value)}
            />
          </div>
        );
    }
  };

  // Mock setting definitions for UI building
  // These would normally come from the API
  const settingDefinitions = {
    general: [
      { id: 'site_name', label: 'Site Name', description: 'The name of the site displayed in the header and title' },
      { id: 'site_description', label: 'Site Description', description: 'Brief description of the platform for SEO' },
      { id: 'maintenance_mode', label: 'Maintenance Mode', description: 'Put the site in maintenance mode (only admins can access)' },
      { id: 'enable_registration', label: 'Enable Registration', description: 'Allow new users to register on the platform' },
    ],
    security: [
      { id: 'require_email_verification', label: 'Require Email Verification', description: 'Require users to verify their email before using the platform' },
      { id: 'max_login_attempts', label: 'Max Login Attempts', description: 'Maximum number of login attempts before temporary lockout' },
      { id: 'session_timeout', label: 'Session Timeout (minutes)', description: 'Time in minutes before an inactive session expires' },
      { id: 'use_strict_password_policy', label: 'Use Strict Password Policy', description: 'Enforce strong password requirements' },
    ],
    database: [
      { id: 'db_backup_frequency', label: 'Database Backup Frequency (hours)', description: 'How often to backup the database' },
      { id: 'db_backup_retention', label: 'Backup Retention Period (days)', description: 'Number of days to keep database backups' },
    ],
    content: [
      { id: 'enable_content_moderation', label: 'Enable Content Moderation', description: 'Automatically review new posts for policy violations' },
      { id: 'require_offer_approval', label: 'Require Offer Approval', description: 'Require admin approval for new offers before they go live' },
      { id: 'max_images_per_post', label: 'Max Images Per Post', description: 'Maximum number of images allowed in a post' },
      { id: 'restricted_keywords', label: 'Restricted Keywords', description: 'Comma-separated list of keywords that are flagged for review' },
    ],
    notifications: [
      { id: 'enable_email_notifications', label: 'Enable Email Notifications', description: 'Send important notifications via email' },
      { id: 'enable_push_notifications', label: 'Enable Push Notifications', description: 'Enable browser push notifications for important events' },
      { id: 'notification_digest_frequency', label: 'Notification Digest Frequency', description: 'How often to send digests of notifications' },
    ],
    performance: [
      { id: 'enable_caching', label: 'Enable Caching', description: 'Cache frequent queries to improve performance' },
      { id: 'cache_ttl', label: 'Cache Time-to-Live (minutes)', description: 'How long cached items remain valid' },
      { id: 'max_api_requests_per_minute', label: 'Max API Requests Per Minute', description: 'Rate limiting for API endpoints' },
    ],
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure global platform settings
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading settings...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p>Failed to load settings. Please try again later.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <Button 
                onClick={saveSettings} 
                disabled={updateSettingsMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 lg:w-auto">
                <TabsTrigger value="general" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden md:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden md:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="database" className="gap-2">
                  <Database className="h-4 w-4" />
                  <span className="hidden md:inline">Database</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden md:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <BellRing className="h-4 w-4" />
                  <span className="hidden md:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="performance" className="gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden md:inline">Performance</span>
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Basic configuration for the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingDefinitions.general.map((definition) => (
                      <SettingControl
                        key={definition.id}
                        id={definition.id}
                        label={definition.label}
                        description={definition.description}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Configure security options for the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingDefinitions.security.map((definition) => (
                      <SettingControl
                        key={definition.id}
                        id={definition.id}
                        label={definition.label}
                        description={definition.description}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Database Settings */}
              <TabsContent value="database">
                <Card>
                  <CardHeader>
                    <CardTitle>Database Settings</CardTitle>
                    <CardDescription>
                      Database configuration and backup settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingDefinitions.database.map((definition) => (
                      <SettingControl
                        key={definition.id}
                        id={definition.id}
                        label={definition.label}
                        description={definition.description}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Settings */}
              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Settings</CardTitle>
                    <CardDescription>
                      Content moderation and policy settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingDefinitions.content.map((definition) => (
                      <SettingControl
                        key={definition.id}
                        id={definition.id}
                        label={definition.label}
                        description={definition.description}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Email and push notification configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingDefinitions.notifications.map((definition) => (
                      <SettingControl
                        key={definition.id}
                        id={definition.id}
                        label={definition.label}
                        description={definition.description}
                      />
                    ))}
                    
                    <Separator className="my-4" />
                    
                    <div className="grid gap-2">
                      <Label htmlFor="smtp_test">Email Testing</Label>
                      <p className="text-sm text-muted-foreground">
                        Send a test email to verify your SMTP configuration
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id="test_email"
                          placeholder="Enter email address"
                        />
                        <Button variant="outline" className="shrink-0">
                          <MailCheck className="mr-2 h-4 w-4" />
                          Send Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Settings */}
              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Settings</CardTitle>
                    <CardDescription>
                      Platform performance and optimization settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingDefinitions.performance.map((definition) => (
                      <SettingControl
                        key={definition.id}
                        id={definition.id}
                        label={definition.label}
                        description={definition.description}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;