export default function ServiceCardSkeleton() {
  return (
    <div className="group flex flex-col h-[400px] overflow-hidden rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-48 w-full bg-slate-200/60 overflow-hidden">
        {/* Category Badge Skeleton */}
        <div className="absolute top-4 left-4 w-16 h-6 bg-white/50 rounded-full"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="p-6 flex flex-col flex-grow relative z-10 bg-gradient-to-b from-transparent to-white/50">
        <div className="flex justify-between items-start mb-3">
          <div className="w-20 h-4 bg-blue-100/80 rounded-md"></div>
          <div className="w-12 h-4 bg-amber-100/80 rounded-md"></div>
        </div>
        
        <div className="w-3/4 h-6 bg-slate-200/80 rounded-md mb-3"></div>
        <div className="w-full h-16 bg-slate-100/80 rounded-md mb-5"></div>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-200/50">
          <div className="w-16 h-6 bg-slate-200/80 rounded-md"></div>
          <div className="w-24 h-9 bg-blue-50/80 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
