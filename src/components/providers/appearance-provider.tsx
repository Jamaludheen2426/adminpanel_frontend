"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingsByGroup } from "@/hooks/use-settings";

// Convert hex color to HSL values (H S% L%)
function hexToHsl(hex: string): string | null {
  if (!hex || !hex.startsWith("#")) return null;

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Calculate a foreground color (light or dark) for contrast
function getForegroundForColor(hex: string): string {
  if (!hex || !hex.startsWith("#")) return "0 0% 100%";
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 100%";

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark for light backgrounds
  return luminance > 0.5 ? "222.2 47.4% 11.2%" : "210 40% 98%";
}

// Font family mapping
const fontFamilyMap: Record<string, string> = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  opensans: "'Open Sans', sans-serif",
  lato: "'Lato', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  poppins: "'Poppins', sans-serif",
};

// Google Fonts URL mapping
const fontUrlMap: Record<string, string> = {
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  roboto: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
  opensans: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap",
  lato: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",
  montserrat: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap",
  poppins: "", // Already loaded in root layout
};

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useSettingsByGroup("appearance");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!settings || settings.length === 0) return;

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value || "";
    });

    const root = document.documentElement;
    const isDark = resolvedTheme === "dark";

    // Helper function to get the appropriate color based on theme
    const getColor = (lightKey: string, darkKey: string) => {
      return isDark ? settingsMap[darkKey] : settingsMap[lightKey];
    };

    // Apply primary color
    const primaryColor = getColor("primary_color", "dark_primary_color");
    if (primaryColor) {
      const hsl = hexToHsl(primaryColor);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--primary-foreground", getForegroundForColor(primaryColor));
        root.style.setProperty("--sidebar-primary", hsl);
        root.style.setProperty("--sidebar-primary-foreground", getForegroundForColor(primaryColor));
        root.style.setProperty("--ring", hsl);
      }
    }

    // Apply secondary color
    const secondaryColor = getColor("secondary_color", "dark_secondary_color");
    if (secondaryColor) {
      const hsl = hexToHsl(secondaryColor);
      if (hsl) {
        root.style.setProperty("--secondary", hsl);
        root.style.setProperty("--secondary-foreground", getForegroundForColor(secondaryColor));
        root.style.setProperty("--muted-foreground", hsl);
      }
    }

    // Apply background color
    const backgroundColor = getColor("background_color", "dark_background_color");
    if (backgroundColor) {
      const hsl = hexToHsl(backgroundColor);
      if (hsl) {
        root.style.setProperty("--background", hsl);
      }
    }

    // Apply sidebar color
    const sidebarColor = getColor("sidebar_color", "dark_sidebar_color");
    if (sidebarColor) {
      const hsl = hexToHsl(sidebarColor);
      if (hsl) {
        root.style.setProperty("--sidebar-background", hsl);
        root.style.setProperty("--sidebar-foreground", getForegroundForColor(sidebarColor));
      }
    }

    // Apply card color
    const cardColor = getColor("card_color", "dark_card_color");
    if (cardColor) {
      const hsl = hexToHsl(cardColor);
      if (hsl) {
        root.style.setProperty("--card", hsl);
        root.style.setProperty("--popover", hsl);
      }
    }

    // Apply border color
    const borderColor = getColor("border_color", "dark_border_color");
    if (borderColor) {
      const hsl = hexToHsl(borderColor);
      if (hsl) {
        root.style.setProperty("--border", hsl);
        root.style.setProperty("--sidebar-border", hsl);
      }
    }

    // Apply muted color
    const mutedColor = getColor("muted_color", "dark_muted_color");
    if (mutedColor) {
      const hsl = hexToHsl(mutedColor);
      if (hsl) {
        root.style.setProperty("--muted", hsl);
      }
    }

    // Apply accent color
    const accentColor = getColor("accent_color", "dark_accent_color");
    if (accentColor) {
      const hsl = hexToHsl(accentColor);
      if (hsl) {
        root.style.setProperty("--accent", hsl);
        root.style.setProperty("--accent-foreground", getForegroundForColor(accentColor));
        root.style.setProperty("--sidebar-accent", hsl);
        root.style.setProperty("--sidebar-accent-foreground", getForegroundForColor(accentColor));
      }
    }

    // Apply text color (foreground)
    const textColor = getColor("text_color", "dark_text_color");
    if (textColor) {
      const hsl = hexToHsl(textColor);
      if (hsl) {
        root.style.setProperty("--foreground", hsl);
        root.style.setProperty("--card-foreground", hsl);
        root.style.setProperty("--popover-foreground", hsl);
      }
    }

    // Apply heading color
    const headingColor = getColor("heading_color", "dark_heading_color");
    if (headingColor) {
      root.style.setProperty("--admin-heading-color", headingColor);
    }

    // Apply link colors
    const linkColor = getColor("link_color", "dark_link_color");
    if (linkColor) {
      root.style.setProperty("--admin-link-color", linkColor);
    }

    const linkHoverColor = getColor("link_hover_color", "dark_link_hover_color");
    if (linkHoverColor) {
      root.style.setProperty("--admin-link-hover-color", linkHoverColor);
    }

    // Apply font (theme-independent)
    if (settingsMap.primary_font && settingsMap.primary_font !== "poppins") {
      const fontUrl = fontUrlMap[settingsMap.primary_font];
      if (fontUrl) {
        // Load the font if not already loaded
        const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
        if (!existingLink) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = fontUrl;
          document.head.appendChild(link);
        }
      }
      const fontFamily = fontFamilyMap[settingsMap.primary_font];
      if (fontFamily) {
        document.body.style.fontFamily = fontFamily;
      }
    }

    // Apply direction (theme-independent)
    if (settingsMap.admin_direction) {
      root.dir = settingsMap.admin_direction;
    }

    // Apply title (theme-independent)
    if (settingsMap.admin_title) {
      document.title = settingsMap.admin_title;
    }

    // Cleanup on unmount
    return () => {
      const props = [
        "--primary", "--primary-foreground",
        "--sidebar-primary", "--sidebar-primary-foreground",
        "--ring",
        "--secondary", "--secondary-foreground",
        "--muted-foreground", "--muted",
        "--background",
        "--sidebar-background", "--sidebar-foreground",
        "--card", "--popover",
        "--border", "--sidebar-border",
        "--accent", "--accent-foreground",
        "--sidebar-accent", "--sidebar-accent-foreground",
        "--foreground", "--card-foreground", "--popover-foreground",
        "--admin-heading-color",
        "--admin-link-color", "--admin-link-hover-color",
      ];
      props.forEach((prop) => root.style.removeProperty(prop));
      document.body.style.fontFamily = "";
    };
  }, [settings, resolvedTheme]);

  return <>{children}</>;
}