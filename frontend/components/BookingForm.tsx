'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { inquiriesAPI } from '@/lib/api';

interface BookingFormProps {
  serviceName: string;
  serviceId: string;
}

type BookingFormData = {
  name: string;
  email: string;
  phone: string;
  city: string;
  postal_code: string;
  date: string;
  message: string;
};

export default function BookingForm({ serviceName, serviceId }: BookingFormProps) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<BookingFormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: BookingFormData) => {
    try {
      setLoading(true);
      await inquiriesAPI.create({
        service_id: serviceId,
        service_name: serviceName,
        user_name: data.name,
        user_email: data.email,
        user_phone: data.phone,
        user_city: data.city,
        user_postal_code: data.postal_code,
        message: data.message,
        booking_date: data.date,
      });
      
      toast.success('Booking submitted successfully! We will contact you soon.');
      reset();
    } catch (error) {
      toast.error('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6">Book This Service</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            maxLength={120}
            {...register('name', { required: 'Name is required', minLength: 2 })}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            maxLength={254}
            {...register('email', { required: 'Email is required' })}
            required
          />
        </div>

        <div>
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="tel"
            placeholder="Your phone number"
            maxLength={30}
            {...register('phone', { required: 'Phone is required', minLength: 7 })}
            required
          />
        </div>

        <div>
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            placeholder="Your city"
            maxLength={120}
            {...register('city', { required: 'City is required', minLength: 1 })}
            required
          />
        </div>

        <div>
          <label htmlFor="postal_code">Postal Code</label>
          <input
            id="postal_code"
            type="text"
            placeholder="Postal Code"
            maxLength={20}
            {...register('postal_code', { required: 'Postal code is required' })}
            required
          />
        </div>

        <div>
          <label htmlFor="date">Preferred Date</label>
          <input
            id="date"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            {...register('date', { required: 'Date is required' })}
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="message">Additional Details</label>
        <textarea
          id="message"
          placeholder="Tell us more about what you need..."
          maxLength={3000}
          {...register('message', { required: 'Message is required', minLength: 10 })}
          rows={4}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || loading}
        className="btn-primary w-full"
      >
        {isSubmitting || loading ? 'Submitting...' : 'Submit Booking Request'}
      </button>
    </form>
  );
}
