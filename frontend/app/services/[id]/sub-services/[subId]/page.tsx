'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { servicesAPI, bookingsAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

const DEMO_SERVICES = [
  { id: '1', name: 'Elite Home Cleaning', category: 'Cleaning', city: 'Laguna Niguel', state: 'CA', phone: '(555) 123-4567', email: 'contact@elitecleaning.com', address: '123 Clean Ave, Laguna Niguel, CA', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952' },
  { id: '2', name: 'Master Sparky Electrical', category: 'Electrical', city: 'Laguna Niguel', state: 'CA', phone: '(555) 987-6543', email: 'info@mastersparky.com', address: '456 Spark St, Laguna Niguel, CA', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e' },
  { id: '3', name: 'Royal Touch Salon', category: 'Salon', city: 'Laguna Niguel', state: 'CA', phone: '(555) 321-0987', email: 'appointments@royaltouch.com', address: '789 Beauty Blvd, Laguna Niguel, CA', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035' },
  { id: '4', name: 'Precision Plumbing Co.', category: 'Plumbing', city: 'Laguna Niguel', state: 'CA', phone: '(555) 444-5555', email: 'help@precisionplumbing.com', address: 'Laguna Niguel, California, United States', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a' },
  { id: '5', name: 'A+ Academic Tutors', category: 'Tutoring', city: 'Laguna Niguel', state: 'CA', phone: '(555) 222-3333', email: 'learn@aplustutors.com', address: '101 Education Way, Laguna Niguel, CA', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644' },
];

export default function SubServiceLanding({ params }: { params: { id: string, subId: string } }) {
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const subServiceName = params.subId.split('-').map(word => Math.abs(word.length) > 0 ? word[0].toUpperCase() + word.slice(1) : word).join(' ');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchParentService = async () => {
      try {
        const res = await servicesAPI.getById(params.id);
        const data = res.data;
        const normalizedService = {
          ...data,
          name: data.title || data.name || "Business Name",
          phone: data.contact_phone || data.phone || "Not Provided",
          email: data.contact_email || data.email || "contact@example.com",
          address: data.address || data.city + ', ' + data.state,
          mapUrl: data.google_maps_url || data.mapUrl,
          image: data.image_url || data.image,
        };
        setService(normalizedService);
      } catch (err) {
        // Find in Demo Services correctly!
        const demo = DEMO_SERVICES.find(s => s.id === params.id);
        if (demo) {
          setService(demo);
        } else {
          setService({
            name: "Premium Services Co.",
            phone: "1-800-123-4567",
            email: "info@example.com",
            address: "City, State",
            category: "Professional Services"
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchParentService();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await bookingsAPI.create({
        service_id: params.id,
        service_name: `${service?.name || 'Service'} - ${subServiceName}`,
        user_name: form.name,
        user_email: form.email,
        user_phone: form.phone,
        user_city: form.city,
        message: form.message
      });
      toast.success('Your inquiry has been sent successfully! The business will contact you soon.');
      setForm({ name: '', email: '', phone: '', city: '', message: '' });
    } catch (err) {
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Header />
      
      {/* Top Contact Bar */}
      <div className="bg-[#1a2b4c] text-white py-3 px-6 hidden sm:flex justify-end gap-8 text-sm font-medium">
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
          Call Us: {service?.phone}
        </span>
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
          {service?.email}
        </span>
      </div>

      <main className="flex-grow w-full">
        {/* Modern Hero Section */}
        <section className="relative w-full py-20 lg:py-32 bg-[#1a2b4c] overflow-hidden">
          <div className="absolute inset-0 opacity-20">
             <img src={service?.image || "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=1600&q=80"} className="w-full h-full object-cover" alt="Background" />
          </div>
          <div className="container-max relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-white">
            <div className="max-w-2xl">
              <Link href={`/services/${params.id}`} className="inline-block text-blue-400 font-semibold mb-4 hover:text-blue-300 transition-colors">
                ← Back to {service?.name}
              </Link>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                {subServiceName}
              </h1>
              <p className="text-xl text-blue-100 mb-8 font-light">
                Professional and reliable {service?.category?.toLowerCase() || 'services'} in {service?.address}. We deliver exceptional results according to your expectations.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-transform transform hover:-translate-y-0.5 shadow-lg"
                >
                  Request a Quote
                </button>
                <a 
                  href={`tel:${service?.phone}`} 
                  className="px-8 py-3.5 bg-white text-[#1a2b4c] hover:bg-gray-100 hover:text-blue-700 font-bold rounded-lg transition-transform transform hover:-translate-y-0.5 shadow-lg"
                >
                  {service?.phone}
                </a>
              </div>
            </div>
            {/* Callout Card */}
            <div className="hidden lg:block w-96 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl">
              <h3 className="text-xl font-bold mb-3">Why Choose Us?</h3>
              <ul className="space-y-3 font-medium text-blue-50">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✔</span> Experienced Professionals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✔</span> Highly Economical Rates
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✔</span> 100% Satisfaction Guarantee
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✔</span> Trusted Local Service
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Info Blocks / Modern Gallery */}
        <section className="py-20 container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1a2b4c] mb-6">Your Local Experts for {subServiceName}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                When it comes to {service?.category?.toLowerCase() || 'professional'} solutions, you need a team you can completely trust. We have spent years perfecting our craft, ensuring that every client receives personalized attention and premium results.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                {service?.category === 'Plumbing' && "From minor leaks to major pipe bursts, our licensed plumbers are equipped to handle any emergency. We ensure your home's water systems run flawlessly."}
                {service?.category === 'Salon' && "Experience luxury and rejuvenation. Our expert stylists and beauticians use top-tier products to make you look and feel your absolute best."}
                {service?.category === 'Tutoring' && "We believe every student has massive potential. Our personalized teaching methods and dedicated instructors guarantee academic improvement and lasting confidence."}
                {service?.category === 'Cleaning' && "A clean space is a happy space. Our thorough, eco-friendly cleaning staff will leave your home or office spotless and completely sanitized."}
                {service?.category === 'Electrical' && "Safety is our priority. Whether it's a simple fixture installation or complete rewiring, our certified electricians deliver up-to-code precision."}
                {service?.category === 'Other' && "Whatever your needs are, our dedicated professionals are here to provide top-notch service that exceeds your expectations."}
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">★</div>
                  <h4 className="font-bold text-gray-800">Top Rated</h4>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    {service?.category === 'Tutoring' || service?.category === 'Salon' ? '♥' : '⏱'}
                  </div>
                  <h4 className="font-bold text-gray-800">
                    {service?.category === 'Tutoring' || service?.category === 'Salon' ? 'Client Care' : 'Fast Response'}
                  </h4>
                </div>
              </div>
            </div>
            
            {/* Gallery Images */}
            <div className="grid grid-cols-2 gap-4">
              {service?.gallery && service.gallery.length > 0 ? (
                service.gallery.slice(0, 4).map((url: string, i: number) => (
                  <div key={i} className={`relative group cursor-zoom-in active:scale-95 transition-all ${i % 2 !== 0 ? 'mt-8' : ''}`}>
                    <img 
                      src={url} 
                      alt={`Work ${i}`} 
                      onClick={() => setSelectedImage(url)}
                      className="w-full h-64 object-cover rounded-3xl shadow-md transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none flex items-center justify-center">
                       <span className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 text-white">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                       </span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {service?.category === 'Plumbing' && (
                    <>
                      <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" alt="Plumbing Work" className="w-full h-64 object-cover rounded-3xl shadow-md mt-8" />
                      <img src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80" alt="Plumbing Pipes" className="w-full h-64 object-cover rounded-3xl shadow-md" />
                    </>
                  )}
                  {service?.category === 'Cleaning' && (
                    <>
                      <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80" alt="House Cleaning" className="w-full h-64 object-cover rounded-3xl shadow-md mt-8" />
                      <img src="https://images.unsplash.com/photo-1527515637-1249b6574f26?auto=format&fit=crop&w=600&q=80" alt="Vacuuming" className="w-full h-64 object-cover rounded-3xl shadow-md" />
                    </>
                  )}
                  {service?.category === 'Salon' && (
                    <>
                      <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80" alt="Salon styling" className="w-full h-64 object-cover rounded-3xl shadow-md mt-8" />
                      <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80" alt="Salon tools" className="w-full h-64 object-cover rounded-3xl shadow-md" />
                    </>
                  )}
                  {service?.category === 'Electrical' && (
                    <>
                      <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80" alt="Electrical Work" className="w-full h-64 object-cover rounded-3xl shadow-md mt-8" />
                      <img src="https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=600&q=80" alt="Wires" className="w-full h-64 object-cover rounded-3xl shadow-md" />
                    </>
                  )}
                  {service?.category === 'Tutoring' && (
                    <>
                      <img src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80" alt="Studying" className="w-full h-64 object-cover rounded-3xl shadow-md mt-8" />
                      <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80" alt="Group Study" className="w-full h-64 object-cover rounded-3xl shadow-md" />
                    </>
                  )}
                  {(!['Plumbing', 'Cleaning', 'Salon', 'Electrical', 'Tutoring'].includes(service?.category)) && (
                    <>
                      <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" alt="Professional Service" className="w-full h-64 object-cover rounded-3xl shadow-md mt-8" />
                      <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80" alt="Team" className="w-full h-64 object-cover rounded-3xl shadow-md" />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Feature List Section with a sleek gray background */}
        <section className="py-20 bg-slate-100">
          <div className="container-max text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1a2b4c] mb-12">
              Advantages Of Choosing Our {service?.category} Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              {[
                { title: "Targeted Solutions", text: "We provide highly specific solutions tailored exactly to your requirements." },
                { title: "Budget Friendly", text: "Our rates are highly economical without compromising on service quality." },
                { title: "Skilled " + (service?.category === 'Salon' ? 'Stylists' : service?.category === 'Tutoring' ? 'Tutors' : 'Professionals'), text: "Our team consists of highly trained and fully equipped experts." },
                { title: "Diverse Range", text: "We offer an extensive and detailed range of related services under one roof." },
                { title: service?.category === 'Salon' || service?.category === 'Tutoring' ? "Flexible Scheduling" : "Emergency Available", text: "We accommodate your schedule to provide convenient and friendly service." },
                { title: "Total Satisfaction", text: "We strive for complete satisfaction to ensure you become a returning client." },
              ].map((feat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <h4 className="text-lg font-bold text-blue-700 mb-2">{feat.title}</h4>
                  <p className="text-sm text-gray-600">{feat.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact form and Map Section Modernized */}
        <section id="inquiry-form" className="py-24 bg-white border-t border-gray-100">
          <div className="container-max">
            <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              
              {/* Map Column */}
              <div className="w-full lg:w-2/5 min-h-[400px] bg-slate-200 relative">
                {service?.mapUrl ? (
                  <iframe 
                    src={service.mapUrl} 
                    className="absolute inset-0 w-full h-full" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-500 bg-slate-100 p-8 text-center">
                    <svg className="w-12 h-12 mb-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                    <span>Location Map Unavailable</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 backdrop-blur-sm text-white p-6">
                  <h3 className="font-bold text-xl mb-1">Find Us</h3>
                  <p className="text-sm opacity-90">{service?.address}</p>
                </div>
              </div>

              {/* Form Column */}
              <div className="w-full lg:w-3/5 p-8 lg:p-12">
                <h2 className="text-3xl font-bold text-[#1a2b4c] mb-2">Get Started Today</h2>
                <p className="text-gray-500 mb-8">Fill out the form below and our team will get back to you promptly.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your City *</label>
                    <input type="text" name="city" value={form.city} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Lahore, Karachi, Rawalpindi" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">How can we help? (Message)</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={4} required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                  </div>
                  
                  <div className="pt-2">
                    <button type="submit" disabled={submitting} className="w-full sm:w-auto px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-transform transform hover:-translate-y-0.5 shadow-md disabled:opacity-50">
                      {submitting ? 'Sending Request...' : 'Send Inquiry'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Related Services Bar */}
      {service && (
        <div className="bg-[#1a2b4c] text-white py-8 border-t border-blue-900">
          <div className="container-max">
            <h3 className="text-lg font-bold mb-4 text-blue-200">More Services by {service.name}:</h3>
            <div className="flex flex-wrap gap-3">
              {(
                service.sub_services?.length > 0 ? service.sub_services :
                service.category === 'Plumbing' ? ['Residential Plumbing', 'Emergency 24/7 Service', 'Drain Cleaning'] :
                service.category === 'Cleaning' ? ['Deep Home Cleaning', 'Move In/Out Cleaning', 'Office Sanitization'] :
                service.category === 'Salon' ? ['Hair Styling & Color', 'Bridal Makeup', 'Spa & Massage'] :
                service.category === 'Electrical' ? ['Wiring & Installations', 'Emergency Repairs', 'Lighting Solutions'] :
                service.category === 'Tutoring' ? ['Private Home Tutoring', 'Exam Preparation', 'Online Sessions'] :
                ['Professional Services', 'Consultation Booking', 'Premium Solutions']
              ).map((name: string, i: number) => {
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const isCurrent = slug === params.subId;
                return (
                  <Link
                    key={i}
                    href={`/services/${params.id}/sub-services/${slug}`}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                      isCurrent
                        ? 'bg-blue-500 border-blue-400 text-white cursor-default'
                        : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {name}
                  </Link>
                );
              })}
            </div>
            <Link href={`/services/${params.id}`} className="inline-block mt-4 text-blue-400 hover:text-blue-200 text-sm font-medium transition-colors">
              ← View full profile of {service.name}
            </Link>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full z-[110]"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          
          <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center shadow-2xl animate-in zoom-in duration-300">
             <img 
               src={selectedImage} 
               alt="Gallery FullView" 
               className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             />
          </div>
          
          <div className="absolute bottom-10 left-0 right-0 text-center text-white/50 text-sm font-medium">Click outside to close</div>
        </div>
      )}

      <Footer />
    </div>
  );
}
