"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { useActiveLanguages } from "@/hooks/use-languages";

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const { data: languages = [] } = useActiveLanguages();

  // Find current language name
  const currentLang = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change language">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{lang.native_name || lang.name}</span>
            <span className="text-muted-foreground text-xs">({lang.code})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Larger variant with text for settings/profile pages
export function LanguageSwitcherSelect() {
  const { language, setLanguage } = useTranslation();
  const { data: languages = [] } = useActiveLanguages();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.code}>
            {lang.native_name || lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
