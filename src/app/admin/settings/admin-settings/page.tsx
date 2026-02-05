"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, ExternalLink, X } from "lucide-react";
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
import { useUploadMedia } from "@/hooks/use-media";
import { ImageCropper } from "@/components/common/image-cropper";
import { Spinner } from "@/components/ui/spinner";

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
  const bulkUpdateMutation = useBulkUpdateSettings();
  const uploadMedia = useUploadMedia();
  const [isSaving, setIsSaving] = useState(false);

  const [values, setValues] = useState({
    admin_logo: null as File | null,
    admin_logo_url: "",
    logo_height: "63",
    admin_favicon: null as File | null,
    admin_favicon_url: "",
    login_background: null as File | null,
    login_background_url: "",
    admin_title: "Shopper",
    primary_font: "inter",
    copyright_text: "",
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
        login_background_url: settingsMap.login_background_url || "",
        admin_title: settingsMap.admin_title || "Shopper",
        primary_font: settingsMap.primary_font || "inter",
        copyright_text: settingsMap.copyright_text || "",
      }));
    }
  }, [settings]);

  const handleLogoChange = (file: File) => {
    setValues({ ...values, admin_logo: file });
  };

  const handleFaviconChange = (file: File) => {
    setValues({ ...values, admin_favicon: file });
  };

  const handleBackgroundChange = (file: File) => {
    setValues({ ...values, login_background: file });
  };

  const removeLogo = () => {
    setValues({ ...values, admin_logo: null, admin_logo_url: "" });
  };

  const removeFavicon = () => {
    setValues({ ...values, admin_favicon: null, admin_favicon_url: "" });
  };

  const removeBackground = () => {
    setValues({ ...values, login_background: null, login_background_url: "" });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let logoUrl = values.admin_logo_url;
      let faviconUrl = values.admin_favicon_url;
      let backgroundUrl = values.login_background_url;

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

      if (values.login_background) {
        const result = await uploadMedia.mutateAsync({
          file: values.login_background,
          folder: "appearance/backgrounds",
        });
        backgroundUrl = result.url;
      }

      bulkUpdateMutation.mutate({
        group: "appearance",
        admin_logo_url: logoUrl,
        logo_height: values.logo_height,
        admin_favicon_url: faviconUrl,
        login_background_url: backgroundUrl,
        admin_title: values.admin_title,
        primary_font: values.primary_font,
        copyright_text: values.copyright_text,
      });

      setValues((prev) => ({
        ...prev,
        admin_logo: null,
        admin_logo_url: logoUrl,
        admin_favicon: null,
        admin_favicon_url: faviconUrl,
        login_background: null,
        login_background_url: backgroundUrl,
      }));
    } catch {
      // Error toasts handled by mutation hooks
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12" />
          <p className="text-sm text-muted-foreground">
            Loading site settings...
          </p>
        </div>
      </div>
    );
  }

  const currentLogoUrl = values.admin_logo
    ? URL.createObjectURL(values.admin_logo)
    : values.admin_logo_url;

  const currentFaviconUrl = values.admin_favicon
    ? URL.createObjectURL(values.admin_favicon)
    : values.admin_favicon_url;

  const currentBackgroundUrl = values.login_background
    ? URL.createObjectURL(values.login_background)
    : values.login_background_url;

  return (
    <>
      {/* Loading Overlay - Shows when saving */}
      {(isSaving || bulkUpdateMutation.isPending) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg shadow-lg border">
            <Spinner className="h-12 w-12" />
            <p className="text-sm font-medium">
              {isSaving ? "Uploading images..." : "Saving site settings..."}
            </p>
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
            <h1 className="text-3xl font-bold">Site Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure logo, favicon, title, font
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Site Logo
                {currentLogoUrl && (
                  <a
                    href={values.admin_logo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-normal text-primary hover:underline flex items-center gap-1"
                  >
                    View full image
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardTitle>
              <CardDescription>
                Upload a custom logo for your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageCropper
                title="Logo Image"
                description="Your site logo will be displayed in the header"
                targetWidth={300}
                targetHeight={100}
                currentImage={currentLogoUrl}
                onImageCropped={handleLogoChange}
                onRemove={removeLogo}
              />
            </CardContent>
          </Card>

          {/* Admin Favicon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Site Favicon
                {currentFaviconUrl && (
                  <a
                    href={values.admin_favicon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-normal text-primary hover:underline flex items-center gap-1"
                  >
                    View full image
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardTitle>
              <CardDescription>
                Icon shown in browser tabs and bookmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageCropper
                title="Favicon"
                description="Square icon for browser tabs"
                targetWidth={64}
                targetHeight={64}
                currentImage={currentFaviconUrl}
                onImageCropped={handleFaviconChange}
                onRemove={removeFavicon}
              />
            </CardContent>
          </Card>

          {/* Logo Height */}
          <Card>
            <CardHeader>
              <CardTitle>Logo Height</CardTitle>
              <CardDescription>
                Display height of the logo in pixels
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
                <p className="text-xs text-muted-foreground">
                  Default: 63px. Range: 10-200px
                </p>
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
                  placeholder="e.g., Shopper Admin"
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
          {/* Copyright Section */}
          <Card>
            <CardHeader>
              <CardTitle>Copyright</CardTitle>
              <CardDescription>
                Copyright text displayed in the footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="copyright_text">Copyright Text</Label>
                <Input
                  id="copyright_text"
                  type="text"
                  value={values.copyright_text}
                  onChange={(e) =>
                    setValues({ ...values, copyright_text: e.target.value })
                  }
                  placeholder="e.g., © 2024 Shopper. All rights reserved."
                />
                <p className="text-xs text-muted-foreground">
                  This text will appear in the footer of your site
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Screen Background */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Login Screen Background
              {currentBackgroundUrl && (
                <a
                  href={values.login_background_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-normal text-primary hover:underline flex items-center gap-1"
                >
                  View full image
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardTitle>
            <CardDescription>
              Upload a background image for the login screen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageCropper
              title="Login Background"
              description="Background image displayed on the login page"
              targetWidth={1920}
              targetHeight={1080}
              currentImage={currentBackgroundUrl}
              onImageCropped={handleBackgroundChange}
              onRemove={removeBackground}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || bulkUpdateMutation.isPending}
            size="lg"
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
    </>
  );
}
