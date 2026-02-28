"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    CreditCard, Star, ChevronRight, CheckCircle2,
    AlertCircle, Puzzle, ArrowRight,
} from "lucide-react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/common/page-loader";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import { useIsPluginActive } from "@/hooks/use-plugins";

// ─── Gateway definitions ──────────────────────────────────────────────────────

export interface GatewayDef {
    slug: string;
    name: string;
    tagline: string;
    group: string;
    enabledKey: string;
    defaultKey: string;
    primaryKeyField: string;
    logo: React.ReactNode;
}

export const GATEWAYS: GatewayDef[] = [
    {
        slug: "stripe",
        name: "Stripe",
        tagline: "Cards, wallets, and more via Stripe",
        group: "stripe",
        enabledKey: "stripe_enabled",
        defaultKey: "stripe_is_default",
        primaryKeyField: "stripe_publishable_key",
        logo: (
            <svg viewBox="0 0 60 26" className="h-6 w-auto" fill="none">
                <path fill="#635BFF" d="M11.6 10.2c0-1 .9-1.4 2.3-1.4 2 0 4.5.6 6.5 1.7V5c-2.1-.9-4.3-1.2-6.5-1.2-5.4 0-9 2.8-9 7.5 0 7.3 10 6.1 10 9.3 0 1.2-1 1.6-2.5 1.6-2.1 0-5-.9-7.1-2.2v5.9c2.4 1 4.8 1.5 7.1 1.5 5.5 0 9.3-2.7 9.3-7.5C21.7 12 11.6 13.4 11.6 10.2zM29.6 1l-6 1.3V26h5.8V1zM40 7.5c-2.3 0-3.8 1.1-4.6 1.8l-.3-1.4h-5.2v26.2l5.8-1.2v-6.3c.9.6 2.2 1.4 4.2 1.4 4.4 0 8.4-3.5 8.4-10.9C48.3 10.4 44.3 7.5 40 7.5zm-1.4 16.7c-1.4 0-2.3-.5-2.9-1.2l-.1-9.4c.6-.7 1.5-1.2 3-1.2 2.3 0 3.8 2.6 3.8 5.9 0 3.4-1.6 5.9-3.8 5.9z" />
            </svg>
        ),
    },
    {
        slug: "paypal",
        name: "PayPal",
        tagline: "Fast and trusted global payments",
        group: "paypal",
        enabledKey: "paypal_enabled",
        defaultKey: "paypal_is_default",
        primaryKeyField: "paypal_client_id",
        logo: (
            <svg viewBox="0 0 80 20" className="h-6 w-auto" fill="none">
                <path fill="#253B80" d="M8 0h9c4 0 7 2 6 6C21 11 17 14 13 14H10L8 20H3L8 0zm4 10h3c2 0 3-1 3-3 0-1-.5-2-2-2H13L11 10zM22 3h9c4 0 7 2 6 6C35 14 31 17 27 17h-3l-2 7H17L22 3zm4 10h3c2 0 3-1 3-3 0-1-.5-2-2-2H27L25 13z" />
                <path fill="#179BD7" d="M36 0h9c4 0 7 2 6 6C49 11 45 14 41 14H38L36 20H31L36 0zm4 10h3c2 0 3-1 3-3 0-1-.5-2-2-2H40L38 10z" />
            </svg>
        ),
    },
    {
        slug: "razorpay",
        name: "Razorpay",
        tagline: "Cards, UPI, wallets & more — India-focused",
        group: "razorpay",
        enabledKey: "razorpay_enabled",
        defaultKey: "razorpay_is_default",
        primaryKeyField: "razorpay_key_id",
        logo: (
            <svg viewBox="0 0 110 24" className="h-5 w-auto" fill="none">
                <path fill="#072654" d="M6 2h5l8 17H14L6 2zm6 0l14 17H21L8 2h4z" />
                <text x="26" y="18" fontFamily="Arial" fontSize="14" fontWeight="700" fill="#072654">Razorpay</text>
            </svg>
        ),
    },
    {
        slug: "paystack",
        name: "Paystack",
        tagline: "Reliable payments across Africa",
        group: "paystack",
        enabledKey: "paystack_enabled",
        defaultKey: "paystack_is_default",
        primaryKeyField: "paystack_public_key",
        logo: (
            <svg viewBox="0 0 100 22" className="h-5 w-auto" fill="none">
                <rect x="1" y="2" width="18" height="5" rx="2.5" fill="#00C3F7" />
                <rect x="1" y="9" width="12" height="5" rx="2.5" fill="#40DDA1" />
                <rect x="1" y="16" width="15" height="5" rx="2.5" fill="#00C3F7" />
                <text x="24" y="17" fontFamily="Arial" fontSize="14" fontWeight="700" fill="#00C3F7">paystack</text>
            </svg>
        ),
    },
    {
        slug: "mollie",
        name: "Mollie",
        tagline: "Effortless European online payments",
        group: "mollie",
        enabledKey: "mollie_enabled",
        defaultKey: "mollie_is_default",
        primaryKeyField: "mollie_api_key",
        logo: (
            <svg viewBox="0 0 70 22" className="h-5 w-auto" fill="none">
                <text x="0" y="18" fontFamily="Georgia,serif" fontSize="20" fontWeight="900" fill="#000">mollie</text>
            </svg>
        ),
    },
    {
        slug: "flutterwave",
        name: "Flutterwave",
        tagline: "Pan-African payment infrastructure",
        group: "flutterwave",
        enabledKey: "flutterwave_enabled",
        defaultKey: "flutterwave_is_default",
        primaryKeyField: "flutterwave_public_key",
        logo: (
            <svg viewBox="0 0 30 30" className="h-7 w-auto" fill="none">
                <circle cx="15" cy="15" r="15" fill="#F5A623" />
                <path d="M20 9c-2 0-3.5 1-4.5 2.5C14.5 10 13 9 11 9c-3 0-5 2.3-5 5.5s2 5.5 5 5.5c2 0 3.5-1 4.5-2.5C16.5 19 18 20 20 20c3 0 5-2.3 5-5.5S23 9 20 9z" fill="#fff" />
            </svg>
        ),
    },
];

// ─── Gateway Card ─────────────────────────────────────────────────────────────

function GatewayCard({
    gateway,
    isDefault,
    onToggleDefault,
}: {
    gateway: GatewayDef;
    isDefault: boolean;
    onToggleDefault: (slug: string) => void;
}) {
    const { data: settings, isLoading } = useSettingsByGroup(gateway.group);
    const bulkUpdate = useBulkUpdateSettings();

    const getVal = (key: string) =>
        settings?.find((s) => s.key === key)?.value ?? "";

    const isEnabled = getVal(gateway.enabledKey) === "true";
    const isConfigured = !!getVal(gateway.primaryKeyField);

    const toggle = () => {
        bulkUpdate.mutate({ group: gateway.group, [gateway.enabledKey]: (!isEnabled).toString() });
    };

    return (
        <Card className={`transition-all duration-200 hover:shadow-md ${isEnabled ? "border-primary/30" : ""}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                    {/* Logo area */}
                    <div className="shrink-0 flex items-center justify-center w-28 h-12 rounded-lg border bg-muted/40 px-3">
                        {gateway.logo}
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">{gateway.name}</CardTitle>
                            {isDefault && (
                                <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400">
                                    <Star className="w-2.5 h-2.5 fill-current" /> Default
                                </Badge>
                            )}
                            {isConfigured ? (
                                <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-300 dark:text-emerald-400">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Configured
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-300 dark:text-amber-400">
                                    <AlertCircle className="w-2.5 h-2.5" /> Setup Required
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="text-xs mt-0.5">{gateway.tagline}</CardDescription>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <button
                            onClick={() => onToggleDefault(gateway.slug)}
                            className={`p-1.5 rounded-md transition-colors hover:bg-muted ${isDefault ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
                                }`}
                            title={isDefault ? "Default gateway" : "Set as default"}
                        >
                            <Star className={`w-4 h-4 ${isDefault ? "fill-current" : ""}`} />
                        </button>
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={toggle}
                            disabled={isLoading || bulkUpdate.isPending}
                        />
                        <Link href={`/admin/payments/${gateway.slug}`}>
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                {isConfigured ? "Edit" : "Setup"}
                                <ChevronRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardHeader>

            {/* Bottom info row */}
            <Separator />
            <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">
                    {isConfigured
                        ? `Use ${gateway.name} to process payments at checkout`
                        : `Enter your ${gateway.name} API credentials to activate this gateway`}
                </p>
            </CardContent>
        </Card>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentsContent() {
    const [defaultGateway, setDefaultGateway] = useState<string>("");

    // Check which payment plugins are active — gateways only show if plugin is enabled
    const stripeActive = useIsPluginActive("stripe");
    const paypalActive = useIsPluginActive("paypal");
    const razorpayActive = useIsPluginActive("razorpay");
    const paystackActive = useIsPluginActive("paystack");
    const mollieActive = useIsPluginActive("mollie");
    const flutterwaveActive = useIsPluginActive("flutterwave");

    const pluginActiveMap: Record<string, boolean> = {
        stripe: stripeActive,
        paypal: paypalActive,
        razorpay: razorpayActive,
        paystack: paystackActive,
        mollie: mollieActive,
        flutterwave: flutterwaveActive,
    };

    const visibleGateways = GATEWAYS.filter((g) => pluginActiveMap[g.slug]);

    const handleToggleDefault = (slug: string) => {
        setDefaultGateway((prev) => (prev === slug ? "" : slug));
    };

    return (
        <PermissionGuard permission="payments.view">
            <div className="space-y-6">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-primary" />
                            Payment Methods
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure payment gateways for checkout. Enable plugins first to manage them here.
                        </p>
                    </div>
                    {visibleGateways.length > 0 && (
                        <Badge variant="secondary" className="gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {visibleGateways.length} active
                        </Badge>
                    )}
                </div>

                {/* ── Hint ── */}
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Star sets as default checkout gateway</span>
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Toggle to enable / disable at checkout</span>
                        <span className="flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-primary" /> Edit to configure API credentials</span>
                    </CardContent>
                </Card>

                {/* ── No plugins enabled state ── */}
                {visibleGateways.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                                <Puzzle className="w-7 h-7 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-base mb-1">No payment plugins enabled</CardTitle>
                                <CardDescription className="max-w-sm">
                                    Go to the Plugins page and enable the payment gateways you want to use.
                                    They will appear here once activated.
                                </CardDescription>
                            </div>
                            <Link href="/admin/plugins">
                                <Button variant="default" className="gap-2">
                                    <Puzzle className="w-4 h-4" />
                                    Go to Plugins
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* ── Gateway list (only enabled plugins) ── */}
                {visibleGateways.length > 0 && (
                    <div className="space-y-3">
                        {visibleGateways.map((gateway) => (
                            <GatewayCard
                                key={gateway.slug}
                                gateway={gateway}
                                isDefault={defaultGateway === gateway.slug}
                                onToggleDefault={handleToggleDefault}
                            />
                        ))}
                    </div>
                )}

            </div>
        </PermissionGuard>
    );
}
