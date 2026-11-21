import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FINAL_HERO_SCALE,
  INITIAL_HERO_SCALE,
  computeHeroZoomState,
  computeNavbarFrame,
  computeNavbarMetrics,
  computeScrollProgress,
} from './scrollZoom';

test('computeScrollProgress clamps cleanly across the sticky scroll track', () => {
  assert.equal(computeScrollProgress(0, 1800, 900), 0);
  assert.equal(computeScrollProgress(120, 1800, 900), 0);
  assert.equal(computeScrollProgress(-450, 1800, 900), 0.5);
  assert.equal(computeScrollProgress(-900, 1800, 900), 1);
  assert.equal(computeScrollProgress(-1400, 1800, 900), 1);
  assert.equal(computeScrollProgress(0, 900, 900), 0);
});

test('computeHeroZoomState syncs zoom-out, navbar expansion, and pill fade smoothly', () => {
  const start = computeHeroZoomState(0, false);
  const mid = computeHeroZoomState(0.4, false);
  const end = computeHeroZoomState(1, false);

  assert.equal(start.mediaScale, INITIAL_HERO_SCALE);
  assert.equal(start.navExpand, 0);
  assert.equal(start.navPillOpacity, 1);

  assert.ok(mid.mediaScale < start.mediaScale && mid.mediaScale > FINAL_HERO_SCALE);
  assert.ok(mid.navExpand > 0 && mid.navExpand < 1);
  assert.ok(mid.navPillOpacity > 0 && mid.navPillOpacity < 1);

  assert.equal(end.mediaScale, FINAL_HERO_SCALE);
  assert.equal(end.navExpand, 1);
  assert.equal(end.navPillOpacity, 0);
  assert.equal(start.contentOpacity, 1);
  assert.ok(end.contentOpacity < 1 && end.contentOpacity >= 0.6);
});

test('computeHeroZoomState settles scale and expanded navbar under prefers-reduced-motion', () => {
  const reduced = computeHeroZoomState(0.65, true);
  assert.equal(reduced.mediaScale, FINAL_HERO_SCALE);
  assert.equal(reduced.mediaTranslateY, 0);
  assert.equal(reduced.contentOpacity, 1);
  assert.equal(reduced.contentTranslateY, 0);
  assert.equal(reduced.navExpand, 1);
  assert.equal(reduced.navPillOpacity, 0);
});

test('computeNavbarMetrics and computeNavbarFrame center desktop items at scroll 0 and return to resting edges at scroll 1', () => {
  const layout = {
    containerWidth: 1360,
    leftX: 0,
    leftWidth: 116,
    centerX: 480,
    centerWidth: 380,
    rightX: 1158,
    rightWidth: 202,
    compactGap: 24,
    padLeft: 24,
    padRight: 24,
  };

  const metrics = computeNavbarMetrics(layout);
  const compact = computeNavbarFrame(metrics, 0, 1);
  const mid = computeNavbarFrame(metrics, 0.5, 0.45);
  const expanded = computeNavbarFrame(metrics, 1, 0);

  // At progress 0: logo shifted right toward center, right cluster shifted left toward center, pill centered & unscaled
  assert.ok(compact.leftTranslateX > 200);
  assert.ok(compact.rightTranslateX < -200);
  assert.equal(compact.pillTranslateX, 0);
  assert.equal(compact.pillScaleX, 1);
  assert.equal(compact.pillOpacity, 1);

  // Compact items sit symmetrically inside the centered pill
  const visualLeft = layout.leftX + compact.leftTranslateX;
  const visualRightEnd = layout.rightX + compact.rightTranslateX + layout.rightWidth;
  assert.ok(Math.abs(visualLeft - (layout.containerWidth - visualRightEnd)) < 0.01);

  // Mid-scroll: pill expands smoothly and items move halfway toward sides
  assert.ok(mid.pillScaleX > 1 && mid.pillScaleX < expanded.pillScaleX);
  assert.ok(mid.leftTranslateX > 0 && mid.leftTranslateX < compact.leftTranslateX);
  assert.ok(mid.rightTranslateX < 0 && mid.rightTranslateX > compact.rightTranslateX);

  // At progress 1: all items settle to exact resting flex positions (0px transform) and pill disappears
  assert.equal(expanded.leftTranslateX, 0);
  assert.equal(expanded.centerTranslateX, 0);
  assert.equal(expanded.rightTranslateX, 0);
  assert.equal(expanded.pillOpacity, 0);
});

test('computeNavbarMetrics handles mobile layout without center nav cleanly', () => {
  const mobileLayout = {
    containerWidth: 358,
    leftX: 0,
    leftWidth: 88,
    centerX: 0,
    centerWidth: 0,
    rightX: 314,
    rightWidth: 44,
    compactGap: 20,
    padLeft: 20,
    padRight: 6,
  };

  const metrics = computeNavbarMetrics(mobileLayout);
  const compact = computeNavbarFrame(metrics, 0, 1);
  const expanded = computeNavbarFrame(metrics, 1, 0);

  // Logo and menu button move close together near center
  const visualLeft = mobileLayout.leftX + compact.leftTranslateX;
  const visualRight = mobileLayout.rightX + compact.rightTranslateX;
  assert.ok(Math.abs(visualRight - (visualLeft + mobileLayout.leftWidth) - 20) < 0.01);
  assert.equal(compact.centerTranslateX, 0);
  assert.ok(metrics.pillBaseWidth < mobileLayout.containerWidth);

  // Resting state restores exact left/right edges
  assert.equal(expanded.leftTranslateX, 0);
  assert.equal(expanded.rightTranslateX, 0);
  assert.equal(expanded.pillOpacity, 0);
});
