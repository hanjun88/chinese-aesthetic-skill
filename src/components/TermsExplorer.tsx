import React, { useState, useMemo } from 'react';
import termsData from '../../terms/chinese-aesthetic.json';
import { AestheticTerm } from '../types';
import { Search, BookOpen, AlertCircle, Copy, Check, Filter, Tag, Layers, ArrowUpRight } from 'lucide-react';

const LAYER_MAP: Record<string, { label: string; color: string }> = {
  layout: { label: '布局与空间 (Layout)', color: 'bg-blue-950 text-blue-300 border-blue-800' },
  color: { label: '色彩体系 (Color)', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  light: { label: '光影明暗 (Light)', color: 'bg-yellow-950 text-yellow-300 border-yellow-800' },
  material: { label: '材质物性 (Material)', color: 'bg-stone-800 text-stone-300 border-stone-600' },
  interaction: { label: '交互动势 (Interaction)', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  time: { label: '时间感 (Time)', color: 'bg-purple-950 text-purple-300 border-purple-800' },
  taboo: { label: '禁忌防坑 (Taboo)', color: 'bg-red-950 text-red-300 border-red-800' },
};

export const TermsExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allTerms: AestheticTerm[] = (termsData as any).terms || [];

  const filteredTerms = useMemo(() => {
    return allTerms.filter((term) => {
      const matchLayer = selectedLayer === 'all' || term.layer === selectedLayer;
      if (!matchLayer) return false;

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();

      return (
        term.title.toLowerCase().includes(lower) ||
        term.en.toLowerCase().includes(lower) ||
        term.plain.toLowerCase().includes(lower) ||
        term.say.toLowerCase().includes(lower) ||
        term.trap.toLowerCase().includes(lower) ||
        term.aliases?.some((a) => a.toLowerCase().includes(lower)) ||
        term.trigger?.some((t) => t.toLowerCase().includes(lower))
      );
    });
  }, [allTerms, selectedLayer, searchTerm]);

  const handleCopySay = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Info */}
      <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-sc text-lg font-semibold text-[#F3E5AB] flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[#D4AF37]" />
              <span>东方空间美学术语库</span>
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-2xl">
              共收录 {allTerms.length} 条中式美学与空间结构术语。支持用户大白话描述效果反查、专业表达规范（Say）与反俗套避坑指南（Trap）。
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="搜索术语、大白话（如'门放在哪'）..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1F242E] border border-[#3A4050] text-[#E5E7EB] text-xs rounded-lg pl-9 pr-3 py-2 placeholder-[#6B7280] focus:border-[#DAA520] outline-none"
            />
          </div>
        </div>

        {/* Layer Filters */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-[#2A2E38]">
          <button
            onClick={() => setSelectedLayer('all')}
            className={`px-3 py-1 rounded-md text-xs transition-all ${
              selectedLayer === 'all'
                ? 'bg-[#DAA520] text-black font-semibold shadow-sm'
                : 'bg-[#202530] text-[#9CA3AF] hover:text-[#E5E7EB] border border-white/5'
            }`}
          >
            全部维度 ({allTerms.length})
          </button>
          {Object.entries(LAYER_MAP).map(([key, config]) => {
            const count = allTerms.filter((t) => t.layer === key).length;
            const isSelected = selectedLayer === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedLayer(key)}
                className={`px-3 py-1 rounded-md text-xs transition-all flex items-center space-x-1 ${
                  isSelected
                    ? 'bg-[#DAA520] text-black font-semibold shadow-sm'
                    : 'bg-[#202530] text-[#9CA3AF] hover:text-[#E5E7EB] border border-white/5'
                }`}
              >
                <span>{config.label.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Terms List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.map((term) => {
          const isExpanded = expandedId === term.id;
          const layerConfig = LAYER_MAP[term.layer] || { label: term.layer, color: 'bg-gray-800 text-gray-300' };

          return (
            <div
              key={term.id}
              className={`bg-[#181B22] border rounded-xl p-5 transition-all flex flex-col justify-between ${
                isExpanded ? 'border-[#DAA520]/60 ring-1 ring-[#DAA520]/20' : 'border-[#2A2E38] hover:border-[#3E4554]'
              }`}
            >
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-serif-sc text-base font-bold text-[#F3E5AB]">
                        {term.title}
                      </h3>
                      <span className="text-xs text-[#8E95A5] font-sans font-normal">
                        {term.en}
                      </span>
                    </div>

                    {term.aliases && term.aliases.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {term.aliases.map((alias) => (
                          <span key={alias} className="text-[10px] text-[#6B7280]">
                            #{alias}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${layerConfig.color}`}>
                    {layerConfig.label.split(' ')[0]}
                  </span>
                </div>

                {/* Plain Description */}
                <p className="text-xs text-[#C5C9D3] mt-3 leading-relaxed">
                  {term.plain}
                </p>

                {/* Correct Professional Formulation (Say) */}
                <div className="mt-3 p-3 bg-[#13161C] rounded-lg border border-[#252A35] relative group">
                  <div className="flex items-center justify-between text-[11px] text-[#D4AF37] font-serif-sc mb-1">
                    <span>【规范表达 · Say】</span>
                    <button
                      onClick={() => handleCopySay(term.id, term.say)}
                      className="text-[#9CA3AF] hover:text-[#F3E5AB] flex items-center space-x-1"
                    >
                      {copiedId === term.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[10px]">{copiedId === term.id ? '已复制' : '复制表达'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#E5E7EB] font-sans leading-relaxed">
                    {term.say}
                  </p>
                </div>

                {/* Trap Warning */}
                {term.trap && (
                  <div className="mt-2.5 p-2.5 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-[#FCA5A5] flex items-start space-x-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed text-[11px]">
                      <span className="font-semibold text-red-300">防坑避雷 (Trap)：</span>
                      {term.trap}
                    </div>
                  </div>
                )}
              </div>

              {/* Triggers & Pairs Footer */}
              <div className="mt-4 pt-3 border-t border-[#252A35] flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1 text-[#6B7280] truncate max-w-[70%]">
                  <span className="text-[10px]">触发词:</span>
                  <span className="truncate text-[#8E95A5]">
                    {term.trigger?.join(' · ') || '通用'}
                  </span>
                </div>

                {term.pairs && term.pairs.length > 0 && (
                  <div className="flex items-center space-x-1 text-[10px] text-[#D4AF37]">
                    <span>配对:</span>
                    <span>{term.pairs.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
