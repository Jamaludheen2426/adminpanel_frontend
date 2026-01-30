"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check, Save } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";

const themeOptions = [
  {
    id: "light",
    label: "Light",
    description: "A clean, bright theme for daytime use",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    description: "A dark theme that's easy on the eyes",
    icon: Moon,
  },
  {
    id: "system",
    label: "System",
    description: "Automatically match your system preference",
    icon: Monitor,
  },
];

export default function ThemePage() {
  const { theme, setTheme } = useTheme();
  const { data: settings } = useSettingsByGroup("theme");
  const bulkUpdateMutation = useBulkUpdateSettings();

  const [colors, setColors] = useState({
    primary_color: "#3b82f6",
    secondary_color: "#64748b",
    background_color: "#ffffff",
    text_color: "#0f172a",
  });

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      setColors({
        primary_color: settingsMap.primary_color || "#3b82f6",
        secondary_color: settingsMap.secondary_color || "#64748b",
        background_color: settingsMap.background_color || "#ffffff",
        text_color: settingsMap.text_color || "#0f172a",
      });
    }
  }, [settings]);

  const handleSaveColors = () => {
    bulkUpdateMutation.mutate(colors);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Theme</h1>
        <p className="text-muted-foreground mt-1">
          Choose your color scheme and customize theme colors
        </p>
      </div>

      {/* Light / Dark / System */}
      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>Select the base theme for the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:border-primary/50",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription>Customize the theme colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors.primary_color}
                  onChange={(e) => setColors({ ...colors, primary_color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={colors.primary_color}
                  onChange={(e) => setColors({ ...colors, primary_color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
              <p className="text-xs text-muted-foreground">Main brand color used for buttons, links, and accents</p>
            </div>

            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors.secondary_color}
                  onChange={(e) => setColors({ ...colors, secondary_color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={colors.secondary_color}
                  onChange={(e) => setColors({ ...colors, secondary_color: e.target.value })}
                  placeholder="#64748b"
                />
              </div>
              <p className="text-xs text-muted-foreground">Secondary color for subtle accents and backgrounds</p>
            </div>

            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors.background_color}
                  onChange={(e) => setColors({ ...colors, background_color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={colors.background_color}
                  onChange={(e) => setColors({ ...colors, background_color: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
              <p className="text-xs text-muted-foreground">Main background color for the application</p>
            </div>

            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors.text_color}
                  onChange={(e) => setColors({ ...colors, text_color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={colors.text_color}
                  onChange={(e) => setColors({ ...colors, text_color: e.target.value })}
                  placeholder="#0f172a"
                />
              </div>
              <p className="text-xs text-muted-foreground">Default text color for content</p>
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-6 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Preview</p>
            <div className="flex gap-3">
              <div
                className="w-16 h-16 rounded-lg border"
                style={{ backgroundColor: colors.primary_color }}
              />
              <div
                className="w-16 h-16 rounded-lg border"
                style={{ backgroundColor: colors.secondary_color }}
              />
              <div
                className="w-16 h-16 rounded-lg border"
                style={{ backgroundColor: colors.background_color }}
              />
              <div
                className="w-16 h-16 rounded-lg border"
                style={{ backgroundColor: colors.text_color }}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveColors} disabled={bulkUpdateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {bulkUpdateMutation.isPending ? "Saving..." : "Save Colors"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
