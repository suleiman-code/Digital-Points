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
    
    // Normalize 'center' to '50% 50%' for parsing
    if (currentPos === 'center') currentPos = '50% 50%';
    
    const parts = String(currentPos || '50% 50%').split(' ');
    const px = parseFloat(parts[0]);
    const py = parseFloat(parts[1] || parts[0]);
    
    // Saved values are final CSS positions (e.g. 50% 50% = center)
    // Convert back to editor offset: offset = saved - 50
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
    // Save the final CSS object-position: 50 + offset
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
    // Inverted drag for intuitive "pulling" the image
    const dx = ((clientX - imageEditor.startX) / 3); 
    const dy = ((clientY - imageEditor.startY) / 3);
    
    // Offset range: -50 to +50 (maps to 0% to 100% CSS position)
    setImageEditor(prev => ({
      ...prev,
      x: Math.max(-50, Math.min(50, prev.startOffX - dx)),
      y: Math.max(-50, Math.min(50, prev.startOffY - dy)),
    }));
  };

  const editorDragEnd = () => {
    setImageEditor(prev => ({ ...prev, dragging: false }));
  };

  // Form State
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
  });

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

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
    
    const existingImages = galleryFiles.filter(f => f.type.startsWith('image/')).length;
    const existingVideos = galleryFiles.filter(f => f.type.startsWith('video/')).length;
    
    const newImages = files.filter(f => f.type.startsWith('image/'));
    const newVideos = files.filter(f => f.type.startsWith('video/'));

    if (existingImages + newImages.length > 4) {
      toast.error("Max 4 gallery images allowed.");
      return;
    }

    if (existingVideos + newVideos.length > 1) {
      toast.error("Only 1 video allowed in gallery.");
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

      // 1.5 Upload Cover Image if exists
      let finalCoverUrl = formData.cover_image;
      if (coverImage) {
        const res = await servicesAPI.uploadImage(coverImage);
        finalCoverUrl = res.url;
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

      if (!formData.postal_code.trim()) {
        toast.error('Postal Code is required for business listings.');
        setLoading(false);
        return;
      }

      const { price: _price, address: _address, contact_email: _contactEmail, website_url: _websiteUrl, google_maps_url: _googleMapsUrl, postal_code: _postal_code, ...requiredFields } = formData;
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
        image_zoom: formData.image_zoom,
        image_position: formData.image_position,
        cover_image: finalCoverUrl,
        cover_zoom: formData.cover_zoom,
        cover_position: formData.cover_position,
        gallery: mergedGalleryUrls,
        business_hours: hours,
        ...(serviceDetailsInput.trim() ? { service_details: serviceDetailsInput.trim() } : {}),
        ...(formData.contact_phone.trim() ? { contact_phone: formData.contact_phone.trim() } : {}),
        ...(Number.isFinite(parsedPrice) ? { price: parsedPrice } : {}),
        ...(formData.address.trim() ? { address: formData.address.trim() } : {}),
        postal_code: formData.postal_code.trim(),
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
                {/* --- SOCIAL MEDIA STYLE IMAGE MANAGER --- */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-slate-700 mb-1 uppercase tracking-widest">Business Profile Images</label>
                  <p className="text-xs text-slate-400 mb-4">Set your cover photo and business logo — exactly like managing a social media business page.</p>
                  
                  {/* --- PROFILE CARD PREVIEW --- */}
                  <div className="rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-xl bg-white">
                    
                    {/* Cover Photo Area */}
                    <div
                      className="relative w-full h-44 sm:h-56 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden group cursor-pointer"
                      onClick={() => document.getElementById('coverImageInput')?.click()}
                    >
                      {coverImagePreview ? (
                        <img
                          src={coverImagePreview}
                          className="w-full h-full object-cover pointer-events-none"
                          style={{
                            transform: `scale(${formData.cover_zoom / 100})`,
                            objectPosition: formData.cover_position,
                            transformOrigin: 'center center',
                          }}
                        />
                      ) : (
                        // Empty state: nice gradient with pattern
                        <div className="w-full h-full bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center gap-2">
                          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '30px 30px'}} />
                          <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Click to Add Cover Photo</p>
                        </div>
                      )}

                      {/* Cover hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center gap-2">
                          <div className="bg-white/95 backdrop-blur px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xl">
                            <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{coverImagePreview ? 'Change Cover' : 'Upload Cover'}</span>
                          </div>
                          {coverImagePreview && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openImageEditor('cover', coverImagePreview); }}
                              className="bg-blue-600 text-white px-4 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
                              Reposition
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Camera icon badge top-right */}
                      <div className="absolute top-3 right-3">
                        <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Cover Photo</span>
                        </div>
                      </div>
                    </div>

                    {/* Logo + Info Row (overlapping the cover) */}
                    <div className="relative px-5 pb-5">
                      {/* Logo: positioned to overlap the cover */}
                      <div className="flex items-end gap-4 -mt-12 sm:-mt-14 mb-3">
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 flex items-center justify-center cursor-pointer group relative"
                            onClick={() => mainImagePreview ? openImageEditor('main', mainImagePreview) : document.getElementById('mainImageInput')?.click()}
                          >
                            {mainImagePreview ? (
                              <img
                                src={mainImagePreview}
                                className="w-full h-full object-cover"
                                style={{
                                  transform: `scale(${formData.image_zoom / 100})`,
                                  objectPosition: formData.image_position,
                                  transformOrigin: 'center center',
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-white flex items-center justify-center">
                                <svg className="w-9 h-9 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              </div>
                            )}
                            {/* Logo hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 rounded-full flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-all text-center">
                                <svg className="w-5 h-5 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <p className="text-white text-[8px] font-black uppercase mt-0.5">{mainImagePreview ? 'Edit' : 'Add'}</p>
                              </div>
                            </div>
                          </div>
                          {/* Camera badge */}
                          <button
                            type="button"
                            onClick={() => document.getElementById('mainImageInput')?.click()}
                            className="absolute bottom-0.5 right-0.5 w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </button>
                        </div>

                        {/* Action buttons beside logo */}
                        <div className="flex items-center gap-2 pb-1 ml-auto">
                          {mainImagePreview && (
                            <button type="button" onClick={() => openImageEditor('main', mainImagePreview)} className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 text-[10px] font-black hover:bg-slate-50 transition-all flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Edit Logo
                            </button>
                          )}
                          {coverImagePreview && (
                            <button type="button" onClick={() => openImageEditor('cover', coverImagePreview)} className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black hover:bg-blue-700 transition-all flex items-center gap-1 shadow-md">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
                              Reposition Cover
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Helper text */}
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Logo</p>
                          <p className="text-[11px] text-slate-600 font-medium">Click the circle or camera icon to upload. Click again to reposition.</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cover Photo</p>
                          <p className="text-[11px] text-slate-600 font-medium">Click the cover area to upload. Use "Reposition" to align the focus.</p>
                        </div>
                      </div>

                      {/* URL fallback input */}
                      <input
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        placeholder="Or paste an external logo image URL..."
                        className="mt-3 w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Hidden inputs */}
                  <input id="mainImageInput" type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
                  <input id="coverImageInput" type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">Postal Code *</label>
                  <input name="postal_code" value={formData.postal_code} onChange={handleChange} required placeholder="e.g. 19106" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">Business Owner Email (Receive Inquiries)</label>
                  <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="owner@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" />
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
                <h2 className="text-xl font-bold text-slate-800">Business Cover & Gallery</h2>
              </div>
              
              <div className="space-y-8">
                {/* Work Gallery Photos */}
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-4 text-center">Work Gallery Photos (Max 8)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {galleryPreviews.map((preview, i) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative aspect-square rounded-xl overflow-hidden shadow-md bg-slate-100">
                          {preview.startsWith('data:video/') ? (
                            <video src={preview} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={preview} className="w-full h-full object-cover" />
                          )}
                          <button type="button" onClick={() => removeGalleryPhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs">&times;</button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {galleryPreviews.length < 5 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase text-center px-2">Add Photo / Video</span>
                        <input type="file" multiple accept="image/*,video/*" onChange={handleGalleryChange} className="hidden" />
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

      {/* ======== PROFESSIONAL IMAGE EDITOR MODAL ======== */}
      <AnimatePresence>
        {imageEditor.open && imageEditor.src && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setImageEditor(prev => ({ ...prev, open: false })); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="bg-[#0f172a] rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">
                    {imageEditor.type === 'main' ? 'Edit Business Logo' : 'Edit Cover Photo'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {imageEditor.type === 'main' ? 'Drag to reposition · Zoom to focus' : 'Drag & zoom to frame the perfect cover'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageEditor(prev => ({ ...prev, open: false }))}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Canvas: Drag area (Now the main, larger preview) */}
              <div
                className={`relative w-full bg-[#0a0f1e] overflow-hidden select-none ${imageEditor.type === 'main' ? 'h-80' : 'h-64'} ${imageEditor.dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={editorDragStart}
                onMouseMove={editorDragMove}
                onMouseUp={editorDragEnd}
                onMouseLeave={editorDragEnd}
                onTouchStart={editorDragStart}
                onTouchMove={editorDragMove}
                onTouchEnd={editorDragEnd}
              >
                <img
                  src={imageEditor.src}
                  draggable={false}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    objectFit: 'cover',
                    transform: `scale(${imageEditor.zoom / 100})`,
                    objectPosition: `${50 + imageEditor.x}% ${50 + imageEditor.y}%`,
                    transformOrigin: 'center center',
                    transition: imageEditor.dragging ? 'none' : 'object-position 0.1s ease',
                  }}
                />
                {/* Guide overlay */}
                {imageEditor.type === 'main' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 rounded-full border-2 border-dashed border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                  </div>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
                  <span className="text-white text-[9px] font-black uppercase tracking-widest">Drag to Reposition</span>
                </div>
              </div>

              {/* Controls */}
              <div className="px-6 py-5 space-y-4">
                {/* Zoom Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zoom</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-400">{imageEditor.zoom}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="300"
                    step="5"
                    value={imageEditor.zoom}
                    onChange={(e) => setImageEditor(prev => ({ ...prev, zoom: parseInt(e.target.value) }))}
                    className="w-full h-2 rounded-full accent-blue-500 cursor-pointer bg-white/10"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-bold mt-1">
                    <span>100% (Original)</span>
                    <span>300% (Max Zoom)</span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  {/* Reset + Apply buttons */}
                  <button
                    type="button"
                    onClick={() => setImageEditor(prev => ({ ...prev, x: 0, y: 0, zoom: 100 }))}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={applyImageEditor}
                    className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                  >
                    ✓ Apply Position
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
