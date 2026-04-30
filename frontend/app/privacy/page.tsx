import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        <section className="bg-white border-b border-blue-100 pt-32 pb-10">
          <div className="container-max">
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-slate-600">How we collect, use, and protect your information.</p>
          </div>
        </section>

        <section className="container-max py-10">
          <div className="card space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Information We Collect</h2>
              <p className="text-slate-600">
                We collect contact details and booking preferences that you submit through our forms to process your requests.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">How We Use Information</h2>
              <p className="text-slate-600">
                Your data is used to connect you with service providers, send booking updates, and improve customer support.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">Data Security</h2>
              <p className="text-slate-600">
                We apply reasonable technical and organizational safeguards to keep your information secure.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">Contact</h2>
              <p className="text-slate-600">
                For privacy questions, contact us at info@digitalpointllc.com.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
