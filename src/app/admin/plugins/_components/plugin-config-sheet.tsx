"use client";

import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, ExternalLink, Info, X } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSettingsByGroup, useBulkUpdateSettings } from "@/hooks/use-settings";
import type { Plugin } from "@/types";

// ─── Individual Config Forms ─────────────────────────────────────────────────

function GoogleOAuthForm() {
    const { data: settings, isLoading } = useSettingsByGroup("social_login");
    const bulkUpdate = useBulkUpdateSettings();
    const [showSecrets, setShowSecrets] = useState({ google: false });
    const [v, setV] = useState({ google_enabled: false, google_client_id: "", google_client_secret: "", google_redirect_uri: "" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ google_enabled: m.google_enabled === "true", google_client_id: m.google_client_id || "", google_client_secret: m.google_client_secret || "", google_redirect_uri: m.google_redirect_uri || "" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="g_en" className="font-medium">Enable Google Login</Label>
                <Switch id="g_en" checked={v.google_enabled} onCheckedChange={(val) => setV({ ...v, google_enabled: val })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="g_cid">Client ID</Label>
                <Input id="g_cid" placeholder="1234567890-abcdefg.apps.googleusercontent.com" value={v.google_client_id} onChange={(e) => setV({ ...v, google_client_id: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="g_csec">Client Secret</Label>
                <div className="relative">
                    <Input id="g_csec" type={showSecrets.google ? "text" : "password"} placeholder="GOCSPX-••••••••••" value={v.google_client_secret} onChange={(e) => setV({ ...v, google_client_secret: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowSecrets({ google: !showSecrets.google })}>
                        {showSecrets.google ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="g_redir">Redirect URI</Label>
                <Input id="g_redir" type="url" placeholder="https://yourdomain.com/auth/google/callback" value={v.google_redirect_uri} onChange={(e) => setV({ ...v, google_redirect_uri: e.target.value })} />
                <p className="text-xs text-muted-foreground">Add this to Authorized Redirect URIs in Google Cloud Console.</p>
            </div>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Get credentials <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "social_login", ...v, google_enabled: v.google_enabled.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Google OAuth"}
            </Button>
        </div>
    );
}

function FacebookOAuthForm() {
    const { data: settings, isLoading } = useSettingsByGroup("social_login");
    const bulkUpdate = useBulkUpdateSettings();
    const [showSecret, setShowSecret] = useState(false);
    const [v, setV] = useState({ facebook_enabled: false, facebook_app_id: "", facebook_app_secret: "", facebook_redirect_uri: "" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ facebook_enabled: m.facebook_enabled === "true", facebook_app_id: m.facebook_app_id || "", facebook_app_secret: m.facebook_app_secret || "", facebook_redirect_uri: m.facebook_redirect_uri || "" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="fb_en" className="font-medium">Enable Facebook Login</Label>
                <Switch id="fb_en" checked={v.facebook_enabled} onCheckedChange={(val) => setV({ ...v, facebook_enabled: val })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="fb_aid">App ID</Label>
                <Input id="fb_aid" placeholder="1234567890123456" value={v.facebook_app_id} onChange={(e) => setV({ ...v, facebook_app_id: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="fb_asec">App Secret</Label>
                <div className="relative">
                    <Input id="fb_asec" type={showSecret ? "text" : "password"} placeholder="••••••••••••••••••••••" value={v.facebook_app_secret} onChange={(e) => setV({ ...v, facebook_app_secret: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowSecret(!showSecret)}>
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="fb_redir">Redirect URI</Label>
                <Input id="fb_redir" type="url" placeholder="https://yourdomain.com/auth/facebook/callback" value={v.facebook_redirect_uri} onChange={(e) => setV({ ...v, facebook_redirect_uri: e.target.value })} />
            </div>
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Get credentials <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "social_login", ...v, facebook_enabled: v.facebook_enabled.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Facebook OAuth"}
            </Button>
        </div>
    );
}

function AnalyticsForm({ slug }: { slug: string }) {
    const { data: settings, isLoading } = useSettingsByGroup("analytics");
    const bulkUpdate = useBulkUpdateSettings();
    const [v, setV] = useState({ tracking_type: slug === "google-tag-manager" ? "gtm" : "ga4", gtm_container_id: "", enable_gtm_debug: false, enable_gtm_events: false, ga4_measurement_id: "" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ tracking_type: m.tracking_type || (slug === "google-tag-manager" ? "gtm" : "ga4"), gtm_container_id: m.gtm_container_id || "", enable_gtm_debug: m.enable_gtm_debug === "true", enable_gtm_events: m.enable_gtm_events === "true", ga4_measurement_id: m.ga4_measurement_id || "" });
        }
    }, [settings, slug]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Label className="font-medium">Tracking Type</Label>
                <RadioGroup value={v.tracking_type} onValueChange={(val) => setV({ ...v, tracking_type: val })} className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/40">
                        <RadioGroupItem value="gtm" id="trk_gtm" />
                        <Label htmlFor="trk_gtm" className="cursor-pointer font-normal">Google Tag Manager (Recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/40">
                        <RadioGroupItem value="ga4" id="trk_ga4" />
                        <Label htmlFor="trk_ga4" className="cursor-pointer font-normal">Google Analytics 4 only</Label>
                    </div>
                </RadioGroup>
            </div>

            {v.tracking_type === "gtm" && (
                <>
                    <div className="space-y-1.5">
                        <Label htmlFor="gtm_id">GTM Container ID</Label>
                        <Input id="gtm_id" placeholder="GTM-XXXXXXX" value={v.gtm_container_id} onChange={(e) => setV({ ...v, gtm_container_id: e.target.value })} />
                        <p className="text-xs text-muted-foreground">Find this in the top-right corner of your GTM dashboard.</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <Checkbox id="gtm_debug" checked={v.enable_gtm_debug} onCheckedChange={(c) => setV({ ...v, enable_gtm_debug: c as boolean })} />
                        <div>
                            <Label htmlFor="gtm_debug" className="cursor-pointer font-medium">Enable Debug Mode</Label>
                            <p className="text-xs text-muted-foreground">Logs GTM events to browser console.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                        <Checkbox id="gtm_events" checked={v.enable_gtm_events} onCheckedChange={(c) => setV({ ...v, enable_gtm_events: c as boolean })} />
                        <div>
                            <Label htmlFor="gtm_events" className="cursor-pointer font-medium">Enable GTM Tracking Events</Label>
                            <p className="text-xs text-muted-foreground">Push e-commerce events through GTM.</p>
                        </div>
                    </div>
                    <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Open GTM Dashboard <ExternalLink className="h-3 w-3" /></a>
                </>
            )}

            {v.tracking_type === "ga4" && (
                <div className="space-y-1.5">
                    <Label htmlFor="ga4_mid">GA4 Measurement ID</Label>
                    <Input id="ga4_mid" placeholder="G-XXXXXXXXXX" value={v.ga4_measurement_id} onChange={(e) => setV({ ...v, ga4_measurement_id: e.target.value })} />
                    <p className="text-xs text-muted-foreground">Admin → Data Streams → Your stream → Measurement ID.</p>
                </div>
            )}

            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "analytics", tracking_type: v.tracking_type, gtm_container_id: v.gtm_container_id, enable_gtm_debug: String(v.enable_gtm_debug), enable_gtm_events: String(v.enable_gtm_events), ga4_measurement_id: v.ga4_measurement_id })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Analytics Settings"}
            </Button>
        </div>
    );
}

function StorageForm({ slug }: { slug: string }) {
    const { data: settings, isLoading } = useSettingsByGroup("media");
    const bulkUpdate = useBulkUpdateSettings();
    const [showPwd, setShowPwd] = useState({ access: false, secret: false });

    const driverMap: Record<string, string> = {
        "amazon-s3": "s3", "cloudflare-r2": "cloudflare",
        "digitalocean-spaces": "digitalocean", "wasabi": "wasabi",
    };
    const defaultDriver = driverMap[slug] || "s3";

    const [v, setV] = useState({ driver: defaultDriver, aws_access_key: "", aws_secret_key: "", aws_region: "", aws_bucket: "", aws_url: "", aws_endpoint: "", aws_account_id: "", custom_s3_path: "", use_path_style_endpoint: "no" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ driver: driverMap[slug] || m.driver || "s3", aws_access_key: m.aws_access_key || "", aws_secret_key: m.aws_secret_key || "", aws_region: m.aws_region || "", aws_bucket: m.aws_bucket || "", aws_url: m.aws_url || "", aws_endpoint: m.aws_endpoint || "", aws_account_id: m.aws_account_id || "", custom_s3_path: m.custom_s3_path || "", use_path_style_endpoint: m.use_path_style_endpoint || "no" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="p-3 rounded-lg border bg-muted/30 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">All storage providers share the same settings. Changing fields here updates the active media storage configuration.</p>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="s_ak">Access Key</Label>
                <div className="relative">
                    <Input id="s_ak" type={showPwd.access ? "text" : "password"} placeholder="AKIAXXXXXXXXXXXXXXXX" value={v.aws_access_key} onChange={(e) => setV({ ...v, aws_access_key: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPwd({ ...showPwd, access: !showPwd.access })}>
                        {showPwd.access ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="s_sk">Secret Key</Label>
                <div className="relative">
                    <Input id="s_sk" type={showPwd.secret ? "text" : "password"} placeholder="••••••••••••••••••••" value={v.aws_secret_key} onChange={(e) => setV({ ...v, aws_secret_key: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPwd({ ...showPwd, secret: !showPwd.secret })}>
                        {showPwd.secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            {v.driver === "cloudflare" && (
                <div className="space-y-1.5">
                    <Label htmlFor="s_acct">Cloudflare Account ID</Label>
                    <Input id="s_acct" placeholder="your-cloudflare-account-id" value={v.aws_account_id} onChange={(e) => setV({ ...v, aws_account_id: e.target.value })} />
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="s_reg">Region</Label>
                    <Input id="s_reg" placeholder={v.driver === "s3" ? "eu-north-1" : "auto"} value={v.aws_region} onChange={(e) => setV({ ...v, aws_region: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="s_bkt">Bucket</Label>
                    <Input id="s_bkt" placeholder="my-bucket" value={v.aws_bucket} onChange={(e) => setV({ ...v, aws_bucket: e.target.value })} />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="s_url">Public URL</Label>
                <Input id="s_url" type="url" placeholder="https://cdn.example.com/" value={v.aws_url} onChange={(e) => setV({ ...v, aws_url: e.target.value })} />
            </div>
            {v.driver !== "s3" && (
                <div className="space-y-1.5">
                    <Label htmlFor="s_ep">Endpoint (optional)</Label>
                    <Input id="s_ep" type="url" placeholder="https://..." value={v.aws_endpoint} onChange={(e) => setV({ ...v, aws_endpoint: e.target.value })} />
                </div>
            )}
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "media", ...v })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Storage Settings"}
            </Button>
        </div>
    );
}

function GoogleMapsForm() {
    const { data: settings, isLoading } = useSettingsByGroup("google_maps");
    const bulkUpdate = useBulkUpdateSettings();
    const [showKey, setShowKey] = useState(false);
    const [v, setV] = useState({ google_maps_enabled: false, google_maps_api_key: "", google_maps_default_lat: "0", google_maps_default_lng: "0", google_maps_default_zoom: "12" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ google_maps_enabled: m.google_maps_enabled === "true", google_maps_api_key: m.google_maps_api_key || "", google_maps_default_lat: m.google_maps_default_lat || "0", google_maps_default_lng: m.google_maps_default_lng || "0", google_maps_default_zoom: m.google_maps_default_zoom || "12" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="gm_en" className="font-medium">Enable Google Maps</Label>
                <Switch id="gm_en" checked={v.google_maps_enabled} onCheckedChange={(val) => setV({ ...v, google_maps_enabled: val })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="gm_key">API Key</Label>
                <div className="relative">
                    <Input id="gm_key" type={showKey ? "text" : "password"} placeholder="AIzaSy••••••••••••••" value={v.google_maps_api_key} onChange={(e) => setV({ ...v, google_maps_api_key: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <Separator />
            <div>
                <Label className="font-medium">Default Map Center</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="space-y-1">
                        <Label htmlFor="gm_lat" className="text-xs">Latitude</Label>
                        <Input id="gm_lat" type="number" step="any" placeholder="0" value={v.google_maps_default_lat} onChange={(e) => setV({ ...v, google_maps_default_lat: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="gm_lng" className="text-xs">Longitude</Label>
                        <Input id="gm_lng" type="number" step="any" placeholder="0" value={v.google_maps_default_lng} onChange={(e) => setV({ ...v, google_maps_default_lng: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="gm_zoom" className="text-xs">Zoom</Label>
                        <Input id="gm_zoom" type="number" min={1} max={20} placeholder="12" value={v.google_maps_default_zoom} onChange={(e) => setV({ ...v, google_maps_default_zoom: e.target.value })} />
                    </div>
                </div>
            </div>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Get API Key <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "google_maps", ...v, google_maps_enabled: v.google_maps_enabled.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Maps Settings"}
            </Button>
        </div>
    );
}

function StripeForm() {
    const { data: settings, isLoading } = useSettingsByGroup("stripe");
    const bulkUpdate = useBulkUpdateSettings();
    const [show, setShow] = useState({ secret: false, webhook: false });
    const [v, setV] = useState({ stripe_enabled: false, stripe_test_mode: true, stripe_publishable_key: "", stripe_secret_key: "", stripe_webhook_secret: "", stripe_currency: "USD" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ stripe_enabled: m.stripe_enabled === "true", stripe_test_mode: m.stripe_test_mode !== "false", stripe_publishable_key: m.stripe_publishable_key || "", stripe_secret_key: m.stripe_secret_key || "", stripe_webhook_secret: m.stripe_webhook_secret || "", stripe_currency: m.stripe_currency || "USD" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="st_en" className="font-medium">Enable Stripe</Label>
                <Switch id="st_en" checked={v.stripe_enabled} onCheckedChange={(val) => setV({ ...v, stripe_enabled: val })} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                    <Label htmlFor="st_test" className="font-medium">Test Mode</Label>
                    {v.stripe_test_mode && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950">Test</Badge>}
                </div>
                <Switch id="st_test" checked={v.stripe_test_mode} onCheckedChange={(val) => setV({ ...v, stripe_test_mode: val })} />
            </div>
            <Separator />
            <div className="space-y-1.5">
                <Label htmlFor="st_pk">Publishable Key</Label>
                <Input id="st_pk" placeholder={v.stripe_test_mode ? "pk_test_••••••" : "pk_live_••••••"} value={v.stripe_publishable_key} onChange={(e) => setV({ ...v, stripe_publishable_key: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="st_sk">Secret Key</Label>
                <div className="relative">
                    <Input id="st_sk" type={show.secret ? "text" : "password"} placeholder={v.stripe_test_mode ? "sk_test_••••••" : "sk_live_••••••"} value={v.stripe_secret_key} onChange={(e) => setV({ ...v, stripe_secret_key: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShow({ ...show, secret: !show.secret })}>
                        {show.secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="st_wh">Webhook Secret</Label>
                <div className="relative">
                    <Input id="st_wh" type={show.webhook ? "text" : "password"} placeholder="whsec_••••••" value={v.stripe_webhook_secret} onChange={(e) => setV({ ...v, stripe_webhook_secret: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShow({ ...show, webhook: !show.webhook })}>
                        {show.webhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="st_cur">Currency</Label>
                <Input id="st_cur" maxLength={3} placeholder="USD" value={v.stripe_currency} onChange={(e) => setV({ ...v, stripe_currency: e.target.value.toUpperCase() })} />
            </div>
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Stripe Dashboard <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "stripe", ...v, stripe_enabled: v.stripe_enabled.toString(), stripe_test_mode: v.stripe_test_mode.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Stripe Settings"}
            </Button>
        </div>
    );
}

function RecaptchaForm() {
    const { data: settings, isLoading } = useSettingsByGroup("recaptcha");
    const bulkUpdate = useBulkUpdateSettings();
    const [v, setV] = useState({ recaptcha_enabled: false, recaptcha_version: "v3", recaptcha_site_key: "", recaptcha_secret_key: "", recaptcha_score_threshold: "0.5" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ recaptcha_enabled: m.recaptcha_enabled === "true", recaptcha_version: m.recaptcha_version || "v3", recaptcha_site_key: m.recaptcha_site_key || "", recaptcha_secret_key: m.recaptcha_secret_key || "", recaptcha_score_threshold: m.recaptcha_score_threshold || "0.5" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="rc_en" className="font-medium">Enable reCAPTCHA</Label>
                <Switch id="rc_en" checked={v.recaptcha_enabled} onCheckedChange={(val) => setV({ ...v, recaptcha_enabled: val })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="rc_ver">Version</Label>
                <Select value={v.recaptcha_version} onValueChange={(val) => setV({ ...v, recaptcha_version: val })}>
                    <SelectTrigger id="rc_ver"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="v2_checkbox">v2 – Checkbox</SelectItem>
                        <SelectItem value="v2_invisible">v2 – Invisible</SelectItem>
                        <SelectItem value="v3">v3 – Score Based (Recommended)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="rc_sk">Site Key (Public)</Label>
                <Input id="rc_sk" placeholder="6Lc••••••••••••••••" value={v.recaptcha_site_key} onChange={(e) => setV({ ...v, recaptcha_site_key: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="rc_sec">Secret Key</Label>
                <Input id="rc_sec" type="password" placeholder="6Lc••••••••••••••••" value={v.recaptcha_secret_key} onChange={(e) => setV({ ...v, recaptcha_secret_key: e.target.value })} />
            </div>
            {v.recaptcha_version === "v3" && (
                <div className="space-y-1.5">
                    <Label htmlFor="rc_thr">Score Threshold (0–1)</Label>
                    <Input id="rc_thr" type="number" min={0} max={1} step={0.1} placeholder="0.5" value={v.recaptcha_score_threshold} onChange={(e) => setV({ ...v, recaptcha_score_threshold: e.target.value })} />
                    <p className="text-xs text-muted-foreground">Requests below this score are rejected (0=bot, 1=human).</p>
                </div>
            )}
            <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">reCAPTCHA Admin <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "recaptcha", ...v, recaptcha_enabled: v.recaptcha_enabled.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save reCAPTCHA Settings"}
            </Button>
        </div>
    );
}

function TwilioForm() {
    const { data: settings, isLoading } = useSettingsByGroup("twilio");
    const bulkUpdate = useBulkUpdateSettings();
    const [showToken, setShowToken] = useState(false);
    const [v, setV] = useState({ twilio_enabled: false, twilio_test_mode: true, twilio_account_sid: "", twilio_auth_token: "", twilio_from_number: "", twilio_messaging_service_sid: "" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ twilio_enabled: m.twilio_enabled === "true", twilio_test_mode: m.twilio_test_mode !== "false", twilio_account_sid: m.twilio_account_sid || "", twilio_auth_token: m.twilio_auth_token || "", twilio_from_number: m.twilio_from_number || "", twilio_messaging_service_sid: m.twilio_messaging_service_sid || "" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="tw_en" className="font-medium">Enable Twilio SMS</Label>
                <Switch id="tw_en" checked={v.twilio_enabled} onCheckedChange={(val) => setV({ ...v, twilio_enabled: val })} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                    <Label htmlFor="tw_test" className="font-medium">Test Mode</Label>
                    {v.twilio_test_mode && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950">Test</Badge>}
                </div>
                <Switch id="tw_test" checked={v.twilio_test_mode} onCheckedChange={(val) => setV({ ...v, twilio_test_mode: val })} />
            </div>
            <Separator />
            <div className="space-y-1.5">
                <Label htmlFor="tw_sid">Account SID</Label>
                <Input id="tw_sid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={v.twilio_account_sid} onChange={(e) => setV({ ...v, twilio_account_sid: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="tw_tok">Auth Token</Label>
                <div className="relative">
                    <Input id="tw_tok" type={showToken ? "text" : "password"} placeholder="••••••••••••••••••••••••••••••••" value={v.twilio_auth_token} onChange={(e) => setV({ ...v, twilio_auth_token: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowToken(!showToken)}>
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="tw_from">From Phone Number</Label>
                <Input id="tw_from" type="tel" placeholder="+1234567890" value={v.twilio_from_number} onChange={(e) => setV({ ...v, twilio_from_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="tw_msid">Messaging Service SID <span className="font-normal text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="tw_msid" placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={v.twilio_messaging_service_sid} onChange={(e) => setV({ ...v, twilio_messaging_service_sid: e.target.value })} />
            </div>
            <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Twilio Console <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "twilio", ...v, twilio_enabled: v.twilio_enabled.toString(), twilio_test_mode: v.twilio_test_mode.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Twilio Settings"}
            </Button>
        </div>
    );
}

function PayPalForm() {
    const { data: settings, isLoading } = useSettingsByGroup("paypal");
    const bulkUpdate = useBulkUpdateSettings();
    const [showSecret, setShowSecret] = useState(false);
    const [v, setV] = useState({ paypal_enabled: false, paypal_client_id: "", paypal_client_secret: "", paypal_live_mode: false });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ paypal_enabled: m.paypal_enabled === "true", paypal_client_id: m.paypal_client_id || "", paypal_client_secret: m.paypal_client_secret || "", paypal_live_mode: m.paypal_live_mode === "true" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="pp_en" className="font-medium">Enable PayPal</Label>
                <Switch id="pp_en" checked={v.paypal_enabled} onCheckedChange={(val) => setV({ ...v, paypal_enabled: val })} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                    <Label htmlFor="pp_live" className="font-medium">Live Mode</Label>
                    {!v.paypal_live_mode && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950">Sandbox</Badge>}
                </div>
                <Switch id="pp_live" checked={v.paypal_live_mode} onCheckedChange={(val) => setV({ ...v, paypal_live_mode: val })} />
            </div>
            <Separator />
            <div className="space-y-1.5">
                <Label htmlFor="pp_cid">Client ID</Label>
                <Input id="pp_cid" placeholder="AXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={v.paypal_client_id} onChange={(e) => setV({ ...v, paypal_client_id: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="pp_sec">Client Secret</Label>
                <div className="relative">
                    <Input id="pp_sec" type={showSecret ? "text" : "password"} placeholder="EFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={v.paypal_client_secret} onChange={(e) => setV({ ...v, paypal_client_secret: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowSecret(!showSecret)}>
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">PayPal Developer Dashboard <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "paypal", ...v, paypal_enabled: v.paypal_enabled.toString(), paypal_live_mode: v.paypal_live_mode.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save PayPal Settings"}
            </Button>
        </div>
    );
}

function MollieForm() {
    const { data: settings, isLoading } = useSettingsByGroup("mollie");
    const bulkUpdate = useBulkUpdateSettings();
    const [v, setV] = useState({ mollie_enabled: false, mollie_api_key: "", mollie_webhook_secret: "" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ mollie_enabled: m.mollie_enabled === "true", mollie_api_key: m.mollie_api_key || "", mollie_webhook_secret: m.mollie_webhook_secret || "" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="mol_en" className="font-medium">Enable Mollie</Label>
                <Switch id="mol_en" checked={v.mollie_enabled} onCheckedChange={(val) => setV({ ...v, mollie_enabled: val })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="mol_key">API Key</Label>
                <Input id="mol_key" type="password" placeholder="live_••••••••••••••••••••••••••••••" value={v.mollie_api_key} onChange={(e) => setV({ ...v, mollie_api_key: e.target.value })} />
                <p className="text-xs text-muted-foreground">Use <code className="font-mono">live_</code> for production or <code className="font-mono">test_</code> for sandbox.</p>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="mol_wh">Webhook Secret <span className="font-normal text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="mol_wh" type="password" placeholder="••••••••••••••••••••" value={v.mollie_webhook_secret} onChange={(e) => setV({ ...v, mollie_webhook_secret: e.target.value })} />
            </div>
            <a href="https://my.mollie.com/dashboard/developers/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Mollie Dashboard <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "mollie", ...v, mollie_enabled: v.mollie_enabled.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Mollie Settings"}
            </Button>
        </div>
    );
}

function PaystackForm() {
    const { data: settings, isLoading } = useSettingsByGroup("paystack");
    const bulkUpdate = useBulkUpdateSettings();
    const [showSecret, setShowSecret] = useState(false);
    const [v, setV] = useState({ paystack_enabled: false, paystack_public_key: "", paystack_secret_key: "" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ paystack_enabled: m.paystack_enabled === "true", paystack_public_key: m.paystack_public_key || "", paystack_secret_key: m.paystack_secret_key || "" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="ps_en" className="font-medium">Enable Paystack</Label>
                <Switch id="ps_en" checked={v.paystack_enabled} onCheckedChange={(val) => setV({ ...v, paystack_enabled: val })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="ps_pk">Public Key</Label>
                <Input id="ps_pk" placeholder="pk_live_••••••••••••••••••••••••••••••••••••••••" value={v.paystack_public_key} onChange={(e) => setV({ ...v, paystack_public_key: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="ps_sk">Secret Key</Label>
                <div className="relative">
                    <Input id="ps_sk" type={showSecret ? "text" : "password"} placeholder="sk_live_••••••••••••••••••••••••••••••••••••••••" value={v.paystack_secret_key} onChange={(e) => setV({ ...v, paystack_secret_key: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowSecret(!showSecret)}>
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <a href="https://dashboard.paystack.com/#/settings/developers" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Paystack Dashboard <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "paystack", ...v, paystack_enabled: v.paystack_enabled.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Paystack Settings"}
            </Button>
        </div>
    );
}

function RazorpayForm() {
    const { data: settings, isLoading } = useSettingsByGroup("razorpay");
    const bulkUpdate = useBulkUpdateSettings();
    const [showSecret, setShowSecret] = useState(false);
    const [v, setV] = useState({ razorpay_enabled: false, razorpay_key_id: "", razorpay_key_secret: "", razorpay_payment_type: "hosted_checkout", razorpay_webhook_secret: "" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ razorpay_enabled: m.razorpay_enabled === "true", razorpay_key_id: m.razorpay_key_id || "", razorpay_key_secret: m.razorpay_key_secret || "", razorpay_payment_type: m.razorpay_payment_type || "hosted_checkout", razorpay_webhook_secret: m.razorpay_webhook_secret || "" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="rz_en" className="font-medium">Enable Razorpay</Label>
                <Switch id="rz_en" checked={v.razorpay_enabled} onCheckedChange={(val) => setV({ ...v, razorpay_enabled: val })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="rz_kid">Key ID</Label>
                <Input id="rz_kid" placeholder="rzp_live_••••••••••••••••" value={v.razorpay_key_id} onChange={(e) => setV({ ...v, razorpay_key_id: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="rz_ksec">Key Secret</Label>
                <div className="relative">
                    <Input id="rz_ksec" type={showSecret ? "text" : "password"} placeholder="••••••••••••••••••••••••" value={v.razorpay_key_secret} onChange={(e) => setV({ ...v, razorpay_key_secret: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowSecret(!showSecret)}>
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="rz_type">Payment Type</Label>
                <Select value={v.razorpay_payment_type} onValueChange={(val) => setV({ ...v, razorpay_payment_type: val })}>
                    <SelectTrigger id="rz_type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="hosted_checkout">Hosted Checkout</SelectItem>
                        <SelectItem value="website_embedded">Website Embedded</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="rz_wh">Webhook Secret <span className="font-normal text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="rz_wh" type="password" placeholder="••••••••••••••••••••" value={v.razorpay_webhook_secret} onChange={(e) => setV({ ...v, razorpay_webhook_secret: e.target.value })} />
            </div>
            <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Razorpay Dashboard <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "razorpay", ...v, razorpay_enabled: v.razorpay_enabled.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Razorpay Settings"}
            </Button>
        </div>
    );
}

function FlutterwaveForm() {
    const { data: settings, isLoading } = useSettingsByGroup("flutterwave");
    const bulkUpdate = useBulkUpdateSettings();
    const [show, setShow] = useState({ secret: false, encrypt: false });
    const [v, setV] = useState({ flutterwave_enabled: false, flutterwave_public_key: "", flutterwave_secret_key: "", flutterwave_encryption_key: "" });

    useEffect(() => {
        if (settings) {
            const m: Record<string, string> = {};
            settings.forEach((s) => { m[s.key] = s.value || ""; });
            setV({ flutterwave_enabled: m.flutterwave_enabled === "true", flutterwave_public_key: m.flutterwave_public_key || "", flutterwave_secret_key: m.flutterwave_secret_key || "", flutterwave_encryption_key: m.flutterwave_encryption_key || "" });
        }
    }, [settings]);

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="fw_en" className="font-medium">Enable Flutterwave</Label>
                <Switch id="fw_en" checked={v.flutterwave_enabled} onCheckedChange={(val) => setV({ ...v, flutterwave_enabled: val })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="fw_pk">Public Key</Label>
                <Input id="fw_pk" placeholder="FLWPUBK_TEST-••••••••••••••••••••••••••••••••-X" value={v.flutterwave_public_key} onChange={(e) => setV({ ...v, flutterwave_public_key: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="fw_sk">Secret Key</Label>
                <div className="relative">
                    <Input id="fw_sk" type={show.secret ? "text" : "password"} placeholder="FLWSECK_TEST-••••••••••••••••••••••••••••••••-X" value={v.flutterwave_secret_key} onChange={(e) => setV({ ...v, flutterwave_secret_key: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShow({ ...show, secret: !show.secret })}>
                        {show.secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="fw_enc">Encryption Key</Label>
                <div className="relative">
                    <Input id="fw_enc" type={show.encrypt ? "text" : "password"} placeholder="••••••••••••••••••••••••" value={v.flutterwave_encryption_key} onChange={(e) => setV({ ...v, flutterwave_encryption_key: e.target.value })} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShow({ ...show, encrypt: !show.encrypt })}>
                        {show.encrypt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Required for standard (redirect) payments.</p>
            </div>
            <a href="https://dashboard.flutterwave.com/dashboard/settings/apis" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1">Flutterwave Dashboard <ExternalLink className="h-3 w-3" /></a>
            <Button className="w-full" onClick={() => bulkUpdate.mutate({ group: "flutterwave", ...v, flutterwave_enabled: v.flutterwave_enabled.toString() })} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />{bulkUpdate.isPending ? "Saving..." : "Save Flutterwave Settings"}
            </Button>
        </div>
    );
}

// ─── Slug → Form mapping ──────────────────────────────────────────────────────

function ConfigForm({ plugin }: { plugin: Plugin }) {
    const { slug } = plugin;
    if (slug === "google-oauth") return <GoogleOAuthForm />;
    if (slug === "facebook-oauth") return <FacebookOAuthForm />;
    if (slug === "google-tag-manager" || slug === "google-analytics") return <AnalyticsForm slug={slug} />;
    if (["amazon-s3", "cloudflare-r2", "digitalocean-spaces", "wasabi"].includes(slug)) return <StorageForm slug={slug} />;
    if (slug === "google-maps") return <GoogleMapsForm />;
    if (slug === "stripe") return <StripeForm />;
    if (slug === "paypal") return <PayPalForm />;
    if (slug === "mollie") return <MollieForm />;
    if (slug === "paystack") return <PaystackForm />;
    if (slug === "razorpay") return <RazorpayForm />;
    if (slug === "flutterwave") return <FlutterwaveForm />;
    if (slug === "recaptcha") return <RecaptchaForm />;
    if (slug === "twilio") return <TwilioForm />;
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <X className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No configuration available for this plugin.</p>
        </div>
    );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface PluginConfigSheetProps {
    plugin: Plugin | null;
    open: boolean;
    onClose: () => void;
}

export function PluginConfigSheet({ plugin, open, onClose }: PluginConfigSheetProps) {
    return (
        <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                {plugin && (
                    <>
                        <SheetHeader className="mb-6">
                            <SheetTitle className="text-xl">{plugin.name}</SheetTitle>
                            <SheetDescription>{plugin.description}</SheetDescription>
                        </SheetHeader>
                        <ConfigForm plugin={plugin} />
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
