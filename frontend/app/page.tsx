'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || locationQuery.trim()) {
      let url = `/services?q=${encodeURIComponent(searchQuery)}`;
      if (locationQuery.trim()) {
        url += `&l=${encodeURIComponent(locationQuery.trim())}`;
      }
      router.push(url);
    }
  };

  const heroBackground =
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2000&q=80';

  const featureCards = [
    {
      title: 'Smart Search',
      description: 'Filter by category, budget, and urgency in seconds.',
      chip: 'Fast Discovery',
    },
    {
      title: 'Verified Professionals',
      description: 'Every provider is screened with quality checks before listing.',
      chip: 'Trusted Network',
    },
    {
      title: 'Transparent Pricing',
      description: 'Compare rates clearly before you submit a booking request.',
      chip: 'No Hidden Cost',
    },
  ];

  const categories = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Painting',
    'Carpentry',
    'Appliance Repair',
    'Salon',
    'Tutoring',
  ];

  return (
    <>
      <Header />
      
      <main>
        {/* Hero Section */}
        <section
          className="relative overflow-hidden text-white py-24"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(8, 47, 128, 0.9), rgba(16, 84, 196, 0.78), rgba(14, 116, 171, 0.72)), url('${heroBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-cyan-300/20 blur-2xl" />

          <div className="container-max relative section-fade-in">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
                Book Skilled Services Without the Usual Hassle.
              </h1>

              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl">
                Search trusted professionals, compare prices transparently, and send your booking in under 2 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/services" className="btn-light text-center px-10">
                  Browse Services
                </Link>
                <Link href="/contact" className="btn-outline !border-white !text-white hover:!bg-white/15 text-center px-10">
                  How It Works
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 text-sm">
                {[
                  { metric: '10k+', label: 'Services' },
                  { metric: '50k+', label: 'Customers' },
                  { metric: '4.8/5', label: 'Avg Rating' },
                  { metric: '24h', label: 'Fast Response' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl px-4 py-3 bg-slate-900/35 border border-white/30 backdrop-blur-md"
                  >
                    <p className="text-xl font-bold text-white">{item.metric}</p>
                    <p className="text-cyan-100">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Services (Admin Demo) */}
        <section className="py-16 bg-white section-fade-in">
          <div className="container-max">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-blue-600 font-bold tracking-wider uppercase text-sm">Exclusive Deals</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f2340] mt-2">Recommended Services</h2>
                <div className="h-1.5 w-20 bg-blue-600 mt-4 rounded-full"></div>
              </div>
              <p className="hidden md:block text-slate-500 max-w-md text-right">
                Hand-picked professional services verified by our admin team for quality and reliability.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  id: 1,
                  name: "Elite Home Cleaning",
                  category: "Cleaning",
                  price: "$80/hr",
                  rating: 4.9,
                  reviews: 124,
                  image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
                  tag: "Top Rated"
                },
                {
                  id: 2,
                  name: "Master Sparky Electrical",
                  category: "Electrical",
                  price: "From $95",
                  rating: 4.8,
                  reviews: 89,
                  image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
                  tag: "Verified"
                },
                {
                  id: 3,
                  name: "Royal Touch Salon",
                  category: "Salon",
                  price: "From $45",
                  rating: 4.7,
                  reviews: 210,
                  image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
                  tag: "Trending"
                },
                {
                  id: 4,
                  name: "Precision Plumbing Co.",
                  category: "Plumbing",
                  price: "From $75",
                  rating: 4.9,
                  reviews: 156,
                  image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
                  tag: "Admin Choice"
                },
                {
                  id: 5,
                  name: "A+ Academic Tutors",
                  category: "Tutoring",
                  price: "$50/hr",
                  rating: 5.0,
                  reviews: 42,
                  image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
                  tag: "Expert"
                }
              ].map((service) => (
                <div key={service.id} className="group overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 w-full">
                    <img 
                      src={service.image} 
                      alt={service.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        {service.tag}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">{service.category}</span>
                      <div className="flex items-center text-yellow-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                        <span className="text-sm font-bold text-slate-700 ml-1">{service.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#0f2340] mb-2 group-hover:text-blue-600 transition-colors">{service.name}</h3>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                      <p className="text-lg font-bold text-slate-900">{service.price}</p>
                      <Link href={`/services/${service.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        Book Now
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Categories */}
        <section className="py-16 bg-gray-50 section-fade-in">
          <div className="container-max">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/services?category=${category}`}
                  className="card text-center"
                >
                  <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mb-2">
                    {category.charAt(0)}
                  </div>
                  <p className="font-semibold">{category}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white section-fade-in">
          <div className="container-max">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featureCards.map((feature) => (
                <div key={feature.title} className="card">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-4">
                    {feature.chip}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#0f2340] text-white section-fade-in">
          <div className="container-max text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8 text-blue-100">Browse trusted services near you and submit a request in minutes.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/services" className="btn-light">
                Start Browsing
              </Link>
              <Link href="/contact" className="btn-outline !border-blue-200 !text-blue-100 hover:!bg-blue-900/40">
                Talk to Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
