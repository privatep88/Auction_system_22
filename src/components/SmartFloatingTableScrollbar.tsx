import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import {
  clampNumber,
  computeFloatingScrollbarGeometry,
  computeThumbLayout,
  detectRtlScrollType,
  getRtlScrollMetrics,
  progressToRtlScrollLeft,
  RectBox,
  RtlScrollType,
} from '../utils/rtlScroll';

interface SmartFloatingTableScrollbarProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  tableRef: React.RefObject<HTMLTableElement | null>;
  tableId: string;
  isExternalModalOpen?: boolean;
  storageKey?: string;
  ariaLabel?: string;
}

const HINT_STORAGE_KEY = 'saaed_smart_scrollbar_hint_seen_v1';
const SESSION_SCROLL_PROGRESS = new Map<string, number>();

function toRectBox(rect: DOMRect): RectBox {
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height,
  };
}

function hasBlockingDialogInDom(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector('[role="dialog"], [aria-modal="true"]'));
}

export const SmartFloatingTableScrollbar: React.FC<SmartFloatingTableScrollbarProps> = ({
  scrollContainerRef,
  tableRef,
  tableId,
  isExternalModalOpen = false,
  storageKey = 'saaed_vehicles_ledger_scroll',
  ariaLabel = 'شريط التمرير الأفقي الذكي لجدول المركبات',
}) => {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [barMode, setBarMode] = useState<'hidden' | 'floating' | 'docked'>('hidden');
  const [showHint, setShowHint] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [domDialogOpen, setDomDialogOpen] = useState(false);

  const rtlTypeRef = useRef<RtlScrollType>('negative');
  const currentProgressRef = useRef(0);
  const maxScrollRef = useRef(0);
  const thumbLayoutRef = useRef({ thumbWidth: 80, maxTravel: 0, leftPx: 0 });
  const isContainerIntersectingRef = useRef(true);
  const rafSyncIdRef = useRef<number | null>(null);
  const hasRestoredOnMountRef = useRef(false);
  const smoothTargetRef = useRef<{ progress: number; expiresAt: number } | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startClientX: number;
    startProgress: number;
    pointerId: number | null;
    captureElement: HTMLElement | null;
  }>({
    active: false,
    startClientX: 0,
    startProgress: 0,
    pointerId: null,
    captureElement: null,
  });

  const effectiveModalOpen = isExternalModalOpen || domDialogOpen;
  const effectiveModalRef = useRef(effectiveModalOpen);
  effectiveModalRef.current = effectiveModalOpen;

  const markHintSeen = useCallback(() => {
    setShowHint(false);
    try {
      window.localStorage.setItem(HINT_STORAGE_KEY, '1');
    } catch {
      // Ignore private browsing storage failures
    }
  }, []);

  // Show one-time hint when hidden columns are first detected
  useEffect(() => {
    if (!hasOverflow) {
      setShowHint(false);
      return;
    }
    try {
      if (window.localStorage.getItem(HINT_STORAGE_KEY) === '1') {
        return;
      }
    } catch {
      return;
    }

    setShowHint(true);
    const timer = window.setTimeout(() => {
      markHintSeen();
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [hasOverflow, markHintSeen]);

  // Watch document.body for any open portal modal (role="dialog" / aria-modal="true")
  useEffect(() => {
    setDomDialogOpen(hasBlockingDialogInDom());
    if (typeof MutationObserver === 'undefined' || !document.body) return;

    const observer = new MutationObserver(() => {
      const next = hasBlockingDialogInDom();
      setDomDialogOpen((prev) => (prev === next ? prev : next));
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'aria-modal'],
    });
    return () => observer.disconnect();
  }, []);

  // Direct DOM update inside rAF — zero React state changes per scroll frame
  const syncVisualsNow = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const metrics = getRtlScrollMetrics(
      container.scrollWidth,
      container.clientWidth,
      container.scrollLeft,
      rtlTypeRef.current
    );

    maxScrollRef.current = metrics.maxScroll;

    // Restore session scroll progress once after initial overflow measurement
    if (!hasRestoredOnMountRef.current && metrics.hasOverflow) {
      hasRestoredOnMountRef.current = true;
      const saved = SESSION_SCROLL_PROGRESS.get(storageKey);
      if (typeof saved === 'number' && saved > 0.005) {
        const clampedSaved = clampNumber(saved, 0, 1);
        container.scrollLeft = progressToRtlScrollLeft(
          clampedSaved,
          metrics.maxScroll,
          rtlTypeRef.current
        );
        currentProgressRef.current = clampedSaved;
      } else {
        currentProgressRef.current = metrics.progress;
      }
    } else {
      currentProgressRef.current = metrics.progress;
    }

    if (!metrics.hasOverflow) {
      SESSION_SCROLL_PROGRESS.delete(storageKey);
    } else if (hasRestoredOnMountRef.current) {
      SESSION_SCROLL_PROGRESS.set(storageKey, currentProgressRef.current);
    }

    setHasOverflow((prev) => (prev === metrics.hasOverflow ? prev : metrics.hasOverflow));
    container.dataset.smartScroll = metrics.hasOverflow ? 'active' : 'inactive';

    const footerEl = document.querySelector('footer.no-print');
    const footerTop = footerEl ? footerEl.getBoundingClientRect().top : null;
    const viewportWidth = document.documentElement?.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement?.clientHeight || window.innerHeight;

    const geometry = computeFloatingScrollbarGeometry({
      hasOverflow: metrics.hasOverflow && isContainerIntersectingRef.current,
      isModalOpen: effectiveModalRef.current,
      containerRect: toRectBox(container.getBoundingClientRect()),
      dockRect: dockRef.current ? toRectBox(dockRef.current.getBoundingClientRect()) : null,
      viewportWidth,
      viewportHeight,
      footerTop,
      barHeight: 38,
      safeBottomGap: 14,
      headerGuardHeight: 56,
    });

    setBarMode((prev) => (prev === geometry.mode ? prev : geometry.mode));

    const bar = barRef.current;
    if (bar) {
      if (geometry.mode === 'floating') {
        bar.style.position = 'fixed';
        bar.style.left = `${geometry.left}px`;
        bar.style.width = `${geometry.width}px`;
        bar.style.bottom = `${geometry.bottom}px`;
      } else {
        bar.style.position = '';
        bar.style.left = '';
        bar.style.width = '';
        bar.style.bottom = '';
      }
    }

    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (track && thumb && metrics.hasOverflow) {
      const trackWidth = track.clientWidth;
      const layout = computeThumbLayout(
        trackWidth,
        container.clientWidth,
        container.scrollWidth,
        currentProgressRef.current
      );
      thumbLayoutRef.current = layout;
      thumb.style.width = `${layout.thumbWidth}px`;
      thumb.style.transform = `translate3d(${layout.leftPx}px, 0, 0)`;
      track.setAttribute('aria-valuenow', String(Math.round(currentProgressRef.current * 100)));
    }
  }, [scrollContainerRef, storageKey]);

  const scheduleSync = useCallback(() => {
    if (rafSyncIdRef.current !== null) return;
    rafSyncIdRef.current = window.requestAnimationFrame(() => {
      rafSyncIdRef.current = null;
      syncVisualsNow();
    });
  }, [syncVisualsNow]);

  const getStepBaseProgress = useCallback(() => {
    const pending = smoothTargetRef.current;
    if (pending && Date.now() < pending.expiresAt) {
      return pending.progress;
    }
    return currentProgressRef.current;
  }, []);

  const applyProgressToContainer = useCallback(
    (nextProgress: number, smooth = false) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const clamped = clampNumber(nextProgress, 0, 1);
      const targetScrollLeft = progressToRtlScrollLeft(
        clamped,
        maxScrollRef.current,
        rtlTypeRef.current
      );
      currentProgressRef.current = clamped;
      SESSION_SCROLL_PROGRESS.set(storageKey, clamped);

      if (smooth && typeof container.scrollTo === 'function') {
        smoothTargetRef.current = { progress: clamped, expiresAt: Date.now() + 450 };
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      } else {
        smoothTargetRef.current = null;
        container.scrollLeft = targetScrollLeft;
      }
      scheduleSync();
    },
    [scheduleSync, scrollContainerRef, storageKey]
  );

  // Detect RTL scroll coordinate convention & wire ResizeObserver / IntersectionObserver / listeners
  useEffect(() => {
    rtlTypeRef.current = detectRtlScrollType();
    const container = scrollContainerRef.current;
    const table = tableRef.current;
    if (!container) return;

    const handleContainerScroll = () => {
      scheduleSync();
    };
    const handleViewportChange = () => {
      scheduleSync();
    };

    container.addEventListener('scroll', handleContainerScroll, { passive: true });
    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleSync();
      });
      resizeObserver.observe(container);
      if (table) resizeObserver.observe(table);
    }

    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          isContainerIntersectingRef.current = entry.isIntersecting;
          scheduleSync();
        },
        { threshold: 0 }
      );
      intersectionObserver.observe(container);
    }

    scheduleSync();

    return () => {
      container.removeEventListener('scroll', handleContainerScroll);
      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (rafSyncIdRef.current !== null) {
        window.cancelAnimationFrame(rafSyncIdRef.current);
        rafSyncIdRef.current = null;
      }
      delete container.dataset.smartScroll;
    };
  }, [scheduleSync, scrollContainerRef, tableRef]);

  // Re-sync synchronously before paint whenever modal open state, overflow, or dock mode changes
  useLayoutEffect(() => {
    syncVisualsNow();
  }, [effectiveModalOpen, hasOverflow, barMode, syncVisualsNow]);

  // Global pointer drag handling for smooth 60fps mouse & touch scrubbing (desktop + Android)
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.active) return;
      if (drag.pointerId !== null && e.pointerId !== drag.pointerId) return;

      const maxTravel = thumbLayoutRef.current.maxTravel;
      if (maxTravel <= 0) return;

      const deltaX = e.clientX - drag.startClientX;
      // Moving pointer left (deltaX < 0) advances RTL progress toward leftmost columns
      const nextProgress = clampNumber(drag.startProgress - deltaX / maxTravel, 0, 1);
      applyProgressToContainer(nextProgress, false);
    };

    const endDrag = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag.active) return;
      if (drag.pointerId !== null && e.pointerId !== drag.pointerId) return;
      if (drag.captureElement && drag.pointerId !== null) {
        try {
          if (drag.captureElement.hasPointerCapture?.(drag.pointerId)) {
            drag.captureElement.releasePointerCapture(drag.pointerId);
          }
        } catch {
          // Ignore release failures when element unmounted
        }
      }
      drag.active = false;
      drag.pointerId = null;
      drag.captureElement = null;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [applyProgressToContainer]);

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    markHintSeen();

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore synthetic pointer events without active capture
    }

    dragStateRef.current = {
      active: true,
      startClientX: e.clientX,
      startProgress: currentProgressRef.current,
      pointerId: e.pointerId,
      captureElement: e.currentTarget,
    };
    setIsDragging(true);
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const track = trackRef.current;
    if (!track) return;
    if (e.target === thumbRef.current) return;

    e.preventDefault();
    markHintSeen();

    const rect = track.getBoundingClientRect();
    const { thumbWidth, maxTravel } = thumbLayoutRef.current;
    if (maxTravel <= 0) return;

    const clickX = e.clientX - rect.left;
    const desiredLeft = clampNumber(clickX - thumbWidth / 2, 0, maxTravel);
    const nextProgress = clampNumber(1 - desiredLeft / maxTravel, 0, 1);

    applyProgressToContainer(nextProgress, false);

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore synthetic pointer events without active capture
    }

    // Allow immediate continuous drag right after clicking anywhere on the track
    dragStateRef.current = {
      active: true,
      startClientX: e.clientX,
      startProgress: nextProgress,
      pointerId: e.pointerId,
      captureElement: e.currentTarget,
    };
    setIsDragging(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || maxScrollRef.current <= 0) return;

    const smallStep = clampNumber((container.clientWidth * 0.18) / maxScrollRef.current, 0.05, 0.3);
    const largeStep = clampNumber((container.clientWidth * 0.75) / maxScrollRef.current, 0.15, 0.85);
    const base = getStepBaseProgress();

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        markHintSeen();
        applyProgressToContainer(base + smallStep, true);
        break;
      case 'ArrowRight':
        e.preventDefault();
        markHintSeen();
        applyProgressToContainer(base - smallStep, true);
        break;
      case 'PageDown':
        e.preventDefault();
        markHintSeen();
        applyProgressToContainer(base + largeStep, true);
        break;
      case 'PageUp':
        e.preventDefault();
        markHintSeen();
        applyProgressToContainer(base - largeStep, true);
        break;
      case 'Home':
        e.preventDefault();
        markHintSeen();
        applyProgressToContainer(0, true);
        break;
      case 'End':
        e.preventDefault();
        markHintSeen();
        applyProgressToContainer(1, true);
        break;
      default:
        break;
    }
  };

  if (!hasOverflow) {
    return null;
  }

  const isVisibleBar = barMode !== 'hidden';
  const isFloating = barMode === 'floating';

  return (
    <div
      ref={dockRef}
      dir="rtl"
      className="no-print relative flex h-[40px] w-full items-center border-t border-slate-200/80 bg-[#f7fafd]"
    >
      <div
        ref={barRef}
        className={`pointer-events-none transition-opacity duration-150 ${
          isFloating ? 'z-30 px-2 sm:px-3' : 'w-full px-2 sm:px-3'
        } ${isVisibleBar ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Subtle One-Time Discovery Hint */}
        {showHint && isVisibleBar && (
          <div className="pointer-events-none mb-1.5 flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0A2C52] px-3 py-1 text-[11px] font-bold text-white shadow-md">
              <MoveHorizontal className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
              <span>اسحب لعرض بقية الأعمدة</span>
            </div>
          </div>
        )}

        {/* SAAED Premium Smart Table Scrollbar Rail */}
        <div
          className={`flex h-7 items-center gap-1.5 rounded-full border px-2 transition-shadow ${
            isVisibleBar ? 'pointer-events-auto' : 'pointer-events-none'
          } ${
            isFloating
              ? 'border-[#1762A5]/30 bg-white/95 shadow-[0_6px_18px_rgba(10,44,82,0.16)]'
              : 'border-slate-200 bg-white shadow-2xs'
          }`}
        >
          {/* RTL Start Step Button (Scroll Right back toward Lot / Auction Name) */}
          <button
            type="button"
            onClick={() => {
              markHintSeen();
              applyProgressToContainer(getStepBaseProgress() - 0.22, true);
            }}
            title="تمرير لليمين (بداية الجدول)"
            aria-label="تمرير أفقي لليمين نحو أعمدة اللوت والمزاد"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#1762A5] transition hover:bg-[#1762A5]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1762A5]/50"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Interactive Track (Physical LTR coordinate container for predictable thumb translation) */}
          <div
            ref={trackRef}
            dir="ltr"
            role="scrollbar"
            tabIndex={0}
            aria-label={ariaLabel}
            aria-controls={tableId}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            onKeyDown={handleKeyDown}
            onPointerDown={handleTrackPointerDown}
            className="relative flex h-5 flex-1 cursor-pointer touch-pan-y items-center overflow-hidden rounded-full bg-[#e6eef7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1762A5]/60"
          >
            <div
              ref={thumbRef}
              onPointerDown={handleThumbPointerDown}
              style={{ width: '80px', transform: 'translate3d(0px, 0, 0)' }}
              className={`h-3 rounded-full touch-none select-none transition-colors ${
                isDragging
                  ? 'cursor-grabbing bg-[#0B4F93] shadow-[0_1px_4px_rgba(11,79,147,0.4)]'
                  : 'cursor-grab bg-[#1762A5] shadow-[0_1px_3px_rgba(23,98,165,0.3)] hover:bg-[#0B4F93]'
              }`}
            />
          </div>

          {/* RTL End Step Button (Scroll Left toward Price / Collection / Status / Actions) */}
          <button
            type="button"
            onClick={() => {
              markHintSeen();
              applyProgressToContainer(getStepBaseProgress() + 0.22, true);
            }}
            title="تمرير لليسار (بقية الأعمدة)"
            aria-label="تمرير أفقي لليسار نحو أعمدة المبالغ والإجراءات"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#1762A5] transition hover:bg-[#1762A5]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1762A5]/50"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
