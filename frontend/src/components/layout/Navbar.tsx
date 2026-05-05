'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export const Navbar = () => {
  const t = useTranslations('Navigation');
  const pathname = usePathname();

  const links = [
    { name: t('dashboard'), href: '/' },
    { name: t('builder'), href: '/builder' },
    { name: t('tailor'), href: '/tailor' },
    { name: t('settings'), href: '/settings' },
  ];

  return (
    <nav className="border-b-4 border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-space font-black tracking-tighter">
              MAX<span className="text-hyper-blue">RESUME</span>
            </Link>
            <div className="hidden sm:ml-12 sm:flex sm:space-x-8">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-4 text-sm font-space font-bold uppercase tracking-widest transition-colors ${
                      isActive
                        ? 'border-hyper-blue text-black'
                        : 'border-transparent text-gray-500 hover:text-black hover:border-black'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-black text-white px-3 py-1 font-space font-bold text-xs uppercase tracking-tighter shadow-brutalist-sm">
              v1.0.0
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
