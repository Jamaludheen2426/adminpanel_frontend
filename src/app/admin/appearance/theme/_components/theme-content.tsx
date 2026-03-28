"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check, Palette } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/guards/permission-guard";

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

export function ThemeContent() {
  const { theme, setTheme } = useTheme();

  return (
    <PermissionGuard permission="settings.view">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Theme</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Choose your color scheme for the admin panel</p>
          </div>
        </div>

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
      </div>
    </PermissionGuard>
  );
}
