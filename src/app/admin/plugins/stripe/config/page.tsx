"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, EyeOff, ExternalLink, CreditCard } from "lucide-react";
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

export default function StripeConfigPage() {
    const { data: settings, isLoading } = useSettingsByGroup("stripe");
    const bulkUpdateMutation = useBulkUpdateSettings();
    const [showSecrets, setShowSecrets] = useState({ secret: false, webhook: false });

    const [values, setValues] = useState({
        stripe_enabled: false,
        stripe_test_mode: true,
        stripe_publishable_key: "",
        stripe_secret_key: "",
        stripe_webhook_secret: "",
        stripe_currency: "USD",
    });

    useEffect(() => {
        if (settings) {
            const map: Record<string, string> = {};
            settings.forEach((s) => { map[s.key] = s.value || ""; });
            setValues({
                stripe_enabled: map.stripe_enabled === "true",
                stripe_test_mode: map.stripe_test_mode !== "false",
                stripe_publishable_key: map.stripe_publishable_key || "",
                stripe_secret_key: map.stripe_secret_key || "",
                stripe_webhook_secret: map.stripe_webhook_secret || "",
                stripe_currency: map.stripe_currency || "USD",
            });
        }
    }, [settings]);

    const handleSave = () => {
        bulkUpdateMutation.mutate({
            group: "stripe",
            ...values,
            stripe_enabled: values.stripe_enabled.toString(),
            stripe_test_mode: values.stripe_test_mode.toString(),
        });
    };

    const toggle = (key: "secret" | "webhook") =>
        setShowSecrets((p) => ({ ...p, [key]: !p[key] }));

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
                                    <CreditCard className="w-7 h-7 text-violet-500" />
                                    Stripe Payments Configuration
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Accept payments securely with Stripe
                                </p>
                            </div>
                        </div>

                        <div className="max-w-2xl space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Stripe API Keys</CardTitle>
                                        <a
                                            href="https://dashboard.stripe.com/apikeys"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            Stripe Dashboard <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                    <CardDescription>
                                        Configure your Stripe integration for accepting online payments.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Enable */}
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div>
                                            <Label htmlFor="stripe_enabled" className="font-medium">Enable Stripe Payments</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Activate Stripe as a payment gateway
                                            </p>
                                        </div>
                                        <Switch
                                            id="stripe_enabled"
                                            checked={values.stripe_enabled}
                                            onCheckedChange={(v) => setValues({ ...values, stripe_enabled: v })}
                                        />
                                    </div>

                                    {/* Test mode */}
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <Label htmlFor="stripe_test_mode" className="font-medium">Test Mode</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Use test keys. No real charges will be made.
                                                </p>
                                            </div>
                                            {values.stripe_test_mode && (
                                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950">
                                                    Test
                                                </Badge>
                                            )}
                                        </div>
                                        <Switch
                                            id="stripe_test_mode"
                                            checked={values.stripe_test_mode}
                                            onCheckedChange={(v) => setValues({ ...values, stripe_test_mode: v })}
                                        />
                                    </div>

                                    <Separator />

                                    {/* Publishable key */}
                                    <div className="space-y-2">
                                        <Label htmlFor="stripe_pk">Publishable Key</Label>
                                        <Input
                                            id="stripe_pk"
                                            type="text"
                                            placeholder={values.stripe_test_mode ? "pk_test_••••••••••••••" : "pk_live_••••••••••••••"}
                                            value={values.stripe_publishable_key}
                                            onChange={(e) => setValues({ ...values, stripe_publishable_key: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">Safe to include in client-side code.</p>
                                    </div>

                                    {/* Secret key */}
                                    <div className="space-y-2">
                                        <Label htmlFor="stripe_sk">Secret Key</Label>
                                        <div className="relative">
                                            <Input
                                                id="stripe_sk"
                                                type={showSecrets.secret ? "text" : "password"}
                                                placeholder={values.stripe_test_mode ? "sk_test_••••••••••••••" : "sk_live_••••••••••••••"}
                                                value={values.stripe_secret_key}
                                                onChange={(e) => setValues({ ...values, stripe_secret_key: e.target.value })}
                                                className="pr-10"
                                            />
                                            <Button type="button" variant="ghost" size="icon"
                                                className="absolute right-0 top-0 h-full" onClick={() => toggle("secret")}>
                                                {showSecrets.secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Never expose this key publicly.</p>
                                    </div>

                                    {/* Webhook secret */}
                                    <div className="space-y-2">
                                        <Label htmlFor="stripe_webhook">Webhook Signing Secret</Label>
                                        <div className="relative">
                                            <Input
                                                id="stripe_webhook"
                                                type={showSecrets.webhook ? "text" : "password"}
                                                placeholder="whsec_••••••••••••••"
                                                value={values.stripe_webhook_secret}
                                                onChange={(e) => setValues({ ...values, stripe_webhook_secret: e.target.value })}
                                                className="pr-10"
                                            />
                                            <Button type="button" variant="ghost" size="icon"
                                                className="absolute right-0 top-0 h-full" onClick={() => toggle("webhook")}>
                                                {showSecrets.webhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Found in your Stripe webhook endpoint settings. Used to verify webhook signatures.
                                        </p>
                                    </div>

                                    <Separator />

                                    {/* Currency */}
                                    <div className="space-y-2">
                                        <Label htmlFor="stripe_currency">Default Currency</Label>
                                        <Input
                                            id="stripe_currency"
                                            type="text"
                                            placeholder="USD"
                                            maxLength={3}
                                            value={values.stripe_currency}
                                            onChange={(e) => setValues({ ...values, stripe_currency: e.target.value.toUpperCase() })}
                                        />
                                        <p className="text-xs text-muted-foreground">ISO 4217 currency code (e.g. USD, EUR, GBP).</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {bulkUpdateMutation.isPending ? "Saving..." : "Save Stripe Settings"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </PermissionGuard>
    );
}
