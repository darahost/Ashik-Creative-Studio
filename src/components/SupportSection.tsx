import { useState } from 'react';
import { Check, Copy, ExternalLink, Mail, Phone, Globe } from 'lucide-react';
import type { Language } from '../types/converter';
import { TRANSLATIONS } from '../data/translations';

interface SupportSectionProps {
  language: Language;
}

export function SupportSection({ language }: SupportSectionProps) {
  const t = TRANSLATIONS[language].support;
  const [avatarError, setAvatarError] = useState(false);
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);

  const copyValue = async (field: 'phone' | 'email', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  return (
    <section
      id="support"
      className="mx-auto w-full max-w-6xl border-t border-zinc-800/80 px-4 py-16 sm:px-6"
    >
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Developer & Contact Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-[#111114] p-6 sm:p-8 lg:col-span-7">
          <div>
            <p className="text-xs font-semibold tracking-wide text-amber-400">
              {t.sectionLabel}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-3xl">
              {t.heading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {t.description}
            </p>

            {/* Developer Profile Row */}
            <div className="mt-6 flex items-center gap-4 border-y border-zinc-800/80 py-5">
              {!avatarError ? (
                <img
                  src="/assets/aistudio/Website_Developer_Profile_-Profile-Image-1x1_c94a9a73.jpg"
                  alt="Md Ashik Ahmed"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="h-16 w-16 shrink-0 rounded-full border border-amber-500/40 object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-zinc-900 font-display text-lg font-bold text-amber-400"
                >
                  MA
                </div>
              )}
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-white">
                  Md Ashik Ahmed
                </p>
                <p className="text-xs text-zinc-400 sm:text-sm">{t.role}</p>
              </div>
            </div>
          </div>

          {/* Contact Rows */}
          <div className="mt-6 divide-y divide-zinc-800/80">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <p className="text-xs text-zinc-500">{t.mobileLabel}</p>
                  <a
                    href="tel:+8801303216921"
                    className="font-mono text-sm font-medium text-zinc-100 hover:text-amber-300 tabular-nums"
                  >
                    +8801303216921
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyValue('phone', '+8801303216921')}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-800 bg-[#09090B] px-2.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
              >
                {copiedField === 'phone' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-300">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.copy}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{t.emailLabel}</p>
                  <a
                    href="mailto:ashik.oysterit@gmail.com"
                    className="block truncate font-mono text-sm font-medium text-zinc-100 hover:text-amber-300"
                  >
                    ashik.oysterit@gmail.com
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyValue('email', 'ashik.oysterit@gmail.com')}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-800 bg-[#09090B] px-2.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
              >
                {copiedField === 'email' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-300">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.copy}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{t.websiteLabel}</p>
                  <a
                    href="https://ashikcreativestudio.github.io/home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 break-all font-mono text-sm font-medium text-amber-300 hover:underline"
                  >
                    <span>https://ashikcreativestudio.github.io/home</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting & Guidelines Panel */}
        <div
          id="guide"
          className="flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-[#111114] p-6 sm:p-8 lg:col-span-5"
        >
          <div>
            <h3 className="font-display text-lg font-bold text-amber-300 sm:text-xl">
              {t.guideTitle}
            </h3>

            <ul className="mt-5 divide-y divide-zinc-800/80">
              {t.faqs.map((faq) => (
                <li key={faq.title} className="py-4 first:pt-0 last:pb-0">
                  <h4 className="text-sm font-semibold text-zinc-100">
                    {faq.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    {faq.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
