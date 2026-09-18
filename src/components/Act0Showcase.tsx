import React, { useState } from 'react';
import { Layers, Activity, Sparkles, Box, Wind, Compass, ChevronRight, Info } from 'lucide-react';

const FSM_STATES = [
  { id: 'idle', name: '静止 (Idle)', desc: '云海基础慢速对流，门体悬浮，空灵留白', trigger: '初始/空闲状态' },
  { id: 'cloud-disturb', name: '扰动云海 (Disturb)', desc: '鼠标微风拂过，流体粒子向两侧轻微泛起涟漪', trigger: '鼠标滑过云海' },
  { id: 'growth-trigger', name: '生长触发 (Growth)', desc: '裂隙发光 → 苔藓萌发蔓延 → 物我同生演化', trigger: '点击云层/基座' },
  { id: 'door-rotate', name: '门旋转 (Rotate)', desc: '拖拽门扉绕Y轴轻微张合，透出未知世界天光', trigger: '拖拽门扇' },
  { id: 'dive-swirl', name: '下潜旋流 (Dive)', desc: '镜头Z轴纵深推移，云雾涡旋散开，暗金粒子微亮', trigger: '页面滚轮下潜' },
  { id: 'gate-open', name: '心门打开 (Open)', desc: '穿透门界，天地大白，金色神光透射', trigger: '下潜至极限' },
];

const MATERIAL_PRESETS = [
  { name: '檀木红门 (Sandalwood)', hex: '#8B4513', roughness: 0.64, metalness: 0.05, note: '半哑光，微带岁月包浆与原木肌理' },
  { name: '青石板基座 (Bluestone)', hex: '#4B4B4B', roughness: 0.93, metalness: 0.0, note: '糙面风化石质，附着薄层青苔' },
  { name: '云雾体质 (Mist Volume)', hex: '#E8E4D9', roughness: 1.0, metalness: 0.0, note: 'Raymarching 密度体积云，散射天光' },
  { name: '哑金配件 (Dull Gold)', hex: '#B8860B', roughness: 0.42, metalness: 0.78, note: '君臣佐使点缀≤2%，严禁高光亮金' },
];

export const Act0Showcase: React.FC = () => {
  const [activeFsm, setActiveFsm] = useState<string>('idle');
  const [activeTab, setActiveTab] = useState<'master' | 'fsm' | 'materials' | 'distillation'>('master');

  const currentState = FSM_STATES.find((s) => s.id === activeFsm) || FSM_STATES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#B8860B]/20 text-[#D4AF37] border border-[#B8860B]/40">
                HEARTMIRROR ACT0
              </span>
              <h2 className="font-serif-sc text-lg font-bold text-[#F3E5AB]">
                云海+单门 Master Plate 资产与动势规范
              </h2>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-2xl">
              以 Ivan Chiu 云海天宫与佛光寺巨构为源流。核心意象：『满屏云海中一扇门』——中轴对称、留白突出、界的隐喻。
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center space-x-1.5 bg-[#1F242E] p-1 rounded-lg border border-[#2A2E38]">
            <button
              onClick={() => setActiveTab('master')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'master' ? 'bg-[#2D3342] text-[#F3E5AB] shadow-sm' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              主画幅规范
            </button>
            <button
              onClick={() => setActiveTab('fsm')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'fsm' ? 'bg-[#2D3342] text-[#F3E5AB] shadow-sm' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              FSM 交互状态机
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'materials' ? 'bg-[#2D3342] text-[#F3E5AB] shadow-sm' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              PBR 材质表
            </button>
            <button
              onClick={() => setActiveTab('distillation')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === 'distillation' ? 'bg-[#2D3342] text-[#F3E5AB] shadow-sm' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              美学蒸馏报告
            </button>
          </div>
        </div>
      </div>

      {/* Tab: Master Plate */}
      {activeTab === 'master' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-4">
            <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center space-x-2 border-b border-[#2A2E38] pb-3">
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span>画幅与构图几何定义 (Composition)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#9CA3AF]">画幅基准</span>
                <span className="font-mono text-[#F3E5AB]">16:9 (1920×1080) / 9:16 双画幅响应</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#9CA3AF]">门体中心位置</span>
                <span className="font-mono text-[#F3E5AB]">屏幕中心，X轴偏置 ≤ 5% (近轴平衡)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#9CA3AF]">门体画面高度占比</span>
                <span className="font-mono text-[#F3E5AB]">30% - 40% (庄严巨构但无窒息压迫)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#9CA3AF]">留白天宇与云海占比</span>
                <span className="font-mono text-emerald-400 font-bold">60% - 70% (计白当黑，东方之神)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#9CA3AF]">地面基座占比</span>
                <span className="font-mono text-[#F3E5AB]">10% - 15% (青石板承载)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#9CA3AF]">不完整入画原则</span>
                <span className="font-mono text-[#F3E5AB]">门檐一角或顶缘略出画框，暗示画外浩瀚</span>
              </div>
            </div>
          </div>

          <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-4">
            <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center space-x-2 border-b border-[#2A2E38] pb-3">
              <Layers className="w-4 h-4 text-[#60A5FA]" />
              <span>四层深度解耦规范 (Depth Layers)</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-[#13161C] border border-blue-900/30 rounded-lg text-xs">
                <div className="flex justify-between font-mono text-[#60A5FA] mb-1">
                  <span>Layer 0: 天空与极远景</span>
                  <span>Depth = 1.0</span>
                </div>
                <p className="text-[11px] text-[#8E95A5]">蔚蓝渐变至月白，逆光黄昏天色，静态低饱和渐层。</p>
              </div>

              <div className="p-3 bg-[#13161C] border border-cyan-900/30 rounded-lg text-xs">
                <div className="flex justify-between font-mono text-cyan-400 mb-1">
                  <span>Layer 1: 中景云海浪涌</span>
                  <span>Depth = 0.7</span>
                </div>
                <p className="text-[11px] text-[#8E95A5]">半透明流体体积云，慢速对流循环，鼠标扰动反应层。</p>
              </div>

              <div className="p-3 bg-[#13161C] border border-amber-900/30 rounded-lg text-xs">
                <div className="flex justify-between font-mono text-amber-400 mb-1">
                  <span>Layer 2: 核心门体与青石基座</span>
                  <span>Depth = 0.3</span>
                </div>
                <p className="text-[11px] text-[#8E95A5]">歇山顶、红木门柱、青石台基，可交互旋转与裂隙生长载体。</p>
              </div>

              <div className="p-3 bg-[#13161C] border border-emerald-900/30 rounded-lg text-xs">
                <div className="flex justify-between font-mono text-emerald-400 mb-1">
                  <span>Layer 3: 前景浮动云雾与哑金尘粒</span>
                  <span>Depth = 0.1</span>
                </div>
                <p className="text-[11px] text-[#8E95A5]">镜头前掠过的丝状微雾，向下滚动时汇聚成金色螺旋粒子。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: FSM Interactive Simulator */}
      {activeTab === 'fsm' && (
        <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-6">
          <div>
            <h3 className="font-serif-sc text-base font-semibold text-[#F3E5AB] flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#34D399]" />
              <span>ACT0 交互语义状态机模拟 (Interactive FSM)</span>
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-1">
              点击下方状态卡片模拟用户交互事件，观察东方交互隐喻（如“物我同生”、“穿越界限”）的演进。
            </p>
          </div>

          {/* Interactive Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {FSM_STATES.map((state, idx) => {
              const isActive = state.id === activeFsm;
              return (
                <button
                  key={state.id}
                  onClick={() => setActiveFsm(state.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-[#34D399] bg-[#1B2924] shadow-md shadow-[#34D399]/10 ring-1 ring-[#34D399]/30'
                      : 'border-[#2A2E38] bg-[#1C2028] hover:border-[#4B5568]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#9CA3AF] font-mono">
                    <span>0{idx + 1}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#34D399]"></span>}
                  </div>
                  <div className="font-medium text-xs text-[#F3E5AB] mt-1 truncate">
                    {state.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-[#6B7280] mt-0.5 truncate">
                    {state.trigger}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Simulator Viewport */}
          <div className="p-6 bg-[#0E1117] rounded-xl border border-[#262B37] flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden">
            <div className="relative z-10 max-w-lg space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
                当前运行状态：{currentState.name}
              </span>
              <h4 className="font-serif-sc text-xl font-bold text-[#F3E5AB]">
                {currentState.desc}
              </h4>
              <p className="text-xs text-[#8E95A5] leading-relaxed">
                交互触发机制：{currentState.trigger}。动势强调从容宁静，缓动遵循三次贝塞尔曲线，避免数码机械跳变。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PBR Materials */}
      {activeTab === 'materials' && (
        <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-4">
          <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center space-x-2 border-b border-[#2A2E38] pb-3">
            <Box className="w-4 h-4 text-[#D4AF37]" />
            <span>核心 PBR 材质参数表 (Material Engine Parameters)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MATERIAL_PRESETS.map((mat) => (
              <div key={mat.name} className="p-4 bg-[#1F242E] rounded-lg border border-[#2A2E38] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: mat.hex }}></span>
                    <span className="font-serif-sc text-sm font-semibold text-[#F3E5AB]">{mat.name}</span>
                  </div>
                  <span className="font-mono text-xs text-[#9CA3AF]">{mat.hex}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#151820] p-2 rounded">
                    <span className="text-[#6B7280] block text-[10px]">Roughness (粗糙度)</span>
                    <span className="font-mono text-[#D4AF37] font-semibold">{mat.roughness}</span>
                  </div>
                  <div className="bg-[#151820] p-2 rounded">
                    <span className="text-[#6B7280] block text-[10px]">Metalness (金属度)</span>
                    <span className="font-mono text-[#D4AF37] font-semibold">{mat.metalness}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#8E95A5] leading-relaxed pt-1">
                  {mat.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Distillation Report */}
      {activeTab === 'distillation' && (
        <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 space-y-4">
          <h3 className="font-serif-sc text-sm font-semibold text-[#E8E6E3] flex items-center space-x-2 border-b border-[#2A2E38] pb-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Ivan Chiu 云海天宫与风陵巨构蒸馏成果</span>
          </h3>

          <div className="space-y-3 text-xs text-[#C5C9D3] leading-relaxed">
            <div className="p-4 bg-[#14171E] rounded-lg border border-[#2A2E38] space-y-1">
              <h4 className="font-serif-sc font-bold text-[#F3E5AB]">1. 留白不是空无，而是气的流动</h4>
              <p className="text-[11px] text-[#8E95A5]">
                Ivan Chiu 的画面中，65%的留白不是单纯的空白背景，而是充满明暗渐变、逆光散射与流体微风的活性空间。任何试图用纹理填满空白的行为都是破坏东方气韵的致命失误。
              </p>
            </div>

            <div className="p-4 bg-[#14171E] rounded-lg border border-[#2A2E38] space-y-1">
              <h4 className="font-serif-sc font-bold text-[#F3E5AB]">2. 巨构与人尺度的崇高感</h4>
              <p className="text-[11px] text-[#8E95A5]">
                通过 10:1 至 16:1 的巨构大门与渺小人物对比，唤起东方山水画中的苍茫感与敬畏感。门不仅是建筑物，更是分割已知凡俗与未知仙境的“界”。
              </p>
            </div>

            <div className="p-4 bg-[#14171E] rounded-lg border border-[#2A2E38] space-y-1">
              <h4 className="font-serif-sc font-bold text-[#F3E5AB]">3. 坚决摒弃伪国风塑料感</h4>
              <p className="text-[11px] text-[#8E95A5]">
                严禁使用 AI 常见的高亮发光贴金、正红霓虹与无逻辑云纹叠加。材质必须包含粗糙度自然分布、微风化包浆与漫散射软阴影。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
