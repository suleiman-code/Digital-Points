'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { inquiriesAPI } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminBookingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInquiries();
    }
  }, [isAuthenticated, dateFilter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      const days = parseInt(dateFilter);
      if (!isNaN(days) && days > 0) filters.days = days;

      const res = await inquiriesAPI.getAll(filters);
      setInquiries(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch inquiries", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading Service Inquiries...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div className={`w-full transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0`}>
        <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-xl">☰</button>
          <h1 className="text-xl font-bold">Service Inquiries</h1>
        </div>

        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase">Listing Specific Inquiries</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inquiries sent directly to Business Owners</p>
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
            <div className="py-20 text-center text-slate-400 font-bold">FECHING RECORDS...</div>
          ) : inquiries.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No listing inquiries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((item) => (
                <InquiryRow key={item._id || item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InquiryRow({ item }: { item: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewed, setViewed] = useState(item.viewed === true);
  const dateStr = new Date(item.created_at || item.createdAt || Date.now()).toLocaleString();

  const handleExpand = async () => {
    setIsExpanded(!isExpanded);
    if (!viewed) {
      try {
        await inquiriesAPI.markViewed(item._id || item.id);
        setViewed(true); // Permanent locally after backend success
        window.dispatchEvent(new CustomEvent('refresh-admin-counts'));
      } catch (e) {
        console.error("Failed to mark inquiry as viewed", e);
      }
    }
  };

  return (
    <div className={`bg-white rounded-3xl border transition-all ${isExpanded ? 'border-blue-500 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
      <div onClick={handleExpand} className="p-6 cursor-pointer flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {!viewed && <div className="w-2.5 h-2.5 flex-shrink-0 bg-blue-600 rounded-full animate-pulse" />}
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm truncate">Target: {item.service_name}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate">Inquiry from {item.user_name || item.name}</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
           <p className="text-[10px] text-slate-400 font-bold">{dateStr}</p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-50">
             <div className="p-6 bg-slate-50/50 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-blue-600">Client Message</p>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white p-4 rounded-xl border border-slate-100">
                         <p className="text-[9px] font-black uppercase text-slate-400">Client Detail</p>
                         <p className="text-xs font-bold text-slate-800">{item.user_name || item.name}</p>
                         <p className="text-xs text-slate-500 mt-1">{item.user_email || item.email}</p>
                         <p className="text-xs text-slate-500">{item.user_phone || item.phone}</p>
                      </div>
                      
                      {item.service_id && (
                         <Link href={`/services/${item.service_id}`} target="_blank" className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between group hover:bg-slate-800 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest">Go to Listing</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                         </Link>
                      )}
                   </div>
                </div>

                <div className="flex justify-center border-t border-slate-100 pt-6">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inquiry details saved to database. Respond via business owner contact.</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
