import type { Language } from '../types/converter';
import { TRANSLATIONS } from '../data/translations';

interface CapabilitiesSectionProps {
  language: Language;
}

export function CapabilitiesSection({ language }: CapabilitiesSectionProps) {
  const t = TRANSLATIONS[language].capabilities;

  return (
    <section
      id="capabilities"
      className="mx-auto w-full max-w-6xl border-t border-zinc-800/80 px-4 py-16 sm:px-6"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wide text-amber-400">
          {t.sectionLabel}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-3xl">
          {t.heading}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
          {t.subheading}
        </p>
      </div>

      {/* Asymmetric Bento Layout (7/5 then 5/7) */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {t.items.map((item, idx) => {
          const spanClass =
            idx === 0 || idx === 3 ? 'lg:col-span-7' : 'lg:col-span-5';

          return (
            <div
              key={item.index}
              className={`${spanClass} flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-[#111114] p-6 sm:p-7`}
            >
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-sm font-semibold text-amber-400 tabular-nums">
                    {item.index}
                  </span>
                  <span className="font-mono text-xs text-zinc-400 tabular-nums">
                    {item.spec}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-white sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
