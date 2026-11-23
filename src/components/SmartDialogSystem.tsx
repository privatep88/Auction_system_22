import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';

export type SmartDialogVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'confirm'
  | 'delete'
  | 'approve'
  | 'loading';

export interface DialogDetailItem {
  label: string;
  value: string;
  dir?: 'rtl' | 'ltr';
  mono?: boolean;
}

export interface ValidationIssueItem {
  fieldKey: string;
  fieldLabel: string;
  message: string;
  guidance?: string;
}

interface VariantVisualConfig {
  icon: React.ComponentType<{ className?: string }>;
  badgeCls: string;
  iconCls: string;
  calloutCls: string;
  accentBorderCls: string;
  confirmBtnCls: string;
  badgeText: string;
  isCritical: boolean;
}

const VARIANT_CONFIG: Record<SmartDialogVariant, VariantVisualConfig> = {
  success: {
    icon: CheckCircle2,
    badgeCls: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    iconCls: 'text-emerald-600',
    calloutCls: 'border-emerald-200 bg-emerald-50/75 text-emerald-950',
    accentBorderCls: 'border-t-emerald-600',
    confirmBtnCls: 'bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-500 text-white',
    badgeText: 'عملية مكتملة',
    isCritical: false,
  },
  error: {
    icon: AlertCircle,
    badgeCls: 'border-red-200 bg-red-50 text-[#C8232C]',
    iconCls: 'text-[#C8232C]',
    calloutCls: 'border-red-200 bg-red-50/80 text-red-950',
    accentBorderCls: 'border-t-[#C8232C]',
    confirmBtnCls: 'bg-[#C8232C] hover:bg-[#a81b23] focus-visible:ring-red-500 text-white',
    badgeText: 'تنبيه خطأ',
    isCritical: true,
  },
  warning: {
    icon: AlertTriangle,
    badgeCls: 'border-amber-200 bg-amber-50 text-amber-800',
    iconCls: 'text-amber-600',
    calloutCls: 'border-amber-200 bg-amber-50/80 text-amber-950',
    accentBorderCls: 'border-t-amber-500',
    confirmBtnCls: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 text-white',
    badgeText: 'تحقق من البيانات',
    isCritical: true,
  },
  info: {
    icon: Info,
    badgeCls: 'border-sky-200 bg-sky-50 text-[#0B4F93]',
    iconCls: 'text-[#0B4F93]',
    calloutCls: 'border-sky-200 bg-sky-50/80 text-[#0A2C52]',
    accentBorderCls: 'border-t-[#0B4F93]',
    confirmBtnCls: 'bg-[#0B4F93] hover:bg-[#083c72] focus-visible:ring-blue-500 text-white',
    badgeText: 'معلومة تشغيلية',
    isCritical: false,
  },
  confirm: {
    icon: HelpCircle,
    badgeCls: 'border-blue-200 bg-[#edf5fd] text-[#0A2C52]',
    iconCls: 'text-[#0B4F93]',
    calloutCls: 'border-blue-200 bg-[#f4f8fd] text-[#0A2C52]',
    accentBorderCls: 'border-t-[#0B4F93]',
    confirmBtnCls: 'bg-[#0B4F93] hover:bg-[#083c72] focus-visible:ring-blue-500 text-white',
    badgeText: 'تأكيد إجراء',
    isCritical: true,
  },
  delete: {
    icon: Trash2,
    badgeCls: 'border-red-300 bg-red-50 text-[#99181F]',
    iconCls: 'text-[#99181F]',
    calloutCls: 'border-red-200 bg-red-50/85 text-red-950',
    accentBorderCls: 'border-t-[#99181F]',
    confirmBtnCls: 'bg-[#C8232C] hover:bg-[#99181F] focus-visible:ring-red-600 text-white',
    badgeText: 'إجراء حذف حساس',
    isCritical: true,
  },
  approve: {
    icon: ShieldCheck,
    badgeCls: 'border-emerald-200 bg-linear-to-l from-emerald-50 to-blue-50 text-[#0A2C52]',
    iconCls: 'text-emerald-700',
    calloutCls: 'border-emerald-200 bg-emerald-50/60 text-[#0A2C52]',
    accentBorderCls: 'border-t-emerald-700',
    confirmBtnCls: 'bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-600 text-white',
    badgeText: 'اعتماد رسمي',
    isCritical: true,
  },
  loading: {
    icon: Loader2,
    badgeCls: 'border-sky-200 bg-sky-50 text-[#0B4F93]',
    iconCls: 'text-[#0B4F93] animate-spin',
    calloutCls: 'border-sky-200 bg-sky-50/75 text-[#0A2C52]',
    accentBorderCls: 'border-t-[#0B4F93]',
    confirmBtnCls: 'bg-[#0B4F93] text-white',
    badgeText: 'جاري المعالجة',
    isCritical: false,
  },
};

function sanitizeTechnicalDetail(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw
    .replace(/(api[_-]?key|token|secret|password|authorization)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .slice(0, 600);
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

/* ============================================================================
   1. AppDialog — Accessible Corporate Portal Modal Shell
============================================================================ */
export interface AppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  variant?: SmartDialogVariant;
  maxWidthClass?: string;
  dismissible?: boolean;
  closeOnBackdrop?: boolean;
  busy?: boolean;
  onAfterCloseFocus?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const AppDialog: React.FC<AppDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  variant = 'info',
  maxWidthClass = 'max-w-lg',
  dismissible = true,
  closeOnBackdrop = false,
  busy = false,
  onAfterCloseFocus,
  footer,
  children,
}) => {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;
  const logoSrc = getBrandLogoUrl();

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const rafId = requestAnimationFrame(() => {
      const focusables = getFocusableElements(panelRef.current);
      if (focusables.length > 0) {
        // Focus primary/first meaningful action button inside dialog
        focusables[focusables.length - 1]?.focus();
      } else {
        panelRef.current?.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dismissible && !busy) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        const focusables = getFocusableElements(panelRef.current);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (active === first || !panelRef.current.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !panelRef.current.contains(active)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (onAfterCloseFocus) {
        requestAnimationFrame(() => onAfterCloseFocus());
      } else if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        requestAnimationFrame(() => previousFocusRef.current?.focus());
      }
    };
  }, [busy, dismissible, isOpen, onAfterCloseFocus, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      dir="rtl"
      data-saaed-smart-dialog="true"
      className="no-print fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-xs sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && closeOnBackdrop && dismissible && !busy) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role={cfg.isCritical ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`relative flex max-h-[92dvh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-[16px] border border-[#b7d1eb] border-t-4 ${cfg.accentBorderCls} bg-linear-to-b from-white via-[#fafdff] to-[#f2f7fd] text-slate-900 shadow-[0_24px_60px_rgba(4,22,47,0.38)] focus:outline-none`}
      >
        {/* Subtle institutional corner watermark (low opacity, never blocks content) */}
        {!logoFailed && (
          <img
            src={logoSrc}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
            className="pointer-events-none absolute -bottom-3 -left-3 h-20 w-auto select-none opacity-[0.035]"
          />
        )}

        {/* SAHER Corporate Navy Header */}
        <div
          className="relative flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white sm:px-5"
          style={{
            background: 'linear-gradient(90deg, #04162f 0%, #0a2e5c 52%, #062044 100%)',
          }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10">
              <Icon className="h-4.5 w-4.5 text-sky-200" />
            </span>
            <div className="min-w-0">
              <h3 id={titleId} className="truncate text-sm font-extrabold text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="truncate text-[11px] font-medium text-sky-200/90">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!logoFailed && (
              <img
                src={logoSrc}
                alt={BRAND_CONFIG.logoAlt}
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="hidden h-6 w-auto object-contain brightness-110 contrast-105 drop-shadow-[0_0_5px_rgba(255,255,255,0.85)] sm:block"
              />
            )}
            {dismissible && (
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                aria-label="إغلاق النافذة"
                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] bg-linear-to-r from-transparent via-sky-400/70 to-transparent"
          />
        </div>

        {/* Scrollable Content Body */}
        <div id={descId} className="relative z-10 flex-1 space-y-3.5 overflow-y-auto p-4 text-xs sm:p-5">
          {children}
        </div>

        {/* Sticky Action Footer */}
        {footer && (
          <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200/90 bg-slate-50/90 px-4 py-3 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

/* ============================================================================
   2. ConfirmDialog
============================================================================ */
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  impactNote?: string;
  details?: DialogDetailItem[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Extract<SmartDialogVariant, 'confirm' | 'delete' | 'approve' | 'warning'>;
  busy?: boolean;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  impactNote,
  details,
  confirmLabel = 'تأكيد الإجراء',
  cancelLabel = 'إلغاء',
  variant = 'confirm',
  busy: externalBusy,
  children,
}) => {
  const [internalBusy, setInternalBusy] = useState(false);
  const busy = externalBusy ?? internalBusy;
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  const handleConfirmClick = async () => {
    if (busy) return;
    setInternalBusy(true);
    try {
      await onConfirm();
    } finally {
      setInternalBusy(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={cfg.badgeText}
      variant={variant}
      dismissible={!busy}
      closeOnBackdrop={false}
      busy={busy}
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirmClick}
            className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-extrabold shadow transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-65 ${cfg.confirmBtnCls}`}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
            <span>{busy ? 'جاري التنفيذ...' : confirmLabel}</span>
          </button>
        </>
      }
    >
      <div className={`flex items-start gap-3 rounded-xl border p-3.5 ${cfg.calloutCls}`}>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cfg.badgeCls}`}
        >
          <Icon className={`h-5 w-5 ${cfg.iconCls}`} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[13px] font-extrabold leading-relaxed">{message}</p>
          {impactNote && <p className="text-[11px] font-semibold opacity-85">{impactNote}</p>}
        </div>
      </div>

      {details && details.length > 0 && (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 px-2.5 py-1.5">
              <span className="block text-[10px] font-bold text-slate-500">{item.label}</span>
              <span
                dir={item.dir}
                className={`block truncate text-[11.5px] font-extrabold text-[#0A2C52] ${
                  item.mono ? 'font-mono-num tabular-nums' : ''
                } ${item.dir === 'ltr' ? 'text-right' : ''}`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {children}
    </AppDialog>
  );
};

/* ============================================================================
   3. ValidationDialog
============================================================================ */
export interface ValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  issues: ValidationIssueItem[];
  onReturnToFix?: (firstFieldKey?: string) => void;
}

export const ValidationDialog: React.FC<ValidationDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  issues,
  onReturnToFix,
}) => {
  const firstKey = issues[0]?.fieldKey;

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="مراجعة والتحقق من صحة البيانات المدخلة"
      variant="warning"
      closeOnBackdrop={false}
      onAfterCloseFocus={onReturnToFix ? () => onReturnToFix(firstKey) : undefined}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B4F93] px-5 py-2 text-xs font-extrabold text-white shadow transition hover:bg-[#083c72] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span>العودة للتصحيح</span>
        </button>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/85 p-3.5 text-amber-950">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white text-amber-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[13px] font-extrabold leading-snug">{description}</p>
          <p className="text-[11px] font-semibold text-amber-800">
            تم الاحتفاظ بكافة البيانات التي أدخلتها. راجع الحقول المحددة أدناه ثم أعد المحاولة.
          </p>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[11px] font-extrabold text-[#0A2C52]">
            الحقول التي تتطلب تصحيحاً ({issues.length}):
          </div>
          <ul className="space-y-2">
            {issues.map((issue) => (
              <li
                key={`${issue.fieldKey}-${issue.message}`}
                className="rounded-lg border border-red-200/80 bg-red-50/55 px-3 py-2"
              >
                <div className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-[#99181F]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{issue.fieldLabel}:</span>
                  <span className="font-bold text-slate-800">{issue.message}</span>
                </div>
                {issue.guidance && (
                  <p className="mt-0.5 pr-5 text-[10.5px] font-semibold text-slate-600">
                    الإرشاد: {issue.guidance}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppDialog>
  );
};

/* ============================================================================
   4. SuccessDialog
============================================================================ */
export interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: DialogDetailItem[];
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details,
  primaryActionLabel,
  onPrimaryAction,
}) => {
  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="تم تنفيذ العملية بنجاح"
      variant="success"
      closeOnBackdrop
      footer={
        <>
          {primaryActionLabel && onPrimaryAction && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onPrimaryAction();
              }}
              className="rounded-lg border border-[#0B4F93]/30 bg-blue-50 px-4 py-2 text-xs font-extrabold text-[#0B4F93] transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {primaryActionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-extrabold text-white shadow transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            إغلاق
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-emerald-950">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300 bg-white text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <p className="text-[13px] font-extrabold leading-relaxed">{message}</p>
      </div>

      {details && details.length > 0 && (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 px-2.5 py-1.5">
              <span className="block text-[10px] font-bold text-slate-500">{item.label}</span>
              <span
                dir={item.dir}
                className={`block truncate text-[11.5px] font-extrabold text-[#0A2C52] ${
                  item.mono ? 'font-mono-num tabular-nums' : ''
                } ${item.dir === 'ltr' ? 'text-right' : ''}`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppDialog>
  );
};

/* ============================================================================
   5. ErrorDialog
============================================================================ */
export interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  operationName?: string;
  message: string;
  technicalDetail?: string;
  canViewTechnicalDetails?: boolean;
  onRetry?: () => Promise<void> | void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  onClose,
  title,
  operationName,
  message,
  technicalDetail,
  canViewTechnicalDetails = false,
  onRetry,
}) => {
  const [retrying, setRetrying] = useState(false);
  const [showTech, setShowTech] = useState(false);

  const safeTechnical = useMemo(() => sanitizeTechnicalDetail(technicalDetail), [technicalDetail]);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      onClose();
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={operationName ? `تعذر إتمام: ${operationName}` : 'تعذر إتمام العملية'}
      variant="error"
      closeOnBackdrop={false}
      busy={retrying}
      footer={
        <>
          <button
            type="button"
            disabled={retrying}
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            إغلاق
          </button>
          {onRetry && (
            <button
              type="button"
              disabled={retrying}
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#C8232C] px-5 py-2 text-xs font-extrabold text-white shadow transition hover:bg-[#a81b23] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-65"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>إعادة المحاولة</span>
            </button>
          )}
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/85 p-3.5 text-red-950">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-white text-[#C8232C]">
          <AlertCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          {operationName && (
            <div className="text-[11px] font-bold text-[#99181F]">العملية: {operationName}</div>
          )}
          <p className="text-[13px] font-extrabold leading-relaxed">{message}</p>
        </div>
      </div>

      {canViewTechnicalDetails && safeTechnical && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setShowTech((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
          >
            <span>التفاصيل التقنية للتشخيص</span>
            {showTech ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showTech && (
            <div
              dir="ltr"
              className="border-t border-slate-200 bg-slate-900 p-2.5 font-mono text-[10.5px] text-amber-200 break-words"
            >
              {safeTechnical}
            </div>
          )}
        </div>
      )}
    </AppDialog>
  );
};

/* ============================================================================
   6. Smart Dialog + Toast Central Provider & Hook
============================================================================ */
export interface ToastMessageInput {
  id?: string;
  variant?: Extract<SmartDialogVariant, 'success' | 'error' | 'warning' | 'info'>;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastItem extends ToastMessageInput {
  id: string;
  variant: Extract<SmartDialogVariant, 'success' | 'error' | 'warning' | 'info'>;
}

export interface ConfirmDialogOptions {
  dedupeKey?: string;
  title: string;
  message: string;
  impactNote?: string;
  details?: DialogDetailItem[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Extract<SmartDialogVariant, 'confirm' | 'delete' | 'approve' | 'warning'>;
  onConfirm: () => Promise<void> | void;
}

export interface ValidationDialogOptions {
  dedupeKey?: string;
  title: string;
  description: string;
  issues: ValidationIssueItem[];
  onReturnToFix?: (firstFieldKey?: string) => void;
}

export interface SuccessDialogOptions {
  dedupeKey?: string;
  title: string;
  message: string;
  details?: DialogDetailItem[];
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export interface ErrorDialogOptions {
  dedupeKey?: string;
  title: string;
  operationName?: string;
  message: string;
  technicalDetail?: string;
  onRetry?: () => Promise<void> | void;
}

type ActiveModalState =
  | { kind: 'confirm'; key: string; options: ConfirmDialogOptions }
  | { kind: 'validation'; key: string; options: ValidationDialogOptions }
  | { kind: 'success'; key: string; options: SuccessDialogOptions }
  | { kind: 'error'; key: string; options: ErrorDialogOptions }
  | null;

interface SmartDialogContextValue {
  showConfirm: (options: ConfirmDialogOptions) => void;
  showValidation: (options: ValidationDialogOptions) => void;
  showSuccess: (options: SuccessDialogOptions) => void;
  showError: (options: ErrorDialogOptions) => void;
  showToast: (input: ToastMessageInput) => void;
  dismissAllDialogs: () => void;
}

const SmartDialogContext = createContext<SmartDialogContextValue | null>(null);

interface SmartDialogProviderProps {
  canViewTechnicalDetails?: boolean;
  children: React.ReactNode;
}

export const SmartDialogProvider: React.FC<SmartDialogProviderProps> = ({
  canViewTechnicalDetails = false,
  children,
}) => {
  const [activeModal, setActiveModal] = useState<ActiveModalState>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastMessageInput) => {
      const id = input.id || `toast-${input.variant || 'info'}-${input.title}`;
      const variant = input.variant || 'info';
      const duration = input.durationMs ?? (variant === 'error' ? 5500 : 3800);

      setToasts((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        return [...filtered.slice(-3), { ...input, id, variant }];
      });

      const prevTimer = timersRef.current.get(id);
      if (prevTimer) clearTimeout(prevTimer);
      timersRef.current.set(
        id,
        setTimeout(() => {
          dismissToast(id);
        }, duration)
      );
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    const key = options.dedupeKey || `confirm:${options.title}`;
    setActiveModal((prev) => (prev && prev.key === key ? prev : { kind: 'confirm', key, options }));
  }, []);

  const showValidation = useCallback((options: ValidationDialogOptions) => {
    const key = options.dedupeKey || `validation:${options.title}`;
    setActiveModal((prev) =>
      prev && prev.key === key ? prev : { kind: 'validation', key, options }
    );
  }, []);

  const showSuccess = useCallback((options: SuccessDialogOptions) => {
    const key = options.dedupeKey || `success:${options.title}`;
    setActiveModal({ kind: 'success', key, options });
  }, []);

  const showError = useCallback((options: ErrorDialogOptions) => {
    const key = options.dedupeKey || `error:${options.title}:${options.message}`;
    // Critical errors replace lower-priority dialogs cleanly without stacking
    setActiveModal({ kind: 'error', key, options });
  }, []);

  const dismissAllDialogs = useCallback(() => {
    setActiveModal(null);
  }, []);

  const contextValue = useMemo<SmartDialogContextValue>(
    () => ({
      showConfirm,
      showValidation,
      showSuccess,
      showError,
      showToast,
      dismissAllDialogs,
    }),
    [dismissAllDialogs, showConfirm, showError, showSuccess, showToast, showValidation]
  );

  const closeActiveModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  return (
    <SmartDialogContext.Provider value={contextValue}>
      {children}

      {activeModal?.kind === 'confirm' && (
        <ConfirmDialog
          isOpen
          onClose={closeActiveModal}
          onConfirm={async () => {
            await activeModal.options.onConfirm();
            setActiveModal((curr) => (curr?.key === activeModal.key ? null : curr));
          }}
          title={activeModal.options.title}
          message={activeModal.options.message}
          impactNote={activeModal.options.impactNote}
          details={activeModal.options.details}
          confirmLabel={activeModal.options.confirmLabel}
          cancelLabel={activeModal.options.cancelLabel}
          variant={activeModal.options.variant}
        />
      )}

      {activeModal?.kind === 'validation' && (
        <ValidationDialog
          isOpen
          onClose={closeActiveModal}
          title={activeModal.options.title}
          description={activeModal.options.description}
          issues={activeModal.options.issues}
          onReturnToFix={activeModal.options.onReturnToFix}
        />
      )}

      {activeModal?.kind === 'success' && (
        <SuccessDialog
          isOpen
          onClose={closeActiveModal}
          title={activeModal.options.title}
          message={activeModal.options.message}
          details={activeModal.options.details}
          primaryActionLabel={activeModal.options.primaryActionLabel}
          onPrimaryAction={activeModal.options.onPrimaryAction}
        />
      )}

      {activeModal?.kind === 'error' && (
        <ErrorDialog
          isOpen
          onClose={closeActiveModal}
          title={activeModal.options.title}
          operationName={activeModal.options.operationName}
          message={activeModal.options.message}
          technicalDetail={activeModal.options.technicalDetail}
          canViewTechnicalDetails={canViewTechnicalDetails}
          onRetry={activeModal.options.onRetry}
        />
      )}

      {/* Non-blocking Floating Corporate Toast Stack */}
      {typeof document !== 'undefined' &&
        toasts.length > 0 &&
        createPortal(
          <div
            dir="rtl"
            aria-live="polite"
            aria-atomic="true"
            className="no-print pointer-events-none fixed bottom-4 left-4 right-4 z-[130] flex flex-col items-end gap-2 sm:left-5 sm:right-auto sm:w-96"
          >
            {toasts.map((t) => {
              const cfg = VARIANT_CONFIG[t.variant];
              const Icon = cfg.icon;
              return (
                <div
                  key={t.id}
                  role={t.variant === 'error' || t.variant === 'warning' ? 'alert' : 'status'}
                  className={`pointer-events-auto flex w-full items-start gap-2.5 rounded-[14px] border border-[#b7d1eb] border-r-4 bg-white p-3 text-xs shadow-[0_14px_34px_rgba(4,22,47,0.2)] ${
                    t.variant === 'success'
                      ? 'border-r-emerald-600'
                      : t.variant === 'error'
                        ? 'border-r-[#C8232C]'
                        : t.variant === 'warning'
                          ? 'border-r-amber-500'
                          : 'border-r-[#0B4F93]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${cfg.badgeCls}`}
                  >
                    <Icon className={`h-4 w-4 ${cfg.iconCls}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-[#0A2C52]">{t.title}</div>
                    {t.description && (
                      <div className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-600">
                        {t.description}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(t.id)}
                    aria-label="إغلاق التنبيه"
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </SmartDialogContext.Provider>
  );
};

export const ToastProvider = SmartDialogProvider;

export function useSmartDialog(): SmartDialogContextValue {
  const ctx = useContext(SmartDialogContext);
  if (!ctx) {
    throw new Error('useSmartDialog must be used inside SmartDialogProvider');
  }
  return ctx;
}
