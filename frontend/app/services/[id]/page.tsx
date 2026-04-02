'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { servicesAPI, inquiriesAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const INITIAL_REVIEWS_COUNT = 4;

function ServiceDetailContent() {
  const [serviceId, setServiceId] = useState('');

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

  useEffect(() => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const servicesIndex = pathSegments.indexOf('services');
    if (servicesIndex >= 0 && pathSegments[servicesIndex + 1]) {
      setServiceId(decodeURIComponent(pathSegments[servicesIndex + 1]));
    }
  }, []);

  const handleCopyPhone = async () => {
    const raw = String(service?.contact_phone || '').trim();
    if (!raw) {
      toast.error('Phone number is not available.');
      return;
    }
    try {
      await navigator.clipboard.writeText(raw);
      toast.success('Phone number copied.');
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
      const [serviceRes, reviewsRes] = await Promise.all([
        servicesAPI.getById(id),
        servicesAPI.getReviews(id)
      ]);
      setService(serviceRes.data);
      setReviews(reviewsRes.data);
      setActiveImage(serviceRes.data.image_url || serviceRes.data.image);
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
      const res = await servicesAPI.postReview(serviceId, reviewForm);
      toast.success('Review posted successfully');
      setReviews(prev => [res.data, ...prev]);
      setReviewForm({ user_name: '', user_email: '', rating: 5, comment: '' });
      fetchServiceData(serviceId); // Refresh to update average rating
    } catch (error: any) {
      toast.error('Error posting review');
    } finally {
      setIsPosting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wordCount = bookingForm.message.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 30) return toast.error("Message must be at least 30 words.");
    if (wordCount > 500) return toast.error("Message cannot exceed 500 words.");

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

  const addressString = `${service.address || ''} ${service.city || ''} ${service.state || ''}`.trim();
  const allImages = [service.image_url || service.image, ...(service.gallery || [])].filter(Boolean);
  const rawContactPhone = String(service.contact_phone || '').trim();
  const normalizedPhone = rawContactPhone.startsWith('+')
    ? `+${rawContactPhone.slice(1).replace(/\D/g, '')}`
    : rawContactPhone.replace(/\D/g, '');
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
      const matches = Array.from(todayHoursStr.matchAll(timeRegex));
      
      if (matches.length < 2) {
        statusObj = { status: 'Open', color: 'text-blue-500', businessDay };
      } else {
        const parseMatch = (m: RegExpMatchArray) => {
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

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-[8.5rem] pb-20">
        <div className="container-max px-4 relative">
          <div className="pointer-events-none absolute -top-10 right-0 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl" />

          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-2 py-2 px-5 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
          </div>
          {/* HEADER SECTION */}
          <div className="border-b border-slate-200 pb-10 mb-10 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 uppercase tracking-tight">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-none">{service.title}</h1>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < Math.round(service.avg_rating || 0) ? 'fill-current' : 'fill-slate-200'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                    ))}
                  </div>
                  <span>{service.reviews_count || 0} Reviews</span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-slate-500">{service.category}</span>
                </div>
              </div>
                <div className="grid grid-cols-3 gap-2 w-full md:max-w-[560px]">
                  <button onClick={() => reviewFormRef.current?.scrollIntoView({ behavior: 'smooth' })} className="justify-center px-3 sm:px-4 py-2.5 border-2 border-[#1e293b] text-[#1e293b] font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap bg-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Add a Review
                  </button>
                  <button 
                    onClick={() => setIsPhoneModalOpen(true)}
                    className="justify-center px-3 sm:px-4 py-2.5 border-2 border-[#1e293b] text-[#1e293b] font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap bg-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Call Now
                  </button>
                  <button onClick={() => setIsModalOpen(true)} className="justify-center px-3 sm:px-4 py-2.5 border-2 border-[#1e293b] text-[#1e293b] font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap bg-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Email Us
                  </button>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            <div className="lg:col-span-8 space-y-12">

              {/* IMAGE SLIDER */}
              <section>
                <div className="relative group rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-lg mb-6">
                  <div className="h-[450px] md:h-[550px] w-full relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImage}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        src={activeImage || ''}
                        className="w-full h-full object-cover"
                        alt="Main Slider"
                      />
                    </AnimatePresence>

                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const idx = allImages.indexOf(activeImage);
                            setActiveImage(allImages[(idx - 1 + allImages.length) % allImages.length]);
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-xl z-20"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                          onClick={() => {
                            const idx = allImages.indexOf(activeImage);
                            setActiveImage(allImages[(idx + 1) % allImages.length]);
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-xl z-20"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {allImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-4 mb-10 no-scrollbar justify-center">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(img)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl border-4 transition-all duration-300 ${activeImage === img ? 'border-blue-600 scale-105' : 'border-white opacity-60'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm mb-12">
                  <h2 className="text-2xl font-black text-[#0f2340] mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-blue-600 rounded-full" />
                    Business Description
                  </h2>
                  <p className="text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-line">{service.description}</p>
                </div>
              </section>

              {/* REVIEWS DISPLAY */}
              <section className="space-y-8 pt-12 border-t border-slate-100 bg-slate-50/50 rounded-[3rem] p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Customer Feedback</h2>
                  <p className="text-sm text-slate-500 font-medium tracking-tight">Real experiences from our community.</p>
                </div>
                <div className="space-y-6">
                  {reviews.length > 0 ? visibleReviews.map((rev: any, i: number) => (
                    <div key={i} className="bg-[#fcfdfe] border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, s) => (
                              <svg key={s} className={`w-4 h-4 ${s < Math.round(rev.rating || 0) ? 'text-amber-400 fill-current' : 'text-slate-200 fill-current'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                            ))}
                            <span className="ml-2 text-xs font-black text-slate-400 uppercase tracking-widest">{Number(rev.rating || 0).toFixed(1)} / 5.0</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-800 leading-relaxed font-bold uppercase tracking-tight" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                          "{rev.comment}"
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{rev.user_name || 'Verified User'}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(rev.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No reviews yet.</p>
                      <button onClick={() => reviewFormRef.current?.scrollIntoView({ behavior: 'smooth' })} className="mt-2 text-blue-600 font-bold text-xs uppercase tracking-widest">Be the first to review</button>
                    </div>
                  )}
                </div>
                {canShowMoreReviews && (
                  <button
                    onClick={() => setVisibleReviewsCount(prev => prev + INITIAL_REVIEWS_COUNT)}
                    className="mx-auto block px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-all"
                  >
                    Show More Reviews
                  </button>
                )}
                {canShowLessReviews && (
                  <button
                    onClick={() => setVisibleReviewsCount(INITIAL_REVIEWS_COUNT)}
                    className="mx-auto block px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-all"
                  >
                    Show Less
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

            {/* SIDEBAR */}
            <div className="lg:col-span-4 space-y-10">

              <div className="border border-slate-100 rounded-2xl p-2 bg-white shadow-sm overflow-hidden">
                <div className="h-48 bg-slate-50 rounded overflow-hidden">
                  {hasGoogleMap ? (
                    <iframe
                      src={String(service.google_maps_url).replace('/maps/', '/maps/embed/').split('?')[0] + '?output=embed'}
                      className="w-full h-full border-0 grayscale opacity-80" allowFullScreen loading="lazy"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center px-5 text-center bg-slate-100">
                      <div>
                        <p className="text-slate-500 font-bold text-sm">Location is not available right now</p>
                        <p className="text-slate-400 text-xs mt-1">The business has not added Google Map location yet.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 text-[10px] font-black text-slate-400 uppercase flex items-start gap-2 pt-4 leading-relaxed">
                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {addressString || 'Address Unlisted'}
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

            </div>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyPhone();
              }}
              className="bg-white rounded-xl p-6 w-full max-w-[260px] shadow-lg text-center cursor-pointer hover:bg-slate-50 transition-all border border-slate-100 group"
            >
              <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Contact Number</h3>
              <p className="text-2xl font-black text-blue-600 tracking-tighter group-active:scale-95 transition-transform">{rawContactPhone || 'Not Listed'}</p>
              <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-widest">Click anywhere to copy</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ServiceDetail() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}><ServiceDetailContent /></Suspense>;
}
