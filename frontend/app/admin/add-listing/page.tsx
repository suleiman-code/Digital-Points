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
import AdminSidebar from '@/components/AdminSidebar';

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
  
  // Image Editor Modal State
  const [imageEditor, setImageEditor] = useState<{
    open: boolean;
    type: 'main' | 'cover' | null;
    src: string | null;
    x: number;
    y: number;
    zoom: number;
    dragging: boolean;
    startX: number;
    startY: number;
    startOffX: number;
    startOffY: number;
  }>({
    open: false,
    type: null,
    src: null,
    x: 0,
    y: 0,
    zoom: 100,
    dragging: false,
    startX: 0,
    startY: 0,
    startOffX: 0,
    startOffY: 0,
  });

  const openImageEditor = (type: 'main' | 'cover', src: string) => {
    const currentZoom = type === 'main' ? formData.image_zoom : formData.cover_zoom;
    let currentPos = type === 'main' ? formData.image_position : formData.cover_position;
    
    if (currentPos === 'center') currentPos = '50% 50%';
    
    const parts = String(currentPos || '50% 50%').split(' ');
    const px = parseFloat(parts[0]);
    const py = parseFloat(parts[1] || parts[0]);
    
    const savedX = isNaN(px) ? 50 : px;
    const savedY = isNaN(py) ? 50 : py;
    const offsetX = savedX - 50;
    const offsetY = savedY - 50;

    setImageEditor({
      open: true,
      type,
      src,
      x: offsetX,
      y: offsetY,
      zoom: currentZoom || 100,
      dragging: false,
      startX: 0,
      startY: 0,
      startOffX: offsetX,
      startOffY: offsetY,
    });
  };

  const applyImageEditor = () => {
    if (!imageEditor.type) return;
    const finalPosX = (50 + imageEditor.x).toFixed(1);
    const finalPosY = (50 + imageEditor.y).toFixed(1);
    if (imageEditor.type === 'main') {
      setFormData(prev => ({
        ...prev,
        image_zoom: imageEditor.zoom,
        image_position: `${finalPosX}% ${finalPosY}%`,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cover_zoom: imageEditor.zoom,
        cover_position: `${finalPosX}% ${finalPosY}%`,
      }));
    }
    setImageEditor(prev => ({ ...prev, open: false }));
  };

  const editorDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setImageEditor(prev => ({
      ...prev,
      dragging: true,
      startX: clientX,
      startY: clientY,
      startOffX: prev.x,
      startOffY: prev.y,
    }));
  };

  const editorDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageEditor.dragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = ((clientX - imageEditor.startX) / 3); 
    const dy = ((clientY - imageEditor.startY) / 3);
    
    setImageEditor(prev => ({
      ...prev,
      x: Math.max(-50, Math.min(50, prev.startOffX - dx)),
      y: Math.max(-50, Math.min(50, prev.startOffY - dy)),
    }));
  };

  const editorDragEnd = () => {
    setImageEditor(prev => ({ ...prev, dragging: false }));
  };

  const [formData, setFormData] = useState({
    title: '',
    category: BUSINESS_CATEGORIES[0] || 'Plumbing Services',
    price: '',
    city: '',
    state: '',
    description: '',
    image_url: '',
    image_zoom: 100,
    image_position: 'center',
    cover_image: '',
    cover_zoom: 100,
    cover_position: 'center',
    address: '',
    contact_phone: '',
    contact_email: '',
    website_url: '',
    google_maps_url: '',
    country: 'USA',
    postal_code: '',
    video_url: '',
  });

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

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
    cover_image: coverImagePreview || formData.cover_image,
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
          image_zoom: svc.image_zoom ?? 100,
          image_position: svc.image_position || 'center',
          cover_image: resolveMediaUrl(svc.cover_image || ''),
          cover_zoom: svc.cover_zoom ?? 100,
          cover_position: svc.cover_position || 'center',
          address: svc.address || '',
          contact_phone: svc.contact_phone || '',
          contact_email: svc.contact_email || '',
          website_url: svc.website_url || '',
          google_maps_url: svc.google_maps_url || '',
          country: normalizeCountry(svc.country || 'USA'),
          postal_code: svc.postal_code || '',
          video_url: svc.video_url || '',
        });

        setMainImagePreview(resolveMediaUrl(svc.image_url || svc.image || '') || null);
        setCoverImagePreview(resolveMediaUrl(svc.cover_image || '') || null);
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

    if (name === 'image_zoom' || name === 'cover_zoom') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 100 }));
      return;
    }

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
      reader.onloadend = () => {
        const src = reader.result as string;
        setMainImagePreview(src);
        openImageEditor('main', src);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const src = reader.result as string;
        setCoverImagePreview(src);
        openImageEditor('cover', src);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (galleryPreviews.length + files.length > 8) {
      toast.error("Max 8 gallery items allowed.");
      return;
    }

    if (files.length === 0) return;

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
      const parsed = detail.map((item) => item?.msg || item?.message).filter(Boolean).join(', ');
      if (parsed) return parsed;
    }
    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = formData.image_url;
      if (mainImage) {
        const res = await servicesAPI.uploadImage(mainImage);
        finalImageUrl = res.url;
      }

      let finalCoverUrl = formData.cover_image;
      if (coverImage) {
        const res = await servicesAPI.uploadImage(coverImage);
        finalCoverUrl = res.url;
      }

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

      if (stripRichText(formData.description).length < 10) {
        toast.error('Description must be at least 10 characters long.');
        setLoading(false);
        return;
      }

      const parsedPrice = parseFloat(formData.price);
      const existingGalleryUrls = galleryPreviews.filter((url) => url.startsWith('http'));
      const mergedGalleryUrls = Array.from(new Set([...existingGalleryUrls, ...uploadedGalleryUrls]));

      const payload = {
        ...formData,
        country: normalizedCountry,
        category: normalizeCategory(formData.category),
        image_url: finalImageUrl,
        cover_image: finalCoverUrl,
        gallery: mergedGalleryUrls,
        business_hours: hours,
        service_details: serviceDetailsInput.trim(),
        price: Number.isFinite(parsedPrice) ? parsedPrice : null,
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
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

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
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-slate-700 mb-1 uppercase tracking-widest">Business Profile Images</label>
                  <div className="rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-xl bg-white mt-4">
                    <div
                      className="relative w-full h-44 sm:h-56 bg-slate-900 overflow-hidden group cursor-pointer"
                      onClick={() => document.getElementById('coverImageInput')?.click()}
                    >
                      {coverImagePreview ? (
                        <img
                          src={coverImagePreview}
                          className="w-full h-full object-cover pointer-events-none"
                          style={{ transform: `scale(${formData.cover_zoom / 100})`, objectPosition: formData.cover_position }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/30 text-xs uppercase font-bold">Click to Add Cover Photo</div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-black uppercase">Change Cover</span>
                      </div>
                    </div>

                    <div className="relative px-5 pb-5 flex items-end gap-4 -mt-12">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 cursor-pointer group"
                          onClick={() => document.getElementById('mainImageInput')?.click()}
                        >
                          {mainImagePreview ? (
                            <img src={mainImagePreview} className="w-full h-full object-cover" style={{ transform: `scale(${formData.image_zoom / 100})`, objectPosition: formData.image_position }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">Add Logo</div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <span className="text-white text-[8px] font-black">EDIT</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pb-2 ml-auto">
                        <button type="button" onClick={() => mainImagePreview && openImageEditor('main', mainImagePreview)} className="px-3 py-1.5 rounded-full border border-slate-300 text-[10px] font-black uppercase">Edit Logo</button>
                        <button type="button" onClick={() => coverImagePreview && openImageEditor('cover', coverImagePreview)} className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase">Reposition Cover</button>
                      </div>
                    </div>
                  </div>
                  <input id="mainImageInput" type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
                  <input id="coverImageInput" type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                  <input name="title" value={formData.title} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4">
                    {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Starting Price ($)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Service Description *</label>
                  <RichTextEditor value={formData.description} onChange={(n) => setFormData(p => ({ ...p, description: n }))} />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</span>
                <h2 className="text-xl font-bold text-slate-800">Location & Contact</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Country *</label>
                  <select name="country" value={formData.country} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4">
                    {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">Postal Code *</label>
                  <input name="postal_code" value={formData.postal_code} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Phone *</label>
                  <input name="contact_phone" value={formData.contact_phone} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Owner Email</label>
                  <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4" />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</span>
                <h2 className="text-xl font-bold text-slate-800">Gallery & Media</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                <AnimatePresence>
                  {galleryPreviews.map((p, i) => (
                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                      <img src={p} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryPhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {galleryPreviews.length < 8 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Add Media</span>
                    <input type="file" multiple onChange={handleGalleryChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="mt-8 bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                 <label className="block text-sm font-black text-[#0f2340] mb-2 uppercase tracking-widest">Business Presentation Video</label>
                 <p className="text-[10px] text-slate-500 font-bold mb-4 uppercase tracking-widest">Provide a direct MP4/WebM URL or upload a video file to our server via the button above.</p>
                 <div className="flex gap-4">
                   <div className="flex-grow">
                     <input 
                       name="video_url" 
                       value={formData.video_url} 
                       onChange={handleChange} 
                       placeholder="e.g. https://example.com/video.mp4"
                       className="w-full bg-white border border-slate-200 rounded-2xl p-4 font-medium text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" 
                     />
                   </div>
                   <div className="flex-shrink-0 flex items-center gap-2">
                     <span className="text-xl">📹</span>
                   </div>
                 </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">4</span>
                <h2 className="text-xl font-bold text-slate-800">Business Hours</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(hours).map(([day, time]) => (
                  <div key={day} className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{day}</label>
                    <input value={time} onChange={(e) => handleHourChange(day, e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">5</span>
                <h2 className="text-xl font-bold text-slate-800">Service Highlights</h2>
              </div>
              <RichTextEditor value={serviceDetailsInput} onChange={setServiceDetailsInput} placeholder="e.g. 24/7 Support, Licensed..." />
            </section>

            <div className="pt-10 flex gap-4 justify-end">
              <button type="button" onClick={() => router.push('/admin/services')} className="px-8 py-4 border-2 border-slate-200 rounded-2xl text-slate-400 font-black text-sm uppercase">Cancel</button>
              <button type="submit" disabled={loading} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-blue-700 transition-all">{loading ? 'Saving...' : (editingId ? 'Update Listing' : 'Publish Listing')}</button>
            </div>
          </form>
          </div>
        </main>
      </div>

      <ServicePreviewModal open={previewOpen} serviceId={editingId} listing={previewListing} onClose={() => setPreviewOpen(false)} />

      <AnimatePresence>
        {imageEditor.open && imageEditor.src && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f172a] rounded-[2rem] w-full max-w-lg overflow-hidden border border-white/10">
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-white font-black text-sm uppercase">Edit Image</h3>
                <button onClick={() => setImageEditor(prev => ({ ...prev, open: false }))} className="text-white">✕</button>
              </div>
              <div 
                className="relative h-80 bg-black overflow-hidden cursor-move"
                onMouseDown={editorDragStart} onMouseMove={editorDragMove} onMouseUp={editorDragEnd} onMouseLeave={editorDragEnd}
                onTouchStart={editorDragStart} onTouchMove={editorDragMove} onTouchEnd={editorDragEnd}
              >
                <img src={imageEditor.src} className="w-full h-full object-cover pointer-events-none" style={{ transform: `scale(${imageEditor.zoom / 100})`, objectPosition: `${50 + imageEditor.x}% ${50 + imageEditor.y}%` }} />
              </div>
              <div className="p-6 space-y-4">
                <input type="range" min="100" max="300" value={imageEditor.zoom} onChange={(e) => setImageEditor(prev => ({ ...prev, zoom: parseInt(e.target.value) }))} className="w-full" />
                <div className="flex gap-3">
                  <button onClick={() => setImageEditor(prev => ({ ...prev, x: 0, y: 0, zoom: 100 }))} className="flex-1 py-3 bg-white/5 text-white rounded-xl uppercase font-black text-[10px]">Reset</button>
                  <button onClick={applyImageEditor} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl uppercase font-black text-[10px]">Apply</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
