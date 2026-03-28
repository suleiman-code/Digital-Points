import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-white shadow-md py-8">
          <div className="container-max">
            <h1 className="text-4xl font-bold mb-2">About Digital Point</h1>
            <p className="text-gray-600">Your trusted platform for finding services</p>
          </div>
        </section>

        {/* About Section */}
        <section className="container-max py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-4">Who We Are</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Digital Point is Pakistan's leading service marketplace that connects customers with trusted service providers. We've been serving thousands of customers since our inception, helping them find reliable services for all their needs.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Our mission is to make finding and booking services simple, transparent, and trustworthy for everyone.
              </p>
            </div>

            <div className="bg-blue-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6">Our Values</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <div>
                    <h4 className="font-bold">Trust</h4>
                    <p className="text-sm text-gray-600">All service providers are verified</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <div>
                    <h4 className="font-bold">Quality</h4>
                    <p className="text-sm text-gray-600">Only the best services</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <div>
                    <h4 className="font-bold">Transparency</h4>
                    <p className="text-sm text-gray-600">Clear pricing with no hidden fees</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="card text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <p className="text-gray-600">Services Listed</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">5K+</div>
              <p className="text-gray-600">Service Providers</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">4.8⭐</div>
              <p className="text-gray-600">Average Rating</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <details className="bg-white p-6 rounded-lg shadow-md cursor-pointer">
                <summary className="font-bold flex justify-between">
                  <span>How do I book a service?</span>
                  <span>+</span>
                </summary>
                <p className="text-gray-600 mt-3">
                  Browse our services, select the one you need, and click "Book Service". Fill in your details and our team will contact you shortly.
                </p>
              </details>

              <details className="bg-white p-6 rounded-lg shadow-md cursor-pointer">
                <summary className="font-bold flex justify-between">
                  <span>Are all service providers verified?</span>
                  <span>+</span>
                </summary>
                <p className="text-gray-600 mt-3">
                  Yes, all service providers on our platform are thoroughly verified and vetted. We ensure quality and reliability.
                </p>
              </details>

              <details className="bg-white p-6 rounded-lg shadow-md cursor-pointer">
                <summary className="font-bold flex justify-between">
                  <span>What if I'm not satisfied with the service?</span>
                  <span>+</span>
                </summary>
                <p className="text-gray-600 mt-3">
                  We have a customer satisfaction guarantee. Contact our support team and we'll help resolve any issues.
                </p>
              </details>

              <details className="bg-white p-6 rounded-lg shadow-md cursor-pointer">
                <summary className="font-bold flex justify-between">
                  <span>How can I add my services to the platform?</span>
                  <span>+</span>
                </summary>
                <p className="text-gray-600 mt-3">
                  Service providers can register and list their services through our admin dashboard. Contact us for details.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
