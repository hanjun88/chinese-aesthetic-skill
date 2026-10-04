# ADR-0001 — Canonical definition of negative space (留白 / void)

Status: **ACCEPTED** (implemented in `rules/families/CAS-VS.json`, `CA-RULE.json`; enforced by `scripts/lint-rules.mjs`, `scripts/lint-conflicts.mjs` and `tests/rules/`).

Owner: chinese-aesthetic-skill (the skill is the single source of aesthetic decisions; a compiler receives them only through the explicit `AestheticConstraintSheet` hand-off artefact, whose cross-repo binding is DEFERRED / UNBOUND).

## Problem

Fourteen different numbers described "how much 留白 is right" across the two repositories (30 / 50 / 60 / 0.45 / 0.48 / 0.58 / > 0.72 ...). The evidence shows they are **not** values of one quantity, and some had no source at all.

## Evidence

The tables in sections 1 and 3 record the state of the two repositories when this decision was taken; they are history, not a statement about either repository's current state.

### 1. The two repositories measured different quantities under the same name

| | chinese-aesthetic-skill | design-compiler |
|---|---|---|
| name | `voidRatio` (留白面积比) | `negativeSpaceRatio` (`/composition/negativeSpaceRatio`) |
| definition | share of the frame that is *designed void*: sky / cloud / water / empty ground (`guidelines/void-solid.md`) | share of pixels with luma >= 180 **and** 3x3 local variance < 100 (`extraction/algorithms/negative-space.ts`) |
| consequence | counts textured void (cloud gradients, ripples) and dark-tone void | counts only *bright, flat* pixels: a lower-bound estimator that cannot see dark-tone void |

### 2. Inside the skill, 30 / 50 / 60 are different things

| value | where | what it is | history |
|---|---|---|---|
| 30 % | README rule table; `modules/void_solid.md` grade "B" | the v1 floor "留白>=30%, 虚大于实" (self-contradictory) / a grade boundary of a doc-only grading snippet (A >= 0.5, B >= 0.3, C >= 0.15) | initial commit `775d8a2`; superseded by `8f30a14` the same day |
| 60 % | `guidelines/void-solid.md` | **hard threshold** for bright-tone cinematic empty shots / landscape (亮调可推到 60-70 %); dark tone substitutes 20-40 % dark solids | `8f30a14` re-distillation |
| 50 % | `lib/chineseness.js` structural test; SKILL.md | **structural-orientalism signal** (+15 points) — a scoring signal, not a compliance floor | `775d8a2`, restated `52fa0d7` |
| 0.40 / 0.50 / 0.55 / 0.70 / 0.65 | `lib/spatial-engine.js` SCENE_PRESETS | generation defaults per scene type (palace / temple / residence / landscape / ACT0 gate) | `29097c9` |

### 3. design-compiler's period bands and sealed golden cells (void_ratio)

| period | prior band | sealed golden cells (matrix-v1.0.1) |
|---|---|---|
| TANG | [0.15, 0.40] | 0.15, 0.20, 0.28 |
| MING | [0.25, 0.50] | 0.32, 0.30 |
| SONG | [0.35, 0.65] | **0.68** (outside its own band) |

### 4. Further literals and their fate

* `ANTI-AI-02` (`< 0.40 -> 0.48`, "inject 40-60 % negative space") and `CA-RULE-01-XUSHI` (`< 0.35 -> 0.45`) repair the same quantity. design-compiler's STEP7 attribution white paper shows ANTI-AI-02's patch being overwritten by CA-RULE-01 whenever both fire (below 0.35); between 0.35 and 0.40 ANTI-AI-02 alone fires, so the repair map was non-monotonic (0.34 -> 0.45 but 0.36 -> 0.48). The "40-60 %" claim has no source in the skill and contradicts the TANG band (<= 0.40), the SONG evidence (60-80 %) and the hard floor (0.60).
* operator clamps `[0.05, 0.7]` and the evaluator rule "void >= 0.70 is unbalanced" contradict the documented 宋画山水 sky/water share of 60-80 %, 徽派 white walls of 70 %+, the 7:3 best tier (`>= 0.70`) and the skill's own scene presets (landscape 0.70).
* `CA-RULE-13` (`> 0.72 -> 0.58`, only on an unmerged branch) is a numeric cap without a skill source; it contradicts the 7:3 best tier. The skill's own rule is "void must be functional" (gradient / reflection / flow), which the dead-void gate encodes.

### 5. Documented evidence for the upper end

`guidelines/void-solid.md` (示例参考): 宋画山水 sky/water 60-80 %; 徽派 white walls 70 %+; Lumax MJ 60 %+; 晓白ALEX dark ground 60-80 % (dark solids standing in for white void); the guideline names 大虚小实 7:3 (0.70) as the best tier.

## <a id="decision-rules"></a>Decision rules (no free choice of numbers)

1. **One metric.** The registry defines `void_ratio` (design-level area share) as the metric every aesthetic threshold is expressed in. `scene.composition.negativeSpaceRatio` means `void_ratio`; a pixel estimator (the kind design-compiler used) is only a *lower bound* of it and must never be compared with a design-level threshold without saying so.
2. **Superseded values are removed, not reconciled.** README 30 % and the module grades (0.5 / 0.3 / 0.15) are deleted; README, SKILL.md and the module docs stop restating thresholds and point at the registry.
3. **Three named semantics, three rule kinds, each with its own `rule_id`:** hard floor (P0, bright landscape / empty shot), structural signal (scoring only), period plausibility band (prior).
4. **Period bands are the union of evidence-backed ranges**, never an average: they span every documented value of the period (prior, period-tagged evidence, sealed golden cells). SONG's upper bound is raised to the documented 0.80.
5. **Repair targets are derived**: `target = clamp(authored target, effective band)` where the effective band is the intersection of every applicable hard band (period band, physical range, hard floor); since a hard floor is part of the intersection this equals `max(authored, floor)` within the band. If the intersection is empty the context is **refused** (declared in `vocabulary.json#excluded_contexts` and verified by the lint to be a real conflict) — there is no silent winner.
6. **Numeric caps without evidence are deleted**: `CA-RULE-13`'s `> 0.72 -> 0.58` is not carried over; evaluator and operator clamps take their bounds from the context's effective band.
7. **Duplicates are merged**: `ANTI-AI-02` is folded into `CA-RULE-01-XUSHI`, whose trigger is the lower edge of the effective band.

## Resulting registry (`rules/families/CAS-VS.json`, `CA-RULE.json`)

| semantics | rule | value | scope |
|---|---|---|---|
| physical range | `CAS-VS-PR-001` | [0, 1] | every context |
| period band | `CAS-VS-PB-TANG` / `-SONG` / `-MING` | [0.15, 0.40] / [0.35, 0.80] / [0.25, 0.50] | the period |
| hard floor | `CAS-VS-HF-001` | >= 0.60 | scene type LANDSCAPE, lighting DAYLIGHT (bright tone) |
| structural signal (engine only) | `CAS-VS-SS-001` / `-002` / `-003` | 0.50 / 0.70 best tier / 0.40 too-full line | skill scoring |
| scene default | `CAS-VS-DT-PALACE` .. `-GATE-ACT0` | 0.40 / 0.50 / 0.55 / 0.70 / 0.65, clamped into the effective band | scene type |
| repair | `CA-RULE-01-XUSHI` | trigger `< band min`, target `clamp(0.45)` | every context |

Excluded context (hard floor and period band are disjoint, nothing in the skill resolves it): TANG or MING + LANDSCAPE + DAYLIGHT.

## Consequences

* In this repository every negative-space bound, clamp, repair target or judgement is a registry rule or a `$band` / `$clamp` derivation of one, emitted with `source_ref -> rule_id -> decision_id` provenance; the engines read them through `lib/rules/registry.js`.
* Expectation on a consumer (not verified here; the cross-repo binding is deferred): it carries no negative-space number of its own and takes every bound from the sheet. Sealed consumer-side fixtures that predate this decision (for example a golden cell at 0.68 against a SONG band of 0.35-0.65) have to be re-derived from the sheet by that consumer.
* Tests in this repository: the registry lint (all 208 valid contexts emit, the declared exclusions are real conflicts), the derivation unit tests, and the conflict ledger (`scripts/lint-conflicts.mjs`).
