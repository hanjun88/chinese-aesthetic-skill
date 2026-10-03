# Closure ledgers (skill side)

The skill is the **single source of truth for aesthetic knowledge**: rules, thresholds, period/style grammar, anti-cliché decisions, provenance, confidence, `rule_id`, `decision_id`.
The machine contract it must satisfy is owned by `design-compiler` (`contracts/aesthetic-constraint-sheet/`); the skill produces instances and validates them against that schema — it keeps no copy of the contract.

| ledger | where | note |
|---|---|---|
| Branch ledger (this repo) | `BRANCH-LEDGER.json` / `.md` | generated from git by `scripts/closure/branch-ledger.mjs`; dispositions in `dispositions/chinese-aesthetic-skill.branches.json` |
| Rule ledger (migration scope, both repos) | design-compiler `docs/closure/RULE-LEDGER.{json,md}` | generated from a live scan of both repos; the skill entries (`RL-SK-*`) are the ones that land here |
| Contract ledger | design-compiler `docs/closure/CONTRACT-LEDGER.json` | one canonical contract per boundary |
| Deprecated ledger | design-compiler `docs/closure/DEPRECATED-LEDGER.md` | PR/branch actions for both repos |
| Negative-space ADR | design-compiler `docs/closure/ADR-0001-negative-space.md` | evidence + decision rules for the 30/50/60 % and 0.45/0.48/0.58/0.72 numbers |
