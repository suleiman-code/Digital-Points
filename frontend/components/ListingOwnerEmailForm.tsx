'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { inquiriesAPI } from '@/lib/api';

interface ListingOwnerEmailFormProps {
  serviceId: string;
  serviceName: string;
}

export default function ListingOwnerEmailForm({ serviceId, serviceName }: ListingOwnerEmailFormProps) {
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
    <div className="mt-10 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <h3 className="text-2xl font-black text-slate-800 mb-2">Email Business Owner</h3>
      <p className="text-slate-500 text-sm mb-6">Send a quick message directly to this business owner.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            type="text"
            placeholder="Your full name"
            required
          />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            placeholder="your@email.com"
            required
          />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            type="tel"
            placeholder="Phone number"
            required
          />
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            type="text"
            placeholder="Your city"
            required
          />
        </div>

        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={4}
          placeholder="Write your message for business owner"
          required
        />

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Sending...' : 'Send Email Inquiry'}
        </button>
      </form>
    </div>
  );
}
