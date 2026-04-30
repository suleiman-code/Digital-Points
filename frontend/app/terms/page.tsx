import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        <section className="bg-white border-b border-blue-100 pt-28 pb-10">
          <div className="container-max">
            <h1 className="text-4xl font-bold mb-2">Terms & Conditions</h1>
            <p className="text-slate-600">Please review these terms before using our services.</p>
          </div>
        </section>

        <section className="container-max py-10">
          <div className="card space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Platform Use</h2>
              <p className="text-slate-600">
                You agree to provide accurate booking information and use the platform only for lawful purposes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">Service Responsibility</h2>
              <p className="text-slate-600">
                Service execution is handled by listed providers. We facilitate connections and support dispute resolution.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">Pricing and Availability</h2>
              <p className="text-slate-600">
                Rates and schedules may vary by provider. Final terms are confirmed during booking.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">Updates</h2>
              <p className="text-slate-600">
                These terms may be updated to reflect platform changes. Continued use implies acceptance of revisions.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
