'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import ServiceCardSkeleton from '@/components/ServiceCardSkeleton';
import { servicesAPI } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationSearch, setLocationSearch] = useState(searchParams.get('l') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchTerm, locationSearch, selectedCategory, priceRange, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All Categories',
    'Cleaning',
    'Electrical',
    'Salon',
    'Plumbing',
    'Tutoring',
    'Maintenance',
    'Creative'
  ];

  const filterServices = () => {
    let filtered = services;

    // 1. Filter based on Search Term FIRST (If exists)
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (service: any) =>
          service.title.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term) ||
          (service.category && service.category.toLowerCase().includes(term)) ||
          // Keyword mapping for specific searches
          (term === 'plumber' && service.category === 'Plumbing') ||
          (term === 'cleaning' && service.category === 'Cleaning') ||
          (term === 'sweeper' && service.category === 'Cleaning')
      );
    }

    // 2. Filter based on Location (Exact or Partial match for City/State)
    if (locationSearch) {
      const loc = locationSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (service: any) =>
          (service.city && service.city.toLowerCase().includes(loc)) ||
          (service.state && service.state.toLowerCase().includes(loc))
      );
    }

    // 2. Filter based on Category (Acts as a refined filter)
    if (selectedCategory && selectedCategory !== 'All Categories') {
      filtered = filtered.filter((service: any) => service.category === selectedCategory);
    }

    // 3. Price Filter
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter((service: any) => {
        const price = typeof service.price === 'string' 
          ? parseInt(service.price.replace(/[^0-9]/g, '')) 
          : Number(service.price);
        return price >= min && (max ? price <= max : true);
      });
    }

    setFilteredServices(filtered);
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50 relative pb-20">
        <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

        {/* Page Header */}
        <section className="bg-gradient-to-br from-[#0f2340] via-blue-900 to-indigo-900 text-white py-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-screen transition-all duration-1000 ease-in-out"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl -ml-20 -mb-20 mix-blend-screen"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container-max relative z-10"
          >
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">Explore Our Services</h1>
            <p className="text-blue-100/90 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
              Find the best professionals for your home, business, or personal needs. Verified quality at transparent prices.
            </p>
          </motion.div>
        </section>

        {/* Search Bar Floating - Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="container-max -mt-10 relative z-20"
        >
          <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white">
            <div className="flex flex-col md:flex-row gap-3">
               <div className="flex-[3] flex items-center bg-white rounded-xl px-4 border border-slate-100 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all shadow-sm hover:shadow-md">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    type="text"
                    placeholder="Search for services (Sweeper, Plumber...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-4 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                  />
               </div>
               <div className="flex-1 flex items-center bg-white rounded-xl px-4 border border-slate-100 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all shadow-sm hover:shadow-md">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <input
                    type="text"
                    placeholder="City/State"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full p-4 bg-transparent outline-none text-slate-700 font-medium text-sm sm:text-base placeholder:text-slate-400"
                  />
               </div>
               <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => filterServices()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/30 whitespace-nowrap"
               >
                 Find Services
               </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Result Tracking */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="container-max mt-10 mb-4 flex justify-between items-center px-2"
        >
           <p className="text-slate-500 font-medium flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Showing <span className="text-blue-700 font-black text-lg bg-blue-50 px-2 py-0.5 rounded-md">{filteredServices.length}</span> services found
           </p>
        </motion.div>

        {/* Filters & Results */}
        <section className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Sidebar Filters - Sticky and Glassmorphic */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-1"
            >
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sticky top-28">
                <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2 pb-4 border-b border-slate-200/50">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                  Quick Filters
                </h2>

                {/* Category */}
                <div className="mb-10">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Service Category</label>
                  <div className="space-y-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === 'All Categories' ? '' : cat)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${
                          (selectedCategory === cat || (cat === 'All Categories' && !selectedCategory))
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                         <span className="relative z-10">{cat}</span>
                         {/* Subtle hover background sweep */}
                         {!(selectedCategory === cat || (cat === 'All Categories' && !selectedCategory)) && (
                           <div className="absolute inset-0 bg-blue-50 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                         )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-10">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Pricing Tier</label>
                  <div className="space-y-1.5">
                    {[
                      { label: 'All Prices', value: '' },
                      { label: 'Under $50', value: '0-50' },
                      { label: '$50 - $100', value: '50-100' },
                      { label: '$100+', value: '100-999999' },
                    ].map((range) => (
                      <button
                        key={range.label}
                        onClick={() => setPriceRange(range.value)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          priceRange === range.value
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setPriceRange('');
                  }}
                  className="w-full py-3.5 rounded-xl border border-slate-200/60 bg-white/50 text-slate-500 font-bold text-sm hover:text-slate-800 hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  Reset All Filters
                </motion.button>
              </div>
            </motion.div>

            {/* Services Grid & Skeletons */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {[1, 2, 3, 4].map((i) => (
                      <ServiceCardSkeleton key={`skeleton-${i}`} />
                    ))}
                  </motion.div>
                ) : filteredServices.length > 0 ? (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {filteredServices.map((service: any, index) => (
                      <ServiceCard
                        key={service._id}
                        id={service._id}
                        title={service.title}
                        description={service.description}
                        price={service.price}
                        image={service.image_url || service.image}
                        category={service.category}
                        index={index}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-results"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 px-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-sm"
                  >
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">No services found</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">We couldn't find any services matching your current filters. Try adjusting your search or category.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('');
                        setPriceRange('');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30"
                    >
                      Clear All Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
