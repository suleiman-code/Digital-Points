'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
      <nav className="container-max flex justify-between items-center py-4">
        <Link href="/" className="text-2xl font-bold text-blue-700 tracking-tight">
          Digital Point
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-2 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg transition ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/60'
              }`}
            >
              {item.label}
            </Link>
          ))}
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
          className="md:hidden p-2 rounded-lg border border-slate-200"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? 'X' : 'Menu'}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden bg-gray-50 p-4 space-y-3 border-t border-blue-100">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 transition ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:text-blue-700 hover:bg-blue-100/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                href="/admin/dashboard"
                className="block btn-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full btn-danger"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/admin/login"
              className="block btn-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
