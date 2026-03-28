'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

// Demo data matching our home page listings
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
    tag: "Top Rated"
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
    tag: "Verified"
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
    tag: "Trending"
  },
  "4": {
    name: "Precision Plumbing Co.",
    category: "Plumbing",
    price: "From $75",
    rating: 4.9,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    description: "Leaking tap? Clogged drain? No problem! Our expert plumbers use precision tools to fix your plumbing issues quickly and effectively.",
    features: ["Leak Detection", "Pipe Replacement", "Water Heater Repair", "Drain Unblocking"],
    tag: "Admin Choice"
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
    tag: "Expert"
  }
};

export default function ServiceDetail({ params }: { params: { id: string } }) {
  const service = SERVICES_DATA[params.id];

  if (!service) {
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
      <main className="bg-slate-50 pb-20">
        <div className="relative h-96 w-full">
          <img 
            src={service.image} 
            alt={service.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="container-max pb-12">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block shadow-lg">
                {service.tag}
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">{service.name}</h1>
              <p className="text-blue-100 font-medium">{service.category} • {service.price}</p>
            </div>
          </div>
        </div>

        <div className="container-max mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0f2340] mb-4">About the Service</h2>
              <p className="text-slate-600 leading-relaxed text-lg">{service.description}</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0f2340] mb-4">Service Highlights</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.features.map((feature: string) => (
                  <li key={feature} className="flex items-center gap-3 text-slate-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#0f2340] p-8 rounded-2xl text-white sticky top-24">
              <h3 className="text-xl font-bold mb-2">Book This Service</h3>
              <p className="text-blue-100 mb-6 font-semibold text-2xl">{service.price}</p>
              
              <div className="space-y-4">
                <button className="btn-light w-full py-4 !text-lg !font-bold">Book Instantly</button>
                <button className="btn-outline w-full py-4 !border-white !text-white hover:!bg-white/10 !text-lg !font-bold">Inquire First</button>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                     <span className="text-sm text-blue-200">Total Reviews</span>
                     <span className="font-bold">{service.reviews} Feedbacks</span>
                   </div>
                   <div className="ml-auto bg-blue-500/20 px-3 py-1 rounded-lg">
                     <span className="font-bold text-lg">{service.rating} ⭐</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
