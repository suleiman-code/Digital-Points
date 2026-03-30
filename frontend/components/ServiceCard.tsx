'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: number | string;
  image?: string;
  rating?: number;
  category?: string;
  index?: number; // for staggered animation
}

export default function ServiceCard({
  id,
  title,
  description,
  price,
  image,
  rating = 4.8,
  category,
  index = 0,
}: ServiceCardProps) {
  const displayPrice = typeof price === 'number' ? `$${price}` : price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group flex flex-col h-full overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_48px_rgba(0,100,255,0.1)] hover:border-blue-200/50 transition-all duration-500"
    >
      <div className="relative h-48 w-full overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={title}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-200">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
        )}
        
        {/* Glassmorphic Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-white/70 backdrop-blur-md text-blue-800 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-white/50">
            {category || 'Service'}
          </span>
        </div>
        
        {/* Overlay gradient for image text readability if needed later */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      <div className="p-6 flex flex-col flex-grow relative z-10 bg-gradient-to-b from-transparent to-white/50">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">{category}</span>
          <div className="flex items-center text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-md border border-amber-100/50">
            <svg className="w-3.5 h-3.5 fill-current shadow-sm" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
            <span className="text-xs font-bold text-slate-700 ml-1">{rating}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-extrabold text-[#0f2340] mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300 line-clamp-1">
          {title}
        </h3>
        <p className="text-slate-500/90 text-sm line-clamp-3 mb-5 flex-grow font-medium leading-relaxed">
          {description}
        </p>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-200/50">
          <p className="text-xl font-black text-slate-800 tracking-tight">{displayPrice}</p>
          <Link href={`/services/${id}`} className="inline-flex items-center gap-1 px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-sm font-semibold rounded-lg transition-colors duration-300 shadow-sm">
            Details
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
