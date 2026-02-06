'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Cookies from 'js-cookie';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', data.email);
      
      const response = await fetch('http://localhost:5000/api/v1/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      console.log('Login response status:', response.status);
      const result = await response.json();
      console.log('Login response:', result);

      if (!response.ok) {
        setError(result.message || `Sign in failed (${response.status})`);
        return;
      }

      // Store tokens if provided (for JWT-based auth)
      if (result.data?.accessToken) {
        Cookies.set('accessToken', result.data.accessToken, {
          expires: 7,
          secure: false,
          sameSite: 'lax',
        });
      }

      if (result.data?.refreshToken) {
        Cookies.set('refreshToken', result.data.refreshToken, {
          expires: 30,
          secure: false,
          sameSite: 'lax',
        });
      }

      // Store user data in localStorage
      if (result.data?.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
        localStorage.setItem('authenticated', 'true');
        console.log('User stored in localStorage:', result.data.user);
      }

      console.log('Login successful, redirecting to /admin');
      // Small delay to ensure cookies are set
      setTimeout(() => {
        router.push('/admin');
      }, 300);
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again. Check browser console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your admin dashboard</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            {...register('email')}
            className="mt-2"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-2">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register('password')}
              className="pr-10"
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
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-gray-600">Remember me</span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-gray-600">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-blue-600 font-medium hover:text-blue-700">
          Sign up
        </Link>
      </p>
    </div>
  );
}
