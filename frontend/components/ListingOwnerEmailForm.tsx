'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { inquiriesAPI } from '@/lib/api';

interface ListingOwnerEmailFormProps {
  serviceId: string;
  serviceName: string;
  ownerEmail?: string;
}

export default function ListingOwnerEmailForm({ serviceId, serviceName, ownerEmail }: ListingOwnerEmailFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.city || !form.message) {
      toast.error('Please fill all fields.');
      return;
    }

    if (!ownerEmail) {
      toast.error('Business owner email missing.');
      return;
    }

    setSubmitting(true);
    try {
      await inquiriesAPI.create({
        service_id: serviceId,
        service_name: serviceName,
        user_name: form.name,
        user_email: form.email,
        user_phone: form.phone,
        user_city: form.city,
        message: form.message,
      });

      toast.success('Inquiry sent to business owner.');
      setForm({ name: '', email: '', phone: '', city: '', message: '' });
    } catch {
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_10px_35px_rgba(15,23,42,0.06)] p-8 sm:p-10 relative overflow-hidden group hover:border-blue-100 transition-all duration-500">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
         <svg className="w-24 h-24 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
      </div>

      <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">Direct Inquiry</h3>
      <p className="text-slate-500 font-medium mb-10 leading-relaxed max-w-md">Send a professional message directly to <span className="text-blue-600 font-bold">{serviceName}</span> and get a reply via email.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
              placeholder="John Doe"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="name@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">City</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              type="text"
              placeholder="e.g. New York"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Body</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={5}
            placeholder="Introduce yourself and explain your inquiry..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting} 
          className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all text-sm uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:shadow-blue-500/20 disabled:opacity-70 group flex items-center justify-center gap-3"
        >
          {submitting ? 'Processing Inquiry...' : (
            <>
              Send Message Now
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7-7 7M5 12h16"/></svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
