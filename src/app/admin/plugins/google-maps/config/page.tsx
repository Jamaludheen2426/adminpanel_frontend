"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, EyeOff, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from "@/components/common/page-loader";

export default function GoogleMapsConfigPage() {
    const { data: settings, isLoading } = useSettingsByGroup("google_maps");
    const bulkUpdateMutation = useBulkUpdateSettings();
    const [showKey, setShowKey] = useState(false);

    const [values, setValues] = useState({
        google_maps_enabled: false,
        google_maps_api_key: "",
        google_maps_default_lat: "0",
        google_maps_default_lng: "0",
        google_maps_default_zoom: "12",
    });

    useEffect(() => {
        if (settings) {
            const map: Record<string, string> = {};
            settings.forEach((s) => { map[s.key] = s.value || ""; });
            setValues({
                google_maps_enabled: map.google_maps_enabled === "true",
                google_maps_api_key: map.google_maps_api_key || "",
                google_maps_default_lat: map.google_maps_default_lat || "0",
                google_maps_default_lng: map.google_maps_default_lng || "0",
                google_maps_default_zoom: map.google_maps_default_zoom || "12",
            });
        }
    }, [settings]);

    const handleSave = () => {
        bulkUpdateMutation.mutate({
            group: "google_maps",
            ...values,
            google_maps_enabled: values.google_maps_enabled.toString(),
        });
    };

    return (
        <PermissionGuard permission="plugins.manage">
            <>
                <PageLoader open={isLoading} />
                {!isLoading && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <Link href="/admin/plugins">
                                <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <MapPin className="w-7 h-7 text-red-500" />
                                    Google Maps Configuration
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Embed interactive maps and enable location-based features
                                </p>
                            </div>
                        </div>

                        <div className="max-w-2xl space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Google Maps API</CardTitle>
                                        <a
                                            href="https://console.cloud.google.com/apis/credentials"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            Get API Key <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                    <CardDescription>
                                        Enter your Google Maps API key. Enable the Maps JavaScript API and Places API in your Google Cloud Console.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Enable toggle */}
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div>
                                            <Label htmlFor="maps_enabled" className="font-medium">Enable Google Maps</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Activate maps across your application
                                            </p>
                                        </div>
                                        <Switch
                                            id="maps_enabled"
                                            checked={values.google_maps_enabled}
                                            onCheckedChange={(v) => setValues({ ...values, google_maps_enabled: v })}
                                        />
                                    </div>

                                    <Separator />

                                    {/* API Key */}
                                    <div className="space-y-2">
                                        <Label htmlFor="maps_api_key">API Key</Label>
                                        <div className="relative">
                                            <Input
                                                id="maps_api_key"
                                                type={showKey ? "text" : "password"}
                                                placeholder="AIzaSy••••••••••••••••••••••••••••••••"
                                                value={values.google_maps_api_key}
                                                onChange={(e) => setValues({ ...values, google_maps_api_key: e.target.value })}
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button" variant="ghost" size="icon"
                                                className="absolute right-0 top-0 h-full"
                                                onClick={() => setShowKey(!showKey)}
                                            >
                                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Restrict your API key to specific domains for production use.
                                        </p>
                                    </div>

                                    <Separator />

                                    {/* Default coordinates */}
                                    <div>
                                        <Label className="font-medium">Default Map Center</Label>
                                        <p className="text-xs text-muted-foreground mb-3 mt-0.5">
                                            Coordinates the map will center on when no location is specified.
                                        </p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="maps_lat" className="text-xs">Latitude</Label>
                                                <Input
                                                    id="maps_lat"
                                                    type="number"
                                                    step="any"
                                                    placeholder="0.0000"
                                                    value={values.google_maps_default_lat}
                                                    onChange={(e) => setValues({ ...values, google_maps_default_lat: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="maps_lng" className="text-xs">Longitude</Label>
                                                <Input
                                                    id="maps_lng"
                                                    type="number"
                                                    step="any"
                                                    placeholder="0.0000"
                                                    value={values.google_maps_default_lng}
                                                    onChange={(e) => setValues({ ...values, google_maps_default_lng: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="maps_zoom" className="text-xs">Zoom (1–20)</Label>
                                                <Input
                                                    id="maps_zoom"
                                                    type="number"
                                                    min={1} max={20}
                                                    placeholder="12"
                                                    value={values.google_maps_default_zoom}
                                                    onChange={(e) => setValues({ ...values, google_maps_default_zoom: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {bulkUpdateMutation.isPending ? "Saving..." : "Save Google Maps Settings"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </PermissionGuard>
    );
}
