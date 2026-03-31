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
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

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
      // Build a clean payload — only include optional fields if they have a value
      const payload: any = {
        title: data.title,
        description: data.description || '',
        category: data.category || 'Other',
        price: parseFloat(data.price) || 0,
        city: data.city || '',
        state: data.state || '',
      };
      // Handle Image Upload if file selected
      let finalImageUrl = data.image_url;
      if (imageFile) {
        try {
          const uploadRes = await servicesAPI.uploadImage(imageFile);
          finalImageUrl = uploadRes.url;
        } catch (err) {
          toast.error("Failed to upload image. Using URL if provided.");
        }
      }

      if (finalImageUrl) payload.image_url = finalImageUrl;

      // Handle Gallery Uploads
      let finalGallery = data.gallery || [];
      if (galleryFiles.length > 0) {
        try {
          const galleryUploads = await Promise.all(
            galleryFiles.map(file => servicesAPI.uploadImage(file))
          );
          const uploadedUrls = galleryUploads.map(res => res.url);
          finalGallery = [...finalGallery, ...uploadedUrls];
        } catch (err) {
          toast.error("Failed to upload some gallery images.");
        }
      }
      payload.gallery = finalGallery;

      if (data.service_details) payload.service_details = data.service_details;

      if (editingId) {
        await servicesAPI.update(editingId, payload);
        toast.success('Service updated successfully!');
      } else {
        await servicesAPI.create(payload);
        toast.success('Service created successfully!');
      }
      reset();
      setShowForm(false);
      setImageFile(null);
      setImagePreview(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
      fetchServices();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
        : detail || error.message || 'Error saving service';
      toast.error(msg);
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
                      <td className="px-6 py-4 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingId(service._id);
                            setShowForm(true);
                            reset(service);
                            if (service.image_url) {
                              setImagePreview(service.image_url);
                            }
                            if (service.gallery) {
                              setGalleryPreviews(service.gallery);
                            }
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
              <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-2xl font-bold mb-4">
                  {editingId ? 'Edit Service' : 'Add New Service'}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input placeholder="Service Title" {...register('title', { required: true })} className="w-full border rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea placeholder="Description" {...register('description')} rows={3} className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <input placeholder="e.g. Plumbing" {...register('category', { required: true })} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                      <input placeholder="Price" type="number" min="1" {...register('price', { required: true })} className="w-full border rounded-lg p-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input placeholder="City" {...register('city', { required: true })} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input placeholder="State" {...register('state', { required: true })} className="w-full border rounded-lg p-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Image</label>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-400">Upload Local File</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => setImagePreview(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-400">Or Paste URL</label>
                        <input placeholder="https://..." {...register('image_url')} className="w-full border rounded-lg p-2 text-sm" />
                      </div>
                    </div>
                    {imagePreview && (
                      <div className="mt-2 w-full h-32 rounded-lg bg-gray-100 overflow-hidden relative">
                        <img src={imagePreview} className="w-full h-full object-cover" />
                        <button
                          onClick={() => { setImageFile(null); setImagePreview(null); setValue('image_url', ''); }}
                          className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gallery Support */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Service Gallery (Showcase 5-6 Photos)</label>
                    <p className="text-xs text-gray-500 mb-4">Add multiple photos of your work, shop, or products.</p>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                      {galleryPreviews.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={url} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const newPreviews = [...galleryPreviews];
                              newPreviews.splice(i, 1);
                              setGalleryPreviews(newPreviews);
                              // If it's a file being uploaded, remove from files too
                              // For simplicity, we just filter the display here
                              // and handle the final payload in onSubmit
                            }}
                            className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          >
                            &times;
                          </button>
                        </div>
                      ))}

                      {galleryPreviews.length < 8 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                          <span className="text-2xl text-gray-400">+</span>
                          <span className="text-[10px] text-gray-400">Add Photo</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                setGalleryFiles(prev => [...prev, ...files]);
                                files.forEach(file => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setGalleryPreviews(prev => [...prev, reader.result as string]);
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Details</label>
                    <textarea placeholder="Service Details (one per line)" {...register('service_details')} rows={3} className="w-full border rounded-lg p-2" />
                  </div>

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
      className={`block px-4 py-3 rounded-lg transition flex items-center gap-3 ${active ? 'bg-gray-800' : 'hover:bg-gray-800'
        }`}
    >
      <span className="text-xl">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
}
