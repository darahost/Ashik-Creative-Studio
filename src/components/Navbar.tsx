import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Language } from '../types/converter';
import { TRANSLATIONS } from '../data/translations';

interface NavbarProps {
  language: Language;
}

export function Navbar({ language }: NavbarProps) {
  const [logoError, setLogoError] = useState(false);
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-zinc-800/80 bg-[#09090B]/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#converter"
          className="flex shrink-0 items-center gap-3 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
        >
          {!logoError ? (
            <img
              src="/assets/aistudio/logo_be4e3c0f.webp"
              alt="Ashik Creative Studio"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-9 w-9 shrink-0 rounded-full border border-amber-500/50 object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/50 bg-zinc-900 font-display text-sm font-bold text-amber-400"
            >
              A
            </span>
          )}
          <span className="font-display text-base font-bold tracking-tight text-white sm:text-lg">
            Ashik <span className="gold-text">Creative Studio</span>
          </span>
        </a>

        {/* Zone 2: Single-line Navigation Links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400"
        >
          <a
            href="#converter"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-amber-300 hover:underline underline-offset-4"
          >
            {t.nav.converter}
          </a>
          <a
            href="#capabilities"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-amber-300 hover:underline underline-offset-4"
          >
            {t.nav.capabilities}
          </a>
          <a
            href="#guide"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-amber-300 hover:underline underline-offset-4"
          >
            {t.nav.guide}
          </a>
          <a
            href="#support"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-amber-300 hover:underline underline-offset-4"
          >
            {t.nav.support}
          </a>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex shrink-0 items-center">
          <a
            href="https://ashikcreativestudio.github.io/home"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-semibold text-zinc-950 transition-colors duration-150 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:text-sm"
          >
            <span>{t.nav.visitStudio}</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}
