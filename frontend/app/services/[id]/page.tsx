'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingForm from '@/components/BookingForm';
import { servicesAPI } from '@/lib/api';
import Link from 'next/link';

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchService();
  }, [params.id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getById(params.id);
      setService(response.data);
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container-max py-12 text-center">
          <p>Loading service details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Header />
        <div className="container-max py-12 text-center">
          <p>Service not found</p>
          <Link href="/services" className="btn-primary mt-4 inline-block">
            Back to Services
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="container-max py-4">
          <Link href="/services" className="text-blue-600 hover:underline">
            ← Back to Services
          </Link>
        </div>

        <section className="container-max py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Service Image & Details */}
            <div className="lg:col-span-2">
              {/* Image */}
              {service.image && (
                <div className="relative w-full h-96 mb-8 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              )}

              {/* Service Info */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                      {service.category}
                    </span>
                    <h1 className="text-4xl font-bold mb-2">{service.title}</h1>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      Rs. {service.price.toLocaleString()}
                    </div>
                  </div>
                </div>

                <hr className="my-6" />

                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">{service.description}</p>
                </div>

                {service.serviceDetails && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Service Details</h2>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <ul className="space-y-2">
                        {service.serviceDetails.split('\n').map((detail: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-blue-600">✓</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {service.createdBy && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-bold mb-2">Service Provider</h3>
                    <p className="text-gray-700">{service.createdBy.name || 'Service Provider'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Form Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <BookingForm serviceName={service.title} serviceId={service._id} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
