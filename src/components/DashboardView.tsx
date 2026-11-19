import React, { useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Car,
  CheckCircle2,
  Coins,
  Layers,
  Lightbulb,
  Plus,
  Settings,
  Tag,
  Target,
  TrendingUp,
  Trophy,
  Upload,
} from 'lucide-react';
import cardBannerEvalGavel from '../assets/images/card_banner_eval_gavel_1794558082057.jpg';
import cardBannerFinanceCoins from '../assets/images/card_banner_finance_coins_1794558085623.jpg';
import cardBannerServicesFleet from '../assets/images/card_banner_services_fleet_1794558087197.jpg';
import cardBannerTopLuxury from '../assets/images/card_banner_top_luxury_1794558084230.jpg';
import cardBannerTrendCoupe from '../assets/images/card_banner_trend_coupe_1794558083188.jpg';
import cardBannerVehicleRows from '../assets/images/card_banner_vehicle_rows_1794558081302.jpg';
import saaedFacilityBanner from '../assets/images/saaed_executive_banner_panoramic.jpg';
import {
  ComputedFinancialMetrics,
  FilterState,
  MonthlyTrendPoint,
  TabId,
  Vehicle,
} from '../types';
import { formatAED, formatNumber, formatPercent, getMonthLabel } from '../utils/uaeDate';
import { DonutChartCard, EstimatedVsActualBarChart, MonthlyTrendChart } from './Charts';
import { KpiCardsRow } from './KpiCardsRow';

interface DashboardViewProps {
  metrics: ComputedFinancialMetrics;
  monthlyTrend: MonthlyTrendPoint[];
  filter: FilterState;
  canEdit: boolean;
  onNavigateTab: (tab: TabId) => void;
  onAddAuction: () => void;
  onAddVehicle: () => void;
  onOpenImport: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  monthlyTrend,
  filter,
  canEdit,
  onNavigateTab,
  onAddAuction,
  onAddVehicle,
  onOpenImport,
  onEditVehicle,
}) => {
  const [facilityBannerFailed, setFacilityBannerFailed] = useState(false);
  const [topLuxuryBannerFailed, setTopLuxuryBannerFailed] = useState(false);

  const soldPct =
    metrics.displayedCount > 0
      ? ((metrics.soldCount / metrics.displayedCount) * 100).toFixed(2)
      : '0.00';
  const unsoldPct =
    metrics.displayedCount > 0
      ? (((metrics.unsoldCount + metrics.pendingCount) / metrics.displayedCount) * 100).toFixed(2)
      : '0.00';

  const kpiRows = [
    {
      label: 'نسبة نجاح البيع',
      value: formatPercent(metrics.saleSuccessRate, 2),
      icon: BarChart3,
      iconBg: 'bg-blue-50 text-[#0B4F93]',
      color: 'text-[#0B4F93]',
    },
    {
      label: 'متوسط سعر البيع',
      value: metrics.avgSalePrice !== null ? formatAED(metrics.avgSalePrice) : '—',
      icon: Coins,
      iconBg: 'bg-amber-50 text-amber-600',
      color: 'text-[#057A55]',
    },
    {
      label: 'متوسط القيمة التقديرية',
      value: metrics.avgEstimatedValue !== null ? formatAED(metrics.avgEstimatedValue) : '—',
      icon: Tag,
      iconBg: 'bg-sky-50 text-[#0B55A1]',
      color: 'text-[#0B4F93]',
    },
    {
      label: 'فرق البيع عن التقدير (المبيعة)',
      value: metrics.soldCount > 0 ? formatAED(metrics.varianceAmount) : '—',
      icon: TrendingUp,
      iconBg: metrics.varianceAmount >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-[#C8232C]',
      color: metrics.varianceAmount >= 0 ? 'text-[#057A55]' : 'text-[#C8232C]',
    },
    {
      label: 'نسبة التحصيل المالي',
      value: formatPercent(metrics.collectionRate, 2),
      icon: Target,
      iconBg: 'bg-indigo-50 text-[#0A2C52]',
      color: 'text-[#0A2C52]',
    },
    {
      label: 'إجمالي رسوم الخدمات',
      value: formatAED(metrics.totalServiceFees),
      icon: Layers,
      iconBg: 'bg-blue-50 text-[#0B4F93]',
      color: 'text-[#0B4F93]',
    },
  ];

  const periodSummaryNote =
    filter.month === 'all' ? 'كامل السنة' : `حتى ${getMonthLabel(filter.month)}`;

  return (
    <div className="space-y-3.5 p-3 sm:p-4">
      {/* Mandatory 11 Financial KPI Cards Row */}
      <KpiCardsRow metrics={metrics} onNavigateTab={onNavigateTab} />

      {/* Empty State Onboarding Strip when no vehicles exist in selected period */}
      {metrics.displayedCount === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#bfd5ec] bg-white px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6f0fb] text-[#0B4F93]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#0A2C52]">
                لا توجد بيانات مزادات مسجلة لهذه الفترة حتى الآن
              </div>
              <div className="text-xs text-slate-600">
                يعرض النظام البيانات الفعلية فقط دون أرقام افتراضية. ابدأ بإضافة مزاد ومركبات أو استيراد ملف Excel / CSV أو تفعيل البيئة التجريبية من الإعدادات.
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onAddAuction}
                className="flex items-center gap-1.5 rounded-lg bg-[#0B4F93] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#083c72]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إنشاء مزاد جديد</span>
              </button>
              <button
                type="button"
                onClick={onAddVehicle}
                className="flex items-center gap-1.5 rounded-lg bg-[#C8232C] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#a81b23]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة مركبة</span>
              </button>
              <button
                type="button"
                onClick={onOpenImport}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100"
              >
                <Upload className="h-3.5 w-3.5 text-[#0B4F93]" />
                <span>رفع ملف Excel / CSV</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analytical Row 1: 4 Proportional Cards with Dark Navy Headers & Panoramic Banners */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-[2.7fr_3.6fr_2.6fr_3.1fr]">
        {/* 1. Key Performance Indicators */}
        <div className="saaed-card flex min-w-0 flex-col overflow-hidden rounded-xl">
          <div className="saaed-card-header flex items-center gap-2 px-3.5 py-2.5 text-white">
            <Award className="h-4.5 w-4.5 shrink-0 text-amber-400" />
            <h3 className="truncate text-sm font-extrabold tracking-tight">
              مؤشرات الأداء الرئيسية
            </h3>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-2 p-3.5">
            {kpiRows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#dce8f6] bg-[#edf4fc]/85 px-2.5 py-2.5 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2 font-bold text-slate-700">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${row.iconBg}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="leading-tight">{row.label}</span>
                  </div>
                  <span
                    dir="ltr"
                    className={`font-mono-num shrink-0 whitespace-nowrap text-[13px] font-extrabold ${row.color}`}
                  >
                    {row.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Estimated vs Actual Comparison */}
        <div className="min-w-0">
          <EstimatedVsActualBarChart
            darkHeader
            bannerImg={cardBannerEvalGavel}
            bannerAlt="مقارنة القيمة التقديرية والبيع الفعلي بالمزاد"
            bannerObjectPosition="center 65%"
            estimatedValue={metrics.soldEstimatedValue}
            allDisplayedEstimatedValue={metrics.totalEstimatedValue}
            actualSaleValue={metrics.totalSaleValue}
            variancePercent={metrics.variancePercent}
            headerIcon={<BarChart3 className="h-4.5 w-4.5 shrink-0 text-sky-300" />}
          />
        </div>

        {/* 3. Vehicles Sold vs Unsold Donut */}
        <div className="min-w-0">
          <DonutChartCard
            darkHeader
            bannerImg={cardBannerVehicleRows}
            bannerAlt="ساحة المركبات المعروضة بالمزاد"
            bannerObjectPosition="center 55%"
            title="نسبة المركبات"
            centerPrimary={formatNumber(metrics.displayedCount)}
            centerSecondary="مركبة"
            formatValue={(v) => `${formatNumber(v)} مركبة`}
            headerIcon={<Car className="h-4.5 w-4.5 shrink-0 text-sky-300" />}
            segments={[
              {
                label: 'مبيعة',
                value: metrics.soldCount,
                color: '#0A569E',
                sublabel: `${formatNumber(metrics.soldCount)} (${soldPct}%)`,
                iconType: 'check',
              },
              {
                label: 'غير مبيعة',
                value: metrics.unsoldCount + metrics.pendingCount,
                color: '#DC2626',
                sublabel: `${formatNumber(metrics.unsoldCount + metrics.pendingCount)} (${unsoldPct}%)`,
                iconType: 'cross',
              },
            ]}
          />
        </div>

        {/* 4. Additional Service Revenue Donut */}
        <div className="min-w-0">
          <DonutChartCard
            darkHeader
            bannerImg={cardBannerServicesFleet}
            bannerAlt="خدمات الفوركلفت ونقل المركبات ريكفري ساعد"
            bannerObjectPosition="center 52%"
            title="توزيع إيرادات الخدمات الإضافية"
            centerPrimary={formatAED(metrics.totalServiceFees)}
            centerSecondary="إجمالي الخدمات"
            headerIcon={<Settings className="h-4.5 w-4.5 shrink-0 text-sky-300" />}
            segments={[
              {
                label: 'الفوركلفت',
                value: metrics.totalForkliftFees,
                color: '#0A569E',
                sublabel:
                  metrics.totalServiceFees > 0
                    ? `${((metrics.totalForkliftFees / metrics.totalServiceFees) * 100).toFixed(1)}%`
                    : '0.0%',
              },
              {
                label: 'نقل المركبات (ريكفري)',
                value: metrics.totalRecoveryFees,
                color: '#DC2626',
                sublabel:
                  metrics.totalServiceFees > 0
                    ? `${((metrics.totalRecoveryFees / metrics.totalServiceFees) * 100).toFixed(1)}%`
                    : '0.0%',
              },
              {
                label: 'الرسوم الإدارية',
                value: metrics.totalAdminFees,
                color: '#F59E0B',
                sublabel:
                  metrics.totalServiceFees > 0
                    ? `${((metrics.totalAdminFees / metrics.totalServiceFees) * 100).toFixed(1)}%`
                    : '0.0%',
              },
              {
                label: 'رسوم المنصة',
                value: metrics.totalPlatformFees,
                color: '#10B981',
                sublabel:
                  metrics.totalServiceFees > 0
                    ? `${((metrics.totalPlatformFees / metrics.totalServiceFees) * 100).toFixed(1)}%`
                    : '0.0%',
              },
            ]}
          />
        </div>
      </div>

      {/* Executive Row 2: Executive Analysis + Revenue Split Donut + Top 5 Vehicles */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* 1. Executive Financial Analysis */}
        <div className="saaed-card flex min-w-0 flex-col overflow-hidden rounded-xl lg:col-span-5">
          <div className="saaed-card-header flex items-center justify-between gap-2 px-4 py-2.5 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 shrink-0 text-rose-400" />
              <h3 className="truncate text-sm font-extrabold tracking-tight">
                التحليل المالي التنفيذي للمزاد
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('analysis')}
              className="shrink-0 whitespace-nowrap rounded-lg border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              عرض التحليل الكامل
            </button>
          </div>

          {!facilityBannerFailed && (
            <div className="executive-auction-banner shrink-0">
              <img
                src={saaedFacilityBanner}
                alt="مبنى شركة ساعد وعلم دولة الإمارات ومطرقة المزاد وساحة المركبات"
                referrerPolicy="no-referrer"
                onError={() => setFacilityBannerFailed(true)}
                className="h-full w-full object-cover object-[50%_18%] contrast-[1.03] saturate-[1.04] select-none"
              />
            </div>
          )}

          <div className="flex flex-1 flex-col justify-between bg-linear-to-b from-white via-white to-[#f6fafe] p-4 pt-2">
            <ul className="select-text space-y-2.5 text-xs leading-[1.68] text-slate-800">
              {metrics.executivePoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{pt}</span>
                </li>
              ))}
            </ul>

            {metrics.executiveRecommendations.length > 0 && (
              <div className="mt-3.5 select-text rounded-xl border border-[#bfd8f3] bg-[#edf5fd]/85 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-[#0A2C52]">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>التوصيات التنفيذية</span>
                </div>
                <ul className="space-y-1.5 text-[11.5px] font-semibold leading-relaxed text-slate-700">
                  {metrics.executiveRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B4F93]" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 2. Revenue Split Donut */}
        <div className="min-w-0 lg:col-span-3">
          <DonutChartCard
            darkHeader
            bannerImg={cardBannerFinanceCoins}
            bannerAlt="توزيع المستحقات المالية والعملات"
            bannerObjectPosition="center center"
            title="توزيع المستحقات من المبالغ المحصلة"
            centerPrimary={formatAED(metrics.totalCollected)}
            centerSecondary="إجمالي المحصل"
            headerIcon={<Coins className="h-4.5 w-4.5 shrink-0 text-sky-300" />}
            segments={[
              {
                label: 'حصة ساعد',
                detailLine: `(${metrics.saaedSharePercent.toFixed(2)}%)`,
                value: metrics.saaedShareAmount,
                color: '#0A569E',
                sublabel: formatAED(metrics.saaedShareAmount),
              },
              {
                label: 'حصة الطرف الثالث',
                detailLine: `(${metrics.thirdPartySharePercent.toFixed(2)}%)`,
                value: metrics.thirdPartyShareAmount,
                color: '#EF4444',
                sublabel: formatAED(metrics.thirdPartyShareAmount),
              },
            ]}
          />
        </div>

        {/* 3. Top 5 Highest Priced Vehicles Table */}
        <div className="saaed-card flex min-w-0 flex-col overflow-hidden rounded-xl lg:col-span-4">
          <div className="saaed-card-header flex items-center justify-between gap-2 px-3.5 py-2.5 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <Trophy className="h-4.5 w-4.5 shrink-0 text-amber-400" />
              <h3 className="truncate text-sm font-extrabold tracking-tight">أعلى 5 مركبات سعراً</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('vehicles')}
              className="shrink-0 rounded-md bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white transition hover:bg-white/25"
            >
              سجل المركبات
            </button>
          </div>

          {!topLuxuryBannerFailed && (
            <div className="relative h-24 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-26">
              <img
                src={cardBannerTopLuxury}
                alt="المركبات الفاخرة الأعلى سعراً في المزاد"
                referrerPolicy="no-referrer"
                onError={() => setTopLuxuryBannerFailed(true)}
                className="h-full w-full object-cover object-[center_58%] select-none"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white via-white/55 to-transparent"
              />
            </div>
          )}

          <div className="flex-1 overflow-x-auto p-3.5 pt-2">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#e6eff9] text-[11px] font-extrabold text-[#0A2C52]">
                  <th className="rounded-tr-md px-2 py-2">م</th>
                  <th className="px-2 py-2">نوع المركبة</th>
                  <th className="px-2 py-2">الطراز</th>
                  <th className="px-2 py-2">سنة الصنع</th>
                  <th className="rounded-tl-md px-2 py-2 text-left">سعر البيع (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.top5Vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs font-semibold text-slate-400">
                      لا توجد مركبات مبيعة مسجلة في الفترة المختارة
                    </td>
                  </tr>
                ) : (
                  metrics.top5Vehicles.map((v, idx) => (
                    <tr
                      key={v.id}
                      onClick={() => onEditVehicle(v)}
                      className={`cursor-pointer transition hover:bg-blue-50/80 ${
                        idx % 2 === 1 ? 'bg-[#f7fafe]' : 'bg-white'
                      }`}
                    >
                      <td className="font-mono-num px-2 py-2 font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-2 font-bold text-slate-800">{v.make}</td>
                      <td className="px-2 py-2 font-semibold text-slate-700">{v.model}</td>
                      <td className="font-mono-num px-2 py-2 font-semibold text-slate-600">
                        {v.modelYear}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num px-2 py-2 text-left font-extrabold text-[#0A2C52]"
                      >
                        {formatNumber(v.salePrice)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Sales & Collections Trend Chart + Cumulative Summary + Side Vehicle Visual */}
      <MonthlyTrendChart
        data={monthlyTrend}
        year={filter.year}
        showAnnualSummary
        annualServiceFees={metrics.totalServiceFees}
        periodSummaryNote={periodSummaryNote}
        sideImageSrc={cardBannerTrendCoupe}
        sideImageAlt="مركبة رياضية فاخرة في ساحة المزادات"
      />
    </div>
  );
};
