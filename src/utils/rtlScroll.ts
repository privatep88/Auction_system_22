export type RtlScrollType = 'negative' | 'default' | 'reverse';

export interface RtlScrollMetrics {
  maxScroll: number;
  hasOverflow: boolean;
  /** Normalized RTL progress in [0, 1]: 0 = RTL start (rightmost), 1 = RTL end (leftmost) */
  progress: number;
}

export interface ThumbLayout {
  thumbWidth: number;
  maxTravel: number;
  /** Physical CSS `left` offset in px inside the track */
  leftPx: number;
}

export interface RectBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

export interface FloatingScrollbarGeometry {
  mode: 'hidden' | 'floating' | 'docked';
  left: number;
  width: number;
  /** Distance from viewport bottom in px (used when mode === 'floating') */
  bottom: number;
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (min > max) return min;
  return Math.min(max, Math.max(min, value));
}

let cachedRtlScrollType: RtlScrollType | null = null;

/**
 * Safely detects the active browser's RTL `scrollLeft` coordinate convention:
 * - 'negative': 0 at rightmost edge, -maxScroll at leftmost edge (Chrome 85+, Edge, Firefox, modern Safari)
 * - 'default': maxScroll at rightmost edge, 0 at leftmost edge (older WebKit)
 * - 'reverse': 0 at rightmost edge, +maxScroll at leftmost edge (legacy IE/EdgeHTML)
 */
export function detectRtlScrollType(): RtlScrollType {
  if (cachedRtlScrollType) return cachedRtlScrollType;
  if (typeof document === 'undefined' || !document.body) {
    return 'negative';
  }

  try {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.dir = 'rtl';
    outer.style.position = 'fixed';
    outer.style.top = '-9999px';
    outer.style.left = '-9999px';
    outer.style.width = '4px';
    outer.style.height = '1px';
    outer.style.overflow = 'scroll';
    outer.style.visibility = 'hidden';
    outer.style.pointerEvents = 'none';
    inner.style.width = '10px';
    inner.style.height = '1px';
    outer.appendChild(inner);
    document.body.appendChild(outer);

    if (outer.scrollLeft > 0) {
      cachedRtlScrollType = 'default';
    } else {
      outer.scrollLeft = 1;
      cachedRtlScrollType = outer.scrollLeft === 0 ? 'negative' : 'reverse';
    }

    document.body.removeChild(outer);
    return cachedRtlScrollType;
  } catch {
    return 'negative';
  }
}

export function getRtlScrollMetrics(
  scrollWidth: number,
  clientWidth: number,
  scrollLeft: number,
  scrollType: RtlScrollType = 'negative'
): RtlScrollMetrics {
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  // 2px tolerance avoids false positives from subpixel rounding on high-DPI / Android displays
  const hasOverflow = maxScroll > 2;
  if (!hasOverflow) {
    return { maxScroll: 0, hasOverflow: false, progress: 0 };
  }

  let rawProgress = 0;
  if (scrollType === 'negative') {
    rawProgress = -scrollLeft / maxScroll;
  } else if (scrollType === 'default') {
    rawProgress = (maxScroll - scrollLeft) / maxScroll;
  } else {
    rawProgress = scrollLeft / maxScroll;
  }

  return {
    maxScroll,
    hasOverflow: true,
    progress: clampNumber(rawProgress, 0, 1),
  };
}

export function progressToRtlScrollLeft(
  progress: number,
  maxScroll: number,
  scrollType: RtlScrollType = 'negative'
): number {
  const clamped = clampNumber(progress, 0, 1);
  if (maxScroll <= 0) return 0;

  if (scrollType === 'negative') {
    return -(clamped * maxScroll);
  }
  if (scrollType === 'default') {
    return (1 - clamped) * maxScroll;
  }
  return clamped * maxScroll;
}

export function computeThumbLayout(
  trackWidth: number,
  clientWidth: number,
  scrollWidth: number,
  progress: number
): ThumbLayout {
  if (trackWidth <= 0 || scrollWidth <= 0 || clientWidth <= 0 || scrollWidth <= clientWidth) {
    return {
      thumbWidth: Math.max(0, trackWidth),
      maxTravel: 0,
      leftPx: 0,
    };
  }

  const ratio = clampNumber(clientWidth / scrollWidth, 0.08, 1);
  const minThumb = Math.min(48, Math.max(28, trackWidth * 0.25));
  const thumbWidth = clampNumber(Math.round(trackWidth * ratio), minThumb, trackWidth);
  const maxTravel = Math.max(0, trackWidth - thumbWidth);
  const clampedProgress = clampNumber(progress, 0, 1);

  // In RTL: progress = 0 puts the thumb at the right edge (leftPx = maxTravel);
  // dragging left increases progress toward 1 (leftPx -> 0).
  const leftPx = (1 - clampedProgress) * maxTravel;

  return {
    thumbWidth,
    maxTravel,
    leftPx,
  };
}

export interface ComputeFloatingGeometryInput {
  hasOverflow: boolean;
  isModalOpen: boolean;
  containerRect: RectBox | null;
  dockRect: RectBox | null;
  viewportWidth: number;
  viewportHeight: number;
  footerTop?: number | null;
  barHeight?: number;
  safeBottomGap?: number;
  headerGuardHeight?: number;
}

/**
 * Determines whether the smart scrollbar should be:
 * - 'hidden': no horizontal overflow, table outside viewport, or covered by modal
 * - 'docked': bottom of table is visible inside safe viewport area (no duplicate floating bar)
 * - 'floating': table is visible in viewport and its bottom extends below the safe bottom boundary
 */
export function computeFloatingScrollbarGeometry({
  hasOverflow,
  isModalOpen,
  containerRect,
  dockRect,
  viewportWidth,
  viewportHeight,
  footerTop = null,
  barHeight = 36,
  safeBottomGap = 14,
  headerGuardHeight = 56,
}: ComputeFloatingGeometryInput): FloatingScrollbarGeometry {
  if (!hasOverflow || isModalOpen || !containerRect || viewportWidth <= 0 || viewportHeight <= 0) {
    return { mode: 'hidden', left: 0, width: 0, bottom: safeBottomGap };
  }

  const visibleLeft = clampNumber(containerRect.left, 0, viewportWidth);
  const visibleRight = clampNumber(containerRect.right, 0, viewportWidth);
  const clippedWidth = Math.max(0, visibleRight - visibleLeft);

  if (clippedWidth < 120) {
    return { mode: 'hidden', left: 0, width: 0, bottom: safeBottomGap };
  }

  const safeViewportBottom =
    typeof footerTop === 'number' && Number.isFinite(footerTop) && footerTop > 0
      ? Math.min(viewportHeight, footerTop)
      : viewportHeight;

  const visibleTop = Math.max(containerRect.top, 0);
  const visibleBottom = Math.min(containerRect.bottom, safeViewportBottom);
  const visibleHeight = visibleBottom - visibleTop;

  // Hide when the table itself is not meaningfully inside the viewport
  if (visibleBottom <= headerGuardHeight || visibleHeight < headerGuardHeight) {
    return { mode: 'hidden', left: visibleLeft, width: clippedWidth, bottom: safeBottomGap };
  }

  // If the native dock slot at the bottom of the table is already visible above safe bottom,
  // dock the bar inline so it never overlaps the last rows or pagination controls.
  const dockBottom = dockRect ? dockRect.bottom : containerRect.bottom;
  if (dockBottom <= safeViewportBottom - 4) {
    return { mode: 'docked', left: visibleLeft, width: clippedWidth, bottom: safeBottomGap };
  }

  // Float at the bottom of the safe visible area (respecting footer & minimum gap)
  const footerReserved = Math.max(0, viewportHeight - safeViewportBottom);
  const bottom = Math.max(safeBottomGap, footerReserved + safeBottomGap);

  // Ensure the floating bar doesn't climb over the table header row
  const barTopInViewport = viewportHeight - bottom - barHeight;
  if (barTopInViewport < containerRect.top + 40) {
    return { mode: 'docked', left: visibleLeft, width: clippedWidth, bottom: safeBottomGap };
  }

  return {
    mode: 'floating',
    left: Math.round(visibleLeft),
    width: Math.round(clippedWidth),
    bottom: Math.round(bottom),
  };
}
