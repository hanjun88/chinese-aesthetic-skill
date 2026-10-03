/**
 * RFC 8785 (JSON Canonicalization Scheme) for the JSON subset used by the sheet: null, boolean,
 * finite numbers (ECMAScript number serialisation), strings, arrays, objects. Zero dependencies.
 * Parity with design-compiler's `canonicalize` package is enforced by the cross-repo tests: the
 * compiler recomputes every hash of an emitted sheet and rejects any mismatch.
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
