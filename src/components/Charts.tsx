import React, { useId, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { MonthlyTrendPoint } from '../types';
import { formatAED, formatNumber } from '../utils/uaeDate';

interface CardBannerStripProps {
  src?: string;
  alt?: string;
  objectPosition?: string;
}

const CardBannerStrip: React.FC<CardBannerStripProps> = ({
  src,
  alt = '',
  objectPosition = 'center center',
}) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <div className="relative h-24 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-26">
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={{ objectPosition }}
        className="h-full w-full object-cover select-none"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white via-white/55 to-transparent"
      />
    </div>
  );
};

interface BarComparisonProps {
  estimatedValue: number;
  allDisplayedEstimatedValue?: number;
  actualSaleValue: number;
  variancePercent: number | null;
  headerIcon?: React.ReactNode;
  darkHeader?: boolean;
  bannerImg?: string;
  bannerAlt?: string;
  bannerObjectPosition?: string;
}

export const EstimatedVsActualBarChart: React.FC<BarComparisonProps> = ({
  estimatedValue,
  allDisplayedEstimatedValue,
  actualSaleValue,
  variancePercent,
  headerIcon,
  darkHeader = false,
  bannerImg,
  bannerAlt,
  bannerObjectPosition,
}) => {
  const maxVal = Math.max(estimatedValue, actualSaleValue, 1);
  const yMax = Math.ceil(maxVal * 1.15);

  const formatAxisTick = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
    return String(Math.round(val));
  };

  const estHeightPct = estimatedValue > 0 ? Math.max(6, (estimatedValue / yMax) * 100) : 0;
  const actHeightPct = actualSaleValue > 0 ? Math.max(6, (actualSaleValue / yMax) * 100) : 0;
  const isPositive = (variancePercent ?? 0) >= 0;

  return (
    <div className="saaed-card flex h-full min-w-0 flex-col overflow-hidden rounded-xl print-avoid-break">
      {darkHeader ? (
        <div className="saaed-card-header flex items-center justify-between px-3.5 py-2.5 text-white">
          <div className="flex min-w-0 items-center gap-2">
            {headerIcon}
            <h3 className="truncate text-sm font-extrabold tracking-tight">
              مقارنة القيمة التقديرية والبيع الفعلي
            </h3>
          </div>
        </div>
      ) : (
        <div className="mx-3.5 mt-3.5 mb-2 flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            {headerIcon}
            <h3 className="text-sm font-extrabold text-[#0A2C52]">
              مقارنة القيمة التقديرية والبيع الفعلي
            </h3>
          </div>
        </div>
      )}

      <CardBannerStrip
        src={bannerImg}
        alt={bannerAlt}
        objectPosition={bannerObjectPosition}
      />

      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div className="flex flex-1 flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          {/* Variance Callout Box (RTL right side) */}
          <div
            className={`flex shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-3 text-center shadow-2xs sm:w-[112px] ${
              variancePercent === null
                ? 'border-slate-200 bg-white'
                : isPositive
                  ? 'border-[#b9e1ca] bg-[#f4fbf7]'
                  : 'border-red-200 bg-red-50/70'
            }`}
          >
            {variancePercent === null ? (
              <>
                <span className="font-mono-num text-lg font-extrabold text-slate-400">—</span>
                <span className="mt-1 text-[11px] font-bold text-slate-500">
                  لا توجد تقديرات
                </span>
              </>
            ) : (
              <>
                <div
                  className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full ${
                    isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-[#C8232C]'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 stroke-[2.5]" />
                  )}
                </div>
                <span
                  dir="ltr"
                  className={`font-mono-num text-[17px] font-extrabold tracking-tight ${
                    isPositive ? 'text-emerald-700' : 'text-[#C8232C]'
                  }`}
                >
                  {isPositive ? `+${variancePercent.toFixed(2)}%` : `${variancePercent.toFixed(2)}%`}
                </span>
                <span className="mt-1 text-[11px] font-bold leading-snug text-slate-700">
                  {isPositive ? 'نسبة الزيادة في قيمة البيع' : 'نسبة الانخفاض في قيمة البيع'}
                </span>
              </>
            )}
          </div>

          {/* Bar Chart Area + Dedicated Y-axis Column */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-stretch gap-1.5">
              {/* Bars Plot */}
              <div className="relative flex h-38 min-w-0 flex-1 items-end border-b border-slate-300 px-2 pt-5">
                {/* Horizontal Grid Lines */}
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                  {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                    <div key={ratio} className="w-full border-t border-dashed border-slate-200" />
                  ))}
                </div>

                {/* Vertical Bars */}
                <div className="relative z-10 flex h-full w-full items-end justify-around gap-3">
                  {/* Actual Sale Bar (Red) */}
                  <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    <span
                      dir="ltr"
                      className="font-mono-num mb-1 whitespace-nowrap text-[11px] font-extrabold text-[#0A2C52]"
                    >
                      {formatNumber(actualSaleValue)}
                    </span>
                    <div
                      className="w-full max-w-[70px] rounded-t-md shadow-sm transition-all duration-300"
                      style={{
                        height: `${actHeightPct}%`,
                        background:
                          'linear-gradient(180deg, #EF4444 0%, #C8232C 58%, #99181F 100%)',
                      }}
                    />
                  </div>

                  {/* Estimated Bar for Sold Vehicles (Blue) */}
                  <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    <span
                      dir="ltr"
                      className="font-mono-num mb-1 whitespace-nowrap text-[11px] font-extrabold text-[#0A2C52]"
                    >
                      {formatNumber(estimatedValue)}
                    </span>
                    <div
                      className="w-full max-w-[70px] rounded-t-md shadow-sm transition-all duration-300"
                      style={{
                        height: `${estHeightPct}%`,
                        background:
                          'linear-gradient(180deg, #2580DC 0%, #0B55A1 58%, #073B75 100%)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Y-axis Ticks Column */}
              <div className="flex h-38 w-9 shrink-0 flex-col justify-between text-left">
                {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                  <span
                    key={ratio}
                    dir="ltr"
                    className="font-mono-num -translate-y-1.5 text-[10px] font-semibold text-slate-400"
                  >
                    {estimatedValue === 0 && actualSaleValue === 0
                      ? '0'
                      : formatAxisTick(yMax * ratio)}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-1.5 flex items-start justify-around gap-2 pl-10 text-center text-[11px] font-bold leading-tight text-slate-700">
              <span className="flex-1">قيمة البيع الفعلية</span>
              <span className="flex-1">القيمة التقديرية للمركبات المبيعة</span>
            </div>

            {allDisplayedEstimatedValue !== undefined &&
              allDisplayedEstimatedValue > estimatedValue && (
                <div className="mt-1 text-center text-[10.5px] font-semibold text-slate-500">
                  تقديرية إجمالي المعروضة:{' '}
                  <span dir="ltr" className="font-mono-num font-bold text-[#0A2C52]">
                    {formatAED(allDisplayedEstimatedValue)}
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface DonutSegment {
  label: string;
  detailLine?: string;
  value: number;
  color: string;
  sublabel?: string;
  iconType?: 'check' | 'cross' | 'square';
}

interface DonutChartCardProps {
  title: string;
  centerPrimary: string;
  centerSecondary: string;
  segments: DonutSegment[];
  formatValue?: (v: number) => string;
  headerIcon?: React.ReactNode;
  headerAccentImg?: string;
  headerAccentAlt?: string;
  darkHeader?: boolean;
  bannerImg?: string;
  bannerAlt?: string;
  bannerObjectPosition?: string;
}

export const DonutChartCard: React.FC<DonutChartCardProps> = ({
  title,
  centerPrimary,
  centerSecondary,
  segments,
  formatValue = (v) => formatAED(v),
  headerIcon,
  headerAccentImg,
  headerAccentAlt = '',
  darkHeader = false,
  bannerImg,
  bannerAlt,
  bannerObjectPosition,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [accentFailed, setAccentFailed] = useState(false);

  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  // Larger inner clear hole (r=51 inside 140x140 viewBox) prevents AED text touching ring
  const radius = 51;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="saaed-card @container flex h-full min-w-0 flex-col overflow-hidden rounded-xl print-avoid-break">
      {darkHeader ? (
        <div className="saaed-card-header flex items-center justify-between gap-2 px-3.5 py-2.5 text-white">
          <div className="flex min-w-0 items-center gap-2">
            {headerIcon}
            <h3 className="truncate text-sm font-extrabold tracking-tight">{title}</h3>
          </div>
        </div>
      ) : (
        <div className="mx-3.5 mt-3.5 mb-2 flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
          <div className="flex min-w-0 items-center gap-2">
            {headerIcon}
            <h3 className="truncate text-sm font-extrabold text-[#0A2C52]">{title}</h3>
          </div>
          {headerAccentImg && !accentFailed && (
            <img
              src={headerAccentImg}
              alt={headerAccentAlt}
              referrerPolicy="no-referrer"
              onError={() => setAccentFailed(true)}
              className="h-7 w-auto shrink-0 select-none object-contain mix-blend-multiply"
            />
          )}
        </div>
      )}

      <CardBannerStrip
        src={bannerImg}
        alt={bannerAlt}
        objectPosition={bannerObjectPosition}
      />

      {/* Container-query responsive body: switches cleanly to side-by-side at >= 285px, zero truncation */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-3.5 @[285px]:flex-row">
        {/* Legend (in RTL, first item renders on the right cleanly) */}
        <div className="w-full min-w-0 flex-1 space-y-2">
          {segments.map((seg, idx) => {
            const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0.0';
            return (
              <div
                key={seg.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-xs transition ${
                  hoveredIdx === idx ? 'bg-blue-50/90' : ''
                }`}
              >
                <div className="flex min-w-0 items-start gap-1.5">
                  <div className="mt-0.5 shrink-0">
                    {seg.iconType === 'check' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : seg.iconType === 'cross' ? (
                      <XCircle className="h-4 w-4 text-[#C8232C]" />
                    ) : (
                      <span
                        className="mt-0.5 block h-3 w-3 rounded-xs"
                        style={{ backgroundColor: seg.color }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <div className="font-bold text-slate-800">{seg.label}</div>
                    {seg.detailLine && (
                      <div dir="ltr" className="font-mono-num mt-0.5 text-[11px] font-bold text-slate-500">
                        {seg.detailLine}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-left">
                  <div
                    dir="ltr"
                    className="font-mono-num whitespace-nowrap text-[11.5px] font-extrabold text-[#0A2C52]"
                  >
                    {seg.sublabel || `${pct}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SVG Donut */}
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center @[340px]:h-40 @[340px]:w-40">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="16"
            />
            {total > 0 &&
              segments.map((seg, idx) => {
                const val = Math.max(0, seg.value);
                if (val === 0) return null;
                const dashLen = (val / total) * circumference;
                const offset = -cumulativeOffset;
                cumulativeOffset += dashLen;
                const isHovered = hoveredIdx === idx;
                return (
                  <circle
                    key={seg.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered ? 19 : 16}
                    strokeDasharray={`${Math.max(0, dashLen - 1)} ${circumference}`}
                    strokeDashoffset={offset}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span
              dir="ltr"
              className="font-mono-num text-[12px] font-extrabold leading-tight text-[#0A2C52]"
            >
              {hoveredIdx !== null && segments[hoveredIdx]
                ? formatValue(segments[hoveredIdx].value)
                : centerPrimary}
            </span>
            <span className="mt-0.5 text-[9.5px] font-bold leading-tight text-slate-500">
              {hoveredIdx !== null && segments[hoveredIdx]
                ? segments[hoveredIdx].label
                : centerSecondary}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MonthlyTrendChartProps {
  data: MonthlyTrendPoint[];
  year: number;
  showAnnualSummary?: boolean;
  annualServiceFees?: number;
  periodSummaryNote?: string;
  sideImageSrc?: string;
  sideImageAlt?: string;
  headerThumbSrc?: string;
  headerThumbAlt?: string;
  showCalendarBadge?: boolean;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  data,
  year,
  showAnnualSummary = false,
  annualServiceFees,
  periodSummaryNote,
  sideImageSrc,
  sideImageAlt = 'ساحة مزادات المركبات الفاخرة',
  headerThumbSrc,
  headerThumbAlt = 'ساحة مزادات المركبات',
  showCalendarBadge = false,
}) => {
  const [hoverMonth, setHoverMonth] = useState<MonthlyTrendPoint | null>(null);
  const [sideImgFailed, setSideImgFailed] = useState(false);
  const [headerThumbFailed, setHeaderThumbFailed] = useState(false);
  const gradId = useId().replace(/:/g, '');

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.estimatedValue, d.saleValue, d.collectedAmount)),
    1
  );
  const hasAnyData = data.some(
    (d) => d.estimatedValue > 0 || d.saleValue > 0 || d.collectedAmount > 0
  );

  const totalYearSale = data.reduce((s, d) => s + d.saleValue, 0);
  const totalYearCollected = data.reduce((s, d) => s + d.collectedAmount, 0);
  const totalYearEstimated = data.reduce((s, d) => s + d.estimatedValue, 0);

  const width = 880;
  const height = 228;
  const padLeft = 52;
  const padRight = 24;
  const padTop = 18;
  const padBottom = 34;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const xForIdx = (idx: number) =>
    padLeft + (idx / Math.max(1, data.length - 1)) * innerW;
  const yForVal = (val: number) =>
    padTop + innerH - (val / maxVal) * innerH;

  const buildPath = (getter: (d: MonthlyTrendPoint) => number) =>
    data
      .map(
        (d, i) =>
          `${i === 0 ? 'M' : 'L'} ${xForIdx(i).toFixed(1)} ${yForVal(getter(d)).toFixed(1)}`
      )
      .join(' ');

  const buildAreaPath = (getter: (d: MonthlyTrendPoint) => number) => {
    if (data.length === 0) return '';
    const line = buildPath(getter);
    const lastX = xForIdx(data.length - 1).toFixed(1);
    const firstX = xForIdx(0).toFixed(1);
    const baseY = (padTop + innerH).toFixed(1);
    return `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const hasSideImage = Boolean(sideImageSrc && !sideImgFailed);

  return (
    <div className="saaed-card overflow-hidden rounded-xl print-avoid-break">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-linear-to-l from-[#f8fbff] to-[#e7f1fc] px-4 py-3">
        <div className="flex items-center gap-2.5">
          {headerThumbSrc && !headerThumbFailed && (
            <div className="hidden h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-blue-200/80 bg-white shadow-2xs sm:block">
              <img
                src={headerThumbSrc}
                alt={headerThumbAlt}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setHeaderThumbFailed(true)}
                className="pointer-events-none h-full w-full object-cover object-center select-none"
              />
            </div>
          )}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B4F93] text-white shadow-2xs">
            {showCalendarBadge ? (
              <CalendarDays className="h-4.5 w-4.5" />
            ) : (
              <TrendingUp className="h-4.5 w-4.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              {showCalendarBadge && (
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#0B4F93]" aria-hidden="true" />
              )}
              <h3 className="text-sm font-extrabold text-[#0A2C52]">
                اتجاه المبيعات والتحصيلات الشهرية – سنة {year}
              </h3>
            </div>
            <p className="text-[11px] font-medium text-slate-600">
              مقارنة الأداء الشهري التراكمي للقيمة التقديرية وإجمالي البيع والمبالغ المحصلة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0B55A1]" />
            القيمة التقديرية
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" />
            قيمة البيع الفعلية
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
            المبالغ المحصلة
          </span>
        </div>
      </div>

      {/* Interactive Hover Bar */}
      {hoverMonth && (
        <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/85 px-3 py-1.5 text-xs">
          <span className="font-extrabold text-[#0A2C52]">
            {hoverMonth.monthName} {year} ({hoverMonth.soldCount} مبيعة / {hoverMonth.vehicleCount}{' '}
            معروضة)
          </span>
          <div className="font-mono-num flex flex-wrap gap-4 font-bold">
            <span className="text-[#0B55A1]">التقديرية: {formatAED(hoverMonth.estimatedValue)}</span>
            <span className="text-[#C8232C]">البيع: {formatAED(hoverMonth.saleValue)}</span>
            <span className="text-emerald-700">المحصل: {formatAED(hoverMonth.collectedAmount)}</span>
          </div>
        </div>
      )}

      {/* Body Grid: Annual Summary (right in RTL) + SVG Line Chart (center) + Luxury Coupe Panel (left in RTL, zero chart overlap) */}
      <div
        className={
          showAnnualSummary
            ? 'grid grid-cols-1 items-stretch gap-3 p-4 lg:grid-cols-12'
            : 'p-4'
        }
      >
        {showAnnualSummary && (
          <div className="flex flex-col justify-between rounded-xl border border-[#d4e3f3] bg-[#f4f8fd] p-3 lg:col-span-3">
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#dbe7f5] pb-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0A2C52]">
                <CalendarRange className="h-4 w-4 text-[#0B4F93]" />
                <span>إجمالي عام {year}</span>
              </div>
              {periodSummaryNote && (
                <span className="text-[10.5px] font-bold text-[#0B4F93]">
                  ({periodSummaryNote})
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e2ecf7] bg-white px-2.5 py-2 text-xs">
                <span className="font-bold text-slate-700">إجمالي قيمة البيع</span>
                <span
                  dir="ltr"
                  className="font-mono-num whitespace-nowrap text-[12.5px] font-extrabold text-[#C8232C]"
                >
                  {formatAED(totalYearSale)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e2ecf7] bg-white px-2.5 py-2 text-xs">
                <span className="font-bold text-slate-700">إجمالي المبالغ المحصلة</span>
                <span
                  dir="ltr"
                  className="font-mono-num whitespace-nowrap text-[12.5px] font-extrabold text-[#057A55]"
                >
                  {formatAED(totalYearCollected)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e2ecf7] bg-white px-2.5 py-2 text-xs">
                <span className="font-bold text-slate-700">إجمالي القيمة التقديرية</span>
                <span
                  dir="ltr"
                  className="font-mono-num whitespace-nowrap text-[12.5px] font-extrabold text-[#0B4F93]"
                >
                  {formatAED(totalYearEstimated)}
                </span>
              </div>

              {annualServiceFees !== undefined && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e2ecf7] bg-white px-2.5 py-2 text-xs">
                  <span className="font-bold text-slate-700">إجمالي رسوم الخدمات</span>
                  <span
                    dir="ltr"
                    className="font-mono-num whitespace-nowrap text-[12.5px] font-extrabold text-[#6D28D9]"
                  >
                    {formatAED(annualServiceFees)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className={
            showAnnualSummary
              ? hasSideImage
                ? 'min-w-0 lg:col-span-9 xl:col-span-7'
                : 'min-w-0 lg:col-span-9'
              : 'w-full'
          }
        >
          {!hasAnyData ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center text-xs font-semibold text-slate-500">
              لا توجد بيانات شهرية مسجلة لسنة {year} حتى الآن. ستظهر منحنيات المبيعات والتحصيلات تلقائياً فور إدراج المزادات والمركبات.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full min-w-[580px]">
                <defs>
                  <linearGradient id={`areaSale-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
                    <stop offset="65%" stopColor="#93C5FD" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id={`areaEst-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B55A1" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#0B55A1" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r) => {
                  const y = padTop + innerH * (1 - r);
                  const labelVal = maxVal * r;
                  const label =
                    labelVal === 0
                      ? '0'
                      : labelVal >= 1_000_000
                        ? `${(labelVal / 1_000_000).toFixed(1)}M`
                        : labelVal >= 1_000
                          ? `${Math.round(labelVal / 1_000)}K`
                          : String(Math.round(labelVal));
                  return (
                    <g key={r}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={width - padRight}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-semibold"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Soft area shading under curves */}
                <path d={buildAreaPath((d) => d.saleValue)} fill={`url(#areaSale-${gradId})`} />
                <path d={buildAreaPath((d) => d.estimatedValue)} fill={`url(#areaEst-${gradId})`} />

                {/* Hover vertical guide line */}
                {hoverMonth && (
                  <line
                    x1={xForIdx(data.findIndex((m) => m.month === hoverMonth.month))}
                    y1={padTop}
                    x2={xForIdx(data.findIndex((m) => m.month === hoverMonth.month))}
                    y2={padTop + innerH}
                    stroke="#94A3B8"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Trend Lines */}
                <path
                  d={buildPath((d) => d.estimatedValue)}
                  fill="none"
                  stroke="#0B55A1"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path
                  d={buildPath((d) => d.saleValue)}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                />
                <path
                  d={buildPath((d) => d.collectedAmount)}
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />

                {/* Data points & Month labels */}
                {data.map((d, idx) => {
                  const x = xForIdx(idx);
                  const isHovered = hoverMonth?.month === d.month;
                  return (
                    <g
                      key={d.month}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverMonth(d)}
                      onMouseLeave={() => setHoverMonth(null)}
                    >
                      <rect
                        x={x - 24}
                        y={padTop}
                        width="48"
                        height={innerH + 22}
                        fill="transparent"
                      />
                      <circle
                        cx={x}
                        cy={yForVal(d.estimatedValue)}
                        r={isHovered ? 5 : 3.6}
                        fill="#0B55A1"
                        stroke="#FFFFFF"
                        strokeWidth="1.4"
                      />
                      <circle
                        cx={x}
                        cy={yForVal(d.saleValue)}
                        r={isHovered ? 5.5 : 4.2}
                        fill="#DC2626"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={x}
                        cy={yForVal(d.collectedAmount)}
                        r={isHovered ? 5 : 3.6}
                        fill="#16A34A"
                        stroke="#FFFFFF"
                        strokeWidth="1.4"
                      />
                      <text
                        x={x}
                        y={height - 10}
                        textAnchor="middle"
                        className={`text-[11px] font-bold ${
                          isHovered ? 'fill-[#0B4F93]' : 'fill-slate-600'
                        }`}
                      >
                        {d.monthName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Dedicated Left Visual Column (never overlaps SVG Y-axis or data) */}
        {showAnnualSummary && hasSideImage && (
          <div className="relative hidden overflow-hidden rounded-xl border border-[#dce8f5] bg-[#eef5fc] xl:col-span-2 xl:block">
            <img
              src={sideImageSrc}
              alt={sideImageAlt}
              referrerPolicy="no-referrer"
              onError={() => setSideImgFailed(true)}
              className="h-full min-h-[208px] w-full object-cover object-left select-none"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-[#f4f8fd] via-[#f4f8fd]/50 to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-[#f4f8fd]/70 to-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
};
