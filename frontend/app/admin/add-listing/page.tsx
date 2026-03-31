'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { servicesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddListing() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plumbing',
    price: '',
    city: '',
    state: '',
    description: '',
    image_url: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    website_url: '',
    google_maps_url: '',
  });

  // Sub-services: admin defines the inner page names
  const [subServices, setSubServices] = useState<string[]>([]);
  const [subServiceInput, setSubServiceInput] = useState('');

  const [hours, setHours] = useState({
    Monday: '9am to 6pm',
    Tuesday: '9am to 6pm',
    Wednesday: '9am to 6pm',
    Thursday: '9am to 6pm',
    Friday: '9am to 6pm',
    Saturday: 'Closed',
    Sunday: 'Closed',
  });

  useEffect(() => {
    // Basic protection
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert("Admin access required.");
      router.push('/login');
    } else {
      setIsAdmin(true);
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHourChange = (day: string, value: string) => {
    setHours(prev => ({ ...prev, [day]: value }));
  };

  const addSubService = () => {
    const trimmed = subServiceInput.trim();
    if (trimmed && !subServices.includes(trimmed)) {
      setSubServices(prev => [...prev, trimmed]);
    }
    setSubServiceInput('');
  };

  const removeSubService = (name: string) => {
    setSubServices(prev => prev.filter(s => s !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        city: formData.city,
        state: formData.state,
        description: formData.description,
        business_hours: hours,
      };

      // Only add optional fields if they have value
      if (formData.image_url) payload.image_url = formData.image_url;
      if (formData.address) payload.address = formData.address;
      if (formData.contact_phone) payload.contact_phone = formData.contact_phone;
      if (formData.contact_email) payload.contact_email = formData.contact_email;
      if (formData.website_url) payload.website_url = formData.website_url;
      if (formData.google_maps_url) payload.google_maps_url = formData.google_maps_url;
      
      if (subServices.length > 0) {
        payload.sub_services = subServices;
      }

      await servicesAPI.create(payload);
      toast.success('Business Listing created successfully!');
      router.push('/services');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to create listing: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container-max py-12">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-[#1a2b4c] mb-8">Add New Business Listing</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Core Details */}
            <div>
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">Core Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name / Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3">
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Salon">Salon</option>
                    <option value="Tutoring">Tutoring</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price ($) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} required min="1" className="w-full border border-gray-300 rounded-lg p-3" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input type="url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://..." className="w-full border border-gray-300 rounded-lg p-3" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full border border-gray-300 rounded-lg p-3"></textarea>
                </div>
              </div>
            </div>

            {/* Location & Contact */}
            <div>
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">Location & Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Street Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State / Province *</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="(555) 123-4567" className="w-full border border-gray-300 rounded-lg p-3" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input type="url" name="website_url" value={formData.website_url} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-3" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Embed URL (src link)</label>
                  <input type="url" name="google_maps_url" value={formData.google_maps_url} onChange={handleChange} placeholder="https://www.google.com/maps/embed?pb=..." className="w-full border border-gray-300 rounded-lg p-3" />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div>
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">Business Hours</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(hours).map((day) => (
                  <div key={day}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{day}</label>
                    <input 
                      type="text" 
                      value={hours[day as keyof typeof hours]} 
                      onChange={(e) => handleHourChange(day, e.target.value)} 
                      placeholder="e.g. 9am - 5pm or Closed"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-Services / Inner Pages */}
            <div>
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">Inner Service Pages <span className="text-sm font-normal text-gray-400">(optional – leave blank to auto-generate from category)</span></h2>
              <p className="text-sm text-gray-500 mb-3">Add the names of specific service pages for this business (e.g. "Deep Home Cleaning", "Emergency 24/7"). These will appear as clickable links on the business profile.</p>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={subServiceInput}
                  onChange={e => setSubServiceInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubService(); } }}
                  placeholder="e.g. Deep Home Cleaning"
                  className="flex-1 border border-gray-300 rounded-lg p-3 text-sm"
                />
                <button type="button" onClick={addSubService} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                  + Add
                </button>
              </div>

              {subServices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {subServices.map((s, i) => (
                    <span key={i} className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                      {s}
                      <button type="button" onClick={() => removeSubService(s)} className="text-blue-400 hover:text-red-500 font-bold leading-none">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Listing...' : 'Submit Business Listing'}
              </button>
            </div>

          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
