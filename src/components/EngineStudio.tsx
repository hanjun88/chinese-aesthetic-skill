import React, { useState, useMemo } from 'react';
import {
  chineseness,
  clicheDetector,
  colorEngine,
  spatialEngine,
  lightEngine,
  proportionEngine,
  materialEngine,
  antiAIArtifacts,
  fullAssessment,
} from '../../lib/index.js';
import { DesignParams } from '../types';
import {
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Palette,
  Eye,
  Maximize2,
  Box,
  Sun,
  ShieldAlert,
  RotateCcw,
  Zap,
} from 'lucide-react';

const PRESETS: Record<string, { label: string; desc: string; data: DesignParams }> = {
  act0: {
    label: 'ACT0 云海单门',
    desc: 'Ivan Chiu 云海天宫系列：留白65%，近轴微偏5%，暗朱砂与哑金点缀',
    data: {
      sceneType: 'gate-act0',
      voidRatio: 0.65,
      colors: ['#E8E4D9', '#2C3E50', '#B8860B', '#1B3A5C'],
      colorHierarchy: { main: 0.45, secondary: 0.20, accent: 0.03, bg: 0.32 },
      brightnessRatio: 4,
      lightAngle: 135,
      buildingToHumanRatio: 10,
      aspectRatio: 1.414,
      hasIncompleteFraming: true,
      hasProgression: true,
      hasScaleAnchor: true,
      hasGodRay: true,
      hasSoftShadow: true,
      darkPartHasColor: true,
      hasPatina: true,
      spatialLayers: 2,
      axisOffsetPercent: 5,
      materials: [
        { type: 'wood', variant: 'sandalwood', areaRatio: 0.15 },
        { type: 'stone', variant: 'bluestone', areaRatio: 0.10 },
        { type: 'volume', variant: 'cloud', areaRatio: 0.65 },
        { type: 'metal', variant: 'dull-gold', areaRatio: 0.03 },
      ],
      aiParams: {
        cfg: 4.5,
        steps: 30,
        sampler: 'DPM++ 2M Karras',
        prompt: 'ancient single wooden gate suspended above boundless sea of mist, cinematic dusk light, 35mm photograph',
      },
    },
  },
  song: {
    label: '宋韵禅意清雅堂',
    desc: '宋代清雅美学：计白当黑，低饱和天青与月白，君臣佐使典范',
    data: {
      sceneType: 'interior-hall',
      voidRatio: 0.55,
      colors: ['#DCE2DC', '#5B6E74', '#7E4B35', '#F5F5F0'],
      colorHierarchy: { main: 0.50, secondary: 0.25, accent: 0.05, bg: 0.20 },
      brightnessRatio: 3,
      lightAngle: 90,
      buildingToHumanRatio: 4,
      aspectRatio: 1.5,
      hasIncompleteFraming: true,
      hasProgression: true,
      hasScaleAnchor: true,
      hasGodRay: false,
      hasSoftShadow: true,
      darkPartHasColor: true,
      hasPatina: true,
      spatialLayers: 3,
      axisOffsetPercent: 3,
      materials: [
        { type: 'wood', variant: 'cypress', areaRatio: 0.30 },
        { type: 'paper', variant: 'rice-paper', areaRatio: 0.20 },
        { type: 'stone', variant: 'granite', areaRatio: 0.15 },
      ],
      aiParams: {
        cfg: 5.0,
        steps: 28,
        sampler: 'Euler a',
        prompt: 'song dynasty zen teahouse, soft diffused morning daylight, minimal composition',
      },
    },
  },
  megastructure: {
    label: '佛光寺巨构大殿',
    desc: '梁思成唐代木构巨构：1:2面阔进深比，斗拱出檐深远，庄严厚重',
    data: {
      sceneType: 'temple-megastructure',
      voidRatio: 0.40,
      colors: ['#8B2500', '#2E3842', '#B8860B', '#11161D'],
      colorHierarchy: { main: 0.60, secondary: 0.25, accent: 0.05, bg: 0.10 },
      brightnessRatio: 6,
      lightAngle: 45,
      buildingToHumanRatio: 16,
      aspectRatio: 2.0,
      hasIncompleteFraming: false,
      hasProgression: true,
      hasScaleAnchor: true,
      hasGodRay: true,
      hasSoftShadow: true,
      darkPartHasColor: true,
      hasPatina: true,
      spatialLayers: 4,
      axisOffsetPercent: 0,
      materials: [
        { type: 'wood', variant: 'aged-pine', areaRatio: 0.50 },
        { type: 'stone', variant: 'bluestone', areaRatio: 0.25 },
        { type: 'tile', variant: 'clay-tile', areaRatio: 0.25 },
      ],
      aiParams: {
        cfg: 6.0,
        steps: 32,
        sampler: 'DPM++ 2M Karras',
        prompt: 'tang dynasty monumental wooden temple, giant timber bracketing, dramatic low angle mist',
      },
    },
  },
  cliche: {
    label: '反例：俗套国潮高饱和',
    desc: '典型违规：正红亮金、无留白、霓虹饱和度溢出、符号化堆砌',
    data: {
      sceneType: 'generic-guochao',
      voidRatio: 0.15,
      colors: ['#FF0000', '#FFD700', '#00FFFF', '#FF00FF'],
      colorHierarchy: { main: 0.40, secondary: 0.30, accent: 0.20, bg: 0.10 },
      brightnessRatio: 1.5,
      lightAngle: 0,
      buildingToHumanRatio: 2,
      aspectRatio: 1.0,
      hasIncompleteFraming: false,
      hasProgression: false,
      hasScaleAnchor: false,
      hasGodRay: false,
      hasSoftShadow: false,
      darkPartHasColor: false,
      hasPatina: false,
      spatialLayers: 1,
      axisOffsetPercent: 20,
      materials: [
        { type: 'plastic', variant: 'glossy', areaRatio: 0.40 },
        { type: 'metal', variant: 'shiny-gold', areaRatio: 0.40 },
      ],
      aiParams: {
        cfg: 12.0,
        steps: 50,
        sampler: 'Euler',
        prompt: '8k resolution masterpiece ultra-realistic chinese dragon cyberpunk neon red gold floating palace',
      },
    },
  },
};

const TRADITIONAL_COLORS = [
  { name: '月白 (金/西)', hex: '#E8E4D9', role: '背景/清润' },
  { name: '黛蓝 (水/北)', hex: '#2C3E50', role: '佐使/沉稳' },
  { name: '哑金 (土/中)', hex: '#B8860B', role: '点缀/温润' },
  { name: '暗朱砂 (火/南)', hex: '#8B2500', role: '点缀/古朴' },
  { name: '苍青 (木/东)', hex: '#3B5953', role: '辅色/生机' },
  { name: '玄青 (水/幽)', hex: '#1B242A', role: '底色/深邃' },
  { name: '正红 [俗套]', hex: '#FF0000', role: '高危P0' },
  { name: '亮金 [俗套]', hex: '#FFD700', role: '高危P0' },
];

export const EngineStudio: React.FC = () => {
  const [currentPresetKey, setCurrentPresetKey] = useState<string>('act0');
  const [design, setDesign] = useState<DesignParams>(PRESETS.act0.data);
  const [copied, setCopied] = useState(false);

  // Run full assessment whenever design parameters change
  const assessment = useMemo(() => {
    try {
      return fullAssessment(design);
    } catch (err) {
      console.error('Assessment calculation error:', err);
      return null;
    }
  }, [design]);

  // Spatial engine calculation
  const spatialInfo = useMemo(() => {
    try {
      return spatialEngine.generateSpatialOrder({
        canvasWidth: 1920,
        canvasHeight: 1080,
        axisMode: design.axisOffsetPercent > 0 ? 'near-axis' : 'central-axis',
        axisOffsetPercent: design.axisOffsetPercent,
        roomsCount: 5,
        voidRatio: design.voidRatio,
      });
    } catch (e) {
      return null;
    }
  }, [design.axisOffsetPercent, design.voidRatio]);

  // Anti-AI artifacts audit
  const aiAudit = useMemo(() => {
    try {
      if (!design.aiParams) return null;
      return antiAIArtifacts.fullAudit(design.aiParams);
    } catch (e) {
      return null;
    }
  }, [design.aiParams]);

  const handleSelectPreset = (key: string) => {
    setCurrentPresetKey(key);
    setDesign({ ...PRESETS[key].data });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(design, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const overallScore = assessment?.overallScore ?? 0;
  const isAuthentic = assessment?.level === 'authentic';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Preset Selector Banner */}
      <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2E38]">
          <div>
            <h2 className="text-base font-semibold text-[#F3E5AB] font-serif-sc flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#D4AF37]" />
              <span>美学评估预设方案</span>
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              快速加载不同历史时期及反面教学场景，观测10维引擎的实时推演
            </p>
          </div>
          <button
            onClick={handleCopyJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#242833] hover:bg-[#2F3442] border border-[#3A4050] text-xs text-[#D1D5DB] transition-all self-start sm:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#9CA3AF]" />}
            <span>{copied ? '已复制 JSON' : '复制设计参数'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {Object.entries(PRESETS).map(([key, item]) => {
            const isSelected = currentPresetKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSelectPreset(key)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-[#DAA520] bg-[#222733] shadow-md shadow-[#DAA520]/5 ring-1 ring-[#DAA520]/20'
                    : 'border-[#2D3340] bg-[#1C2028] hover:border-[#4B5568] hover:bg-[#202530]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif-sc font-medium text-sm text-[#F3E5AB]">{item.label}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-[#DAA520]"></span>}
                </div>
                <p className="text-[11px] text-[#9CA3AF] mt-1 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Engine Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-[#2A2E38] pb-3">
              <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center space-x-2">
                <Box className="w-4 h-4 text-[#D4AF37]" />
                <span>核心结构参数调节</span>
              </h3>
              <button
                onClick={() => handleSelectPreset('act0')}
                className="text-[11px] text-[#9CA3AF] hover:text-[#D4AF37] flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置到 ACT0</span>
              </button>
            </div>

            {/* Void Ratio */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#9CA3AF] font-medium">留白比例 (Void Ratio)</span>
                <span className="font-mono text-[#D4AF37] font-semibold">{(design.voidRatio * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={design.voidRatio}
                onChange={(e) => setDesign({ ...design, voidRatio: parseFloat(e.target.value) })}
                className="w-full accent-[#DAA520] bg-[#2A2F3D] h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#6B7280]">
                <span>10% (压抑繁冗)</span>
                <span>50%-70% (东方正统·计白当黑)</span>
                <span>90% (极度空灵)</span>
              </div>
            </div>

            {/* Axis Offset */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#9CA3AF] font-medium">中轴微偏 (Near-Axis Offset)</span>
                <span className="font-mono text-[#D4AF37] font-semibold">{design.axisOffsetPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={design.axisOffsetPercent}
                onChange={(e) => setDesign({ ...design, axisOffsetPercent: parseInt(e.target.value) })}
                className="w-full accent-[#DAA520] bg-[#2A2F3D] h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#6B7280]">
                <span>0% (绝对对称·西方仪式)</span>
                <span>3%-8% (东方生动近轴)</span>
                <span>&gt;15% (散乱失衡)</span>
              </div>
            </div>

            {/* Aspect Ratio & Scale */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#9CA3AF] block mb-1">面阔进深比 (Aspect)</label>
                <select
                  value={design.aspectRatio}
                  onChange={(e) => setDesign({ ...design, aspectRatio: parseFloat(e.target.value) })}
                  className="w-full bg-[#1F242E] border border-[#3A4050] text-[#E5E7EB] text-xs rounded p-2 focus:border-[#DAA520] outline-none"
                >
                  <option value={1.414}>√2 ≈ 1.414 (经典宋木构)</option>
                  <option value={1.5}>3:2 = 1.500 (标准殿宇)</option>
                  <option value={2.0}>1:2 = 2.000 (佛光寺大唐巨构)</option>
                  <option value={1.0}>1:1 = 1.000 (反例方盒)</option>
                  <option value={0.707}>1:√2 ≈ 0.707 (高瘦)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#9CA3AF] block mb-1">建筑:人巨构尺度比</label>
                <select
                  value={design.buildingToHumanRatio}
                  onChange={(e) => setDesign({ ...design, buildingToHumanRatio: parseInt(e.target.value) })}
                  className="w-full bg-[#1F242E] border border-[#3A4050] text-[#E5E7EB] text-xs rounded p-2 focus:border-[#DAA520] outline-none"
                >
                  <option value={10}>10:1 (ACT0 云海单门巨构)</option>
                  <option value={16}>16:1 (唐代皇家重檐)</option>
                  <option value={4}>4:1 (文人小品园林)</option>
                  <option value={2}>2:1 (民居尺度)</option>
                </select>
              </div>
            </div>

            {/* Colors System Selection */}
            <div className="space-y-2 pt-2 border-t border-[#2A2E38]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF] font-medium flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>当前调色盘 (五方正色与君臣佐使)</span>
                </span>
                <span className="text-[10px] text-[#D4AF37]">45:20:3:32 配比</span>
              </div>

              <div className="flex items-center space-x-2">
                {design.colors.map((c, i) => (
                  <div key={i} className="flex-1 text-center group relative">
                    <div
                      className="h-9 rounded-md border border-white/10 shadow-inner flex items-center justify-center font-mono text-[9px] text-white/70"
                      style={{ backgroundColor: c }}
                    >
                      {c}
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] mt-0.5 block truncate">
                      {i === 0 ? '主' : i === 1 ? '辅' : i === 2 ? '点' : '底'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick swatch picker */}
              <div className="pt-2">
                <span className="text-[10px] text-[#6B7280] block mb-1">五方传统经典色卡快速选用：</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {TRADITIONAL_COLORS.map((tc) => (
                    <button
                      key={tc.name}
                      onClick={() => {
                        const newColors = [...design.colors];
                        newColors[2] = tc.hex; // replace accent
                        setDesign({ ...design, colors: newColors });
                      }}
                      className="flex items-center space-x-1.5 p-1 rounded bg-[#20242E] hover:bg-[#282E3B] border border-white/5 text-[10px] text-left"
                    >
                      <span className="w-3 h-3 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: tc.hex }}></span>
                      <span className="text-[#C5C8D0] truncate">{tc.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Boolean Switches */}
            <div className="space-y-2 pt-2 border-t border-[#2A2E38]">
              <span className="text-xs text-[#9CA3AF] font-medium block">东方审美布景原则开关</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center space-x-2 bg-[#202530] p-2 rounded cursor-pointer hover:bg-[#262C3A]">
                  <input
                    type="checkbox"
                    checked={design.hasIncompleteFraming}
                    onChange={(e) => setDesign({ ...design, hasIncompleteFraming: e.target.checked })}
                    className="accent-[#DAA520] rounded"
                  />
                  <span className="text-[#D1D5DB] text-[11px]">不完整入画 (借景)</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#202530] p-2 rounded cursor-pointer hover:bg-[#262C3A]">
                  <input
                    type="checkbox"
                    checked={design.hasProgression}
                    onChange={(e) => setDesign({ ...design, hasProgression: e.target.checked })}
                    className="accent-[#DAA520] rounded"
                  />
                  <span className="text-[#D1D5DB] text-[11px]">进深层级序列表现</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#202530] p-2 rounded cursor-pointer hover:bg-[#262C3A]">
                  <input
                    type="checkbox"
                    checked={design.hasSoftShadow}
                    onChange={(e) => setDesign({ ...design, hasSoftShadow: e.target.checked })}
                    className="accent-[#DAA520] rounded"
                  />
                  <span className="text-[#D1D5DB] text-[11px]">软阴影与漫反射</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#202530] p-2 rounded cursor-pointer hover:bg-[#262C3A]">
                  <input
                    type="checkbox"
                    checked={design.hasGodRay}
                    onChange={(e) => setDesign({ ...design, hasGodRay: e.target.checked })}
                    className="accent-[#DAA520] rounded"
                  />
                  <span className="text-[#D1D5DB] text-[11px]">丁达尔体积光</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#202530] p-2 rounded cursor-pointer hover:bg-[#262C3A]">
                  <input
                    type="checkbox"
                    checked={design.darkPartHasColor}
                    onChange={(e) => setDesign({ ...design, darkPartHasColor: e.target.checked })}
                    className="accent-[#DAA520] rounded"
                  />
                  <span className="text-[#D1D5DB] text-[11px]">暗部含色(非死黑)</span>
                </label>

                <label className="flex items-center space-x-2 bg-[#202530] p-2 rounded cursor-pointer hover:bg-[#262C3A]">
                  <input
                    type="checkbox"
                    checked={design.hasPatina}
                    onChange={(e) => setDesign({ ...design, hasPatina: e.target.checked })}
                    className="accent-[#DAA520] rounded"
                  />
                  <span className="text-[#D1D5DB] text-[11px]">时间风化与包浆痕迹</span>
                </label>
              </div>
            </div>
          </div>

          {/* Anti-AI Artifacts Control Card */}
          {design.aiParams && (
            <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#2A2E38] pb-2">
                <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-[#60A5FA]" />
                  <span>AI生图防伪影参数测试</span>
                </h3>
                {aiAudit && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    aiAudit.riskLevel === 'high' ? 'bg-red-950/80 text-red-300 border border-red-800/50' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                  }`}>
                    伪影风险: {aiAudit.riskScore}/100 ({aiAudit.riskLevel})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[#9CA3AF]">
                    <span>CFG Scale</span>
                    <span className="font-mono text-[#D4AF37]">{design.aiParams.cfg}</span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="14.0"
                    step="0.5"
                    value={design.aiParams.cfg}
                    onChange={(e) => setDesign({
                      ...design,
                      aiParams: { ...design.aiParams!, cfg: parseFloat(e.target.value) },
                    })}
                    className="w-full accent-[#60A5FA] bg-[#2A2F3D] h-1.5 rounded cursor-pointer"
                  />
                  <span className="text-[10px] text-[#6B7280]">&gt;8易过拟合塑料感</span>
                </div>

                <div>
                  <div className="flex justify-between text-[#9CA3AF]">
                    <span>Steps 采样步数</span>
                    <span className="font-mono text-[#D4AF37]">{design.aiParams.steps}</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="1"
                    value={design.aiParams.steps}
                    onChange={(e) => setDesign({
                      ...design,
                      aiParams: { ...design.aiParams!, steps: parseInt(e.target.value) },
                    })}
                    className="w-full accent-[#60A5FA] bg-[#2A2F3D] h-1.5 rounded cursor-pointer"
                  />
                  <span className="text-[10px] text-[#6B7280]">推荐 25-35 步</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#9CA3AF] block mb-1">生图提示词 (自动审计玄学虚词)</label>
                <textarea
                  rows={2}
                  value={design.aiParams.prompt}
                  onChange={(e) => setDesign({
                    ...design,
                    aiParams: { ...design.aiParams!, prompt: e.target.value },
                  })}
                  className="w-full bg-[#1F242E] border border-[#3A4050] text-[#D1D5DB] text-xs rounded p-2 font-mono focus:border-[#60A5FA] outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Comprehensive Engines Assessment & Visual Output (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Assessment Header Card */}
          <div className={`rounded-xl border p-6 relative overflow-hidden transition-all ${
            isAuthentic
              ? 'bg-gradient-to-br from-[#1F2424] via-[#1A1E24] to-[#16181F] border-[#384E46]'
              : 'bg-gradient-to-br from-[#271E20] via-[#1E1C24] to-[#16181F] border-[#5A3838]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    isAuthentic
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                  }`}>
                    {assessment?.level === 'authentic' ? '正统东方 (Authentic)' : assessment?.level ?? '待评估'}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">
                    {assessment?.overallPass ? '✓ 全局综合通过' : '⚠ 触发俗套/结构警告'}
                  </span>
                </div>
                <h3 className="font-serif-sc text-xl font-bold text-[#F3E5AB] mt-2">
                  东方美学综合评分
                </h3>
              </div>

              <div className="flex items-baseline space-x-2 bg-black/40 px-4 py-2.5 rounded-lg border border-white/5">
                <span className="font-mono text-4xl font-extrabold text-[#F3E5AB]">{overallScore}</span>
                <span className="text-sm text-[#9CA3AF]">/100</span>
              </div>
            </div>

            {/* Core Answer Quote */}
            {assessment?.coreAnswer && (
              <div className="mt-4 p-3.5 rounded-lg bg-black/30 border border-white/10">
                <div className="text-[11px] text-[#D4AF37] font-serif-sc font-medium mb-1">
                  【核心回答】这个设计为什么是中国的？
                </div>
                <p className="text-xs text-[#D1D5DB] leading-relaxed font-sans">
                  {assessment.coreAnswer}
                </p>
              </div>
            )}
          </div>

          {/* Spatial & Proportions Visualizer */}
          <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2E38] pb-3">
              <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center space-x-2">
                <Maximize2 className="w-4 h-4 text-[#D4AF37]" />
                <span>空间秩序与虚实构图可视化 (Spatial Order)</span>
              </h3>
              <span className="text-xs text-[#9CA3AF] font-mono">
                开间: 5间 · 中轴偏置: {design.axisOffsetPercent}%
              </span>
            </div>

            {/* Visual Canvas Sandbox */}
            <div className="relative w-full h-48 rounded-lg bg-[#0F1218] border border-[#262B37] overflow-hidden flex flex-col justify-between p-4">
              {/* Grid Background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#DAA520 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              ></div>

              {/* Top Bar: Void Area */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-[#6B7280]">
                <span>留白区域 (Void: {(design.voidRatio * 100).toFixed(0)}%)</span>
                <span>{design.hasGodRay ? '✦ 丁达尔体积光已渲染' : '自然漫射'}</span>
              </div>

              {/* Central Gate / Megastructure Representation */}
              <div className="relative z-10 w-full flex justify-center items-end h-28">
                {/* Visual Architecture Object */}
                <div
                  className="transition-all duration-300 relative flex flex-col items-center justify-end"
                  style={{
                    width: `${Math.max(60, (1 - design.voidRatio) * 260)}px`,
                    transform: `translateX(${design.axisOffsetPercent * 1.8}px)`,
                  }}
                >
                  {/* Roof Eave (飞檐) */}
                  <div
                    className="w-full h-3 rounded-t-sm shadow-lg transition-all"
                    style={{
                      backgroundColor: design.colors[0] || '#8B2500',
                      transform: 'scaleX(1.3)',
                    }}
                  ></div>

                  {/* Pillars & Frame */}
                  <div
                    className="w-full h-20 border-x-4 flex items-center justify-center transition-all relative overflow-hidden"
                    style={{
                      borderColor: design.colors[1] || '#2C3E50',
                      backgroundColor: `${design.colors[2] || '#B8860B'}22`,
                    }}
                  >
                    {/* Interior Door Threshold / 界 */}
                    <div className="w-1/2 h-full border border-dashed border-white/20 flex items-center justify-center">
                      <span className="font-serif-sc text-[10px] text-white/50">界</span>
                    </div>
                  </div>

                  {/* Base Plinth (台基) */}
                  <div
                    className="w-full h-2 bg-[#3A4050] transition-all"
                    style={{ transform: 'scaleX(1.1)' }}
                  ></div>
                </div>

                {/* Human Scale Comparison */}
                <div className="absolute left-8 bottom-0 flex flex-col items-center opacity-60">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E5E7EB]"></div>
                  <div className="w-0.5 h-4 bg-[#E5E7EB]"></div>
                  <span className="text-[9px] text-[#9CA3AF] mt-0.5">人</span>
                </div>
              </div>

              {/* Bottom Ground Reference */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-[#6B7280] border-t border-white/5 pt-1.5">
                <span>尺度比例: {design.buildingToHumanRatio}:1</span>
                <span>进深层级: {design.spatialLayers}重院落</span>
              </div>
            </div>
          </div>

          {/* 10-Dimensions Breakdown */}
          {assessment?.engines?.chineseness?.dimensions && (
            <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-3">
              <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center justify-between border-b border-[#2A2E38] pb-3">
                <span className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>10维东方性判定引擎分解报告</span>
                </span>
                <span className="text-xs text-[#D4AF37] font-mono">
                  得分: {assessment.engines.chineseness.score}/100
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {assessment.engines.chineseness.dimensions.map((dim: any) => {
                  const score = dim.score;
                  const isGood = score >= 8;
                  const isWarning = score < 6;
                  return (
                    <div key={dim.name} className="bg-[#1F242E] p-2.5 rounded-lg border border-[#2A2E38]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#D1D5DB]">{dim.name}</span>
                        <span className={`font-mono font-bold ${
                          isGood ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-[#D4AF37]'
                        }`}>
                          {score}/10
                        </span>
                      </div>
                      <div className="w-full bg-[#2A2F3D] h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isGood ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-[#D4AF37]'
                          }`}
                          style={{ width: `${(score / 10) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-[#8E95A5] mt-1 truncate">
                        {dim.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cliche & Artifact Warnings */}
          <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-3">
            <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center space-x-2 border-b border-[#2A2E38] pb-3">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>反俗套与禁忌检测 (Cliche Detector)</span>
            </h3>

            {assessment?.engines?.cliches?.p0Count === 0 && assessment?.engines?.cliches?.p1Count === 0 ? (
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center space-x-2 text-xs text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>未检出俗套禁忌。未发现高饱和国潮大红大金、无序贴图与AI塑料油润质感。</span>
              </div>
            ) : (
              <div className="space-y-2">
                {assessment?.engines?.cliches?.cliches?.map((c: any) => (
                  <div key={c.type} className="p-3 bg-red-950/20 border border-red-800/40 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-red-300 font-semibold">
                      <span>{c.name} 风险检测</span>
                      <span className="font-mono">评分: {c.score.toFixed(2)}</span>
                    </div>
                    {c.issues?.map((issue: string, idx: number) => (
                      <p key={idx} className="text-[11px] text-[#FCA5A5] flex items-start space-x-1">
                        <span>•</span>
                        <span>{issue}</span>
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {assessment?.recommendations && assessment.recommendations.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-[#9CA3AF] font-medium block mb-1.5">引擎修正优化建议：</span>
                <ul className="space-y-1 text-xs text-[#D1D5DB]">
                  {assessment.recommendations.slice(0, 3).map((rec: any, i: number) => (
                    <li key={i} className="flex items-start space-x-2 bg-[#1E222B] p-2 rounded border border-[#2D3340]">
                      <span className="text-[#D4AF37] font-mono shrink-0">0{i + 1}</span>
                      <div>
                        <span className="font-semibold text-[#F3E5AB]">{rec.dimension}：</span>
                        <span className="text-[#9CA3AF]">{rec.action}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
