'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import Link from 'next/link';

export default function AdminLoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const router = useRouter();

  const onSubmit = async (data: any) => {
    try {
      const response = await authAPI.login(data);
      localStorage.setItem('authToken', response.data.token);
      toast.success('Login successful!');
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">ServiceHub Admin</h1>
        <p className="text-center text-gray-600 mb-8">Login to your admin panel</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              {...register('email', { required: 'Email is required' })}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password', { required: 'Password is required' })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            Not an admin?{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              Go to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
