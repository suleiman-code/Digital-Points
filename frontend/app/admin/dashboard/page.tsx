'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { servicesAPI } from '@/lib/api';
import { normalizeCategory } from '@/lib/businessCategories';
import toast from 'react-hot-toast';

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
    totalInquiries: 0
  });
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
      const { contactAPI } = await import('@/lib/api');
      const [servicesRes, inquiriesRes] = await Promise.all([
        servicesAPI.getAll(),
        contactAPI.getAll(),
      ]);
      
      const fetchedServices = servicesRes?.data || [];
      const inquiries = inquiriesRes?.data || [];
      
      setServices(fetchedServices);
      
      const activeListings = fetchedServices.length;
      const activeCategories = new Set(
        fetchedServices
          .map((s: any) => normalizeCategory(String(s.category || '').trim()))
          .filter(Boolean)
      ).size;
      const totalInquiries = inquiries.length;
      
      // Calculate real average rating
      const ratings = fetchedServices.map((s: any) => Number(s.avg_rating || 0)).filter((r: number) => r > 0);
      const avg = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

      setStats({
        activeListings,
        activeCategories,
        avgRating: Number(avg.toFixed(1)),
        totalInquiries
      });
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, fetchStats]);

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
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[linear-gradient(180deg,_#1d4c83_0%,_#274f87_55%,_#2f6fb1_100%)] text-white transition-all duration-300 fixed left-0 top-0 h-screen z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-4 border-b border-white/10">
          <Link href="/admin/dashboard" className="text-2xl font-black tracking-tight truncate">
            {sidebarOpen ? 'SH Admin' : 'SA'}
          </Link>
          {sidebarOpen && <p className="text-[10px] text-blue-100/80 uppercase tracking-[0.2em] mt-1">Control Panel</p>}
        </div>

        <nav className="mt-8 space-y-2 p-4">
          <SidebarLink href="/admin/dashboard" icon="📊" label="Dashboard" open={sidebarOpen} />
          <SidebarLink href="/admin/services" icon="🛠️" label="All Services" open={sidebarOpen} />
          <SidebarLink href="/admin/bookings" icon="📅" label="Inquiries" open={sidebarOpen} />
          <SidebarLink href="/admin/feedback" icon="💬" label="Feedback" open={sidebarOpen} />
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="w-full btn-danger text-sm py-2 truncate"
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          aria-label="Close menu"
        />
      )}

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-4xl">
            <StatCard icon="🛠️" label="Active Listings" value={stats.activeListings} />
            <StatCard icon="⭐" label="Avg Rating" value={stats.avgRating || 'N/A'} />
            <StatCard icon="📁" label="Active Categories" value={stats.activeCategories} />
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
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

          <section className="mt-8 bg-white rounded-[2rem] shadow-xl p-5 sm:p-7 border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Dashboard Overview</h2>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 mt-1">
                  Quick summary of your directory activity.
                </p>
              </div>
              <Link href="/admin/feedback" className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-black uppercase tracking-[0.14em] hover:bg-blue-100 transition-colors">
                Open Feedback Records
              </Link>
            </div>
            <p className="text-sm text-slate-600">
              Feedback moderation has been moved to the dedicated Feedback page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label, open }: any) {
  return (
    <Link
      href={href}
      className={`block px-4 py-3 rounded-xl transition flex items-center gap-3 truncate ${
        typeof window !== 'undefined' && window.location.pathname === href ? 'bg-[#1a3357] text-white' : 'text-blue-100/80 hover:bg-[#1a3357] hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      {open && <span className="font-bold text-sm">{label}</span>}
    </Link>
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
