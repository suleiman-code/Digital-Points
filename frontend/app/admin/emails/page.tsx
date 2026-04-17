'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { contactAPI } from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminEmailsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [isAuthenticated, dateFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      const days = parseInt(dateFilter);
      if (!isNaN(days) && days > 0) filters.days = days;

      const res = await contactAPI.getAll(filters);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch contact messages", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading Website Emails...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div className={`w-full transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0`}>
        <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-xl">☰</button>
          <h1 className="text-xl font-bold">Website Emails</h1>
        </div>

        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase">Direct Contact Emails</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Messages from the Website Contact Page</p>
            </div>

            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold shadow-sm">
              <option value="">Any Time</option>
              <option value="1">Last 24 Hours</option>
              <option value="3">Last 3 Days</option>
              <option value="7">Last 7 Days</option>
              <option value="15">Last 15 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          {loading ? (
            <div className="py-20 text-center">Fetching messages...</div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No messages received yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((item) => (
                <EmailRow key={item._id || item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailRow({ item }: { item: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewed, setViewed] = useState(item.viewed === true);
  const dateStr = new Date(item.created_at || item.createdAt || Date.now()).toLocaleString();

  const handleExpand = async () => {
    setIsExpanded(!isExpanded);
    if (!viewed) {
      setViewed(true); // Optimistic immediate removal of blue dot
      try {
        await contactAPI.markViewed(item._id || item.id);
        window.dispatchEvent(new CustomEvent('refresh-admin-counts'));
      } catch (e) {
        console.error("Failed to mark email as viewed", e);
      }
    }
  };

  return (
    <div className={`bg-white rounded-3xl border transition-all ${isExpanded ? 'border-indigo-500 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
      <div onClick={handleExpand} className="p-6 cursor-pointer flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!viewed && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />}
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">{item.subject || 'Website Contact Form'}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{item.name} • {item.email}</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{dateStr}</p>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-50">
             <div className="p-6 bg-slate-50/50">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-indigo-600">User Message Content</p>
                   <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>
                </div>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="bg-white p-4 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black uppercase text-slate-400">Sender Email</p>
                      <p className="text-xs font-bold text-slate-800">{item.email}</p>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black uppercase text-slate-400">Sender Name</p>
                      <p className="text-xs font-bold text-slate-800">{item.name}</p>
                   </div>
                </div>

                <div className="mt-6 flex justify-center">
                   <p className="text-[10px] font-bold text-slate-400 italic">Reply directly to {item.email} via your email client.</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
