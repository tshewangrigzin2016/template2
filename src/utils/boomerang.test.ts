import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCaptureDimensions,
  isFrameBankHealthy,
  shouldAcceptFrame,
  stepBoomerangIndex,
} from './boomerang';

test('computeCaptureDimensions caps 4K video to hardMaxWidth while preserving aspect ratio', () => {
  const size = computeCaptureDimensions(3828, 2164, 1440, 2, 800);
  assert.equal(size.width, 800);
  assert.equal(size.height, Math.round((2164 / 3828) * 800));
});

test('computeCaptureDimensions adapts down for narrow mobile viewports', () => {
  const size = computeCaptureDimensions(3828, 2164, 390, 1, 800);
  assert.equal(size.width, 390);
  assert.equal(size.height, Math.round((2164 / 3828) * 390));
});

test('computeCaptureDimensions returns zero size for uninitialized video dimensions', () => {
  assert.deepEqual(computeCaptureDimensions(0, 0, 1440, 1, 800), { width: 0, height: 0 });
});

test('shouldAcceptFrame deduplicates repeated or too-close mediaTime values', () => {
  assert.equal(shouldAcceptFrame(0, -1), true);
  assert.equal(shouldAcceptFrame(0.01, 0, 1 / 30), false);
  assert.equal(shouldAcceptFrame(0.034, 0, 1 / 30), true);
  assert.equal(shouldAcceptFrame(-0.1, 0), false);
});

test('stepBoomerangIndex bounces smoothly at both ends', () => {
  assert.deepEqual(stepBoomerangIndex(0, 1, 4), { index: 1, direction: 1 });
  assert.deepEqual(stepBoomerangIndex(2, 1, 4), { index: 3, direction: -1 });
  assert.deepEqual(stepBoomerangIndex(3, -1, 4), { index: 2, direction: -1 });
  assert.deepEqual(stepBoomerangIndex(1, -1, 4), { index: 0, direction: 1 });
  assert.deepEqual(stepBoomerangIndex(0, 1, 1), { index: 0, direction: 1 });
});

test('isFrameBankHealthy rejects background-tab starved captures and accepts full banks', () => {
  assert.equal(isFrameBankHealthy(4, 6.4, false), false);
  assert.equal(isFrameBankHealthy(45, 6.4, true), false);
  assert.equal(isFrameBankHealthy(165, 6.4, false), true);
  assert.equal(isFrameBankHealthy(180, 6.4, true), true);
});
