"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";

const countries = [
  { code: "AF", name: "Afghanistan" },
  { code: "AX", name: "Åland Islands" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AS", name: "American Samoa" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AI", name: "Anguilla" },
  { code: "AQ", name: "Antarctica" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AW", name: "Aruba" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BM", name: "Bermuda" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CV", name: "Cape Verde" },
  { code: "KY", name: "Cayman Islands" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" },
  { code: "CK", name: "Cook Islands" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GL", name: "Greenland" },
  { code: "GD", name: "Grenada" },
  { code: "GU", name: "Guam" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macao" },
  { code: "MK", name: "Macedonia" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SZ", name: "Swaziland" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

export function PhoneContent() {
  const { data: settings, isLoading } = useSettingsByGroup("phone");
  const bulkUpdateMutation = useBulkUpdateSettings();

  const [values, setValues] = useState({
    enable_country_code: true,
    selected_countries: countries.map((c) => c.code).join(","),
    min_length: "8",
    max_length: "15",
  });

  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      setValues({
        enable_country_code: settingsMap.enable_country_code === "true",
        selected_countries: settingsMap.selected_countries || countries.map((c) => c.code).join(","),
        min_length: settingsMap.min_length || "8",
        max_length: settingsMap.max_length || "15",
      });
      
      const selectedCodes = (settingsMap.selected_countries || "").split(",");
      setSelectAll(selectedCodes.length === countries.length);
    }
  }, [settings]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setValues({ ...values, selected_countries: countries.map((c) => c.code).join(",") });
    } else {
      setValues({ ...values, selected_countries: "" });
    }
  };

  const handleCountryToggle = (code: string) => {
    const currentCountries = values.selected_countries ? values.selected_countries.split(",") : [];
    let newCountries;
    
    if (currentCountries.includes(code)) {
      newCountries = currentCountries.filter((c) => c !== code);
    } else {
      newCountries = [...currentCountries, code];
    }
    
    setSelectAll(newCountries.length === countries.length);
    setValues({ ...values, selected_countries: newCountries.join(",") });
  };

  const isCountrySelected = (code: string) => {
    const currentCountries = values.selected_countries ? values.selected_countries.split(",") : [];
    return currentCountries.includes(code);
  };

  const handleSave = () => {
    bulkUpdateMutation.mutate({
      group: "phone",
      enable_country_code: String(values.enable_country_code),
      selected_countries: values.selected_countries,
      min_length: values.min_length,
      max_length: values.max_length,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Phone Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure phone number validation and country code options
          </p>
        </div>
      </div>

      {/* Enable Country Code Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Checkbox
              id="enable-country"
              checked={values.enable_country_code}
              onCheckedChange={(checked) => 
                setValues({ ...values, enable_country_code: checked as boolean })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="enable-country" className="text-lg font-semibold cursor-pointer">
                Enable Country Code Selection
              </Label>
              <CardDescription className="mt-1">
                When enabled, phone number fields will display a country code selector with automatic country detection.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {values.enable_country_code && (
          <CardContent className="space-y-4">
            {/* Select All Countries */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="select-all" className="text-base font-medium cursor-pointer">
                    All
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select all countries to be available in the phone country code selector.
                  </p>
                </div>
              </div>
            </div>

            {/* Available Countries */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Available Countries</Label>
              <ScrollArea className="h-64 border rounded-md">
                <div className="p-4 space-y-2">
                  {countries.map((country) => (
                    <div key={country.code} className="flex items-center gap-3">
                      <Checkbox
                        id={country.code}
                        checked={isCountrySelected(country.code)}
                        onCheckedChange={() => handleCountryToggle(country.code)}
                      />
                      <Label
                        htmlFor={country.code}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {country.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Minimum Length */}
      <Card>
        <CardHeader>
          <CardTitle>Minimum Length</CardTitle>
          <CardDescription>
            Minimum number of characters required for phone numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="min_length">Minimum Length</Label>
            <div className="relative">
              <Input
                id="min_length"
                type="number"
                value={values.min_length}
                onChange={(e) => setValues({ ...values, min_length: e.target.value })}
                min="1"
                max="20"
              />
              {values.min_length && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maximum Length */}
      <Card>
        <CardHeader>
          <CardTitle>Maximum Length</CardTitle>
          <CardDescription>
            Maximum number of characters allowed for phone numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="max_length">Maximum Length</Label>
            <div className="relative">
              <Input
                id="max_length"
                type="number"
                value={values.max_length}
                onChange={(e) => setValues({ ...values, max_length: e.target.value })}
                min="1"
                max="20"
              />
              {values.max_length && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>For local format (without country code):</strong> Set min/max based on your country's phone number length (e.g., 8-15 for most countries).
            </p>
            <p>
              <strong>For international format (with country code enabled):</strong> Recommended min: 7, max: 20. This accommodates country codes (1-4 digits) + phone numbers (typically 6-15 digits).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {bulkUpdateMutation.isPending ? "Saving..." : "Save Phone Settings"}
        </Button>
      </div>
    </div>
  );
}