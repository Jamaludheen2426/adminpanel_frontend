"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function ThemeOptionContent() {
  const { data: settings } = useSettingsByGroup("theme_options");
  const bulkUpdateMutation = useBulkUpdateSettings();

  const [options, setOptions] = useState({
    font_family: "poppins",
    font_size: "14",
    border_radius: "0.5",
    spacing_density: "normal",
    card_shadow: "true",
    button_style: "default",
  });

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      setOptions({
        font_family: settingsMap.font_family || "poppins",
        font_size: settingsMap.font_size || "14",
        border_radius: settingsMap.border_radius || "0.5",
        spacing_density: settingsMap.spacing_density || "normal",
        card_shadow: settingsMap.card_shadow || "true",
        button_style: settingsMap.button_style || "default",
      });
    }
  }, [settings]);

  const handleSave = () => {
    bulkUpdateMutation.mutate(options);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Theme Options</h1>
        <p className="text-muted-foreground mt-1">
          Fine-tune typography, spacing, and component styles
        </p>
      </div>

      {/* Font Family */}
      <Card>
        <CardHeader>
          <CardTitle>Font Family</CardTitle>
          <CardDescription>Choose the primary font for the application</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={options.font_family}
            onValueChange={(val) => setOptions({ ...options, font_family: val })}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="poppins">Poppins</SelectItem>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="roboto">Roboto</SelectItem>
              <SelectItem value="open-sans">Open Sans</SelectItem>
              <SelectItem value="lato">Lato</SelectItem>
              <SelectItem value="nunito">Nunito</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle>Font Size</CardTitle>
          <CardDescription>Base font size in pixels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 max-w-xs">
            <Input
              type="number"
              min="10"
              max="20"
              value={options.font_size}
              onChange={(e) => setOptions({ ...options, font_size: e.target.value })}
            />
            <span className="text-sm text-muted-foreground">px</span>
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>Roundness of corners for cards, buttons, and inputs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={options.border_radius}
                onChange={(e) => setOptions({ ...options, border_radius: e.target.value })}
              />
              <span className="text-sm text-muted-foreground">rem</span>
            </div>
            <div className="flex gap-3">
              {["0", "0.25", "0.5", "0.75", "1"].map((val) => (
                <button
                  key={val}
                  onClick={() => setOptions({ ...options, border_radius: val })}
                  className={`w-10 h-10 border-2 transition-colors ${
                    options.border_radius === val ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  style={{ borderRadius: `${val}rem` }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacing Density */}
      <Card>
        <CardHeader>
          <CardTitle>Spacing Density</CardTitle>
          <CardDescription>Control the overall spacing between elements</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={options.spacing_density}
            onValueChange={(val) => setOptions({ ...options, spacing_density: val })}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="comfortable">Comfortable</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Card Shadow */}
      <Card>
        <CardHeader>
          <CardTitle>Card Shadow</CardTitle>
          <CardDescription>Enable or disable shadow on card components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={options.card_shadow === "true"}
              onCheckedChange={(checked) =>
                setOptions({ ...options, card_shadow: checked ? "true" : "false" })
              }
            />
            <span className="text-sm text-muted-foreground">
              {options.card_shadow === "true" ? "On" : "Off"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Button Style */}
      <Card>
        <CardHeader>
          <CardTitle>Button Style</CardTitle>
          <CardDescription>Choose the default button appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={options.button_style}
            onValueChange={(val) => setOptions({ ...options, button_style: val })}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Filled)</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="rounded">Rounded</SelectItem>
              <SelectItem value="pill">Pill</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-3 mt-4">
            <Button variant="default">Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {bulkUpdateMutation.isPending ? "Saving..." : "Save Theme Options"}
        </Button>
      </div>
    </div>
  );
}
