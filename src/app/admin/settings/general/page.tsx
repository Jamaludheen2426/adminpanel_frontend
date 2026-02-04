"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Clock, Eye, Code } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import { useActiveLanguages } from "@/hooks/use-languages";
import { useTimezones } from "@/hooks/use-timezones";
import { useTranslation } from "@/hooks/use-translation";

export default function GeneralSettingsPage() {
  const { data: settings, isLoading } = useSettingsByGroup("general");
  const { data: languages = [] } = useActiveLanguages();
  const { data: timezones = [] } = useTimezones();
  const bulkUpdateMutation = useBulkUpdateSettings();
  const { applyLanguage } = useTranslation();

  const [values, setValues] = useState({
    admin_email: "",
    timezone: "UTC",
    font_direction: "ltr",
    language: "en",
    coming_soon_enabled: "false",
    coming_soon_html: "",
  });

  const [activeTab, setActiveTab] = useState("editor");

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      setValues({
        admin_email: settingsMap.admin_email || "",
        timezone: settingsMap.timezone || "UTC",
        font_direction: settingsMap.font_direction || "ltr",
        language: settingsMap.language || "en",
        coming_soon_enabled: settingsMap.coming_soon_enabled || "false",
        coming_soon_html: settingsMap.coming_soon_html || getDefaultComingSoonHTML(),
      });
    }
  }, [settings]);

  const handleSave = () => {
    bulkUpdateMutation.mutate({ group: "general", ...values }, {
      onSuccess: () => {
        // Apply language change to the UI immediately
        applyLanguage(values.language);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">General Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure admin email, timezone, language, and direction
          </p>
        </div>
      </div>

      {/* Admin Email */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Email</CardTitle>
          <CardDescription>Primary email address for admin notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="admin_email">Email Address</Label>
            <Input
              id="admin_email"
              type="email"
              placeholder="admin@example.com"
              value={values.admin_email}
              onChange={(e) => setValues({ ...values, admin_email: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>Set the default timezone for the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label>Timezone</Label>
            <Select
              value={values.timezone}
              onValueChange={(val) => setValues({ ...values, timezone: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Font Direction */}
      <Card>
        <CardHeader>
          <CardTitle>Font Direction</CardTitle>
          <CardDescription>Set the text direction for the interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label>Direction</Label>
            <Select
              value={values.font_direction}
              onValueChange={(val) => setValues({ ...values, font_direction: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ltr">LTR (Left to Right)</SelectItem>
                <SelectItem value="rtl">RTL (Right to Left)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Set the default language for the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label>Language</Label>
            <Select
              value={values.language}
              onValueChange={(val) => setValues({ ...values, language: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Coming Soon Mode
          </CardTitle>
          <CardDescription>
            Enable this to show a &quot;Coming Soon&quot; page to visitors on the main site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-0.5">
              <Label htmlFor="coming_soon">Enable Coming Soon Page</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, visitors will see a coming soon page instead of the main site
              </p>
            </div>
            <Switch
              id="coming_soon"
              checked={values.coming_soon_enabled === "true"}
              onCheckedChange={(checked) =>
                setValues({ ...values, coming_soon_enabled: checked ? "true" : "false" })
              }
            />
          </div>

          {/* HTML Editor & Preview */}
          {values.coming_soon_enabled === "true" && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label>Coming Soon Page Content</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Customize the HTML content that will be displayed on the coming soon page
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="editor" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    HTML Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-2">
                  <Textarea
                    placeholder="Enter your HTML content here..."
                    value={values.coming_soon_html}
                    onChange={(e) =>
                      setValues({ ...values, coming_soon_html: e.target.value })
                    }
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can use HTML, CSS (inline or in style tags), and basic styling
                  </p>
                </TabsContent>

                <TabsContent value="preview" className="space-y-2">
                  <div className="border rounded-lg p-6 min-h-[400px] bg-background">
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: values.coming_soon_html }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is how your coming soon page will appear to visitors
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setValues({ ...values, coming_soon_html: getDefaultComingSoonHTML() })}
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {bulkUpdateMutation.isPending ? "Saving..." : "Save General Settings"}
        </Button>
      </div>
    </div>
  );
}

function getDefaultComingSoonHTML() {
  return `<div style="text-align: center; max-width: 600px; margin: 0 auto;">
  <div style="margin-bottom: 2rem;">
    <div style="display: inline-block; background: rgba(59, 130, 246, 0.1); padding: 1.5rem; border-radius: 50%;">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgb(59, 130, 246)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
      </svg>
    </div>
  </div>
  
  <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem; color: inherit;">
    Coming Soon
  </h1>
  
  <p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.6;">
    We're working hard to bring you something amazing. Stay tuned!
  </p>
  
  <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #6b7280; margin-bottom: 2rem;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
    <span>Launching Soon</span>
  </div>
</div>`;
}