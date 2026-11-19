import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ConverterWorkspace } from './components/ConverterWorkspace';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { SupportSection } from './components/SupportSection';
import { Footer } from './components/Footer';
import type { Language } from './types/converter';

export default function App() {
  const [language, setLanguage] = useState<Language>('bn');

  return (
    <div className="flex min-h-screen flex-col bg-[#09090B] text-zinc-100">
      <Navbar language={language} />

      <main className="flex-1">
        <ConverterWorkspace language={language} onLanguageChange={setLanguage} />
        <CapabilitiesSection language={language} />
        <SupportSection language={language} />
      </main>

      <Footer language={language} />
    </div>
  );
}
