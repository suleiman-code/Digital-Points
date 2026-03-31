'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import { contactAPI } from '@/lib/api';

type ContactFormData = {
  name: string;
  email: string;
  city: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ContactFormData>({ mode: 'onTouched' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: ContactFormData) => {
    try {
      setLoading(true);
      await contactAPI.send(data);
      toast.success('Message sent successfully! We will contact you soon.');
      reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-white shadow-md py-8">
          <div className="container-max">
            <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
            <p className="text-gray-600">Get in touch with Digital Point team</p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="container-max py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Get In Touch</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-2">📧 Email</h3>
                  <p className="text-gray-600">support@digitalpoint.com</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">📞 Phone</h3>
                  <p className="text-gray-600">+92 (123) 456-7890</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">📍 Address</h3>
                  <p className="text-gray-600">
                    123 Business Street<br />
                    Islamabad, Pakistan 44000
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">🕐 Business Hours</h3>
                  <p className="text-gray-600">
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                <p className="text-sm text-gray-500 mb-6">All fields are mandatory.</p>

                <div className="mb-5">
                  <label htmlFor="name">Name *</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="city">Your City *</label>
                  <input
                    id="city"
                    type="text"
                    placeholder="e.g. Lahore, Karachi"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    {...register('city', {
                      required: 'City is required',
                    })}
                    required
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="Message subject"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    {...register('subject', {
                      required: 'Subject is required',
                      minLength: {
                        value: 4,
                        message: 'Subject must be at least 4 characters',
                      },
                    })}
                    required
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div className="mb-6">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    placeholder="Your message here..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    {...register('message', {
                      required: 'Message is required',
                      minLength: {
                        value: 10,
                        message: 'Message must be at least 10 characters',
                      },
                    })}
                    rows={5}
                    required
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting || loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
