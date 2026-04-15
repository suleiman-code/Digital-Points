'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { contactAPI } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminBookingsPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [directEmails, setDirectEmails] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDirectEmails();
    }
  }, [isAuthenticated, dateFilter]);

  const fetchDirectEmails = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      const days = parseInt(dateFilter);
      if (!isNaN(days) && days > 0) filters.days = days;

      const response = await contactAPI.getAll(filters);
      setDirectEmails(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setDirectEmails([]);
      toast.error('Error fetching website inquiries');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-600 font-semibold">Loading inquiries panel...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm max-w-md w-full">
          <p className="text-slate-700 font-semibold">Please login to access service inquiries.</p>
          <Link href="/admin/login" className="inline-block mt-4 btn-primary">Go to Admin Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,_#f4f9ff_0%,_#edf5ff_100%)]">
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Main Content */}
      <div className={`w-full transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0`}>
        <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="text-2xl text-gray-700 md:hidden" aria-label="Open menu">☰</button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl text-gray-700 hidden md:block" aria-label="Toggle sidebar">☰</button>
          </div>
          <h1 className="text-base sm:text-xl font-bold text-right">Inquiries</h1>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          <div className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-tight">Website Inquiries</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Messages sent to the company from the contact page</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl px-4 py-2 outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
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
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : directEmails.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center shadow-sm">
                 <p className="text-4xl mb-4 opacity-20">📩</p>
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No inquiries received yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {directEmails.map((item: any) => (
                  <BookingItem key={item._id || item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingItem({ item }: { item: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localViewed, setLocalViewed] = useState(item.viewed || false);
  const dateStr = new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  const handleExpand = async () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState && !localViewed) {
      setLocalViewed(true); // Instant UI feedback
      try {
        await contactAPI.markViewed(item._id || item.id);
        window.dispatchEvent(new CustomEvent('refresh-admin-counts'));
      } catch (err) {
        console.error('Failed to mark as viewed', err);
      }
    }
  };

  return (
    <div 
      className={`bg-white rounded-[1.75rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-200 shadow-2xl ring-4 ring-blue-50/50' : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-lg'}`}
    >
      <div 
        onClick={handleExpand}
        className="p-6 sm:p-7 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex-1 min-w-0 flex items-start gap-4">
          {!localViewed && (
            <div className="mt-1.5 flex-shrink-0 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-emerald-100 animate-pulse" title="New Inquiry"></div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate tracking-tight uppercase tracking-tight">{item.subject || 'Website Inquiry'}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                <div className="w-7 h-7 rounded-sm bg-slate-100 flex items-center justify-center text-slate-400 font-black">👤</div>
                {item.name || 'Anonymous User'}
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                <span>📅 {dateStr}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span>✉️ {item.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 justify-end">
          <button className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50"
          >
            <div className="p-6 sm:p-8 space-y-8">
              {/* Message Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                  User Message
                </div>
                <p className="text-slate-700 leading-relaxed font-medium mt-2 whitespace-pre-wrap">&quot;{item.message}&quot;</p>
              </div>

              {/* Detail Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailBox label="Full Name" value={item.name} icon="👤" />
                <DetailBox label="Email Address" value={item.email} icon="✉️" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-slate-800 font-bold text-xs truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );
}
