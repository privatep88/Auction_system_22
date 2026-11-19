import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  Award,
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  CalendarRange,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Database,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  FlaskConical,
  FolderArchive,
  Forklift,
  Gauge,
  Gavel,
  Handshake,
  Hash,
  History,
  Layers,
  Lightbulb,
  Lock,
  Monitor,
  Percent,
  PieChart,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Scale,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  ApprovedReport,
  Auction,
  AuditLog,
  CollectionRecord,
  ComputedFinancialMetrics,
  DemoSeedSummary,
  FilterState,
  MonthlyTrendPoint,
  ServiceFeeRecord,
  ServiceType,
  SystemSettings,
  UserProfile,
  UserRole,
  ValidationTestResult,
  Vehicle,
  WorkspaceMode,
} from '../../types';
import { DEMO_PREVIEW_COUNTS } from '../../utils/demoDataGenerator';
import {
  ARABIC_MONTHS,
  formatAED,
  formatNumber,
  formatPercent,
  formatTimestampForDisplay,
  getMonthLabel,
  getUaeCurrentDate,
} from '../../utils/uaeDate';
import { DonutChartCard, EstimatedVsActualBarChart, MonthlyTrendChart } from '../Charts';
import { FinancialAnalyticsBanner } from '../FinancialAnalyticsBanner';
import { MonthlyAnnualComparisonBanner } from '../MonthlyAnnualComparisonBanner';
import { PlatformServicesBanner } from '../PlatformServicesBanner';
import { ReportsArchiveBanner } from '../ReportsArchiveBanner';
import { RevenueDistributionBanner } from '../RevenueDistributionBanner';
import {
  ConfirmDialog,
  useSmartDialog,
  ValidationIssueItem,
} from '../SmartDialogSystem';
import cardBannerEvalGavelImg from '../../assets/images/card_banner_eval_gavel_1794558082057.jpg';
import cardBannerFinanceCoinsImg from '../../assets/images/card_banner_finance_coins_1794558085623.jpg';
import cardBannerTrendCoupeImg from '../../assets/images/card_banner_trend_coupe_1794558083188.jpg';
import kpiAdminDocsImg from '../../assets/images/kpi_admin_docs_1794565694749.jpg';
import kpiAuctionGavelImg from '../../assets/images/kpi_auction_gavel_1794557321731.jpg';
import kpiCrownVehicleImg from '../../assets/images/kpi_crown_vehicle_1794557319833.jpg';
import kpiGoldCoinsImg from '../../assets/images/kpi_gold_coins_1794557319735.jpg';
import kpiPlatformMonitorImg from '../../assets/images/kpi_platform_monitor_1794565694673.jpg';
import kpiRecoveryTruckImg from '../../assets/images/kpi_recovery_truck_1794557321870.jpg';
import kpiWhiteSuvImg from '../../assets/images/kpi_white_suv_1794557320051.jpg';
import kpiYellowForkliftImg from '../../assets/images/kpi_yellow_forklift_1794557320622.jpg';
import navThumbCoinsImg from '../../assets/images/nav_thumb_coins_1794561905690.jpg';
import navThumbDashboardImg from '../../assets/images/nav_thumb_dashboard_1794563337353.jpg';
import navThumbFinancialImg from '../../assets/images/nav_thumb_financial_1794561904162.jpg';

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  platform: 'رسوم المنصة',
  admin: 'الرسوم الإدارية',
  forklift: 'خدمات الفوركلفت',
  recovery: 'ريكفري ساعد (نقل)',
};

const SERVICE_STATUS_LABELS: Record<
  ServiceFeeRecord['collectionStatus'],
  { label: string; cls: string }
> = {
  collected: { label: 'محصل بالكامل', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partial: { label: 'محصل جزئياً', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  pending: { label: 'قيد التحصيل', cls: 'bg-red-50 text-[#C8232C] border-red-200' },
};

const REPORT_STATUS_LABELS: Record<
  ApprovedReport['status'],
  { label: string; cls: string }
> = {
  draft: { label: 'مسودة', cls: 'border-slate-300 bg-slate-100 text-slate-700' },
  under_review: { label: 'قيد المراجعة', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  approved: { label: 'معتمد (Snapshot)', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  archived: { label: 'مؤرشف نهائياً', cls: 'border-blue-200 bg-blue-50 text-[#0B4F93]' },
};

/* ============================================================================
   TAB 6: توزيع نسب الإيرادات
============================================================================ */
interface RevenueShareViewProps {
  metrics: ComputedFinancialMetrics;
  auctions: Auction[];
  vehicles: Vehicle[];
  collections: CollectionRecord[];
  settings: SystemSettings;
  canEdit: boolean;
  canManageSettings?: boolean;
  isDemoMode?: boolean;
  onEditAuction: (auction: Auction) => void;
  onToggleExcludeServices?: (exclude: boolean) => Promise<void>;
}

export const RevenueShareView: React.FC<RevenueShareViewProps> = ({
  metrics,
  auctions,
  vehicles,
  collections,
  settings,
  canEdit,
  canManageSettings = false,
  isDemoMode = false,
  onEditAuction,
  onToggleExcludeServices,
}) => {
  const { showError, showToast } = useSmartDialog();
  const [toggling, setToggling] = useState(false);
  const [coinsThumbFailed, setCoinsThumbFailed] = useState(false);
  const excludeServices = settings.excludeServicesFromShare !== false;

  const handleToggle = async () => {
    if (!onToggleExcludeServices || !canManageSettings || toggling) return;
    setToggling(true);
    try {
      await onToggleExcludeServices(!excludeServices);
      showToast({
        variant: 'success',
        title: 'تم تحديث قاعدة توزيع الإيرادات',
        description: !excludeServices
          ? 'يتم الآن استثناء رسوم الخدمات والمنصة من توزيع الحصص.'
          : 'تم تضمين رسوم الخدمات في أساس احتساب توزيع الحصص.',
      });
    } catch (err) {
      showError({
        title: 'تعذر تحديث قاعدة التوزيع',
        operationName: 'تحديث قاعدة استثناء الخدمات',
        message: err instanceof Error ? err.message : 'تعذر حفظ تغيير قاعدة التوزيع.',
        onRetry: handleToggle,
      });
    } finally {
      setToggling(false);
    }
  };

  const saaedBarWidth = Math.min(100, Math.max(0, metrics.saaedSharePercent));
  const thirdPartyBarWidth = Math.min(100, Math.max(0, metrics.thirdPartySharePercent));

  return (
    <div className="space-y-4 p-4">
      <div className="saaed-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-[#edf5fd] text-[#0B4F93] shadow-2xs"
          >
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A2C52]">
              توزيع نسب الإيرادات (ساعد / الطرف الثالث)
            </h2>
            <p className="text-xs text-slate-600">
              احتساب حصة شركة ساعد وحصة الطرف الثالث بدقة من المبالغ المحصلة فعلياً لكل مزاد دون ازدواجية
            </p>
          </div>
        </div>
        {isDemoMode && (
          <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold text-amber-900">
            بيانات تجريبية – ليست بيانات مالية فعلية
          </span>
        )}
      </div>

      <RevenueDistributionBanner
        auctionsCount={auctions.length}
        saaedSharePercent={metrics.saaedSharePercent}
        thirdPartySharePercent={metrics.thirdPartySharePercent}
      />

      {/* Share Agreement & Calculation Basis Card */}
      <div className="saaed-card rounded-xl border border-blue-200 bg-[#f6fafe] p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-200/80 bg-white shadow-2xs sm:flex">
              {!coinsThumbFailed ? (
                <img
                  src={kpiGoldCoinsImg}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setCoinsThumbFailed(true)}
                  className="pointer-events-none h-10 w-10 object-contain select-none"
                />
              ) : (
                <Coins className="h-5 w-5 text-amber-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-extrabold text-[#0A2C52]">
                <Handshake className="h-4 w-4 shrink-0 text-[#0B4F93]" />
                <span>اتفاقية وقواعد احتساب توزيع الإيرادات</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/80 bg-white px-2 py-0.5 text-[10.5px] font-bold text-[#0B4F93]">
                  <FileText className="h-3 w-3" />
                  آلية معتمدة
                </span>
              </div>
              <div className="mt-1.5 flex items-start gap-1.5 text-slate-700">
                <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B4F93]" />
                <span>
                  أساس الاحتساب النشط:{' '}
                  <span className="font-extrabold text-[#0B4F93]">
                    {excludeServices
                      ? 'المبالغ المحصلة من بيع المركبات فقط (يتم استثناء رسوم الخدمات والمنصة من التوزيع)'
                      : 'المبالغ المحصلة من بيع المركبات مضافاً إليها رسوم الخدمات'}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                <span>
                  مبيعات المركبات المحصلة:{' '}
                  <strong className="font-mono-num tabular-nums text-slate-700">
                    {formatAED(metrics.vehicleRevenueCollected)}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  حصة ساعد ({metrics.saaedSharePercent.toFixed(2)}%):{' '}
                  <strong className="font-mono-num tabular-nums text-[#0B4F93]">
                    {formatAED(metrics.saaedShareAmount)}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  حصة الطرف الثالث ({metrics.thirdPartySharePercent.toFixed(2)}%):{' '}
                  <strong className="font-mono-num tabular-nums text-[#C8232C]">
                    {formatAED(metrics.thirdPartyShareAmount)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {onToggleExcludeServices && (
            <button
              type="button"
              disabled={!canManageSettings || toggling}
              onClick={handleToggle}
              className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
                excludeServices
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
              } disabled:opacity-60`}
            >
              {excludeServices
                ? '✓ استثناء رسوم الخدمات من التوزيع (الافتراضي)'
                : '• شامل رسوم الخدمات في التوزيع'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-1">
          <div className="flex-1">
            <DonutChartCard
              title="توزيع المستحقات من المحصل"
              headerIcon={<PieChart className="h-4 w-4 shrink-0 text-[#0B4F93]" />}
              headerAccentImg={navThumbCoinsImg}
              headerAccentAlt="مؤشر توزيع الإيرادات"
              centerPrimary={formatAED(metrics.totalCollected)}
              centerSecondary="إجمالي محصل المركبات"
              segments={[
                {
                  label: `حصة ساعد (${metrics.saaedSharePercent.toFixed(2)}%)`,
                  value: metrics.saaedShareAmount,
                  color: '#0A569E',
                  sublabel: formatAED(metrics.saaedShareAmount),
                },
                {
                  label: `حصة الطرف الثالث (${metrics.thirdPartySharePercent.toFixed(2)}%)`,
                  value: metrics.thirdPartyShareAmount,
                  color: '#C8232C',
                  sublabel: formatAED(metrics.thirdPartyShareAmount),
                },
              ]}
            />
          </div>

          {/* Executive Partnership Split Balance Card */}
          <div className="saaed-card rounded-xl border border-slate-200/90 bg-linear-to-b from-white to-[#f6fafe] p-3.5 text-xs">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-extrabold text-[#0A2C52]">
                <Handshake className="h-4 w-4 text-[#0B4F93]" />
                <span>توازن حصص الشراكة المالية</span>
              </div>
              <span className="font-mono-num tabular-nums text-[11px] font-bold text-slate-500">
                100%
              </span>
            </div>

            <div
              aria-hidden="true"
              className="mb-2.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className="h-full bg-[#0A569E] transition-all duration-300"
                style={{ width: `${saaedBarWidth}%` }}
              />
              <div
                className="h-full bg-[#C8232C] transition-all duration-300"
                style={{ width: `${thirdPartyBarWidth}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-blue-200/75 bg-white px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600">
                  <Building2 className="h-3.5 w-3.5 text-[#0B4F93]" />
                  <span>حصة ساعد</span>
                </div>
                <div
                  dir="ltr"
                  className="font-mono-num tabular-nums mt-0.5 text-right text-xs font-extrabold text-[#0B4F93]"
                >
                  {formatAED(metrics.saaedShareAmount)}
                </div>
              </div>

              <div className="rounded-lg border border-red-200/75 bg-white px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-600">
                  <Users className="h-3.5 w-3.5 text-[#C8232C]" />
                  <span>حصة الطرف 3</span>
                </div>
                <div
                  dir="ltr"
                  className="font-mono-num tabular-nums mt-0.5 text-right text-xs font-extrabold text-[#C8232C]"
                >
                  {formatAED(metrics.thirdPartyShareAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="saaed-card overflow-x-auto rounded-xl lg:col-span-2">
          <div className="saaed-card-header flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-[#0A2C52] px-4 py-2.5 text-xs font-extrabold text-white">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 shrink-0 text-sky-300" />
              <span>تفاصيل التوزيع حسب المزاد</span>
            </div>
            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono-num tabular-nums text-[11px] font-bold text-blue-100">
              {formatNumber(auctions.length)} مزاد
            </span>
          </div>
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#e9f1fa] font-extrabold text-[#0A2C52]">
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Gavel className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>المزاد</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-amber-600" />
                    <span>المحصل (AED)</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>نسبة ساعد</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>مستحق ساعد</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-[#C8232C]" />
                    <span>نسبة الطرف 3</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#C8232C]" />
                    <span>مستحق الطرف 3</span>
                  </span>
                </th>
                {canEdit && (
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                      <span>تعديل النسبة</span>
                    </span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {auctions.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="py-8 text-center text-slate-400">
                    لا توجد مزادات مسجلة. تطبق النسبة الافتراضية ({settings.defaultSaaedSharePercent}% /{' '}
                    {settings.defaultThirdPartySharePercent}%).
                  </td>
                </tr>
              ) : (
                auctions.map((a, idx) => {
                  const vehCol = vehicles
                    .filter((v) => v.auctionId === a.id)
                    .reduce((s, v) => s + v.collectedAmount, 0);
                  const unlinkedCol = collections
                    .filter((c) => c.auctionId === a.id && !c.vehicleId && c.collectionType !== 'service_fee')
                    .reduce((s, c) => s + c.amount, 0);
                  const totalCol = vehCol + unlinkedCol;
                  const sAmt = Math.round(totalCol * (a.saaedSharePercent / 100));
                  const tAmt = totalCol - sAmt;

                  return (
                    <tr
                      key={a.id}
                      className={`transition-colors hover:bg-blue-50/55 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f9fe]'
                      }`}
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded border border-blue-200 bg-[#edf5fd] px-1.5 py-0.5 font-mono-num tabular-nums text-[10.5px] font-extrabold text-[#0B4F93]">
                            {a.auctionCode}
                          </span>
                          <span>{a.title}</span>
                        </div>
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums px-3 py-2.5 text-right font-bold text-slate-900"
                      >
                        {formatAED(totalCol)}
                      </td>
                      <td className="font-mono-num tabular-nums px-3 py-2.5 font-bold text-[#0B4F93]">
                        <span className="inline-block rounded border border-blue-200/80 bg-blue-50/70 px-1.5 py-0.5">
                          {a.saaedSharePercent}%
                        </span>
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums px-3 py-2.5 text-right font-extrabold text-[#0B4F93]"
                      >
                        {formatAED(sAmt)}
                      </td>
                      <td className="font-mono-num tabular-nums px-3 py-2.5 font-bold text-[#C8232C]">
                        <span className="inline-block rounded border border-red-200/80 bg-red-50/70 px-1.5 py-0.5">
                          {a.thirdPartySharePercent}%
                        </span>
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums px-3 py-2.5 text-right font-extrabold text-[#C8232C]"
                      >
                        {formatAED(tAmt)}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => onEditAuction(a)}
                            className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0B4F93] transition hover:bg-blue-100"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>تعديل</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   TAB 7: رسوم المنصة والخدمات
============================================================================ */
interface ServicesFeesViewProps {
  metrics: ComputedFinancialMetrics;
  vehicles: Vehicle[];
  serviceRecords?: ServiceFeeRecord[];
  auctions?: Auction[];
  filter?: FilterState;
  canEdit: boolean;
  isDemoMode?: boolean;
  onEditVehicle: (v: Vehicle) => void;
  onAddServiceRecord?: (
    payload: Omit<ServiceFeeRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  onDeleteServiceRecord?: (record: ServiceFeeRecord) => Promise<void>;
}

const SERVICES_PAGE_SIZE = 50;

const SERVICE_TYPE_META: Record<
  ServiceType,
  { icon: React.ComponentType<{ className?: string }>; iconColor: string; badgeCls: string }
> = {
  platform: {
    icon: Monitor,
    iconColor: 'text-teal-700',
    badgeCls: 'border-teal-200 bg-teal-50 text-teal-800',
  },
  admin: {
    icon: FileText,
    iconColor: 'text-amber-700',
    badgeCls: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  forklift: {
    icon: Forklift,
    iconColor: 'text-[#0B4F93]',
    badgeCls: 'border-blue-200 bg-blue-50 text-[#0B4F93]',
  },
  recovery: {
    icon: Truck,
    iconColor: 'text-[#C8232C]',
    badgeCls: 'border-red-200 bg-red-50 text-[#C8232C]',
  },
};

export const ServicesFeesView: React.FC<ServicesFeesViewProps> = ({
  metrics,
  vehicles,
  serviceRecords = [],
  auctions = [],
  filter,
  canEdit,
  isDemoMode = false,
  onEditVehicle,
  onAddServiceRecord,
  onDeleteServiceRecord,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | ServiceType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [failedThumbs, setFailedThumbs] = useState<Record<ServiceType, boolean>>({
    platform: false,
    admin: false,
    forklift: false,
    recovery: false,
  });

  const { showError, showToast, showValidation } = useSmartDialog();
  const uaeNow = getUaeCurrentDate();
  const [newType, setNewType] = useState<ServiceType>('platform');
  const [newAuctionId, setNewAuctionId] = useState(auctions[0]?.id || '');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newAmount, setNewAmount] = useState(200);
  const [newBeneficiary, setNewBeneficiary] = useState('شركة ساعد للأنظمة المرورية');
  const [newRefNo, setNewRefNo] = useState('');
  const [newDate, setNewDate] = useState(uaeNow.isoDate);
  const [submitting, setSubmitting] = useState(false);
  const [serviceFormErrors, setServiceFormErrors] = useState<Record<string, string>>({});

  const amountRef = useRef<HTMLInputElement>(null);
  const beneficiaryRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const auctionMap = useMemo(
    () => new Map(auctions.map((a) => [a.id, a])),
    [auctions]
  );

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return serviceRecords.filter((s) => {
      if (typeFilter !== 'all' && s.serviceType !== typeFilter) return false;
      if (!q) return true;
      return (
        s.serviceCode.toLowerCase().includes(q) ||
        (s.lotNumber || '').toLowerCase().includes(q) ||
        (s.vehicleId || '').toLowerCase().includes(q) ||
        s.referenceNo.toLowerCase().includes(q) ||
        s.beneficiary.toLowerCase().includes(q)
      );
    });
  }, [serviceRecords, typeFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / SERVICES_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () =>
      filteredServices.slice(
        (safePage - 1) * SERVICES_PAGE_SIZE,
        safePage * SERVICES_PAGE_SIZE
      ),
    [filteredServices, safePage]
  );

  const executeAddService = async () => {
    if (!onAddServiceRecord || submitting) return;
    setSubmitting(true);
    try {
      const targetAuction = auctions.find((a) => a.id === newAuctionId) || auctions[0];
      const targetVehicle = vehicles.find((v) => v.id === newVehicleId);
      const yr = targetAuction?.year || filter?.year || uaeNow.year;
      const mo =
        targetAuction?.month ||
        (filter?.month && filter.month !== 'all' ? filter.month : uaeNow.month);
      await onAddServiceRecord({
        serviceCode: `SRV-${Date.now().toString().slice(-6)}`,
        serviceType: newType,
        auctionId: targetAuction?.id || newAuctionId || 'unassigned',
        ...(targetVehicle ? { vehicleId: targetVehicle.id, lotNumber: targetVehicle.lotNumber } : {}),
        serviceDate: newDate,
        amountDue: newAmount,
        collectedAmount: newAmount,
        collectionStatus: 'collected',
        referenceNo: newRefNo.trim() || `REF-${Date.now().toString().slice(-5)}`,
        beneficiary: newBeneficiary.trim() || 'شركة ساعد للأنظمة المرورية',
        year: yr,
        month: mo,
        location: targetVehicle?.location || targetAuction?.location || 'ساحة الحجز – مصفح',
      });
      setShowAddForm(false);
      setNewRefNo('');
      setServiceFormErrors({});
      showToast({
        variant: 'success',
        title: 'تم حفظ رسم الخدمة بنجاح',
        description: `${SERVICE_TYPE_LABELS[newType]} بقيمة ${formatAED(newAmount)}`,
      });
    } catch (err) {
      showError({
        title: 'تعذر حفظ رسم الخدمة',
        operationName: 'إضافة قيد رسم خدمة',
        message: err instanceof Error ? err.message : 'تعذر تسجيل رسم الخدمة في النظام.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: executeAddService,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddServiceRecord || submitting) return;

    const issues: ValidationIssueItem[] = [];
    const nextErrors: Record<string, string> = {};

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      const msg = 'يرجى إدخال مبلغ مالي صحيح أكبر من صفر.';
      nextErrors.newAmount = msg;
      issues.push({ fieldKey: 'newAmount', fieldLabel: 'المبلغ المحصل (AED)', message: msg });
    }
    if (!newBeneficiary.trim()) {
      const msg = 'يرجى إدخال اسم الجهة المستفيدة.';
      nextErrors.newBeneficiary = msg;
      issues.push({ fieldKey: 'newBeneficiary', fieldLabel: 'الجهة المستفيدة', message: msg });
    }
    if (!newDate || Number.isNaN(Date.parse(newDate))) {
      const msg = 'تاريخ العملية غير صالح. يرجى مراجعة التاريخ المدخل.';
      nextErrors.newDate = msg;
      issues.push({ fieldKey: 'newDate', fieldLabel: 'تاريخ الخدمة', message: msg });
    }

    setServiceFormErrors(nextErrors);
    if (issues.length > 0) {
      showValidation({
        dedupeKey: 'validation:service-fee-form',
        title: 'بيانات رسم الخدمة غير مكتملة',
        description: 'يرجى تصحيح الحقول المحددة قبل حفظ رسم الخدمة.',
        issues,
        onReturnToFix: (key) => {
          if (key === 'newAmount') amountRef.current?.focus();
          else if (key === 'newBeneficiary') beneficiaryRef.current?.focus();
          else if (key === 'newDate') dateRef.current?.focus();
        },
      });
      return;
    }

    await executeAddService();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="saaed-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-[#edf5fd] text-[#0B4F93] shadow-2xs"
          >
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A2C52]">
              رسوم المنصة والخدمات الإضافية
            </h2>
            <p className="text-xs text-slate-600">
              تفصيل رسوم المنصة، والرسوم الإدارية بعد البيع، وخدمات الفوركلفت، ونقل المركبات (ريكفري ساعد)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">
              سجلات Demo معزولة
            </span>
          )}
          {canEdit && onAddServiceRecord && (
            <button
              type="button"
              onClick={() => {
                setNewAuctionId(auctions[0]?.id || '');
                setShowAddForm((v) => !v);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#0B4F93] px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-[#083c72]"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddForm ? 'إغلاق النموذج' : 'إضافة رسم خدمة'}</span>
            </button>
          )}
        </div>
      </div>

      {showAddForm && canEdit && onAddServiceRecord && (
        <form
          noValidate
          onSubmit={handleAddSubmit}
          className="saaed-card grid grid-cols-1 gap-3 rounded-xl border border-blue-200 bg-[#f6fafe] p-4 text-xs sm:grid-cols-3 lg:grid-cols-6"
        >
          <div>
            <label className="mb-1 block font-bold text-slate-700">نوع الخدمة</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ServiceType)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-bold"
            >
              {Object.entries(SERVICE_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-bold text-slate-700">المزاد</label>
            <select
              value={newAuctionId}
              onChange={(e) => setNewAuctionId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-bold"
            >
              {auctions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.auctionCode} - {a.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-bold text-slate-700">المركبة (اختياري)</label>
            <select
              value={newVehicleId}
              onChange={(e) => setNewVehicleId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-bold"
            >
              <option value="">قيد خدمة على مستوى المزاد</option>
              {vehicles.slice(0, 100).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.lotNumber} - {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-bold text-slate-700">المبلغ المحصل (AED)</label>
            <input
              ref={amountRef}
              type="number"
              min={1}
              aria-invalid={Boolean(serviceFormErrors.newAmount)}
              value={newAmount}
              onChange={(e) => {
                setNewAmount(Number(e.target.value));
                if (serviceFormErrors.newAmount) {
                  setServiceFormErrors((p) => ({ ...p, newAmount: '' }));
                }
              }}
              className={`font-mono-num w-full rounded-lg border bg-white px-2.5 py-2 font-bold ${
                serviceFormErrors.newAmount ? 'border-[#C8232C]' : 'border-slate-300'
              }`}
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-slate-700">الجهة المستفيدة</label>
            <input
              ref={beneficiaryRef}
              type="text"
              aria-invalid={Boolean(serviceFormErrors.newBeneficiary)}
              value={newBeneficiary}
              onChange={(e) => {
                setNewBeneficiary(e.target.value);
                if (serviceFormErrors.newBeneficiary) {
                  setServiceFormErrors((p) => ({ ...p, newBeneficiary: '' }));
                }
              }}
              className={`w-full rounded-lg border bg-white px-2.5 py-2 font-bold ${
                serviceFormErrors.newBeneficiary ? 'border-[#C8232C]' : 'border-slate-300'
              }`}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block font-bold text-slate-700">التاريخ</label>
              <input
                ref={dateRef}
                type="date"
                aria-invalid={Boolean(serviceFormErrors.newDate)}
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  if (serviceFormErrors.newDate) {
                    setServiceFormErrors((p) => ({ ...p, newDate: '' }));
                  }
                }}
                className={`font-mono-num w-full rounded-lg border bg-white px-2 py-2 font-bold ${
                  serviceFormErrors.newDate ? 'border-[#C8232C]' : 'border-slate-300'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              حفظ
            </button>
          </div>
        </form>
      )}

      <PlatformServicesBanner
        totalServiceFees={metrics.totalServiceFees}
        recordsCount={serviceRecords.length}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2">
          {/* Card 1: Platform Fees */}
          <div className="saaed-kpi-card relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-xl border-t-3 border-t-teal-600 bg-linear-to-bl from-white via-[#f7fefe] to-[#eefaf8] p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700">
                  <Monitor className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug">رسوم المنصة للمركبات المبيعة</span>
              </div>
              <div
                dir="ltr"
                className="font-mono-num tabular-nums mt-2 text-right text-xl font-extrabold text-teal-700"
              >
                {formatAED(metrics.totalPlatformFees)}
              </div>
              <div className="mt-1 text-[10.5px] font-semibold text-teal-800/80">
                إيرادات البنية الرقمية للمزاد
              </div>
            </div>
            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-teal-100 bg-white/95 p-1 shadow-2xs">
              {!failedThumbs.platform ? (
                <img
                  src={kpiPlatformMonitorImg}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedThumbs((p) => ({ ...p, platform: true }))}
                  className="pointer-events-none h-full w-full object-contain mix-blend-multiply select-none"
                />
              ) : (
                <Monitor className="h-7 w-7 text-teal-700" />
              )}
            </div>
          </div>

          {/* Card 2: Admin Fees */}
          <div className="saaed-kpi-card relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-xl border-t-3 border-t-amber-600 bg-linear-to-bl from-white via-[#fffdf7] to-[#fef8e6] p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug">الرسوم الإدارية بعد البيع</span>
              </div>
              <div
                dir="ltr"
                className="font-mono-num tabular-nums mt-2 text-right text-xl font-extrabold text-amber-700"
              >
                {formatAED(metrics.totalAdminFees)}
              </div>
              <div className="mt-1 text-[10.5px] font-semibold text-amber-800/80">
                معالجة المستندات وإجراءات البيع
              </div>
            </div>
            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-white/95 p-1 shadow-2xs">
              {!failedThumbs.admin ? (
                <img
                  src={kpiAdminDocsImg}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedThumbs((p) => ({ ...p, admin: true }))}
                  className="pointer-events-none h-full w-full object-contain mix-blend-multiply select-none"
                />
              ) : (
                <FileText className="h-7 w-7 text-amber-700" />
              )}
            </div>
          </div>

          {/* Card 3: Forklift Fees */}
          <div className="saaed-kpi-card relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-xl border-t-3 border-t-[#0B4F93] bg-linear-to-bl from-white via-[#f7fbff] to-[#ebf4fe] p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-[#0B4F93]">
                  <Forklift className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug">مبالغ خدمات الفوركلفت المحصلة</span>
              </div>
              <div
                dir="ltr"
                className="font-mono-num tabular-nums mt-2 text-right text-xl font-extrabold text-[#0B4F93]"
              >
                {formatAED(metrics.totalForkliftFees)}
              </div>
              <div className="mt-1 text-[10.5px] font-semibold text-[#0B4F93]/80">
                مناولة المركبات بساحة المزاد
              </div>
            </div>
            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white/95 p-1 shadow-2xs">
              {!failedThumbs.forklift ? (
                <img
                  src={kpiYellowForkliftImg}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedThumbs((p) => ({ ...p, forklift: true }))}
                  className="pointer-events-none h-full w-full object-contain mix-blend-multiply select-none"
                />
              ) : (
                <Forklift className="h-7 w-7 text-[#0B4F93]" />
              )}
            </div>
          </div>

          {/* Card 4: Recovery Fees */}
          <div className="saaed-kpi-card relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-xl border-t-3 border-t-[#C8232C] bg-linear-to-bl from-white via-[#fff8f8] to-[#feefef] p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-[#C8232C]">
                  <Truck className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug">نقل المركبات (ريكفري ساعد)</span>
              </div>
              <div
                dir="ltr"
                className="font-mono-num tabular-nums mt-2 text-right text-xl font-extrabold text-[#C8232C]"
              >
                {formatAED(metrics.totalRecoveryFees)}
              </div>
              <div className="mt-1 text-[10.5px] font-semibold text-[#C8232C]/80">
                خدمات السحب والنقل اللوجستي
              </div>
            </div>
            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-white/95 p-1 shadow-2xs">
              {!failedThumbs.recovery ? (
                <img
                  src={kpiRecoveryTruckImg}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedThumbs((p) => ({ ...p, recovery: true }))}
                  className="pointer-events-none h-full w-full object-contain mix-blend-multiply select-none"
                />
              ) : (
                <Truck className="h-7 w-7 text-[#C8232C]" />
              )}
            </div>
          </div>
        </div>

        <DonutChartCard
          title="توزيع إيرادات الخدمات"
          headerIcon={<PieChart className="h-4 w-4 shrink-0 text-[#0B4F93]" />}
          headerAccentImg={navThumbCoinsImg}
          headerAccentAlt="توزيع إيرادات الخدمات"
          centerPrimary={formatAED(metrics.totalServiceFees)}
          centerSecondary="إجمالي الخدمات"
          segments={[
            { label: 'الفوركلفت', value: metrics.totalForkliftFees, color: '#0A569E' },
            { label: 'نقل المركبات (ريكفري)', value: metrics.totalRecoveryFees, color: '#C8232C' },
            { label: 'الرسوم الإدارية', value: metrics.totalAdminFees, color: '#EAB308' },
            { label: 'رسوم المنصة', value: metrics.totalPlatformFees, color: '#0D9488' },
          ]}
        />
      </div>

      {/* Granular ServiceFeeRecords Ledger when records exist */}
      {serviceRecords.length > 0 ? (
        <div className="space-y-3">
          <div className="saaed-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['all', 'الكل', Layers],
                  ['platform', 'المنصة', Monitor],
                  ['admin', 'الإدارية', FileText],
                  ['forklift', 'الفوركلفت', Forklift],
                  ['recovery', 'ريكفري ساعد', Truck],
                ] as const
              ).map(([k, label, IconComp]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setTypeFilter(k);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                    typeFilter === k
                      ? 'bg-[#0A2C52] text-white shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="بحث بكود الخدمة، اللوت، المرجع، المستفيد..."
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs focus:border-[#0B4F93] focus:outline-none"
              />
            </div>
          </div>

          <div className="saaed-card overflow-x-auto rounded-xl">
            <table className="w-full min-w-[980px] text-right text-xs">
              <thead>
                <tr className="bg-[#0A2C52] text-white">
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5 text-sky-300" />
                      <span>رقم الخدمة</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-sky-300" />
                      <span>نوع الخدمة</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Car className="h-3.5 w-3.5 text-sky-300" />
                      <span>المزاد / اللوت</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-sky-300" />
                      <span>التاريخ</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5 text-sky-300" />
                      <span>المستحق</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-emerald-300" />
                      <span>المحصل</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-sky-300" />
                      <span>الحالة</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">المرجع</th>
                  <th className="px-3 py-2.5">الجهة المستفيدة</th>
                  {canEdit && onDeleteServiceRecord && <th className="px-3 py-2.5 text-center">إجراء</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {pageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canEdit && onDeleteServiceRecord ? 10 : 9}
                      className="py-8 text-center text-slate-400"
                    >
                      لا توجد قيود خدمات مطابقة للبحث.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((s, idx) => {
                    const auc = auctionMap.get(s.auctionId);
                    const st = SERVICE_STATUS_LABELS[s.collectionStatus];
                    const typeMeta = SERVICE_TYPE_META[s.serviceType];
                    const TypeIcon = typeMeta.icon;
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors hover:bg-blue-50/55 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f9fe]'
                        }`}
                      >
                        <td className="font-mono-num tabular-nums px-3 py-2.5 font-bold text-[#0B4F93]">
                          {s.serviceCode}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold ${typeMeta.badgeCls}`}
                          >
                            <TypeIcon className={`h-3.5 w-3.5 shrink-0 ${typeMeta.iconColor}`} />
                            <span>{SERVICE_TYPE_LABELS[s.serviceType]}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          <span className="font-mono-num tabular-nums font-bold">{auc?.auctionCode || s.auctionId}</span>
                          {s.lotNumber && (
                            <span className="font-mono-num tabular-nums mr-1.5 text-[11px] text-slate-500">
                              ({s.lotNumber})
                            </span>
                          )}
                        </td>
                        <td dir="ltr" className="font-mono-num tabular-nums px-3 py-2.5 text-right text-slate-600">
                          {s.serviceDate}
                        </td>
                        <td dir="ltr" className="font-mono-num tabular-nums px-3 py-2.5 text-right">
                          {formatAED(s.amountDue)}
                        </td>
                        <td
                          dir="ltr"
                          className="font-mono-num tabular-nums px-3 py-2.5 text-right font-extrabold text-emerald-700"
                        >
                          {formatAED(s.collectedAmount)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${st.cls}`}
                          >
                            {s.collectionStatus === 'collected' ? (
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                            ) : s.collectionStatus === 'partial' ? (
                              <Clock className="h-3 w-3 shrink-0" />
                            ) : (
                              <AlertCircle className="h-3 w-3 shrink-0" />
                            )}
                            <span>{st.label}</span>
                          </span>
                        </td>
                        <td className="font-mono-num tabular-nums px-3 py-2.5 text-[11px] text-slate-600">
                          {s.referenceNo}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-semibold text-slate-700">
                          {s.beneficiary}
                        </td>
                        {canEdit && onDeleteServiceRecord && (
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => onDeleteServiceRecord(s)}
                              title="حذف القيد"
                              className="rounded border border-red-200 p-1 text-[#C8232C] transition hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="saaed-card flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-xs">
              <div className="font-bold text-slate-600">
                إجمالي قيود الخدمات:{' '}
                <span className="font-mono-num tabular-nums text-[#0A2C52]">
                  {formatNumber(filteredServices.length)}
                </span>{' '}
                · صفحة <span className="font-mono-num tabular-nums">{safePage}</span> من{' '}
                <span className="font-mono-num tabular-nums">{totalPages}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>السابق</span>
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <span>التالي</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="saaed-card overflow-x-auto rounded-xl">
          <table className="w-full min-w-[760px] text-right text-xs">
            <thead>
              <tr className="bg-[#0A2C52] text-white">
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5 text-sky-300" />
                    <span>اللوت</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Car className="h-3.5 w-3.5 text-sky-300" />
                    <span>المركبة</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5 text-teal-300" />
                    <span>رسوم المنصة</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-amber-300" />
                    <span>الرسوم الإدارية</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Forklift className="h-3.5 w-3.5 text-sky-300" />
                    <span>الفوركلفت</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-rose-300" />
                    <span>ريكفري ساعد</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-emerald-300" />
                    <span>إجمالي الرسوم</span>
                  </span>
                </th>
                {canEdit && <th className="px-3 py-2.5 text-center">تعديل</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-slate-400">
                    لا توجد بيانات رسوم مسجلة ضمن الفترة المحددة.
                  </td>
                </tr>
              ) : (
                vehicles.slice(0, 50).map((v, idx) => {
                  const total = v.platformFee + v.adminFee + v.forkliftFee + v.recoveryFee;
                  return (
                    <tr
                      key={v.id}
                      className={`transition-colors hover:bg-blue-50/55 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f9fe]'
                      }`}
                    >
                      <td className="font-mono-num tabular-nums px-3 py-2.5 font-bold text-[#0B4F93]">
                        {v.lotNumber}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">
                        {v.make} {v.model}
                      </td>
                      <td dir="ltr" className="font-mono-num tabular-nums px-3 py-2.5 text-right">
                        {formatAED(v.platformFee)}
                      </td>
                      <td dir="ltr" className="font-mono-num tabular-nums px-3 py-2.5 text-right">
                        {formatAED(v.adminFee)}
                      </td>
                      <td dir="ltr" className="font-mono-num tabular-nums px-3 py-2.5 text-right">
                        {formatAED(v.forkliftFee)}
                      </td>
                      <td dir="ltr" className="font-mono-num tabular-nums px-3 py-2.5 text-right">
                        {formatAED(v.recoveryFee)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums px-3 py-2.5 text-right font-extrabold text-[#0A2C52]"
                      >
                        {formatAED(total)}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => onEditVehicle(v)}
                            className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0B4F93] transition hover:bg-blue-100"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>تعديل الرسوم</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   TAB 8: التحليل المالي ومؤشرات الأداء
============================================================================ */
interface FinancialAnalysisViewProps {
  metrics: ComputedFinancialMetrics;
  isDemoMode?: boolean;
}

export const FinancialAnalysisView: React.FC<FinancialAnalysisViewProps> = ({
  metrics,
  isDemoMode = false,
}) => {
  const [failedKpiThumbs, setFailedKpiThumbs] = useState<Record<string, boolean>>({});
  const [analysisBannerFailed, setAnalysisBannerFailed] = useState(false);

  const indicators = [
    {
      key: 'sale-success',
      name: 'نسبة نجاح البيع',
      value: formatPercent(metrics.saleSuccessRate, 2),
      note: 'المركبات المبيعة ÷ إجمالي المركبات المعروضة',
      icon: Award,
      iconBadgeCls: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      borderTopCls: 'border-t-emerald-600',
      valueCls: 'text-emerald-700',
      thumb: kpiWhiteSuvImg,
      thumbMode: 'contain-light' as const,
    },
    {
      key: 'avg-sale',
      name: 'متوسط سعر البيع',
      value: metrics.avgSalePrice !== null ? formatAED(metrics.avgSalePrice) : '—',
      note: 'إجمالي قيمة البيع ÷ عدد المركبات المبيعة',
      icon: Gavel,
      iconBadgeCls: 'border-blue-200 bg-blue-50 text-[#0B4F93]',
      borderTopCls: 'border-t-[#0B4F93]',
      valueCls: 'text-[#0A2C52]',
      thumb: kpiAuctionGavelImg,
      thumbMode: 'contain-light' as const,
    },
    {
      key: 'avg-estimated',
      name: 'متوسط القيمة التقديرية (للمبيعة)',
      value:
        metrics.soldCount > 0
          ? formatAED(Math.round(metrics.soldEstimatedValue / metrics.soldCount))
          : '—',
      note: `متوسط جميع المعروض: ${metrics.avgEstimatedValue !== null ? formatAED(metrics.avgEstimatedValue) : '—'}`,
      icon: Tag,
      iconBadgeCls: 'border-sky-200 bg-sky-50 text-[#0B55A1]',
      borderTopCls: 'border-t-[#0B55A1]',
      valueCls: 'text-[#0A2C52]',
      thumb: kpiCrownVehicleImg,
      thumbMode: 'contain-light' as const,
    },
    {
      key: 'variance-amount',
      name: 'الفرق بين قيمة البيع وتقدير المبيعة',
      value: metrics.soldCount > 0 ? formatAED(metrics.varianceAmount) : '—',
      note: 'إجمالي البيع - القيمة التقديرية للمركبات المبيعة فقط (نفس المجموعة)',
      icon: Scale,
      iconBadgeCls:
        metrics.varianceAmount >= 0
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-[#C8232C]',
      borderTopCls: metrics.varianceAmount >= 0 ? 'border-t-emerald-600' : 'border-t-[#C8232C]',
      valueCls: metrics.varianceAmount >= 0 ? 'text-emerald-700' : 'text-[#C8232C]',
      thumb: navThumbFinancialImg,
      thumbMode: 'cover-dark' as const,
    },
    {
      key: 'variance-percent',
      name: 'نسبة الزيادة عن تقدير المبيعة',
      value: formatPercent(metrics.variancePercent, 2),
      note: 'الفارق ÷ القيمة التقديرية للمركبات المبيعة فقط',
      icon: TrendingUp,
      iconBadgeCls:
        (metrics.variancePercent ?? 0) >= 0
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-[#C8232C]',
      borderTopCls:
        (metrics.variancePercent ?? 0) >= 0 ? 'border-t-emerald-600' : 'border-t-[#C8232C]',
      valueCls: (metrics.variancePercent ?? 0) >= 0 ? 'text-emerald-700' : 'text-[#C8232C]',
      thumb: navThumbDashboardImg,
      thumbMode: 'cover-dark' as const,
    },
    {
      key: 'collection-rate',
      name: 'نسبة التحصيل المالي',
      value: formatPercent(metrics.collectionRate, 2),
      note: 'المبالغ المحصلة من البيع ÷ إجمالي قيمة البيع',
      icon: Gauge,
      iconBadgeCls: 'border-amber-200 bg-amber-50 text-amber-700',
      borderTopCls: 'border-t-amber-500',
      valueCls: 'text-[#0A2C52]',
      thumb: kpiGoldCoinsImg,
      thumbMode: 'contain-light' as const,
    },
    {
      key: 'service-fees',
      name: 'إجمالي رسوم الخدمات',
      value: formatAED(metrics.totalServiceFees),
      note: 'المنصة + الإدارية + الفوركلفت + ريكفري ساعد',
      icon: Layers,
      iconBadgeCls: 'border-teal-200 bg-teal-50 text-teal-700',
      borderTopCls: 'border-t-teal-600',
      valueCls: 'text-teal-700',
      thumb: kpiPlatformMonitorImg,
      thumbMode: 'contain-light' as const,
    },
    {
      key: 'saaed-share',
      name: 'حصة ساعد من المحصل',
      value: formatAED(metrics.saaedShareAmount),
      note: `${metrics.saaedSharePercent.toFixed(2)}% من المبالغ المحصلة`,
      icon: Handshake,
      iconBadgeCls: 'border-blue-200 bg-blue-50 text-[#0B4F93]',
      borderTopCls: 'border-t-[#0A569E]',
      valueCls: 'text-[#0B4F93]',
      thumb: navThumbCoinsImg,
      thumbMode: 'cover-dark' as const,
    },
    {
      key: 'third-party-share',
      name: 'حصة الطرف الثالث من المحصل',
      value: formatAED(metrics.thirdPartyShareAmount),
      note: `${metrics.thirdPartySharePercent.toFixed(2)}% من المبالغ المحصلة`,
      icon: PieChart,
      iconBadgeCls: 'border-red-200 bg-red-50 text-[#C8232C]',
      borderTopCls: 'border-t-[#C8232C]',
      valueCls: 'text-[#C8232C]',
      thumb: kpiAdminDocsImg,
      thumbMode: 'contain-light' as const,
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="saaed-card flex flex-wrap items-center justify-between gap-2 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-[#edf5fd] text-[#0B4F93] shadow-2xs"
          >
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A2C52]">
              التحليل المالي ومؤشرات الأداء (KPIs)
            </h2>
            <p className="text-xs text-slate-600">
              لوحة القياس التحليلية الكاملة المعتمدة على المعادلات المحاسبية الدقيقة للبيانات المسجلة
            </p>
          </div>
        </div>
        {isDemoMode && (
          <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">
            بيانات تجريبية – ليست بيانات مالية فعلية
          </span>
        )}
      </div>

      <FinancialAnalyticsBanner
        saleSuccessRate={metrics.saleSuccessRate}
        collectionRate={metrics.collectionRate}
        variancePercent={metrics.variancePercent}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {indicators.map((ind) => {
          const IconComp = ind.icon;
          const imgFailed = Boolean(failedKpiThumbs[ind.key]);
          return (
            <div
              key={ind.key}
              className={`saaed-kpi-card flex h-full items-center justify-between gap-3 rounded-xl border-t-3 bg-linear-to-bl from-white to-[#f7fbff] p-4 ${ind.borderTopCls}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${ind.iconBadgeCls}`}
                  >
                    <IconComp className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-snug">{ind.name}</span>
                </div>
                <div
                  dir="ltr"
                  className={`font-mono-num tabular-nums mt-2 text-right text-xl font-extrabold ${ind.valueCls}`}
                >
                  {ind.value}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-slate-500">{ind.note}</div>
              </div>

              <div
                className={`flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-2xs ${
                  ind.thumbMode === 'cover-dark'
                    ? 'border border-[#1d549c]/30 bg-[#041838]'
                    : 'border border-slate-200/80 bg-white/95 p-1'
                }`}
              >
                {!imgFailed ? (
                  <img
                    src={ind.thumb}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => setFailedKpiThumbs((prev) => ({ ...prev, [ind.key]: true }))}
                    className={`pointer-events-none select-none ${
                      ind.thumbMode === 'cover-dark'
                        ? 'h-full w-full object-cover object-center'
                        : 'h-full w-full object-contain mix-blend-multiply'
                    }`}
                  />
                ) : (
                  <IconComp
                    className={`h-6 w-6 ${
                      ind.thumbMode === 'cover-dark' ? 'text-sky-300' : 'text-[#0B4F93]'
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EstimatedVsActualBarChart
          darkHeader
          headerIcon={<BarChart3 className="h-4 w-4 text-sky-300" />}
          bannerImg={cardBannerEvalGavelImg}
          bannerAlt="ساحة مزادات المركبات ومقارنة القيمة التقديرية والبيع الفعلي"
          bannerObjectPosition="center 68%"
          estimatedValue={metrics.soldEstimatedValue}
          allDisplayedEstimatedValue={metrics.totalEstimatedValue}
          actualSaleValue={metrics.totalSaleValue}
          variancePercent={metrics.variancePercent}
        />

        <div className="saaed-card flex h-full min-w-0 flex-col overflow-hidden rounded-xl print-avoid-break">
          <div className="saaed-card-header flex items-center justify-between gap-2 px-3.5 py-2.5 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <Award className="h-4 w-4 shrink-0 text-amber-300" />
              <h3 className="truncate text-sm font-extrabold tracking-tight">
                التحليل المالي التنفيذي للمزاد
              </h3>
            </div>
            <span className="shrink-0 rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[10.5px] font-bold text-blue-100">
              ملخص النتائج والتوصيات
            </span>
          </div>

          {!analysisBannerFailed && (
            <div className="relative h-24 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-26">
              <img
                src={cardBannerFinanceCoinsImg}
                alt="مؤشرات التحليل المالي التنفيذي"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setAnalysisBannerFailed(true)}
                className="pointer-events-none h-full w-full object-cover object-center select-none"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white via-white/55 to-transparent"
              />
            </div>
          )}

          <div className="flex flex-1 flex-col justify-between p-4">
            <ul className="space-y-2 text-xs text-slate-700">
              {metrics.executivePoints.map((p, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
            {metrics.executiveRecommendations.length > 0 && (
              <div className="mt-4 rounded-xl border border-blue-200/80 bg-[#edf4fc] p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-[#0A2C52]">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>التوصيات التنفيذية:</span>
                </div>
                <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                  {metrics.executiveRecommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B4F93]" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   TAB 9: المقارنات الشهرية والسنوية
============================================================================ */
interface ComparisonsViewProps {
  monthlyTrend: MonthlyTrendPoint[];
  vehicles: Vehicle[];
  filter: FilterState;
  onSelectPeriod: (year: number, month: number) => void;
}

export const ComparisonsView: React.FC<ComparisonsViewProps> = ({
  monthlyTrend,
  vehicles,
  filter,
  onSelectPeriod,
}) => {
  const [annualHeaderImgFailed, setAnnualHeaderImgFailed] = useState(false);

  const yearsSummary = Array.from(new Set(vehicles.map((v) => v.year)))
    .sort((a, b) => b - a)
    .map((yr) => {
      const yv = vehicles.filter((v) => v.year === yr);
      const sold = yv.filter((v) => v.status === 'sold');
      return {
        year: yr,
        displayed: yv.length,
        sold: sold.length,
        estimated: yv.reduce((s, v) => s + v.estimatedValue, 0),
        sale: sold.reduce((s, v) => s + v.salePrice, 0),
        collected: yv.reduce((s, v) => s + v.collectedAmount, 0),
      };
    });

  const activeMonthsCount = monthlyTrend.filter(
    (m) => m.vehicleCount > 0 || m.saleValue > 0 || m.collectedAmount > 0
  ).length;
  const peakSaleValue = Math.max(...monthlyTrend.map((m) => m.saleValue), 0);

  const totalYearsDisplayed = yearsSummary.reduce((s, ys) => s + ys.displayed, 0);
  const totalYearsSold = yearsSummary.reduce((s, ys) => s + ys.sold, 0);
  const totalYearsSale = yearsSummary.reduce((s, ys) => s + ys.sale, 0);
  const totalYearsCollected = yearsSummary.reduce((s, ys) => s + ys.collected, 0);

  return (
    <div className="space-y-4 p-4">
      <div className="saaed-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-[#edf5fd] text-[#0B4F93] shadow-2xs"
          >
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A2C52]">
              المقارنات الشهرية والسنوية (استقلالية الفترات التاريخية)
            </h2>
            <p className="text-xs text-slate-600">
              كل شهر وسنة يحتفظ ببياناته المستقلة تماماً. اضغط على أي شهر للانتقال المباشر إلى بياناته.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-[#edf5fd] px-3 py-1.5 font-mono-num tabular-nums text-[11px] font-extrabold text-[#0B4F93]">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>سنة العرض: {filter.year}</span>
        </span>
      </div>

      <MonthlyAnnualComparisonBanner
        year={filter.year}
        activeMonthsCount={activeMonthsCount}
        yearsCount={yearsSummary.length}
      />

      <MonthlyTrendChart
        data={monthlyTrend}
        year={filter.year}
        showCalendarBadge
        headerThumbSrc={cardBannerTrendCoupeImg}
        headerThumbAlt="ساحة مزادات المركبات"
      />

      {yearsSummary.length > 0 && (
        <div className="saaed-card overflow-hidden rounded-xl border border-blue-200/80 bg-linear-to-b from-white to-[#f6fafe]">
          <div className="saaed-card-header relative flex flex-wrap items-center justify-between gap-2 overflow-hidden border-b border-slate-200 bg-[#0A2C52] px-4 py-2.5 text-xs font-extrabold text-white">
            {!annualHeaderImgFailed && (
              <img
                src={navThumbFinancialImg}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setAnnualHeaderImgFailed(true)}
                className="pointer-events-none absolute inset-y-0 left-0 h-full w-48 object-cover opacity-25 select-none"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to right, black 35%, transparent 100%)',
                  maskImage: 'linear-gradient(to right, black 35%, transparent 100%)',
                }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <CalendarRange className="h-4 w-4 shrink-0 text-sky-300" />
              <span>ملخص المقارنة السنوية</span>
            </div>
            <span className="relative z-10 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono-num tabular-nums text-[11px] font-bold text-blue-100">
              {formatNumber(yearsSummary.length)} سنوات مقارنة
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 border-b border-blue-100/80 bg-linear-to-l from-[#f8fbff] to-[#eef5fd] p-3 sm:grid-cols-4">
            <div className="rounded-lg border border-blue-200/70 bg-white px-3 py-2 text-xs shadow-2xs">
              <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                <Car className="h-3.5 w-3.5 text-[#0B4F93]" />
                <span>إجمالي المعروض</span>
              </div>
              <div className="font-mono-num tabular-nums mt-0.5 text-sm font-extrabold text-[#0A2C52]">
                {formatNumber(totalYearsDisplayed)}
              </div>
            </div>
            <div className="rounded-lg border border-blue-200/70 bg-white px-3 py-2 text-xs shadow-2xs">
              <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>إجمالي المبيع</span>
              </div>
              <div className="font-mono-num tabular-nums mt-0.5 text-sm font-extrabold text-[#0B4F93]">
                {formatNumber(totalYearsSold)}
              </div>
            </div>
            <div className="rounded-lg border border-red-200/70 bg-white px-3 py-2 text-xs shadow-2xs">
              <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                <Gavel className="h-3.5 w-3.5 text-[#C8232C]" />
                <span>إجمالي قيمة البيع</span>
              </div>
              <div
                dir="ltr"
                className="font-mono-num tabular-nums mt-0.5 text-right text-sm font-extrabold text-[#C8232C]"
              >
                {formatAED(totalYearsSale)}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-200/70 bg-white px-3 py-2 text-xs shadow-2xs">
              <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
                <Coins className="h-3.5 w-3.5 text-emerald-600" />
                <span>إجمالي المحصل</span>
              </div>
              <div
                dir="ltr"
                className="font-mono-num tabular-nums mt-0.5 text-right text-sm font-extrabold text-emerald-700"
              >
                {formatAED(totalYearsCollected)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-right text-xs">
              <thead>
                <tr className="bg-[#e9f1fa] font-extrabold text-[#0A2C52]">
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-[#0B4F93]" />
                      <span>السنة</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-[#0B4F93]" />
                      <span>المعروضة</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>المبيعة</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#0B55A1]" />
                      <span>القيمة التقديرية</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Gavel className="h-3.5 w-3.5 text-[#C8232C]" />
                      <span>إجمالي البيع</span>
                    </span>
                  </th>
                  <th className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-emerald-700" />
                      <span>المحصل</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {yearsSummary.map((ys, idx) => {
                  const isActiveYear = ys.year === filter.year;
                  return (
                    <tr
                      key={ys.year}
                      className={`transition-colors hover:bg-blue-50/55 ${
                        isActiveYear
                          ? 'bg-blue-50/75'
                          : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-[#f5f9fe]'
                      }`}
                    >
                      <td className="font-mono-num tabular-nums px-3 py-2.5 font-extrabold text-[#0A2C52] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{ys.year}</span>
                          {isActiveYear && (
                            <span className="rounded border border-blue-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#0B4F93]">
                              الحالية
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="font-mono-num tabular-nums px-3 py-2.5">
                        {formatNumber(ys.displayed)}
                      </td>
                      <td className="font-mono-num tabular-nums px-3 py-2.5">
                        {formatNumber(ys.sold)}
                      </td>
                      <td dir="ltr" className="font-mono-num tabular-nums px-3 py-2.5 text-right whitespace-nowrap">
                        {formatAED(ys.estimated)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums px-3 py-2.5 text-right font-bold text-[#C8232C] whitespace-nowrap"
                      >
                        {formatAED(ys.sale)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums px-3 py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap"
                      >
                        {formatAED(ys.collected)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="saaed-card overflow-x-auto rounded-xl">
        <div className="saaed-card-header flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-[#0A2C52] px-4 py-2.5 text-xs font-extrabold text-white">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-sky-300" />
            <span>الأداء الشهري التفصيلي لسنة {filter.year}</span>
          </div>
          <span className="text-[11px] font-medium text-blue-100/90">
            اضغط على أي شهر للانتقال لبياناته
          </span>
        </div>
        <table className="w-full min-w-[680px] text-right text-xs">
          <thead>
            <tr className="bg-[#e9f1fa] font-extrabold text-[#0A2C52]">
              <th className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#0B4F93]" />
                  <span>الشهر</span>
                </span>
              </th>
              <th className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-[#0B4F93]" />
                  <span>المعروضة</span>
                </span>
              </th>
              <th className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>المبيعة</span>
                </span>
              </th>
              <th className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#0B55A1]" />
                  <span>القيمة التقديرية</span>
                </span>
              </th>
              <th className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <Gavel className="h-3.5 w-3.5 text-[#C8232C]" />
                  <span>إجمالي البيع</span>
                </span>
              </th>
              <th className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-emerald-700" />
                  <span>المحصل</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {monthlyTrend.map((m, idx) => {
              const isSelectedMonth = filter.month === m.month;
              const isPeakSaleMonth = peakSaleValue > 0 && m.saleValue === peakSaleValue;
              return (
                <tr
                  key={m.month}
                  onClick={() => onSelectPeriod(filter.year, m.month)}
                  className={`cursor-pointer transition hover:bg-blue-50/80 ${
                    isSelectedMonth
                      ? 'bg-blue-50/90 font-bold'
                      : isPeakSaleMonth
                        ? 'bg-emerald-50/45'
                        : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#f5f9fe]'
                  }`}
                >
                  <td className="px-3 py-2.5 font-bold text-[#0B4F93] whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{m.monthName}</span>
                      {isPeakSaleMonth && (
                        <TrendingUp
                          aria-label="أعلى شهر مبيعات"
                          className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                        />
                      )}
                    </span>
                  </td>
                  <td className="font-mono-num tabular-nums px-3 py-2.5">
                    {formatNumber(m.vehicleCount)}
                  </td>
                  <td className="font-mono-num tabular-nums px-3 py-2.5">
                    {formatNumber(m.soldCount)}
                  </td>
                  <td
                    dir="ltr"
                    className="font-mono-num tabular-nums px-3 py-2.5 text-right whitespace-nowrap"
                  >
                    {formatAED(m.estimatedValue)}
                  </td>
                  <td
                    dir="ltr"
                    className="font-mono-num tabular-nums px-3 py-2.5 text-right font-bold text-[#C8232C] whitespace-nowrap"
                  >
                    {formatAED(m.saleValue)}
                  </td>
                  <td
                    dir="ltr"
                    className="font-mono-num tabular-nums px-3 py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap"
                  >
                    {formatAED(m.collectedAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================================
   TAB 10: التقارير المعتمدة والأرشيف
============================================================================ */
interface ArchiveViewProps {
  reports: ApprovedReport[];
  metrics: ComputedFinancialMetrics;
  filter: FilterState;
  canApprove: boolean;
  isDemoMode?: boolean;
  onApproveCurrent: (
    payload: Omit<ApprovedReport, 'id' | 'ownerId' | 'approvedByName' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onArchiveReport: (report: ApprovedReport) => Promise<void>;
  onOpenPrintPreview: () => void;
  onPreviewSnapshot?: (report: ApprovedReport) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  reports,
  metrics,
  filter,
  canApprove,
  isDemoMode = false,
  onApproveCurrent,
  onArchiveReport,
  onOpenPrintPreview,
  onPreviewSnapshot,
}) => {
  const { showConfirm, showError, showSuccess } = useSmartDialog();
  const [saving, setSaving] = useState(false);
  const [headerThumbFailed, setHeaderThumbFailed] = useState(false);

  const approvedCount = reports.filter((r) => r.status === 'approved').length;
  const archivedCount = reports.filter((r) => r.status === 'archived').length;

  const executeCreateSnapshot = async () => {
    setSaving(true);
    const periodText = `${getMonthLabel(filter.month)} ${filter.year}`;
    try {
      await onApproveCurrent({
        title: `تقرير مالي معتمد${isDemoMode ? ' (تجريبي)' : ''} - ${periodText}`,
        periodType: filter.month === 'all' ? 'annual' : 'monthly',
        year: filter.year,
        month: filter.month === 'all' ? 0 : filter.month,
        location: filter.location === 'all' ? 'جميع الساحات' : filter.location,
        totalVehicles: metrics.displayedCount,
        soldVehicles: metrics.soldCount,
        totalEstimated: metrics.totalEstimatedValue,
        soldEstimated: metrics.soldEstimatedValue,
        totalSale: metrics.totalSaleValue,
        totalCollected: metrics.totalCollected,
        outstandingReceivables: metrics.outstandingReceivables,
        saaedShareAmount: metrics.saaedShareAmount,
        thirdPartyShareAmount: metrics.thirdPartyShareAmount,
        totalPlatformFees: metrics.totalPlatformFees,
        totalAdminFees: metrics.totalAdminFees,
        totalForkliftFees: metrics.totalForkliftFees,
        totalRecoveryFees: metrics.totalRecoveryFees,
        totalServices: metrics.totalServiceFees,
        highestVehicleLabel: metrics.highestVehicle
          ? `${metrics.highestVehicle.make} ${metrics.highestVehicle.model}`
          : undefined,
        highestVehiclePrice: metrics.highestVehicle?.salePrice,
        status: 'approved',
      });
      showSuccess({
        title: 'تم حفظ النسخة المعتمدة (Snapshot)',
        message: 'تم اعتماد التقرير المالي وحفظ النسخة الثابتة بنجاح في سجل الأرشيف.',
        details: [
          { label: 'الفترة', value: periodText },
          { label: 'المركبات المبيعة / المعروضة', value: `${formatNumber(metrics.soldCount)} / ${formatNumber(metrics.displayedCount)}`, mono: true },
          { label: 'إجمالي قيمة البيع', value: formatAED(metrics.totalSaleValue), dir: 'ltr', mono: true },
          { label: 'المبالغ المحصلة', value: formatAED(metrics.totalCollected), dir: 'ltr', mono: true },
        ],
      });
    } catch (err) {
      showError({
        title: 'تعذر حفظ نسخة Snapshot',
        operationName: 'اعتماد وحفظ نسخة Snapshot',
        message: err instanceof Error ? err.message : 'تعذر اعتماد وحفظ نسخة التقرير.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: executeCreateSnapshot,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSnapshot = () => {
    if (saving || metrics.displayedCount === 0) return;
    showConfirm({
      dedupeKey: 'confirm:archive-create-snapshot',
      variant: 'approve',
      title: 'تأكيد حفظ نسخة Snapshot',
      message: 'سيتم حفظ نسخة ثابتة من التقرير وفق البيانات الحالية. هل ترغب في المتابعة؟',
      impactNote: 'تبقى أرقام هذه النسخة ثابتة تاريخياً حتى لو تم تعديل سجلات الفترة لاحقاً.',
      details: [
        { label: 'الفترة', value: `${getMonthLabel(filter.month)} ${filter.year}` },
        {
          label: 'الموقع / الساحة',
          value: filter.location === 'all' ? 'جميع الساحات' : filter.location,
        },
        { label: 'إجمالي قيمة البيع', value: formatAED(metrics.totalSaleValue), dir: 'ltr', mono: true },
        { label: 'إجمالي المحصل', value: formatAED(metrics.totalCollected), dir: 'ltr', mono: true },
      ],
      cancelLabel: 'إلغاء',
      confirmLabel: 'تأكيد الحفظ',
      onConfirm: executeCreateSnapshot,
    });
  };

  return (
    <div className="space-y-4 p-4">
      {isDemoMode && (
        <div className="flex items-center justify-between rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span>تقرير تجريبي – غير صالح للاعتماد المالي الرسمي</span>
          </div>
          <span>النسخ المعتمدة هنا محفوظة في بيئة العرض التجريبي فقط (Snapshots ثابتة)</span>
        </div>
      )}

      <div className="saaed-card relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-xl bg-linear-to-l from-white via-[#fafdff] to-[#f1f7fe] p-4">
        <div className="relative z-10 flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-[#edf5fd] text-[#0B4F93] shadow-2xs"
          >
            <FolderArchive className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A2C52]">
              التقارير المعتمدة والأرشيف (Snapshots ثابتة)
            </h2>
            <p className="text-xs text-slate-600">
              حفظ واعتماد نسخ تاريخية ثابتة لا تتغير أرقامها عند تعديل السجلات لاحقاً، مع دعم المسودات والإصدارات
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {canApprove && (
            <button
              type="button"
              disabled={saving || metrics.displayedCount === 0}
              onClick={handleCreateSnapshot}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-800 disabled:opacity-50"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>{saving ? 'جاري الاعتماد...' : 'اعتماد وحفظ Snapshot للفترة الحالية'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenPrintPreview}
            className="flex items-center gap-1.5 rounded-lg bg-[#0B4F93] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#083c72]"
          >
            <Printer className="h-4 w-4" />
            <span>معاينة التقرير الحي A4</span>
          </button>
        </div>
      </div>

      <ReportsArchiveBanner
        reportsCount={reports.length}
        approvedCount={approvedCount}
        archivedCount={archivedCount}
      />

      <div className="saaed-card overflow-hidden rounded-xl">
        <div className="saaed-card-header relative flex flex-wrap items-center justify-between gap-2 overflow-hidden border-b border-slate-200 bg-[#0A2C52] px-4 py-2.5 text-xs font-extrabold text-white">
          {!headerThumbFailed && (
            <img
              src={kpiAdminDocsImg}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setHeaderThumbFailed(true)}
              className="pointer-events-none absolute inset-y-0 left-0 h-full w-40 object-cover opacity-20 select-none"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, black 30%, transparent 100%)',
                maskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
              }}
            />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <Archive className="h-4 w-4 shrink-0 text-sky-300" />
            <span>سجل التقارير المعتمدة والنسخ التاريخية المحفوظة</span>
          </div>
          <span className="relative z-10 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono-num tabular-nums text-[11px] font-bold text-blue-100">
            {formatNumber(reports.length)} نسخة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-right text-xs">
            <thead>
              <tr className="bg-[#e9f1fa] font-extrabold text-[#0A2C52]">
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>عنوان التقرير</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>الإصدار</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>الفترة</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>المركبات (مبيعة/معروضة)</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Gavel className="h-3.5 w-3.5 text-[#C8232C]" />
                    <span>إجمالي البيع</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-emerald-700" />
                    <span>المحصل</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>اعتماد بواسطة</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                    <span>الحالة</span>
                  </span>
                </th>
                <th className="px-3 py-2.5 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    لا توجد تقارير معتمدة في الأرشيف حتى الآن.
                  </td>
                </tr>
              ) : (
                reports.map((r, idx) => {
                  const st = REPORT_STATUS_LABELS[r.status] || REPORT_STATUS_LABELS.approved;
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors hover:bg-blue-50/55 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f9fe]'
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-1.5 max-w-[260px]">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B4F93]" />
                          <div>
                            <div className="font-bold leading-relaxed text-slate-900">{r.title}</div>
                            {r.notes && (
                              <div className="mt-0.5 text-[10px] text-slate-500">{r.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-block rounded border border-blue-200 bg-[#edf5fd] px-2 py-0.5 font-mono-num tabular-nums text-[11px] font-extrabold text-[#0B4F93]">
                          v{r.version || 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                        {r.month === 0 ? `سنوي ${r.year}` : `${ARABIC_MONTHS[r.month - 1]} ${r.year}`}
                      </td>
                      <td className="font-mono-num tabular-nums px-3 py-2.5 font-bold whitespace-nowrap">
                        {formatNumber(r.soldVehicles)} / {formatNumber(r.totalVehicles)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums px-3 py-2.5 text-right font-bold text-[#C8232C] whitespace-nowrap"
                      >
                        {formatAED(r.totalSale)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums px-3 py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap"
                      >
                        {formatAED(r.totalCollected)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">
                        <div>{r.approvedByName}</div>
                        {r.approvedAt && (
                          <div
                            dir="ltr"
                            className="font-mono-num tabular-nums text-right text-[10px] text-slate-400 whitespace-nowrap"
                          >
                            {formatTimestampForDisplay(r.approvedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${st.cls}`}
                        >
                          {r.status === 'approved' ? (
                            <ShieldCheck className="h-3 w-3 shrink-0" />
                          ) : r.status === 'archived' ? (
                            <Archive className="h-3 w-3 shrink-0" />
                          ) : r.status === 'under_review' ? (
                            <Clock className="h-3 w-3 shrink-0" />
                          ) : (
                            <Edit3 className="h-3 w-3 shrink-0" />
                          )}
                          <span>{st.label}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewSnapshot ? onPreviewSnapshot(r) : onOpenPrintPreview()
                            }
                            title="معاينة وطباعة نسخة Snapshot الثابتة A4"
                            className="flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#0B4F93] transition hover:bg-blue-100 whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>معاينة A4</span>
                          </button>
                          {canApprove && r.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => onArchiveReport(r)}
                              title="أرشفة نهائية"
                              className="rounded border border-slate-200 p-1 text-slate-700 transition hover:bg-slate-100"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   TAB 11: الإعدادات والصلاحيات + إدارة Demo Workspace + اختبارات التحقق
============================================================================ */
interface SettingsPermissionsViewProps {
  settings: SystemSettings;
  activeRole: UserRole;
  isCloudMode: boolean;
  canManageSettings: boolean;
  usersList: UserProfile[];
  auditLogs: AuditLog[];
  filter: FilterState;
  workspaceMode?: WorkspaceMode;
  isDemoMode?: boolean;
  isDemoSeeded?: boolean;
  demoSeedSummary?: DemoSeedSummary;
  demoSeedLog?: string[];
  onSaveSettings: (next: Omit<SystemSettings, 'id' | 'ownerId' | 'updatedAt'>) => Promise<void>;
  onChangeRole: (role: UserRole, targetUid?: string) => Promise<void>;
  onClearLocalPeriod: (year: number, month: number | 'all') => void;
  onSwitchWorkspaceMode?: (mode: WorkspaceMode) => void;
  onSeedDemo?: () => Promise<{ ok: boolean; persistedToStorage: boolean; message: string }>;
  onClearDemo?: () => void;
  onRunValidation?: () => ValidationTestResult[];
  onNavigatePeriod?: (year: number, month: number) => void;
}

const ROLE_NAMES: Record<UserRole, string> = {
  admin: 'مدير النظام (صلاحية كاملة)',
  finance: 'الإدارة المالية (إدخال وتعديل واعتماد)',
  auditor: 'مدقق داخلي (مراجعة واعتماد)',
  viewer: 'مستعرض تنفيذي (قراءة وطباعة فقط)',
};

export const SettingsPermissionsView: React.FC<SettingsPermissionsViewProps> = ({
  settings,
  activeRole,
  isCloudMode,
  canManageSettings,
  usersList,
  auditLogs,
  filter,
  workspaceMode = 'production',
  isDemoMode = false,
  isDemoSeeded = false,
  demoSeedSummary,
  demoSeedLog = [],
  onSaveSettings,
  onChangeRole,
  onClearLocalPeriod,
  onSwitchWorkspaceMode,
  onSeedDemo,
  onClearDemo,
  onRunValidation,
  onNavigatePeriod,
}) => {
  const { showError, showSuccess, showToast, showValidation } = useSmartDialog();
  const [saaedPct, setSaaedPct] = useState(settings.defaultSaaedSharePercent);
  const [thirdPct, setThirdPct] = useState(settings.defaultThirdPartySharePercent);
  const [platformFee, setPlatformFee] = useState(settings.defaultPlatformFee);
  const [adminFee, setAdminFee] = useState(settings.defaultAdminFee);
  const [forkliftFee, setForkliftFee] = useState(settings.defaultForkliftFee);
  const [recoveryFee, setRecoveryFee] = useState(settings.defaultRecoveryFee);
  const [excludeServices, setExcludeServices] = useState(
    settings.excludeServicesFromShare !== false
  );
  const [savedBanner, setSavedBanner] = useState(false);

  // Demo seeding & QA validation UI state
  const [confirmSeedOpen, setConfirmSeedOpen] = useState(false);
  const [confirmClearDemoOpen, setConfirmClearDemoOpen] = useState(false);
  const [seedingBusy, setSeedingBusy] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationTestResult[] | null>(null);

  useEffect(() => {
    setSaaedPct(settings.defaultSaaedSharePercent);
    setThirdPct(settings.defaultThirdPartySharePercent);
    setPlatformFee(settings.defaultPlatformFee);
    setAdminFee(settings.defaultAdminFee);
    setForkliftFee(settings.defaultForkliftFee);
    setRecoveryFee(settings.defaultRecoveryFee);
    setExcludeServices(settings.excludeServicesFromShare !== false);
  }, [settings]);

  const executeSaveSettings = async () => {
    try {
      await onSaveSettings({
        defaultSaaedSharePercent: saaedPct,
        defaultThirdPartySharePercent: thirdPct,
        defaultPlatformFee: platformFee,
        defaultAdminFee: adminFee,
        defaultForkliftFee: forkliftFee,
        defaultRecoveryFee: recoveryFee,
        excludeServicesFromShare: excludeServices,
      });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
      showToast({
        variant: 'success',
        title: 'تم حفظ الإعدادات المالية بنجاح',
        description: `توزيع الحصص: ${saaedPct}% ساعد / ${thirdPct}% طرف ثالث`,
      });
    } catch (err) {
      showError({
        title: 'تعذر حفظ الإعدادات المالية',
        operationName: 'تحديث الإعدادات المالية الافتراضية',
        message: err instanceof Error ? err.message : 'تعذر حفظ الإعدادات المالية.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: executeSaveSettings,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const issues: ValidationIssueItem[] = [];

    if (
      !Number.isFinite(saaedPct) ||
      !Number.isFinite(thirdPct) ||
      saaedPct < 0 ||
      thirdPct < 0 ||
      Math.abs(saaedPct + thirdPct - 100) > 0.05
    ) {
      issues.push({
        fieldKey: 'sharePct',
        fieldLabel: 'نسب توزيع الإيرادات',
        message: 'مجموع نسب التوزيع يجب أن يساوي 100% وفق الضوابط المعتمدة.',
      });
    }

    if (
      !Number.isFinite(platformFee) ||
      platformFee < 0 ||
      !Number.isFinite(adminFee) ||
      adminFee < 0 ||
      !Number.isFinite(forkliftFee) ||
      forkliftFee < 0 ||
      !Number.isFinite(recoveryFee) ||
      recoveryFee < 0
    ) {
      issues.push({
        fieldKey: 'defaultFees',
        fieldLabel: 'الرسوم الافتراضية (AED)',
        message: 'يرجى إدخال قيم مالية صحيحة (0 أو أكبر).',
      });
    }

    if (issues.length > 0) {
      showValidation({
        dedupeKey: 'validation:settings-defaults',
        title: 'بيانات الإعدادات غير صالحة',
        description: 'يرجى مراجعة نسب التوزيع والرسوم الافتراضية قبل الحفظ.',
        issues,
      });
      return;
    }

    await executeSaveSettings();
  };

  const handleConfirmSeed = async () => {
    if (!onSeedDemo) return;
    setSeedingBusy(true);
    setSeedFeedback(null);
    try {
      const res = await onSeedDemo();
      setSeedFeedback({ ok: res.ok, text: res.message });
      setConfirmSeedOpen(false);
      if (res.ok) {
        if (onNavigatePeriod) onNavigatePeriod(2026, 11);
        showSuccess({
          title: 'تمت تهيئة بيئة العرض التجريبي (Demo)',
          message: res.message,
        });
      } else {
        showError({
          title: 'تنبيه تهيئة بيانات Demo',
          operationName: 'تهيئة البيئة التجريبية',
          message: res.message,
        });
      }
    } catch (err) {
      showError({
        title: 'تعذر تهيئة البيانات التجريبية',
        operationName: 'تهيئة بيئة Demo',
        message: err instanceof Error ? err.message : 'حدث خطأ أثناء تهيئة بيئة Demo.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
      });
    } finally {
      setSeedingBusy(false);
    }
  };

  const handleConfirmClearDemo = () => {
    if (!onClearDemo) return;
    onClearDemo();
    setConfirmClearDemoOpen(false);
    setValidationResults(null);
    const msg = 'تم حذف بيانات Demo فقط بنجاح مع بقاء بيئة الإنتاج سليمة بالكامل.';
    setSeedFeedback({
      ok: true,
      text: msg,
    });
    showToast({
      variant: 'success',
      title: 'تم حذف بيانات Demo فقط',
      description: msg,
    });
  };

  const handleRunSuite = () => {
    if (!onRunValidation) return;
    const results = onRunValidation();
    setValidationResults(results);
  };

  const passedCount = validationResults ? validationResults.filter((r) => r.passed).length : 0;

  return (
    <div className="space-y-4 p-4">
      <div className="saaed-card rounded-xl p-4">
        <h2 className="text-base font-extrabold text-[#0A2C52]">
          الإعدادات المالية وصلاحيات المستخدمين وبيئة العرض التجريبي
        </h2>
        <p className="text-xs text-slate-600">
          ضبط النسب الافتراضية والرسوم، والتحكم المعزول ببيئة العرض التجريبي (Demo Workspace)، وتشغيل اختبارات التحقق المالي الآلية
        </p>
      </div>

      {/* Demo Workspace Management & 12-Point Automated Validation */}
      <div className="saaed-card space-y-4 rounded-xl border-2 border-[#0B4F93]/30 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[#0B4F93]" />
            <div>
              <h3 className="text-sm font-extrabold text-[#0A2C52]">
                إدارة بيئة العرض التجريبي (Demo Workspace) والبيانات الافتراضية
              </h3>
              <p className="text-[11px] text-slate-600">
                بيئة Demo معزولة تماماً في مساحة مستقلة ولا تكتب أي سجل داخل قاعدة بيانات الإنتاج (Firestore)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg border px-3 py-1.5 font-extrabold ${
                isDemoMode
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800'
              }`}
            >
              الوضع النشط: {isDemoMode ? 'بيئة العرض التجريبي (Demo)' : 'بيئة الإنتاج (Production)'}
            </span>
          </div>
        </div>

        {/* Workspace Switcher & Action Controls */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 font-extrabold text-[#0A2C52]">1. التبديل بين بيئة الإنتاج و Demo</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSwitchWorkspaceMode?.('production')}
                className={`flex-1 rounded-lg border px-3 py-2 font-bold transition ${
                  workspaceMode === 'production'
                    ? 'border-[#0A2C52] bg-[#0A2C52] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                بيئة الإنتاج (Production)
              </button>
              <button
                type="button"
                onClick={() => onSwitchWorkspaceMode?.('demo')}
                className={`flex-1 rounded-lg border px-3 py-2 font-bold transition ${
                  workspaceMode === 'demo'
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                بيئة العرض (Demo)
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              يمكنك العودة إلى بيانات الإنتاج الحقيقية في أي لحظة بضغطة زر دون أي تأثير على سجلات الإنتاج.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 font-extrabold text-[#0A2C52]">2. ملخص بيانات Demo المخزنة حالياً</div>
            {isDemoSeeded && demoSeedSummary ? (
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div>المزادات: <strong className="font-mono-num text-[#0A2C52]">{formatNumber(demoSeedSummary.auctionsCount)}</strong></div>
                <div>مركبات نوفمبر: <strong className="font-mono-num text-[#0B4F93]">{formatNumber(demoSeedSummary.novemberVehiclesCount)}</strong></div>
                <div>مبيعة (نوفمبر): <strong className="font-mono-num text-emerald-700">{formatNumber(demoSeedSummary.novemberSoldCount)}</strong></div>
                <div>غير مبيعة: <strong className="font-mono-num text-[#C8232C]">{formatNumber(demoSeedSummary.novemberUnsoldCount)}</strong></div>
                <div>التحصيلات: <strong className="font-mono-num">{formatNumber(demoSeedSummary.collectionsCount)}</strong></div>
                <div>قيود الخدمات: <strong className="font-mono-num">{formatNumber(demoSeedSummary.servicesCount)}</strong></div>
              </div>
            ) : (
              <div className="rounded border border-dashed border-slate-300 bg-white p-2.5 text-[11px] text-slate-500">
                بيئة Demo فارغة حالياً (لا يتم إدراج البيانات التجريبية تلقائياً عند فتح الصفحة لحماية بيانات الإنتاج).
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 font-extrabold text-[#0A2C52]">3. تهيئة أو حذف بيانات Demo</div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmClearDemoOpen(false);
                  setConfirmSeedOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0B4F93] px-3 py-2 font-bold text-white shadow hover:bg-[#083c72]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>تهيئة البيانات التجريبية (نوفمبر 2026 + فترات تاريخية)</span>
              </button>
              <button
                type="button"
                disabled={!isDemoSeeded}
                onClick={() => {
                  setConfirmSeedOpen(false);
                  setConfirmClearDemoOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-bold text-[#C8232C] hover:bg-red-100 disabled:opacity-45"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>حذف بيانات Demo فقط</span>
              </button>
            </div>
          </div>
        </div>

        {/* Unified Portal ConfirmDialog for Demo Seeding */}
        <ConfirmDialog
          isOpen={confirmSeedOpen}
          onClose={() => setConfirmSeedOpen(false)}
          onConfirm={handleConfirmSeed}
          busy={seedingBusy}
          variant="confirm"
          title="تأكيد تهيئة البيانات التجريبية المعزولة"
          message="سيتم إنشاء سجلات علائقية مترابطة داخل بيئة العرض التجريبي (Demo) فقط."
          impactNote="تُعزل هذه البيانات تماماً عن قاعدة بيانات الإنتاج (Idempotent دون تكرار)."
          confirmLabel="تأكيد التهيئة والانتقال إلى نوفمبر 2026"
          cancelLabel="إلغاء"
        >
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] sm:grid-cols-4">
            <div>• <strong>{DEMO_PREVIEW_COUNTS.novemberAuctions}</strong> مزادات في نوفمبر 2026 + <strong>{DEMO_PREVIEW_COUNTS.historicalAuctions}</strong> تاريخية</div>
            <div>• <strong>{formatNumber(DEMO_PREVIEW_COUNTS.novemberVehicles)}</strong> مركبة (نوفمبر) + <strong>{DEMO_PREVIEW_COUNTS.historicalVehicles}</strong> (سبتمبر/أكتوبر)</div>
            <div>• <strong>{formatNumber(DEMO_PREVIEW_COUNTS.novemberSold)}</strong> مبيعة / <strong>{DEMO_PREVIEW_COUNTS.novemberUnsold}</strong> غير مبيعة</div>
            <div>• إجمالي البيع: <strong className="font-mono-num">{formatAED(DEMO_PREVIEW_COUNTS.novemberTotalSale)}</strong></div>
            <div>• التحصيل الفعلي: <strong className="font-mono-num">{formatAED(DEMO_PREVIEW_COUNTS.novemberTotalCollected)}</strong></div>
            <div>• الرصيد المتبقي: <strong className="font-mono-num">{formatAED(DEMO_PREVIEW_COUNTS.novemberOutstanding)}</strong></div>
            <div>• حصة ساعد (70%): <strong className="font-mono-num">{formatAED(DEMO_PREVIEW_COUNTS.novemberSaaedShare)}</strong></div>
            <div>• إجمالي الخدمات: <strong className="font-mono-num">{formatAED(DEMO_PREVIEW_COUNTS.novemberTotalServices)}</strong></div>
          </div>
        </ConfirmDialog>

        {/* Unified Portal ConfirmDialog for Clearing Demo Only */}
        <ConfirmDialog
          isOpen={confirmClearDemoOpen}
          onClose={() => setConfirmClearDemoOpen(false)}
          onConfirm={handleConfirmClearDemo}
          variant="delete"
          title="تأكيد حذف بيانات Demo فقط؟"
          message="سيتم تفريغ جميع سجلات بيئة العرض التجريبي (Demo) فقط."
          impactNote="لن يتم المساس مطلقاً ببيانات الإنتاج الحقيقية."
          confirmLabel="نعم، حذف بيانات Demo فقط"
          cancelLabel="تراجع"
        />

        {seedFeedback && (
          <div
            className={`rounded-lg border px-3 py-2 font-bold ${
              seedFeedback.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-[#C8232C]'
            }`}
          >
            {seedFeedback.text}
          </div>
        )}

        {demoSeedLog.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
            <div className="mb-1 font-sans text-[11px] font-bold text-slate-300">سجل تنفيذ تهيئة Demo:</div>
            {demoSeedLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        {/* 12-Point Automated Verification & Integration Tests */}
        <div className="border-t border-slate-200 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4.5 w-4.5 text-[#0B4F93]" />
              <div>
                <div className="font-extrabold text-[#0A2C52]">
                  اختبارات التحقق المحاسبي والتكامل الآلية (12 اختباراً فعلياً على البيانات النشطة)
                </div>
                <div className="text-[11px] text-slate-500">
                  تُحسب النتائج لحظياً من السجلات الفعلية؛ إذا عُدل أي سجل يدوياً سيظهر الفارق الحقيقي فوراً دون نتائج وهمية.
                </div>
              </div>
            </div>

            {onRunValidation && (
              <button
                type="button"
                onClick={handleRunSuite}
                className="flex items-center gap-1.5 rounded-lg bg-[#0A2C52] px-4 py-2 font-bold text-white shadow hover:bg-[#123d73]"
              >
                <Play className="h-3.5 w-3.5" />
                <span>تشغيل الاختبارات (12 فحصاً)</span>
              </button>
            )}
          </div>

          {validationResults && (
            <div className="mt-3 space-y-2">
              <div
                className={`flex items-center justify-between rounded-lg border px-3 py-2 font-extrabold ${
                  passedCount === validationResults.length
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-amber-300 bg-amber-50 text-amber-900'
                }`}
              >
                <span>
                  النتيجة الإجمالية للاختبارات: {passedCount} / {validationResults.length} ناجح
                </span>
                {!isDemoMode && (
                  <span className="text-[11px]">
                    تنبيه: الاختبار يجري حالياً على بيانات الإنتاج النشطة — انتقل إلى وضع Demo لفحص أرقام نوفمبر التجريبية
                  </span>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[820px] text-right text-[11px]">
                  <thead>
                    <tr className="bg-[#e9f1fa] font-extrabold text-[#0A2C52]">
                      <th className="px-2.5 py-2">الكود</th>
                      <th className="px-2.5 py-2">بند التحقق</th>
                      <th className="px-2.5 py-2">المتوقع</th>
                      <th className="px-2.5 py-2">الفعلي المحسوب</th>
                      <th className="px-2.5 py-2">الفارق</th>
                      <th className="px-2.5 py-2 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {validationResults.map((t) => (
                      <tr key={t.id} className={t.passed ? 'hover:bg-emerald-50/30' : 'bg-red-50/40'}>
                        <td className="font-mono-num px-2.5 py-2 font-bold text-[#0B4F93]">{t.id}</td>
                        <td className="px-2.5 py-2">
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="text-[10px] text-slate-500">{t.details}</div>
                        </td>
                        <td className="font-mono-num px-2.5 py-2 text-slate-700">{t.expected}</td>
                        <td className="font-mono-num px-2.5 py-2 font-bold text-slate-900">{t.actual}</td>
                        <td dir="ltr" className="font-mono-num px-2.5 py-2 text-right font-bold">
                          {t.diff}
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          {t.passed ? (
                            <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-extrabold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 font-extrabold text-[#C8232C]">
                              <XCircle className="h-3.5 w-3.5" />
                              FAIL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Financial Defaults */}
        <form onSubmit={handleSave} className="saaed-card space-y-3 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-extrabold text-[#0A2C52]">الإعدادات المالية الافتراضية</h3>
            {!canManageSettings && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <Lock className="h-3.5 w-3.5" />
                للقراءة فقط
              </span>
            )}
          </div>

          {savedBanner && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold text-emerald-700">
              تم حفظ الإعدادات المالية بنجاح وتسجيلها في سجل التعديلات.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-slate-700">نسبة شركة ساعد الافتراضية (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                disabled={!canManageSettings}
                value={saaedPct}
                onChange={(e) => {
                  const v = Math.min(100, Math.max(0, Number(e.target.value)));
                  setSaaedPct(v);
                  setThirdPct(Number((100 - v).toFixed(2)));
                }}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">نسبة الطرف الثالث (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                disabled={!canManageSettings}
                value={thirdPct}
                onChange={(e) => {
                  const v = Math.min(100, Math.max(0, Number(e.target.value)));
                  setThirdPct(v);
                  setSaaedPct(Number((100 - v).toFixed(2)));
                }}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">رسوم المنصة الافتراضية (AED)</label>
              <input
                type="number"
                min={0}
                disabled={!canManageSettings}
                value={platformFee}
                onChange={(e) => setPlatformFee(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">الرسوم الإدارية الافتراضية (AED)</label>
              <input
                type="number"
                min={0}
                disabled={!canManageSettings}
                value={adminFee}
                onChange={(e) => setAdminFee(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">رسوم الفوركلفت الافتراضية (AED)</label>
              <input
                type="number"
                min={0}
                disabled={!canManageSettings}
                value={forkliftFee}
                onChange={(e) => setForkliftFee(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">رسوم ريكفري ساعد الافتراضية (AED)</label>
              <input
                type="number"
                min={0}
                disabled={!canManageSettings}
                value={recoveryFee}
                onChange={(e) => setRecoveryFee(Number(e.target.value))}
                className="font-mono-num w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold disabled:bg-slate-100"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <input
              type="checkbox"
              disabled={!canManageSettings}
              checked={excludeServices}
              onChange={(e) => setExcludeServices(e.target.checked)}
              className="h-4 w-4 accent-[#0B4F93]"
            />
            <span className="font-bold text-slate-700">
              استثناء رسوم الخدمات والمنصة عند احتساب توزيع الحصص (70% / 30% على مبيعات المركبات المحصلة فقط)
            </span>
          </label>

          {canManageSettings && (
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-[#0B4F93] px-4 py-2 font-bold text-white shadow hover:bg-[#083c72]"
            >
              <Save className="h-4 w-4" />
              <span>حفظ الإعدادات الافتراضية</span>
            </button>
          )}
        </form>

        {/* RBAC Permissions */}
        <div className="saaed-card space-y-3 rounded-xl p-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <ShieldCheck className="h-4.5 w-4.5 text-[#0B4F93]" />
            <h3 className="text-sm font-extrabold text-[#0A2C52]">صلاحيات المستخدمين (RBAC)</h3>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
            <div className="font-bold text-[#0A2C52]">الصلاحية النشطة حالياً:</div>
            <div className="mt-1 font-extrabold text-[#C8232C]">{ROLE_NAMES[activeRole]}</div>
          </div>

          {!isCloudMode || isDemoMode ? (
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                تبديل الدور الوظيفي في الجلسة المحلية للتحقق من الصلاحيات:
              </label>
              <select
                value={activeRole}
                onChange={(e) => onChangeRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold text-slate-800"
              >
                {Object.entries(ROLE_NAMES).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>

              {!isDemoMode && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onClearLocalPeriod(filter.year, filter.month)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-bold text-[#C8232C] hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>
                      تفريغ بيانات الفترة المحلية ({getMonthLabel(filter.month)} {filter.year})
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-bold text-slate-700">قائمة المستخدمين المسجلين في Firebase:</div>
              <div className="max-h-44 space-y-2 overflow-y-auto">
                {usersList.map((u) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2"
                  >
                    <div>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <UserCheck className="h-3.5 w-3.5 text-[#0B4F93]" />
                        <span>{u.displayName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </div>
                    <select
                      disabled={!canManageSettings}
                      value={u.role}
                      onChange={(e) => onChangeRole(e.target.value as UserRole, u.uid)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold disabled:bg-slate-100"
                    >
                      <option value="admin">مدير النظام</option>
                      <option value="finance">الإدارة المالية</option>
                      <option value="auditor">مدقق داخلي</option>
                      <option value="viewer">مستعرض</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit & Approvals Log */}
      <div className="saaed-card overflow-hidden rounded-xl">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-[#0A2C52] px-4 py-2.5 text-xs font-extrabold text-white">
          <History className="h-4 w-4" />
          <span>سجل التعديلات والاعتمادات ({auditLogs.length})</span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#e9f1fa] font-extrabold text-[#0A2C52]">
                <th className="px-3 py-2">الإجراء</th>
                <th className="px-3 py-2">التفاصيل</th>
                <th className="px-3 py-2">المستخدم</th>
                <th className="px-3 py-2">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    لا توجد حركات مسجلة في سجل التعديلات بعد.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-bold text-[#0B4F93]">{log.action}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{log.summary}</td>
                    <td className="px-3 py-2 text-slate-700">{log.actorName}</td>
                    <td dir="ltr" className="font-mono-num px-3 py-2 text-right text-[11px] text-slate-500">
                      {formatTimestampForDisplay(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
