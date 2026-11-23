import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lock,
  Printer,
  X,
} from 'lucide-react';
import reportHeaderAccentImg from '../assets/images/financial_analytics_seamless_1794567167119.jpg';
import {
  ApprovedReport,
  Auction,
  ComputedFinancialMetrics,
  FilterState,
  MonthlyTrendPoint,
} from '../types';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';
import {
  formatAED,
  formatNumber,
  formatPercent,
  getMonthLabel,
  getUaeCurrentDate,
} from '../utils/uaeDate';
import { DonutChartCard, EstimatedVsActualBarChart } from './Charts';
import { useSmartDialog } from './SmartDialogSystem';

export type ReportOrientation = 'portrait' | 'landscape';

interface A4ReportContentProps {
  metrics: ComputedFinancialMetrics;
  filter: FilterState;
  auctions: Auction[];
  monthlyTrend: MonthlyTrendPoint[];
  actorName: string;
  isDemoMode?: boolean;
  snapshotReport?: ApprovedReport | null;
  orientation?: ReportOrientation;
}

const REPORT_STATUS_META: Record<
  'draft' | 'under_review' | 'approved' | 'archived',
  { label: string; badgeClass: string }
> = {
  approved: {
    label: 'معتمد رسمياً',
    badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  archived: {
    label: 'مؤرشف نهائياً',
    badgeClass: 'border-slate-300 bg-slate-100 text-slate-700',
  },
  under_review: {
    label: 'قيد المراجعة',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  draft: {
    label: 'مسودة (عرض حي)',
    badgeClass: 'border-sky-300 bg-sky-50 text-[#0A2C52]',
  },
};

export const A4ReportContent: React.FC<A4ReportContentProps> = ({
  metrics,
  filter,
  auctions,
  actorName,
  isDemoMode = false,
  snapshotReport = null,
  orientation = 'portrait',
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const [bannerImgFailed, setBannerImgFailed] = useState(false);

  const logoSrc = getBrandLogoUrl();
  const uae = getUaeCurrentDate();
  const isDemoReport = isDemoMode || Boolean(snapshotReport?.isDemo);

  const selectedAuction =
    filter.auctionId !== 'all'
      ? auctions.find((a) => a.id === filter.auctionId)
      : snapshotReport?.auctionId
        ? auctions.find((a) => a.id === snapshotReport.auctionId)
        : undefined;

  const actualStatus: 'draft' | 'under_review' | 'approved' | 'archived' = snapshotReport
    ? snapshotReport.status
    : selectedAuction?.status === 'approved'
      ? 'approved'
      : 'draft';
  const statusMeta = REPORT_STATUS_META[actualStatus];

  // Strictly immutable Snapshot values when snapshotReport is provided; otherwise live metrics
  const effectiveDisplayed = snapshotReport ? snapshotReport.totalVehicles : metrics.displayedCount;
  const effectiveSold = snapshotReport ? snapshotReport.soldVehicles : metrics.soldCount;
  const effectiveUnsold = Math.max(0, effectiveDisplayed - effectiveSold);
  const effectiveAllEstimated = snapshotReport
    ? snapshotReport.totalEstimated
    : metrics.totalEstimatedValue;
  const effectiveSoldEstimated = snapshotReport
    ? snapshotReport.soldEstimated ?? snapshotReport.totalEstimated
    : metrics.soldEstimatedValue;
  const effectiveSale = snapshotReport ? snapshotReport.totalSale : metrics.totalSaleValue;
  const effectiveCollected = snapshotReport
    ? snapshotReport.totalCollected
    : metrics.totalCollected;
  const effectiveOutstanding = snapshotReport
    ? snapshotReport.outstandingReceivables ?? Math.max(0, effectiveSale - effectiveCollected)
    : metrics.outstandingReceivables;
  const effectiveSaaedShare = snapshotReport
    ? snapshotReport.saaedShareAmount
    : metrics.saaedShareAmount;
  const effectiveThirdPartyShare = snapshotReport
    ? snapshotReport.thirdPartyShareAmount
    : metrics.thirdPartyShareAmount;
  const effectivePlatformFees = snapshotReport
    ? snapshotReport.totalPlatformFees ?? metrics.totalPlatformFees
    : metrics.totalPlatformFees;
  const effectiveAdminFees = snapshotReport
    ? snapshotReport.totalAdminFees ?? metrics.totalAdminFees
    : metrics.totalAdminFees;
  const effectiveForkliftFees = snapshotReport
    ? snapshotReport.totalForkliftFees ?? metrics.totalForkliftFees
    : metrics.totalForkliftFees;
  const effectiveRecoveryFees = snapshotReport
    ? snapshotReport.totalRecoveryFees ?? metrics.totalRecoveryFees
    : metrics.totalRecoveryFees;
  const effectiveTotalServices = snapshotReport
    ? snapshotReport.totalServices
    : metrics.totalServiceFees;

  const effectiveSaaedPct =
    effectiveCollected > 0
      ? (effectiveSaaedShare / effectiveCollected) * 100
      : metrics.saaedSharePercent;
  const effectiveThirdPct =
    effectiveCollected > 0
      ? (effectiveThirdPartyShare / effectiveCollected) * 100
      : metrics.thirdPartySharePercent;

  const effectiveSuccessRate =
    effectiveDisplayed > 0 ? (effectiveSold / effectiveDisplayed) * 100 : null;
  const effectiveCollectionRate =
    effectiveSale > 0 ? (effectiveCollected / effectiveSale) * 100 : null;
  const effectiveAvgSale = effectiveSold > 0 ? effectiveSale / effectiveSold : null;
  const effectiveAvgEst =
    effectiveDisplayed > 0 ? effectiveAllEstimated / effectiveDisplayed : null;
  const effectiveVarianceAmt = effectiveSale - effectiveSoldEstimated;
  const effectiveVariancePct =
    effectiveSoldEstimated > 0
      ? (effectiveVarianceAmt / effectiveSoldEstimated) * 100
      : null;

  const soldPct =
    effectiveDisplayed > 0
      ? ((effectiveSold / effectiveDisplayed) * 100).toFixed(1)
      : '0.0';
  const unsoldPct =
    effectiveDisplayed > 0
      ? ((effectiveUnsold / effectiveDisplayed) * 100).toFixed(1)
      : '0.0';

  const highestVehicleText = snapshotReport
    ? snapshotReport.highestVehiclePrice
      ? `${formatAED(snapshotReport.highestVehiclePrice)}${
          snapshotReport.highestVehicleLabel ? ` (${snapshotReport.highestVehicleLabel})` : ''
        }`
      : 'AED 0'
    : metrics.highestVehicle
      ? `${formatAED(metrics.highestVehicle.salePrice)} (${metrics.highestVehicle.make} ${metrics.highestVehicle.model} - لوت ${metrics.highestVehicle.lotNumber})`
      : 'AED 0';

  const mandatoryRows = [
    { label: '1. عدد المركبات المعروضة', value: `${formatNumber(effectiveDisplayed)} مركبة` },
    {
      label: '2. عدد المركبات المبيعة / غير المبيعة',
      value: `${formatNumber(effectiveSold)} مبيعة / ${formatNumber(effectiveUnsold)} غير مبيعة`,
    },
    {
      label: '3. القيمة التقديرية الأولية لجميع المركبات المعروضة',
      value: formatAED(effectiveAllEstimated),
    },
    {
      label: '4. القيمة التقديرية للمركبات المبيعة',
      value: formatAED(effectiveSoldEstimated),
    },
    { label: '5. إجمالي قيمة البيع بالمزاد', value: formatAED(effectiveSale) },
    {
      label: '6. فرق البيع عن القيمة التقديرية (للمبيعة)',
      value:
        effectiveSold > 0
          ? `${formatAED(effectiveVarianceAmt)}${
              effectiveVariancePct !== null
                ? ` (${effectiveVariancePct >= 0 ? '+' : ''}${effectiveVariancePct.toFixed(2)}%)`
                : ''
            }`
          : 'AED 0',
    },
    { label: '7. المركبة الأعلى سعراً', value: highestVehicleText },
    { label: '8. المبالغ المحصلة من المزايدين', value: formatAED(effectiveCollected) },
    { label: '9. المبالغ المتبقية قيد التحصيل', value: formatAED(effectiveOutstanding) },
    {
      label: `10. حصة ${BRAND_CONFIG.companyNameAr} من المبالغ المحصلة`,
      value: `${formatAED(effectiveSaaedShare)} (${effectiveSaaedPct.toFixed(2)}%)`,
    },
    {
      label: '11. حصة الطرف الثالث من المبالغ المحصلة',
      value: `${formatAED(effectiveThirdPartyShare)} (${effectiveThirdPct.toFixed(2)}%)`,
    },
    { label: '12. رسوم المنصة للمركبات المبيعة', value: formatAED(effectivePlatformFees) },
    { label: '13. الرسوم الإدارية بعد البيع', value: formatAED(effectiveAdminFees) },
    { label: '14. مبالغ خدمات الفوركلفت', value: formatAED(effectiveForkliftFees) },
    { label: `15. مبالغ نقل المركبات – ريكفري ${BRAND_CONFIG.nameAr}`, value: formatAED(effectiveRecoveryFees) },
    { label: '16. إجمالي رسوم الخدمات المحصلة', value: formatAED(effectiveTotalServices) },
  ];

  const periodLabel = snapshotReport
    ? `${snapshotReport.month === 0 ? 'تقرير سنوي' : getMonthLabel(snapshotReport.month)} ${snapshotReport.year}`
    : `${getMonthLabel(filter.month)} ${filter.year}`;

  const locationLabel =
    snapshotReport?.location ||
    (filter.location === 'all' ? 'جميع المواقع والساحات' : filter.location);

  const auctionLabel = selectedAuction
    ? `${selectedAuction.auctionCode} – ${selectedAuction.title}`
    : snapshotReport?.auctionId
      ? snapshotReport.auctionId
      : 'كافة المزادات المسجلة';

  const isLandscape = orientation === 'landscape';
  const sheetOrientationClass = isLandscape
    ? 'saaed-a4-sheet-landscape'
    : 'saaed-a4-sheet-portrait';

  // Deterministic executive insights for Snapshot reports so immutable values never mix with live data
  const executivePoints = snapshotReport
    ? [
        `بلغت نسبة نجاح البيع في هذه النسخة المعتمدة ${formatPercent(effectiveSuccessRate, 2)} بواقع ${formatNumber(effectiveSold)} مركبة مبيعة من أصل ${formatNumber(effectiveDisplayed)} مركبة معروضة.`,
        `وصلت كفاءة التحصيل المالي إلى ${formatPercent(effectiveCollectionRate, 2)} بإجمالي مبالغ محصلة ${formatAED(effectiveCollected)} من أصل ${formatAED(effectiveSale)}.`,
        `سجل فارق البيع عن القيمة التقديرية للمركبات المبيعة ${formatAED(effectiveVarianceAmt)} (${effectiveVariancePct !== null ? `${effectiveVariancePct >= 0 ? '+' : ''}${effectiveVariancePct.toFixed(2)}%` : '—'}).`,
        `توزعت حصص المبالغ المحصلة بواقع ${formatAED(effectiveSaaedShare)} ل${BRAND_CONFIG.companyNameAr} (${effectiveSaaedPct.toFixed(2)}%) و${formatAED(effectiveThirdPartyShare)} للطرف الثالث (${effectiveThirdPct.toFixed(2)}%)، إضافة إلى رسوم خدمات بقيمة ${formatAED(effectiveTotalServices)}.`,
      ]
    : metrics.executivePoints;

  const executiveRecommendations = snapshotReport
    ? [
        effectiveOutstanding > 0
          ? `متابعة تحصيل المبالغ المتبقية البالغة ${formatAED(effectiveOutstanding)} وفق سياسات السداد المعتمدة.`
          : 'تحقيق تحصيل كامل لمستحقات الفترة المعتمدة دون متأخرات.',
        ...(snapshotReport.notes ? [snapshotReport.notes] : []),
      ]
    : metrics.executiveRecommendations;

  const totalPages = 2;

  const renderOfficialPageFooter = (pageNumber: number) => (
    <footer className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] font-bold text-slate-600">
      <div className="flex items-center gap-2">
        <span className="text-[#0A2C52]">{BRAND_CONFIG.bilingualArEn}</span>
        <span className="text-slate-300">|</span>
        <span>إعداد وتصميم: خالد الهاشمي</span>
      </div>
      <div className="text-slate-500">
        {isDemoReport
          ? 'نسخة عرض تجريبي (Demo)'
          : snapshotReport
            ? `نسخة أرشيف معتمدة v${snapshotReport.version || 1}`
            : 'التقرير المالي التنفيذي للمزادات'}
      </div>
      <div className="font-mono-num tabular-nums text-[#0A2C52]">
        صفحة {pageNumber} من {totalPages}
      </div>
    </footer>
  );

  return (
    <div dir="rtl" className="space-y-6 print:space-y-0">
      {/* ==================== PAGE 1: OFFICIAL HEADER & FINANCIAL STATEMENT ==================== */}
      <section
        className={`saaed-a4-sheet ${sheetOrientationClass} mx-auto rounded-lg border border-slate-300 shadow-lg print:rounded-none`}
      >
        <div>
          {/* Low-height Executive Corporate Panoramic Header Strip (Page 1 Only) */}
          <div className="print-avoid-break relative mb-3 flex h-12 items-center justify-between overflow-hidden rounded-lg bg-[#05204a] px-4 text-white">
            {!bannerImgFailed && (
              <img
                src={reportHeaderAccentImg}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setBannerImgFailed(true)}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-25 select-none"
              />
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-l from-[#041838]/95 via-[#072a5e]/88 to-[#05204a]/92"
            />
            <div className="relative z-10 min-w-0">
              <div className="truncate text-[11px] font-extrabold tracking-tight text-white">
                {BRAND_CONFIG.systemFullTitleAr}
              </div>
              <div dir="ltr" className="truncate text-[10px] font-semibold text-sky-200">
                {BRAND_CONFIG.nameEn} Executive Auction Financial Report
              </div>
            </div>
            <div className="relative z-10 flex shrink-0 items-center rounded-md bg-white/95 px-2.5 py-1 shadow-xs">
              {!logoFailed ? (
                <img
                  src={logoSrc}
                  alt={BRAND_CONFIG.logoAlt}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="h-6.5 w-auto object-contain"
                />
              ) : (
                <span className="text-xs font-extrabold text-[#0A2C52]">{BRAND_CONFIG.compactBilingual}</span>
              )}
            </div>
          </div>

          {/* Demo Workspace or Immutable Snapshot Notice */}
          {isDemoReport && (
            <div className="print-avoid-break mb-2.5 flex items-center justify-between rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold text-amber-900">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span>تقرير بيئة العرض التجريبي – غير مخصص للاعتماد المالي الرسمي</span>
              </div>
              <span className="font-mono-num text-[10px]">DEMO WORKSPACE</span>
            </div>
          )}

          {snapshotReport && (
            <div className="print-avoid-break mb-2.5 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10.5px] font-bold text-[#0A2C52]">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#0B4F93]" />
                <span>
                  نسخة معتمدة ثابتة (Immutable Snapshot) – محفوظة للأرشفة ولا تتغير بالتعديلات اللاحقة
                </span>
              </div>
              <span className="font-mono-num tabular-nums">
                v{snapshotReport.version || 1} ·{' '}
                {snapshotReport.approvedAt
                  ? snapshotReport.approvedAt.slice(0, 16).replace('T', ' ')
                  : uae.isoDate}
              </span>
            </div>
          )}

          {/* Official Report Title & Scope Block */}
          <div className="print-avoid-break mb-3 flex flex-wrap items-start justify-between gap-2 border-b-2 border-[#0A2C52] pb-2.5">
            <div className="space-y-0.5">
              <h1 className="text-sm font-extrabold text-[#0A2C52] sm:text-[15px]">
                {snapshotReport?.title || `التقرير المالي التنفيذي لمزادات المركبات – ${BRAND_CONFIG.companyNameAr}`}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-semibold text-slate-600">
                <span>
                  الفترة: <strong className="text-[#0A2C52]">{periodLabel}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  الموقع / الساحة: <strong className="text-[#0A2C52]">{locationLabel}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  المزاد: <strong className="text-[#0A2C52]">{auctionLabel}</strong>
                </span>
              </div>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-0.5 text-[11px] font-extrabold ${statusMeta.badgeClass}`}
            >
              حالة التقرير: {statusMeta.label}
            </span>
          </div>

          {/* 4-Cell Metadata Strip */}
          <div className="print-avoid-break mb-3.5 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10.5px] sm:grid-cols-4">
            <div>
              <span className="block font-semibold text-slate-500">تاريخ ووقت الإصدار</span>
              <span className="font-mono-num tabular-nums font-bold text-slate-800">
                {uae.formattedDateTime}
              </span>
            </div>
            <div>
              <span className="block font-semibold text-slate-500">مُعد / معتمد التقرير</span>
              <span className="font-bold text-slate-800">
                {snapshotReport?.approvedByName || actorName}
              </span>
            </div>
            <div>
              <span className="block font-semibold text-slate-500">العملة المعتمدة</span>
              <span className="font-bold text-[#0A2C52]">الدرهم الإماراتي (AED)</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-500">بيئة البيانات</span>
              <span className="font-bold text-slate-800">
                {isDemoReport ? 'عرض تجريبي (Demo)' : 'بيئة الإنتاج الرسمية'}
              </span>
            </div>
          </div>

          {/* Section 1: Complete 16-Item Mandatory Financial Statement */}
          <div className="mb-2">
            <h2 className="mb-2 border-r-4 border-[#C8232C] pr-2 text-xs font-extrabold text-[#0A2C52]">
              أولاً: البيان المالي التنفيذي الموحد لبنود المزاد (AED)
            </h2>
            <table
              className={`w-full border-collapse border border-slate-300 ${
                isLandscape ? 'text-[10.5px]' : 'text-[11.5px]'
              }`}
            >
              <thead>
                <tr className="bg-[#0A2C52] text-white">
                  <th
                    className={`border border-slate-300 px-3 text-right font-bold ${
                      isLandscape ? 'py-1.5' : 'py-2'
                    }`}
                  >
                    البند المالي والتشغيلي
                  </th>
                  <th
                    className={`w-[42%] border border-slate-300 px-3 text-left font-bold ${
                      isLandscape ? 'py-1.5' : 'py-2'
                    }`}
                  >
                    القيمة المعتمدة
                  </th>
                </tr>
              </thead>
              <tbody>
                {mandatoryRows.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={
                      idx === 15
                        ? 'bg-blue-50/80 font-extrabold'
                        : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/80'
                    }
                  >
                    <td
                      className={`border border-slate-300 px-3 font-bold text-slate-800 ${
                        isLandscape ? 'py-1' : 'py-1.5'
                      }`}
                    >
                      {row.label}
                    </td>
                    <td
                      dir="ltr"
                      className={`font-mono-num tabular-nums border border-slate-300 px-3 text-left font-extrabold text-[#0A2C52] ${
                        isLandscape ? 'py-1' : 'py-1.5'
                      }`}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {renderOfficialPageFooter(1)}
      </section>

      {/* ==================== PAGE 2: KPIs, CHARTS, TOP VEHICLES & EXECUTIVE ANALYSIS ==================== */}
      <section
        className={`saaed-a4-sheet ${sheetOrientationClass} mx-auto rounded-lg border border-slate-300 shadow-lg print:rounded-none`}
      >
        <div>
          {/* Page 2 Continuation Header */}
          <div
            className={`print-avoid-break flex items-center justify-between border-b-2 border-[#0A2C52] pb-2 ${
              isLandscape ? 'mb-2.5' : 'mb-3.5'
            }`}
          >
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-[#0A2C52]">
                تابع: التقرير المالي التنفيذي لمزادات المركبات – {BRAND_CONFIG.companyNameAr}
              </div>
              <div className="text-[10.5px] font-semibold text-slate-600">
                {periodLabel} · {locationLabel} · {statusMeta.label}
              </div>
            </div>
            {!logoFailed && (
              <img
                src={logoSrc}
                alt={BRAND_CONFIG.logoAlt}
                referrerPolicy="no-referrer"
                className="h-8.5 w-auto shrink-0 object-contain"
              />
            )}
          </div>

          {/* Section 2: Analytical KPIs Grid */}
          <div className={`print-avoid-break ${isLandscape ? 'mb-2.5' : 'mb-4'}`}>
            <h2 className="mb-1.5 border-r-4 border-[#0B4F93] pr-2 text-xs font-extrabold text-[#0A2C52]">
              ثانياً: مؤشرات الأداء المالي والتشغيلي الرئيسية
            </h2>
            <div
              className={`grid gap-2 text-xs ${isLandscape ? 'grid-cols-6' : 'grid-cols-3'}`}
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[10px] font-bold text-slate-500">نسبة نجاح البيع</div>
                <div className="font-mono-num tabular-nums mt-0.5 text-[13px] font-extrabold text-[#0A2C52]">
                  {formatPercent(effectiveSuccessRate, 2)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[10px] font-bold text-slate-500">متوسط سعر البيع</div>
                <div
                  dir="ltr"
                  className="font-mono-num tabular-nums mt-0.5 text-right text-[13px] font-extrabold text-emerald-700"
                >
                  {effectiveAvgSale !== null ? formatAED(effectiveAvgSale) : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[10px] font-bold text-slate-500">متوسط القيمة التقديرية</div>
                <div
                  dir="ltr"
                  className="font-mono-num tabular-nums mt-0.5 text-right text-[13px] font-extrabold text-[#0B4F93]"
                >
                  {effectiveAvgEst !== null ? formatAED(effectiveAvgEst) : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[10px] font-bold text-slate-500">الفرق عن التقدير (للمبيعة)</div>
                <div
                  dir="ltr"
                  className="font-mono-num tabular-nums mt-0.5 text-right text-[13px] font-extrabold text-[#0A2C52]"
                >
                  {effectiveSold > 0 ? formatAED(effectiveVarianceAmt) : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[10px] font-bold text-slate-500">نسبة التحصيل المالي</div>
                <div className="font-mono-num tabular-nums mt-0.5 text-[13px] font-extrabold text-emerald-700">
                  {formatPercent(effectiveCollectionRate, 2)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[10px] font-bold text-slate-500">إجمالي رسوم الخدمات</div>
                <div
                  dir="ltr"
                  className="font-mono-num tabular-nums mt-0.5 text-right text-[13px] font-extrabold text-[#C8232C]"
                >
                  {formatAED(effectiveTotalServices)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Comparison & Distribution Vector Charts */}
          <div
            className={`print-avoid-break grid grid-cols-2 gap-3 ${
              isLandscape ? 'mb-2.5' : 'mb-4'
            }`}
          >
            <EstimatedVsActualBarChart
              estimatedValue={effectiveSoldEstimated}
              allDisplayedEstimatedValue={effectiveAllEstimated}
              actualSaleValue={effectiveSale}
              variancePercent={effectiveVariancePct}
            />
            <DonutChartCard
              title="نسبة المركبات المبيعة وغير المبيعة"
              centerPrimary={formatNumber(effectiveDisplayed)}
              centerSecondary="مركبة"
              formatValue={(v) => `${formatNumber(v)} مركبة`}
              segments={[
                {
                  label: 'مبيعة',
                  value: effectiveSold,
                  color: '#0A569E',
                  sublabel: `${formatNumber(effectiveSold)} (${soldPct}%)`,
                },
                {
                  label: 'غير مبيعة',
                  value: effectiveUnsold,
                  color: '#E03131',
                  sublabel: `${formatNumber(effectiveUnsold)} (${unsoldPct}%)`,
                },
              ]}
            />
          </div>

          {/* Bottom Pair: Top Vehicles + Executive Analysis (side-by-side in Landscape, stacked in Portrait) */}
          <div className={isLandscape ? 'grid grid-cols-2 items-start gap-3' : 'space-y-4'}>
            {/* Section 4: Top Vehicles Table */}
            <div className="print-avoid-break">
              <h2 className="mb-1.5 border-r-4 border-amber-500 pr-2 text-xs font-extrabold text-[#0A2C52]">
                ثالثاً: {snapshotReport ? 'أعلى مركبة مبيعة في النسخة المعتمدة' : 'أعلى خمس مركبات من حيث سعر البيع'}
              </h2>
              {snapshotReport ? (
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-[#e9f1fa] text-[#0A2C52]">
                      <th className="border border-slate-300 px-3 py-1.5 text-right">بيان المركبة الأعلى سعراً (Snapshot)</th>
                      <th className="w-[36%] border border-slate-300 px-3 py-1.5 text-left">سعر البيع (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-800">
                        {snapshotReport.highestVehicleLabel || 'بيان غير مسجل في النسخة'}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums border border-slate-300 px-3 py-1.5 text-left font-extrabold text-[#0A2C52]"
                      >
                        {formatAED(snapshotReport.highestVehiclePrice || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-[#e9f1fa] text-[#0A2C52]">
                      <th className="border border-slate-300 px-2 py-1 text-right">م</th>
                      <th className="border border-slate-300 px-2 py-1 text-right">رقم اللوت</th>
                      <th className="border border-slate-300 px-2 py-1 text-right">نوع المركبة</th>
                      <th className="border border-slate-300 px-2 py-1 text-right">الطراز</th>
                      <th className="border border-slate-300 px-2 py-1 text-right">سنة الصنع</th>
                      <th className="border border-slate-300 px-2 py-1 text-left">سعر البيع (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.top5Vehicles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-slate-300 py-3 text-center text-slate-400">
                          لا توجد مركبات مبيعة مسجلة ضمن هذه الفترة
                        </td>
                      </tr>
                    ) : (
                      metrics.top5Vehicles.map((v, i) => (
                        <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="font-mono-num tabular-nums border border-slate-300 px-2 py-1">{i + 1}</td>
                          <td className="font-mono-num tabular-nums border border-slate-300 px-2 py-1">{v.lotNumber}</td>
                          <td className="border border-slate-300 px-2 py-1 font-bold">{v.make}</td>
                          <td className="border border-slate-300 px-2 py-1">{v.model}</td>
                          <td className="font-mono-num tabular-nums border border-slate-300 px-2 py-1">{v.modelYear}</td>
                          <td
                            dir="ltr"
                            className="font-mono-num tabular-nums border border-slate-300 px-2 py-1 text-left font-bold text-[#0A2C52]"
                          >
                            {formatAED(v.salePrice)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Section 5: Executive Financial Analysis & Recommendations */}
            <div className="print-avoid-break rounded-xl border border-slate-300 bg-slate-50/80 p-3">
              <h2 className="mb-1.5 text-xs font-extrabold text-[#0A2C52]">
                رابعاً: التحليل المالي التنفيذي والتوصيات
              </h2>
              {executivePoints.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد بيانات تحليلية مسجلة لهذه الفترة.</p>
              ) : (
                <ul className="space-y-1 text-[11px] text-slate-800">
                  {executivePoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="font-semibold leading-snug">{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
              {executiveRecommendations.length > 0 && (
                <div className="mt-2 border-t border-slate-200 pt-1.5">
                  <div className="mb-1 text-[11px] font-extrabold text-[#C8232C]">
                    التوصيات التنفيذية:
                  </div>
                  <ul className="space-y-0.5 text-[10.5px] font-semibold text-slate-700">
                    {executiveRecommendations.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {renderOfficialPageFooter(2)}
      </section>
    </div>
  );
};

interface A4ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ComputedFinancialMetrics;
  filter: FilterState;
  auctions: Auction[];
  monthlyTrend: MonthlyTrendPoint[];
  actorName: string;
  isDemoMode?: boolean;
  snapshotReport?: ApprovedReport | null;
  orientation?: ReportOrientation;
  onOrientationChange?: (next: ReportOrientation) => void;
}

export const A4ReportModal: React.FC<A4ReportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  filter,
  auctions,
  monthlyTrend,
  actorName,
  isDemoMode = false,
  snapshotReport = null,
  orientation = 'portrait',
  onOrientationChange,
}) => {
  const { showError, showToast } = useSmartDialog();
  const titleId = useId();
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const [localOrientation, setLocalOrientation] = useState<ReportOrientation>(orientation);
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const activeOrientation = onOrientationChange ? orientation : localOrientation;
  const setOrientation = onOrientationChange || setLocalOrientation;

  useEffect(() => {
    if (!isOpen) {
      setExportFeedback(null);
      setExporting(false);
      return;
    }
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !exporting) {
        if (document.querySelector('[data-saaed-smart-dialog="true"]')) return;
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (prevFocusRef.current && typeof prevFocusRef.current.focus === 'function') {
        requestAnimationFrame(() => prevFocusRef.current?.focus());
      }
    };
  }, [exporting, isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const waitForPrintReadiness = async () => {
    try {
      if (document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }

      const printImgs = Array.from(
        document.querySelectorAll<HTMLImageElement>('#saaed-print-sheet-root img')
      );
      if (printImgs.length > 0) {
        await Promise.race([
          Promise.all(
            printImgs.map((img) =>
              img.complete
                ? Promise.resolve()
                : new Promise<void>((resolve) => {
                    img.addEventListener('load', () => resolve(), { once: true });
                    img.addEventListener('error', () => resolve(), { once: true });
                  })
            )
          ),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      }

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    } catch {
      // Proceed gracefully even if a font readiness check throws
    }
  };

  const handlePrint = async () => {
    if (exporting) return;
    setExporting(true);
    setExportFeedback(null);

    try {
      const printRoot = document.getElementById('saaed-print-sheet-root');
      if (!printRoot) {
        throw new Error('لم يتم العثور على حاوية الطباعة المعتمدة.');
      }

      await waitForPrintReadiness();

      if (typeof window.print !== 'function') {
        throw new Error('المتصفح الحالي لا يدعم واجهة الطباعة المباشرة.');
      }

      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.removeEventListener('afterprint', finish);
          resolve();
        };
        window.addEventListener('afterprint', finish, { once: true });
        window.print();
        setTimeout(finish, 1200);
      });

      setExportFeedback({
        type: 'success',
        message:
          'تم تشغيل نافذة الطباعة / الحفظ بصيغة PDF بنجاح — اختر «حفظ بتنسيق PDF / Save as PDF» لحفظ الملف بنصوصه العربية كاملة.',
      });
      showToast({
        variant: 'info',
        title: 'نافذة الطباعة والتصدير PDF جاهزة',
        description: 'اختر «حفظ بتنسيق PDF / Save as PDF» للاحتفاظ بالنصوص العربية والرسوم بدقتها الكاملة.',
      });
    } catch (err) {
      const reason =
        err instanceof Error && err.message
          ? err.message
          : 'قد يكون المتصفح أو بيئة العرض قد حجبت نافذة الطباعة.';
      setExportFeedback({
        type: 'error',
        message: `تعذر إتمام الطباعة وتصدير PDF: ${reason} جرّب الضغط على Ctrl+P (أو Cmd+P) داخل النافذة.`,
      });
      showError({
        title: 'تعذر تصدير التقرير',
        operationName: 'طباعة / تصدير PDF',
        message: `حدثت مشكلة أثناء إنشاء أو طباعة ملف PDF: ${reason}`,
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: handlePrint,
      });
    } finally {
      setExporting(false);
    }
  };

  return createPortal(
    <div
      dir="rtl"
      className="no-print fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-xs sm:p-5"
    >
      {/* Dynamic @page orientation override synchronized with preview */}
      <style media="print">{`@page { size: A4 ${activeOrientation}; margin: 10mm 12mm; }`}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] border border-[#b7d1eb] bg-slate-100 shadow-2xl"
      >
        {/* Modal Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-white"
          style={{
            background: 'linear-gradient(90deg, #04162f 0%, #0a2e5c 52%, #062044 100%)',
          }}
        >
          <div className="min-w-0">
            <h3 id={titleId} className="flex items-center gap-2 text-sm font-extrabold">
              <FileText className="h-4 w-4 shrink-0 text-sky-300" />
              <span>
                معاينة التقرير المالي التنفيذي (A4 – PDF)
                {isDemoMode || snapshotReport?.isDemo ? ' [نسخة تجريبية Demo]' : ''}
              </span>
            </h3>
            <p className="mt-0.5 text-[11px] text-blue-200">
              معاينة مطابقة تماماً لنسخة الطباعة وملف PDF — صفحتان A4 بترقيم تلقائي واتجاه RTL وحفظ نصوص عربية قابلة للنسخ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Portrait / Landscape Selector */}
            <div className="flex items-center rounded-lg border border-white/20 bg-white/10 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`rounded-md px-2.5 py-1 transition ${
                  activeOrientation === 'portrait'
                    ? 'bg-white text-[#0A2C52] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                عمودي A4
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`rounded-md px-2.5 py-1 transition ${
                  activeOrientation === 'landscape'
                    ? 'bg-white text-[#0A2C52] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                أفقي A4
              </button>
            </div>

            <button
              type="button"
              disabled={exporting}
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-[#C8232C] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#a81b23] disabled:cursor-not-allowed disabled:opacity-65"
            >
              <Printer className="h-4 w-4" />
              <span>{exporting ? 'جاري تجهيز التقرير...' : 'طباعة / تصدير PDF'}</span>
            </button>

            <button
              type="button"
              disabled={exporting}
              onClick={onClose}
              aria-label="إغلاق المعاينة"
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Truthful Print / Export Feedback Banner */}
        {exportFeedback && (
          <div
            className={`flex items-center justify-between gap-2 border-b px-5 py-2 text-xs font-bold ${
              exportFeedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {exportFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{exportFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportFeedback(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              إخفاء
            </button>
          </div>
        )}

        {/* Paginated A4 Sheets Preview Container */}
        <div className="flex-1 overflow-y-auto bg-slate-200/80 p-4 sm:p-8">
          <A4ReportContent
            metrics={metrics}
            filter={filter}
            auctions={auctions}
            monthlyTrend={monthlyTrend}
            actorName={actorName}
            isDemoMode={isDemoMode}
            snapshotReport={snapshotReport}
            orientation={activeOrientation}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
