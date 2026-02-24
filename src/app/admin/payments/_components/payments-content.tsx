"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    CreditCard, Star, Settings2, ChevronRight, CheckCircle2,
    AlertCircle, Shield, Zap,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/common/page-loader";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import { toast } from "sonner";

// ─── Gateway definitions ──────────────────────────────────────────────────────

export interface GatewayDef {
    slug: string;
    name: string;
    tagline: string;
    group: string;
    enabledKey: string;
    defaultKey: string;
    primaryKeyField: string; // used to detect "is configured"
    accentColor: string;
    brandColor: string;
    logo: React.ReactNode;
}

export const GATEWAYS: GatewayDef[] = [
    {
        slug: "stripe",
        name: "Stripe",
        tagline: "Accept Visa, Mastercard, and more via Stripe.",
        group: "stripe",
        enabledKey: "stripe_enabled",
        defaultKey: "stripe_is_default",
        primaryKeyField: "stripe_publishable_key",
        accentColor: "from-indigo-500/10 to-violet-500/10",
        brandColor: "#635BFF",
        logo: (
            <svg viewBox="0 0 60 25" className="h-7" fill="none">
                <path fill="#635BFF" d="M11.6 10.2c0-1 .9-1.4 2.3-1.4 2 0 4.6.6 6.6 1.7V5c-2.2-.9-4.4-1.2-6.6-1.2-5.4 0-9 2.8-9 7.5 0 7.3 10 6.1 10 9.3 0 1.2-1 1.6-2.5 1.6-2.2 0-5-.9-7.2-2.2v5.9c2.4 1 4.9 1.5 7.2 1.5 5.5 0 9.3-2.7 9.3-7.5-.1-7.9-10.1-6.5-10.1-9.7zM29.6 1l-6 1.3V26h5.8V1zM40 7.5c-2.3 0-3.8 1.1-4.7 1.8l-.3-1.4h-5.2v26.2l5.8-1.2v-6.3c.9.6 2.2 1.4 4.3 1.4 4.4 0 8.4-3.5 8.4-10.9C48.3 10.4 44.3 7.5 40 7.5zm-1.5 16.7c-1.4 0-2.3-.5-2.9-1.2l-.1-9.4c.6-.7 1.6-1.2 3-1.2 2.3 0 3.9 2.6 3.9 5.9-.1 3.4-1.7 5.9-3.9 5.9z" />
            </svg>
        ),
    },
    {
        slug: "paypal",
        name: "PayPal",
        tagline: "Fast and trusted global payments via PayPal.",
        group: "paypal",
        enabledKey: "paypal_enabled",
        defaultKey: "paypal_is_default",
        primaryKeyField: "paypal_client_id",
        accentColor: "from-blue-500/10 to-cyan-500/10",
        brandColor: "#003087",
        logo: (
            <svg viewBox="0 0 100 30" className="h-7" fill="none">
                <path fill="#003087" d="M12 0h14c7 0 10 4 9 10C33 17 27 21 20 21h-4l-2 9H7L12 0zm5 15h3c3 0 5-2 5-5 0-2-1-4-4-4h-3L16 15zM35 3h14c7 0 9 4 8 9-2 7-8 11-15 11h-4l-2 7H29L35 3zm5 14h3c3 0 5-1 5-4 0-2-1-4-4-4h-3L38 17z" />
                <path fill="#009CDE" d="M58 0h14c7 0 10 4 9 10C79 17 73 21 66 21h-4l-2 9H53L58 0zm5 15h3c3 0 5-2 5-5 0-2-1-4-4-4h-3L61 15z" />
            </svg>
        ),
    },
    {
        slug: "razorpay",
        name: "Razorpay",
        tagline: "Accept payments via cards, UPI, wallets & more.",
        group: "razorpay",
        enabledKey: "razorpay_enabled",
        defaultKey: "razorpay_is_default",
        primaryKeyField: "razorpay_key_id",
        accentColor: "from-sky-500/10 to-blue-500/10",
        brandColor: "#072654",
        logo: (
            <svg viewBox="0 0 120 30" className="h-7" fill="none">
                <path fill="#072654" d="M10 2h8l12 26H22L10 2zm10 0l22 26h-8L12 2h8z" />
                <text x="38" y="22" fontFamily="Arial" fontSize="16" fontWeight="700" fill="#072654">Razorpay</text>
            </svg>
        ),
    },
    {
        slug: "paystack",
        name: "Paystack",
        tagline: "Simple and reliable payments across Africa.",
        group: "paystack",
        enabledKey: "paystack_enabled",
        defaultKey: "paystack_is_default",
        primaryKeyField: "paystack_public_key",
        accentColor: "from-teal-500/10 to-emerald-500/10",
        brandColor: "#00C3F7",
        logo: (
            <svg viewBox="0 0 120 30" className="h-7" fill="none">
                <rect x="2" y="6" width="28" height="6" rx="3" fill="#00C3F7" />
                <rect x="2" y="14" width="20" height="6" rx="3" fill="#40DDA1" />
                <rect x="2" y="22" width="24" height="6" rx="3" fill="#00C3F7" />
                <text x="40" y="22" fontFamily="Arial" fontSize="15" fontWeight="700" fill="#00C3F7">paystack</text>
            </svg>
        ),
    },
    {
        slug: "mollie",
        name: "Mollie",
        tagline: "Effortless European online payments.",
        group: "mollie",
        enabledKey: "mollie_enabled",
        defaultKey: "mollie_is_default",
        primaryKeyField: "mollie_api_key",
        accentColor: "from-orange-500/10 to-amber-500/10",
        brandColor: "#000000",
        logo: (
            <svg viewBox="0 0 100 30" className="h-7" fill="none">
                <text x="0" y="22" fontFamily="Georgia,serif" fontSize="22" fontWeight="900" fill="#000000">mollie</text>
            </svg>
        ),
    },
    {
        slug: "flutterwave",
        name: "Flutterwave",
        tagline: "Pan-African payment infrastructure.",
        group: "flutterwave",
        enabledKey: "flutterwave_enabled",
        defaultKey: "flutterwave_is_default",
        primaryKeyField: "flutterwave_public_key",
        accentColor: "from-orange-500/10 to-rose-500/10",
        brandColor: "#F5A623",
        logo: (
            <svg viewBox="0 0 36 36" className="h-7" fill="none">
                <path d="M18 2C9.2 2 2 9.2 2 18s7.2 16 16 16 16-7.2 16-16S26.8 2 18 2z" fill="#F5A623" />
                <path d="M24 12c-2 0-4 1-5 2.5C18 13 16 12 14 12c-3.3 0-6 2.7-6 6s2.7 6 6 6c2 0 4-1 5-2.5C20 23 22 24 24 24c3.3 0 6-2.7 6-6s-2.7-6-6-6z" fill="#fff" />
            </svg>
        ),
    },
];

// ─── Single Gateway Card ──────────────────────────────────────────────────────

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
        bulkUpdate.mutate({
            group: gateway.group,
            [gateway.enabledKey]: (!isEnabled).toString(),
        });
    };

    return (
        <div
            className={`relative rounded-2xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${isEnabled ? "border-primary/20 shadow-sm" : "border-border/60"
                }`}
        >
            {/* Gradient accent on left edge when enabled */}
            {isEnabled && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: gateway.brandColor }}
                />
            )}

            <div className="p-5 pl-6">
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className={`shrink-0 w-28 h-14 rounded-xl bg-gradient-to-br ${gateway.accentColor} border border-border/40 flex items-center justify-center p-3`}>
                        {gateway.logo}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-base">{gateway.name}</h3>
                            {isDefault && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 px-1.5 gap-1">
                                    <Star className="w-2.5 h-2.5 fill-current" /> Default
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{gateway.tagline}</p>
                        <div className="flex items-center gap-2 mt-2">
                            {isConfigured ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3" /> Configured
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-3 h-3" /> Setup required
                                </span>
                            )}
                            {isEnabled && (
                                <span className="inline-flex items-center gap-1 text-xs text-primary">
                                    <Zap className="w-3 h-3" /> Active
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Star default */}
                        <button
                            onClick={() => onToggleDefault(gateway.slug)}
                            className={`p-1.5 rounded-lg transition-colors ${isDefault
                                    ? "text-amber-500 dark:text-amber-400"
                                    : "text-muted-foreground hover:text-amber-500"
                                }`}
                            title="Set as default"
                        >
                            <Star className={`w-4 h-4 ${isDefault ? "fill-current" : ""}`} />
                        </button>

                        {/* Toggle */}
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={toggle}
                            disabled={isLoading || bulkUpdate.isPending}
                        />

                        {/* Configure */}
                        <Link href={`/admin/payments/${gateway.slug}`}>
                            <Button variant={isConfigured ? "outline" : "default"} size="sm" className="gap-1.5 h-8">
                                <Settings2 className="w-3.5 h-3.5" />
                                {isConfigured ? "Edit" : "Setup"}
                                <ChevronRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentsContent() {
    const [defaultGateway, setDefaultGateway] = useState<string>("");

    // Load active gateways count for stats
    const stripeSettings = useSettingsByGroup("stripe");
    const paypalSettings = useSettingsByGroup("paypal");

    const handleToggleDefault = (slug: string) => {
        setDefaultGateway((prev) => (prev === slug ? "" : slug));
        toast.success(`${slug.charAt(0).toUpperCase() + slug.slice(1)} set as default payment method`);
    };

    return (
        <PermissionGuard permission="payments.view">
            <div className="space-y-8">

                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-8 text-white">
                    {/* Background decoration */}
                    <div className="absolute right-0 top-0 opacity-10">
                        <CreditCard className="w-64 h-64 -rotate-12 translate-x-16 -translate-y-8" />
                    </div>
                    <div className="absolute right-24 bottom-0 opacity-5">
                        <Shield className="w-48 h-48 rotate-12 translate-y-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-white/80">Payment Configuration</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
                        <p className="text-white/70 max-w-lg">
                            Configure and manage your payment gateways. Enable the ones you need and set up their API credentials to start accepting payments.
                        </p>
                        <div className="flex items-center gap-4 mt-5">
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                                <Shield className="w-3.5 h-3.5" />
                                <span>{GATEWAYS.length} gateways available</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                                <Zap className="w-3.5 h-3.5" />
                                <span>PCI compliant</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Instructions ── */}
                <div className="flex gap-3 p-4 rounded-xl border bg-muted/30 text-sm text-muted-foreground">
                    <span className="mt-0.5">💡</span>
                    <div>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Click the <strong className="text-foreground">star ☆</strong> to set your default payment method at checkout</li>
                            <li>Use the <strong className="text-foreground">toggle</strong> to enable or disable a gateway instantly</li>
                            <li>Click <strong className="text-foreground">Edit / Setup</strong> to enter API credentials</li>
                        </ul>
                    </div>
                </div>

                {/* ── Gateway List ── */}
                <div className="space-y-3">
                    {GATEWAYS.map((gateway) => (
                        <GatewayCard
                            key={gateway.slug}
                            gateway={gateway}
                            isDefault={defaultGateway === gateway.slug}
                            onToggleDefault={handleToggleDefault}
                        />
                    ))}
                </div>

            </div>
        </PermissionGuard>
    );
}
