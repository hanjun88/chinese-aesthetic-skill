#!/usr/bin/env node
/**
 * anti-cliche-lint.js — 中式美学反俗套 CSS 审查工具
 * ============================================================
 * 检测"国潮贴图感 / 古装影视感 / 仿古景区感 / AI国风感"的代码模式
 * 
 * 用法:
 *   node anti-cliche-lint.js <css-file-path> [--json] [--compact]
 * 
 * 示例:
 *   node anti-cliche-lint.js ./ugly-page.css
 *   node anti-cliche-lint.js ./ugly-page.css --json > report.json
 * 
 * 退出码:
 *   0 = 无 HARD FAIL
 *   1 = 存在 HARD FAIL
 *   2 = 文件不存在或读取错误
 * ============================================================
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';

// ============================================================
// 规则库 — 每条规则: id, category, severity, pattern, message, fix
// ============================================================

const RULES = [
  // ===== 第一类: 国潮贴图感 (National-Trend Sticker) =====
  {
    id: 'R-STICKER-001',
    category: '国潮贴图感',
    cliche: '祥云纹样背景贴图满铺',
    severity: 'HARD_FAIL',
    // background-image 中出现 cloud / xiangyun / auspicious 关键词
    pattern: /background(-image)?\s*:[^;]*?(cloud|xiangyun|auspicious|祥云)[^;]*;/gi,
    message: '祥云纹样作为背景贴图——去掉贴纸后设计无东方性',
    fix: '删除背景贴图，改用结构留白（margin/padding）+ 月白色底营造东方感'
  },
  {
    id: 'R-STICKER-002',
    category: '国潮贴图感',
    cliche: '回纹/万字纹边框装饰',
    severity: 'HARD_FAIL',
    pattern: /border[^;]*:[^;]*?(huiwen|meander|fret|key-pattern|回纹|万字)[^;]*;/gi,
    message: '回纹/万字纹作为边框——纯装饰层，无结构意义',
    fix: '删除纹样边框，改用 1px solid var(--color-border) 的极简边框'
  },
  {
    id: 'R-STICKER-003',
    category: '国潮贴图感',
    cliche: '毛笔/书法字体标题',
    severity: 'WARNING',
    // font-family 中出现 calligraphy / brush / maobi / shufa / cursive
    pattern: /font-family\s*:[^;]*?(calligraphy|brush\s*script|maobi|shufa|cursive|毛笔|书法|STXingkai|Xingkai|LiSu|lishu|隶书)[^;]*;/gi,
    message: '毛笔/书法字体用于标题——与内容功能无关，只是"看起来中式"',
    fix: '标题改用宋体系: var(--font-serif) ("Songti SC", "Noto Serif SC", serif)'
  },
  {
    id: 'R-STICKER-004',
    category: '国潮贴图感',
    cliche: '红色印章/落款装饰元素',
    severity: 'WARNING',
    // 出现 seal / stamp / chop 关键词，且背景色为红色
    pattern: /(seal|stamp|chop|印章|落款)[^{]*\{[^}]*?(background|color)\s*:[^;]*?(#f00|#ff0000|red|#c8102e|#e60012)[^;]*;/gis,
    message: '红色印章作为装饰元素——印章应是功能（篆刻），不是贴图',
    fix: '如确需印章，用暗朱砂 var(--zhusha-500) 且面积 ≤ 8%，配合文字内容而非纯装饰'
  },
  {
    id: 'R-STICKER-005',
    category: '国潮贴图感',
    cliche: '金色描边/金色边框',
    severity: 'WARNING',
    // border 出现 #FFD700 / gold / golden
    pattern: /border[^;]*:[^;]*?(#FFD700|#ffd700|\bgold\b|\bgolden\b|金色)[^;]*;/gi,
    message: '亮金色描边——国潮贴图典型特征，无质感',
    fix: '改用哑金边框: 1px solid hsl(43, 65%, 40%, 0.35)（var(--border-gold)）'
  },
  {
    id: 'R-STICKER-006',
    category: '国潮贴图感',
    cliche: '红色渐变叠加',
    severity: 'HARD_FAIL',
    // linear-gradient 中出现 red / #f00 / #c8102e
    pattern: /linear-gradient\s*\([^)]*(red|#f00|#ff0000|#c8102e|#e60012|#d40000)[^)]*\)/gi,
    message: '红色渐变叠加——古装影视海报感',
    fix: '删除红色渐变，用纯色块或极缓的冷色渐变（如月白→浅青）'
  },
  {
    id: 'R-STICKER-007',
    category: '国潮贴图感',
    cliche: '灯笼/中国结/折扇装饰道具',
    severity: 'WARNING',
    pattern: /(lantern|chinese-knot|folded-fan|灯笼|中国结|折扇)[^{]*\{/gi,
    message: '灯笼/中国结/折扇作为装饰道具堆砌',
    fix: '删除装饰道具元素；如需表达氛围，用光影和留白暗示'
  },

  // ===== 第二类: 古装影视感 (Costume-Drama Look) =====
  {
    id: 'R-DRAMA-001',
    category: '古装影视感',
    cliche: '高饱和正红 #FF0000',
    severity: 'HARD_FAIL',
    pattern: /(#FF0000|#ff0000|#F00\b|#f00\b)/gi,
    message: '正红 #FF0000——宫墙色/国旗色，不是东方建筑色',
    fix: '改用暗朱砂: var(--zhusha-500) = hsl(16, 82%, 27%) = #8B2500'
  },
  {
    id: 'R-DRAMA-002',
    category: '古装影视感',
    cliche: '明黄/亮金 #FFD700',
    severity: 'HARD_FAIL',
    pattern: /(#FFD700|#ffd700|#FFDF00|#ffdf00)/gi,
    message: '亮金 #FFD700——电镀金/舞台金，无氧化质感',
    fix: '改用哑金/古金: var(--gujin-500) = hsl(43, 75%, 38%) = #B8860B'
  },
  {
    id: 'R-DRAMA-003',
    category: '古装影视感',
    cliche: '正红+明黄组合',
    severity: 'HARD_FAIL',
    // 由 checkRedGoldCombo 函数做上下文判断（同一文件中同时出现正红和明黄）
    contextCheck: 'red-gold-combo',
    message: '正红+明黄组合——宫墙配色，影视城布景感',
    fix: '两者都替换: 红→暗朱砂 #8B2500, 黄→哑金 #B8860B，且金色面积 ≤ 5%'
  },
  {
    id: 'R-DRAMA-004',
    category: '古装影视感',
    cliche: '宫殿剪影/宫殿背景图',
    severity: 'WARNING',
    pattern: /(palace|forbidden-city|imperial-palace|宫殿|故宫|紫禁城)[^{]*\{[^}]*background[^}]*\}/gis,
    message: '宫殿剪影作为背景——影视城海报感',
    fix: '删除宫殿背景图，用远山轮廓或纯色 + 留白表达空间进深'
  },
  {
    id: 'R-DRAMA-005',
    category: '古装影视感',
    cliche: '高饱和绿色 #00FF00 / #00C853',
    severity: 'HARD_FAIL',
    pattern: /(#00FF00|#00ff00|#00C853|#00c853|#4CAF50\b|#4caf50\b)/gi,
    message: '高饱和翠绿——圣诞配色/古装剧服化道感',
    fix: '改用石绿: hsl(120, 30%, 30%) = #2E7D32，偏灰偏暗'
  },
  {
    id: 'R-DRAMA-006',
    category: '古装影视感',
    cliche: '舞台聚光/追光效果',
    severity: 'WARNING',
    // radial-gradient 聚光灯效果 + box-shadow 强光晕
    pattern: /radial-gradient\s*\(\s*(circle|ellipse)[^)]*(white|#fff|#ffffff|yellow)[^)]*\)/gi,
    message: '舞台聚光效果——戏剧感，非天光',
    fix: '改用天光漫射: 上方柔影 + 下方淡投影（参考 --shadow-skylight）'
  },

  // ===== 第三类: 仿古景区感 (Antique-Tourist-Spot) =====
  {
    id: 'R-ANTIQUE-001',
    category: '仿古景区感',
    cliche: 'sepia 做旧滤镜满铺',
    severity: 'HARD_FAIL',
    pattern: /filter\s*:[^;]*?sepia\s*\(/gi,
    message: 'sepia 做旧滤镜——景区纪念品店色调，假做旧',
    fix: '删除 sepia 滤镜；如需时间感，用局部色差和材质纹理，不用全局滤镜'
  },
  {
    id: 'R-ANTIQUE-002',
    category: '仿古景区感',
    cliche: '木纹贴图满铺背景',
    severity: 'WARNING',
    pattern: /background[^;]*:[^;]*?(wood|woodgrain|wood-texture|木纹)[^;]*;/gi,
    message: '木纹贴图满铺——塑料仿木，无纹理方向',
    fix: '删除木纹贴图；如需木质质感，用低饱和暖色 + 极淡线性渐变暗示'
  },
  {
    id: 'R-ANTIQUE-003',
    category: '仿古景区感',
    cliche: '门票/票根/印章装饰元素',
    severity: 'WARNING',
    pattern: /(ticket|票根|门票|stamp-border|perforated)[^{]*\{/gi,
    message: '门票/票根装饰——景区文创感',
    fix: '删除票根样式；如需信息层级，用排版和留白表达'
  },
  {
    id: 'R-ANTIQUE-004',
    category: '仿古景区感',
    cliche: '高饱和多色堆砌（庙会感）',
    severity: 'HARD_FAIL',
    // 由 analyzeRuleBlock 函数做上下文判断
    contextCheck: 'multi-color-block',
    message: '单块内 3+ 种颜色堆砌——庙会/景区感',
    fix: '收敛为 1 主色 + 1 辅色 + 1 点缀色，比例 60:30:10'
  },

  // ===== 第四类: AI国风感 (AI-Guofeng) =====
  {
    id: 'R-AI-001',
    category: 'AI国风感',
    cliche: '过度渐变光晕/发光效果',
    severity: 'WARNING',
    // box-shadow 大范围扩散光晕 (blur > 100px)
    pattern: /box-shadow\s*:[^;]*?(\d{3,})px[^;]*?(\d{3,})px[^;]*;/g,
    extractBlur: true,
    message: '过度光晕（blur ≥ 100px）——AI 国风典型发光感',
    fix: '收敛阴影 blur ≤ 24px，参考 --shadow-skylight 的自然阴影'
  },
  {
    id: 'R-AI-002',
    category: 'AI国风感',
    cliche: '粒子特效/飘散动画',
    severity: 'HARD_FAIL',
    pattern: /(particle|particles|粒子|petal|petals|花瓣飘散|sakura|cherry-blossom)/gi,
    message: '粒子/花瓣飘散特效——AI 默认国风输出标配',
    fix: '删除粒子系统；如需氛围，用极缓的背景渐变变化（天光呼吸）'
  },
  {
    id: 'R-AI-003',
    category: 'AI国风感',
    cliche: '水墨笔刷素材/墨迹背景',
    severity: 'WARNING',
    pattern: /(ink-wash|brush-stroke|ink-brush|水墨|墨迹|墨滴)[^{]*\{/gi,
    message: '水墨笔刷素材贴图——AI 国风典型素材',
    fix: '删除笔刷贴图；用水墨的"留白"意境代替——大面积月白 + 少量黛色'
  },
  {
    id: 'R-AI-004',
    category: 'AI国风感',
    cliche: '纯黑 #000000 或纯白 #FFFFFF',
    severity: 'WARNING',
    pattern: /(#[0]{6}\b|#[fF]{6}\b)/g,
    message: '纯黑/纯白——无层次，无东方韵味',
    fix: '黑→黛色 hsl(0, 5%, 12%) = #1F1F1F；白→月白 hsl(42, 25%, 92%) = #F0EDE5'
  },
  {
    id: 'R-AI-005',
    category: 'AI国风感',
    cliche: '彩虹多色渐变',
    severity: 'HARD_FAIL',
    // linear-gradient 中有 3+ 个色标
    pattern: /linear-gradient\s*\([^)]*?,\s*[^)]*?,\s*[^)]*?,\s*[^)]*\)/g,
    gradientColorCheck: true,
    message: '多色渐变（≥4色标）——彩虹/廉价感',
    fix: '渐变收敛为 2 色，同色系或邻近色，饱和度 ≤ 50%'
  },

  // ===== 动效类俗套 (Motion Cliche) =====
  {
    id: 'R-MOTION-001',
    category: '动效俗套',
    cliche: '弹跳/弹性入场动画',
    severity: 'HARD_FAIL',
    pattern: /(bounce|elastic|spring|back\s*:)/gi,
    message: '弹跳/弹性缓动——西方 UI 感，非东方气韵',
    fix: '改用东方缓动: var(--ease-cloud) 或 var(--ease-water)'
  },
  {
    id: 'R-MOTION-002',
    category: '动效俗套',
    cliche: '动画时长 < 1 秒',
    severity: 'WARNING',
    pattern: /(duration|animation)\s*:[^;]*?(\d{2,3})ms/gi,
    extractDuration: true,
    message: '动画时长 < 1000ms——太急促，无呼吸感',
    fix: '最低 800ms（--dur-instant），推荐 1500ms+（--dur-reveal）'
  },
  {
    id: 'R-MOTION-003',
    category: '动效俗套',
    cliche: '线性运动 linear easing',
    severity: 'WARNING',
    pattern: /easing\s*:\s*linear|animation[^;]*?\slinear\s/g,
    message: '线性缓动——机械感，无生命',
    fix: '改用 var(--ease-water) 或 var(--ease-cloud)'
  },
  {
    id: 'R-MOTION-004',
    category: '动效俗套',
    cliche: '旋转入场 rotate',
    severity: 'HARD_FAIL',
    pattern: /(rotate\s*\(|spin|旋转入场)/gi,
    message: '旋转入场——花哨，无东方意义',
    fix: '删除旋转；入场改为"从遮挡中浮现"（opacity + translateY 微位移）'
  },
  {
    id: 'R-MOTION-005',
    category: '动效俗套',
    cliche: '闪烁/频闪 blink',
    severity: 'HARD_FAIL',
    pattern: /(blink|flicker|闪烁|频闪)/gi,
    message: '闪烁/频闪——舞台灯效果，刺眼不克制',
    fix: '删除闪烁；如需提示，用极缓的透明度呼吸（8s+ 循环）'
  },
  {
    id: 'R-MOTION-006',
    category: '动效俗套',
    cliche: '脉冲 pulse 动画',
    severity: 'WARNING',
    pattern: /(pulse|脉冲|心跳)/gi,
    message: 'pulse 脉冲——西方 UI 提示音式动画',
    fix: '改用极缓的呼吸动画: var(--dur-breath) 8s'
  },
  {
    id: 'R-MOTION-007',
    category: '动效俗套',
    cliche: '内容元素无限循环动画',
    severity: 'WARNING',
    pattern: /animation[^;]*?infinite[^;]*;/gi,
    message: '内容元素无限循环——机械感，无自然节奏',
    fix: '内容元素动画只播一次；仅背景氛围（云/光）可循环'
  },

  // ===== 布局俗套 (Layout Cliche) =====
  {
    id: 'R-LAYOUT-001',
    category: '布局俗套',
    cliche: '全居中 text-align: center 滥用',
    severity: 'WARNING',
    pattern: /text-align\s*:\s*center/gi,
    message: 'text-align: center 滥用——无左中右层级，无东方中轴秩序',
    fix: '标题/正文左对齐（符合阅读流），仅仪式性元素（印章/落款）居中'
  },
  {
    id: 'R-LAYOUT-002',
    category: '布局俗套',
    cliche: 'flex 全居中无层级',
    severity: 'WARNING',
    pattern: /justify-content\s*:\s*center[^}]*?align-items\s*:\s*center/gi,
    message: 'flex justify-center + align-center 滥用——所有元素堆在正中，无进深',
    fix: '用 margin/padding 模数系统定位，留出左右边距和留白'
  },
  {
    id: 'R-LAYOUT-003',
    category: '布局俗套',
    cliche: '完美圆形 border-radius: 50% 滥用',
    severity: 'WARNING',
    pattern: /border-radius\s*:\s*50%/gi,
    message: 'border-radius: 50% 滥用——全是圆球/圆饼，无方正规矩',
    fix: '东方美学用方矩为主，圆角 ≤ 8px（--radius-lg）；圆形仅用于印章'
  },
  {
    id: 'R-LAYOUT-004',
    category: '布局俗套',
    cliche: '绝对定位铺满 position: absolute',
    severity: 'WARNING',
    pattern: /position\s*:\s*absolute[^;]*;/gi,
    countAbsolute: true,
    message: 'position: absolute 滥用——脱离文档流，无空间秩序',
    fix: '用 Flex/Grid 文档流布局，absolute 仅用于浮层/tooltip'
  },

  // ===== 材质俗套 (Material Cliche) =====
  {
    id: 'R-MATERIAL-001',
    category: '材质俗套',
    cliche: '重毛玻璃 backdrop-filter blur',
    severity: 'WARNING',
    pattern: /backdrop-filter\s*:[^;]*?blur\s*\(\s*(\d+)px/gi,
    extractBackdropBlur: true,
    message: '重毛玻璃效果——iOS UI 感，非东方纸质透光',
    fix: '改用半透明纯色（hsl alpha 0.1-0.2）表达纸透感，不用 backdrop-filter'
  },
  {
    id: 'R-AI-006',
    category: 'AI国风感',
    cliche: '文字发光 text-shadow 光晕',
    severity: 'WARNING',
    pattern: /text-shadow\s*:[^;]*?0\s+0\s+\d{2,}px/gi,
    message: '文字发光光晕——AI 国风典型霓虹字效',
    fix: '删除 text-shadow 光晕；文字用颜色对比表达层级'
  },

  // ===== JS 层俗套 (JavaScript Cliche) =====
  {
    id: 'R-JS-001',
    category: 'JS俗套',
    cliche: 'alert() 弹窗',
    severity: 'HARD_FAIL',
    pattern: /\balert\s*\(/gi,
    message: 'alert() 弹窗——浏览器原生对话框，破坏沉浸感',
    fix: '用自定义 toast/notification 组件，样式融入东方美学'
  },
  {
    id: 'R-JS-002',
    category: 'JS俗套',
    cliche: 'confirm()/prompt() 原生对话框',
    severity: 'HARD_FAIL',
    pattern: /\b(confirm|prompt)\s*\(/gi,
    message: 'confirm()/prompt() 原生对话框——突兀，无设计感',
    fix: '用自定义 modal/dialog 组件，配合东方动势（推门入场）'
  },
  {
    id: 'R-JS-003',
    category: 'JS俗套',
    cliche: 'setInterval 做视觉动画',
    severity: 'WARNING',
    pattern: /setInterval\s*\(\s*function[^)]*(\d{2,3})\s*\)/gi,
    message: 'setInterval 做动画——帧率不稳定，掉帧感',
    fix: '视觉动画用 requestAnimationFrame 或 CSS animation'
  },
  {
    id: 'R-JS-004',
    category: 'JS俗套',
    cliche: 'document.write()',
    severity: 'HARD_FAIL',
    pattern: /document\.write\s*\(/gi,
    message: 'document.write()——过时且阻塞渲染',
    fix: '用 DOM API（createElement / appendChild）或现代框架'
  },
  {
    id: 'R-JS-005',
    category: 'JS俗套',
    cliche: 'innerHTML 拼接用户输入',
    severity: 'HARD_FAIL',
    pattern: /\.innerHTML\s*=\s*[^;]*(\+|`)/gi,
    message: 'innerHTML 拼接字符串——XSS 风险 + 反模式',
    fix: '用 textContent 设置文本，或用 DOM API 安全创建元素'
  },
];

// ============================================================
// 工具函数
// ============================================================

/**
 * 解析 CSS 文件，提取规则块及其位置
 */
function parseCSS(cssText) {
  const lines = cssText.split('\n');
  const blocks = [];
  let currentBlock = '';
  let blockStartLine = 0;
  let braceDepth = 0;
  let inBlock = false;

  lines.forEach((line, idx) => {
    if (!inBlock) {
      if (line.includes('{')) {
        inBlock = true;
        blockStartLine = idx + 1; // 1-indexed
        currentBlock = line;
        braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        if (braceDepth <= 0) {
          blocks.push({
            text: currentBlock,
            line: blockStartLine,
            selector: extractSelector(currentBlock)
          });
          inBlock = false;
          currentBlock = '';
        }
      }
    } else {
      currentBlock += '\n' + line;
      braceDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (braceDepth <= 0) {
        blocks.push({
          text: currentBlock,
          line: blockStartLine,
          selector: extractSelector(currentBlock)
        });
        inBlock = false;
        currentBlock = '';
      }
    }
  });

  return blocks;
}

function extractSelector(blockText) {
  const match = blockText.match(/^([^{]+)\{/m);
  return match ? match[1].trim() : '(unknown)';
}

/**
 * 从 CSS 值中提取 HSL 饱和度
 */
function extractSaturation(colorStr) {
  const hslMatch = colorStr.match(/hsl\s*\(\s*\d+\s*,\s*(\d+)%/i);
  if (hslMatch) return parseInt(hslMatch[1], 10);
  
  // 从 hex 转换粗略判断饱和度
  const hexMatch = colorStr.match(/#([0-9A-Fa-f]{6})/);
  if (hexMatch) {
    const r = parseInt(hexMatch[1].substring(0, 2), 16) / 255;
    const g = parseInt(hexMatch[1].substring(2, 4), 16) / 255;
    const b = parseInt(hexMatch[1].substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 0;
    const l = (max + min) / 2;
    const s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    return Math.round(s * 100);
  }
  return null;
}

/**
 * 检查颜色饱和度是否超标
 */
function checkHighSaturation(cssText) {
  const issues = [];
  const colorProps = /(color|background|background-color|border-color|fill|stroke)\s*:\s*([^;]+);/gi;
  let match;
  
  while ((match = colorProps.exec(cssText)) !== null) {
    const value = match[2].trim();
    const sat = extractSaturation(value);
    if (sat !== null && sat > 60) {
      const before = cssText.substring(0, match.index);
      const lineNum = before.split('\n').length;
      issues.push({
        ruleId: 'R-COLOR-SAT-001',
        category: '色彩俗套',
        cliche: `高饱和颜色 (S=${sat}%)`,
        severity: sat > 75 ? 'HARD_FAIL' : 'WARNING',
        line: lineNum,
        matched: match[0].trim(),
        message: `颜色饱和度 ${sat}% > 60% 上限`,
        fix: `降低饱和度至 ≤ 50%，参考 tokens.css 中的标准色值`
      });
    }
  }
  return issues;
}

/**
 * 执行单条规则检测
 */
function runRule(rule, cssText, blocks) {
  const hits = [];
  
  // 处理需要额外上下文检查的规则
  if (rule.contextCheck === 'multi-color-block') {
    // 检查每个规则块内有多少种不同的 hex 颜色值
    blocks.forEach(block => {
      const colors = block.text.match(/#[0-9A-Fa-f]{6}\b/g) || [];
      const uniqueColors = [...new Set(colors.map(c => c.toLowerCase()))];
      if (uniqueColors.length >= 3) {
        hits.push({
          ruleId: rule.id,
          category: rule.category,
          cliche: rule.cliche,
          severity: rule.severity,
          line: block.line,
          selector: block.selector,
          matched: uniqueColors.slice(0, 5).join(', '),
          message: `${rule.message}（检测到 ${uniqueColors.length} 种颜色）`,
          fix: rule.fix
        });
      }
    });
    return hits;
  }

  // 正红+明黄组合检查（全局：同一文件中同时出现两种颜色）
  if (rule.contextCheck === 'red-gold-combo') {
    const hasRed = /#FF0000|#ff0000|#F00\b/i.test(cssText);
    const hasGold = /#FFD700|#ffd700/i.test(cssText);
    if (hasRed && hasGold) {
      hits.push({
        ruleId: rule.id,
        category: rule.category,
        cliche: rule.cliche,
        severity: rule.severity,
        line: 1,
        selector: '(全局)',
        matched: '#FF0000 + #FFD700',
        message: rule.message,
        fix: rule.fix
      });
    }
    return hits;
  }

  // 处理渐变颜色数量检查
  if (rule.gradientColorCheck) {
    const gradRegex = /linear-gradient\s*\(([^)]+)\)/g;
    let m;
    while ((m = gradRegex.exec(cssText)) !== null) {
      const stops = m[1].split(',').length;
      if (stops >= 4) {
        // 找行号
        const before = cssText.substring(0, m.index);
        const lineNum = before.split('\n').length;
        hits.push({
          ruleId: rule.id,
          category: rule.category,
          cliche: rule.cliche,
          severity: rule.severity,
          line: lineNum,
          matched: m[0].substring(0, 80) + '...',
          message: `${rule.message}（检测到 ${stops} 个色标）`,
          fix: rule.fix
        });
      }
    }
    return hits;
  }

  // 处理 blur 提取
  if (rule.extractBlur) {
    const shadowRegex = /box-shadow\s*:\s*([^;]+);/gi;
    let m;
    while ((m = shadowRegex.exec(cssText)) !== null) {
      const blurMatch = m[1].match(/(\d+)px\s+(\d+)px\s+(\d+)px/);
      if (blurMatch) {
        const blur = parseInt(blurMatch[3], 10);
        if (blur >= 100) {
          const before = cssText.substring(0, m.index);
          const lineNum = before.split('\n').length;
          hits.push({
            ruleId: rule.id,
            category: rule.category,
            cliche: rule.cliche,
            severity: rule.severity,
            line: lineNum,
            matched: `box-shadow: ... blur=${blur}px`,
            message: `${rule.message}（blur=${blur}px）`,
            fix: rule.fix
          });
        }
      }
    }
    return hits;
  }

  // 处理 duration 提取
  if (rule.extractDuration) {
    const durRegex = /(?:animation|transition|duration)\s*:[^;]*?(\d+)ms/gi;
    let m;
    while ((m = durRegex.exec(cssText)) !== null) {
      const dur = parseInt(m[1], 10);
      if (dur > 0 && dur < 800) {
        const before = cssText.substring(0, m.index);
        const lineNum = before.split('\n').length;
        hits.push({
          ruleId: rule.id,
          category: rule.category,
          cliche: rule.cliche,
          severity: rule.severity,
          line: lineNum,
          matched: m[0].trim(),
          message: `${rule.message}（实际 ${dur}ms）`,
          fix: rule.fix
        });
      }
    }
    return hits;
  }

  // 处理 backdrop-filter blur 提取
  if (rule.extractBackdropBlur) {
    const bfRegex = /backdrop-filter\s*:[^;]*?blur\s*\(\s*(\d+)px/gi;
    let m;
    while ((m = bfRegex.exec(cssText)) !== null) {
      const blur = parseInt(m[1], 10);
      if (blur >= 20) {
        const before = cssText.substring(0, m.index);
        const lineNum = before.split('\n').length;
        hits.push({
          ruleId: rule.id,
          category: rule.category,
          cliche: rule.cliche,
          severity: rule.severity,
          line: lineNum,
          matched: `backdrop-filter: blur(${blur}px)`,
          message: `${rule.message}（blur=${blur}px）`,
          fix: rule.fix
        });
      }
    }
    return hits;
  }

  // 处理 absolute 定位计数
  if (rule.countAbsolute) {
    const absRegex = /position\s*:\s*absolute[^;]*;/gi;
    let m;
    let count = 0;
    let firstLine = 0;
    while ((m = absRegex.exec(cssText)) !== null) {
      count++;
      if (firstLine === 0) {
        const before = cssText.substring(0, m.index);
        firstLine = before.split('\n').length;
      }
    }
    if (count >= 3) {
      hits.push({
        ruleId: rule.id,
        category: rule.category,
        cliche: rule.cliche,
        severity: rule.severity,
        line: firstLine,
        selector: '(全局)',
        matched: `position: absolute 出现 ${count} 次`,
        message: `${rule.message}（共 ${count} 处 absolute）`,
        fix: rule.fix
      });
    }
    return hits;
  }

  // 通用正则匹配
  let match;
  const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
  while ((match = pattern.exec(cssText)) !== null) {
    // 安全保护：零宽匹配会导致无限循环，强制前进
    if (match[0].length === 0) {
      pattern.lastIndex++;
      continue;
    }

    const before = cssText.substring(0, match.index);
    const lineNum = before.split('\n').length;
    
    // 找到最近的选择器
    let selector = '(unknown)';
    for (const block of blocks) {
      if (lineNum >= block.line) {
        selector = block.selector;
      }
    }

    hits.push({
      ruleId: rule.id,
      category: rule.category,
      cliche: rule.cliche,
      severity: rule.severity,
      line: lineNum,
      selector: selector,
      matched: match[0].substring(0, 100),
      message: rule.message,
      fix: rule.fix
    });
  }

  return hits;
}

// ============================================================
// 主流程
// ============================================================

function lintFile(filePath) {
  const absPath = path.resolve(filePath);
  
  if (!fs.existsSync(absPath)) {
    console.error(`错误: 文件不存在 - ${absPath}`);
    process.exit(2);
  }

  const cssText = fs.readFileSync(absPath, 'utf-8');
  const blocks = parseCSS(cssText);
  
  const allHits = [];
  
  // 运行所有规则
  for (const rule of RULES) {
    const hits = runRule(rule, cssText, blocks);
    allHits.push(...hits);
  }

  // 额外: 高饱和度颜色检查
  const satIssues = checkHighSaturation(cssText);
  allHits.push(...satIssues);

  // 按行号排序
  allHits.sort((a, b) => a.line - b.line);

  // 统计
  const hardFails = allHits.filter(h => h.severity === 'HARD_FAIL');
  const warnings = allHits.filter(h => h.severity === 'WARNING');

  // 按类别统计
  const byCategory = {};
  allHits.forEach(h => {
    byCategory[h.category] = (byCategory[h.category] || 0) + 1;
  });

  const report = {
    file: absPath,
    timestamp: new Date().toISOString(),
    summary: {
      totalHits: allHits.length,
      hardFail: hardFails.length,
      warning: warnings.length,
      rulesChecked: RULES.length + 1, // +1 for saturation check
      byCategory: byCategory
    },
    hits: allHits
  };

  return report;
}

// ============================================================
// 输出格式化
// ============================================================

function printReport(report, asJson = false) {
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     中式美学反俗套 CSS 审查报告 (Anti-Cliche Lint)   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n文件: ${report.file}`);
  console.log(`时间: ${report.timestamp}\n`);

  console.log('── 摘要 ──');
  console.log(`  总命中: ${report.summary.totalHits}`);
  console.log(`  HARD FAIL: ${report.summary.hardFail}`, report.summary.hardFail > 0 ? '❌' : '✅');
  console.log(`  WARNING: ${report.summary.warning}`, report.summary.warning > 0 ? '⚠️' : '✅');
  console.log(`  检测规则: ${report.summary.rulesChecked} 条`);
  console.log('\n  按类别:');
  for (const [cat, count] of Object.entries(report.summary.byCategory)) {
    console.log(`    - ${cat}: ${count} 处`);
  }

  if (report.hits.length === 0) {
    console.log('\n  🎉 未检测到俗套模式！设计通过反俗套审查。\n');
    return;
  }

  console.log('\n── 详细命中 ──');
  report.hits.forEach((hit, i) => {
    const icon = hit.severity === 'HARD_FAIL' ? '❌' : '⚠️';
    console.log(`\n  [${i + 1}] ${icon} ${hit.ruleId} (${hit.severity})`);
    console.log(`      类别: ${hit.category} — ${hit.cliche}`);
    console.log(`      位置: 第 ${hit.line} 行 (${hit.selector})`);
    console.log(`      命中: ${hit.matched}`);
    console.log(`      问题: ${hit.message}`);
    console.log(`      修复: ${hit.fix}`);
  });

  console.log('\n' + '─'.repeat(50));
  if (report.summary.hardFail > 0) {
    console.log(`结论: ❌ 不通过 — 存在 ${report.summary.hardFail} 处 HARD FAIL，必须修复`);
  } else if (report.summary.warning > 0) {
    console.log(`结论: ⚠️ 需修正 — ${report.summary.warning} 处 WARNING，建议优化`);
  } else {
    console.log('结论: ✅ 通过');
  }
  console.log('');
}

// ============================================================
// CLI 入口
// ============================================================

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
中式美学反俗套 CSS 审查工具 (anti-cliche-lint)

用法:
  node anti-cliche-lint.js <css-file> [选项]

选项:
  --json      输出 JSON 格式报告
  --compact   紧凑模式（只输出命中数）
  --help      显示帮助

示例:
  node anti-cliche-lint.js ./page.css
  node anti-cliche-lint.js ./page.css --json > report.json
`);
    process.exit(0);
  }

  const filePath = args[0];
  const asJson = args.includes('--json');

  const report = lintFile(filePath);
  printReport(report, asJson);

  // 退出码
  process.exit(report.summary.hardFail > 0 ? 1 : 0);
}

main();
