import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { Auction, SystemSettings, Vehicle } from '../types';
import {
  buildVehicleFromImport,
  downloadVehiclesTemplateXlsx,
  ParsedVehicleImportRow,
  parseVehiclesSpreadsheet,
} from '../utils/excelCsv';
import { ARABIC_MONTHS, UAE_LOCATIONS, assetUrl, formatAED, formatNumber } from '../utils/uaeDate';
import { useSmartDialog } from './SmartDialogSystem';

interface ImportModalProps {
  isOpen: boolean;
  auctions: Auction[];
  defaultYear: number;
  defaultMonth: number;
  defaultLocation: string;
  settings: SystemSettings;
  ownerId: string;
  onClose: () => void;
  onImport: (
    items: Omit<Vehicle, 'createdAt' | 'updatedAt'>[],
    year: number,
    month: number
  ) => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  auctions,
  defaultYear,
  defaultMonth,
  defaultLocation,
  settings,
  ownerId,
  onClose,
  onImport,
}) => {
  const { showError, showSuccess, showValidation } = useSmartDialog();
  const titleId = useId();
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const [auctionId, setAuctionId] = useState(auctions[0]?.id || 'general_auction');
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [location, setLocation] = useState(
    defaultLocation !== 'all' ? defaultLocation : UAE_LOCATIONS[0]
  );
  const [rows, setRows] = useState<ParsedVehicleImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = assetUrl('assets/aistudio/logo_1afd1154.png');

  useEffect(() => {
    if (!isOpen) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || importing) return;
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
  }, [importing, isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const parsed = await parseVehiclesSpreadsheet(file, settings);
      if (parsed.length === 0) {
        const msg =
          'لم يتم العثور على صفوف مركبات صالحة في الملف. تأكد من استخدام القالب المعتمد.';
        setError(msg);
        showValidation({
          dedupeKey: 'validation:import-empty',
          title: 'ملف الاستيراد لا يحتوي على سجلات صالحة',
          description: msg,
          issues: [
            {
              fieldKey: 'importFile',
              fieldLabel: 'ملف Excel / CSV',
              message: 'لم يتم التعرف على أعمدة أو صفوف مركبات مطابقة للقالب.',
              guidance: 'حمّل قالب Excel الرسمي ثم تأكد من تعبئة رقم اللوت ونوع المركبة.',
            },
          ],
        });
      }
      setRows(parsed);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'تعذر قراءة الملف. تأكد أن الصيغة xlsx أو xls أو csv.';
      setError(msg);
      setRows([]);
      showError({
        title: 'تعذر قراءة ملف الاستيراد',
        operationName: 'تحليل ملف Excel / CSV',
        message: msg,
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
      });
    }
  };

  const handleConfirmImport = async () => {
    if (rows.length === 0 || importing) return;
    setImporting(true);
    setError(null);
    const importedCount = rows.length;
    const importedFileName = fileName || 'ملف بيانات';
    try {
      const built = rows.map((row) =>
        buildVehicleFromImport(row, {
          auctionId: auctionId || 'general_auction',
          year,
          month,
          defaultLocation: location,
          ownerId,
        })
      );
      await onImport(built, year, month);
      setRows([]);
      setFileName(null);
      onClose();
      showSuccess({
        title: 'تم استيراد الملف بنجاح',
        message: 'اكتملت عملية الاستيراد بنجاح وتم تحديث سجل المركبات والمؤشرات المالية.',
        details: [
          { label: 'اسم الملف', value: importedFileName },
          { label: 'عدد المركبات المستوردة', value: `${formatNumber(importedCount)} مركبة`, mono: true },
          { label: 'الفترة المالية', value: `${ARABIC_MONTHS[month - 1]} ${year}` },
          { label: 'الساحة الافتراضية', value: location },
        ],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل استيراد البيانات';
      setError(msg);
      showError({
        title: 'تعذر استيراد البيانات',
        operationName: 'استيراد بيانات المركبات (Excel / CSV)',
        message: msg,
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: handleConfirmImport,
      });
    } finally {
      setImporting(false);
    }
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
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[16px] border border-[#b7d1eb] bg-white shadow-2xl"
      >
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
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-sky-300" />
            <h3 id={titleId} className="truncate text-sm font-extrabold">
              استيراد بيانات المركبات والمبيعات (Excel / CSV)
            </h3>
          </div>
          <button
            type="button"
            disabled={importing}
            onClick={onClose}
            aria-label="إغلاق نافذة الاستيراد"
            className="rounded-lg p-1 text-white/80 hover:bg-white/15 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <div>
              <div className="font-extrabold text-[#0A2C52]">
                دعم كامل لملفات Excel (.xlsx / .xls) وملفات CSV باللغة العربية أو الإنجليزية
              </div>
              <div className="text-slate-600">
                يمكنك تحميل قالب الاستيراد الرسمي الجاهز ثم تعبئته ورفعه مباشرة دون الحاجة لإعادة التنسيق.
              </div>
            </div>
            <button
              type="button"
              onClick={downloadVehiclesTemplateXlsx}
              className="flex items-center gap-1.5 rounded-lg bg-[#0B4F93] px-3 py-2 font-bold text-white shadow hover:bg-[#083c72]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تحميل قالب Excel الرسمي</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-bold text-slate-700">المزاد المستهدف</label>
              <select
                value={auctionId}
                onChange={(e) => setAuctionId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
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
              <label className="mb-1 block font-bold text-slate-700">الشهر المالي</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
              >
                {ARABIC_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">السنة المالية</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 px-3 py-2 font-bold"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="mb-1 block font-bold text-slate-700">الساحة الافتراضية (إذا خلا الصف من الموقع)</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
              >
                {UAE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#8fb3d9] bg-[#f4f8fd] p-6 text-center transition hover:border-[#0B4F93] hover:bg-blue-50/70">
            <Upload className="h-7 w-7 text-[#0B4F93]" />
            <span className="text-sm font-extrabold text-[#0A2C52]">
              {fileName ? `الملف المحدد: ${fileName}` : 'اختر ملف Excel أو CSV لرفعه ومعاينته'}
            </span>
            <span className="text-[11px] text-slate-500">
              يدعم الصيغ: .xlsx, .xls, .csv
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-700">
              {error}
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-extrabold text-[#0A2C52]">
                <span>معاينة البيانات الجاهزة للاستيراد ({rows.length} مركبة)</span>
              </div>
              <div className="max-h-60 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-[11px]">
                  <thead className="sticky top-0 bg-[#0A2C52] text-white">
                    <tr>
                      <th className="px-2 py-2">اللوت</th>
                      <th className="px-2 py-2">المركبة</th>
                      <th className="px-2 py-2">السنة</th>
                      <th className="px-2 py-2">الحالة</th>
                      <th className="px-2 py-2">التقديرية</th>
                      <th className="px-2 py-2">سعر البيع</th>
                      <th className="px-2 py-2">المحصل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="font-mono-num px-2 py-1.5 font-bold">{r.lotNumber}</td>
                        <td className="px-2 py-1.5 font-bold">
                          {r.make} {r.model}
                        </td>
                        <td className="font-mono-num px-2 py-1.5">{r.modelYear}</td>
                        <td className="px-2 py-1.5">
                          {r.status === 'sold' ? 'مبيعة' : r.status === 'pending' ? 'قيد التحصيل' : 'غير مبيعة'}
                        </td>
                        <td dir="ltr" className="font-mono-num px-2 py-1.5">
                          {formatAED(r.estimatedValue)}
                        </td>
                        <td dir="ltr" className="font-mono-num px-2 py-1.5 font-bold text-[#C8232C]">
                          {formatAED(r.salePrice)}
                        </td>
                        <td dir="ltr" className="font-mono-num px-2 py-1.5 font-bold text-emerald-700">
                          {formatAED(r.collectedAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={importing}
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={rows.length === 0 || importing}
              onClick={handleConfirmImport}
              className="rounded-lg bg-[#C8232C] px-5 py-2 font-bold text-white shadow hover:bg-[#a81b23] disabled:opacity-50"
            >
              {importing ? 'جاري الاستيراد...' : `اعتماد واستيراد (${rows.length}) مركبة`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
