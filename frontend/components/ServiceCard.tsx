import Link from 'next/link';
import Image from 'next/image';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
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
  rating,
  category,
}: ServiceCardProps) {
  return (
    <div className="card h-full flex flex-col border border-transparent hover:border-blue-100">
      {/* Image */}
      {image && (
        <div className="relative w-full h-48 mb-4 bg-gray-200 rounded-lg overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Category Badge */}
      {category && (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-2 w-fit">
          {category}
        </span>
      )}

      {/* Title */}
      <h3 className="text-xl font-bold mb-2 line-clamp-2 text-gray-900">{title}</h3>

      {/* Rating */}
      {rating && (
        <div className="flex items-center mb-2">
          <span className="text-yellow-400">★ {rating.toFixed(1)}</span>
        </div>
      )}

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
        {description}
      </p>

      {/* Price and Button */}
      <div className="flex justify-between items-center mt-auto">
        <span className="text-2xl font-bold text-blue-700">
          Rs. {price.toLocaleString()}
        </span>
        <Link href={`/services/${id}`} className="btn-primary text-sm whitespace-nowrap">
          View Details
        </Link>
      </div>
    </div>
  );
}
