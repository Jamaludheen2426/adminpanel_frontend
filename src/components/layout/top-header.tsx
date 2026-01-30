"use client";

import { Globe, DollarSign, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguages, useCurrencies } from "@/hooks";
import { useState, useEffect } from "react";

export function TopHeader() {
  const { theme, setTheme } = useTheme();
  const { data: languagesData } = useLanguages({ limit: 100 });
  const { data: currenciesData } = useCurrencies({ limit: 100 });

  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved preferences from localStorage
    const savedLang = localStorage.getItem("preferred_language");
    const savedCurrency = localStorage.getItem("preferred_currency");
    if (savedLang) setSelectedLanguage(savedLang);
    if (savedCurrency) setSelectedCurrency(savedCurrency);
  }, []);

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    localStorage.setItem("preferred_language", code);
  };

  const handleCurrencyChange = (code: string) => {
    setSelectedCurrency(code);
    localStorage.setItem("preferred_currency", code);
  };

  const languages = languagesData?.data?.filter(l => l.is_active) || [];
  const currencies = currenciesData?.data?.filter(c => c.is_active) || [];

  const currentLanguage = languages.find(l => l.code === selectedLanguage) || languages[0];
  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  if (!mounted) {
    return (
      <div className="h-10 bg-muted/50 border-b" />
    );
  }

  return (
    <div className="h-10 bg-muted/50 border-b">
      <div className="h-full flex items-center justify-between px-4">
        <div className="text-xs text-muted-foreground">
          Welcome to Admin Dashboard
        </div>

        <div className="flex items-center gap-1">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {currentLanguage?.code?.toUpperCase() || "EN"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px]">
              {languages.length > 0 ? (
                languages.map((language) => (
                  <DropdownMenuItem
                    key={language.id}
                    onClick={() => handleLanguageChange(language.code)}
                    className={selectedLanguage === language.code ? "bg-accent" : ""}
                  >
                    <span className="flex-1">{language.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {language.code.toUpperCase()}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No languages available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {currentCurrency?.code || "USD"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px]">
              {currencies.length > 0 ? (
                currencies.map((currency) => (
                  <DropdownMenuItem
                    key={currency.id}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={selectedCurrency === currency.code ? "bg-accent" : ""}
                  >
                    <span className="mr-2">{currency.symbol}</span>
                    <span className="flex-1">{currency.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {currency.code}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No currencies available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="h-4 w-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="h-4 w-4 mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
