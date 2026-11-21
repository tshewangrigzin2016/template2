import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKFLOW_SCENARIOS,
  computeTotalLatency,
  validateAuthForm,
} from './workflow';

test('computeTotalLatency sums step latencies accurately', () => {
  const first = WORKFLOW_SCENARIOS[0];
  assert.equal(computeTotalLatency(first.steps), 18 + 64 + 112 + 29);
});

test('validateAuthForm enforces name, email, and password on signup', () => {
  const invalid = validateAuthForm('signup', {
    name: 'A',
    email: 'not-an-email',
    password: 'short',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.password);

  const valid = validateAuthForm('signup', {
    name: 'Maya Lin',
    email: 'maya@linkflow.io',
    password: 'strongpassword123',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('validateAuthForm ignores name field in signin mode', () => {
  const valid = validateAuthForm('signin', {
    name: '',
    email: 'ops@linkflow.io',
    password: 'strongpassword123',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});
