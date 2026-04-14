'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FormattedDescription from '@/components/FormattedDescription';
import ListingOwnerEmailForm from '@/components/ListingOwnerEmailForm';
import { resolveMediaUrl, servicesAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

function ServiceAdditionalDetailsContent({ params }: { params: any }) {
  const rawServiceId = params?.id;
  const serviceId = rawServiceId ? decodeURIComponent(String(rawServiceId)) : '';

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      fetchServiceData(serviceId);
    }
  }, [serviceId]);

  const fetchServiceData = async (id: string) => {
    try {
      setLoading(true);
      const res = await servicesAPI.getById(id);
      const normalizedService = {
        ...res.data,
        image_url: resolveMediaUrl(res.data?.image_url || res.data?.image),
        gallery: Array.isArray(res.data?.gallery)
          ? res.data.gallery.map((img: any) => resolveMediaUrl(String(img || ''))).filter(Boolean)
          : [],
        contact_email: String(res.data?.contact_email || '').trim(),
        website_url: String(res.data?.website_url || '').trim(),
        contact_phone: String(res.data?.contact_phone || '').trim(),
        address: String(res.data?.address || '').trim(),
      };
      setService(normalizedService);
    } catch (error) {
      console.error('Error fetching details', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold text-blue-500 animate-pulse text-sm uppercase tracking-widest"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>Loading Details...</div>;
  if (!service) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Service Not Found</div>;

  const allImages = Array.from(new Set([service.image_url || service.image, ...(service.gallery || [])].filter(Boolean)));
  const addressString = `${service.address || ''} ${service.city || ''} ${service.state || ''} ${service.postal_code || ''} ${service.country || ''}`.trim();
  const rawContactPhone = String(service.contact_phone || '').trim();
  const normalizedDialPhone = rawContactPhone.startsWith('+')
    ? `+${rawContactPhone.slice(1).replace(/\D/g, '')}`
    : rawContactPhone.replace(/\D/g, '');

  const phoneHref = normalizedDialPhone ? `tel:${normalizedDialPhone}` : '';

  return (
    <div className="bg-[#f4f9ff] min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-[11rem] pb-20">
        {/* HERO SECTION */}
        <div className="bg-[#2f74c8] relative overflow-hidden text-white pt-8 pb-12 px-4 rounded-b-[2rem] md:rounded-b-[3rem] mb-12 shadow-2xl">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-300/35 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-300/25 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
          
          <div className="container-max relative z-10 max-w-5xl mx-auto">
            {/* GO BACK BUTTON REMOVED (Now in Header) */}

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-3">{service.title}</h1>
            <p className="text-sky-100 font-medium tracking-wide text-base md:text-lg max-w-2xl">Dive deeper into what makes us different. Explore our portfolio, read our highlights, and get in touch.</p>
          </div>
        </div>

        <div className="container-max px-4 max-w-5xl mx-auto space-y-24">

          {/* PORTFOLIO / GALLERY */}
          <section id="gallery">
            <div className="flex items-center gap-4 mb-10 text-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 hidden">
                 {/* icon if centered */}
              </div>
              <h2 className="text-4xl font-black text-slate-800 relative z-10">
                <span className="relative inline-block">
                  Photo Gallery
                  <span className="absolute -bottom-2 left-0 w-1/2 h-2 bg-indigo-200 rounded-full -z-10" />
                </span>
              </h2>
            </div>

            {allImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {allImages.map((img, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.35, delay: i * 0.03, ease: 'easeOut' }}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer bg-slate-100/60 shadow-sm border border-slate-200/60 transform transition-all duration-500 hover:-translate-y-1 hover:shadow-xl aspect-square flex items-center justify-center p-2 md:p-3"
                  >
                    <img src={img} className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-black/5 transition-transform duration-700 group-hover:scale-105" alt={`Portfolio item ${i + 1}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end rounded-2xl">
                      <div className="p-4 w-full flex justify-end">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-200 border-dashed shadow-sm">
                <p className="text-6xl mb-6 opacity-30">🖼️</p>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No visual portfolio available</p>
              </div>
            )}
          </section>

          {/* WHY CHOOSE US - HIGHLIGHTS */}
          <section>
            <div className="flex flex-col md:flex-row items-center gap-10 bg-white p-6 sm:p-10 md:p-14 rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-lg relative overflow-hidden">
              {/* Abstract decorative shape */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="w-full md:w-1/3 relative z-10 text-center md:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-4 text-balance">The Highlights & Features</h2>
                <p className="text-slate-500 font-medium">What makes our service stand out from the rest. Here is why you should pick us.</p>
              </div>

              <div className="w-full md:w-2/3 relative z-10">
                {service.service_details ? (
                  <div className="bg-blue-50/60 p-6 sm:p-8 rounded-3xl border border-blue-100/70 hover:bg-white hover:shadow-xl transition-all duration-300">
                    <FormattedDescription 
                      text={service.service_details} 
                      className="text-slate-700 font-medium text-lg leading-relaxed" 
                    />
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200">
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No detailed highlights added yet</p>
                  </div>
                )}
              </div>
            </div>
          </section>



          {/* CONTACT INFO GRID */}
          <section>
            <div className="flex items-center justify-between gap-4 mb-10">
              <h2 className="text-3xl font-black text-slate-800">Let&apos;s Connect</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {phoneHref && (
                <a href={phoneHref} className="flex items-start gap-5 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 shadow-transparent">Direct Phone</p>
                    <p className="text-xl font-black text-slate-800">{rawContactPhone}</p>
                  </div>
                </a>
              )}

              {service.contact_email && (
                <div className="flex items-start gap-5 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Email</p>
                    <p className="text-lg font-black text-slate-800 truncate">{service.contact_email}</p>
                  </div>
                </div>
              )}

              {service.website_url && (
                <a href={service.website_url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-5 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Website</p>
                    <p className="text-lg font-black text-blue-600 group-hover:underline truncate">{service.website_url}</p>
                  </div>
                </a>
              )}

              {addressString && (
                <div className="flex items-start gap-5 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group md:col-span-2 lg:col-span-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Headquarters</p>
                    <p className="text-base font-semibold text-slate-700 leading-snug">{addressString}</p>
                  </div>
                </div>
              )}
            </div>

            {!rawContactPhone && !service.contact_email && !service.website_url && !addressString && (
               <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                 <p className="text-5xl mb-4 opacity-50">📞</p>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No contact info provided</p>
               </div>
            )}

            {/* Simple Email Inquiry Form for all listings */}
            <ListingOwnerEmailForm serviceId={serviceId} serviceName={service.title || 'Service'} />
          </section>

        </div>
      </main>

      <Footer />

      {/* FULL SCREEN IMAGE VIEWER MODAL */}
      <AnimatePresence>
        {activeImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setActiveImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-6xl w-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img src={activeImage} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" alt="Fullscreen View" />
              
              {/* Controls */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = allImages.indexOf(activeImage);
                      setActiveImage(allImages[(idx - 1 + allImages.length) % allImages.length]);
                    }}
                    className="absolute left-4 md:-left-16 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 border border-white/10 hover:scale-110"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = allImages.indexOf(activeImage);
                      setActiveImage(allImages[(idx + 1) % allImages.length]);
                    }}
                    className="absolute right-4 md:-right-16 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 border border-white/10 hover:scale-110"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full tracking-widest border border-white/10">
                    {allImages.indexOf(activeImage) + 1} / {allImages.length}
                  </div>
                </>
              )}

              <button 
                onClick={() => setActiveImage(null)}
                className="absolute -top-12 right-0 md:-right-12 md:-top-10 bg-white/10 hover:bg-rose-500 hover:text-white text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-white/10"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ServiceAdditionalDetails({ params }: { params: any }) {
  return (
    <Suspense fallback={<div className="h-screen flex flex-col items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div><span className="font-bold text-blue-500 uppercase tracking-widest text-sm">Loading Environment</span></div>}>
      <ServiceAdditionalDetailsContent params={params} />
    </Suspense>
  );
}
