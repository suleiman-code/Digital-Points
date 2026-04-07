import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-50 relative pb-20">
        {/* Page Header */}
        <section className="bg-gradient-to-br from-[#0f2340] via-blue-900 to-indigo-900 text-white pt-32 pb-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-screen"></div>
          <div className="container-max relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">About Digital Point</h1>
            <p className="text-blue-100/90 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Helping local U.S. businesses get found online with accurate local citations.
            </p>
          </div>
        </section>

        {/* About Section */}
        <section className="container-max py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div className="card">
              <h2 className="text-3xl font-bold mb-4">About Us</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Digital Point LLC helps local American businesses get found online.
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed">
                If you own a business in the U.S., we make sure your customers can find your correct address, phone number, and website on the internet.
              </p>
            </div>

            <div className="card">
              <h2 className="text-3xl font-bold mb-4">What We Do</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                When people search for services near them, Google looks for businesses listed on many trusted websites and maps. This is called local citations.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We manually place your business information on the most important platforms and keep your details consistent everywhere, helping your business rank higher in local search results.
              </p>
            </div>
          </div>

          <div className="card max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">Why Choose Us?</h2>
            <ul className="space-y-5">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <div>
                  <h3 className="font-bold text-slate-800">We Are Careful</h3>
                  <p className="text-sm text-gray-600">We do not use bots. We enter your information by hand to reduce mistakes.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <div>
                  <h3 className="font-bold text-slate-800">We Help You Grow</h3>
                  <p className="text-sm text-gray-600">More listings increase visibility, and more visibility brings more customers.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <div>
                  <h3 className="font-bold text-slate-800">We Focus on the U.S.</h3>
                  <p className="text-sm text-gray-600">We know which websites work best for local U.S. businesses.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}







