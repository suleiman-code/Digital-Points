'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { servicesAPI } from '@/lib/api';

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  
  // State for metrics and data
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalServices: 0,
    avgRating: 0,
    totalInquiries: 0
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const { contactAPI } = await import('@/lib/api');
      const [servicesRes, inquiriesRes] = await Promise.all([
        servicesAPI.getAll(),
        contactAPI.getAll()
      ]);
      
      const fetchedServices = servicesRes?.data || [];
      const inquiries = inquiriesRes?.data || [];
      
      setServices(fetchedServices);
      
      const totalServices = fetchedServices.length;
      const totalInquiries = inquiries.length;
      
      // Calculate real average rating
      const ratings = fetchedServices.map((s: any) => Number(s.avg_rating || 0)).filter((r: number) => r > 0);
      const avg = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

      setStats({
        totalServices,
        avgRating: Number(avg.toFixed(1)),
        totalInquiries
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Derived distinct categories
  const categories = Array.from(new Set(services.map((s: any) => s.category))).sort();

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 fixed left-0 top-0 h-screen z-40`}
      >
        <div className="p-4 border-b border-gray-700">
          <Link href="/admin/dashboard" className="text-2xl font-bold truncate">
            {sidebarOpen ? 'SH Admin' : 'SA'}
          </Link>
        </div>

        <nav className="mt-8 space-y-2 p-4">
          <SidebarLink href="/admin/dashboard" icon="📊" label="Dashboard" open={sidebarOpen} />
          <SidebarLink href="/admin/services" icon="🛠️" label="All Services" open={sidebarOpen} />
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

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} w-full transition-all duration-300`}>
        {/* Top Bar */}
        <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-2xl text-gray-700 hover:text-gray-900"
          >
            ☰
          </button>
          <div className="text-gray-600 font-semibold uppercase tracking-widest text-[10px]">Dashboard Control Center</div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          <header className="mb-10">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Welcome to Admin Dashboard</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Real-time Directory Insights</p>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <StatCard icon="🛠️" label="Total Services" value={stats.totalServices} />
            <StatCard icon="⭐" label="Avg Rating" value={stats.avgRating || 'N/A'} />
            <StatCard icon="📁" label="Active Categories" value={categories.length} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-50">
              <h2 className="text-2xl font-black mb-6 tracking-tight">Main Controls</h2>
              <div className="space-y-4">
                <Link href="/admin/add-listing" className="block w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xs uppercase tracking-widest text-center rounded-2xl shadow-lg hover:shadow-green-500/20 transition-all active:scale-95">
                   + Create New Listing
                </Link>
                <Link href="/admin/services" className="block w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest text-center rounded-2xl shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                   Manage Listings
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-50 flex items-center justify-center text-center">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">System Status</p>
                <div className="flex items-center gap-2 justify-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-lg font-bold text-slate-800 tracking-tight">Online & Connected</p>
                </div>
                <p className="text-xs text-slate-400 mt-2 italic font-medium">Database: MongoDB Atlas</p>
              </div>
            </div>
          </div>
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
        typeof window !== 'undefined' && window.location.pathname === href ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      {open && <span className="font-bold text-sm">{label}</span>}
    </Link>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-all duration-500 opacity-50"></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
        <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-300">{icon}</div>
      </div>
    </div>
  );
}
