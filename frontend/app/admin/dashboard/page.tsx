'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { servicesAPI, bookingsAPI } from '@/lib/api';

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalServices: 0,
    totalBookings: 0,
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
      const [servicesRes, bookingsRes] = await Promise.all([
        servicesAPI.getAll(),
        bookingsAPI.getAll(),
      ]);
      setStats({
        totalServices: servicesRes.data.length,
        totalBookings: bookingsRes.data.length,
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

  return (
    <div className="flex min-h-screen bg-gray-50">
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
          <SidebarLink href="/admin/services" icon="🛠️" label="Services" open={sidebarOpen} />
          <SidebarLink href="/admin/bookings" icon="📅" label="Bookings" open={sidebarOpen} />
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
          <div className="text-gray-600 font-semibold">Admin Dashboard</div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          <h1 className="text-4xl font-bold mb-8">Welcome to Admin Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon="🛠️" label="Total Services" value={stats.totalServices} />
            <StatCard icon="📅" label="Total Bookings" value={stats.totalBookings} />
            <StatCard icon="⭐" label="Average Rating" value="4.8" />
            <StatCard icon="👥" label="Active Users" value="1,000+" />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/admin/services" className="block btn-primary">
                  Manage Services
                </Link>
                <Link href="/admin/bookings" className="block btn-secondary">
                  View Bookings
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-4">System Status</h2>
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  All Systems Operational
                </p>
                <p className="text-sm text-gray-600">Database: Connected</p>
                <p className="text-sm text-gray-600">API: Running</p>
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
      className="block px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center gap-3 truncate"
    >
      <span className="text-xl">{icon}</span>
      {open && <span className="truncate">{label}</span>}
    </Link>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
