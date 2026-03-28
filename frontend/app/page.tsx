import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container-max text-center">
            <h1 className="text-5xl font-bold mb-4">Find & Book Services Easily</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Discover trusted service providers in your area. Compare prices, read reviews, and book services instantly.
            </p>
            <Link href="/services" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Browse Services Now
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container-max">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">Easy Search</h3>
                <p className="text-gray-600">Find services by category, location, or price</p>
              </div>

              <div className="card text-center">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-xl font-bold mb-2">Verified Reviews</h3>
                <p className="text-gray-600">Read honest reviews from real customers</p>
              </div>

              <div className="card text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2">Trusted Providers</h3>
                <p className="text-gray-600">All service providers are verified and trusted</p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Categories */}
        <section className="py-16 bg-gray-50">
          <div className="container-max">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Plumbing', icon: '🔧' },
                { name: 'Electrical', icon: '⚡' },
                { name: 'Cleaning', icon: '🧹' },
                { name: 'Painting', icon: '🎨' },
                { name: 'Carpentry', icon: '🪵' },
                { name: 'Appliance Repair', icon: '🔌' },
                { name: 'Hair Salon', icon: '💇' },
                { name: 'Tutoring', icon: '📚' },
              ].map((category) => (
                <Link
                  key={category.name}
                  href={`/services?category=${category.name}`}
                  className="card text-center hover:shadow-lg transition"
                >
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <p className="font-medium">{category.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container-max text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8">Browse thousands of services available right now</p>
            <Link href="/services" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Start Browsing
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
