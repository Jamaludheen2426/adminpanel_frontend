"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useSocialLogin } from "@/hooks/use-auth";
import { useSettingsByGroup, usePublicSettings } from "@/hooks/use-settings";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";

declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; version: string; cookie: boolean; xfbml: boolean }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string } }) => void,
        options: { scope: string }
      ) => void;
    };
  }
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const socialLoginMutation = useSocialLogin();
  const { data: settings } = useSettingsByGroup("appearance");
  const { data: publicSettings } = usePublicSettings();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const adminLogoUrl = settings?.find((s) => s.key === "site_logo_url")?.value || "";
  const adminTitle = settings?.find((s) => s.key === "admin_title")?.value || "Admin Login";
  const backgroundImage = settings?.find((s) => s.key === "login_background_url")?.value || "";

  const googleEnabled = publicSettings?.["google_enabled"] === "true";
  const googleClientId = publicSettings?.["google_client_id"] || "";
  const facebookEnabled = publicSettings?.["facebook_enabled"] === "true";
  const facebookAppId = publicSettings?.["facebook_app_id"] || "";

  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const facebookAvailable = facebookEnabled && !!facebookAppId && isHttps;

  const showSocial = (googleEnabled && !!googleClientId) || (facebookEnabled && !!facebookAppId);

  useEffect(() => {
    if (!facebookAvailable) return;

    const initFB = () => {
      window.FB?.init({
        appId: facebookAppId,
        version: "v19.0",
        cookie: true,
        xfbml: false,
      });
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
  }, [facebookAvailable, facebookAppId]);

  const handleFacebookLogin = () => {
    if (!isHttps) {
      toast.error("Facebook login requires HTTPS. Use it on your production site.");
      return;
    }
    if (!window.FB) {
      toast.error("Facebook SDK not loaded. Please try again.");
      return;
    }
    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          socialLoginMutation.mutate({
            provider: "facebook",
            token: response.authResponse.accessToken,
          });
        } else {
          toast.error("Facebook login cancelled");
        }
      },
      { scope: 'email,public_profile' }
    );
  };

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen h-screen flex">
      {/* Left Side - Background Image (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        )}
        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
          <p className="text-lg text-white/80 max-w-md">
            Sign in to access your admin dashboard and manage your application.
          </p>
        </div>
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Right Side - Login Form (40%) */}
      <div className="w-full lg:w-[40%] bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            {adminLogoUrl ? (
              <img
                src={adminLogoUrl}
                alt={adminTitle}
                className="h-12 mx-auto object-contain mb-4"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">{adminTitle}</h1>
            )}
            <p className="text-gray-500 text-sm">
              Enter your credentials to access the admin panel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>

            {/* Social Login Section */}
            {showSocial && (
              <>
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Google Login */}
                  {googleEnabled && googleClientId && (
                    <GoogleOAuthProvider clientId={googleClientId}>
                      <div className="w-full [&>div]:w-full [&>div>div]:w-full [&>div>div>iframe]:w-full">
                        <GoogleLogin
                          onSuccess={(credentialResponse) => {
                            if (credentialResponse.credential) {
                              socialLoginMutation.mutate({
                                provider: "google",
                                token: credentialResponse.credential,
                              });
                            }
                          }}
                          onError={() => toast.error("Google login failed")}
                          width="100%"
                          text="signin_with"
                          shape="rectangular"
                          theme="outline"
                        />
                      </div>
                    </GoogleOAuthProvider>
                  )}

                  {/* Facebook Login — requires HTTPS; shown disabled on HTTP with a hint */}
                  {facebookEnabled && facebookAppId && (
                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      disabled={socialLoginMutation.isPending || !isHttps}
                      title={!isHttps ? "Facebook login requires HTTPS (not available on localhost)" : undefined}
                      className="flex items-center justify-center gap-3 w-full border border-gray-200 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        className="w-5 h-5 shrink-0"
                        fill="#1877F2"
                      >
                        <path d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.9 3.2 56.4 6.3V172c-6.2-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256z" />
                      </svg>
                      Continue with Facebook
                      {!isHttps && <span className="text-xs text-gray-400">(HTTPS only)</span>}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Register Link */}
            <p className="text-sm text-center text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
