import Link from 'next/link';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: number | string;
  image?: string;
  rating?: number;
  category?: string;
}

export default function ServiceCard({
  id,
  title,
  description,
  price,
  image,
  rating = 4.8,
  category,
}: ServiceCardProps) {
  const displayPrice = typeof price === 'number' ? `$${price}` : price;

  return (
    <div className="group overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
            {category || 'Service'}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">{category}</span>
          <div className="flex items-center text-yellow-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
            <span className="text-sm font-bold text-slate-700 ml-1">{rating}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-[#0f2340] mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{title}</h3>
        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">{description}</p>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50">
          <p className="text-lg font-bold text-slate-900">{displayPrice}</p>
          <Link href={`/services/${id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
