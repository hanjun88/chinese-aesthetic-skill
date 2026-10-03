import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalize } from '../../scripts/lib/jcs.mjs';

test('RFC 8785 section 3.2.4 sample (literals, number serialisation, string escaping)', () => {
  const input = JSON.parse('{"numbers":[333333333.33333329,1E30,4.50,2e-3,0.000000000000000000000000001],"string":"\\u20ac$\\u000F\\u000aA\'\\u0042\\u0022\\u005c\\\\\\"\\/","literals":[null,true,false]}');
  assert.equal(
    canonicalize(input),
    '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$\\u000f\\nA\'B\\"\\\\\\\\\\"/"}',
  );
});

test('keys sort by UTF-16 code units, undefined members are dropped, non-finite numbers are refused', () => {
  assert.equal(canonicalize({ b: 1, a: 2, '\u00e9': 3, B: 4, u: undefined }), '{"B":4,"a":2,"b":1,"é":3}');
  assert.throws(() => canonicalize({ n: NaN }));
  assert.throws(() => canonicalize({ n: Infinity }));
});
