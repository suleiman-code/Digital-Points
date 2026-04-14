'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { contactAPI } from '@/lib/api';
import Link from 'next/link';

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
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Inquiries</h2>
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-semibold">
                {directEmails.length} records
              </span>
            </div>

            {directEmails.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 text-center text-slate-600">
                No service inquiries found
              </div>
            ) : (
              <div className="space-y-3">
                {directEmails.map((item: any) => (
                  <div key={item._id || item.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 break-words">
                          <span className="text-blue-600 font-black">Listing:</span> {item.service_name || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Client: <span className="font-bold text-slate-700">{item.user_name || 'Unknown'}</span></p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <a href={`mailto:${item.user_email || ''}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            📧 {item.user_email || 'No Email'}
                          </a>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            📞 {item.user_phone || 'No Phone'}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-widest bg-slate-100 px-1.5 rounded">
                            📍 {item.user_city || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400">Received On</p>
                        <p className="text-xs text-slate-600 font-bold whitespace-nowrap">
                           {new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                          item.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          item.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {item.status || 'pending'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 border-l-4 border-l-blue-500">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message Content</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words italic">&quot;{item.message || 'No message'}&quot;</p>
                    </div>
                  </div>
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
