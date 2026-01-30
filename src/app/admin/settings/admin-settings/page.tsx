"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  useSettingsByGroup,
  useBulkUpdateSettings,
} from "@/hooks/use-settings";
import { useActiveLanguages } from "@/hooks/use-languages";
import { useUploadMedia, useUploadMultipleMedia } from "@/hooks/use-media";

const fonts = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "opensans", label: "Open Sans" },
  { value: "lato", label: "Lato" },
  { value: "montserrat", label: "Montserrat" },
  { value: "poppins", label: "Poppins" },
];

export default function SiteSettingsPage() {
  const { data: settings, isLoading } = useSettingsByGroup("appearance");
  const { data: languages = [] } = useActiveLanguages();
  const bulkUpdateMutation = useBulkUpdateSettings();
  const uploadMedia = useUploadMedia();
  const uploadMultipleMedia = useUploadMultipleMedia();
  const [isSaving, setIsSaving] = useState(false);

  const [values, setValues] = useState({
    admin_logo: null as File | null,
    admin_logo_url: "",
    logo_height: "63",
    admin_favicon: null as File | null,
    admin_favicon_url: "",
    login_backgrounds: [] as File[],
    login_background_urls: [] as string[],
    admin_title: "Shopper",
    primary_font: "inter",
    admin_language: "en",
    admin_direction: "ltr",
  });

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      setValues((prev) => ({
        ...prev,
        admin_logo_url: settingsMap.admin_logo_url || "",
        logo_height: settingsMap.logo_height || "63",
        admin_favicon_url: settingsMap.admin_favicon_url || "",
        login_background_urls: settingsMap.login_background_urls
          ? settingsMap.login_background_urls.split(",")
          : [],
        admin_title: settingsMap.admin_title || "Shopper",
        primary_font: settingsMap.primary_font || "inter",
        admin_language: settingsMap.admin_language || "en",
        admin_direction: settingsMap.admin_direction || "ltr",
      }));
    }
  }, [settings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValues({ ...values, admin_logo: e.target.files[0] });
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValues({ ...values, admin_favicon: e.target.files[0] });
    }
  };

  const handleBackgroundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    const filesArray = Array.from(e.target.files);
    // Add new files to existing ones instead of replacing
    setValues({ 
      ...values, 
      login_backgrounds: [...values.login_backgrounds, ...filesArray] 
    });
  }
};

  const removeLogo = () => {
    setValues({ ...values, admin_logo: null, admin_logo_url: "" });
  };

  const removeFavicon = () => {
    setValues({ ...values, admin_favicon: null, admin_favicon_url: "" });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let logoUrl = values.admin_logo_url;
      let faviconUrl = values.admin_favicon_url;
      let backgroundUrls = [...values.login_background_urls];

      if (values.admin_logo) {
        const result = await uploadMedia.mutateAsync({
          file: values.admin_logo,
          folder: "appearance",
        });
        logoUrl = result.url;
      }

      if (values.admin_favicon) {
        const result = await uploadMedia.mutateAsync({
          file: values.admin_favicon,
          folder: "appearance",
        });
        faviconUrl = result.url;
      }

      if (values.login_backgrounds.length > 0) {
        const results = await uploadMultipleMedia.mutateAsync({
          files: values.login_backgrounds,
          folder: "appearance/backgrounds",
        });
        backgroundUrls = [...backgroundUrls, ...results.map((r) => r.url)];
      }

      bulkUpdateMutation.mutate({
        group: "appearance",
        admin_logo_url: logoUrl,
        logo_height: values.logo_height,
        admin_favicon_url: faviconUrl,
        login_background_urls: backgroundUrls.join(","),
        admin_title: values.admin_title,
        primary_font: values.primary_font,
        admin_language: values.admin_language,
        admin_direction: values.admin_direction,
      });

      setValues((prev) => ({
        ...prev,
        admin_logo: null,
        admin_logo_url: logoUrl,
        admin_favicon: null,
        admin_favicon_url: faviconUrl,
        login_backgrounds: [],
        login_background_urls: backgroundUrls,
      }));
    } catch {
      // Error toasts handled by mutation hooks
    } finally {
      setIsSaving(false);
    }
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
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure logo, favicon, title, font, language, and layout
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Site Logo</CardTitle>
            <CardDescription>
              Upload a custom logo. Recommended: 150x50px
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(values.admin_logo || values.admin_logo_url) && (
                <div className="relative inline-block">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <img
                      src={
                        values.admin_logo
                          ? URL.createObjectURL(values.admin_logo)
                          : values.admin_logo_url
                      }
                      alt="Admin logo"
                      className="h-16 object-contain"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Favicon */}
        <Card>
          <CardHeader>
            <CardTitle>Site Favicon</CardTitle>
            <CardDescription>
              Icon shown in browser tabs and bookmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(values.admin_favicon || values.admin_favicon_url) && (
                <div className="relative inline-block">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <img
                      src={
                        values.admin_favicon
                          ? URL.createObjectURL(values.admin_favicon)
                          : values.admin_favicon_url
                      }
                      alt="Favicon"
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeFavicon}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                  <input
                    type="file"
                    accept="image/*,.ico"
                    className="hidden"
                    onChange={handleFaviconChange}
                  />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logo Height */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Height (px)</CardTitle>
            <CardDescription>
              Display height of the logo. Default: 63px
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="logo_height">Height (pixels)</Label>
              <Input
                id="logo_height"
                type="number"
                value={values.logo_height}
                onChange={(e) =>
                  setValues({ ...values, logo_height: e.target.value })
                }
                min="10"
                max="200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin Title */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Title</CardTitle>
            <CardDescription>Title shown in browser tab</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="admin_title">Title</Label>
              <Input
                id="admin_title"
                type="text"
                value={values.admin_title}
                onChange={(e) =>
                  setValues({ ...values, admin_title: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Font */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Font</CardTitle>
            <CardDescription>Font family for the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={values.primary_font}
                onValueChange={(val) =>
                  setValues({ ...values, primary_font: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Admin Language */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Language</CardTitle>
            <CardDescription>Language for the admin interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={values.admin_language}
                onValueChange={(val) =>
                  setValues({ ...values, admin_language: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name} - {lang.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Admin Direction */}
        <Card>
          <CardHeader>
            <CardTitle>Text Direction</CardTitle>
            <CardDescription>
              Text direction for the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={values.admin_direction}
              onValueChange={(val) =>
                setValues({ ...values, admin_direction: val })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ltr" id="ltr" />
                <Label htmlFor="ltr" className="cursor-pointer">
                  Left to Right
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rtl" id="rtl" />
                <Label htmlFor="rtl" className="cursor-pointer">
                  Right to Left
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Login Screen Backgrounds (full width) */}
      <Card>
        <CardHeader>
          <CardTitle>Login Screen Backgrounds</CardTitle>
          <CardDescription>
            Upload background images for the login screen (~1366x768px). Images
            rotate randomly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <label className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Click to add images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleBackgroundsChange}
                />
              </label>
            </div>
            {(values.login_background_urls.length > 0 ||
              values.login_backgrounds.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Show existing saved backgrounds */}
                {values.login_background_urls.map((url, index) => (
                  <div key={`saved-${index}`} className="relative">
                    <img
                      src={url}
                      alt={`Background ${index + 1}`}
                      className="rounded-lg w-full h-32 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => {
                        const newUrls = values.login_background_urls.filter(
                          (_, i) => i !== index,
                        );
                        setValues({
                          ...values,
                          login_background_urls: newUrls,
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Show newly uploaded backgrounds (not yet saved) */}
                {values.login_backgrounds.map((file, index) => (
                  <div key={`new-${index}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New background ${index + 1}`}
                      className="rounded-lg w-full h-32 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => {
                        const newFiles = values.login_backgrounds.filter(
                          (_, i) => i !== index,
                        );
                        setValues({ ...values, login_backgrounds: newFiles });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || bulkUpdateMutation.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving
            ? "Uploading..."
            : bulkUpdateMutation.isPending
              ? "Saving..."
              : "Save Site Settings"}
        </Button>
      </div>
    </div>
  );
}
