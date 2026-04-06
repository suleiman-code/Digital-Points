import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container-max py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Digital Point</h3>
            <p className="text-gray-400 mb-4">
              Find and book trusted services near you.
            </p>
            <p className="text-sm text-gray-500">Support: Mon-Sat, 9:00 AM to 9:00 PM</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/services" className="hover:text-white">
                  Browse Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* For Service Providers */}
          <div>
            <h4 className="font-bold mb-4">For Providers</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/admin/login" className="hover:text-white">
                  Admin Login
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Partner With Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">
            © {currentYear} Digital Point. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="mailto:info@digitalpointllc.com" className="text-gray-400 hover:text-white">
              Email Us
            </a>
            <a href="tel:+12674523317" className="text-gray-400 hover:text-white">
              Call Support
            </a>
            <a href="https://wa.me/12674523317" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
