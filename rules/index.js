/**
 * rules/index.js — static aggregate of the rules registry (browser-safe: plain JSON imports).
 *
 * Every family file in rules/families/ and every shard in rules/sources/ must be imported here and
 * nowhere else; the registry lint (scripts/lint-rules.mjs) fails when a file is missing from this
 * list or listed twice.
 */
import vocabulary from './vocabulary.json' with { type: 'json' };
import SRC_CORE from './sources/core.json' with { type: 'json' };
import SRC_CAS_OT from './sources/CAS-OT.json' with { type: 'json' };
import SRC_CAS_OP from './sources/CAS-OP.json' with { type: 'json' };
import SRC_CAS_AP from './sources/CAS-AP.json' with { type: 'json' };
import SRC_CAS_EV from './sources/CAS-EV.json' with { type: 'json' };
import SRC_CAS_GOV from './sources/CAS-GOV.json' with { type: 'json' };
import SRC_CAS_MT from './sources/CAS-MT.json' with { type: 'json' };
import SRC_CAS_LT from './sources/CAS-LT.json' with { type: 'json' };
import SRC_CAS_PG from './sources/CAS-PG.json' with { type: 'json' };
import SRC_CAS_CH from './sources/CAS-CH.json' with { type: 'json' };
import SRC_CAS_CL from './sources/CAS-CL.json' with { type: 'json' };
import SRC_CAS_PS from './sources/CAS-PS.json' with { type: 'json' };
import SRC_CAS_IN from './sources/CAS-IN.json' with { type: 'json' };
import SRC_CAS_VM from './sources/CAS-VM.json' with { type: 'json' };
import SRC_CAS_AA from './sources/CAS-AA.json' with { type: 'json' };
import CAS_VS from './families/CAS-VS.json' with { type: 'json' };
import CAS_PB from './families/CAS-PB.json' with { type: 'json' };
import CA_RULE from './families/CA-RULE.json' with { type: 'json' };
import ANTI_AI from './families/ANTI-AI.json' with { type: 'json' };
import CAS_OT from './families/CAS-OT.json' with { type: 'json' };
import CAS_OP from './families/CAS-OP.json' with { type: 'json' };
import CAS_AP from './families/CAS-AP.json' with { type: 'json' };
import CAS_EV from './families/CAS-EV.json' with { type: 'json' };
import CAS_GOV from './families/CAS-GOV.json' with { type: 'json' };
import CAS_MT from './families/CAS-MT.json' with { type: 'json' };
import CAS_LT from './families/CAS-LT.json' with { type: 'json' };
import CAS_PG from './families/CAS-PG.json' with { type: 'json' };
import CAS_CH from './families/CAS-CH.json' with { type: 'json' };
import CAS_CL from './families/CAS-CL.json' with { type: 'json' };
import CAS_PS from './families/CAS-PS.json' with { type: 'json' };
import CAS_IN from './families/CAS-IN.json' with { type: 'json' };
import CAS_VM from './families/CAS-VM.json' with { type: 'json' };
import CAS_AA from './families/CAS-AA.json' with { type: 'json' };

export default {
  registry_version: '1.0.0',
  /** Rule that resolves a design context into its decision set; root of every sheet's provenance chain. */
  context_rule: {
    rule_id: 'CAS-CTX-001',
    title: 'Resolve a design context (period x material x lighting x scene type) into the applicable decision set',
    confidence: 0.9,
    sources: ['SRC-ADR-0001'],
  },
  vocabulary,
  /** Provenance sources, one shard per owner (merged by lib/rules/registry.js; duplicate ids are an error). */
  source_files: {
    core: SRC_CORE,
    'CAS-OT': SRC_CAS_OT,
    'CAS-OP': SRC_CAS_OP,
    'CAS-AP': SRC_CAS_AP,
    'CAS-EV': SRC_CAS_EV,
    'CAS-GOV': SRC_CAS_GOV,
    'CAS-MT': SRC_CAS_MT,
    'CAS-LT': SRC_CAS_LT,
    'CAS-PG': SRC_CAS_PG,
    'CAS-CH': SRC_CAS_CH,
    'CAS-CL': SRC_CAS_CL,
    'CAS-PS': SRC_CAS_PS,
    'CAS-IN': SRC_CAS_IN,
    'CAS-VM': SRC_CAS_VM,
    'CAS-AA': SRC_CAS_AA,
  },
  families: {
    'CAS-VS': CAS_VS,
    'CAS-PB': CAS_PB,
    'CA-RULE': CA_RULE,
    'ANTI-AI': ANTI_AI,
    'CAS-OT': CAS_OT,
    'CAS-OP': CAS_OP,
    'CAS-AP': CAS_AP,
    'CAS-EV': CAS_EV,
    'CAS-GOV': CAS_GOV,
    'CAS-MT': CAS_MT,
    'CAS-LT': CAS_LT,
    'CAS-PG': CAS_PG,
    'CAS-CH': CAS_CH,
    'CAS-CL': CAS_CL,
    'CAS-PS': CAS_PS,
    'CAS-IN': CAS_IN,
    'CAS-VM': CAS_VM,
    'CAS-AA': CAS_AA,
  },
};
