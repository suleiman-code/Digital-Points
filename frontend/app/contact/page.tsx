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
  phone: string;
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
      toast.success('Message sent! We will contact you soon.');
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

      <main className="min-h-screen bg-slate-50 relative pb-20">
        {/* Page Header */}
        <section className="bg-gradient-to-br from-[#0f2340] via-blue-900 to-indigo-900 text-white pt-44 pb-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-screen"></div>
          <div className="container-max relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">Get In Touch</h1>
            <p className="text-blue-100/90 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              We&apos;re here to help! Reach out to us for any queries or support.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="container-max py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Get In Touch</h2>

              <div className="space-y-10">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xl shadow-sm">📧</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">Email</h3>
                    <p className="text-slate-600 font-medium tracking-wide">info@digitalpointllc.com</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xl shadow-sm">📞</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">Phone</h3>
                    <a href="tel:+12674523317" className="text-slate-600 hover:text-blue-600 transition-colors font-bold tracking-widest">+1 267 452 3317</a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xl shadow-sm">📍</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">Address</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      325 CHESTNUT ST SUITE 876 #232<br />
                      PHILADELPHIA, PA 19106
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">Contact Form</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8">All fields are mandatory for security.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label htmlFor="name" className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Full Name <span className="text-blue-600 font-black">•</span></label>
                    <div className="relative group/field shadow-sm">
                      <svg className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/field:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <input
                        id="name"
                        type="text"
                        placeholder="John Smith"
                        className="w-full rounded-[1.2rem] border-2 border-blue-50 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                        {...register('name', { required: 'Required' })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Email Address <span className="text-blue-600 font-black">•</span></label>
                    <div className="relative group/field shadow-sm">
                      <svg className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/field:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="w-full rounded-[1.2rem] border-2 border-blue-50 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                        {...register('email', { required: 'Required' })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label htmlFor="phone" className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Phone Number <span className="text-blue-600 font-black">•</span></label>
                    <div className="relative group/field shadow-sm">
                      <svg className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/field:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-[1.2rem] border-2 border-blue-50 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                        {...register('phone', { required: 'Required' })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Your City <span className="text-blue-600 font-black">•</span></label>
                    <div className="relative group/field shadow-sm">
                      <svg className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/field:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <input
                        id="city"
                        type="text"
                        placeholder="New York, NY"
                        className="w-full rounded-[1.2rem] border-2 border-blue-50 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                        {...register('city', { required: 'Required' })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="subject" className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Subject <span className="text-blue-600 font-black">•</span></label>
                  <div className="relative group/field shadow-sm">
                    <svg className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/field:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <input
                      id="subject"
                      type="text"
                      placeholder="Why are you contacting us?"
                      className="w-full rounded-[1.2rem] border-2 border-blue-50 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                      {...register('subject', { required: 'Required' })}
                      required
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label htmlFor="message" className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Your Message <span className="text-blue-600 font-black">•</span></label>
                  <div className="relative group/field shadow-sm">
                    <textarea
                      id="message"
                      placeholder="Tell us everything..."
                      className="w-full rounded-[1.2rem] border-2 border-blue-50 bg-white px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium shadow-inner min-h-[140px]"
                      {...register('message', { required: 'Required' })}
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting || loading ? 'Sending...' : 'Send Message Now'}
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
