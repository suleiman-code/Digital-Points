'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { servicesAPI } from '@/lib/api';
import Link from 'next/link';

export default function AdminServicesPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState([]);
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
  }, [isAuthenticated]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      setServices(response.data);
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

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
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
          <SidebarItem href="/admin/bookings" icon="📅" label="Bookings" open={sidebarOpen} />
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
          <h1 className="text-xl font-bold">Services Management</h1>
        </div>

        <div className="p-8">
          {/* Add Service Button */}
          <Link
            href="/admin/add-listing"
            className="btn-success mb-8 inline-block px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-green-500/20 transition-all"
          >
            + Add New Service
          </Link>

          {/* Services Table */}
          {loading ? (
            <p>Loading services...</p>
          ) : services.length === 0 ? (
            <p className="text-center text-gray-600">No services found</p>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service: any) => (
                    <tr key={service._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{service.title}</td>
                      <td className="px-6 py-4">{service.category}</td>
                      <td className="px-6 py-4">Rs. {service.price.toLocaleString()}</td>
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
