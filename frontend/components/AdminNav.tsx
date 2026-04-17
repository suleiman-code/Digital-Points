'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';

export default function AdminNavbar() {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Services', href: '/admin/services', icon: '🛠️' },
    { label: 'Bookings', href: '/admin/bookings', icon: '📅' },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 fixed left-0 top-0 h-screen`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <Link href="/admin/dashboard" className="text-2xl font-bold">
            {sidebarOpen ? 'DP Admin' : 'DP'}
          </Link>
        </div>

        {/* Menu */}
        <nav className="mt-8 space-y-2 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="w-full btn-danger text-sm py-2"
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        className={`${sidebarOpen ? 'ml-64' : 'ml-20'} w-full transition-all duration-300`}
      >
        {/* Top Bar */}
        <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-2xl text-gray-700 hover:text-gray-900"
          >
            ☰
          </button>
          <div className="text-gray-600">Admin Panel</div>
        </div>

        {/* Main Content */}
        <div className="p-8 bg-gray-50 min-h-screen" />
      </div>
    </div>
  );
}
