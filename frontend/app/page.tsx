'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { motion } from 'framer-motion';
import { servicesAPI } from '@/lib/api';
import { BUSINESS_CATEGORIES } from '@/lib/businessCategories';

export default function Home() {
  const router = useRouter();

  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedHomepageCategory, setSelectedHomepageCategory] = useState('');
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(8);

  const FALLBACK_SERVICES = [
    { id: "1", title: "Elite Home Deep Cleaning", category: "Cleaning", price: "$80/hr", rating: 4.9, image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80", description: "Professional deep cleaning service with eco-friendly products for a spotless home." },
    { id: "2", title: "Master Sparky Electrical", category: "Electrical", price: "From $95", rating: 4.8, image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", description: "Licensed electricians available 24/7 for all residential and commercial needs." },
    { id: "3", title: "Royal Touch Spa & Salon", category: "Salon", price: "From $45", rating: 4.7, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80", description: "Luxury grooming and spa services in the comfort of your own home." },
    { id: "4", title: "Precision Plumbing Co.", category: "Plumbing", price: "From $75", rating: 4.9, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", description: "Fast, reliable plumbing repairs and installations with a satisfaction guarantee." },
    { id: "5", title: "Green Lawn Maintenance", category: "Garden", price: "From $50", rating: 4.6, image: "https://images.unsplash.com/photo-1558905611-06778f2f2ac4?auto=format&fit=crop&w=800&q=80", description: "Complete lawn care and landscaping services for a beautiful outdoor space." },
    { id: "6", title: "Quick Move Packers & Movers", category: "Moving", price: "From $200", rating: 4.5, image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80", description: "Stress-free moving and packing services for local and long-distance moves." },
    { id: "7", title: "Pure Flow Water Repair", category: "Plumbing", price: "From $65", rating: 4.8, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", description: "Expert water filtration and pipe repair services with 24/7 emergency support." },
    { id: "8", title: "Swift Tech Computer Repair", category: "Tech", price: "From $40", rating: 4.9, image: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80", description: "On-site and remote tech support for all your computer and networking issues." }
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const res = await servicesAPI.getAll();
        const data: any[] = res.data || [];
        // Fetch all but initially show limited set
        const normalized = data.map((s: any) => ({
          id: s._id || s.id,
          title: s.title || s.name,
          category: s.category,
          featured: Boolean(s.featured),
          price: s.price ? `From $${s.price}` : 'Contact Us',
          rating: s.rating || 5.0,
          image: (s.image_url || s.image || '') + (s.image_url ? '?auto=format&fit=crop&w=800&q=80' : ''),
          description: s.description,
        })).sort((a: any, b: any) => Number(b.featured) - Number(a.featured));
        setFeaturedServices(normalized.length > 0 ? normalized : FALLBACK_SERVICES);
      } catch (err) {
        setFeaturedServices(FALLBACK_SERVICES);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);



  const heroBackground =
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2000&q=80';

  const featureCards = [
    {
      title: 'Effortless Booking',
      description: 'Book your required service in just a few clicks with our simplified process.',
      chip: 'Instant Access',
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

  const categories = BUSINESS_CATEGORIES;
  const visibleCategories = categories.slice(0, visibleCategoriesCount);

  return (
    <>
      <Header />

      <main>
        {/* Hero Section */}
        <section
          className="relative overflow-hidden text-white py-24 min-h-[85vh] flex items-center"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(8, 47, 128, 0.95), rgba(16, 84, 196, 0.85), rgba(14, 116, 171, 0.8)), url('${heroBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/30 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-cyan-400/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

          <div className="container-max relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-50 font-medium text-sm mb-6 tracking-wide shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  Discover Premium Services
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-cyan-100 drop-shadow-sm">
                Book Skilled Pros Without the Hassle.
              </h1>

              <p className="text-xl md:text-2xl text-blue-50/90 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                Connect with trusted professionals, compare transparent prices, and book your service instantly.
              </p>



              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-5 justify-center mb-16"
              >
                <Link href="/services" className="btn-light text-center px-10 py-4 text-lg font-bold shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 rounded-xl">
                  Explore Services
                </Link>
                <Link href="/contact" className="btn-outline !border-white/30 !text-white hover:!bg-white/10 text-center px-10 py-4 text-lg font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105 rounded-xl">
                  How It Works
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
              >
                {[
                  { metric: '10k+', label: 'Verified Services' },
                  { metric: '50k+', label: 'Happy Customers' },
                  { metric: '4.9/5', label: 'Average Rating' },
                  { metric: '24/7', label: 'Customer Support' },
                ].map((item, i) => (
                  <motion.div
                    whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    key={item.label}
                    className="rounded-2xl px-4 py-5 bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl transition-all"
                  >
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-300 drop-shadow-md mb-1">{item.metric}</p>
                    <p className="text-blue-100/80 text-sm font-medium uppercase tracking-wider">{item.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Featured Services */}
        <section className="py-24 bg-slate-50/50 relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-40 right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          </div>

          <div className="container-max relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
            >
              <div className="max-w-2xl">
                <span className="inline-block py-1 px-3 rounded-md bg-blue-100 text-blue-700 font-bold tracking-widest uppercase text-xs mb-3">Exclusive Selection</span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Premium Hand-Picked Services</h2>
              </div>
              <Link href="/services" className="group flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors">
                View All Directory
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {servicesLoading ? (
                // Loading skeletons
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
                    <div className="h-48 bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-full" />
                    </div>
                  </div>
                ))
              ) : (
                featuredServices.slice(0, visibleCount).map((service, index) => (
                  <ServiceCard key={service.id} {...service} index={index} />
                ))
              )}
            </div>

            {!servicesLoading && featuredServices.length > visibleCount && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-12 text-center"
              >
                <button 
                  onClick={() => setVisibleCount(prev => prev + 8)}
                  className="px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-blue-200"
                >
                  More Listings
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Popular Categories */}
        <section className="py-24 bg-white">
          <div className="container-max">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Explore by Category</h2>
              <p className="text-slate-500 text-lg">Find exactly what you need from our diverse service network.</p>
              <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedHomepageCategory}
                  onChange={(e) => setSelectedHomepageCategory(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (!selectedHomepageCategory) return;
                    router.push(`/services?category=${encodeURIComponent(selectedHomepageCategory)}`);
                  }}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!selectedHomepageCategory}
                >
                  Browse
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {visibleCategories.map((category, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  key={category}
                >
                  <Link
                    href={`/services?category=${encodeURIComponent(category)}`}
                    className="group flex flex-col items-center p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-[0_20px_40px_rgba(0,100,255,0.08)] transition-all duration-300"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 text-blue-600 font-extrabold text-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      {category.charAt(0)}
                    </div>
                    <p className="font-bold text-slate-700 group-hover:text-blue-700">{category}</p>
                  </Link>
                </motion.div>
              ))}
            </div>

            {categories.length > visibleCategoriesCount && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-10 text-center"
              >
                <button
                  onClick={() => setVisibleCategoriesCount((prev) => prev + 4)}
                  className="px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-blue-200"
                >
                  More Categories
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/20 rounded-l-[100px] blur-3xl mix-blend-screen pointer-events-none"></div>
          <div className="container-max relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm mb-2 block">Our Guarantee</span>
              <h2 className="text-4xl md:text-5xl font-black mb-6">Why Choose Digital Point?</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featureCards.map((feature, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  key={feature.title}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg hover:bg-white/10 transition-colors duration-300"
                >
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-300 bg-cyan-900/40 border border-cyan-800/50 px-3 py-1.5 rounded-full mb-6">
                    {feature.chip}
                  </span>
                  <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed font-medium">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>





        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="container-max max-w-4xl"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready to Experience Premium Service?</h2>
            <p className="text-xl mb-10 text-blue-100 leading-relaxed">Join thousands of satisfied customers who trust Digital Points for their everyday needs.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/services" className="btn-light text-lg px-8 py-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform">
                Start Browsing Now
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}