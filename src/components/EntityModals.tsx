import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import {
  Auction,
  AuctionStatus,
  CollectionRecord,
  PaymentMethod,
  SystemSettings,
  Vehicle,
  VehicleStatus,
} from '../types';
import {
  ARABIC_MONTHS,
  UAE_LOCATIONS,
  assetUrl,
  formatAED,
  getUaeCurrentDate,
} from '../utils/uaeDate';
import { useSmartDialog, ValidationIssueItem } from './SmartDialogSystem';

interface EntityModalHeaderProps {
  titleId: string;
  title: string;
  onClose: () => void;
  disabled?: boolean;
}

const EntityModalHeader: React.FC<EntityModalHeaderProps> = ({
  titleId,
  title,
  onClose,
  disabled = false,
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoSrc = assetUrl('assets/aistudio/logo_1afd1154.png');

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3.5 text-white"
      style={{
        background: 'linear-gradient(90deg, #04162f 0%, #0a2e5c 52%, #062044 100%)',
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {!logoFailed && (
          <img
            src={logoSrc}
            alt="SAAED"
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
            className="h-5 w-auto shrink-0 object-contain"
          />
        )}
        <h3 id={titleId} className="truncate text-sm font-extrabold">
          {title}
        </h3>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClose}
        aria-label="إغلاق النافذة"
        className="rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:opacity-40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

function useModalEscAndFocus(isOpen: boolean, busy: boolean, onClose: () => void) {
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || busy) return;
      if (document.querySelector('[data-saaed-smart-dialog="true"]')) return;
      event.preventDefault();
      onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (prevFocusRef.current && typeof prevFocusRef.current.focus === 'function') {
        requestAnimationFrame(() => prevFocusRef.current?.focus());
      }
    };
  }, [busy, isOpen, onClose]);
}

/* ============================================================================
   1. AuctionModal
============================================================================ */
interface AuctionModalProps {
  isOpen: boolean;
  editing: Auction | null;
  defaultYear: number;
  defaultMonth: number;
  defaultLocation: string;
  settings: SystemSettings;
  onClose: () => void;
  onSave: (
    payload: Omit<Auction, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
}

export const AuctionModal: React.FC<AuctionModalProps> = ({
  isOpen,
  editing,
  defaultYear,
  defaultMonth,
  defaultLocation,
  settings,
  onClose,
  onSave,
}) => {
  const { showConfirm, showError, showToast, showValidation } = useSmartDialog();
  const titleId = useId();
  const uae = getUaeCurrentDate();

  const [title, setTitle] = useState('');
  const [auctionCode, setAuctionCode] = useState('');
  const [location, setLocation] = useState<string>(UAE_LOCATIONS[0]);
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [auctionDate, setAuctionDate] = useState(uae.isoDate);
  const [status, setStatus] = useState<AuctionStatus>('active');
  const [saaedSharePercent, setSaaedSharePercent] = useState(settings.defaultSaaedSharePercent);
  const [thirdPartySharePercent, setThirdPartySharePercent] = useState(
    settings.defaultThirdPartySharePercent
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const titleInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const shareInputRef = useRef<HTMLInputElement>(null);

  useModalEscAndFocus(isOpen, saving, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    if (editing) {
      setTitle(editing.title);
      setAuctionCode(editing.auctionCode);
      setLocation(editing.location);
      setYear(editing.year);
      setMonth(editing.month);
      setAuctionDate(editing.auctionDate || uae.isoDate);
      setStatus(editing.status);
      setSaaedSharePercent(editing.saaedSharePercent);
      setThirdPartySharePercent(editing.thirdPartySharePercent);
      setNotes(editing.notes || '');
    } else {
      setTitle('');
      setAuctionCode(`AUC-${defaultYear}-${String(defaultMonth).padStart(2, '0')}`);
      setLocation(defaultLocation !== 'all' ? defaultLocation : UAE_LOCATIONS[0]);
      setYear(defaultYear);
      setMonth(defaultMonth);
      setAuctionDate(uae.isoDate);
      setStatus('active');
      setSaaedSharePercent(settings.defaultSaaedSharePercent);
      setThirdPartySharePercent(settings.defaultThirdPartySharePercent);
      setNotes('');
    }
  }, [isOpen, editing, defaultYear, defaultMonth, defaultLocation, settings, uae.isoDate]);

  const focusField = useCallback((fieldKey?: string) => {
    const map: Record<string, React.RefObject<HTMLInputElement | null>> = {
      title: titleInputRef,
      auctionCode: codeInputRef,
      auctionDate: dateInputRef,
      year: yearInputRef,
      saaedSharePercent: shareInputRef,
    };
    const target = fieldKey ? map[fieldKey]?.current : undefined;
    target?.focus();
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const executeSave = async (
    payload: Omit<Auction, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    setSaving(true);
    try {
      await onSave(payload, editing?.id);
      onClose();
      showToast({
        variant: 'success',
        title: editing ? 'تم حفظ تعديلات المزاد' : 'تم إنشاء المزاد بنجاح',
        description: `${payload.title} (${payload.auctionCode})`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر حفظ بيانات المزاد';
      showError({
        title: 'تعذر حفظ بيانات المزاد',
        operationName: editing ? 'تعديل بيانات المزاد' : 'إنشاء مزاد جديد',
        message: msg,
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: () => executeSave(payload),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const issues: ValidationIssueItem[] = [];
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) {
      const msg = 'يرجى إدخال اسم المزاد.';
      nextErrors.title = msg;
      issues.push({
        fieldKey: 'title',
        fieldLabel: 'اسم المزاد',
        message: msg,
        guidance: 'أدخل اسماً واضحاً يعبر عن المزاد وساحته.',
      });
    }

    if (!auctionCode.trim()) {
      const msg = 'يرجى إدخال رمز المزاد.';
      nextErrors.auctionCode = msg;
      issues.push({
        fieldKey: 'auctionCode',
        fieldLabel: 'رمز المزاد',
        message: msg,
        guidance: 'مثال: AUC-2026-11',
      });
    }

    if (auctionDate && Number.isNaN(Date.parse(auctionDate))) {
      const msg = 'تاريخ العملية غير صالح. يرجى مراجعة التاريخ المدخل.';
      nextErrors.auctionDate = msg;
      issues.push({
        fieldKey: 'auctionDate',
        fieldLabel: 'تاريخ انعقاد المزاد',
        message: msg,
      });
    }

    if (!Number.isFinite(year) || year < 2020 || year > 2040) {
      const msg = 'يرجى إدخال سنة مالية صالحة (بين 2020 و2040).';
      nextErrors.year = msg;
      issues.push({
        fieldKey: 'year',
        fieldLabel: 'السنة المالية',
        message: msg,
      });
    }

    if (
      !Number.isFinite(saaedSharePercent) ||
      !Number.isFinite(thirdPartySharePercent) ||
      saaedSharePercent < 0 ||
      thirdPartySharePercent < 0 ||
      saaedSharePercent + thirdPartySharePercent > 100.01
    ) {
      const msg = 'مجموع نسبة ساعد ونسبة الطرف الثالث يجب ألا يتجاوز 100% وفق الضوابط المعتمدة.';
      nextErrors.saaedSharePercent = msg;
      issues.push({
        fieldKey: 'saaedSharePercent',
        fieldLabel: 'نسب توزيع الإيرادات',
        message: msg,
        guidance: 'تحقق من أن النسبتين بين 0% و100% ولا يتعدى مجموعهما 100%.',
      });
    }

    setFieldErrors(nextErrors);
    if (issues.length > 0) {
      showValidation({
        dedupeKey: 'validation:auction-modal',
        title: 'بيانات غير مكتملة أو غير صالحة',
        description: 'يرجى استكمال وتصحيح الحقول الإلزامية قبل حفظ سجل المزاد.',
        issues,
        onReturnToFix: focusField,
      });
      return;
    }

    const payload: Omit<Auction, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      auctionCode: auctionCode.trim(),
      location,
      year,
      month,
      auctionDate,
      status,
      saaedSharePercent,
      thirdPartySharePercent,
      notes: notes.trim(),
    };

    if (editing) {
      showConfirm({
        dedupeKey: `confirm-edit-auction-${editing.id}`,
        variant: 'confirm',
        title: 'تأكيد تعديل بيانات المزاد',
        message: 'هل ترغب في حفظ التعديلات التي أجريتها على بيانات المزاد؟',
        impactNote: 'سيتم تحديث بيانات المزاد وتطبيق نسب التوزيع المحدثة على احتسابات الفترة.',
        details: [
          { label: 'اسم المزاد', value: payload.title },
          { label: 'رمز المزاد', value: payload.auctionCode, dir: 'ltr', mono: true },
          { label: 'الموقع / الساحة', value: payload.location },
          {
            label: 'نسبة التوزيع',
            value: `ساعد ${payload.saaedSharePercent}% / طرف ثالث ${payload.thirdPartySharePercent}%`,
          },
        ],
        cancelLabel: 'مراجعة البيانات',
        confirmLabel: 'حفظ التعديلات',
        onConfirm: () => executeSave(payload),
      });
      return;
    }

    await executeSave(payload);
  };

  return createPortal(
    <div
      dir="rtl"
      className="no-print fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-[16px] border border-[#b7d1eb] bg-white shadow-2xl"
      >
        <EntityModalHeader
          titleId={titleId}
          title={editing ? 'تعديل بيانات المزاد' : 'إضافة مزاد مركبات جديد'}
          onClose={onClose}
          disabled={saving}
        />

        <form noValidate onSubmit={handleSubmit} className="flex-1 space-y-3.5 overflow-y-auto p-5 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-slate-700">اسم المزاد *</label>
              <input
                ref={titleInputRef}
                type="text"
                aria-invalid={Boolean(fieldErrors.title)}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: '' }));
                }}
                placeholder="مثال: مزاد مركبات مصفح الأسبوعي"
                className={`w-full rounded-lg border px-3 py-2 font-semibold text-slate-900 focus:outline-none ${
                  fieldErrors.title
                    ? 'border-[#C8232C] bg-red-50/40 focus:border-[#C8232C]'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.title && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.title}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">رمز المزاد *</label>
              <input
                ref={codeInputRef}
                type="text"
                aria-invalid={Boolean(fieldErrors.auctionCode)}
                value={auctionCode}
                onChange={(e) => {
                  setAuctionCode(e.target.value);
                  if (fieldErrors.auctionCode) setFieldErrors((p) => ({ ...p, auctionCode: '' }));
                }}
                className={`font-mono-num w-full rounded-lg border px-3 py-2 font-bold text-slate-900 focus:outline-none ${
                  fieldErrors.auctionCode
                    ? 'border-[#C8232C] bg-red-50/40 focus:border-[#C8232C]'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.auctionCode && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.auctionCode}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">الموقع / الساحة</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              >
                {UAE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">تاريخ انعقاد المزاد</label>
              <input
                ref={dateInputRef}
                type="date"
                aria-invalid={Boolean(fieldErrors.auctionDate)}
                value={auctionDate}
                onChange={(e) => {
                  setAuctionDate(e.target.value);
                  if (fieldErrors.auctionDate) setFieldErrors((p) => ({ ...p, auctionDate: '' }));
                }}
                className={`font-mono-num w-full rounded-lg border px-3 py-2 font-semibold text-slate-900 focus:outline-none ${
                  fieldErrors.auctionDate
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.auctionDate && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.auctionDate}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">الشهر المالي</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              >
                {ARABIC_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">السنة المالية</label>
              <input
                ref={yearInputRef}
                type="number"
                min={2020}
                max={2040}
                aria-invalid={Boolean(fieldErrors.year)}
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  if (fieldErrors.year) setFieldErrors((p) => ({ ...p, year: '' }));
                }}
                className={`font-mono-num w-full rounded-lg border px-3 py-2 font-bold text-slate-900 focus:outline-none ${
                  fieldErrors.year
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.year && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.year}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">نسبة شركة ساعد (%)</label>
              <input
                ref={shareInputRef}
                type="number"
                min={0}
                max={100}
                step="0.01"
                aria-invalid={Boolean(fieldErrors.saaedSharePercent)}
                value={saaedSharePercent}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const val = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
                  setSaaedSharePercent(val);
                  setThirdPartySharePercent(Number((100 - val).toFixed(2)));
                  if (fieldErrors.saaedSharePercent) {
                    setFieldErrors((p) => ({ ...p, saaedSharePercent: '' }));
                  }
                }}
                className="font-mono-num w-full rounded-lg border border-slate-300 px-3 py-2 font-bold text-[#0B4F93] focus:border-[#0B4F93] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">نسبة الطرف الثالث (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                aria-invalid={Boolean(fieldErrors.saaedSharePercent)}
                value={thirdPartySharePercent}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const val = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
                  setThirdPartySharePercent(val);
                  setSaaedSharePercent(Number((100 - val).toFixed(2)));
                  if (fieldErrors.saaedSharePercent) {
                    setFieldErrors((p) => ({ ...p, saaedSharePercent: '' }));
                  }
                }}
                className="font-mono-num w-full rounded-lg border border-slate-300 px-3 py-2 font-bold text-[#C8232C] focus:border-[#0B4F93] focus:outline-none"
              />
            </div>

            {fieldErrors.saaedSharePercent && (
              <div className="sm:col-span-2">
                <p className="flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.saaedSharePercent}</span>
                </p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1 block font-bold text-slate-700">حالة المزاد</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AuctionStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              >
                <option value="draft">مسودة</option>
                <option value="active">نشط / جاري</option>
                <option value="closed">مغلق بانتظار الاعتماد</option>
                <option value="approved">معتمد</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block font-bold text-slate-700">ملاحظات تنفيذية</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#0B4F93] px-5 py-2 font-bold text-white shadow hover:bg-[#083c72] disabled:opacity-60"
            >
              {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إنشاء المزاد'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ============================================================================
   2. VehicleModal
============================================================================ */
interface VehicleModalProps {
  isOpen: boolean;
  editing: Vehicle | null;
  auctions: Auction[];
  defaultAuctionId: string;
  defaultYear: number;
  defaultMonth: number;
  defaultLocation: string;
  settings: SystemSettings;
  onClose: () => void;
  onSave: (
    payload: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  editing,
  auctions,
  defaultAuctionId,
  defaultYear,
  defaultMonth,
  defaultLocation,
  settings,
  onClose,
  onSave,
}) => {
  const { showConfirm, showError, showToast, showValidation } = useSmartDialog();
  const titleId = useId();

  const [auctionId, setAuctionId] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [modelYear, setModelYear] = useState(2024);
  const [vin, setVin] = useState('');
  const [location, setLocation] = useState<string>(UAE_LOCATIONS[0]);
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [status, setStatus] = useState<VehicleStatus>('sold');
  const [platformFee, setPlatformFee] = useState(settings.defaultPlatformFee);
  const [adminFee, setAdminFee] = useState(settings.defaultAdminFee);
  const [forkliftFee, setForkliftFee] = useState(settings.defaultForkliftFee);
  const [recoveryFee, setRecoveryFee] = useState(settings.defaultRecoveryFee);
  const [buyerName, setBuyerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const lotInputRef = useRef<HTMLInputElement>(null);
  const makeInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const modelYearInputRef = useRef<HTMLInputElement>(null);
  const estInputRef = useRef<HTMLInputElement>(null);
  const saleInputRef = useRef<HTMLInputElement>(null);
  const collectedInputRef = useRef<HTMLInputElement>(null);

  useModalEscAndFocus(isOpen, saving, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    if (editing) {
      setAuctionId(editing.auctionId);
      setLotNumber(editing.lotNumber);
      setMake(editing.make);
      setModel(editing.model);
      setModelYear(editing.modelYear);
      setVin(editing.vin || '');
      setLocation(editing.location);
      setYear(editing.year);
      setMonth(editing.month);
      setEstimatedValue(editing.estimatedValue);
      setSalePrice(editing.salePrice);
      setCollectedAmount(editing.collectedAmount);
      setStatus(editing.status);
      setPlatformFee(editing.platformFee);
      setAdminFee(editing.adminFee);
      setForkliftFee(editing.forkliftFee);
      setRecoveryFee(editing.recoveryFee);
      setBuyerName(editing.buyerName || '');
    } else {
      const initialAuction =
        (defaultAuctionId !== 'all' && auctions.find((a) => a.id === defaultAuctionId)) ||
        auctions[0];
      setAuctionId(initialAuction?.id || 'general_auction');
      setLotNumber(`LOT-${Math.floor(100 + Math.random() * 900)}`);
      setMake('');
      setModel('');
      setModelYear(2024);
      setVin('');
      setLocation(
        initialAuction?.location ||
          (defaultLocation !== 'all' ? defaultLocation : UAE_LOCATIONS[0])
      );
      setYear(initialAuction?.year || defaultYear);
      setMonth(initialAuction?.month || defaultMonth);
      setEstimatedValue(0);
      setSalePrice(0);
      setCollectedAmount(0);
      setStatus('sold');
      setPlatformFee(settings.defaultPlatformFee);
      setAdminFee(settings.defaultAdminFee);
      setForkliftFee(settings.defaultForkliftFee);
      setRecoveryFee(settings.defaultRecoveryFee);
      setBuyerName('');
    }
  }, [
    isOpen,
    editing,
    auctions,
    defaultAuctionId,
    defaultYear,
    defaultMonth,
    defaultLocation,
    settings,
  ]);

  const focusField = useCallback((fieldKey?: string) => {
    const map: Record<string, React.RefObject<HTMLInputElement | null>> = {
      lotNumber: lotInputRef,
      make: makeInputRef,
      model: modelInputRef,
      modelYear: modelYearInputRef,
      estimatedValue: estInputRef,
      salePrice: saleInputRef,
      collectedAmount: collectedInputRef,
    };
    const target = fieldKey ? map[fieldKey]?.current : undefined;
    target?.focus();
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const executeSave = async (
    payload: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    setSaving(true);
    try {
      await onSave(payload, editing?.id);
      onClose();
      showToast({
        variant: 'success',
        title: editing ? 'تم حفظ تعديلات المركبة' : 'تم حفظ المركبة بنجاح',
        description: `${payload.make} ${payload.model} (لوت ${payload.lotNumber})`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر حفظ بيانات المركبة';
      showError({
        title: 'تعذر حفظ بيانات المركبة',
        operationName: editing ? 'تعديل سجل مركبة' : 'إضافة مركبة جديدة',
        message: msg,
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: () => executeSave(payload),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const issues: ValidationIssueItem[] = [];
    const nextErrors: Record<string, string> = {};

    if (!lotNumber.trim()) {
      const msg = 'يرجى إدخال رقم اللوت للمركبة.';
      nextErrors.lotNumber = msg;
      issues.push({ fieldKey: 'lotNumber', fieldLabel: 'رقم اللوت', message: msg });
    }
    if (!make.trim()) {
      const msg = 'يرجى إدخال نوع / الشركة المصنعة للمركبة.';
      nextErrors.make = msg;
      issues.push({ fieldKey: 'make', fieldLabel: 'نوع المركبة', message: msg });
    }
    if (!model.trim()) {
      const msg = 'يرجى إدخال طراز المركبة.';
      nextErrors.model = msg;
      issues.push({ fieldKey: 'model', fieldLabel: 'الطراز', message: msg });
    }
    if (!Number.isFinite(modelYear) || modelYear < 1970 || modelYear > 2035) {
      const msg = 'يرجى إدخال سنة صنع صحيحة (1970 – 2035).';
      nextErrors.modelYear = msg;
      issues.push({ fieldKey: 'modelYear', fieldLabel: 'سنة الصنع', message: msg });
    }

    const numericChecks: Array<{ key: string; label: string; value: number }> = [
      { key: 'estimatedValue', label: 'القيمة التقديرية', value: estimatedValue },
      ...(status !== 'unsold'
        ? [
            { key: 'salePrice', label: 'سعر البيع بالمزاد', value: salePrice },
            { key: 'collectedAmount', label: 'المبلغ المحصل', value: collectedAmount },
          ]
        : []),
      { key: 'platformFee', label: 'رسوم المنصة', value: platformFee },
      { key: 'adminFee', label: 'الرسوم الإدارية', value: adminFee },
      { key: 'forkliftFee', label: 'رسوم الفوركلفت', value: forkliftFee },
      { key: 'recoveryFee', label: 'ريكفري ساعد', value: recoveryFee },
    ];

    for (const item of numericChecks) {
      if (!Number.isFinite(item.value) || item.value < 0) {
        const msg = 'يرجى إدخال مبلغ مالي صحيح وفق الضوابط المعتمدة.';
        nextErrors[item.key] = msg;
        issues.push({
          fieldKey: item.key,
          fieldLabel: item.label,
          message: msg,
          guidance: 'يجب أن تكون القيم المالية أرقاماً غير سالبة.',
        });
      }
    }

    setFieldErrors(nextErrors);
    if (issues.length > 0) {
      showValidation({
        dedupeKey: 'validation:vehicle-modal',
        title: 'بيانات المركبة غير مكتملة أو غير صالحة',
        description: 'يرجى استكمال وتصحيح الحقول المحددة قبل حفظ سجل المركبة.',
        issues,
        onReturnToFix: focusField,
      });
      return;
    }

    const payload: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
      auctionId: auctionId || 'general_auction',
      lotNumber: lotNumber.trim(),
      make: make.trim(),
      model: model.trim(),
      modelYear,
      ...(vin.trim() ? { vin: vin.trim() } : {}),
      location,
      year,
      month,
      estimatedValue: Math.max(0, estimatedValue),
      salePrice: status === 'unsold' ? 0 : Math.max(0, salePrice),
      collectedAmount: status === 'unsold' ? 0 : Math.max(0, collectedAmount),
      status,
      platformFee: Math.max(0, platformFee),
      adminFee: Math.max(0, adminFee),
      forkliftFee: Math.max(0, forkliftFee),
      recoveryFee: Math.max(0, recoveryFee),
      ...(buyerName.trim() ? { buyerName: buyerName.trim() } : {}),
    };

    if (editing) {
      showConfirm({
        dedupeKey: `confirm-edit-vehicle-${editing.id}`,
        variant: 'confirm',
        title: 'تأكيد تعديل بيانات المركبة',
        message: 'هل ترغب في حفظ التعديلات التي أجريتها على سجل المركبة؟',
        impactNote: 'سيتم تحديث السجلات والرسوم المرتبطة بهذه المركبة تلقائياً.',
        details: [
          { label: 'رقم اللوت', value: payload.lotNumber, dir: 'ltr', mono: true },
          { label: 'المركبة', value: `${payload.make} ${payload.model} (${payload.modelYear})` },
          { label: 'سعر البيع', value: formatAED(payload.salePrice), dir: 'ltr', mono: true },
          {
            label: 'المبلغ المحصل',
            value: formatAED(payload.collectedAmount),
            dir: 'ltr',
            mono: true,
          },
        ],
        cancelLabel: 'مراجعة البيانات',
        confirmLabel: 'حفظ التعديلات',
        onConfirm: () => executeSave(payload),
      });
      return;
    }

    await executeSave(payload);
  };

  return createPortal(
    <div
      dir="rtl"
      className="no-print fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[16px] border border-[#b7d1eb] bg-white shadow-2xl"
      >
        <EntityModalHeader
          titleId={titleId}
          title={editing ? 'تعديل بيانات المركبة' : 'إضافة مركبة جديدة إلى المزاد'}
          onClose={onClose}
          disabled={saving}
        />

        <form noValidate onSubmit={handleSubmit} className="flex-1 space-y-3.5 overflow-y-auto p-5 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-bold text-slate-700">المزاد المرتبط</label>
              <select
                value={auctionId}
                onChange={(e) => {
                  const chosen = auctions.find((a) => a.id === e.target.value);
                  setAuctionId(e.target.value);
                  if (chosen) {
                    setLocation(chosen.location);
                    setYear(chosen.year);
                    setMonth(chosen.month);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              >
                <option value="general_auction">مزاد عام ({ARABIC_MONTHS[month - 1]} {year})</option>
                {auctions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.auctionCode} - {a.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">رقم اللوت *</label>
              <input
                ref={lotInputRef}
                type="text"
                aria-invalid={Boolean(fieldErrors.lotNumber)}
                value={lotNumber}
                onChange={(e) => {
                  setLotNumber(e.target.value);
                  if (fieldErrors.lotNumber) setFieldErrors((p) => ({ ...p, lotNumber: '' }));
                }}
                className={`font-mono-num w-full rounded-lg border px-3 py-2 font-bold text-slate-900 focus:outline-none ${
                  fieldErrors.lotNumber
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.lotNumber && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.lotNumber}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">نوع المركبة *</label>
              <input
                ref={makeInputRef}
                type="text"
                aria-invalid={Boolean(fieldErrors.make)}
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  if (fieldErrors.make) setFieldErrors((p) => ({ ...p, make: '' }));
                }}
                placeholder="مرسيدس / تويوتا / نيسان"
                className={`w-full rounded-lg border px-3 py-2 font-semibold text-slate-900 focus:outline-none ${
                  fieldErrors.make
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.make && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.make}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">الطراز *</label>
              <input
                ref={modelInputRef}
                type="text"
                aria-invalid={Boolean(fieldErrors.model)}
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  if (fieldErrors.model) setFieldErrors((p) => ({ ...p, model: '' }));
                }}
                placeholder="S-Class / باترول"
                className={`w-full rounded-lg border px-3 py-2 font-semibold text-slate-900 focus:outline-none ${
                  fieldErrors.model
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.model && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.model}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">سنة الصنع</label>
              <input
                ref={modelYearInputRef}
                type="number"
                min={1970}
                max={2035}
                aria-invalid={Boolean(fieldErrors.modelYear)}
                value={modelYear}
                onChange={(e) => {
                  setModelYear(Number(e.target.value));
                  if (fieldErrors.modelYear) setFieldErrors((p) => ({ ...p, modelYear: '' }));
                }}
                className={`font-mono-num w-full rounded-lg border px-3 py-2 font-bold text-slate-900 focus:outline-none ${
                  fieldErrors.modelYear
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.modelYear && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.modelYear}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">الموقع / الساحة</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              >
                {UAE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">الشهر المالي</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              >
                {ARABIC_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">السنة المالية</label>
              <input
                type="number"
                min={2020}
                max={2040}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              >
                <option value="sold">مبيعة</option>
                <option value="unsold">غير مبيعة</option>
                <option value="pending">قيد التحصيل</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">رقم الشاصي (VIN)</label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="font-mono-num w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">اسم المشتري / المزايد</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#0B4F93] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-bold text-slate-700">القيمة التقديرية (AED)</label>
              <input
                ref={estInputRef}
                type="number"
                min={0}
                aria-invalid={Boolean(fieldErrors.estimatedValue)}
                value={estimatedValue}
                onChange={(e) => {
                  setEstimatedValue(Number(e.target.value));
                  if (fieldErrors.estimatedValue) {
                    setFieldErrors((p) => ({ ...p, estimatedValue: '' }));
                  }
                }}
                className={`font-mono-num w-full rounded-lg border bg-white px-3 py-2 font-bold text-[#0B4F93] focus:outline-none ${
                  fieldErrors.estimatedValue
                    ? 'border-[#C8232C]'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.estimatedValue && (
                <p className="mt-1 text-[10px] font-bold text-[#C8232C]">{fieldErrors.estimatedValue}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">سعر البيع بالمزاد (AED)</label>
              <input
                ref={saleInputRef}
                type="number"
                min={0}
                disabled={status === 'unsold'}
                aria-invalid={Boolean(fieldErrors.salePrice)}
                value={status === 'unsold' ? 0 : salePrice}
                onChange={(e) => {
                  setSalePrice(Number(e.target.value));
                  if (fieldErrors.salePrice) setFieldErrors((p) => ({ ...p, salePrice: '' }));
                }}
                className={`font-mono-num w-full rounded-lg border bg-white px-3 py-2 font-bold text-[#C8232C] focus:outline-none disabled:bg-slate-100 ${
                  fieldErrors.salePrice
                    ? 'border-[#C8232C]'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.salePrice && (
                <p className="mt-1 text-[10px] font-bold text-[#C8232C]">{fieldErrors.salePrice}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">المبلغ المحصل (AED)</label>
              <input
                ref={collectedInputRef}
                type="number"
                min={0}
                disabled={status === 'unsold'}
                aria-invalid={Boolean(fieldErrors.collectedAmount)}
                value={status === 'unsold' ? 0 : collectedAmount}
                onChange={(e) => {
                  setCollectedAmount(Number(e.target.value));
                  if (fieldErrors.collectedAmount) {
                    setFieldErrors((p) => ({ ...p, collectedAmount: '' }));
                  }
                }}
                className={`font-mono-num w-full rounded-lg border bg-white px-3 py-2 font-bold text-emerald-700 focus:outline-none disabled:bg-slate-100 ${
                  fieldErrors.collectedAmount
                    ? 'border-[#C8232C]'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.collectedAmount && (
                <p className="mt-1 text-[10px] font-bold text-[#C8232C]">{fieldErrors.collectedAmount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block font-bold text-slate-700">رسوم المنصة (AED)</label>
              <input
                type="number"
                min={0}
                value={platformFee}
                onChange={(e) => setPlatformFee(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">الرسوم الإدارية (AED)</label>
              <input
                type="number"
                min={0}
                value={adminFee}
                onChange={(e) => setAdminFee(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">الفوركلفت (AED)</label>
              <input
                type="number"
                min={0}
                value={forkliftFee}
                onChange={(e) => setForkliftFee(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">ريكفري ساعد (AED)</label>
              <input
                type="number"
                min={0}
                value={recoveryFee}
                onChange={(e) => setRecoveryFee(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#C8232C] px-5 py-2 font-bold text-white shadow hover:bg-[#a81b23] disabled:opacity-60"
            >
              {saving ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'حفظ المركبة'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ============================================================================
   3. CollectionModal
============================================================================ */
interface CollectionModalProps {
  isOpen: boolean;
  auctions: Auction[];
  vehicles: Vehicle[];
  defaultYear: number;
  defaultMonth: number;
  defaultLocation: string;
  onClose: () => void;
  onSave: (
    payload: Omit<CollectionRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  auctions,
  vehicles,
  defaultYear,
  defaultMonth,
  defaultLocation,
  onClose,
  onSave,
}) => {
  const { showError, showToast, showValidation } = useSmartDialog();
  const titleId = useId();
  const uae = getUaeCurrentDate();

  const [auctionId, setAuctionId] = useState('general_auction');
  const [vehicleId, setVehicleId] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [bidderName, setBidderName] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [collectionDate, setCollectionDate] = useState(uae.isoDate);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const receiptInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const bidderInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useModalEscAndFocus(isOpen, saving, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setAuctionId(auctions[0]?.id || 'general_auction');
    setVehicleId('');
    setReceiptNo(`REC-${Math.floor(10000 + Math.random() * 90000)}`);
    setBidderName('');
    setAmount(0);
    setMethod('bank_transfer');
    setCollectionDate(uae.isoDate);
    setNotes('');
  }, [isOpen, auctions, uae.isoDate]);

  const focusField = useCallback((fieldKey?: string) => {
    const map: Record<string, React.RefObject<HTMLInputElement | null>> = {
      receiptNo: receiptInputRef,
      amount: amountInputRef,
      bidderName: bidderInputRef,
      collectionDate: dateInputRef,
    };
    const target = fieldKey ? map[fieldKey]?.current : undefined;
    target?.focus();
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const executeSave = async (
    payload: Omit<CollectionRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => {
    setSaving(true);
    try {
      await onSave(payload);
      onClose();
      showToast({
        variant: 'success',
        title: 'تم تسجيل سند التحصيل بنجاح',
        description: `السند ${payload.receiptNo} بمبلغ ${formatAED(payload.amount)}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر تسجيل سند التحصيل المالي';
      showError({
        title: 'تعذر تسجيل سند التحصيل',
        operationName: 'تسجيل سند تحصيل مالي',
        message: msg,
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: () => executeSave(payload),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const issues: ValidationIssueItem[] = [];
    const nextErrors: Record<string, string> = {};

    if (!receiptNo.trim()) {
      const msg = 'يرجى إدخال رقم سند التحصيل.';
      nextErrors.receiptNo = msg;
      issues.push({ fieldKey: 'receiptNo', fieldLabel: 'رقم السند', message: msg });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      const msg = 'يرجى إدخال مبلغ مالي صحيح أكبر من صفر وفق الضوابط المعتمدة.';
      nextErrors.amount = msg;
      issues.push({
        fieldKey: 'amount',
        fieldLabel: 'المبلغ المحصل (AED)',
        message: msg,
        guidance: 'أدخل قيمة السند بالدرهم الإماراتي (أكبر من 0).',
      });
    }

    if (!bidderName.trim()) {
      const msg = 'يرجى إدخال اسم المزايد أو المشتري.';
      nextErrors.bidderName = msg;
      issues.push({ fieldKey: 'bidderName', fieldLabel: 'اسم المزايد / المشتري', message: msg });
    }

    if (!collectionDate || Number.isNaN(Date.parse(collectionDate))) {
      const msg = 'تاريخ العملية غير صالح. يرجى مراجعة التاريخ المدخل.';
      nextErrors.collectionDate = msg;
      issues.push({ fieldKey: 'collectionDate', fieldLabel: 'تاريخ التحصيل', message: msg });
    }

    setFieldErrors(nextErrors);
    if (issues.length > 0) {
      showValidation({
        dedupeKey: 'validation:collection-modal',
        title: 'بيانات سند التحصيل غير مكتملة',
        description: 'يرجى استكمال الحقول الإلزامية والتأكد من صحة المبلغ المالي قبل التسجيل.',
        issues,
        onReturnToFix: focusField,
      });
      return;
    }

    const matchedVehicle = vehicles.find((v) => v.id === vehicleId);
    const payload: Omit<CollectionRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
      auctionId: matchedVehicle?.auctionId || auctionId || 'general_auction',
      ...(vehicleId ? { vehicleId } : {}),
      receiptNo: receiptNo.trim(),
      bidderName: bidderName.trim(),
      amount,
      method,
      collectionDate,
      year: matchedVehicle?.year || defaultYear,
      month: matchedVehicle?.month || defaultMonth,
      location:
        matchedVehicle?.location ||
        (defaultLocation !== 'all' ? defaultLocation : UAE_LOCATIONS[0]),
      notes: notes.trim(),
    };

    await executeSave(payload);
  };

  return createPortal(
    <div
      dir="rtl"
      className="no-print fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[16px] border border-[#b7d1eb] bg-white shadow-2xl"
      >
        <EntityModalHeader
          titleId={titleId}
          title="تسجيل سند تحصيل مالي جديد"
          onClose={onClose}
          disabled={saving}
        />

        <form noValidate onSubmit={handleSubmit} className="flex-1 space-y-3 overflow-y-auto p-5 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-slate-700">رقم السند *</label>
              <input
                ref={receiptInputRef}
                type="text"
                aria-invalid={Boolean(fieldErrors.receiptNo)}
                value={receiptNo}
                onChange={(e) => {
                  setReceiptNo(e.target.value);
                  if (fieldErrors.receiptNo) setFieldErrors((p) => ({ ...p, receiptNo: '' }));
                }}
                className={`font-mono-num w-full rounded-lg border px-3 py-2 font-bold focus:outline-none ${
                  fieldErrors.receiptNo
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.receiptNo && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.receiptNo}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">المبلغ المحصل (AED) *</label>
              <input
                ref={amountInputRef}
                type="number"
                min={1}
                aria-invalid={Boolean(fieldErrors.amount)}
                value={amount}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  if (fieldErrors.amount) setFieldErrors((p) => ({ ...p, amount: '' }));
                }}
                className={`font-mono-num w-full rounded-lg border px-3 py-2 font-bold text-emerald-700 focus:outline-none ${
                  fieldErrors.amount
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.amount && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.amount}</span>
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block font-bold text-slate-700">اسم المزايد / المشتري *</label>
              <input
                ref={bidderInputRef}
                type="text"
                aria-invalid={Boolean(fieldErrors.bidderName)}
                value={bidderName}
                onChange={(e) => {
                  setBidderName(e.target.value);
                  if (fieldErrors.bidderName) setFieldErrors((p) => ({ ...p, bidderName: '' }));
                }}
                className={`w-full rounded-lg border px-3 py-2 font-semibold focus:outline-none ${
                  fieldErrors.bidderName
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.bidderName && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.bidderName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">المركبة (اختياري)</label>
              <select
                value={vehicleId}
                onChange={(e) => {
                  const v = vehicles.find((item) => item.id === e.target.value);
                  setVehicleId(e.target.value);
                  if (v) {
                    setAuctionId(v.auctionId);
                    if (v.buyerName && !bidderName) setBidderName(v.buyerName);
                    const remaining = Math.max(0, v.salePrice - v.collectedAmount);
                    if (remaining > 0 && amount === 0) setAmount(remaining);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
              >
                <option value="">تحصيل على مستوى المزاد</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.lotNumber} - {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">طريقة السداد</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
              >
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="card">بطاقة ائتمان / مدى</option>
                <option value="cheque">شيك مصرفي</option>
                <option value="cash">نقداً</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">تاريخ التحصيل</label>
              <input
                ref={dateInputRef}
                type="date"
                aria-invalid={Boolean(fieldErrors.collectionDate)}
                value={collectionDate}
                onChange={(e) => {
                  setCollectionDate(e.target.value);
                  if (fieldErrors.collectionDate) {
                    setFieldErrors((p) => ({ ...p, collectionDate: '' }));
                  }
                }}
                className={`font-mono-num w-full rounded-lg border px-3 py-2 font-semibold focus:outline-none ${
                  fieldErrors.collectionDate
                    ? 'border-[#C8232C] bg-red-50/40'
                    : 'border-slate-300 focus:border-[#0B4F93]'
                }`}
              />
              {fieldErrors.collectionDate && (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] font-bold text-[#C8232C]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fieldErrors.collectionDate}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">ملاحظات</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#0B4F93] px-5 py-2 font-bold text-white shadow hover:bg-[#083c72] disabled:opacity-60"
            >
              {saving ? 'جاري الحفظ...' : 'تسجيل التحصيل'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
