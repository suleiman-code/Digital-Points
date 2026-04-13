'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isNotHome = pathname !== '/';

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
    <header className="fixed top-0 left-0 right-0 z-[80] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition-all duration-300">
      <nav className="container-max flex justify-between items-center py-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-700 tracking-tight hover:opacity-80 transition-opacity">
            Digital Point
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-2 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg transition ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/60'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Admin Link */}
        <div className="hidden md:flex gap-4">
          <Link href="/admin/login" className="btn-primary">
            Admin Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg border border-slate-200"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? 'X' : 'Menu'}
        </button>
      </nav>

      {/* Sub-navbar for BACK button (Visible only on subpages) */}
      {isNotHome && (
        <div className="bg-slate-50/80 backdrop-blur-md border-t border-b border-slate-100 py-2.5">
          <div className="container-max flex items-center">
            <Link
              href="/"
              className="group flex items-center gap-2 py-1.5 px-4 sm:py-2 sm:px-5 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </Link>
          </div>
        </div>
      )}
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden bg-gray-50 p-4 space-y-3 border-t border-blue-100">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 transition ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:text-blue-700 hover:bg-blue-100/50'
                }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            className="block btn-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Admin Login
          </Link>
        </div>
      )}
    </header>
  );
}
