'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { bookingsAPI } from '@/lib/api';
import Link from 'next/link';

export default function AdminBookingsPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getAll();
      setBookings(response.data);
    } catch (error) {
      toast.error('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // Backend: PUT /api/bookings/{id}/status?new_status=...
      if (typeof (bookingsAPI as any).updateStatus === 'function') {
        await (bookingsAPI as any).updateStatus(id, newStatus);
      } else {
        await bookingsAPI.update(id, { status: newStatus });
      }
      toast.success('Status updated!');
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      toast.error('Error updating booking');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingsAPI.delete(id);
        toast.success('Booking deleted!');
        fetchBookings();
      } catch (error) {
        toast.error('Error deleting booking');
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
          <SidebarItem href="/admin/services" icon="🛠️" label="Services" open={sidebarOpen} />
          <SidebarItem href="/admin/bookings" icon="📅" label="Bookings" open={sidebarOpen} active />
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
          <h1 className="text-xl font-bold">Bookings Management</h1>
        </div>

        <div className="p-8">
          {/* Bookings Table */}
          {loading ? (
            <p>Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-600 py-12">No bookings found</p>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Customer Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking: any) => (
                    <tr key={booking._id || booking.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{booking.service_name || booking.serviceName || '—'}</td>
                      <td className="px-6 py-4">{booking.user_name || booking.userName || '—'}</td>
                      <td className="px-6 py-4 text-blue-600">
                        <a href={`mailto:${booking.user_email || booking.userEmail}`}>{booking.user_email || booking.userEmail || '—'}</a>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'contacted'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {booking.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{new Date(booking.created_at || booking.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="btn-secondary text-xs py-1"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(booking._id || booking.id)}
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

          {/* Booking Details Modal */}
          {selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Booking Details</h2>

                <div className="space-y-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Service</p>
                    <p className="font-semibold text-gray-800 mt-1">{selectedBooking.service_name || selectedBooking.serviceName}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Customer</p>
                    <p className="font-semibold text-gray-800 mt-1">{selectedBooking.user_name || selectedBooking.userName}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Email</p>
                    <a href={`mailto:${selectedBooking.user_email || selectedBooking.userEmail}`} className="font-semibold text-blue-600 mt-1 block hover:underline">{selectedBooking.user_email || selectedBooking.userEmail}</a>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Phone</p>
                    <a href={`tel:${selectedBooking.user_phone || selectedBooking.userPhone}`} className="font-semibold text-green-600 mt-1 block hover:underline">{selectedBooking.user_phone || selectedBooking.userPhone}</a>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Message</p>
                    <p className="font-medium text-gray-700 mt-1 leading-relaxed">{selectedBooking.message}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Current Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedBooking.status === 'contacted' ? 'bg-green-100 text-green-800' :
                        selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{selectedBooking.status || 'pending'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Received On</p>
                    <p className="font-medium text-gray-700 mt-1">{new Date(selectedBooking.created_at || selectedBooking.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => updateStatus(selectedBooking._id, 'contacted')}
                    className="btn-primary w-full"
                  >
                    Mark as Contacted
                  </button>
                  <button
                    onClick={() => updateStatus(selectedBooking._id, 'completed')}
                    className="btn-secondary w-full"
                  >
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="btn-outline w-full"
                  >
                    Close
                  </button>
                </div>
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
