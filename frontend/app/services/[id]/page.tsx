'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import FormattedDescription from '@/components/FormattedDescription';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { resolveMediaUrl, servicesAPI, inquiriesAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

const INITIAL_REVIEWS_COUNT = 8;

function ServiceDetailContent({ params }: { params: any }) {
  const rawServiceId = params?.id;
  const serviceId = rawServiceId ? decodeURIComponent(String(rawServiceId)) : '';

  // REFS
  const reviewFormRef = useRef<HTMLDivElement>(null);

  // STATES
  const [service, setService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);


  // Review Form States
  const [reviewForm, setReviewForm] = useState({ user_name: '', user_email: '', rating: 5, comment: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(INITIAL_REVIEWS_COUNT);

  // Inquiry Form States
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', phone: '', city: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const handleCopyPhone = async () => {
    if (!rawContactPhone) {
      toast.error('Phone number is not available for this listing right now.');
      return;
    }

    try {
      await navigator.clipboard.writeText(rawContactPhone);
      toast.success('Phone number copied successfully.');
    } catch {
      toast.error('Unable to copy phone number.');
    }
  };

  useEffect(() => {
    if (serviceId) {
      setVisibleReviewsCount(INITIAL_REVIEWS_COUNT);
      fetchServiceData(serviceId);
    }
  }, [serviceId]);

  const fetchServiceData = async (id: string) => {
    try {
      setLoading(true);
      const serviceRes = await servicesAPI.getById(id);
      const normalizedService = {
        ...serviceRes.data,
        image_url: resolveMediaUrl(serviceRes.data?.image_url || serviceRes.data?.image),
        gallery: Array.isArray(serviceRes.data?.gallery)
          ? serviceRes.data.gallery.map((img: any) => resolveMediaUrl(String(img || ''))).filter(Boolean)
          : [],
      };
      setService(normalizedService);
      const media = [normalizedService.image_url, ...(normalizedService.gallery || [])].filter(Boolean);
      setActiveImage(media[0] || null);

      try {
        const reviewsRes = await servicesAPI.getReviews(id);
        setReviews(reviewsRes.data || []);
      } catch {
        setReviews([]);
      }
    } catch (error) {
      toast.error('Service details not found');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.user_name || !reviewForm.comment) return toast.error("Name and Comment required");
    if (!serviceId) return toast.error('Service not found');

    setIsPosting(true);
    try {
      await servicesAPI.postReview(serviceId, reviewForm);
      toast.success('Review submitted. It will be visible after admin approval.');
      setReviewForm({ user_name: '', user_email: '', rating: 5, comment: '' });

      // Public page only shows approved reviews.
      await fetchServiceData(serviceId);
    } catch (error: any) {
      toast.error('Error posting review');
    } finally {
      setIsPosting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail) {
      toast.error('Business email is not available for this listing right now.');
      setIsModalOpen(false);
      return;
    }

    if (!bookingForm.name || !bookingForm.email || !bookingForm.phone || !bookingForm.city || !bookingForm.message) {
      return toast.error('Please fill all inquiry fields.');
    }

    setSubmitting(true);
    try {
      const bookingData = {
        service_id: service._id,
        service_name: service.title,
        user_name: bookingForm.name,
        user_email: bookingForm.email,
        user_phone: bookingForm.phone,
        user_city: bookingForm.city,
        message: bookingForm.message
      };
      await inquiriesAPI.create(bookingData);
      toast.success('Inquiry sent successfully!');
      setBookingForm({ name: '', email: '', phone: '', city: '', message: '' });
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to send inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold text-slate-300 animate-pulse text-xs uppercase tracking-widest">Digital Points...</div>;
  if (!service) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Service Not Found</div>;

  const addressString = `${service.address || ''} ${service.city || ''} ${service.state || ''} ${service.country || ''}`.trim();
  const allImages = Array.from(new Set([service.image_url || service.image, ...(service.gallery || [])].filter(Boolean)));
  const rawContactPhone = String(service.contact_phone || '').trim();
  const normalizedPhone = rawContactPhone.replace(/[^\d+]/g, '');
  const hasCallablePhone = normalizedPhone.length >= 7;
  const hasGoogleMap = Boolean(service.google_maps_url && String(service.google_maps_url).trim());
  const businessHoursEntries = service.business_hours && typeof service.business_hours === 'object'
    ? Object.entries(service.business_hours)
    : [];

  const getBusinessStatus = () => {
    if (!service.business_hours || typeof service.business_hours !== 'object') return null;

    const stateToTz: { [key: string]: string } = {
      'AL': 'America/Chicago', 'AK': 'America/Anchorage', 'AZ': 'America/Phoenix', 'AR': 'America/Chicago',
      'CA': 'America/Los_Angeles', 'CO': 'America/Denver', 'CT': 'America/New_York', 'DE': 'America/New_York',
      'FL': 'America/New_York', 'GA': 'America/New_York', 'HI': 'Pacific/Honolulu', 'ID': 'America/Boise',
      'IL': 'America/Chicago', 'IN': 'America/Indiana/Indianapolis', 'IA': 'America/Chicago', 'KS': 'America/Chicago',
      'KY': 'America/New_York', 'LA': 'America/Chicago', 'ME': 'America/New_York', 'MD': 'America/New_York',
      'MA': 'America/New_York', 'MI': 'America/Detroit', 'MN': 'America/Chicago', 'MS': 'America/Chicago',
      'MO': 'America/Chicago', 'MT': 'America/Denver', 'NE': 'America/Chicago', 'NV': 'America/Los_Angeles',
      'NH': 'America/New_York', 'NJ': 'America/New_York', 'NM': 'America/Denver', 'NY': 'America/New_York',
      'NC': 'America/New_York', 'ND': 'America/Chicago', 'OH': 'America/New_York', 'OK': 'America/Chicago',
      'OR': 'America/Los_Angeles', 'PA': 'America/New_York', 'RI': 'America/New_York', 'SC': 'America/New_York',
      'SD': 'America/Chicago', 'TN': 'America/Chicago', 'TX': 'America/Chicago', 'UT': 'America/Denver',
      'VT': 'America/New_York', 'VA': 'America/New_York', 'WA': 'America/Los_Angeles', 'WV': 'America/New_York',
      'WI': 'America/Chicago', 'WY': 'America/Denver', 'DC': 'America/New_York'
    };

    const stateCode = service.state?.trim().toUpperCase();
    const tz = stateToTz[stateCode] || 'America/New_York';

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true
    });

    const parts = formatter.formatToParts(now);
    const businessDay = parts.find(p => p.type === 'weekday')?.value || '';
    const hourVal = parts.find(p => p.type === 'hour')?.value || '0';
    const minuteVal = parts.find(p => p.type === 'minute')?.value || '0';
    const dayPeriod = (parts.find(p => p.type === 'dayPeriod')?.value || 'AM').toUpperCase();

    const hour = parseInt(hourVal);
    const minute = parseInt(minuteVal);
    const currentTotalMinutes = (dayPeriod === 'PM' && hour !== 12 ? (hour + 12) * 60 : (dayPeriod === 'AM' && hour === 12 ? 0 : hour * 60)) + minute;

    const todayHoursStr = service.business_hours[businessDay];
    let statusObj: any = { status: 'Closed', color: 'text-rose-500', businessDay };

    if (!todayHoursStr || todayHoursStr.toLowerCase().includes('closed')) {
      statusObj = { status: 'Closed', color: 'text-rose-500', businessDay };
    } else {
      const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;
      const matches = Array.from(todayHoursStr.matchAll(timeRegex)) as any[];

      if (matches.length < 2) {
        statusObj = { status: 'Open', color: 'text-blue-500', businessDay };
      } else {
        const parseMatch = (m: any) => {
          const h = parseInt(m[1]);
          const m_min = parseInt(m[2] || '0');
          const p = m[3].toUpperCase();
          return (p === 'PM' && h !== 12 ? (h + 12) * 60 : (p === 'AM' && h === 12 ? 0 : h * 60)) + m_min;
        };
        const startTotal = parseMatch(matches[0]);
        const endTotal = parseMatch(matches[1]);

        if (currentTotalMinutes >= startTotal && currentTotalMinutes < endTotal) {
          statusObj = { status: 'Open Now', color: 'text-emerald-500', businessDay };
        } else {
          statusObj = { status: 'Closed', color: 'text-rose-500', businessDay };
        }
      }
    }
    return statusObj;
  };

  const businessStatus = getBusinessStatus();

  const visibleReviews = reviews.slice(0, visibleReviewsCount);
  const canShowMoreReviews = reviews.length > visibleReviewsCount;
  const canShowLessReviews = reviews.length > INITIAL_REVIEWS_COUNT && visibleReviewsCount >= reviews.length;
  const logoImage = String(service.image_url || service.image || (Array.isArray(service.gallery) ? service.gallery[0] : '') || '').trim();
  const contactEmail = String(service.contact_email || service.email || '').trim();
  const actionBtnBase = 'justify-center px-4 py-3 border border-slate-300 text-slate-800 font-semibold transition-all duration-200 flex items-center gap-2 text-sm whitespace-nowrap bg-white rounded-xl shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300';
  const actionBtnDisabled = 'justify-center px-4 py-3 border border-slate-200 text-slate-400 font-semibold transition-all duration-200 flex items-center gap-2 text-sm whitespace-nowrap bg-slate-50 rounded-xl cursor-not-allowed';

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-[11rem] pb-20">
        <div className="container-max px-4 relative">
          <div className="pointer-events-none absolute -top-10 right-0 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl" />

          {/* BACK BUTTON REMOVED (Now in Header) */}
          {/* HEADER SECTION */}
          <div className="mb-8 md:mb-10 relative z-10">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5 md:gap-8 items-start bg-white rounded-2xl border border-slate-200 shadow-[0_14px_40px_rgba(15,23,42,0.08)] overflow-hidden p-4 sm:p-5 md:p-6">
              <div className="bg-slate-100 h-[200px] sm:h-[220px] w-full flex items-center justify-center overflow-hidden rounded-xl border border-slate-200">
                {logoImage ? (
                  <img src={logoImage} className="w-full h-full object-cover object-center bg-slate-100" alt={service.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-center text-slate-700 bg-slate-100">
                    <div>
                      <svg className="w-28 h-28 mx-auto mb-2 text-slate-800/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7a2 2 0 012-2h2l1-1h8l1 1h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><circle cx="12" cy="12" r="3" strokeWidth="1.5" /></svg>
                      <p className="text-2xl font-black leading-tight">No Image<br />Available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-1 pr-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-4 leading-tight">{service.title}</h1>

                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <p className="text-xl md:text-2xl font-semibold text-slate-800 leading-none">Rating {Number(service.avg_rating || 0).toFixed(1)}</p>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-6 h-6 md:w-7 md:h-7 ${i < Math.round(service.avg_rating || 0) ? 'fill-current' : 'fill-slate-200'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
                  <button onClick={() => reviewFormRef.current?.scrollIntoView({ behavior: 'smooth' })} className={actionBtnBase}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Add a Review
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasCallablePhone) {
                        toast.error('Phone number is not available for this listing right now.');
                        return;
                      }
                      window.location.href = `tel:${normalizedPhone}`;
                    }}
                    className={hasCallablePhone ? actionBtnBase : actionBtnDisabled}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Call Now
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={actionBtnBase}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l8.89 5.26a2 2 0 002.22 0L23 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">

            <div className="lg:col-span-8 space-y-12">

              {/* MAIN BUSINESS PHOTO */}
              <section>
                <div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm mb-8 md:mb-12">
                  <h2 className="text-2xl font-black text-[#0f2340] mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-blue-600 rounded-full" />
                    Business Description
                  </h2>
                  <FormattedDescription text={String(service.description || '')} className="text-slate-600 font-medium text-lg space-y-2" />
                </div>

                <div className="relative group rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-lg mb-6">
                  <div className="h-[260px] sm:h-[360px] md:h-[550px] w-full relative overflow-hidden">
                    <img
                      src={activeImage || ''}
                      className="w-full h-full object-cover"
                      alt={service.title}
                    />
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        +{allImages.length - 1} more photos
                      </div>
                    )}
                  </div>
                </div>
              </section>

            </div>

            {/* SIDEBAR */}
            <div className="lg:col-span-4 space-y-10">

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_10px_35px_rgba(15,23,42,0.06)] overflow-hidden">
                <div className="p-6 pb-4 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Business Location</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Find us on the map</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-inner border border-blue-100/50">📍</div>
                </div>

                <div className="p-4">
                  <div className="h-60 bg-slate-100 rounded-[2.2rem] overflow-hidden relative group border border-slate-100 shadow-inner">
                    {(() => {
                      const rawUrl = String(service.google_maps_url || '').trim();
                      if (!rawUrl) return (
                        <div className="h-full flex items-center justify-center px-5 text-center bg-slate-50">
                          <div className="opacity-40">
                            <svg className="w-10 h-10 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <p className="text-slate-500 font-bold text-xs">Map not available</p>
                          </div>
                        </div>
                      );

                      let embedUrl = '';
                      if (rawUrl.includes('<iframe')) {
                        const match = rawUrl.match(/src=["']([^"']+)["']/i);
                        embedUrl = match?.[1] || '';
                      } else if (rawUrl.includes('pb=') || rawUrl.includes('output=embed')) {
                        embedUrl = rawUrl;
                      } else {
                        embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(rawUrl)}&output=embed`;
                      }

                      return (
                        <>
                          <iframe
                            src={embedUrl}
                            className="w-full h-full border-0 grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 opacity-90 group-hover:opacity-100"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                          <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <a 
                               href={rawUrl.includes('http') && !rawUrl.includes('<iframe') ? rawUrl : `https://www.google.com/maps/search/${encodeURIComponent(addressString)}`}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="bg-white/95 backdrop-blur-md border border-white text-slate-900 font-black text-[9px] uppercase tracking-widest px-5 py-2.5 rounded-full shadow-2xl hover:bg-blue-600 hover:text-white transition-all scale-95 group-hover:scale-100 origin-right"
                             >
                               View Full Map
                             </a>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="mt-6 flex items-start gap-4 p-5 bg-blue-50/30 rounded-[1.8rem] border border-blue-100/40 group/addr hover:bg-white transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-white text-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 group-hover/addr:bg-blue-600 group-hover/addr:text-white transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 shadow-none">Official Address</p>
                       <p className="text-xs font-bold text-slate-700 leading-relaxed">{addressString || 'Address Unlisted'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-blue-600 rounded-3xl bg-white overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.1)]">
                <div className="bg-blue-600 px-5 py-4 flex justify-between items-center group">
                  <span className="font-black text-[10px] text-white uppercase tracking-[0.2em]">Live Business Status</span>
                  {businessStatus && (
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full bg-white shadow-lg ${businessStatus.color}`}>
                      ● {businessStatus.status}
                    </span>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  {businessHoursEntries.length > 0 ? businessHoursEntries.map(([day, time]: any) => {
                    const isClosed = time.toLowerCase().includes('closed');
                    const isToday = businessStatus?.businessDay === day;
                    return (
                      <div key={day} className={`flex justify-between items-center py-2 px-3 rounded-xl transition-all ${isToday ? 'bg-blue-50 border border-blue-100 scale-[1.02] shadow-sm' : 'border-b border-slate-50 last:border-0'}`}>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                            {day}
                            {isToday && <span className="ml-2 lowercase font-bold text-[9px] text-blue-400">(Today)</span>}
                          </span>
                        </div>
                        <span className={`text-xs font-bold ${isClosed ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded' : isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                          {time}
                        </span>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-6">
                      <p className="text-slate-500 font-semibold text-sm">Business hours not updated yet</p>
                      <p className="text-slate-400 text-xs mt-1">Please contact the business for opening hours.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── MORE DETAILS LINK ─── */}
              <Link
                href={`/services/${serviceId}/details`}
                className="w-full flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#0f2340] to-indigo-900 text-white rounded-3xl hover:shadow-lg transition-all group border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">✦</span>
                  <span className="font-black text-[11px] uppercase tracking-[0.18em]">View More Details</span>
                </div>
                <span className="text-white/60 group-hover:translate-x-1 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

            </div>
          </div>

          <div className='mt-16 w-full'>
            {/* REVIEWS DISPLAY */}
            <section className="space-y-12 pt-16 border-t border-slate-100">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                </div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Real Experiences</h2>
                <p className="text-slate-500 font-medium text-lg max-w-xl">Hear straight from our community. We pride ourselves on delivering exactly what we promise.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reviews.length > 0 ? visibleReviews.map((rev: any, i: number) => (
                  <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={`w-5 h-5 ${star <= Math.round(rev.rating || 0) ? 'text-amber-400' : 'text-slate-200'} fill-current`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <p className="text-slate-600 text-[12px] font-medium leading-relaxed mb-8 flex-grow">&quot;{rev.comment}&quot;</p>

                    <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-800">{rev.user_name || 'Verified User'}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {new Date(rev.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="lg:col-span-2 text-center py-16 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No reviews yet.</p>
                    <button onClick={() => reviewFormRef.current?.scrollIntoView({ behavior: 'smooth' })} className="mt-2 text-blue-600 font-bold text-xs uppercase tracking-widest">Be the first to review</button>
                  </div>
                )}
              </div>
              {canShowMoreReviews && (
                <button
                  onClick={() => setVisibleReviewsCount(prev => prev + INITIAL_REVIEWS_COUNT)}
                  className="mx-auto block px-8 py-3 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-700 text-sm font-bold hover:bg-slate-50 hover:shadow transition-all"
                >
                  View More Reviews
                </button>
              )}
              {canShowLessReviews && (
                <button
                  onClick={() => setVisibleReviewsCount(INITIAL_REVIEWS_COUNT)}
                  className="mx-auto block px-8 py-3 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-700 text-sm font-bold hover:bg-slate-50 hover:shadow transition-all"
                >
                  Show Less Reviews
                </button>
              )}
            </section>

            {/* POST REVIEW */}
            <section ref={reviewFormRef} className="pt-10 border-t border-slate-100">
              <h2 className="text-base font-bold text-slate-700 mb-2">Leave a review</h2>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewForm({ ...reviewForm, rating: s })} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}>
                    <svg className={`w-6 h-6 ${(hoverRating || reviewForm.rating) >= s ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                  </button>
                ))}
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <textarea required placeholder="Write your feedback..." value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} className="w-full border border-slate-200 rounded p-4 text-sm focus:border-slate-400 outline-none h-24" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Your Name" value={reviewForm.user_name} onChange={e => setReviewForm({ ...reviewForm, user_name: e.target.value })} className="border border-slate-200 rounded p-3 text-sm focus:border-slate-400 outline-none" />
                  <input type="email" placeholder="Your Email (Optional)" value={reviewForm.user_email} onChange={e => setReviewForm({ ...reviewForm, user_email: e.target.value })} className="border border-slate-200 rounded p-3 text-sm focus:border-slate-400 outline-none" />
                </div>
                <button disabled={isPosting} className="px-10 py-3 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded hover:bg-blue-700 shadow-md transition-all">
                  {isPosting ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            </section>

          </div>

        </div>
      </main>

      <Footer />

      {/* EMAIL MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 hover:bg-red-50 rounded-full p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <h2 className="text-2xl font-black text-[#0f2340] mb-2 uppercase tracking-tight">Direct Inquiry</h2>
              <p className="text-sm text-slate-500 mb-8 font-medium">Send a direct message to {service.title}</p>
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-blue-700">Recipient Email</p>
                <p className="text-sm font-semibold text-blue-900 mt-1 break-all">{contactEmail || 'Digital Point Support'}</p>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Your Name *" value={bookingForm.name} onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:border-blue-500 outline-none transition-all focus:ring-4 focus:ring-blue-100" />
                  <input required type="email" placeholder="Your Email Address *" value={bookingForm.email} onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:border-blue-500 outline-none transition-all focus:ring-4 focus:ring-blue-100" />
                  <input required placeholder="Your Phone Number *" value={bookingForm.phone} onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:border-blue-500 outline-none transition-all focus:ring-4 focus:ring-blue-100" />
                  <input required placeholder="Your City *" value={bookingForm.city} onChange={e => setBookingForm({ ...bookingForm, city: e.target.value })} className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:border-blue-500 outline-none transition-all focus:ring-4 focus:ring-blue-100" />
                </div>
                <div className="relative">
                  <textarea required placeholder="Write your message (min 30, max 500 words) *" value={bookingForm.message} onChange={e => setBookingForm({ ...bookingForm, message: e.target.value })} className="w-full border border-slate-200 rounded-xl p-4 text-sm h-32 focus:border-blue-500 outline-none resize-none transition-all focus:ring-4 focus:ring-blue-100" />
                  <div className={`absolute bottom-3 right-4 text-[10px] font-bold ${bookingForm.message.trim().split(/\s+/).filter(Boolean).length < 30 || bookingForm.message.trim().split(/\s+/).filter(Boolean).length > 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {bookingForm.message.trim().split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>
                <button disabled={submitting} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all text-sm uppercase tracking-widest shadow-md disabled:opacity-70">
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHONE MODAL */}
      <AnimatePresence>
        {isPhoneModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPhoneModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 14 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-slate-100"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Business Phone</p>
                  {hasCallablePhone ? (
                    <a
                      href={`tel:${normalizedPhone}`}
                      className="text-xl font-black text-slate-900 mt-1 break-words leading-tight hover:text-blue-600 transition-colors block"
                    >
                      {rawContactPhone || 'Not Available'}
                    </a>
                  ) : (
                    <h3 className="text-xl font-black text-slate-900 mt-1 break-words leading-tight">{rawContactPhone || 'Not Available'}</h3>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-100 hover:bg-rose-50 rounded-full p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="w-11 h-11 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center"
                  aria-label="Copy phone number"
                  title="Copy phone number"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V5a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
                    <rect x="3" y="7" width="13" height="13" rx="2" ry="2" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function ServiceDetail({ params }: { params: any }) {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}><ServiceDetailContent params={params} /></Suspense>;
}
