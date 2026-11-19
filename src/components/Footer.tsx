import { useState } from 'react';
import type { Language } from '../types/converter';
import { TRANSLATIONS } from '../data/translations';

interface FooterProps {
  language: Language;
}

export function Footer({ language }: FooterProps) {
  const [logoError, setLogoError] = useState(false);
  const t = TRANSLATIONS[language].footer;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800/80 bg-[#070709] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-3">
          {!logoError ? (
            <img
              src="/assets/aistudio/logo_be4e3c0f.webp"
              alt="Ashik Creative Studio"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-8 w-8 rounded-full border border-amber-500/40 object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/40 bg-zinc-900 font-display text-xs font-bold text-amber-400"
            >
              A
            </span>
          )}
          <div>
            <p className="text-xs font-medium text-zinc-300 sm:text-sm">
              © <span className="tabular-nums">{currentYear}</span>{' '}
              <span className="text-amber-400 font-semibold">Ashik Creative Studio</span> ·{' '}
              {t.rights}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{t.disclaimer}</p>
          </div>
        </div>

        <div className="text-xs text-zinc-400">
          <span>{t.developedBy} </span>
          <span className="font-semibold text-zinc-200">Md Ashik Ahmed</span>
          <span className="mx-2 text-zinc-600" aria-hidden="true">
            ·
          </span>
          <a
            href="https://ashikcreativestudio.github.io/home"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:underline"
          >
            ashikcreativestudio.github.io/home
          </a>
        </div>
      </div>
    </footer>
  );
}
