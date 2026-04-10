'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

type ResetFormData = {
  token?: string;
  newPassword: string;
  confirmPassword: string;
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<ResetFormData>();
  const newPassword = watch('newPassword');

  const onSubmit = async (data: ResetFormData) => {
    const effectiveToken = (urlToken || data.token || '').trim();
    if (!effectiveToken) {
      toast.error('Reset token is missing.');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      await authAPI.resetPassword({ token: effectiveToken, new_password: data.newPassword });
      localStorage.removeItem('authToken');
      toast.success('Password reset successful. Please login.');
      router.push('/admin/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Could not reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#f4f9ff_0%,_#edf5ff_100%)] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-blue-100">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 border border-blue-100">Admin Security</span>
          <h1 className="mt-4 text-3xl font-black text-center text-slate-900">Reset Password</h1>
          <p className="text-center text-slate-500 mt-2">Set a new password for your admin account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!urlToken ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Reset link token missing in URL. Paste token below or request a new reset link.
            </div>
          ) : null}

          {!urlToken ? (
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Reset Token
              </label>
              <input
                id="token"
                type="text"
                placeholder="Paste reset token"
                {...register('token')}
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                className="pr-10"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  {showNewPassword ? (
                    <>
                      <path d="M3 3L21 21" />
                      <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                      <path d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1.01 2.27-2.67 4.07-4.7 5.18" />
                      <path d="M6.61 6.61C4.78 7.73 3.3 9.42 2 12c1.73 3.89 6 7 10 7 1.61 0 3.15-.35 4.55-.98" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {errors.newPassword ? (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                className="pr-10"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === newPassword || 'Passwords do not match',
                })}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  {showConfirmPassword ? (
                    <>
                      <path d="M3 3L21 21" />
                      <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                      <path d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1.01 2.27-2.67 4.07-4.7 5.18" />
                      <path d="M6.61 6.61C4.78 7.73 3.3 9.42 2 12c1.73 3.89 6 7 10 7 1.61 0 3.15-.35 4.55-.98" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-blue-100 text-center text-sm space-y-2">
          <p>
            <Link href="/admin/forgot-password" className="text-blue-700 hover:underline">
              Request New Reset Link
            </Link>
          </p>
          <p>
            <Link href="/admin/login" className="text-blue-700 hover:underline">
              Back to Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
