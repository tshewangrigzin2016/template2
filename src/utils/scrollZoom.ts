export interface HeroZoomState {
  progress: number;
  mediaScale: number;
  mediaTranslateY: number;
  contentOpacity: number;
  contentTranslateY: number;
  navExpand: number;
  navPillOpacity: number;
}

export interface NavbarRestLayout {
  containerWidth: number;
  leftX: number;
  leftWidth: number;
  centerX: number;
  centerWidth: number;
  rightX: number;
  rightWidth: number;
  compactGap: number;
  padLeft: number;
  padRight: number;
}

export interface NavbarMorphMetrics {
  leftDeltaX: number;
  centerDeltaX: number;
  rightDeltaX: number;
  pillBaseLeft: number;
  pillBaseWidth: number;
  pillEndLeft: number;
  pillEndWidth: number;
}

export interface NavbarFrameTransform {
  leftTranslateX: number;
  centerTranslateX: number;
  rightTranslateX: number;
  pillLeft: number;
  pillWidth: number;
  pillTranslateX: number;
  pillScaleX: number;
  pillOpacity: number;
}

export const INITIAL_HERO_SCALE = 1.28;
export const FINAL_HERO_SCALE = 1.0;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Computes normalized scroll progress [0, 1] for a sticky scroll track
 * whose total height exceeds the viewport height.
 */
export function computeScrollProgress(
  trackTop: number,
  trackHeight: number,
  viewportHeight: number,
): number {
  const scrollableDistance = trackHeight - viewportHeight;
  if (!Number.isFinite(scrollableDistance) || scrollableDistance <= 0) {
    return 0;
  }
  const scrolled = -trackTop;
  if (scrolled <= 0) return 0;
  if (scrolled >= scrollableDistance) return 1;
  return scrolled / scrollableDistance;
}

/**
 * Maps normalized scroll progress [0, 1] to GPU-composited hero transforms
 * and synchronized navbar morphing:
 * - At progress 0: media is zoomed in (1.28x), header items are gathered in a
 *   centered pill navbar (navExpand = 0, navPillOpacity = 1).
 * - As user scrolls to 1: media smoothly zooms out to 1.0x while the pill
 *   expands and disappears (navExpand -> 1, navPillOpacity -> 0) and logo +
 *   right controls glide to their side positions.
 */
export function computeHeroZoomState(
  rawProgress: number,
  reducedMotion = false,
): HeroZoomState {
  if (reducedMotion) {
    return {
      progress: 0,
      mediaScale: FINAL_HERO_SCALE,
      mediaTranslateY: 0,
      contentOpacity: 1,
      contentTranslateY: 0,
      navExpand: 1,
      navPillOpacity: 0,
    };
  }

  const progress = clamp01(rawProgress);
  // Smooth ease-out curve so zoom-out and navbar expansion respond together as scrolling starts
  const eased = 1 - Math.pow(1 - progress, 2);

  const mediaScale = INITIAL_HERO_SCALE - (INITIAL_HERO_SCALE - FINAL_HERO_SCALE) * eased;
  const mediaTranslateY = 0;

  // Keep hero copy crisp through the first half of zoom-out, then gently lift & soften as next section approaches
  const fadeProgress = Math.max(0, (progress - 0.55) / 0.45);
  const contentOpacity = 1 - fadeProgress * 0.3;
  const contentTranslateY = -progress * 24;

  // Sync navbar expansion directly with the image zoom curve, and dissolve the pill cleanly before the track releases
  const navExpand = eased;
  const navPillOpacity = 1 - clamp01(navExpand / 0.9);

  return {
    progress,
    mediaScale,
    mediaTranslateY,
    contentOpacity,
    contentTranslateY,
    navExpand,
    navPillOpacity,
  };
}

/**
 * Computes pure transform deltas and pill bounds from the header's resting
 * (spread-out) layout geometry so all scroll updates use compositor-only transforms.
 */
export function computeNavbarMetrics(layout: NavbarRestLayout): NavbarMorphMetrics {
  const {
    containerWidth,
    leftX,
    leftWidth,
    centerX,
    centerWidth,
    rightX,
    rightWidth,
    compactGap,
    padLeft,
    padRight,
  } = layout;

  const hasCenter = centerWidth > 0;
  const gapSlots = hasCenter ? 2 : 1;
  const totalItemsWidth = leftWidth + (hasCenter ? centerWidth : 0) + rightWidth;
  const maxInnerContent = Math.max(0, containerWidth - padLeft - padRight);
  const availableGapSpace = Math.max(0, maxInnerContent - totalItemsWidth);
  const effectiveGap = Math.min(compactGap, availableGapSpace / gapSlots);

  const compactContentWidth = totalItemsWidth + effectiveGap * gapSlots;
  const pillBaseWidth = Math.min(
    Math.max(containerWidth, 0),
    compactContentWidth + padLeft + padRight,
  );
  const pillBaseLeft = (containerWidth - pillBaseWidth) / 2;

  const startLeftX = pillBaseLeft + padLeft;
  const startCenterX = hasCenter ? startLeftX + leftWidth + effectiveGap : centerX;
  const startRightX = hasCenter
    ? startCenterX + centerWidth + effectiveGap
    : startLeftX + leftWidth + effectiveGap;

  const leftDeltaX = startLeftX - leftX;
  const centerDeltaX = hasCenter ? startCenterX - centerX : 0;
  const rightDeltaX = startRightX - rightX;

  const pillEndLeft = leftX - padLeft;
  const pillEndRight = rightX + rightWidth + padRight;
  const pillEndWidth = Math.max(pillBaseWidth, pillEndRight - pillEndLeft);

  return {
    leftDeltaX,
    centerDeltaX,
    rightDeltaX,
    pillBaseLeft,
    pillBaseWidth,
    pillEndLeft,
    pillEndWidth,
  };
}

function normalizeZero(value: number): number {
  return value === 0 ? 0 : value;
}

/**
 * Computes compositor-only translateX / scaleX / opacity values for a single scroll frame.
 */
export function computeNavbarFrame(
  metrics: NavbarMorphMetrics,
  rawNavExpand: number,
  rawPillOpacity: number,
): NavbarFrameTransform {
  const navExpand = clamp01(rawNavExpand);
  const compactFactor = 1 - navExpand;

  const leftTranslateX = normalizeZero(metrics.leftDeltaX * compactFactor);
  const centerTranslateX = normalizeZero(metrics.centerDeltaX * compactFactor);
  const rightTranslateX = normalizeZero(metrics.rightDeltaX * compactFactor);

  const currentPillLeft =
    metrics.pillBaseLeft + (metrics.pillEndLeft - metrics.pillBaseLeft) * navExpand;
  const currentPillWidth =
    metrics.pillBaseWidth + (metrics.pillEndWidth - metrics.pillBaseWidth) * navExpand;

  const baseCenter = metrics.pillBaseLeft + metrics.pillBaseWidth / 2;
  const currentCenter = currentPillLeft + currentPillWidth / 2;

  const pillTranslateX = normalizeZero(currentCenter - baseCenter);
  const pillScaleX =
    metrics.pillBaseWidth > 0 ? currentPillWidth / metrics.pillBaseWidth : 1;

  return {
    leftTranslateX,
    centerTranslateX,
    rightTranslateX,
    pillLeft: normalizeZero(currentPillLeft),
    pillWidth: normalizeZero(currentPillWidth),
    pillTranslateX,
    pillScaleX,
    pillOpacity: clamp01(rawPillOpacity),
  };
}
