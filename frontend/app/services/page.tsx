'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import ServiceCardSkeleton from '@/components/ServiceCardSkeleton';
import { servicesAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

function ServicesList() {
  const searchParams = useSearchParams();
  
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationSearch, setLocationSearch] = useState(searchParams.get('l') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState('');
  const [minRating, setMinRating] = useState(0);

  // Autocomplete States
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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

  useEffect(() => {
    fetchServices();
  }, [searchTerm, locationSearch, selectedCategory, priceRange, minRating]);

  // Autocomplete Logic
  useEffect(() => {
    if (searchTerm.length > 0) {
      const catFiltered = categories.filter(cat => 
        cat.toLowerCase().includes(searchTerm.toLowerCase()) && cat !== 'All Categories'
      );
      const titleMatches = services
        .filter((s: any) => (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .map((s: any) => s.title)
        .slice(0, 3);
      
      setSuggestions([...new Set([...catFiltered, ...titleMatches])]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedCategory && selectedCategory !== 'All Categories') filters.category = selectedCategory;
      if (locationSearch) filters.city = locationSearch;
      if (minRating > 0) filters.min_rating = minRating;

      const response = await servicesAPI.getAll(filters);
      let data = response.data;

      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        data = data.filter((s: any) => 
          (s.title || '').toLowerCase().includes(term) || 
          (s.description || '').toLowerCase().includes(term)
        );
      }

      setServices(data);
      setFilteredServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50 relative pb-20">
        <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

        <section className="bg-gradient-to-br from-[#0f2340] via-blue-900 to-indigo-900 text-white pt-[8.5rem] pb-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-screen"></div>
          <div className="container-max relative z-10">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">Explore Our Services</h1>
            <p className="text-blue-100/90 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
              Find the best professionals for your home, business, or personal needs.
            </p>
          </div>
        </section>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="container-max -mt-10 relative z-20"
        >
          <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white">
            <div className="flex flex-col md:flex-row gap-3">
               <div className="flex-[3] relative flex items-center bg-white rounded-xl px-4 border border-slate-100 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all shadow-sm hover:shadow-md">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    type="text"
                    placeholder="Search for services (Sweeper, Plumber...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                    className="w-full p-4 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                  />
                  
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-2"
                      >
                        {suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchTerm(s);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg text-sm font-semibold text-slate-600 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
               <button 
                  onClick={() => {
                    setShowSuggestions(false);
                    fetchServices();
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl"
               >
                 Find Services
               </button>
            </div>
          </div>
        </motion.div>

        <section className="container-max mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-sm p-8 sticky top-28">
                <h2 className="text-xl font-black text-slate-800 mb-6">Filters</h2>
                
                <div className="mb-8">
                   <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Category</label>
                   <div className="space-y-1.5">
                     {categories.map((cat) => (
                       <button
                         key={cat}
                         onClick={() => setSelectedCategory(cat === 'All Categories' ? '' : cat)}
                         className={`w-full text-left px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                           (selectedCategory === cat || (cat === 'All Categories' && !selectedCategory))
                             ? 'bg-blue-600 text-white shadow-lg'
                             : 'text-slate-600 hover:bg-white'
                         }`}
                       >
                         {cat}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="mb-8">
                   <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Rating</label>
                   <div className="flex gap-2">
                     {[0, 3, 4].map((r) => (
                       <button
                         key={r}
                         onClick={() => setMinRating(r)}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${minRating === r ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                       >
                         {r === 0 ? 'All' : `${r}★+`}
                       </button>
                     ))}
                   </div>
                </div>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setPriceRange('');
                    setMinRating(0);
                    setLocationSearch('');
                  }}
                  className="w-full py-3 rounded-xl border border-slate-200 bg-white/50 text-slate-500 font-bold text-sm"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <ServiceCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredServices.length > 0 ? (
                  <motion.div 
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
                        rating={service.avg_rating}
                        city={service.city}
                        state={service.state}
                        business_hours={service.business_hours}
                        index={index}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                    <h3 className="text-2xl font-bold text-slate-800">No services found</h3>
                    <p className="text-slate-500">Try adjusting your filters.</p>
                  </div>
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

export default function ServicesPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen flex items-center justify-center">
         <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
       </div>
    }>
      <ServicesList />
    </Suspense>
  );
}
