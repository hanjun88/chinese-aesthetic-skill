# ADR-0002 — Operator and plan decisions follow the period bands; one concept, one rule

Status: ACCEPTED · Extends ADR-0001 (negative space) to every other parameter that has a period band.

## Context

The design operators, the plan emitter, the evaluators and the anti-pattern gates used to live in design-compiler with
numbers of their own. Moving them into this registry exposed places where two decisions about the same concept
disagreed, or where an operator could push a parameter outside the band the period defines for it
(`docs/closure/THRESHOLD-CONFLICTS.md` lists each case).

## Decision

1. **One concept, one rule.** A value that two rules need is defined in exactly one rule and referenced from the other
   with `$ref`. Copies of the same number under two keys are removed, not reconciled by averaging.
2. **Operator bounds are band edges.** The range an operator may move a parameter within is the context's effective band
   of that parameter (`$band` min/max). A fixed clamp without evidence is deleted (ADR-0001 rule 6).
3. **Authored targets are clamped into the band.** An operator or plan target that has a period band is written as
   `$clamp(authored, parameter)`: the authored number stays visible, the context decides whether it applies unchanged.
4. **A conflict is only resolved when it is checkable.** Each resolution is an entry of
   `docs/closure/THRESHOLD-CONFLICTS.json` with assertions evaluated by `scripts/lint-conflicts.mjs` against the resolved
   decisions of every valid design context (band edge, inside band, equal to, deleted); `npm test` runs it.

## Consequences

- A consumer that reads these decisions obtains operator bounds and plan targets that already respect the period bands;
  whether it also clamps is its own enforcement choice and is not asserted here (the cross-repo binding is deferred).
- Intentional behaviour changes versus the numbers migrated from the design-compiler sources: the layering plan target follows the
  operator's per-period table (SONG 5, MING 3; it was 4 everywhere); the material-contrast roughness ladder is clamped into
  the period roughness band; the cluster-partition operator may not lower axial symmetry below the period band.
