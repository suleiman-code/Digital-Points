'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { servicesAPI } from '@/lib/api';
import Link from 'next/link';

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

      <main className="min-h-screen bg-slate-50">
        {/* Page Header */}
        <section className="bg-[#0f2340] text-white py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="container-max relative">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Explore Our Services</h1>
            <p className="text-blue-100 text-lg max-w-2xl">Find the best professionals for your home, business, or personal needs. Verified quality at transparent prices.</p>
          </div>
        </section>

        {/* Search Bar Floating */}
        <div className="container-max -mt-8 relative z-10">
          <div className="bg-white p-3 rounded-2xl shadow-xl border border-blue-50">
            <div className="flex flex-col md:flex-row gap-3">
               <div className="flex-[3] flex items-center bg-slate-50 rounded-xl px-4 border border-slate-100 focus-within:border-blue-300 transition-all shadow-inner">
                  <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    type="text"
                    placeholder="Search for services (Sweeper, Plumber...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-4 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                  />
               </div>
               <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 border border-slate-100 focus-within:border-blue-300 transition-all shadow-inner">
                  <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <input
                    type="text"
                    placeholder="City/State"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full p-4 bg-transparent outline-none text-slate-700 font-medium text-sm sm:text-base placeholder:text-slate-400"
                  />
               </div>
               <button 
                  onClick={() => filterServices()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg active:scale-95 whitespace-nowrap"
               >
                 Find Services
               </button>
            </div>
          </div>
        </div>

        {/* Result Tracking */}
        <div className="container-max mt-8 flex justify-between items-center px-2">
           <p className="text-slate-500 font-medium">
             Showing <span className="text-blue-600 font-bold">{filteredServices.length}</span> services found
           </p>
        </div>

        {/* Filters & Results */}
        <section className="container-max py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold text-[#0f2340] mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                  Quick Filters
                </h2>

                {/* Category */}
                <div className="mb-8">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Service Category</label>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === 'All Categories' ? '' : cat)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          (selectedCategory === cat || (cat === 'All Categories' && !selectedCategory))
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-8">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pricing Tier</label>
                  <div className="space-y-2">
                    {[
                      { label: 'All Prices', value: '' },
                      { label: 'Under $50', value: '0-50' },
                      { label: '$50 - $100', value: '50-100' },
                      { label: '$100+', value: '100-999999' },
                    ].map((range) => (
                      <button
                        key={range.label}
                        onClick={() => setPriceRange(range.value)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          priceRange === range.value
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setPriceRange('');
                  }}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* Services Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading services...</p>
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {filteredServices.map((service: any) => (
                    <ServiceCard
                      key={service._id}
                      id={service._id}
                      title={service.title}
                      description={service.description}
                      price={service.price}
                      image={service.image}
                      category={service.category}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-gray-600 mb-4">No services found matching your criteria.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                      setPriceRange('');
                    }}
                    className="btn-primary"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
