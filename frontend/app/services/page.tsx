'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { servicesAPI } from '@/lib/api';
import Link from 'next/link';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchTerm, selectedCategory, priceRange, services]);

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

  const filterServices = () => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(
        (service: any) =>
          service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((service: any) => service.category === selectedCategory);
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter((service: any) => service.price >= min && service.price <= max);
    }

    setFilteredServices(filtered);
  };

  const categories = [...new Set(services.map((s: any) => s.category))];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <section className="bg-white shadow-md py-8">
          <div className="container-max">
            <h1 className="text-4xl font-bold mb-2">All Services</h1>
            <p className="text-gray-600">Browse our complete catalog of services</p>
          </div>
        </section>

        {/* Filters & Results */}
        <section className="container-max py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-4">Filters</h2>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">All Prices</option>
                    <option value="0-5000">Under Rs. 5,000</option>
                    <option value="5000-10000">Rs. 5,000 - 10,000</option>
                    <option value="10000-25000">Rs. 10,000 - 25,000</option>
                    <option value="25000-50000">Rs. 25,000 - 50,000</option>
                    <option value="50000-1000000">Rs. 50,000+</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setPriceRange('');
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
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
