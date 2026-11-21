export interface CaptureSize {
  width: number;
  height: number;
}

export interface BoomerangStep {
  index: number;
  direction: 1 | -1;
}

/**
 * Computes an appropriate offscreen capture resolution bounded by both the
 * rendered container width (times capped DPR) and a strict hard maximum width
 * so we never allocate 4K frame buffers for a background canvas.
 */
export function computeCaptureDimensions(
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  devicePixelRatio = 1,
  hardMaxWidth = 800,
): CaptureSize {
  if (videoWidth <= 0 || videoHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const safeDpr = Math.min(Math.max(devicePixelRatio || 1, 1), 1.5);
  const safeContainer = containerWidth > 0 ? containerWidth : hardMaxWidth;
  const paintedTarget = Math.round(safeContainer * safeDpr);
  const targetWidth = Math.min(videoWidth, hardMaxWidth, Math.max(360, paintedTarget));
  const scale = targetWidth / videoWidth;

  return {
    width: Math.max(2, Math.round(videoWidth * scale)),
    height: Math.max(2, Math.round(videoHeight * scale)),
  };
}

/**
 * Determines whether a newly presented video frame should be captured based on
 * VideoFrameCallbackMetadata.mediaTime rather than drifting video.currentTime.
 */
export function shouldAcceptFrame(
  mediaTime: number,
  lastMediaTime: number,
  minIntervalSeconds = 1 / 32,
): boolean {
  if (!Number.isFinite(mediaTime) || mediaTime < 0) return false;
  if (lastMediaTime < 0) return true;
  return mediaTime - lastMediaTime >= minIntervalSeconds;
}

/**
 * Advances the boomerang ping-pong frame index cleanly across [0, frameCount - 1].
 */
export function stepBoomerangIndex(
  index: number,
  direction: 1 | -1,
  frameCount: number,
): BoomerangStep {
  if (frameCount <= 1) {
    return { index: 0, direction: 1 };
  }

  const clamped = Math.max(0, Math.min(index, frameCount - 1));
  const next = clamped + direction;

  if (next >= frameCount - 1) {
    return { index: frameCount - 1, direction: -1 };
  }
  if (next <= 0) {
    return { index: 0, direction: 1 };
  }
  return { index: next, direction };
}

/**
 * Detects whether a captured frame bank has healthy temporal coverage or was
 * starved (for example because the browser tab was backgrounded during capture).
 */
export function isFrameBankHealthy(
  capturedCount: number,
  durationSeconds: number,
  wasHiddenDuringCapture: boolean,
  minFpsCoverage = 12,
): boolean {
  if (capturedCount < 10) return false;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return !wasHiddenDuringCapture && capturedCount >= 24;
  }

  const expectedMinFrames = Math.max(12, Math.floor(durationSeconds * minFpsCoverage));
  if (wasHiddenDuringCapture && capturedCount < Math.floor(durationSeconds * 20)) {
    return false;
  }
  return capturedCount >= expectedMinFrames;
}
