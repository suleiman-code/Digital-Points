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
      <nav className="container-max flex justify-between items-center py-4 sm:py-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group transition-all duration-300">
            <div className="flex items-center justify-center relative">
              <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/15 rounded-full blur-2xl transition-all duration-700 scale-0 group-hover:scale-150" />
              
              <svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 md:w-13 md:h-13 relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-2">
                {/* Bold D - segment restored to Black (#000000) */}
                <path d="M45 21C27 21 13 34 13 50C13 66 27 79 45 79" stroke="#000000" stroke-width="18" stroke-linecap="round" />
                
                {/* Bold P - segment with original Blue (#2563EB) */}
                <path d="M55 21V88" stroke="#2563EB" stroke-width="18" stroke-linecap="round" />
                <path d="M55 21C73 21 86 34 86 50C86 66 73 79 55 79" stroke="#2563EB" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
                
                {/* Center dot in original Blue */}
                <circle cx="50" cy="50" r="11" fill="#2563EB" className="transition-all duration-500 group-hover:fill-blue-500" />
              </svg>
            </div>
            
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black uppercase tracking-[-0.04em] text-slate-900 group-hover:text-[#2563EB] transition-all duration-300 leading-none font-logo" style={{ fontFamily: 'var(--font-logo), sans-serif' }}>
                DIGITAL<span className="text-[#2563EB]">POINT</span>
              </span>
            </div>
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
          <Link href="/admin/login" className="btn-primary-sm">
            Admin Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              <span className="text-xs font-black uppercase tracking-widest text-slate-800">Menu</span>
            </>
          )}
        </button>
      </nav>

      {/* Sub-navbar for BACK button (Visible only on subpages) */}
      {isNotHome && (
        <div className="bg-slate-50/80 backdrop-blur-md border-t border-b border-slate-100 py-2.5">
          <div className="container-max flex items-center">
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-2 py-1.5 px-4 sm:py-2 sm:px-5 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>
      )}
      {/* Mobile Menu */}
      <div 
        id="mobile-menu" 
        className={`md:hidden fixed inset-x-0 top-[72px] bg-white/95 backdrop-blur-lg border-b border-slate-100 shadow-2xl transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'
        }`}
      >
        <div className="p-5 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-xl px-4 py-3.5 text-base font-bold transition-all ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-slate-50'
                }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/admin/login"
              className="block w-full btn-primary-sm text-center py-4 rounded-xl shadow-lg shadow-blue-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
