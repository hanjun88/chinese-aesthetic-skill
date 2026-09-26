/**
 * cangjie.ts — 契约 A 的输出形状（sheet → CangjieRawDesignIR）
 *
 * @module modules/frontend/runtime/types/cangjie
 */

import type {
  AdvisorGrammarRule,
  CangjieRawDesignIR,
} from "./dc-types.ts";
import type { CanonicalDimensionId } from "../dimension-registry.ts";

/** sheet-to-cangjie 的完整产出 */
export interface SheetToCangjieResult {
  /** 喂 DC normalizeIntent() 的 Cangjie 扁平 IR */
  cangjieIR: CangjieRawDesignIR;
  /** 喂 G2 PatchEngine 的追加规则集（CA-ADVISOR-* / CA-TABOO-*） */
  advisorRulePack: AdvisorGrammarRule[];
  /**
   * 无法落到 Core IR 的维度（典型：motion / temporal / philosophy），
   * 转交 plan-enricher（runtime uniforms）或 sidecar 报告。
   */
  unmappedDimensions: CanonicalDimensionId[];
  /**
   * 美学分（0-100）。只进这里 / CangjieMetadata，
   * 绝不写成任何 CangjieEstimatedParameter.confidence。
   */
  aestheticScore: number;
}

/** sheet-to-cangjie 的选项（时间戳由调用方显式传入，禁 new Date()） */
export interface SheetToCangjieOptions {
  /** 形如 "chinese-aesthetic-skill@1.0.0" */
  advisorVersion: string;
  /** 调用方显式传入的捕获时间（ISO 字符串），保证哈希恒等 */
  capturedAt: string;
  /** irId 前缀（可选，默认由 sheetId 派生） */
  irId?: string;
}
