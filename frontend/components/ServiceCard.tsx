'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatUsd } from '@/lib/api';

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80";

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: number | string;
  image?: string;
  rating?: number;
  category?: string;
  city?: string;
  state?: string;
  index?: number; 
}

export default function ServiceCard(props: ServiceCardProps) {
  const {
    id,
    title,
    description,
    price,
    image,
    rating = 4.8,
    category,
    city,
    state,
    index = 0,
  } = props;

  const [imgSrc, setImgSrc] = useState<string | undefined>(image);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setImgSrc(image);
    setLoadError(false);
  }, [image]);

  const displayPrice = typeof price === 'number' ? formatUsd(price) : price;

  return (
    <Link href={`/services/${id}`} className="block h-full" aria-label={`Open ${title}`}>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group flex flex-col h-full overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_48px_rgba(0,100,255,0.1)] hover:border-blue-200/50 transition-all duration-500"
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-50 flex items-center justify-center border-b border-white/50">
        {imgSrc && !loadError ? (
          <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-700 ease-out">
             <Image 
               src={imgSrc} 
               alt={title} 
               fill 
               className="object-cover"
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
               onError={() => setLoadError(true)} 
             />
          </div>
        ) : (
          <div className="w-full h-full relative">
             <Image 
               src={FALLBACK_IMAGE} 
               alt="Service Placeholder" 
               fill 
               className="object-cover opacity-60 grayscale-[0.5]"
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
             />
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-[2px] flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
             </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-white/80 backdrop-blur-md text-blue-800 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-white/50">
            {category || 'Service'}
          </span>
        </div>
        </div>
      
      <div className="p-6 flex flex-col flex-grow relative z-10 bg-white">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{category}</span>
          <div className="flex items-center text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-md border border-amber-100/50">
            <svg className="w-3.5 h-3.5 fill-current shadow-sm" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
            <span className="text-xs font-bold text-slate-700 ml-1">{rating.toFixed(1)}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-extrabold text-[#0f2340] mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{title}</h3>

        {(city || state) && (
          <p className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-tight">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            {city}{state ? `, ${state}` : ''}
          </p>
        )}

        <p className="text-slate-500/90 text-sm line-clamp-2 mb-5 flex-grow font-medium leading-relaxed">{description}</p>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-200/50">
          <p className="text-xl font-black text-slate-800 tracking-tight">{displayPrice}</p>
          <span className="inline-flex items-center gap-1 px-4 py-2 bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            Details
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </span>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}
