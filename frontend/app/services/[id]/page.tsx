'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

// Demo data matching our home page listings
const MOCK_HOURS = {
  "Monday": "9am to 6pm",
  "Tuesday": "9am to 6pm",
  "Wednesday": "9am to 6pm",
  "Thursday": "9am to 6pm",
  "Friday": "9am to 6pm",
  "Saturday": "Closed",
  "Sunday": "Closed"
};

const MOCK_MAP = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3314.341499553648!2d-117.71262842426613!3d33.52844837500174!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80ce27d81a938add%3A0xc34a4086ad49aa84!2sLaguna%20Niguel%2C%20CA%2092677%2C%20USA!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s";

const SERVICES_DATA: Record<string, any> = {
  "1": {
    name: "Elite Home Cleaning",
    category: "Cleaning",
    price: "$80/hr",
    rating: 4.9,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    description: "Experience a spotless home with our premium cleaning service. We provide deep cleaning for residences of all sizes using eco-friendly products. Our team is fully insured and background-checked.",
    features: ["Kitchen Deep Clean", "Bathroom Sanitization", "Dusting & Vacuuming", "Window Cleaning (Internal)"],
    tag: "Top Rated",
    address: "123 Clean Ave, Laguna Niguel, CA",
    phone: "(555) 123-4567",
    email: "contact@elitecleaning.com",
    hours: MOCK_HOURS,
    mapUrl: MOCK_MAP
  },
  "2": {
    name: "Master Sparky Electrical",
    category: "Electrical",
    price: "From $95",
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    description: "Professional electrical services for common household issues. From fixing lights to rewiring projects, our certified electricians ensure safety and quality in every job.",
    features: ["Emergency Repairs", "Smart Home Installation", "Safety Inspections", "Lighting Upgrades"],
    tag: "Verified",
    address: "456 Spark St, Laguna Niguel, CA",
    phone: "(555) 987-6543",
    email: "info@mastersparky.com",
    hours: MOCK_HOURS,
    mapUrl: MOCK_MAP
  },
  "3": {
    name: "Royal Touch Salon",
    category: "Salon",
    price: "From $45",
    rating: 4.7,
    reviews: 210,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    description: "Get a luxury salon experience at home or in-studio. We specialize in creative styling, coloring, and personalized hair care treatments for all hair types.",
    features: ["Hair Styling & Cut", "Deep Conditioning", "Bridal Makeup", "Skin Treatments"],
    tag: "Trending",
    address: "789 Beauty Blvd, Laguna Niguel, CA",
    phone: "(555) 321-0987",
    email: "appointments@royaltouch.com",
    hours: MOCK_HOURS,
    mapUrl: MOCK_MAP
  },
  "4": {
    name: "Precision Plumbing Co.",
    category: "Plumbing",
    price: "From $75",
    rating: 4.9,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    description: "Precision Plumbing is a professional plumbing service provider dedicated to delivering top-quality solutions for all your plumbing needs. With a team of skilled technicians and years of experience, we offer a range of services, including plumbing repairs, installations, and maintenance. Trust us to provide you with reliable and efficient plumbing solutions every time.",
    features: ["Leak Detection", "Pipe Replacement", "Water Heater Repair", "Drain Unblocking"],
    tag: "Admin Choice",
    address: "Laguna Niguel, California, United States",
    phone: "(555) 444-5555",
    email: "help@precisionplumbing.com",
    hours: MOCK_HOURS,
    mapUrl: MOCK_MAP
  },
  "5": {
    name: "A+ Academic Tutors",
    category: "Tutoring",
    price: "$50/hr",
    rating: 5.0,
    reviews: 42,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    description: "Personalized tutoring for students of all ages. We focus on core subjects like Math, Science, and English, helping you achieve your academic goals with ease.",
    features: ["One-on-One Tutoring", "Exam Preparation", "Homework Help", "Custom Study Plans"],
    tag: "Expert",
    address: "101 Education Way, Laguna Niguel, CA",
    phone: "(555) 222-3333",
    email: "learn@aplustutors.com",
    hours: MOCK_HOURS,
    mapUrl: MOCK_MAP
  }
};

import { useState, useEffect } from 'react';
import { servicesAPI } from '@/lib/api';

export default function ServiceDetail({ params }: { params: { id: string } }) {
  const [service, setService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFnd, setNotFnd] = useState(false);
  
  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Try fetching from backend/API first
      let fetchedService;
      try {
        const res = await servicesAPI.getById(params.id);
        fetchedService = res.data;
      } catch (err) {
        // Fallback to demo data
        fetchedService = SERVICES_DATA[params.id];
      }

      if (!fetchedService) {
        setNotFnd(true);
        setLoading(false);
        return;
      }

      // Normalize fields between Demo Data and API Model
      const normalizedService = {
        ...fetchedService,
        name: fetchedService.title || fetchedService.name,
        phone: fetchedService.contact_phone || fetchedService.phone,
        email: fetchedService.contact_email || fetchedService.email,
        address: fetchedService.address || fetchedService.city + ', ' + fetchedService.state,
        mapUrl: fetchedService.google_maps_url || fetchedService.mapUrl,
        hours: fetchedService.business_hours || fetchedService.hours || MOCK_HOURS,
        image: fetchedService.image_url || fetchedService.image,
        rating: fetchedService.rating || 5.0,
      };

      setService(normalizedService);

      // Fetch reviews
      try {
        const revRes = await servicesAPI.getReviews(params.id);
        setReviews(revRes.data || []);
      } catch (e) {
        console.error("Failed to load reviews");
      }
    } catch (error) {
      console.error(error);
      setNotFnd(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewEmail || !reviewComment) {
      alert("Please fill in all review fields.");
      return;
    }
    try {
      setIsSubmitting(true);
      const newReview = {
        service_id: params.id,
        user_name: reviewName,
        user_email: reviewEmail,
        rating: reviewRating,
        comment: reviewComment,
      };
      
      const res = await servicesAPI.addReview(params.id, newReview);
      setReviews([res.data, ...reviews]);
      
      // Reset form
      setReviewName('');
      setReviewEmail('');
      setReviewComment('');
      setReviewRating(5);
      alert("Review posted successfully!");
    } catch (err) {
      alert("Failed to post review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFnd || !service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container-max py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Service Not Found</h1>
          <Link href="/" className="text-blue-600 font-bold hover:underline">Return to Home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-[#f8f9fa] pb-20 min-h-screen">
        {/* Breadcrumb Navbar */}
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="container-max text-sm text-gray-600 font-medium">
            <Link href="/" className="hover:text-blue-600">🏠 Home Improvement & Contractors</Link> 
            <span className="mx-2">|</span> 
            <Link href="/services" className="hover:text-blue-600">{service.category}</Link>
            <span className="mx-2">|</span> 
            <span className="text-red-500">{service.name}</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="bg-white py-8 border-b border-gray-200">
          <div className="container-max flex flex-col md:flex-row gap-8 items-start">
            {/* Logo Placeholder */}
            <div className="w-40 h-32 flex-shrink-0 bg-white border border-gray-100 shadow-sm rounded-lg flex items-center justify-center p-4">
              <h2 className="text-2xl font-bold text-gray-400 text-center leading-tight">{service.name.split(' ').slice(0,2).join(' ')}</h2>
            </div>
            
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-[#1a2b4c] mb-2">{service.name}</h1>
              
              <div className="flex items-center gap-3 text-sm mb-6">
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  <span className="text-blue-700 font-black mr-2 text-lg">{(service.avg_rating || 5.0).toFixed(1)}</span>
                  <span className="text-yellow-400 text-lg">{'★'.repeat(Math.round(service.avg_rating || 5))}{'☆'.repeat(5-Math.round(service.avg_rating || 5))}</span>
                </div>
                <span className="text-slate-400 font-medium">({service.reviews_count || reviews.length} Reviews)</span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Add a Review
                </button>
                <a href={service.phone ? `tel:${service.phone}` : '#'} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  Call Now
                </a>
                <a href={service.email ? `mailto:${service.email}` : '#'} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Email Us
                </a>
                {service.mapUrl && (
                  <a href={service.mapUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Get Directions
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container-max mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-[22px] font-normal text-[#1a2b4c] mb-4">Business Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed font-normal whitespace-pre-line">
                {service.description}
              </p>
            </div>

            {/* Image Gallery */}
            {service.gallery && service.gallery.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-[22px] font-normal text-[#1a2b4c] mb-6">Photo Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {service.gallery.map((url: string, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedImage(url)}
                      className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-zoom-in active:scale-95 transition-transform"
                    >
                      <img 
                        src={url} 
                        alt={`Gallery ${i}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div>
              <h2 className="text-[22px] font-normal text-[#1a2b4c] mb-4">Reviews ({reviews.length})</h2>
              
              {reviews.length === 0 ? (
                <p className="text-gray-500 mb-8 italic">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="border border-gray-200 rounded bg-gray-50/50 mb-8 max-h-[500px] overflow-y-auto">
                  {reviews.map((rev, idx) => (
                    <div key={idx} className="border-b border-gray-200/60 last:border-0">
                      <div className="p-4 border-b border-gray-100 bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl font-light text-[#1a2b4c]">{rev.rating.toFixed(1)}</span>
                            <div>
                              <p className="font-medium text-sm text-gray-800">{rev.user_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{new Date(rev.created_at || rev.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            Rating {rev.rating.toFixed(1)} <span className="text-yellow-400">{'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">
                          {rev.comment}
                        </p>
                        <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                          <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-2 py-1 rounded transition-colors">Helpful?</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Post Review Form */}
              <div id="review-form">
                <h2 className="text-[18px] font-normal text-[#1a2b4c] mb-3">Post a review</h2>
                
                <form onSubmit={handlePostReview} className="space-y-4 bg-white p-6 border border-gray-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                    <select 
                      value={reviewRating} 
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="border border-gray-300 rounded p-1 text-sm focus:outline-none focus:border-blue-400"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Terrible</option>
                    </select>
                  </div>
                  
                  <div className="relative">
                    <textarea 
                      rows={3} 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-blue-400 resize-none pb-8"
                      placeholder="Write your review here to inform potential customers about this company."
                      required
                    ></textarea>
                    <div className="absolute bottom-2 right-2 flex text-gray-400">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="Your Name" 
                      className="border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-blue-400" 
                      required
                    />
                    <input 
                      type="email" 
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      placeholder="Your Email Address" 
                      className="border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-blue-400" 
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[#0d6efd] hover:bg-blue-700 text-white px-6 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Review'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column / Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Map Box */}
            <div className="border border-gray-200 bg-white">
              <div className="w-full h-56 bg-gray-100 relative">
                {service.mapUrl ? (
                  <iframe 
                    src={service.mapUrl} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">Map Not Available</div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-start gap-2 text-sm text-[#1a2b4c] mb-2 font-medium">
                  <svg className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                  {service.address || 'Address not listed'}
                </div>
                {service.phone && (
                  <div className="flex items-center gap-2 text-sm text-[#1a2b4c] font-medium">
                    <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                    Show Phone ({service.phone})
                  </div>
                )}
              </div>
            </div>

            {/* Business Hours Sidebar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24 mt-8 lg:mt-0">
              <h3 className="text-xl font-bold text-[#1a2b4c] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Business Hours <span className="text-sm font-normal text-emerald-500 ml-2">(Now Open)</span>
              </h3>
              
              <ul className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <li key={day} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0 hover:bg-slate-50 p-1 rounded transition-colors">
                    <span className="font-medium text-gray-700">{day}</span>
                    <span className={service.business_hours?.[day] === 'Closed' ? 'text-red-500 font-semibold' : 'text-gray-600'}>
                      {service.business_hours?.[day] || '9am to 6pm'}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Sub-Service Pages Links (Dynamic & Creative) */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-[#1a2b4c] mb-4 flex items-center gap-2">
                   <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd"></path></svg>
                   Explore {service.name}
                </h3>
                
                <div className="flex flex-col gap-2">
                  {/* Use admin-defined sub_services if available, otherwise auto-generate from category */}
                  {(
                    service.sub_services?.length > 0 ? service.sub_services :
                    service.category === 'Plumbing' ? ['Residential Plumbing', 'Emergency 24/7 Service', 'Drain Cleaning'] :
                    service.category === 'Cleaning' ? ['Deep Home Cleaning', 'Move In/Out Cleaning', 'Office Sanitization'] :
                    service.category === 'Salon' ? ['Hair Styling & Color', 'Bridal Makeup', 'Spa & Massage'] :
                    service.category === 'Electrical' ? ['Wiring & Installations', 'Emergency Repairs', 'Lighting Solutions'] :
                    service.category === 'Tutoring' ? ['Private Home Tutoring', 'Exam Preparation', 'Online Sessions'] :
                    ['Professional Services', 'Consultation Booking', 'Premium Solutions']
                  ).map((subName: string, i: number) => {
                    const icons = [
                      <svg key={1} className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>,
                      <svg key={2} className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>,
                      <svg key={3} className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                    ];

                    return (
                      <Link 
                        key={i} 
                        href={`/services/${params.id}/sub-services/${subName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-md shadow-sm group-hover:scale-110 transition-transform">
                            {icons[i % 3]}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">
                            {subName}
                          </span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-200 pt-6 px-4">
                <button className="w-full bg-[#1a2b4c] text-white py-3 rounded font-bold hover:bg-[#2a3c5d] transition-colors shadow-sm mb-3">Book Service Instantly</button>
            </div>
          </div>
        </div>
      </main>
      {/* Lightbox Modal */}
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
          
          <div className="absolute bottom-10 left-0 right-0 text-center text-white/50 text-sm font-medium">Click anywhere outside to close</div>
        </div>
      )}

      <Footer />
    </>
  );
}
