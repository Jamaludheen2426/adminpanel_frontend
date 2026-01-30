"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword, useVerifyOTP, useResetPassword } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";

// Step 1: Email schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

// Step 2: OTP schema
const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Step 3: Password schema
const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const forgotPasswordMutation = useForgotPassword();
  const verifyOTPMutation = useVerifyOTP();
  const resetPasswordMutation = useResetPassword();

  // Step 1 form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Step 2 form
  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Step 3 form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Step 1: Submit email
  const onEmailSubmit = (data: EmailFormData) => {
    setEmail(data.email);
    forgotPasswordMutation.mutate(data, {
      onSuccess: () => setStep(2),
    });
  };

  // Step 2: Submit OTP
  const onOTPSubmit = (data: OTPFormData) => {
    setOtp(data.otp);
    verifyOTPMutation.mutate(
      { email, otp: data.otp },
      { onSuccess: () => setStep(3) }
    );
  };

  // Step 3: Submit new password
  const onPasswordSubmit = (data: PasswordFormData) => {
    resetPasswordMutation.mutate({
      email,
      otp,
      password: data.password,
    });
  };

  // Resend OTP
  const handleResendOTP = () => {
    forgotPasswordMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen h-screen flex">
      {/* Left Side - Background */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Reset Password</h2>
          <p className="text-lg text-white/80 max-w-md">
            {step === 1 && "Enter your email to receive a verification code."}
            {step === 2 && "Enter the 6-digit OTP sent to your email."}
            {step === 3 && "Create a new password for your account."}
          </p>
        </div>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-[40%] bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Back button */}
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Login
          </Link>

          {/* Step indicator */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full ${
                  s === step
                    ? "bg-indigo-600"
                    : s < step
                    ? "bg-indigo-400"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
                <p className="text-gray-500 text-sm">
                  Enter your email and we&apos;ll send you a verification code
                </p>
              </div>

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="bg-gray-50 border-gray-200 text-gray-900"
                    {...emailForm.register("email")}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-gray-900">Enter OTP</h1>
                <p className="text-gray-500 text-sm">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 text-sm font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="bg-gray-50 border-gray-200 text-gray-900 text-center text-2xl tracking-widest"
                    {...otpForm.register("otp")}
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-sm text-red-500">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  disabled={verifyOTPMutation.isPending}
                >
                  {verifyOTPMutation.isPending ? "Verifying..." : "Verify OTP"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={forgotPasswordMutation.isPending}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    {forgotPasswordMutation.isPending ? "Sending..." : "Resend OTP"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Change email address
                </button>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-gray-900">New Password</h1>
                <p className="text-gray-500 text-sm">
                  Create a new password for your account
                </p>
              </div>

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    className="bg-gray-50 border-gray-200 text-gray-900"
                    {...passwordForm.register("password")}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="bg-gray-50 border-gray-200 text-gray-900"
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
