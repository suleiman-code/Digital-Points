'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { servicesAPI } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminFeedbackPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewActionId, setReviewActionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedbackData();
    }
  }, [isAuthenticated, statusFilter, dateFilter]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (dateFilter) filters.days = Number(dateFilter);

      const [reviewsRes, servicesRes] = await Promise.all([
        servicesAPI.getAllReviewsAdmin(filters),
        servicesAPI.getAll(),
      ]);
      setReviews(reviewsRes.data || []);
      setServices(servicesRes.data || []);
    } catch {
      toast.error('Unable to load feedback records right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewStatusUpdate = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      setReviewActionId(reviewId);
      await servicesAPI.updateReviewStatus(reviewId, status);
      toast.success(`Feedback ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
      window.dispatchEvent(new CustomEvent('refresh-admin-counts'));
      await fetchFeedbackData();
    } catch {
      toast.error('Unable to update feedback status right now.');
    } finally {
      setReviewActionId('');
    }
  };

  const handlePermanentDelete = async (reviewId: string) => {
    if (!window.confirm('Permanently delete this rejected feedback from database?')) return;

    try {
      setReviewActionId(reviewId);
      await servicesAPI.deleteReviewPermanently(reviewId);
      toast.success('Rejected feedback permanently deleted.');
      await fetchFeedbackData();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Unable to delete feedback right now.');
    } finally {
      setReviewActionId('');
    }
  };

  const serviceMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const service of services) {
      map[String(service._id || service.id)] = service;
    }
    return map;
  }, [services]);

  const pendingReviews = reviews.filter((review: any) => String(review.status || '').toLowerCase() === 'pending');
  const approvedReviews = reviews.filter((review: any) => String(review.status || '').toLowerCase() === 'approved');
  const rejectedReviews = reviews.filter((review: any) => String(review.status || '').toLowerCase() === 'rejected');

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-600 font-semibold">Loading feedback records...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm max-w-md w-full">
          <p className="text-slate-700 font-semibold">Please login to access feedback records.</p>
          <Link href="/admin/login" className="inline-block mt-4 btn-primary">Go to Admin Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,_#f4f9ff_0%,_#edf5ff_100%)] text-slate-900">
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      <div className={`w-full transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0`}>
        <div className="bg-white shadow-md p-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="text-2xl text-gray-700 md:hidden" aria-label="Open menu">☰</button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl text-gray-700 hidden md:block" aria-label="Toggle sidebar">☰</button>
          </div>
          <h1 className="text-base sm:text-xl font-bold text-right">Feedback Records</h1>
        </div>

        <main className="p-4 sm:p-6 md:p-8 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl">
            <SummaryCard title="Pending" value={pendingReviews.length} tone="blue" />
            <SummaryCard title="Approved" value={approvedReviews.length} tone="green" />
            <SummaryCard title="Declined" value={rejectedReviews.length} tone="rose" />
          </section>

          <section className="bg-white rounded-[1.75rem] border border-slate-100 shadow-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Feedback Moderation</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage and filter user reviews</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Any Time</option>
                  <option value="1">Last 24 Hours</option>
                  <option value="3">Last 3 Days</option>
                  <option value="7">Last 7 Days</option>
                  <option value="15">Last 15 Days</option>
                  <option value="30">Last 30 Days</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-14 text-center text-slate-500 font-semibold">Loading feedback records...</div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400 uppercase tracking-wider">
                No feedback records found {statusFilter || dateFilter ? 'for these filters' : ''}
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => {
                  const status = String(review.status || 'pending').toLowerCase();
                  const badgeClass = status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700';
                  
                  // Use populated service_name from model if available, fallback to serviceMap
                  const displayServiceName = review.service_name || serviceMap[String(review.service_id || '')]?.title || 'Unknown Listing';
                  const serviceLink = `/services/${review.service_id}`;

                  return (
                    <div 
                      key={review._id} 
                      onClick={async () => {
                        if (!review.viewed) {
                          try {
                            await servicesAPI.markReviewViewed(String(review._id));
                            // Force local update if possible, but no blue dot needed anymore
                            review.viewed = true;
                            window.dispatchEvent(new CustomEvent('refresh-admin-counts'));
                          } catch (err) {
                            console.error('Failed to mark review viewed', err);
                          }
                        }
                      }}
                      className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 hover:border-slate-300 transition-colors cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="flex items-center gap-3">
                           {/* Blue dot removed as requested */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                             <InfoBlock label="Name" value={review.user_name || 'Unknown'} />
                             <InfoBlock label="Email" value={review.user_email || 'Not provided'} />
                             <InfoBlock label="Date" value={new Date(review.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                             <InfoBlock label="Rating" value={`${Number(review.rating || 0).toFixed(1)} / 5`} />
                           </div>
                        </div>
                        <span className={`inline-flex self-start px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                          {status}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Link href={serviceLink} target="_blank" className="group rounded-xl bg-white border border-slate-200 px-3 py-2 hover:shadow-sm transition-all block">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Business (Click to view)</p>
                          <p className="text-sm font-bold text-slate-800 mt-1 group-hover:text-blue-600 truncate">{displayServiceName}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{review.service_id}</p>
                        </Link>
                        <div className="rounded-xl bg-white border border-slate-200 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Feedback</p>
                          <p className="text-sm text-slate-700 mt-1 leading-relaxed">{review.comment || 'No message'}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReviewStatusUpdate(String(review._id), 'approved')}
                              disabled={reviewActionId === String(review._id)}
                              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-emerald-500 disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewStatusUpdate(String(review._id), 'rejected')}
                              disabled={reviewActionId === String(review._id)}
                              className="px-3 py-2 rounded-lg bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-rose-500 disabled:opacity-60"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {status === 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(String(review._id))}
                            disabled={reviewActionId === String(review._id)}
                            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider hover:bg-slate-800 disabled:opacity-60"
                          >
                            Delete Permanently
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: number; tone: 'blue' | 'green' | 'rose' }) {
  const toneMap = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-800 mt-1 truncate">{value}</p>
    </div>
  );
}
