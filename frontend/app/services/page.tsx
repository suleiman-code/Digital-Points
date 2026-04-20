'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { stripDescriptionFormatting } from '@/components/FormattedDescription';
import ServiceCardSkeleton from '@/components/ServiceCardSkeleton';
import { resolveMediaUrl, servicesAPI, categoriesAPI } from '@/lib/api';
import { ALL_CATEGORIES_WITH_DEFAULT, normalizeCategory } from '@/lib/businessCategories';
import { motion, AnimatePresence } from 'framer-motion';

function ServicesList() {
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  const categories = Array.from(new Set([...ALL_CATEGORIES_WITH_DEFAULT, ...dynamicCategories])).sort((a,b) => {
    if (a === 'All Categories') return -1;
    if (b === 'All Categories') return 1;
    return a.localeCompare(b);
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchTerm(params.get('q') || '');
    setLocationSearch(params.get('l') || '');
    setSelectedCategory(normalizeCategory(params.get('category') || ''));
    
    const fetchCats = async () => {
      try {
        const res = await categoriesAPI.getAll();
        const cats = res.data?.map((c: any) => c.name) || [];
        setDynamicCategories(cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCats();
    setInitialized(true);
  }, []);

  const isUsaAlias = (value: string) => {
    const v = String(value || '').toLowerCase().trim();
    return ['usa', 'us', 'america', 'united states', 'united states of america'].includes(v);
  };

  const applySearchFilter = (items: any[], query: string) => {
    const normalizedQuery = String(query || '').toLowerCase().trim();
    if (!normalizedQuery) return items;

    const compactQuery = normalizedQuery.replace(/[^a-z0-9]/g, '');

    return items.filter((item: any) => {
      const country = String(item.country || '').toLowerCase().trim();

      if (isUsaAlias(normalizedQuery)) {
        if (['usa', 'us', 'america', 'united states', 'united states of america'].includes(country)) {
          return true;
        }
      }

      const fields = [
        item.title,
        item.category,
        item.description,
        item.city,
        item.state,
        item.country,
      ]
        .map((val) => String(val || '').toLowerCase())
        .filter(Boolean);

      return fields.some((field) => {
        const compactField = field.replace(/[^a-z0-9]/g, '');
        return field.includes(normalizedQuery) || compactField.includes(compactQuery);
      });
    });
  };

  useEffect(() => {
    if (!initialized) return;
    fetchServices();
  }, [initialized, selectedCategory, locationSearch, priceRange, minRating]);

  useEffect(() => {
    setFilteredServices(applySearchFilter(services, searchTerm));
  }, [services, searchTerm]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedCategory && selectedCategory !== 'All Categories') filters.category = normalizeCategory(selectedCategory);
      if (locationSearch) filters.city = locationSearch;
      if (minRating > 0) filters.min_rating = minRating;

      const response = await servicesAPI.getAll(filters);
      let data = (response.data || []).map((s: any) => ({
        ...s,
        _id: s._id || s.id,
        title: s.title || s.name || '',
        description: stripDescriptionFormatting(String(s.description || '')),
        category: s.category || '',
        city: s.city || '',
        state: s.state || '',
        country: s.country || '',
        service_details: s.service_details || s.serviceDetails || '',
      })).filter((s: any) => Boolean(s._id));

      setServices(data);
      setFilteredServices(applySearchFilter(data, searchTerm));
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

        <section className="bg-gradient-to-br from-[#0f2340] via-blue-900 to-indigo-900 text-white pt-[11.5rem] pb-20 relative overflow-hidden shadow-2xl">
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
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setFilteredServices(applySearchFilter(services, searchTerm));
              }}
              className="flex flex-col md:flex-row gap-3"
            >
               <div className="flex-[3] relative flex items-center bg-white rounded-xl px-4 border border-slate-100 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all shadow-sm hover:shadow-md">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    type="text"
                    placeholder="Search category (Plumber, Sweeper, AC...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-4 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                  />
               </div>
               <div className="flex-1 flex items-center bg-white rounded-xl px-4 border border-slate-100 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all shadow-sm hover:shadow-md">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <input
                    type="text"
                    placeholder="City/State (optional)"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full p-4 bg-transparent outline-none text-slate-700 font-medium text-sm sm:text-base placeholder:text-slate-400"
                  />
               </div>
               <button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl"
               >
                 Find Services
               </button>
            </form>
          </div>
        </motion.div>

        <section className="container-max mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <div className={`lg:col-span-1 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-xl p-8 sticky top-28">
                <h2 className="text-xl font-black text-slate-800 mb-6">Filters</h2>
                
                <div className="mb-8">
                   <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Category</label>
                   <select
                     value={selectedCategory || 'All Categories'}
                     onChange={(e) => setSelectedCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
                     className="w-full px-4 py-3 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                   >
                     {categories.map((cat) => (
                       <option key={cat} value={cat}>
                         {cat}
                       </option>
                     ))}
                   </select>
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
                  type="button"
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">
                    {loading ? 'Searching...' : `${filteredServices.length} Services Found`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded-full shadow-sm">
                        {selectedCategory}
                        <button onClick={() => setSelectedCategory('')} className="hover:text-blue-900 ml-1">✕</button>
                      </span>
                    )}
                    {locationSearch && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-full shadow-sm">
                        📍 {locationSearch}
                        <button onClick={() => setLocationSearch('')} className="hover:text-indigo-900 ml-1">✕</button>
                      </span>
                    )}
                    {minRating > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full shadow-sm">
                        ⭐ {minRating}+ Stars
                        <button onClick={() => setMinRating(0)} className="hover:text-amber-900 ml-1">✕</button>
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="lg:hidden flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 active:scale-95 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                  {isFilterOpen ? 'Close Filters' : 'All Filters'}
                </button>
              </div>

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
                        image={resolveMediaUrl(service.image_url || service.image || (Array.isArray(service.gallery) ? service.gallery[0] : '') || '')}
                        category={service.category}
                        rating={service.avg_rating}
                        city={service.city}
                        state={service.state}
                        index={index}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">No matching services</h3>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">We couldn&apos;t find anything matching your search. Try adjusting the keywords or clearing filters.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('');
                        setLocationSearch('');
                        setMinRating(0);
                      }}
                      className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
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
