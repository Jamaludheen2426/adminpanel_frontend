"use client";

import { useEffect } from "react";
import { useSettingsByGroup } from "@/hooks/use-settings";

export function DynamicHead() {
  const { data: settings } = useSettingsByGroup("appearance");

  useEffect(() => {
    if (!settings) return;

    const adminTitle = settings.find((s) => s.key === "admin_title")?.value;
    const faviconUrl = settings.find((s) => s.key === "admin_favicon_url")?.value;

    // Update document title
    if (adminTitle) {
      document.title = adminTitle;
    }

    // Update favicon
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [settings]);

  return null;
}
