'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { servicesAPI } from '@/lib/api';
import Link from 'next/link';

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
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  const [allServices, setAllServices] = useState<any[]>([]); 
  const [services, setServices] = useState<any[]>([]);       
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      const rawData = response.data || [];
      
      setAllServices(rawData);
      
      if (categoryFilter) {
        setServices(rawData.filter((s: any) => s.category === categoryFilter));
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

  const currentCategory = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('category') || 'all' : 'all';

  if (isLoading || !isAuthenticated) {
    return null;
  }

  // Generate unique categories from FULL list + Core predefined categories
  const CORE_CATEGORIES = ['Plumbing', 'Cleaning', 'Electrician', 'General Repair', 'HVAC', 'Carpentry', 'Painting', 'Other'];
  const uniqueCategories = Array.from(new Set([...CORE_CATEGORIES, ...allServices.map((s: any) => s.category)])).sort();

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      {/* Sidebar - Same as before */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-gray-900 text-white transition-all duration-300 fixed left-0 top-0 h-screen z-40`}
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

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} w-full transition-all duration-300`}>
        <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl text-gray-700">
            ☰
          </button>
          <div className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Management Control</div>
        </div>

        <div className="p-8">
          {/* Filters & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
            <div className="w-full md:w-80">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Filter by Category</label>
              <select 
                value={categoryFilter || "all"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    router.push('/admin/services');
                  } else {
                    router.push(`/admin/services?category=${encodeURIComponent(val)}`);
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
              >
                <option value="all">All Categories - Show Everything</option>
                {uniqueCategories.map((cat: any) => (
                  <option key={String(cat)} value={cat}>
                    {cat} ({allServices.filter(s => s.category === cat).length})
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
                      <td className="px-6 py-4">Rs. {Number(service.price || 0).toLocaleString()}</td>
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
                      <td className="px-6 py-4 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            router.push(`/admin/add-listing?edit=${service._id}`);
                          }}
                          className="btn-secondary text-xs py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="btn-danger text-xs py-1"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
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
