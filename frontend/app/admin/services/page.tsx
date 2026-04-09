'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { formatUsd, servicesAPI } from '@/lib/api';
import { BUSINESS_CATEGORIES, normalizeCategory } from '@/lib/businessCategories';
import Link from 'next/link';
import ServicePreviewModal from '@/components/ServicePreviewModal';

export default function AdminServicesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminServicesContent />
    </Suspense>
  );
}

function AdminServicesContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  
  // Use state for categoryFilter to ensure it's reactive when changed via the dropdown
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  const [allServices, setAllServices] = useState<any[]>([]); 
  const [services, setServices] = useState<any[]>([]);       
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewService, setPreviewService] = useState<any | null>(null);

  // Initialize filter from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
       const params = new URLSearchParams(window.location.search);
       setCategoryFilter(normalizeCategory(params.get('category') || ''));
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchServices();
    }
  }, [isAuthenticated, categoryFilter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      const rawData = (response.data || []).map((s: any) => ({
        ...s,
        category: normalizeCategory(s.category || ''),
      }));
      
      setAllServices(rawData);
      
      if (categoryFilter) {
        const normalizedFilter = normalizeCategory(categoryFilter);
        setServices(rawData.filter((s: any) => normalizeCategory(s.category) === normalizedFilter));
      } else {
        setServices(rawData);
      }
    } catch (error) {
      toast.error('Error fetching services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await servicesAPI.delete(id);
        toast.success('Service deleted successfully!');
        fetchServices();
      } catch (error) {
        toast.error('Error deleting service');
      }
    }
  };

  const toggleFeatured = async (service: any) => {
    try {
      await servicesAPI.update(service._id, { featured: !service.featured });
      toast.success(service.featured ? 'Listing removed from top.' : 'Listing pinned to top.');
      fetchServices();
    } catch (error) {
      toast.error('Error updating featured status');
    }
  };

  const currentCategory = categoryFilter || 'all';

  if (isLoading || !isAuthenticated) {
    return null;
  }

  // Keep master category order, then append any legacy categories already present in data.
  const dynamicCategories = Array.from(
    new Set(
      allServices
        .map((s: any) => String(s.category || '').trim())
        .filter((c: string) => c && !BUSINESS_CATEGORIES.includes(c))
    )
  ).sort((a, b) => a.localeCompare(b));
  const uniqueCategories = [...BUSINESS_CATEGORIES, ...dynamicCategories];

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      {/* Sidebar - Same as before */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 fixed left-0 top-0 h-screen z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-4 border-b border-gray-700">
          <Link href="/admin/dashboard" className="text-2xl font-bold truncate">
            {sidebarOpen ? 'SH Admin' : 'SA'}
          </Link>
        </div>

        <nav className="mt-8 space-y-2 p-4">
          <SidebarItem href="/admin/dashboard" icon="📊" label="Dashboard" open={sidebarOpen} />
          <SidebarItem href="/admin/services" icon="🛠️" label="Services" open={sidebarOpen} active />
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button onClick={logout} className="w-full btn-danger text-sm py-2">
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
          <div className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Management Control</div>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {/* Filters & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
            <div className="w-full md:w-80">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Filter by Category</label>
              <select 
                value={categoryFilter || "all"}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategoryFilter(val === 'all' ? null : normalizeCategory(val));
                  if (val === 'all') {
                    router.push('/admin/services');
                  } else {
                    router.push(`/admin/services?category=${encodeURIComponent(normalizeCategory(val))}`);
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
              >
                <option value="all">All Categories - Show Everything</option>
                {uniqueCategories.map((cat: any) => (
                  <option key={String(cat)} value={cat}>
                    {cat} ({allServices.filter(s => normalizeCategory(s.category) === normalizeCategory(cat)).length})
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/admin/add-listing"
              className="px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all text-center"
            >
              + Create New Listing
            </Link>
          </div>

          {/* Table or Empty State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
               <h3 className="text-xl font-bold text-slate-400">No Services Found</h3>
               <p className="text-slate-400 text-xs mt-1">Please select another category or add a new listing.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Top</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Updated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service: any) => (
                    <tr key={service._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{service.title}</td>
                      <td className="px-6 py-4">{service.category}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${service.featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {service.featured ? 'Pinned' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatUsd(service.price || 0)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        {new Date(service.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs text-blue-500 font-bold italic">
                        {new Date(service.updated_at || service.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setPreviewService(service)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          title="Preview"
                          aria-label="Preview"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button
                          onClick={() => toggleFeatured(service)}
                          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border ${service.featured ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-200 bg-blue-50 text-blue-700'} hover:opacity-90`}
                          title={service.featured ? 'Unpin' : 'Pin Top'}
                          aria-label={service.featured ? 'Unpin' : 'Pin Top'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7 7 7M12 3v18"/></svg>
                        </button>
                        <button
                          onClick={() => {
                            router.push(`/admin/add-listing?edit=${service._id}`);
                          }}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"/></svg>
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
      <ServicePreviewModal
        open={Boolean(previewService)}
        serviceId={previewService?._id || null}
        serviceName={previewService?.title}
        listing={previewService}
        onClose={() => setPreviewService(null)}
      />
    </div>
  );
}

function SidebarItem({ href, icon, label, open, active = false }: any) {
  return (
    <Link
      href={href}
      className={`block px-4 py-3 rounded-lg transition flex items-center gap-3 ${active ? 'bg-gray-800' : 'hover:bg-gray-800'
        }`}
    >
      <span className="text-xl">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
}
