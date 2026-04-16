'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { servicesAPI } from '@/lib/api';

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
}

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen
}: AdminSidebarProps) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [counts, setCounts] = useState({ inquiries: 0, reviews: 0, emails: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await servicesAPI.getStats();
        setCounts({
          inquiries: res.data.pending_bookings || 0,
          emails: res.data.pending_contacts || 0,
          reviews: res.data.pending_reviews || 0
        });
      } catch (err) {
        console.error('Failed to fetch notification counts');
      }
    };
    fetchCounts();
    
    const handleRefresh = () => fetchCounts();
    window.addEventListener('refresh-admin-counts', handleRefresh);

    // Refresh counts every 5 seconds for near real-time badges
    const interval = setInterval(fetchCounts, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-admin-counts', handleRefresh);
    };
  }, []);

  const menuItems = [
    { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/admin/services', icon: '🛠️', label: 'Services' },
    { 
      href: '/admin/emails', 
      icon: '✉️', 
      label: 'Emails', 
      badge: counts.emails > 0 ? counts.emails : null 
    },
    { 
      href: '/admin/feedback', 
      icon: '💬', 
      label: 'Feedback', 
      badge: counts.reviews > 0 ? counts.reviews : null 
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[linear-gradient(180deg,_#1d4c83_0%,_#274f87_55%,_#2f6fb1_100%)] text-white transition-all duration-300 fixed left-0 top-0 h-screen z-40 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4 border-b border-white/10">
          <Link href="/admin/dashboard" className="text-2xl font-black tracking-tight truncate flex items-center gap-2">
            <span>{sidebarOpen ? 'SH Admin' : 'SA'}</span>
          </Link>
          {sidebarOpen && <p className="text-[10px] text-blue-100/80 uppercase tracking-[0.2em] mt-1 font-bold">Control Panel</p>}
        </div>

        <nav className="mt-8 space-y-2 p-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                {sidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
                
                {/* Badge */}
                {item.badge && (
                  <span className={`
                    absolute flex items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white 
                    ${sidebarOpen ? 'right-4 px-2 min-w-[20px] h-[20px]' : 'top-2 right-2 w-5 h-5'}
                    shadow-[0_0_12px_rgba(220,38,38,0.5)] ring-2 ring-white/20
                  `}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed mode */}
                {!sidebarOpen && (
                   <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label} {item.badge ? `(${item.badge})` : ''}
                   </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Global Stats/Status (Decent summary) */}
        {sidebarOpen && (
          <div className="mx-4 mt-10 p-4 rounded-2xl bg-white/5 border border-white/10">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-100/60">System Live</span>
             </div>
             <div className="space-y-1">
                {counts.reviews > 0 && <p className="text-[10px] text-white/90 font-medium">• {counts.reviews} Reviews Pending</p>}
                {counts.emails > 0 && <p className="text-[10px] text-white/90 font-medium">• {counts.emails} New Emails</p>}
                {counts.reviews === 0 && counts.emails === 0 && <p className="text-[10px] text-white/40 italic font-medium">All caught up!</p>}
             </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-900/40 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 group relative mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Logout</span>}
            
            {!sidebarOpen && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                Logout Session
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
