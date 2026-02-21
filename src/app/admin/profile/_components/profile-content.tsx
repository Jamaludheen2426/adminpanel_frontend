"use client";

import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth, useUpdateProfile, useChangePassword, useLinkSocial, useUnlinkSocial } from "@/hooks";
import { useUploadMedia } from "@/hooks/use-media";
import { useTranslation } from "@/hooks/use-translation";
import { useTimezones } from "@/hooks/use-timezones";
import { usePublicSettings } from "@/hooks/use-settings";
import { Spinner } from "@/components/ui/spinner";
import { User, Mail, Phone, Shield, Calendar, Camera, CheckCircle2, XCircle } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  timezone: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "New password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; version: string; cookie: boolean; xfbml: boolean }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string } }) => void,
        options: { scope: string; auth_type?: string }
      ) => void;
    };
  }
}

export function ProfileContent() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const linkSocialMutation = useLinkSocial();
  const unlinkSocialMutation = useUnlinkSocial();
  const uploadMedia = useUploadMedia();
  const { data: timezones = [] } = useTimezones();
  const { data: publicSettings } = usePublicSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const googleEnabled = publicSettings?.["google_enabled"] === "true";
  const googleClientId = publicSettings?.["google_client_id"] || "";
  const facebookEnabled = publicSettings?.["facebook_enabled"] === "true";
  const facebookAppId = publicSettings?.["facebook_app_id"] || "";

  // Init Facebook SDK
  useEffect(() => {
    if (!facebookEnabled || !facebookAppId) return;
    const initFB = () => {
      window.FB?.init({ appId: facebookAppId, version: "v19.0", cookie: true, xfbml: false });
    };
    if (window.FB) {
      initFB();
    } else {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.onload = initFB;
      document.body.appendChild(script);
    }
  }, [facebookEnabled, facebookAppId]);

  const handleLinkFacebook = () => {
    if (!window.FB) { toast.error("Facebook SDK not loaded. Please try again."); return; }
    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          linkSocialMutation.mutate({ provider: "facebook", token: response.authResponse.accessToken });
        } else {
          toast.error("Facebook login cancelled");
        }
      },
      { scope: "email,public_profile", auth_type: "rerequest" }
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const result = await uploadMedia.mutateAsync({
        file,
        folder: "avatars",
      });
      updateProfileMutation.mutate({ avatar: result.url });
    }
  };

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      timezone: user?.timezone || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(
      {
        current_password: data.current_password,
        new_password: data.new_password,
      },
      {
        onSuccess: () => {
          passwordForm.reset();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('profile.description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{t('profile.account_info')}</CardTitle>
            <CardDescription>{t('profile.account_details')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div
                className="relative w-24 h-24 rounded-full cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {uploadMedia.isPending && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Spinner className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {user?.full_name}
              </h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('roles.role')}:</span>
                <Badge variant="outline">{user?.role?.name || "N/A"}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('common.status')}:</span>
                <Badge
                  className={user?.is_active === 1
                    ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
                    : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100"
                  }
                >
                  {user?.is_active === 1 ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('profile.phone')}:</span>
                  <span>{user.phone}</span>
                </div>
              )}
              {user?.last_login_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('profile.last_login')}:</span>
                  <span>{format(new Date(user.last_login_at), "MMM dd, yyyy")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.personal_info')}</CardTitle>
              <CardDescription>{t('profile.personal_info_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('profile.full_name')}</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    {...profileForm.register("full_name")}
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...profileForm.register("email")}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone')}</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    {...profileForm.register("phone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileForm.watch("timezone") || undefined}
                    onValueChange={(val) => profileForm.setValue("timezone", val)}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Use company default" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Personal timezone override (leave empty to use company default)
                  </p>
                </div>

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? t('common.saving') : t('profile.update_profile')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {(googleEnabled || facebookEnabled) && (
            <Card>
              <CardHeader>
                <CardTitle>Social Accounts</CardTitle>
                <CardDescription>Link your social accounts for one-click login</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google */}
                {googleEnabled && googleClientId && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Google</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.google_id ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {user?.google_id ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlinkSocialMutation.mutate("google")}
                          disabled={unlinkSocialMutation.isPending}
                        >
                          Unlink
                        </Button>
                      </div>
                    ) : (
                      <GoogleOAuthProvider clientId={googleClientId}>
                        <div className="[&>div]:!w-auto">
                          <GoogleLogin
                            onSuccess={(cr) => {
                              if (cr.credential) linkSocialMutation.mutate({ provider: "google", token: cr.credential });
                            }}
                            onError={() => toast.error("Google auth failed")}
                            text="signin_with"
                            shape="rectangular"
                            theme="outline"
                            size="medium"
                          />
                        </div>
                      </GoogleOAuthProvider>
                    )}
                  </div>
                )}

                {googleEnabled && facebookEnabled && <Separator />}

                {/* Facebook */}
                {facebookEnabled && facebookAppId && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5" fill="#1877F2">
                        <path d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.9 3.2 56.4 6.3V172c-6.2-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Facebook</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.facebook_id ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {user?.facebook_id ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlinkSocialMutation.mutate("facebook")}
                          disabled={unlinkSocialMutation.isPending}
                        >
                          Unlink
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLinkFacebook}
                        disabled={linkSocialMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        Link Facebook
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.change_password')}</CardTitle>
              <CardDescription>{t('profile.change_password_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">{t('profile.current_password')}</Label>
                  <Input
                    id="current_password"
                    type="password"
                    placeholder={t('profile.enter_current_password')}
                    {...passwordForm.register("current_password")}
                  />
                  {passwordForm.formState.errors.current_password && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.current_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">{t('profile.new_password')}</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder={t('profile.enter_new_password')}
                    {...passwordForm.register("new_password")}
                  />
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.new_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">{t('profile.confirm_password')}</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder={t('profile.confirm_new_password')}
                    {...passwordForm.register("confirm_password")}
                  />
                  {passwordForm.formState.errors.confirm_password && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirm_password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? t('common.changing') : t('profile.change_password')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
