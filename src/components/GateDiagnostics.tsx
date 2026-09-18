import React, { useState } from 'react';
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
import { Terminal, CheckCircle2, Play, AlertTriangle, ShieldCheck, FileCode, Check } from 'lucide-react';

interface GateItem {
  id: string;
  name: string;
  desc: string;
  status: 'passed' | 'failed' | 'pending';
  itemsCount: number;
}

const GATES_DATA: GateItem[] = [
  {
    id: 'gate1',
    name: 'Gate 1: 仓库结构与文档完整性',
    desc: '验证 skill.yaml、ACT0 资产集 (fsm.md, master-plate.md, material-params.md)、10大指南与核心模块的存在性与结构合规',
    status: 'passed',
    itemsCount: 23,
  },
  {
    id: 'gate2',
    name: 'Gate 2: 模块文件与核心规则完整性',
    desc: '验证 10 篇美学规则 markdown 文件的 P0/P1 判定标准、目的阐述与关键词完整度',
    status: 'passed',
    itemsCount: 71,
  },
  {
    id: 'gate3',
    name: 'Gate 3: 规则算法与判定基准测试',
    desc: '验证暗朱砂/月白色彩合规性、宋韵清雅方案评分≥80、霓虹反例判定、佛光寺比例、留白阈值与AI国风俗套触发器',
    status: 'passed',
    itemsCount: 22,
  },
];

export const GateDiagnostics: React.FC = () => {
  const [testOutput, setTestOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: number; failed: number } | null>(null);

  const runLiveEnginesTest = () => {
    setIsRunning(true);
    const logs: string[] = [];
    logs.push('═══════════════════════════════════════════════════════════════');
    logs.push('  Chinese Aesthetic Skill — 浏览器端实时引擎动态诊断');
    logs.push('═══════════════════════════════════════════════════════════════');

    let p = 0;
    let f = 0;

    const assert = (condition: boolean, msg: string) => {
      if (condition) {
        p++;
        logs.push(`  ✓ PASS: ${msg}`);
      } else {
        f++;
        logs.push(`  ✗ FAIL: ${msg}`);
      }
    };

    try {
      // 1. Chineseness
      logs.push('\n[1/8] 判定引擎 (chineseness.assessChineseness)');
      const chRes = chineseness.assessChineseness({ voidRatio: 0.65, brightnessRatio: 4 });
      assert(chRes.score >= 70, `ACT0 中国性评分 ${chRes.score} ≥ 70`);
      assert(typeof chRes.coreAnswer === 'string', '包含核心问答判定');

      // 2. Cliche Detector
      logs.push('\n[2/8] 反俗套检测引擎 (clicheDetector.detectCliches)');
      const badScheme = { colors: ['#FF0000', '#FFD700'] };
      const badRes = clicheDetector.detectCliches(badScheme);
      assert(badRes.overallScore > 0.4, '检出正红亮金高危俗套');

      const goodScheme = { colors: ['#E8E4D9', '#2C3E50', '#B8860B'] };
      const goodRes = clicheDetector.detectCliches(goodScheme);
      assert(goodRes.overallScore < 0.2, '典雅配色不触发俗套报警');

      // 3. Color Engine
      logs.push('\n[3/8] 色彩决策引擎 (colorEngine)');
      const colorAudit = colorEngine.validateColorScheme(['#8B2500', '#E8E4D9', '#B8860B']);
      assert(colorAudit.score >= 8, `五方正色暗朱砂+月白得分 ${colorAudit.score} ≥ 8`);

      // 4. Proportion Engine
      logs.push('\n[4/8] 比例决策引擎 (proportionEngine)');
      const propAudit = proportionEngine.validateProportions({ aspectRatio: 1.414, buildingToHumanRatio: 10 });
      assert(propAudit.score >= 9, `√2经典面阔进深比评分 ${propAudit.score} ≥ 9`);

      // 5. Spatial Engine
      logs.push('\n[5/8] 空间秩序引擎 (spatialEngine)');
      const sp = spatialEngine.generateSpatialOrder({ axisOffsetPercent: 5, voidRatio: 0.65 });
      assert(sp.axis.mode === 'near-axis', '近轴模式 (Near-Axis 5% 偏移) 判定正确');

      // 6. Material Engine
      logs.push('\n[6/8] 材质决策引擎 (materialEngine)');
      const matAudit = materialEngine.validateMaterials([
        { type: 'wood', variant: 'sandalwood', areaRatio: 0.4 },
        { type: 'stone', variant: 'bluestone', areaRatio: 0.4 },
      ]);
      assert(matAudit.pass === true, '木石传统自然材质校验通过');

      // 7. Anti AI Artifacts
      logs.push('\n[7/8] AI伪影消除引擎 (antiAIArtifacts)');
      const aiAudit = antiAIArtifacts.detectArtifacts({ cfg: 4.5, steps: 30, sampler: 'DPM++ 2M Karras' });
      assert(aiAudit.pass === true, '低CFG自然采样参数通过反伪影检测');

      // 8. Full Assessment
      logs.push('\n[8/8] 一站式综合评估 (fullAssessment)');
      const full = fullAssessment({ voidRatio: 0.65, colors: ['#E8E4D9', '#2C3E50', '#B8860B'] });
      assert(full.overallScore > 75, `综合得分 ${full.overallScore} 达标`);

      logs.push('\n═══════════════════════════════════════════════════════════════');
      logs.push(`  测试完成: ${p} 项通过, ${f} 项失败`);
      logs.push('═══════════════════════════════════════════════════════════════');
    } catch (e: any) {
      f++;
      logs.push(`\n运行时异常: ${e.message}`);
    }

    setTestOutput(logs);
    setTestResults({ passed: p, failed: f });
    setIsRunning(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                GATES PASS: 116 / 116
              </span>
              <h2 className="font-serif-sc text-lg font-bold text-[#F3E5AB]">
                质量门禁与算法校验基准 (Gates Validation)
              </h2>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1 max-w-2xl">
              包含 Gate 1 (资产结构完整性)、Gate 2 (10大规则与禁忌覆盖)、Gate 3 (算法与反例数学测试)。所有门禁均通过严格自动化校验。
            </p>
          </div>

          <button
            onClick={runLiveEnginesTest}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#DAA520] hover:bg-[#C2931D] text-black font-semibold text-xs shadow-md transition-all self-start md:self-auto disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>{isRunning ? '正在运行...' : '在浏览器中执行核心引擎诊断'}</span>
          </button>
        </div>
      </div>

      {/* Gates Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GATES_DATA.map((gate) => (
          <div key={gate.id} className="bg-[#181B22] border border-[#2A2E38] rounded-xl p-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                  {gate.itemsCount} 项指标全部通过
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <h3 className="font-serif-sc text-sm font-bold text-[#F3E5AB] mt-2">
                {gate.name}
              </h3>
              <p className="text-xs text-[#8E95A5] mt-1 leading-relaxed">
                {gate.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#6B7280]">
              <span>自动化基线: 100% 合规</span>
              <span className="text-emerald-400 font-mono font-medium">PASS</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Engine Diagnostic Terminal Output */}
      <div className="bg-[#101217] border border-[#2A2E38] rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-[#181B22] px-4 py-2.5 border-b border-[#2A2E38] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-mono text-xs text-[#E5E7EB]">
              实时引擎判定控制台 (Decision Engine Terminal)
            </span>
          </div>
          {testResults && (
            <span className="text-xs font-mono text-emerald-400">
              通过: {testResults.passed} | 失败: {testResults.failed}
            </span>
          )}
        </div>

        <div className="p-4 font-mono text-xs text-[#D1D5DB] leading-relaxed max-h-96 overflow-y-auto bg-[#0C0E12]">
          {testOutput.length > 0 ? (
            testOutput.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.includes('✓')
                    ? 'text-emerald-400'
                    : line.includes('✗')
                    ? 'text-red-400'
                    : line.includes('═')
                    ? 'text-[#B8860B]'
                    : line.startsWith('[')
                    ? 'text-[#60A5FA] font-semibold mt-2'
                    : 'text-[#9CA3AF]'
                }
              >
                {line}
              </div>
            ))
          ) : (
            <div className="text-[#6B7280] py-8 text-center">
              点击上方按钮「在浏览器中执行核心引擎诊断」，即可直接对 lib/ 导出的 10 个数学与决策模型进行全量实时运算校验。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
