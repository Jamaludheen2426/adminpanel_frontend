"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export default function GeneralSettingsPage() {
  const { data: settings, isLoading } = useSettingsByGroup("general");
  const { data: languages = [] } = useActiveLanguages();
  const { data: timezones = [] } = useTimezones();
  const bulkUpdateMutation = useBulkUpdateSettings();

  const [values, setValues] = useState({
    admin_email: "",
    timezone: "UTC",
    font_direction: "ltr",
    language: "en",
    coming_soon_enabled: "false",
  });

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
      });
    }
  }, [settings]);

  const handleSave = () => {
    bulkUpdateMutation.mutate({ group: "general", ...values });
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
        <CardContent>
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
