"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, ExternalLink, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from "@/components/common/page-loader";

export default function RecaptchaConfigPage() {
    const { data: settings, isLoading } = useSettingsByGroup("recaptcha");
    const bulkUpdateMutation = useBulkUpdateSettings();

    const [values, setValues] = useState({
        recaptcha_enabled: false,
        recaptcha_version: "v3",
        recaptcha_site_key: "",
        recaptcha_secret_key: "",
        recaptcha_score_threshold: "0.5",
    });

    useEffect(() => {
        if (settings) {
            const map: Record<string, string> = {};
            settings.forEach((s) => { map[s.key] = s.value || ""; });
            setValues({
                recaptcha_enabled: map.recaptcha_enabled === "true",
                recaptcha_version: map.recaptcha_version || "v3",
                recaptcha_site_key: map.recaptcha_site_key || "",
                recaptcha_secret_key: map.recaptcha_secret_key || "",
                recaptcha_score_threshold: map.recaptcha_score_threshold || "0.5",
            });
        }
    }, [settings]);

    const handleSave = () => {
        bulkUpdateMutation.mutate({
            group: "recaptcha",
            ...values,
            recaptcha_enabled: values.recaptcha_enabled.toString(),
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
                                    <Shield className="w-7 h-7 text-green-500" />
                                    Google reCAPTCHA Configuration
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Protect your forms from spam and bot submissions
                                </p>
                            </div>
                        </div>

                        <div className="max-w-2xl space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>reCAPTCHA Settings</CardTitle>
                                        <a
                                            href="https://www.google.com/recaptcha/admin"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            Admin Console <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                    <CardDescription>
                                        Register your site at the reCAPTCHA Admin Console to get your keys.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Enable */}
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div>
                                            <Label htmlFor="recaptcha_enabled" className="font-medium">Enable reCAPTCHA</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Protect login, registration, and contact forms
                                            </p>
                                        </div>
                                        <Switch
                                            id="recaptcha_enabled"
                                            checked={values.recaptcha_enabled}
                                            onCheckedChange={(v) => setValues({ ...values, recaptcha_enabled: v })}
                                        />
                                    </div>

                                    {/* Version */}
                                    <div className="space-y-2">
                                        <Label htmlFor="recaptcha_version">reCAPTCHA Version</Label>
                                        <Select
                                            value={values.recaptcha_version}
                                            onValueChange={(v) => setValues({ ...values, recaptcha_version: v })}
                                        >
                                            <SelectTrigger id="recaptcha_version">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="v2_checkbox">v2 — Checkbox (&quot;I&apos;m not a robot&quot;)</SelectItem>
                                                <SelectItem value="v2_invisible">v2 — Invisible Badge</SelectItem>
                                                <SelectItem value="v3">v3 — Score Based (Recommended)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            v3 runs in the background and scores requests without user interaction.
                                        </p>
                                    </div>

                                    <Separator />

                                    {/* Site key */}
                                    <div className="space-y-2">
                                        <Label htmlFor="recaptcha_site_key">Site Key (Public)</Label>
                                        <Input
                                            id="recaptcha_site_key"
                                            type="text"
                                            placeholder="6Lc••••••••••••••••••••••••••••••••"
                                            value={values.recaptcha_site_key}
                                            onChange={(e) => setValues({ ...values, recaptcha_site_key: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">Used in frontend JavaScript. Safe to expose.</p>
                                    </div>

                                    {/* Secret key */}
                                    <div className="space-y-2">
                                        <Label htmlFor="recaptcha_secret_key">Secret Key</Label>
                                        <Input
                                            id="recaptcha_secret_key"
                                            type="password"
                                            placeholder="6Lc••••••••••••••••••••••••••••••••"
                                            value={values.recaptcha_secret_key}
                                            onChange={(e) => setValues({ ...values, recaptcha_secret_key: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">Used on the server to verify tokens. Keep this private.</p>
                                    </div>

                                    {/* Score threshold (v3 only) */}
                                    {values.recaptcha_version === "v3" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="recaptcha_threshold">Score Threshold (v3 only)</Label>
                                            <Input
                                                id="recaptcha_threshold"
                                                type="number"
                                                min={0}
                                                max={1}
                                                step={0.1}
                                                placeholder="0.5"
                                                value={values.recaptcha_score_threshold}
                                                onChange={(e) => setValues({ ...values, recaptcha_score_threshold: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Requests scoring below this value will be rejected. Range: 0.0 (likely bot) to 1.0 (likely human).
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {bulkUpdateMutation.isPending ? "Saving..." : "Save reCAPTCHA Settings"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </PermissionGuard>
    );
}
