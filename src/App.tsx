import React, { useState } from 'react';
import { Header } from './components/Header';
import { EngineStudio } from './components/EngineStudio';
import { TermsExplorer } from './components/TermsExplorer';
import { Act0Showcase } from './components/Act0Showcase';
import { GateDiagnostics } from './components/GateDiagnostics';

export function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'terms' | 'act0' | 'diagnostics'>('studio');

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E5E3DF] flex flex-col selection:bg-[#B8860B]/30 selection:text-[#F3E5AB]">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overallScore={91}
        overallPass={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'studio' && <EngineStudio />}
        {activeTab === 'terms' && <TermsExplorer />}
        {activeTab === 'act0' && <Act0Showcase />}
        {activeTab === 'diagnostics' && <GateDiagnostics />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222733] bg-[#12151B] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8E95A5]">
          <div className="flex items-center space-x-2">
            <span className="font-serif-sc text-[#D4AF37] font-semibold">东方空间美学决策引擎</span>
            <span>·</span>
            <span>Chinese Aesthetic Skill</span>
            <span>·</span>
            <span className="font-mono text-[11px]">v1.0.0</span>
          </div>

          <div className="text-center sm:text-right font-serif-sc text-[#9CA3AF]">
            “计白当黑，虚实相生；中轴微偏，物我同生。”
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
