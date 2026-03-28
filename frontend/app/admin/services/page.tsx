'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { servicesAPI } from '@/lib/api';
import Link from 'next/link';

export default function AdminServicesPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { register, handleSubmit, reset, watch } = useForm();

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

  const onSubmit = async (data: any) => {
    try {
      if (editingId) {
        await servicesAPI.update(editingId, data);
        toast.success('Service updated successfully!');
      } else {
        await servicesAPI.create(data);
        toast.success('Service created successfully!');
      }
      reset();
      setShowForm(false);
      setEditingId(null);
      fetchServices();
    } catch (error) {
      toast.error('Error saving service');
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
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
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
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              reset();
            }}
            className="btn-primary mb-8"
          >
            + Add New Service
          </button>

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
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => {
                            setEditingId(service._id);
                            setShowForm(true);
                            // Load form with data
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

          {/* Service Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-96 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">
                  {editingId ? 'Edit Service' : 'Add New Service'}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input
                    placeholder="Service Title"
                    {...register('title', { required: true })}
                  />
                  <textarea
                    placeholder="Description"
                    {...register('description')}
                    rows={3}
                  />
                  <input placeholder="Category" {...register('category')} />
                  <input
                    placeholder="Price"
                    type="number"
                    {...register('price', { required: true })}
                  />
                  <input placeholder="Image URL" {...register('image')} />
                  <textarea
                    placeholder="Service Details (one per line)"
                    {...register('serviceDetails')}
                    rows={3}
                  />

                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">
                      Save Service
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        reset();
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
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
      className={`block px-4 py-3 rounded-lg transition flex items-center gap-3 ${
        active ? 'bg-gray-800' : 'hover:bg-gray-800'
      }`}
    >
      <span className="text-xl">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
}
