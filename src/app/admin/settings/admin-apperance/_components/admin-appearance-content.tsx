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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import { Spinner } from "@/components/ui/spinner";
import { PermissionGuard } from "@/components/guards/permission-guard";

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

const buttonColors = [
  { key: "btn_primary_bg", label: "Primary BG", defaultVal: "#208bc4" },
  { key: "btn_primary_text", label: "Primary Text", defaultVal: "#ffffff" },
  { key: "btn_primary_hover", label: "Primary Hover", defaultVal: "#1a6fa0" },
  { key: "btn_secondary_bg", label: "Secondary BG", defaultVal: "#f1f5f9" },
  { key: "btn_secondary_text", label: "Secondary Text", defaultVal: "#0f172a" },
  { key: "btn_secondary_hover", label: "Secondary Hover", defaultVal: "#e2e8f0" },
  { key: "btn_destructive_bg", label: "Destructive BG", defaultVal: "#ef4444" },
  { key: "btn_destructive_text", label: "Destructive Text", defaultVal: "#ffffff" },
  { key: "btn_destructive_hover", label: "Destructive Hover", defaultVal: "#dc2626" },
  { key: "btn_outline_border", label: "Outline Border", defaultVal: "#e2e8f0" },
  { key: "btn_outline_text", label: "Outline Text", defaultVal: "#0f172a" },
  { key: "btn_outline_hover", label: "Outline Hover BG", defaultVal: "#f1f5f9" },
];

const darkButtonColors = [
  { key: "dark_btn_primary_bg", label: "Primary BG", defaultVal: "#3b9fd4" },
  { key: "dark_btn_primary_text", label: "Primary Text", defaultVal: "#ffffff" },
  { key: "dark_btn_primary_hover", label: "Primary Hover", defaultVal: "#2d8bc0" },
  { key: "dark_btn_secondary_bg", label: "Secondary BG", defaultVal: "#334155" },
  { key: "dark_btn_secondary_text", label: "Secondary Text", defaultVal: "#e2e8f0" },
  { key: "dark_btn_secondary_hover", label: "Secondary Hover", defaultVal: "#475569" },
  { key: "dark_btn_destructive_bg", label: "Destructive BG", defaultVal: "#ef4444" },
  { key: "dark_btn_destructive_text", label: "Destructive Text", defaultVal: "#ffffff" },
  { key: "dark_btn_destructive_hover", label: "Destructive Hover", defaultVal: "#dc2626" },
  { key: "dark_btn_outline_border", label: "Outline Border", defaultVal: "#334155" },
  { key: "dark_btn_outline_text", label: "Outline Text", defaultVal: "#e2e8f0" },
  { key: "dark_btn_outline_hover", label: "Outline Hover BG", defaultVal: "#334155" },
];

export function AdminAppearanceContent() {
  const { data: settings, isLoading } = useSettingsByGroup("appearance");
  const bulkUpdateMutation = useBulkUpdateSettings();

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    lightColors.forEach((c) => { initial[c.key] = c.defaultVal; });
    darkColors.forEach((c) => { initial[c.key] = c.defaultVal; });
    buttonColors.forEach((c) => { initial[c.key] = c.defaultVal; });
    darkButtonColors.forEach((c) => { initial[c.key] = c.defaultVal; });
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
      buttonColors.forEach((c) => {
        updated[c.key] = settingsMap[c.key] || c.defaultVal;
      });
      darkButtonColors.forEach((c) => {
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

  const handleResetSection = (section: "light" | "dark" | "buttonLight" | "buttonDark" | "all") => {
    const newValues = { ...values };

    if (section === "light" || section === "all") {
      lightColors.forEach((c) => { newValues[c.key] = c.defaultVal; });
    }
    if (section === "dark" || section === "all") {
      darkColors.forEach((c) => { newValues[c.key] = c.defaultVal; });
    }
    if (section === "buttonLight" || section === "all") {
      buttonColors.forEach((c) => { newValues[c.key] = c.defaultVal; });
    }
    if (section === "buttonDark" || section === "all") {
      darkButtonColors.forEach((c) => { newValues[c.key] = c.defaultVal; });
    }

    setValues(newValues);
    bulkUpdateMutation.mutate({
      group: "appearance",
      ...newValues,
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
    <PermissionGuard permission="settings.view">
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Light Mode Colors</CardTitle>
                  <CardDescription>
                    Colors applied in light mode
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={bulkUpdateMutation.isPending}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Light Mode Colors?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all light mode colors to their default values. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleResetSection("light")}>
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dark Mode Colors</CardTitle>
                  <CardDescription>
                    Colors applied in dark mode
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={bulkUpdateMutation.isPending}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Dark Mode Colors?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all dark mode colors to their default values. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleResetSection("dark")}>
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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

        {/* Button Colors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Light Mode Button Colors */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Light Mode Button Colors</CardTitle>
                  <CardDescription>
                    Button colors applied in light mode
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={bulkUpdateMutation.isPending}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Light Mode Button Colors?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all light mode button colors to their default values. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleResetSection("buttonLight")}>
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {buttonColors.map((item) => (
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

          {/* Dark Mode Button Colors */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dark Mode Button Colors</CardTitle>
                  <CardDescription>
                    Button colors applied in dark mode
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={bulkUpdateMutation.isPending}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Dark Mode Button Colors?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all dark mode button colors to their default values. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleResetSection("buttonDark")}>
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {darkButtonColors.map((item) => (
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={bulkUpdateMutation.isPending}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset All to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Colors?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset ALL color settings (light mode, dark mode, and button colors) to their default values. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleResetSection("all")}>
                  Reset All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {bulkUpdateMutation.isPending ? "Saving..." : "Save Color Theme"}
          </Button>
        </div>
      </div>
    </>
    </PermissionGuard>
  );
}