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

export default function MenuPage() {
  const { data: settings } = useSettingsByGroup("menu");
  const bulkUpdateMutation = useBulkUpdateSettings();

  const [options, setOptions] = useState({
    sidebar_position: "left",
    collapsible_sidebar: "true",
    menu_style: "normal",
    show_icons: "true",
    active_menu_color: "#3b82f6",
  });

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      setOptions({
        sidebar_position: settingsMap.sidebar_position || "left",
        collapsible_sidebar: settingsMap.collapsible_sidebar || "true",
        menu_style: settingsMap.menu_style || "normal",
        show_icons: settingsMap.show_icons || "true",
        active_menu_color: settingsMap.active_menu_color || "#3b82f6",
      });
    }
  }, [settings]);

  const handleSave = () => {
    bulkUpdateMutation.mutate(options);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Menu</h1>
        <p className="text-muted-foreground mt-1">
          Configure sidebar menu appearance and behavior
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sidebar Position</CardTitle>
          <CardDescription>Choose where the sidebar appears</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={options.sidebar_position}
            onValueChange={(val) => setOptions({ ...options, sidebar_position: val })}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collapsible Sidebar</CardTitle>
          <CardDescription>Allow sidebar to be collapsed to icons only</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={options.collapsible_sidebar === "true"}
              onCheckedChange={(checked) =>
                setOptions({ ...options, collapsible_sidebar: checked ? "true" : "false" })
              }
            />
            <span className="text-sm text-muted-foreground">
              {options.collapsible_sidebar === "true" ? "On" : "Off"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu Style</CardTitle>
          <CardDescription>Choose between compact and normal menu style</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={options.menu_style}
            onValueChange={(val) => setOptions({ ...options, menu_style: val })}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Show Icons</CardTitle>
          <CardDescription>Display icons next to menu labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={options.show_icons === "true"}
              onCheckedChange={(checked) =>
                setOptions({ ...options, show_icons: checked ? "true" : "false" })
              }
            />
            <span className="text-sm text-muted-foreground">
              {options.show_icons === "true" ? "Yes" : "No"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Menu Color</CardTitle>
          <CardDescription>Color used to highlight the active menu item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-xs">
            <Input
              type="color"
              value={options.active_menu_color}
              onChange={(e) => setOptions({ ...options, active_menu_color: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={options.active_menu_color}
              onChange={(e) => setOptions({ ...options, active_menu_color: e.target.value })}
              placeholder="#3b82f6"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {bulkUpdateMutation.isPending ? "Saving..." : "Save Menu Settings"}
        </Button>
      </div>
    </div>
  );
}
