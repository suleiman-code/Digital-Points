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

  const updateStatus = async (id: string, status: string) => {
    try {
      await bookingsAPI.update(id, { status });
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
                    <tr key={booking._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{booking.serviceName}</td>
                      <td className="px-6 py-4">{booking.userName}</td>
                      <td className="px-6 py-4">{booking.userEmail}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'contacted'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{new Date(booking.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="btn-secondary text-xs py-1"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(booking._id)}
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
                  <div>
                    <p className="text-gray-600 text-sm">Service</p>
                    <p className="font-semibold">{selectedBooking.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Customer</p>
                    <p className="font-semibold">{selectedBooking.userName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Email</p>
                    <p className="font-semibold">{selectedBooking.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Phone</p>
                    <p className="font-semibold">{selectedBooking.userPhone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Message</p>
                    <p className="font-semibold">{selectedBooking.message}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedBooking.status === 'contacted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedBooking.status}
                    </span>
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
