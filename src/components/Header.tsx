import React from 'react';
import { Compass, BookOpen, Layers, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'terms' | 'act0' | 'diagnostics';
  setActiveTab: (tab: 'studio' | 'terms' | 'act0' | 'diagnostics') => void;
  overallScore?: number;
  overallPass?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  overallScore = 91,
  overallPass = true,
}) => {
  return (
    <header className="border-b border-[#2A2E38] bg-[#14171D]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#8B4513] flex items-center justify-center shadow-md shadow-[#B8860B]/10 border border-[#DAA520]/30">
              <span className="font-serif-sc text-lg font-bold text-[#FBF6E9] select-none">东</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif-sc text-lg font-semibold tracking-wide text-[#E8E6E3]">
                  东方空间美学决策引擎
                </h1>
                <span className="text-[11px] px-1.5 py-0.5 rounded border border-[#B8860B]/40 bg-[#B8860B]/10 text-[#D4AF37] font-mono">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-[#8E95A5] hidden sm:block">
                Chinese Aesthetic Skill · 10维结构东方性与反俗套决策系统
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-[#2A2F3D] text-[#F3E5AB] shadow-sm border border-[#DAA520]/30'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1E222B]'
              }`}
            >
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span>决策工作台</span>
            </button>

            <button
              id="nav-tab-terms"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'terms'
                  ? 'bg-[#2A2F3D] text-[#F3E5AB] shadow-sm border border-[#DAA520]/30'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1E222B]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#60A5FA]" />
              <span>美学术语库</span>
            </button>

            <button
              id="nav-tab-act0"
              onClick={() => setActiveTab('act0')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'act0'
                  ? 'bg-[#2A2F3D] text-[#F3E5AB] shadow-sm border border-[#DAA520]/30'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1E222B]'
              }`}
            >
              <Layers className="w-4 h-4 text-[#34D399]" />
              <span>ACT0 云海资产</span>
            </button>

            <button
              id="nav-tab-diagnostics"
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'diagnostics'
                  ? 'bg-[#2A2F3D] text-[#F3E5AB] shadow-sm border border-[#DAA520]/30'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1E222B]'
              }`}
            >
              <Terminal className="w-4 h-4 text-[#F87171]" />
              <span>Gate 检验基准</span>
            </button>
          </nav>

          {/* Quick Status Pill */}
          <div className="hidden md:flex items-center space-x-2 pl-3 border-l border-[#2A2E38]">
            <div className="text-right">
              <div className="text-[10px] text-[#8E95A5] uppercase tracking-wider">综合东方性评分</div>
              <div className="flex items-center space-x-1.5 justify-end">
                <span className="text-sm font-bold font-mono text-[#F3E5AB]">{overallScore}</span>
                <span className="text-[10px] text-[#6B7280]">/100</span>
                <span className={`inline-block w-2 h-2 rounded-full ${overallPass ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
