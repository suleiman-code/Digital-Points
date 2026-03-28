'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <nav className="container-max flex justify-between items-center py-4">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          ServiceHub
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8">
          <Link href="/services" className="hover:text-blue-600 transition">
            Services
          </Link>
          <Link href="/about" className="hover:text-blue-600 transition">
            About
          </Link>
          <Link href="/contact" className="hover:text-blue-600 transition">
            Contact
          </Link>
        </div>

        {/* Admin Links */}
        <div className="hidden md:flex gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/admin/dashboard" className="btn-secondary">
                Dashboard
              </Link>
              <button onClick={logout} className="btn-danger">
                Logout
              </button>
            </>
          ) : (
            <Link href="/admin/login" className="btn-primary">
              Admin Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-50 p-4 space-y-4">
          <Link href="/services" className="block hover:text-blue-600">
            Services
          </Link>
          <Link href="/about" className="block hover:text-blue-600">
            About
          </Link>
          <Link href="/contact" className="block hover:text-blue-600">
            Contact
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/admin/dashboard" className="block btn-secondary">
                Dashboard
              </Link>
              <button onClick={logout} className="w-full btn-danger">
                Logout
              </button>
            </>
          ) : (
            <Link href="/admin/login" className="block btn-primary">
              Admin Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
