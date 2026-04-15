'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { inquiriesAPI } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminBookingsPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [directEmails, setDirectEmails] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDirectEmails();
    }
  }, [isAuthenticated]);

  const fetchDirectEmails = async () => {
    try {
      setLoading(true);
      const response = await inquiriesAPI.getAll();
      setDirectEmails(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setDirectEmails([]);
      toast.error('Error fetching service inquiries');
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
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[linear-gradient(180deg,_#1d4c83_0%,_#274f87_55%,_#2f6fb1_100%)] text-white transition-all duration-300 fixed left-0 top-0 h-screen z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-4 border-b border-white/10">
          <Link href="/admin/dashboard" className="text-2xl font-bold truncate">
            {sidebarOpen ? 'SH Admin' : 'SA'}
          </Link>
        </div>

        <nav className="mt-8 space-y-2 p-4">
          <SidebarItem href="/admin/dashboard" icon="📊" label="Dashboard" open={sidebarOpen} />
          <SidebarItem href="/admin/services" icon="🛠️" label="Services" open={sidebarOpen} />
          <SidebarItem href="/admin/bookings" icon="📅" label="Inquiries" open={sidebarOpen} active />
          <SidebarItem href="/admin/feedback" icon="💬" label="Feedback" open={sidebarOpen} />
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="w-full btn-danger text-sm py-2"
            aria-label="Logout"
            title="Logout"
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
        <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="text-2xl text-gray-700 md:hidden" aria-label="Open menu">☰</button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl text-gray-700 hidden md:block" aria-label="Toggle sidebar">☰</button>
          </div>
          <h1 className="text-base sm:text-xl font-bold text-right">Service Inquiries (Direct to Owners)</h1>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Direct Inquiries</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Messages sent directly to listing owners</p>
              </div>
              <span className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-700 shadow-sm">
                {directEmails.length} Records
              </span>
            </div>

            {directEmails.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
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

function SidebarItem({ href, icon, label, open, active = false }: any) {
  return (
    <Link
      href={href}
      className={`block px-4 py-3 rounded-lg transition flex items-center gap-3 ${
        active ? 'bg-white/18 text-white' : 'text-blue-50/80 hover:bg-white/12 hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
}

function BookingItem({ item }: { item: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dateStr = new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  return (
    <div 
      className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-200 shadow-xl ring-4 ring-blue-50' : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'}`}
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
             <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white tracking-widest">Listing</span>
             <p className="text-sm font-black text-slate-900 truncate">{item.service_name || 'N/A'}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
              <span className="text-xs font-bold text-slate-700">{item.user_name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
               <span>📅 {dateStr}</span>
               <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
               <span>📍 {item.user_city || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
             <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full tracking-tighter">Received</span>
          </div>
          <div className={`w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="px-6 pb-8 pt-2 border-t border-slate-50">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pt-4">
                  <a href={`mailto:${item.user_email}`} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Email</p>
                     <p className="text-sm font-bold text-blue-600 group-hover:underline truncate">{item.user_email || 'No Email'}</p>
                  </a>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Phone</p>
                     <p className="text-sm font-bold text-slate-800">{item.user_phone || 'No Phone'}</p>
                  </div>
               </div>

               <div className="bg-[#fcfdff] rounded-2xl border border-blue-50/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                     <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" /></svg>
                     <span className="text-[10px] font-black uppercase text-blue-900 tracking-widest">Inquiry Message</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">&quot;{item.message || 'No message provided.'}&quot;</p>
               </div>

               <div className="mt-8 flex justify-end gap-3">
                  <button onClick={() => setIsExpanded(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 px-4 py-2 transition-colors">Close Message</button>
                  <a 
                    href={`mailto:${item.user_email}?subject=Re: Inquiry for ${item.service_name}`} 
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                  >
                    Reply to Client
                  </a>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
