"use client";

import { useEffect, useState } from "react";
import { useSettingsByGroup } from "@/hooks/use-settings";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { data: settings } = useSettingsByGroup("appearance");
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    if (settings) {
      const bgSetting = settings.find((s) => s.key === "login_background_urls");
      if (bgSetting?.value) {
        const urls = bgSetting.value.split(",").filter(Boolean);
        if (urls.length > 0) {
          // Pick a random background image
          const randomImage = urls[Math.floor(Math.random() * urls.length)];
          setBackgroundImage(randomImage);
        }
      }
    }
  }, [settings]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        {backgroundImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
      </div>
    </div>
  );
}