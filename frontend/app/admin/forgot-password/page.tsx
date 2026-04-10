'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

type ForgotFormData = {
  email: string;
};

export default function AdminForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ForgotFormData>({
    defaultValues: {
      email: typeof window !== 'undefined' ? localStorage.getItem('lastAdminEmail') || '' : '',
    },
  });

  const onSubmit = async (data: ForgotFormData) => {
    try {
      const response = await authAPI.forgotPassword({ email: data.email });
      setDevResetUrl(response?.data?.reset_url || '');
      setSubmitted(true);
      toast.success('If account exists, reset link sent to email.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Could not process request.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#f4f9ff_0%,_#edf5ff_100%)] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-blue-100">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 border border-blue-100">Admin Support</span>
          <h1 className="mt-4 text-3xl font-black text-center text-slate-900">Forgot Password</h1>
          <p className="text-center text-slate-500 mt-2">Reset link existing admin login email par hi jayega</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Login Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register('email', { required: 'Email is required' })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              If this admin account exists, a password reset link has been sent to your email.
            </div>
            {devResetUrl ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Development mode link:{' '}
                <Link href={devResetUrl} className="underline font-medium">
                  Reset password now
                </Link>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-blue-100 text-center text-sm">
          <Link href="/admin/login" className="text-blue-700 hover:underline">
            Back to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
