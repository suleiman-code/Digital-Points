'use client';

import React, { useState, useEffect } from 'react';
import { authAPI, resolveMediaUrl, servicesAPI } from '@/lib/api';
import { BUSINESS_CATEGORIES, normalizeCategory } from '@/lib/businessCategories';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ServicePreviewModal from '@/components/ServicePreviewModal';
import RichTextEditor, { stripRichText } from '@/components/RichTextEditor';

const COUNTRY_OPTIONS = ['USA', 'Canada'] as const;

const normalizeCountry = (country: string) => {
  const value = String(country || '').trim().toLowerCase();
  if (['usa', 'us', 'united states', 'united states of america', 'u.s.a.'].includes(value)) return 'USA';
  if (['canada', 'ca'].includes(value)) return 'Canada';
  return 'USA';
};

const formatPhoneForCountryInput = (phone: string, country: string) => {
  const digits = String(phone || '').replace(/\D/g, '');
  const normalizedCountry = normalizeCountry(country);

  if (normalizedCountry === 'USA' || normalizedCountry === 'Canada') {
    if (digits.length === 10) return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    if (digits.length === 11 && digits.startsWith('1')) {
      const core = digits.slice(1);
      return `+1 ${core.slice(0, 3)} ${core.slice(3, 6)} ${core.slice(6)}`;
    }
  }

  return phone;
};

const isValidPhoneForCountry = (phone: string, country: string) => {
  const digits = String(phone || '').replace(/\D/g, '');
  const normalizedCountry = normalizeCountry(country);

  if (normalizedCountry === 'USA' || normalizedCountry === 'Canada') {
    return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
  }

  return digits.length >= 7 && digits.length <= 15;
};

export default function AddListing() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: BUSINESS_CATEGORIES[0] || 'Plumbing Services',
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
    country: 'USA',
    postal_code: '',
  });

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  // Multiple Gallery Photos
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Service Details (One per line strings)
  const [serviceDetailsInput, setServiceDetailsInput] = useState('');

  const [hours, setHours] = useState({
    Monday: '9am to 6pm',
    Tuesday: '9am to 6pm',
    Wednesday: '9am to 6pm',
    Thursday: '9am to 6pm',
    Friday: '9am to 6pm',
    Saturday: '10am to 4pm',
    Sunday: 'Closed',
  });

  const previewListing = {
    ...formData,
    _id: editingId,
    image_url: mainImagePreview || formData.image_url,
    gallery: galleryPreviews,
    business_hours: hours,
    service_details: serviceDetailsInput,
    price: formData.price,
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEditingId(params.get('edit'));

    const checkAdmin = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Admin access required.');
        router.push('/admin/login');
        return;
      }

      try {
        await authAPI.me();
        setIsAdmin(true);
      } catch {
        localStorage.removeItem('authToken');
        toast.error('Session expired. Please login again.');
        router.push('/admin/login');
      }
    };

    checkAdmin();
  }, [router]);

  useEffect(() => {
    const loadServiceForEdit = async () => {
      if (!editingId || !isAdmin) return;

      try {
        setIsEditLoading(true);
        const res = await servicesAPI.getById(editingId);
        const svc = res.data;

        setFormData({
          title: svc.title || '',
          category: normalizeCategory(svc.category || 'Plumbing'),
          price: String(svc.price ?? ''),
          city: svc.city || '',
          state: svc.state || '',
          description: svc.description || '',
          image_url: resolveMediaUrl(svc.image_url || svc.image || ''),
          address: svc.address || '',
          contact_phone: svc.contact_phone || '',
          contact_email: svc.contact_email || '',
          website_url: svc.website_url || '',
          google_maps_url: svc.google_maps_url || '',
          country: normalizeCountry(svc.country || 'USA'),
          postal_code: svc.postal_code || '',
        });

        setMainImagePreview(resolveMediaUrl(svc.image_url || svc.image || '') || null);
        setGalleryPreviews(
          Array.isArray(svc.gallery)
            ? svc.gallery.map((img: any) => resolveMediaUrl(String(img || ''))).filter(Boolean)
            : []
        );
        setServiceDetailsInput(svc.service_details || '');

        if (svc.business_hours && typeof svc.business_hours === 'object') {
          setHours(prev => ({ ...prev, ...svc.business_hours }));
        }
      } catch {
        toast.error('Failed to load service for editing.');
        router.push('/admin/services');
      } finally {
        setIsEditLoading(false);
      }
    };

    loadServiceForEdit();
  }, [editingId, isAdmin, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'country') {
      const normalizedCountry = normalizeCountry(value);
      setFormData(prev => ({
        ...prev,
        country: normalizedCountry,
        contact_phone: prev.contact_phone ? formatPhoneForCountryInput(prev.contact_phone, normalizedCountry) : prev.contact_phone,
      }));
      return;
    }

    if (name === 'contact_phone') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setMainImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + galleryFiles.length > 8) {
      toast.error("Max 8 gallery photos allowed.");
      return;
    }
    setGalleryFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setGalleryPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleHourChange = (day: string, value: string) => {
    setHours(prev => ({ ...prev, [day]: value }));
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const getApiErrorMessage = (error: any) => {
    const detail = error?.response?.data?.detail;
    const fallback = error?.response?.data?.message || error?.message || 'Failed to list service';

    if (typeof detail === 'string' && detail.trim()) return detail;

    if (Array.isArray(detail)) {
      const parsed = detail
        .map((item) => item?.msg || item?.message)
        .filter(Boolean)
        .join(', ');
      if (parsed) return parsed;
    }

    if (detail && typeof detail === 'object') {
      if (typeof detail.message === 'string' && detail.message.trim()) return detail.message;
      try {
        return JSON.stringify(detail);
      } catch {
        return fallback;
      }
    }

    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload Main Image if exists
      let finalImageUrl = formData.image_url;
      if (mainImage) {
        const res = await servicesAPI.uploadImage(mainImage);
        finalImageUrl = res.url;
      }

      // 2. Upload Gallery Images
      const uploadedGalleryUrls = [];
      for (const file of galleryFiles) {
        const res = await servicesAPI.uploadImage(file);
        uploadedGalleryUrls.push(res.url);
      }

      const normalizedCountry = normalizeCountry(formData.country);
      if (!isValidPhoneForCountry(formData.contact_phone, normalizedCountry)) {
        toast.error(`Please enter a valid ${normalizedCountry} contact number.`);
        setLoading(false);
        return;
      }

      const plainDescription = stripRichText(formData.description);
      if (plainDescription.length < 10) {
        toast.error('Description must be at least 10 characters long.');
        setLoading(false);
        return;
      }

      const { price: _price, address: _address, contact_email: _contactEmail, website_url: _websiteUrl, google_maps_url: _googleMapsUrl, ...requiredFields } = formData;
      const parsedPrice = parseFloat(formData.price);
      const existingGalleryUrls = galleryPreviews
        .map((url) => resolveMediaUrl(String(url || '')))
        .filter((url) => url.startsWith('http'));
      const mergedGalleryUrls = Array.from(new Set([...existingGalleryUrls, ...uploadedGalleryUrls]));
      if (!String(finalImageUrl || '').trim() && mergedGalleryUrls.length > 0) {
        finalImageUrl = mergedGalleryUrls[0];
      }
      const payload = {
        ...requiredFields,
        country: normalizedCountry,
        category: normalizeCategory(formData.category),
        image_url: finalImageUrl,
        gallery: mergedGalleryUrls,
        business_hours: hours,
        ...(serviceDetailsInput.trim() ? { service_details: serviceDetailsInput.trim() } : {}),
        ...(formData.contact_phone.trim() ? { contact_phone: formData.contact_phone.trim() } : {}),
        ...(Number.isFinite(parsedPrice) ? { price: parsedPrice } : {}),
        ...(formData.address.trim() ? { address: formData.address.trim() } : {}),
        ...(formData.postal_code.trim() ? { postal_code: formData.postal_code.trim() } : {}),
        ...(formData.contact_email.trim() ? { contact_email: formData.contact_email.trim() } : {}),
        ...(formData.website_url.trim() ? { website_url: formData.website_url.trim() } : {}),
        ...(formData.google_maps_url.trim() ? { google_maps_url: formData.google_maps_url.trim() } : {})
      };

      if (editingId) {
        await servicesAPI.update(editingId, payload);
        toast.success('Service Updated Successfully!');
      } else {
        await servicesAPI.create(payload);
        toast.success('Service Listed Successfully!');
      }
      router.push('/admin/services');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (isEditLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-600 font-semibold">Loading listing form...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm max-w-md w-full">
          <p className="text-slate-700 font-semibold">Admin access required for this page.</p>
          <Link href="/admin/login" className="inline-block mt-4 btn-primary">Go to Admin Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,_#f4f9ff_0%,_#edf5ff_100%)]">
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
          <SidebarItem href="/admin/services" icon="🛠️" label="Services" open={sidebarOpen} active />
          <SidebarItem href="/admin/feedback" icon="💬" label="Feedback" open={sidebarOpen} />
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              localStorage.removeItem('authToken');
              toast.success('Logged out');
              router.push('/admin/login');
            }}
            className="w-full btn-danger text-sm py-2"
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

      <div className={`w-full transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0`}>
        <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="text-2xl text-gray-700 md:hidden" aria-label="Open menu">☰</button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl text-gray-700 hidden md:block" aria-label="Toggle sidebar">☰</button>
          </div>
          <div className="flex items-center gap-3">
            {editingId && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="h-9 px-3 rounded-full border border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z"/></svg>
                Preview
              </button>
            )}
            <h1 className="text-xl font-bold">{editingId ? 'Edit Business' : 'Add New Business'}</h1>
          </div>
        </div>

        <main className="p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-[#0f2340] to-indigo-900 p-6 md:p-8 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">{editingId ? 'Edit Business' : 'Add New Business'}</h1>
            <p className="text-blue-200 mt-2">{editingId ? 'Update all business details from one complete form.' : 'Fill in the professional details to list a new business.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-12 space-y-10">
            
            {/* --- BASIC INFO --- */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</span>
                <h2 className="text-xl font-bold text-slate-800">Basic Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* --- MAIN BUSINESS IMAGE --- */}
                <div className="md:col-span-2 bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50">
                  <label className="block text-sm font-black text-blue-900 mb-4 uppercase tracking-widest">Business Main Image (Card Image) *</label>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-64 aspect-video rounded-xl bg-white border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:bg-blue-50 transition-all relative group" onClick={() => document.getElementById('mainImageInput')?.click()}>
                      {mainImagePreview ? (
                        <img src={mainImagePreview} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <svg className="w-10 h-10 text-blue-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <span className="text-[10px] font-bold text-blue-400 mt-1 block">Click to Upload</span>
                        </div>
                      )}
                      <input id="mainImageInput" type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
                      <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-blue-600 px-3 py-1 rounded-full">Change Image</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <p className="text-xs text-slate-500 font-medium mb-3 italic">This image will be shown on the main search results and the cover of the service page.</p>
                      <input 
                        name="image_url" 
                        value={formData.image_url} 
                        onChange={handleChange} 
                        placeholder="Or paste external image URL here..." 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                  <input name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Master Plumber Services" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none">
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Starting Price ($) (Optional)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Service Description *</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(next) => setFormData(prev => ({ ...prev, description: next }))}
                    placeholder="Briefly describe the service..."
                  />
                </div>
              </div>
            </section>

            {/* --- LOCATION & CONTACT --- */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</span>
                <h2 className="text-xl font-bold text-slate-800">Location & Contact</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Business Address (Optional)</label>
                  <input name="address" value={formData.address} onChange={handleChange} placeholder="Street address, Suite, etc." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Country *</label>
                  <select name="country" value={formData.country} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none">
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">City *</label>
                  <input name="city" value={formData.city} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">State *</label>
                  <input name="state" value={formData.state} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Postal Code</label>
                  <input name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="e.g. 19106" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Number *</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    onBlur={(e) => setFormData(prev => ({ ...prev, contact_phone: formatPhoneForCountryInput(e.target.value, prev.country) }))}
                    required
                    minLength={7}
                    placeholder={formData.country === 'Canada' ? '+1 416 555 1234' : '+1 310 555 1234'}
                    className="w-full bg-white border-2 border-blue-100 rounded-xl p-4 shadow-sm"
                  />
                  <p className="text-[11px] mt-1 text-slate-500 font-semibold">{formData.country}: 10 digits (or 11 digits starting with 1)</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Business Owner Email (Required for Inquiries) *</label>
                  <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} required placeholder="owner@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Google Maps URL (Optional)</label>
                  <input name="google_maps_url" value={formData.google_maps_url} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>
              </div>
            </section>

            {/* --- MEDIA & GALLERY --- */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</span>
                <h2 className="text-xl font-bold text-slate-800">Service Media (Gallery)</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-4 text-center">Upload Work Gallery (Max 8 Photos)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {galleryPreviews.map((preview, i) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                          <img src={preview} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeGalleryPhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs">&times;</button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {galleryPreviews.length < 8 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Add Photo</span>
                        <input type="file" multiple accept="image/*" onChange={handleGalleryChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </section>
            
            {/* --- BUSINESS HOURS --- */}
            <section className="space-y-6">
              <div className="items-center gap-3 border-b border-slate-100 pb-4 hidden md:flex">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">4</span>
                <h2 className="text-xl font-bold text-slate-800">Business Hours</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(hours).map(([day, time]) => (
                  <div key={day} className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{day}</label>
                    <input 
                      value={time} 
                      onChange={(e) => handleHourChange(day, e.target.value)}
                      placeholder="e.g. 9am - 6pm or Closed"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </section>

             {/* --- SERVICE DETAILS --- */}
             <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">5</span>
                <h2 className="text-xl font-bold text-slate-800">Additional Service Details</h2>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rich Service Highlights</label>
                <RichTextEditor 
                  value={serviceDetailsInput} 
                  onChange={(next) => setServiceDetailsInput(next)} 
                  placeholder="e.g. 24/7 Emergency Support, Licensed & Insured Professionals..."
                />
              </div>
            </section>

            <div className="pt-10 flex flex-col md:flex-row justify-end gap-4">
              <button 
                type="button"
                onClick={() => router.push('/admin/services')}
                className="w-full md:w-auto px-10 py-5 bg-white border-2 border-slate-200 text-slate-400 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                Cancel / Go Back
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving Service...' : editingId ? 'Update Service Listing' : 'Publish Service Listing'}
              </button>
            </div>

          </form>
          </div>
        </main>
      </div>
      <ServicePreviewModal
        open={previewOpen}
        serviceId={editingId}
        serviceName={formData.title || 'Service Preview'}
        listing={previewListing}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

function SidebarItem({ href, icon, label, open, active = false }: any) {
  return (
    <Link
      href={href}
      className={`block px-4 py-3 rounded-lg transition flex items-center gap-3 ${active ? 'bg-white/18 text-white' : 'text-blue-50/80 hover:bg-white/12 hover:text-white'
        }`}
    >
      <span className="text-xl">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
}
