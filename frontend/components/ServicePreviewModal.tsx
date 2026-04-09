'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatUsd, resolveMediaUrl, servicesAPI } from '@/lib/api';
import FormattedDescription from '@/components/FormattedDescription';

interface ServicePreviewModalProps {
  open: boolean;
  serviceId?: string | null;
  serviceName?: string;
  listing?: any | null;
  onClose: () => void;
}

const formatHours = (hours: any) => {
  if (!hours || typeof hours !== 'object') return [];

  return Object.entries(hours).map(([day, value]) => ({
    day,
    value: String(value || '').trim() || 'Closed',
  }));
};

export default function ServicePreviewModal({ open, serviceId, serviceName, listing, onClose }: ServicePreviewModalProps) {
  const [fetchedListing, setFetchedListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !serviceId || listing) return;

    let cancelled = false;

    const loadListing = async () => {
      try {
        setLoading(true);
        const response = await servicesAPI.getById(serviceId);
        if (!cancelled) {
          setFetchedListing(response.data);
        }
      } catch {
        if (!cancelled) {
          setFetchedListing(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadListing();

    return () => {
      cancelled = true;
    };
  }, [open, serviceId, listing]);

  const service = listing || fetchedListing;

  const previewData = useMemo(() => {
    if (!service) return null;

    const gallery = Array.isArray(service.gallery) ? service.gallery.filter(Boolean) : [];
    const allImages = [service.image_url || service.image, ...gallery]
      .map((img: any) => resolveMediaUrl(String(img || '')))
      .filter(Boolean);
    const details = String(service.service_details || service.description || '').split('\n').map((item: string) => item.trim()).filter(Boolean);
    const hours = formatHours(service.business_hours);
    const location = [service.address, service.city, service.state, service.country].map((value) => String(value || '').trim()).filter(Boolean).join(', ');

    return {
      title: service.title || serviceName || 'Service Preview',
      category: service.category || 'Uncategorized',
      price: service.price,
      description: service.description || 'No description provided yet.',
      contactPhone: String(service.contact_phone || '').trim(),
      contactEmail: String(service.contact_email || '').trim(),
      websiteUrl: String(service.website_url || '').trim(),
      mapsUrl: String(service.google_maps_url || '').trim(),
      location,
      allImages,
      details,
      hours,
      featured: Boolean(service.featured),
      avgRating: Number(service.avg_rating || 0),
      reviewsCount: Number(service.reviews_count || 0),
    };
  }, [service, serviceName]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${serviceName || 'listing'}`}
    >
      <div
        className="w-full max-w-7xl h-[92vh] bg-slate-50 rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-b border-slate-200 bg-white">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Admin Listing Preview</p>
            <h2 className="text-lg md:text-xl font-black text-slate-900 truncate">{previewData?.title || serviceName || 'Service Preview'}</h2>
            <p className="mt-1 text-xs text-slate-500">This preview stays inside the admin panel and never shows the public site header or footer.</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-widest bg-emerald-50">
              Admin Only
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[radial-gradient(circle_at_top,_rgba(15,35,64,0.08),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]">
          {loading && !previewData ? (
            <div className="h-full flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">
              Loading preview...
            </div>
          ) : previewData ? (
            <div className="max-w-6xl mx-auto space-y-6">
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                  <div className="relative">
                    <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                      <img
                        src={previewData.allImages[0] || ''}
                        alt={previewData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {previewData.featured && (
                      <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">
                        Featured
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg max-w-full">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Category</p>
                        <p className="text-sm font-black text-slate-900 truncate">{previewData.category}</p>
                      </div>
                      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg text-white shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">Starting From</p>
                        <p className="text-lg font-black">{formatUsd(previewData.price)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{previewData.title}</h3>
                      <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{previewData.category}</span>
                        <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{previewData.reviewsCount} Feedback</span>
                        <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{previewData.avgRating.toFixed(1)} / 5 Rating</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Description</h4>
                      <FormattedDescription text={String(previewData.description || '')} className="text-slate-600 leading-7 space-y-2" />
                    </div>

                    {previewData.details.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Highlights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {previewData.details.map((item: string, index: number) => (
                            <div key={index} className="flex gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">✓</div>
                              <p className="text-sm font-medium text-slate-700 leading-relaxed">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewData.allImages.length > 1 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Gallery</h4>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                          {previewData.allImages.slice(1, 6).map((image: string, index: number) => (
                            <div key={index} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                              <img src={image} alt={`${previewData.title} ${index + 2}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="xl:col-span-4 space-y-6">
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-6 space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Feedback & Contact Summary</p>
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">Client Feedback</p>
                          <p className="font-black text-slate-800 mt-1">{previewData.reviewsCount} review(s) • {previewData.avgRating.toFixed(1)} average</p>
                        </div>
                        {previewData.contactPhone && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Phone</p>
                            <p className="font-black text-slate-800 mt-1 break-words">{previewData.contactPhone}</p>
                          </div>
                        )}
                        {previewData.contactEmail && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Email</p>
                            <p className="font-black text-slate-800 mt-1 break-words">{previewData.contactEmail}</p>
                          </div>
                        )}
                        {previewData.websiteUrl && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Website</p>
                            <p className="font-black text-blue-700 mt-1 break-words">{previewData.websiteUrl}</p>
                          </div>
                        )}
                        {previewData.location && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Location</p>
                            <p className="font-black text-slate-800 mt-1 break-words">{previewData.location}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {previewData.hours.length > 0 && (
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Business Hours</p>
                      <div className="space-y-3">
                        {previewData.hours.slice(0, 7).map(({ day, value }: any) => (
                          <div key={day} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0">
                            <span className="text-sm font-bold text-slate-700">{day}</span>
                            <span className="text-sm font-semibold text-slate-500 text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-[#0f2340] to-slate-900 text-white rounded-[2rem] shadow-2xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 mb-2">Admin Note</p>
                    <p className="text-sm leading-6 text-slate-200">
                      This is a clean admin-only preview. It uses the listing data directly, so the public site header, footer, and page chrome do not appear here.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">
              Preview data is not available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
