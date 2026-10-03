/**
 * RFC 8785 (JSON Canonicalization Scheme) for the JSON subset used by the sheet: null, boolean,
 * finite numbers (ECMAScript number serialisation), strings, arrays, objects. Zero dependencies.
 * Conformance is pinned by tests/rules/jcs.test.js (the RFC 8785 section 3.2.4 sample, key order).
 * Agreement with a consumer's own canonicalisation can only be verified once a cross-repo binding
 * exists; that binding is deferred, and nothing here claims it.
 */
export function canonicalize(value) {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('canonicalize: non-finite number');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
  }
  throw new Error(`canonicalize: unsupported type ${typeof value}`);
}
