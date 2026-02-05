"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import { Spinner } from "@/components/ui/spinner";

const lightColors = [
  { key: "primary_color", label: "Primary", defaultVal: "#208bc4" },
  { key: "secondary_color", label: "Secondary", defaultVal: "#6c7a91" },
  { key: "background_color", label: "Background", defaultVal: "#ffffff" },
  { key: "sidebar_color", label: "Sidebar", defaultVal: "#f8fafc" },
  { key: "card_color", label: "Card", defaultVal: "#ffffff" },
  { key: "border_color", label: "Border", defaultVal: "#e2e8f0" },
  { key: "muted_color", label: "Muted", defaultVal: "#f1f5f9" },
  { key: "accent_color", label: "Accent", defaultVal: "#f1f5f9" },
  { key: "heading_color", label: "Heading", defaultVal: "#000000" },
  { key: "text_color", label: "Text", defaultVal: "#0f172a" },
  { key: "link_color", label: "Link", defaultVal: "#208bc4" },
  { key: "link_hover_color", label: "Link Hover", defaultVal: "#1a669d" },
];

const darkColors = [
  { key: "dark_primary_color", label: "Primary", defaultVal: "#3b9fd4" },
  { key: "dark_secondary_color", label: "Secondary", defaultVal: "#8b95a5" },
  { key: "dark_background_color", label: "Background", defaultVal: "#0f172a" },
  { key: "dark_sidebar_color", label: "Sidebar", defaultVal: "#1e293b" },
  { key: "dark_card_color", label: "Card", defaultVal: "#1e293b" },
  { key: "dark_border_color", label: "Border", defaultVal: "#334155" },
  { key: "dark_muted_color", label: "Muted", defaultVal: "#1e293b" },
  { key: "dark_accent_color", label: "Accent", defaultVal: "#1e293b" },
  { key: "dark_heading_color", label: "Heading", defaultVal: "#f8fafc" },
  { key: "dark_text_color", label: "Text", defaultVal: "#e2e8f0" },
  { key: "dark_link_color", label: "Link", defaultVal: "#5bb8e0" },
  { key: "dark_link_hover_color", label: "Link Hover", defaultVal: "#7ccbee" },
];

export default function ColorThemeSettingsPage() {
  const { data: settings, isLoading } = useSettingsByGroup("appearance");
  const bulkUpdateMutation = useBulkUpdateSettings();

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    lightColors.forEach((c) => { initial[c.key] = c.defaultVal; });
    darkColors.forEach((c) => { initial[c.key] = c.defaultVal; });
    return initial;
  });

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      const updated: Record<string, string> = {};
      lightColors.forEach((c) => {
        updated[c.key] = settingsMap[c.key] || c.defaultVal;
      });
      darkColors.forEach((c) => {
        updated[c.key] = settingsMap[c.key] || c.defaultVal;
      });
      setValues(updated);
    }
  }, [settings]);

  const handleSave = () => {
    bulkUpdateMutation.mutate({
      group: "appearance",
      ...values,
    });
  };

  const handleReset = () => {
    const defaults: Record<string, string> = {};
    lightColors.forEach((c) => { defaults[c.key] = c.defaultVal; });
    darkColors.forEach((c) => { defaults[c.key] = c.defaultVal; });
    setValues(defaults);
    bulkUpdateMutation.mutate({
      group: "appearance",
      ...defaults,
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12" />
          <p className="text-sm text-muted-foreground">Loading color theme settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlay - Shows when saving */}
      {bulkUpdateMutation.isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg shadow-lg border">
            <Spinner className="h-12 w-12" />
            <p className="text-sm font-medium">Saving color theme...</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dashboard Color Theme</h1>
            <p className="text-muted-foreground mt-1">
              Customize colors for light and dark mode
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Light Mode Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Light Mode Colors</CardTitle>
              <CardDescription>
                Colors applied in light mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {lightColors.map((item) => (
                  <div key={item.key} className="space-y-1">
                    <Label className="text-xs font-medium">{item.label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={values[item.key] || item.defaultVal}
                        onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
                        className="w-12 h-9 cursor-pointer p-1"
                      />
                      <Input
                        type="text"
                        value={values[item.key] || item.defaultVal}
                        onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
                        className="flex-1 h-9 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dark Mode Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Dark Mode Colors</CardTitle>
              <CardDescription>
                Colors applied in dark mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {darkColors.map((item) => (
                  <div key={item.key} className="space-y-1">
                    <Label className="text-xs font-medium">{item.label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={values[item.key] || item.defaultVal}
                        onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
                        className="w-12 h-9 cursor-pointer p-1"
                      />
                      <Input
                        type="text"
                        value={values[item.key] || item.defaultVal}
                        onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
                        className="flex-1 h-9 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset} disabled={bulkUpdateMutation.isPending}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {bulkUpdateMutation.isPending ? "Saving..." : "Save Color Theme"}
          </Button>
        </div>
      </div>
    </>
  );
}