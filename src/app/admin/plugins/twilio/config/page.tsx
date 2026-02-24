"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, EyeOff, ExternalLink, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from "@/components/common/page-loader";

export default function TwilioConfigPage() {
    const { data: settings, isLoading } = useSettingsByGroup("twilio");
    const bulkUpdateMutation = useBulkUpdateSettings();
    const [showToken, setShowToken] = useState(false);

    const [values, setValues] = useState({
        twilio_enabled: false,
        twilio_test_mode: true,
        twilio_account_sid: "",
        twilio_auth_token: "",
        twilio_from_number: "",
        twilio_messaging_service_sid: "",
    });

    useEffect(() => {
        if (settings) {
            const map: Record<string, string> = {};
            settings.forEach((s) => { map[s.key] = s.value || ""; });
            setValues({
                twilio_enabled: map.twilio_enabled === "true",
                twilio_test_mode: map.twilio_test_mode !== "false",
                twilio_account_sid: map.twilio_account_sid || "",
                twilio_auth_token: map.twilio_auth_token || "",
                twilio_from_number: map.twilio_from_number || "",
                twilio_messaging_service_sid: map.twilio_messaging_service_sid || "",
            });
        }
    }, [settings]);

    const handleSave = () => {
        bulkUpdateMutation.mutate({
            group: "twilio",
            ...values,
            twilio_enabled: values.twilio_enabled.toString(),
            twilio_test_mode: values.twilio_test_mode.toString(),
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
                                    <MessageSquare className="w-7 h-7 text-pink-500" />
                                    Twilio SMS Configuration
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Send SMS notifications and OTPs via Twilio
                                </p>
                            </div>
                        </div>

                        <div className="max-w-2xl space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Twilio API Credentials</CardTitle>
                                        <a
                                            href="https://console.twilio.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            Twilio Console <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                    <CardDescription>
                                        Find your Account SID and Auth Token on the Twilio Console dashboard.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Enable */}
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div>
                                            <Label htmlFor="twilio_enabled" className="font-medium">Enable Twilio SMS</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Activate SMS sending across your application
                                            </p>
                                        </div>
                                        <Switch
                                            id="twilio_enabled"
                                            checked={values.twilio_enabled}
                                            onCheckedChange={(v) => setValues({ ...values, twilio_enabled: v })}
                                        />
                                    </div>

                                    {/* Test mode */}
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <Label htmlFor="twilio_test_mode" className="font-medium">Test Mode</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Use test credentials. No real SMS will be sent.
                                                </p>
                                            </div>
                                            {values.twilio_test_mode && (
                                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950">
                                                    Test
                                                </Badge>
                                            )}
                                        </div>
                                        <Switch
                                            id="twilio_test_mode"
                                            checked={values.twilio_test_mode}
                                            onCheckedChange={(v) => setValues({ ...values, twilio_test_mode: v })}
                                        />
                                    </div>

                                    <Separator />

                                    {/* Account SID */}
                                    <div className="space-y-2">
                                        <Label htmlFor="twilio_sid">Account SID</Label>
                                        <Input
                                            id="twilio_sid"
                                            type="text"
                                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            value={values.twilio_account_sid}
                                            onChange={(e) => setValues({ ...values, twilio_account_sid: e.target.value })}
                                        />
                                    </div>

                                    {/* Auth Token */}
                                    <div className="space-y-2">
                                        <Label htmlFor="twilio_token">Auth Token</Label>
                                        <div className="relative">
                                            <Input
                                                id="twilio_token"
                                                type={showToken ? "text" : "password"}
                                                placeholder="••••••••••••••••••••••••••••••••"
                                                value={values.twilio_auth_token}
                                                onChange={(e) => setValues({ ...values, twilio_auth_token: e.target.value })}
                                                className="pr-10"
                                            />
                                            <Button type="button" variant="ghost" size="icon"
                                                className="absolute right-0 top-0 h-full" onClick={() => setShowToken(!showToken)}>
                                                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Keep this private — never expose it in client-side code.</p>
                                    </div>

                                    <Separator />

                                    {/* From number */}
                                    <div className="space-y-2">
                                        <Label htmlFor="twilio_from">From Phone Number</Label>
                                        <Input
                                            id="twilio_from"
                                            type="tel"
                                            placeholder="+1234567890"
                                            value={values.twilio_from_number}
                                            onChange={(e) => setValues({ ...values, twilio_from_number: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Your Twilio phone number in E.164 format (e.g. +1234567890).
                                        </p>
                                    </div>

                                    {/* Messaging Service SID (optional) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="twilio_msid">
                                            Messaging Service SID{" "}
                                            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                                        </Label>
                                        <Input
                                            id="twilio_msid"
                                            type="text"
                                            placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            value={values.twilio_messaging_service_sid}
                                            onChange={(e) => setValues({ ...values, twilio_messaging_service_sid: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            If provided, messages will be sent via a Messaging Service instead of a direct phone number.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {bulkUpdateMutation.isPending ? "Saving..." : "Save Twilio Settings"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </PermissionGuard>
    );
}
