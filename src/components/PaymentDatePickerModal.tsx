import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  User,
  X,
} from 'lucide-react';
import { CollectionRecord } from '../types';
import {
  ARABIC_WEEKDAYS_SHORT,
  buildCalendarMonthGrid,
  formatIsoDateParts,
  MAX_SA_YEAR,
  MIN_SA_YEAR,
  parseIsoDateParts,
} from '../utils/saleDate';
import { ARABIC_MONTHS, formatAED, getUaeCurrentDate } from '../utils/uaeDate';
import { useSmartDialog } from './SmartDialogSystem';

interface PaymentDatePickerModalProps {
  isOpen: boolean;
  record: CollectionRecord | null;
  onClose: () => void;
  onSavePaymentDate: (record: CollectionRecord, newCollectionDate: string) => Promise<void>;
}

const YEAR_OPTIONS = Array.from({ length: 31 }, (_, idx) => 2015 + idx); // 2015..2045

export const PaymentDatePickerModal: React.FC<PaymentDatePickerModalProps> = ({
  isOpen,
  record,
  onClose,
  onSavePaymentDate,
}) => {
  const titleId = useId();
  const manualInputRef = useRef<HTMLInputElement>(null);
  const { showConfirm } = useSmartDialog();

  const todayIso = useMemo(() => getUaeCurrentDate().isoDate, []);

  const [selectedIso, setSelectedIso] = useState('');
  const [manualText, setManualText] = useState('');
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(11);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !record) return;
    const existingParts = record.collectionDate ? parseIsoDateParts(record.collectionDate) : null;
    const initialYear = existingParts?.year ?? record.year;
    const initialMonth = existingParts?.month ?? record.month;
    const initialIso = existingParts
      ? formatIsoDateParts(existingParts.year, existingParts.month, existingParts.day)
      : record.year === getUaeCurrentDate().year && record.month === getUaeCurrentDate().month
        ? todayIso
        : formatIsoDateParts(record.year, record.month, 1);

    setSelectedIso(initialIso);
    setManualText(initialIso);
    setViewYear(Math.min(MAX_SA_YEAR, Math.max(MIN_SA_YEAR, initialYear)));
    setViewMonth(Math.min(12, Math.max(1, initialMonth)));
    setValidationError(null);
    setSubmitError(null);
    setSaving(false);

    const timer = window.setTimeout(() => {
      manualInputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen, record, todayIso]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, saving]);

  const calendarCells = useMemo(
    () => buildCalendarMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const parsedSelected = useMemo(() => parseIsoDateParts(selectedIso), [selectedIso]);

  const periodWillShift = useMemo(() => {
    if (!record || !parsedSelected) return false;
    return parsedSelected.year !== record.year || parsedSelected.month !== record.month;
  }, [record, parsedSelected]);

  const normalizedExistingIso = useMemo(() => {
    if (!record?.collectionDate) return '';
    const existing = parseIsoDateParts(record.collectionDate);
    return existing
      ? formatIsoDateParts(existing.year, existing.month, existing.day)
      : record.collectionDate.trim();
  }, [record]);

  if (!isOpen || !record || typeof document === 'undefined') return null;

  const handleSelectDay = (isoDate: string) => {
    if (saving) return;
    const parts = parseIsoDateParts(isoDate);
    if (!parts) return;
    setSelectedIso(isoDate);
    setManualText(isoDate);
    setViewYear(parts.year);
    setViewMonth(parts.month);
    setValidationError(null);
    setSubmitError(null);
  };

  const handleManualInputChange = (val: string) => {
    setManualText(val);
    setSubmitError(null);
    const trimmed = val.trim();
    if (!trimmed) {
      setValidationError('يرجى إدخال أو اختيار تاريخ دفع صالح بصيغة YYYY-MM-DD.');
      return;
    }
    const parts = parseIsoDateParts(trimmed);
    if (parts) {
      const normalized = formatIsoDateParts(parts.year, parts.month, parts.day);
      setSelectedIso(normalized);
      setViewYear(parts.year);
      setViewMonth(parts.month);
      setValidationError(null);
    } else {
      setValidationError('صيغة التاريخ غير صحيحة. الصيغة المعتمدة: YYYY-MM-DD (مثال: 2026-11-18).');
    }
  };

  const handlePrevMonth = () => {
    if (saving) return;
    if (viewMonth === 1) {
      setViewYear((y) => Math.max(MIN_SA_YEAR, y - 1));
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (saving) return;
    if (viewMonth === 12) {
      setViewYear((y) => Math.min(MAX_SA_YEAR, y + 1));
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const executePersistDate = async (normalizedDate: string) => {
    setSaving(true);
    setSubmitError(null);
    try {
      await onSavePaymentDate(record, normalizedDate);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'تعذر حفظ تاريخ الدفع في قاعدة البيانات. يرجى المحاولة مرة أخرى.';
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const trimmed = manualText.trim();
    const parts = parseIsoDateParts(trimmed);
    if (!parts) {
      setValidationError('لا يمكن الحفظ: يرجى تحديد تاريخ دفع صحيح بصيغة YYYY-MM-DD قبل المتابعة.');
      manualInputRef.current?.focus();
      return;
    }

    const normalizedDate = formatIsoDateParts(parts.year, parts.month, parts.day);
    if (normalizedDate === normalizedExistingIso) {
      onClose();
      return;
    }

    showConfirm({
      dedupeKey: `confirm-payment-date-${record.id}`,
      variant: 'confirm',
      title: 'تأكيد تعديل تاريخ الدفع',
      message: 'هل ترغب في اعتماد تاريخ الدفع الجديد لعملية التحصيل المحددة؟',
      impactNote:
        'سيتم تحديث تاريخ الدفع فقط وسجل التدقيق دون أي تغيير على المبالغ أو حالة السداد أو التقارير المعتمدة.',
      details: [
        { label: 'رقم العملية', value: record.receiptNo, dir: 'ltr', mono: true },
        { label: 'اسم المزايد', value: record.bidderName },
        {
          label: 'تاريخ الدفع السابق',
          value: record.collectionDate || 'غير محدد',
          dir: 'ltr',
          mono: true,
        },
        { label: 'تاريخ الدفع الجديد', value: normalizedDate, dir: 'ltr', mono: true },
      ],
      cancelLabel: 'مراجعة التاريخ',
      confirmLabel: 'اعتماد وحفظ التاريخ',
      onConfirm: () => executePersistDate(normalizedDate),
    });
  };

  return createPortal(
    <div
      dir="rtl"
      className="no-print fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-2xl"
      >
        {/* Navy Gradient Header */}
        <div className="flex items-center justify-between bg-gradient-to-l from-[#072B56] via-[#0B4F93] to-[#0E64B5] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
              <Calendar className="h-4 w-4 text-sky-200" />
            </span>
            <div>
              <h3 id={titleId} className="text-sm font-extrabold leading-tight">
                تعديل تاريخ الدفع
              </h3>
              <p className="text-[11px] text-sky-100/85">
                تحديث تاريخ سداد عملية التحصيل مع الحفاظ التام على المبالغ
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="إغلاق نافذة تعديل تاريخ الدفع"
            className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmSave} className="flex-1 space-y-3.5 overflow-y-auto p-5 text-xs">
          {/* Collection Operation & Financial Reference Context */}
          <div className="space-y-2 rounded-xl border border-blue-200/75 bg-slate-50/90 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-extrabold text-[#0A2C52]">
                <Receipt className="h-3.5 w-3.5 shrink-0 text-[#0B4F93]" />
                <span>رقم العملية:</span>
                <span dir="ltr" className="font-mono-num text-[#0B4F93]">
                  {record.receiptNo}
                </span>
              </div>
              <span
                dir="ltr"
                className="font-mono-num rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-extrabold text-[#0B4F93]"
              >
                {record.financialRef || record.receiptNo}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
              <div className="flex min-w-0 items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0 text-[#0B4F93]" />
                <span className="font-semibold text-slate-500">المزايد:</span>
                <span className="truncate font-bold text-[#0A2C52]" title={record.bidderName}>
                  {record.bidderName}
                </span>
              </div>
              <span dir="ltr" className="font-mono-num shrink-0 font-extrabold text-emerald-700">
                {formatAED(record.amount)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/80 pt-1.5 text-[11px]">
              <span className="font-semibold text-slate-500">تاريخ الدفع الحالي:</span>
              <span dir="ltr" className="font-mono-num font-bold text-slate-800">
                {record.collectionDate || 'غير محدد'}
              </span>
            </div>
          </div>

          {/* Interactive Calendar Widget */}
          <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-2xs">
            {/* Month / Year Controls */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handlePrevMonth}
                title="الشهر السابق"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-blue-50 hover:text-[#0B4F93] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="flex flex-1 items-center justify-center gap-1.5">
                <select
                  aria-label="اختيار الشهر"
                  disabled={saving}
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-[#0A2C52] focus:border-[#0B4F93] focus:outline-none"
                >
                  {ARABIC_MONTHS.map((label, idx) => (
                    <option key={label} value={idx + 1}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="اختيار السنة"
                  disabled={saving}
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="font-mono-num rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-[#0A2C52] focus:border-[#0B4F93] focus:outline-none"
                >
                  {!YEAR_OPTIONS.includes(viewYear) && (
                    <option value={viewYear}>{viewYear}</option>
                  )}
                  {YEAR_OPTIONS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleNextMonth}
                title="الشهر التالي"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-blue-50 hover:text-[#0B4F93] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday Header */}
            <div className="mb-1.5 grid grid-cols-7 gap-1 text-center">
              {ARABIC_WEEKDAYS_SHORT.map((dayName) => (
                <div
                  key={dayName}
                  className="py-1 text-[10.5px] font-extrabold text-slate-500"
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell) => {
                const isSelected = cell.isoDate === selectedIso && !validationError;
                const isToday = cell.isoDate === todayIso;

                return (
                  <button
                    key={`${cell.year}-${cell.month}-${cell.day}-${cell.isCurrentMonth ? 'c' : 'o'}`}
                    type="button"
                    disabled={saving}
                    onClick={() => handleSelectDay(cell.isoDate)}
                    className={`font-mono-num flex h-8 w-full items-center justify-center rounded-lg text-xs font-bold transition ${
                      isSelected
                        ? 'bg-[#0B4F93] text-white shadow-xs ring-2 ring-[#0B4F93]/30'
                        : cell.isCurrentMonth
                          ? isToday
                            ? 'border border-[#0B4F93]/50 bg-blue-50/70 text-[#0B4F93] hover:bg-blue-100'
                            : 'text-slate-800 hover:bg-blue-50 hover:text-[#0B4F93]'
                          : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual ISO Date Field */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="saaed-payment-date-input" className="font-bold text-slate-700">
                الإدخال المباشر للتاريخ (YYYY-MM-DD)
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSelectDay(todayIso)}
                className="text-[11px] font-bold text-[#0B4F93] hover:underline disabled:opacity-40"
              >
                تاريخ اليوم ({todayIso})
              </button>
            </div>
            <input
              id="saaed-payment-date-input"
              ref={manualInputRef}
              type="text"
              dir="ltr"
              disabled={saving}
              value={manualText}
              onChange={(e) => handleManualInputChange(e.target.value)}
              placeholder="YYYY-MM-DD"
              className={`font-mono-num w-full rounded-lg border px-3 py-2 text-left text-xs font-bold focus:outline-none ${
                validationError
                  ? 'border-red-400 bg-red-50/60 text-red-900 focus:border-red-500'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-[#0B4F93]'
              }`}
            />
            {validationError && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#C8232C]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* Informational Notice when shifting between months/years */}
          {periodWillShift && !validationError && parsedSelected && (
            <div className="rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2 text-[11px] leading-relaxed text-[#0A2C52]">
              سيتم تحديث التصنيف الزمني لعملية التحصيل إلى{' '}
              <strong className="font-extrabold">
                {ARABIC_MONTHS[parsedSelected.month - 1]} {parsedSelected.year}
              </strong>{' '}
              في التقارير الحية، مع الحفاظ التام على كافة المبالغ المالية وحالة السداد وتاريخ بيع المركبة والتقارير المعتمدة.
            </div>
          )}

          {/* Save / Backend Error */}
          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-[#99181F]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || Boolean(validationError) || !parsedSelected}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F93] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#083c72] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>جاري حفظ التاريخ...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>حفظ التاريخ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
