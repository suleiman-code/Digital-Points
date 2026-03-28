'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { bookingsAPI } from '@/lib/api';

interface BookingFormProps {
  serviceName: string;
  serviceId: string;
}

export default function BookingForm({ serviceName, serviceId }: BookingFormProps) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      await bookingsAPI.create({
        serviceId,
        serviceName,
        userName: data.name,
        userEmail: data.email,
        userPhone: data.phone,
        message: data.message,
        date: data.date,
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
            {...register('name', { required: 'Name is required' })}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
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
            {...register('phone', { required: 'Phone is required' })}
            required
          />
        </div>

        <div>
          <label htmlFor="date">Preferred Date</label>
          <input
            id="date"
            type="date"
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
          {...register('message')}
          rows={4}
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
