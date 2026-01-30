import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type {
  AuthUser,
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  VerifyOTPDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from '@/types';

// API functions
const authApi = {
  me: async (): Promise<AuthUser> => {
    const response = await apiClient.get('/auth/me');
    return response.data.data.user;
  },

  login: async (data: LoginDto): Promise<AuthUser> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data.user;
  },

  register: async (data: RegisterDto): Promise<AuthUser> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await apiClient.put('/auth/change-password', data);
  },

  forgotPassword: async (data: ForgotPasswordDto): Promise<void> => {
    await apiClient.post('/auth/forgot-password', data);
  },

  verifyOTP: async (data: VerifyOTPDto): Promise<void> => {
    await apiClient.post('/auth/verify-reset-otp', data);
  },

  resetPassword: async (data: ResetPasswordDto): Promise<void> => {
    await apiClient.post('/auth/reset-password', data);
  },

  updateProfile: async (data: UpdateProfileDto): Promise<AuthUser> => {
    const response = await apiClient.put('/auth/update-profile', data);
    return response.data.data.user;
  },
};

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authApi.me,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me(), user);
      toast.success('Login successful');
      router.push('/admin');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me(), user);
      toast.success('Registration successful');
      router.push('/admin');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/auth/login');
    },
    onError: () => {
      // Even if logout fails, clear local state
      queryClient.clear();
      router.push('/auth/login');
    },
  });
}

// Change password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });
}

// Forgot password mutation - sends OTP
export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      toast.success('OTP sent to your email');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    },
  });
}

// Verify OTP mutation
export function useVerifyOTP() {
  return useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: () => {
      toast.success('OTP verified successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    },
  });
}

// Reset password mutation
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successfully');
      router.push('/auth/login');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me(), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });
}

// Auth context helper
export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser();

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    isError: !!error,
  };
}
