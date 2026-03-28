import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  const heroBackground =
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2000&q=80';

  const featureCards = [
    {
      title: 'Smart Search',
      description: 'Filter by category, budget, and urgency in seconds.',
      chip: 'Fast Discovery',
    },
    {
      title: 'Verified Professionals',
      description: 'Every provider is screened with quality checks before listing.',
      chip: 'Trusted Network',
    },
    {
      title: 'Transparent Pricing',
      description: 'Compare rates clearly before you submit a booking request.',
      chip: 'No Hidden Cost',
    },
  ];

  const categories = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Painting',
    'Carpentry',
    'Appliance Repair',
    'Salon',
    'Tutoring',
  ];

  return (
    <>
      <Header />
      
      <main>
        {/* Hero Section */}
        <section
          className="relative overflow-hidden text-white py-24"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(8, 47, 128, 0.9), rgba(16, 84, 196, 0.78), rgba(14, 116, 171, 0.72)), url('${heroBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-cyan-300/20 blur-2xl" />

          <div className="container-max relative section-fade-in">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 bg-white/20 border border-white/35 rounded-full px-4 py-1.5 text-sm mb-6 text-white">
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                Booking support active all week
              </p>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5">
                Book Skilled Services Without the Usual Hassle.
              </h1>

              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl">
                Search trusted professionals, compare prices transparently, and send your booking in under 2 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/services" className="btn-light text-center">
                  Browse Services
                </Link>
                <Link href="/contact" className="btn-outline !border-white !text-white hover:!bg-white/15 text-center">
                  How It Works
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 text-sm">
                {[
                  { metric: '10k+', label: 'Services' },
                  { metric: '50k+', label: 'Customers' },
                  { metric: '4.8/5', label: 'Avg Rating' },
                  { metric: '24h', label: 'Fast Response' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl px-4 py-3 bg-slate-900/35 border border-white/30 backdrop-blur-md"
                  >
                    <p className="text-xl font-bold text-white">{item.metric}</p>
                    <p className="text-cyan-100">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Popular Categories */}
        <section className="py-16 bg-gray-50 section-fade-in">
          <div className="container-max">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/services?category=${category}`}
                  className="card text-center"
                >
                  <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mb-2">
                    {category.charAt(0)}
                  </div>
                  <p className="font-semibold">{category}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white section-fade-in">
          <div className="container-max">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featureCards.map((feature) => (
                <div key={feature.title} className="card">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-4">
                    {feature.chip}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#0f2340] text-white section-fade-in">
          <div className="container-max text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8 text-blue-100">Browse trusted services near you and submit a request in minutes.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/services" className="btn-light">
                Start Browsing
              </Link>
              <Link href="/contact" className="btn-outline !border-blue-200 !text-blue-100 hover:!bg-blue-900/40">
                Talk to Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
