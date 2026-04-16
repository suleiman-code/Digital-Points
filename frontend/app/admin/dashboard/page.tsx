'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { servicesAPI } from '@/lib/api';
import { normalizeCategory } from '@/lib/businessCategories';
import toast from 'react-hot-toast';

import AdminSidebar from '@/components/AdminSidebar';

export default function AdminDashboard() {
  const REFRESH_INTERVAL_MS = 5000;
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // State for metrics and data
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeListings: 0,
    activeCategories: 0,
    avgRating: 0,
    totalEmails: 0,
    pendingEmails: 0,
    pendingReviews: 0
  });
  const [recentEmails, setRecentEmails] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchStats = useCallback(async () => {
    try {
      // BUG #10 FIX: use the lightweight /dashboard/stats endpoint for numeric cards
      // instead of fetching the full services + contacts list every 5 seconds.
      const statsRes = await servicesAPI.getStats();
      const s = statsRes?.data;

      setStats((prev) => {
        const newPendingEmails = s?.pending_contacts || 0;
        const newPendingReviews = s?.pending_reviews || 0;

        // Trigger toast notifications if counts INCREASE
        if (newPendingEmails > prev.pendingEmails) {
          toast('New Email Received!', { icon: '✉️', style: { borderRadius: '10px', background: '#3b82f6', color: '#fff' }});
        }
        if (newPendingReviews > prev.pendingReviews) {
          toast('New Feedback Received!', { icon: '💬', style: { borderRadius: '10px', background: '#eab308', color: '#fff' }});
        }

        return {
          ...prev,
          activeListings: s?.total_services ?? prev.activeListings,
          totalEmails: (s?.total_contacts || 0),
          pendingEmails: newPendingEmails,
          pendingReviews: newPendingReviews
        };
      });
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch full services ONCE (or on demand) for category breakdown + avg rating
  const fetchServices = useCallback(async () => {
    try {
      const { contactAPI } = await import('@/lib/api');
      const [servicesRes, emailsRes] = await Promise.all([
        servicesAPI.getAll(),
        contactAPI.getAll(),
      ]);

      const fetchedServices = servicesRes?.data || [];
      const emails = emailsRes?.data || [];

      setServices(fetchedServices);

      const activeCategories = new Set(
        fetchedServices
          .map((s: any) => normalizeCategory(String(s.category || '').trim()))
          .filter(Boolean)
      ).size;
      const ratings = fetchedServices.map((s: any) => Number(s.avg_rating || 0)).filter((r: number) => r > 0);
      const avg = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

      setStats((prev) => ({
        ...prev,
        activeListings: fetchedServices.length,
        activeCategories,
        avgRating: Number(avg.toFixed(1)),
        totalEmails: emails.length || 0,
      }));

      // Merge and Set recent emails (limit to 5)
      const merged = [
        ...emails.map((c: any) => ({ ...c, _type: 'general' }))
      ].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setRecentEmails(merged.slice(0, 5));
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error('Error fetching service details:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Full data on mount — for category breakdown and avg rating
    fetchServices();

    // Lightweight stats poll every 5s — only hits the /dashboard/stats endpoint
    fetchStats();
    const interval = setInterval(fetchStats, REFRESH_INTERVAL_MS);

    const handleFocus = () => {
      fetchStats();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, fetchStats, fetchServices]);

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-600 font-semibold">Loading admin dashboard...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm max-w-md w-full">
          <p className="text-slate-700 font-semibold">Session not found. Please login to continue.</p>
          <Link href="/admin/login" className="inline-block mt-4 btn-primary">Go to Admin Login</Link>
        </div>
      </div>
    );
  }

  const listedCategoryCounts = services.reduce((acc: Record<string, number>, service: any) => {
    const category = normalizeCategory(String(service?.category || '').trim());
    if (!category) return acc;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const listedCategoryOptions = Object.entries(listedCategoryCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const selectedCategoryCount = selectedCategory ? listedCategoryCounts[selectedCategory] || 0 : 0;

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,_#f4f9ff_0%,_#edf5ff_100%)] text-slate-900">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div className={`w-full transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0`}>
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-3 sm:p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="text-2xl text-gray-700 md:hidden" aria-label="Open menu">☰</button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl text-gray-700 hover:text-gray-900 hidden md:block" aria-label="Toggle sidebar">☰</button>
          </div>
          <div className="text-slate-500 font-bold uppercase tracking-[0.18em] text-[10px] hidden sm:block">Dashboard Control Center</div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 md:p-8">
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">Welcome to Admin Dashboard</h1>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-[0.18em] text-[10px]">Real-time Directory Insights</p>
            <p className="text-[11px] text-slate-400 font-medium mt-2">
              Auto refresh every 5s{lastUpdatedAt ? ` • Last updated: ${lastUpdatedAt.toLocaleTimeString()}` : ''}
            </p>

            <div className="mt-5 max-w-sm">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Listed Categories</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select category</option>
                {listedCategoryOptions.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.count})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500 font-semibold">
                {selectedCategory ? `${selectedCategory}: ${selectedCategoryCount} listing(s)` : `${listedCategoryOptions.length} category options available`}
              </p>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <StatCard icon="🛠️" label="Active Listings" value={stats.activeListings} />
            <StatCard icon="✉️" label="Total Emails" value={stats.totalEmails} />
            <StatCard icon="📥" label="Pending Response" value={stats.pendingEmails} />
            <StatCard icon="📁" label="Categories" value={stats.activeCategories} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 border border-slate-100 lg:col-span-2">
              <h2 className="text-2xl font-black mb-6 tracking-tight">Main Controls</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/admin/add-listing" className="w-full py-3 px-5 bg-[linear-gradient(135deg,_#1f5aa0,_#2f74c8)] text-white border border-[#2f74c8] font-bold text-xs uppercase tracking-[0.16em] rounded-xl hover:brightness-105 transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(47,116,200,0.18)]">
                  <span className="text-base leading-none">+</span>
                  Create New Business
                </Link>
                <Link href="/admin/services" className="w-full py-3 px-5 bg-[linear-gradient(135deg,_#1f5aa0,_#2f74c8)] text-white border border-[#2f74c8] font-bold text-xs uppercase tracking-[0.16em] rounded-xl hover:brightness-105 transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(47,116,200,0.18)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  Manage Listings
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">System Status</p>
              <div className="flex items-center gap-2 justify-center">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-lg font-bold text-slate-800 tracking-tight">Online & Connected</p>
              </div>
              <p className="text-xs text-slate-400 mt-2 italic font-medium">Database: MongoDB Atlas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">
            {/* Recent Activity */}
            <section className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Recent Emails</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Last 5 messages from contact form</p>
                </div>
                <Link href="/admin/emails" className="text-[10px] font-black uppercase text-blue-600 hover:underline">View All</Link>
              </div>

              {recentEmails.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-40">
                  <span className="text-4xl mb-4">💤</span>
                  <p className="text-xs font-bold uppercase tracking-widest">No recent emails</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEmails.map((item: any) => (
                    <div key={item._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-3">
                        {!item.viewed && <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">{item.name || item.user_name || 'User'}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">
                            🌐 Contact Email
                          </p>
                        </div>
                      </div>
                      <Link href="/admin/emails" className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                        ➜
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Listed Categories Breakdown */}
            <section className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 border border-slate-100">
              <h2 className="text-xl font-black tracking-tight text-slate-900 mb-6 font-black uppercase tracking-tight">Category Breakdown</h2>
              <div className="grid grid-cols-2 gap-3">
                {listedCategoryOptions.slice(0, 8).map((cat) => (
                  <div key={cat.name} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 truncate mr-2">{cat.name}</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-black border border-slate-100">{cat.count}</span>
                  </div>
                ))}
                {listedCategoryOptions.length > 8 && (
                  <div className="p-3 text-center border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-bold text-slate-400">
                    + {listedCategoryOptions.length - 8} more
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-[1.25rem] shadow-lg border border-slate-100 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-all duration-500 opacity-60"></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
        <div className="text-2xl sm:text-3xl">{icon}</div>
      </div>
    </div>
  );
}
