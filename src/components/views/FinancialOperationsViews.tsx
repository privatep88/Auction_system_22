import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  Award,
  Calculator,
  Calendar,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Coins,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Forklift,
  Gavel,
  Handshake,
  MapPin,
  MinusCircle,
  Monitor,
  Percent,
  PieChart,
  Plus,
  Printer,
  Receipt,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import auctionRegistryBannerImg from '../../assets/images/auction_registry_banner_1794564774677.jpg';
import kpiAuctionGavelImg from '../../assets/images/kpi_auction_gavel_1794557321731.jpg';
import kpiGoldCoinsImg from '../../assets/images/kpi_gold_coins_1794557319735.jpg';
import kpiWhiteSuvImg from '../../assets/images/kpi_white_suv_1794557320051.jpg';
import cardBannerServicesFleetImg from '../../assets/images/card_banner_services_fleet_1794558087197.jpg';
import {
  ApprovedReport,
  Auction,
  AuctionStatus,
  CollectionRecord,
  ComputedFinancialMetrics,
  FilterState,
  ServiceFeeRecord,
  Vehicle,
} from '../../types';
import {
  buildAuctionLookupMap,
  filterAuctionModalVehicles,
  getAuctionLinkedVehicles,
  resolveVehicleAuction,
} from '../../utils/auctionLink';
import { exportVehiclesToXlsx } from '../../utils/excelCsv';
import { ARABIC_MONTHS, formatAED, formatNumber, formatPercent, getMonthLabel } from '../../utils/uaeDate';
import { AuctionFinancialReportBanner } from '../AuctionFinancialReportBanner';
import { AuctionRegistryBanner } from '../AuctionRegistryBanner';
import { FinancialCollectionsBanner } from '../FinancialCollectionsBanner';
import { PaymentDatePickerModal } from '../PaymentDatePickerModal';
import { SaleDatePickerModal } from '../SaleDatePickerModal';
import { SmartFloatingTableScrollbar } from '../SmartFloatingTableScrollbar';
import { useSmartDialog } from '../SmartDialogSystem';
import { VehicleInventoryBanner } from '../VehicleInventoryBanner';

const AUCTION_STATUS_LABELS: Record<AuctionStatus, { label: string; cls: string }> = {
  draft: { label: 'مسودة', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  active: { label: 'نشط', cls: 'bg-blue-50 text-[#0B4F93] border-blue-200' },
  closed: { label: 'مغلق', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  approved: { label: 'معتمد', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

/* ============================================================================
   TAB 2: التقرير المالي للمزاد
============================================================================ */
interface FinancialReportViewProps {
  metrics: ComputedFinancialMetrics;
  filter: FilterState;
  auctions: Auction[];
  canApprove: boolean;
  isDemoMode?: boolean;
  onOpenPrintPreview: () => void;
  onApproveCurrentReport: (
    payload: Omit<ApprovedReport, 'id' | 'ownerId' | 'approvedByName' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
}

export const FinancialReportView: React.FC<FinancialReportViewProps> = ({
  metrics,
  filter,
  auctions,
  canApprove,
  isDemoMode = false,
  onOpenPrintPreview,
  onApproveCurrentReport,
}) => {
  const { showConfirm, showError, showSuccess } = useSmartDialog();
  const [approving, setApproving] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [failedThumbKeys, setFailedThumbKeys] = useState<Record<string, boolean>>({});

  const selectedAuction =
    filter.auctionId !== 'all' ? auctions.find((a) => a.id === filter.auctionId) : undefined;

  const periodLabel = `${getMonthLabel(filter.month)} ${filter.year}`;
  const locationLabel = filter.location === 'all' ? 'جميع الساحات' : filter.location;

  const executeApprove = async () => {
    setApproving(true);
    try {
      const periodType = selectedAuction
        ? 'auction'
        : filter.month === 'all'
          ? 'annual'
          : 'monthly';
      const title = selectedAuction
        ? `التقرير المالي - ${selectedAuction.title} (${selectedAuction.auctionCode})`
        : `التقرير المالي التنفيذي${isDemoMode ? ' (تجريبي)' : ''} - ${getMonthLabel(filter.month)} ${filter.year}`;

      await onApproveCurrentReport({
        title,
        periodType,
        year: filter.year,
        month: filter.month === 'all' ? 0 : filter.month,
        ...(selectedAuction ? { auctionId: selectedAuction.id } : {}),
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
      setApprovedSuccess(true);
      setTimeout(() => setApprovedSuccess(false), 4000);
      showSuccess({
        title: 'تم اعتماد التقرير المالي',
        message: 'تم اعتماد التقرير المالي وحفظ النسخة المعتمدة (Snapshot) بنجاح في الأرشيف.',
        details: [
          { label: 'الفترة والموقع', value: `${periodLabel} · ${locationLabel}` },
          { label: 'المركبات المبيعة / المعروضة', value: `${formatNumber(metrics.soldCount)} / ${formatNumber(metrics.displayedCount)}`, mono: true },
          { label: 'إجمالي قيمة البيع', value: formatAED(metrics.totalSaleValue), dir: 'ltr', mono: true },
          { label: 'المبالغ المحصلة', value: formatAED(metrics.totalCollected), dir: 'ltr', mono: true },
        ],
      });
    } catch (err) {
      showError({
        title: 'تعذر اعتماد التقرير المالي',
        operationName: 'اعتماد التقرير المالي وحفظ Snapshot',
        message: err instanceof Error ? err.message : 'تعذر اعتماد التقرير المالي للفترة الحالية.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: executeApprove,
      });
    } finally {
      setApproving(false);
    }
  };

  const handleApprove = () => {
    if (approving || metrics.displayedCount === 0) return;
    showConfirm({
      dedupeKey: 'confirm:approve-financial-report',
      variant: 'approve',
      title: 'تأكيد اعتماد التقرير المالي',
      message: 'هل ترغب في اعتماد التقرير المالي للفترة المحددة وحفظ نسخة ثابتة (Snapshot)؟',
      impactNote:
        'تُحفظ النسخة المعتمدة بأرقامها الحالية كسجل تاريخي ثابت في الأرشيف المعتمد ولا تتغير بتعديلات لاحقة.',
      details: [
        { label: 'الفترة', value: periodLabel },
        { label: 'الموقع / الساحة', value: locationLabel },
        { label: 'إجمالي قيمة البيع', value: formatAED(metrics.totalSaleValue), dir: 'ltr', mono: true },
        { label: 'إجمالي المبالغ المحصلة', value: formatAED(metrics.totalCollected), dir: 'ltr', mono: true },
      ],
      cancelLabel: 'إلغاء',
      confirmLabel: 'تأكيد الاعتماد',
      onConfirm: executeApprove,
    });
  };

  interface StatementRowItem {
    item: string;
    val: string;
    icon: React.ComponentType<{ className?: string }>;
    iconCls: string;
    highlight?: boolean;
    valueCls?: string;
  }

  const statementRows: StatementRowItem[] = [
    {
      item: '1. عدد المركبات المعروضة بالمزاد',
      val: `${formatNumber(metrics.displayedCount)} مركبة`,
      icon: Car,
      iconCls: 'bg-blue-50 text-[#0B4F93]',
    },
    {
      item: '2. عدد المركبات المبيعة / غير المبيعة',
      val: `${formatNumber(metrics.soldCount)} مبيعة (${formatPercent(metrics.saleSuccessRate, 2)}) · ${formatNumber(metrics.unsoldCount)} غير مبيعة`,
      icon: CheckCircle2,
      iconCls: 'bg-emerald-50 text-emerald-700',
    },
    {
      item: '3. القيمة التقديرية الأولية لجميع المركبات المعروضة',
      val: formatAED(metrics.totalEstimatedValue),
      icon: Tag,
      iconCls: 'bg-sky-50 text-[#0B55A1]',
    },
    {
      item: '4. القيمة التقديرية للمركبات المبيعة فقط',
      val: formatAED(metrics.soldEstimatedValue),
      icon: ClipboardCheck,
      iconCls: 'bg-indigo-50 text-[#0A2C52]',
    },
    {
      item: '5. إجمالي قيمة البيع المسجلة بالمزاد',
      val: formatAED(metrics.totalSaleValue),
      icon: Gavel,
      iconCls: 'bg-[#0B4F93] text-white',
      highlight: true,
      valueCls: 'text-[#0A2C52] font-black',
    },
    {
      item: '6. الفارق المالي عن التقديرات (مقارنة المركبات المبيعة فقط)',
      val: `${formatAED(metrics.varianceAmount)} (${formatPercent(metrics.variancePercent, 2)})`,
      icon: TrendingUp,
      iconCls:
        metrics.varianceAmount >= 0
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-[#C8232C]',
      valueCls: metrics.varianceAmount >= 0 ? 'text-[#057A55]' : 'text-[#C8232C]',
    },
    {
      item: '7. المبالغ المحصلة فعلياً من بيع المركبات',
      val: `${formatAED(metrics.totalCollected)} (${formatPercent(metrics.collectionRate, 2)})`,
      icon: Coins,
      iconCls: 'bg-amber-50 text-amber-700',
      valueCls: 'text-[#057A55]',
    },
    {
      item: '8. المبالغ المتبقية قيد التحصيل (الذمم)',
      val: formatAED(metrics.outstandingReceivables),
      icon: Receipt,
      iconCls:
        metrics.outstandingReceivables > 0
          ? 'bg-orange-50 text-orange-700'
          : 'bg-slate-100 text-slate-600',
      valueCls: metrics.outstandingReceivables > 0 ? 'text-amber-700' : 'text-[#0A2C52]',
    },
    {
      item: `9. حصة شركة ساعد من المبالغ المحصلة (${metrics.saaedSharePercent.toFixed(2)}%)`,
      val: formatAED(metrics.saaedShareAmount),
      icon: Handshake,
      iconCls: 'bg-blue-50 text-[#0B4F93]',
    },
    {
      item: `10. حصة الطرف الثالث من المبالغ المحصلة (${metrics.thirdPartySharePercent.toFixed(2)}%)`,
      val: formatAED(metrics.thirdPartyShareAmount),
      icon: PieChart,
      iconCls: 'bg-slate-100 text-slate-700',
    },
    {
      item: '11. رسوم المنصة المحصلة',
      val: formatAED(metrics.totalPlatformFees),
      icon: Monitor,
      iconCls: 'bg-sky-50 text-sky-700',
    },
    {
      item: '12. الرسوم الإدارية المحصلة',
      val: formatAED(metrics.totalAdminFees),
      icon: FileText,
      iconCls: 'bg-blue-50 text-[#1d4ed8]',
    },
    {
      item: '13. خدمات الفوركلفت المحصلة',
      val: formatAED(metrics.totalForkliftFees),
      icon: Forklift,
      iconCls: 'bg-amber-50 text-amber-700',
    },
    {
      item: '14. خدمات نقل المركبات (ريكفري ساعد) المحصلة',
      val: formatAED(metrics.totalRecoveryFees),
      icon: Truck,
      iconCls: 'bg-teal-50 text-teal-700',
    },
    {
      item: '15. إجمالي رسوم الخدمات المحصلة',
      val: formatAED(metrics.totalServiceFees),
      icon: Calculator,
      iconCls: 'bg-[#0A2C52] text-white',
      highlight: true,
      valueCls: 'text-[#0A2C52] font-black',
    },
  ];

  const executiveSummaryCards = [
    {
      key: 'sale-total',
      label: 'إجمالي قيمة البيع',
      value: formatAED(metrics.totalSaleValue),
      detail: `من ${formatNumber(metrics.soldCount)} مركبة مبيعة`,
      thumb: kpiAuctionGavelImg,
      fallbackIcon: Gavel,
      accentCls: 'text-[#0A2C52]',
      iconBgCls: 'bg-blue-50 text-[#0B4F93]',
    },
    {
      key: 'collected-total',
      label: 'إجمالي المبالغ المحصلة',
      value: formatAED(metrics.totalCollected),
      detail: `نسبة التحصيل ${formatPercent(metrics.collectionRate, 2)}`,
      thumb: kpiGoldCoinsImg,
      fallbackIcon: Coins,
      accentCls: 'text-[#057A55]',
      iconBgCls: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'sale-success',
      label: 'نسبة نجاح البيع',
      value: formatPercent(metrics.saleSuccessRate, 2),
      detail: `${formatNumber(metrics.soldCount)} من أصل ${formatNumber(metrics.displayedCount)} مركبة`,
      thumb: kpiWhiteSuvImg,
      fallbackIcon: Car,
      accentCls: 'text-[#0B4F93]',
      iconBgCls: 'bg-sky-50 text-[#0B55A1]',
    },
    {
      key: 'services-total',
      label: 'إجمالي رسوم الخدمات',
      value: formatAED(metrics.totalServiceFees),
      detail: 'منصة · إدارية · فوركلفت · ريكفري',
      thumb: cardBannerServicesFleetImg,
      fallbackIcon: Calculator,
      accentCls: 'text-[#C8232C]',
      iconBgCls: 'bg-red-50 text-[#C8232C]',
    },
  ];

  return (
    <div className="space-y-4 p-4">
      {isDemoMode && (
        <div className="flex items-center justify-between rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span>تقرير تجريبي – غير صالح للاعتماد المالي الرسمي</span>
          </div>
          <span className="font-mono-num">بيانات تجريبية – ليست بيانات مالية فعلية</span>
        </div>
      )}

      {/* Title & Action Toolbar */}
      <div className="saaed-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0A2C52]">
            التقرير المالي التفصيلي للمزاد
          </h2>
          <p className="text-xs text-slate-600">
            الفترة: {periodLabel} · الموقع: {locationLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <button
              type="button"
              disabled={approving || metrics.displayedCount === 0}
              onClick={handleApprove}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-800 disabled:opacity-50"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>{approving ? 'جاري الاعتماد...' : 'اعتماد نسخة ثابتة (Snapshot)'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPrintPreview}
            className="flex items-center gap-1.5 rounded-lg bg-[#C8232C] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#a81b23]"
          >
            <Printer className="h-4 w-4" />
            <span>معاينة وطباعة PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* Dedicated Panoramic Institutional Banner Below Title/Controls & Above Financial Table */}
      <AuctionFinancialReportBanner
        periodLabel={periodLabel}
        locationLabel={locationLabel}
        auctionTitle={selectedAuction?.title}
        auctionCode={selectedAuction?.auctionCode}
        isDemoMode={isDemoMode}
      />

      {approvedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <span>تم اعتماد وحفظ نسخة التقرير الثابتة (Snapshot) بنجاح في سجل التقارير والأرشيف.</span>
        </div>
      )}

      {/* Executive Summary Section Positioned Above the Unified Financial Statement Table */}
      <section aria-label="الملخص المالي التنفيذي للمزاد" className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#0B4F93]" aria-hidden="true" />
            <h3 className="text-sm font-extrabold text-[#0A2C52]">
              الملخص المالي التنفيذي للمزاد
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            مؤشرات الأداء المستخلصة من التقرير المالي · {periodLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {executiveSummaryCards.map((card) => {
            const FallbackIcon = card.fallbackIcon;
            const imgFailed = Boolean(failedThumbKeys[card.key]);

            return (
              <div
                key={card.key}
                className="saaed-kpi-card flex items-center justify-between gap-3 rounded-xl p-3.5"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-[11px] font-bold text-slate-600">{card.label}</p>
                  <p
                    dir="ltr"
                    className={`font-mono-num tabular-nums text-right text-base font-extrabold leading-tight sm:text-[17px] ${card.accentCls}`}
                  >
                    {card.value}
                  </p>
                  <p className="truncate text-[11px] font-medium text-slate-500">{card.detail}</p>
                </div>

                {!imgFailed ? (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-[#0A2C52]/5 shadow-2xs">
                    <img
                      src={card.thumb}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedThumbKeys((prev) => ({ ...prev, [card.key]: true }))
                      }
                      className="h-full w-full object-cover object-center select-none"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.iconBgCls}`}
                  >
                    <FallbackIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Enhanced 15-Item Financial Statement Table (Clean Iconography, Zero Background Photos) */}
      <div className="saaed-card overflow-hidden rounded-xl">
        <div className="saaed-card-header flex flex-wrap items-center justify-between gap-2 border-b border-[#1d549c]/40 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-sky-200" />
            <span className="text-xs font-extrabold sm:text-[13px]">
              البيان المالي الموحد (AED) {isDemoMode ? '— وضع العرض التجريبي' : ''}
            </span>
          </div>
          <span className="text-[11px] font-medium text-blue-100/90">
            15 بنداً معتمداً · الدرهم الإماراتي (AED)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <tbody className="divide-y divide-slate-200/85">
              {statementRows.map((row, idx) => {
                const RowIcon = row.icon;
                const rowSurface = row.highlight
                  ? 'bg-[#eaf2fc] border-y border-[#bfd5f2]'
                  : idx % 2 === 0
                    ? 'bg-white hover:bg-blue-50/35'
                    : 'bg-[#f5f9fe] hover:bg-blue-50/50';

                return (
                  <tr key={row.item} className={`transition-colors ${rowSurface}`}>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span
                          aria-hidden="true"
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs ${row.iconCls}`}
                        >
                          <RowIcon className="h-3.5 w-3.5" />
                        </span>
                        <span
                          className={`leading-relaxed ${
                            row.highlight
                              ? 'font-extrabold text-[#0A2C52] sm:text-[13px]'
                              : 'font-bold text-slate-800'
                          }`}
                        >
                          {row.item}
                        </span>
                      </div>
                    </td>
                    <td
                      dir="ltr"
                      className={`font-mono-num tabular-nums px-3 py-2.5 text-left sm:whitespace-nowrap sm:px-5 sm:py-3 sm:text-[13px] ${
                        row.valueCls || 'font-extrabold text-[#0A2C52]'
                      }`}
                    >
                      {row.val}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   TAB 3: سجل المزادات
============================================================================ */
interface AuctionsRegistryViewProps {
  auctions: Auction[];
  vehicles: Vehicle[];
  serviceRecords?: ServiceFeeRecord[];
  canEdit: boolean;
  onAddAuction: () => void;
  onEditAuction: (auction: Auction) => void;
  onDeleteAuction: (auction: Auction) => void;
  onSelectAuctionFilter: (auctionId: string) => void;
}

const MODAL_VEHICLE_ROW_HEIGHT = 36;
const MODAL_VEHICLE_OVERSCAN = 20;
const MODAL_VIRTUAL_THRESHOLD = 80;

export const AuctionsRegistryView: React.FC<AuctionsRegistryViewProps> = ({
  auctions,
  vehicles,
  serviceRecords = [],
  canEdit,
  onAddAuction,
  onEditAuction,
  onDeleteAuction,
  onSelectAuctionFilter,
}) => {
  const [inspectingAuction, setInspectingAuction] = useState<Auction | null>(null);
  const [modalBannerFailed, setModalBannerFailed] = useState(false);
  const [modalVehicleSearch, setModalVehicleSearch] = useState('');
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const vehiclesScrollRef = useRef<HTMLDivElement | null>(null);

  const activeInspectingAuction = useMemo(() => {
    if (!inspectingAuction) return null;
    return auctions.find((a) => a.id === inspectingAuction.id) ?? inspectingAuction;
  }, [auctions, inspectingAuction]);

  useEffect(() => {
    if (!activeInspectingAuction) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.querySelector('[data-saaed-smart-dialog="true"]')) return;
        setInspectingAuction(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [activeInspectingAuction]);

  useEffect(() => {
    setModalVehicleSearch('');
    setTableScrollTop(0);
    if (vehiclesScrollRef.current) {
      vehiclesScrollRef.current.scrollTop = 0;
    }
  }, [activeInspectingAuction?.id]);

  const registrySummary = useMemo(() => {
    const auctionIdSet = new Set(auctions.map((a) => a.id));
    const approvedCount = auctions.filter((a) => a.status === 'approved').length;
    const activeCount = auctions.filter((a) => a.status === 'active').length;
    const totalVehiclesCount = vehicles.filter((v) => auctionIdSet.has(v.auctionId)).length;
    return { approvedCount, activeCount, totalVehiclesCount };
  }, [auctions, vehicles]);

  const inspectedStats = useMemo(() => {
    if (!activeInspectingAuction) return null;
    const aucVehicles = getAuctionLinkedVehicles(vehicles, activeInspectingAuction.id);
    const sold = aucVehicles.filter((v) => v.status === 'sold');
    const unsold = aucVehicles.filter((v) => v.status === 'unsold');
    const totalEst = aucVehicles.reduce((s, v) => s + v.estimatedValue, 0);
    const soldEst = sold.reduce((s, v) => s + v.estimatedValue, 0);
    const totalSale = sold.reduce((s, v) => s + v.salePrice, 0);
    const totalCollected = aucVehicles.reduce((s, v) => s + v.collectedAmount, 0);
    const remaining = Math.max(0, totalSale - totalCollected);
    const saaedShare = totalCollected * (activeInspectingAuction.saaedSharePercent / 100);
    const thirdShare = totalCollected * (activeInspectingAuction.thirdPartySharePercent / 100);
    const aucServices = serviceRecords.filter((s) => s.auctionId === activeInspectingAuction.id);
    const servicesSum =
      aucServices.length > 0
        ? aucServices.reduce((s, r) => s + r.collectedAmount, 0)
        : aucVehicles.reduce(
            (s, v) => s + v.platformFee + v.adminFee + v.forkliftFee + v.recoveryFee,
            0
          );

    return {
      totalCount: aucVehicles.length,
      soldCount: sold.length,
      unsoldCount: unsold.length,
      totalEst,
      soldEst,
      totalSale,
      totalCollected,
      remaining,
      saaedShare,
      thirdShare,
      servicesSum,
      allVehicles: aucVehicles,
    };
  }, [activeInspectingAuction, serviceRecords, vehicles]);

  const filteredModalVehicles = useMemo(() => {
    if (!inspectedStats) return [];
    return filterAuctionModalVehicles(inspectedStats.allVehicles, modalVehicleSearch);
  }, [inspectedStats, modalVehicleSearch]);

  const virtualWindow = useMemo(() => {
    const total = filteredModalVehicles.length;
    if (total <= MODAL_VIRTUAL_THRESHOLD) {
      return {
        startIndex: 0,
        endIndex: total,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
        visibleRows: filteredModalVehicles,
      };
    }

    const viewportEstimate = 420;
    const startIndex = Math.max(
      0,
      Math.floor(tableScrollTop / MODAL_VEHICLE_ROW_HEIGHT) - MODAL_VEHICLE_OVERSCAN
    );
    const endIndex = Math.min(
      total,
      Math.ceil((tableScrollTop + viewportEstimate) / MODAL_VEHICLE_ROW_HEIGHT) +
        MODAL_VEHICLE_OVERSCAN
    );

    return {
      startIndex,
      endIndex,
      topSpacerHeight: startIndex * MODAL_VEHICLE_ROW_HEIGHT,
      bottomSpacerHeight: Math.max(0, (total - endIndex) * MODAL_VEHICLE_ROW_HEIGHT),
      visibleRows: filteredModalVehicles.slice(startIndex, endIndex),
    };
  }, [filteredModalVehicles, tableScrollTop]);

  return (
    <div className="space-y-4 p-4">
      {/* Header Toolbar Preserving Title, Description, and Add Auction Button */}
      <div className="saaed-card relative overflow-hidden rounded-xl p-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-44 opacity-[0.06]"
          style={{
            background:
              'radial-gradient(circle at 20% 50%, #0B4F93 0%, transparent 72%)',
          }}
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A2C52] text-white shadow-xs"
            >
              <Gavel className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#0A2C52]">
                سجل المزادات ({formatNumber(auctions.length)})
              </h2>
              <p className="text-xs text-slate-600">
                إدارة جلسات المزادات واستعراض تفاصيل كل مزاد المستمدة مباشرة من سجلات مركباته وتحصيلاته وخدماته
              </p>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={onAddAuction}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#C8232C] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#a81b23]"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة مزاد جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Dedicated Panoramic Auction Registry Banner Below Header & Above Table */}
      <AuctionRegistryBanner
        auctionCount={auctions.length}
        approvedCount={registrySummary.approvedCount}
        activeCount={registrySummary.activeCount}
        totalVehiclesCount={registrySummary.totalVehiclesCount}
      />

      {/* Enhanced 11-Column Registry Table */}
      <div className="saaed-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-xs">
            <thead>
              <tr className="saaed-card-header whitespace-nowrap text-white">
                <th className="px-3.5 py-3 font-extrabold">رقم المزاد</th>
                <th className="px-3.5 py-3 font-extrabold">عنوان المزاد</th>
                <th className="px-3.5 py-3 font-extrabold">الموقع / الساحة</th>
                <th className="px-3.5 py-3 font-extrabold">التاريخ</th>
                <th className="px-3.5 py-3 font-extrabold">المركبات</th>
                <th className="px-3.5 py-3 font-extrabold">القيمة التقديرية</th>
                <th className="px-3.5 py-3 font-extrabold">إجمالي البيع</th>
                <th className="px-3.5 py-3 font-extrabold">المحصل</th>
                <th className="px-3.5 py-3 font-extrabold">ساعد / الطرف 3</th>
                <th className="px-3.5 py-3 font-extrabold">الحالة</th>
                <th className="px-3.5 py-3 text-center font-extrabold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/85">
              {auctions.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={11} className="py-10 text-center text-xs font-semibold text-slate-400">
                    لا توجد مزادات مسجلة ضمن الفترة المحددة.
                  </td>
                </tr>
              ) : (
                auctions.map((auc, idx) => {
                  const aucVehicles = vehicles.filter((v) => v.auctionId === auc.id);
                  const aucSold = aucVehicles.filter((v) => v.status === 'sold');
                  const aucEst = aucVehicles.reduce((s, v) => s + v.estimatedValue, 0);
                  const aucSale = aucSold.reduce((s, v) => s + v.salePrice, 0);
                  const aucCollected = aucVehicles.reduce((s, v) => s + v.collectedAmount, 0);
                  const badge = AUCTION_STATUS_LABELS[auc.status];
                  const rowStripe = idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f9fe]';

                  return (
                    <tr
                      key={auc.id}
                      onClick={() => setInspectingAuction(auc)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/75 ${rowStripe}`}
                    >
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Gavel className="h-3.5 w-3.5 shrink-0 text-[#0B4F93]/75" aria-hidden="true" />
                          <span className="font-mono-num tabular-nums font-extrabold text-[#0B4F93]">
                            {auc.auctionCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-slate-900">{auc.title}</div>
                        {auc.notes && (
                          <div className="mt-0.5 line-clamp-1 text-[10.5px] text-slate-500">
                            {auc.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-slate-700">
                        <div className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                          <span>{auc.location}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-mono-num tabular-nums font-semibold text-slate-700">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                          <span>
                            {auc.auctionDate || `${ARABIC_MONTHS[auc.month - 1]} ${auc.year}`}
                          </span>
                        </div>
                      </td>
                      <td className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-3 font-bold text-slate-800">
                        {formatNumber(aucVehicles.length)}{' '}
                        <span className="text-[10.5px] font-semibold text-emerald-700">
                          ({formatNumber(aucSold.length)} مبيعة)
                        </span>
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-3 text-right font-bold text-slate-700"
                      >
                        {formatAED(aucEst)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-3 text-right font-extrabold text-[#C8232C]"
                      >
                        {formatAED(aucSale)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-3 text-right font-extrabold text-emerald-700"
                      >
                        {formatAED(aucCollected)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-3 text-right font-bold text-slate-700"
                      >
                        {auc.saaedSharePercent}% / {auc.thirdPartySharePercent}%
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingAuction(auc)}
                            title="عرض تفاصيل وسجلات المزاد"
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#0A2C52] shadow-2xs transition hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectAuctionFilter(auc.id)}
                            title="عرض التقرير المالي لهذا المزاد"
                            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#0B4F93] transition hover:bg-blue-100"
                          >
                            <Filter className="h-3.5 w-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditAuction(auc)}
                                title="تعديل المزاد"
                                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 transition hover:bg-slate-100"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteAuction(auc)}
                                title="حذف المزاد"
                                className="rounded-md border border-red-200 bg-white p-1 text-[#C8232C] transition hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
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

      {/* Auction Details Modal (Derived Strictly from Linked Records) */}
      {activeInspectingAuction &&
        inspectedStats &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            dir="rtl"
            className="no-print fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setInspectingAuction(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`تفاصيل المزاد ${activeInspectingAuction.auctionCode}`}
              className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[16px] border border-[#b7d1eb] bg-white shadow-2xl"
            >
              <div
                className="sticky top-0 z-10 flex shrink-0 items-center justify-between px-5 py-3.5 text-white"
                style={{
                  background: 'linear-gradient(90deg, #04162f 0%, #0a2e5c 52%, #062044 100%)',
                }}
              >
                <div>
                  <h3 className="text-sm font-extrabold">
                    تفاصيل المزاد: {activeInspectingAuction.auctionCode} – {activeInspectingAuction.title}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    {activeInspectingAuction.location} · التاريخ:{' '}
                    {activeInspectingAuction.auctionDate ||
                      `${ARABIC_MONTHS[activeInspectingAuction.month - 1]} ${activeInspectingAuction.year}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingAuction(null)}
                  aria-label="إغلاق نافذة تفاصيل المزاد"
                  className="rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 text-xs">
                {!modalBannerFailed && (
                  <div className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-200 bg-[#041838]">
                    <img
                      src={auctionRegistryBannerImg}
                      alt="صورة توضيحية عامة لساحة مزادات المركبات"
                      referrerPolicy="no-referrer"
                      onError={() => setModalBannerFailed(true)}
                      className="h-full w-full object-cover object-center opacity-85 select-none"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(4,24,56,0.72) 0%, rgba(4,24,56,0.18) 55%, rgba(4,24,56,0.76) 100%)',
                      }}
                    />
                    <div className="pointer-events-none absolute inset-x-3 bottom-2 flex items-center justify-between text-[10.5px] font-bold text-white/95">
                      <span>{activeInspectingAuction.location}</span>
                      <span className="text-blue-100/90">صورة توضيحية عامة لساحة المزادات</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-bold text-slate-500">المركبات المرتبطة</div>
                    <div className="font-mono-num mt-1 text-base font-extrabold text-[#0A2C52]">
                      {formatNumber(inspectedStats.totalCount)}
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      {formatNumber(inspectedStats.soldCount)} مبيعة · {formatNumber(inspectedStats.unsoldCount)} غير مبيعة
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-bold text-slate-500">القيمة التقديرية</div>
                    <div dir="ltr" className="font-mono-num mt-1 text-right text-base font-extrabold text-[#0B4F93]">
                      {formatAED(inspectedStats.totalEst)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      للمبيعة: {formatAED(inspectedStats.soldEst)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-bold text-slate-500">إجمالي البيع</div>
                    <div dir="ltr" className="font-mono-num mt-1 text-right text-base font-extrabold text-[#C8232C]">
                      {formatAED(inspectedStats.totalSale)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      نسبة النجاح:{' '}
                      {inspectedStats.totalCount > 0
                        ? `${((inspectedStats.soldCount / inspectedStats.totalCount) * 100).toFixed(2)}%`
                        : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-bold text-slate-500">المحصل / المتبقي</div>
                    <div dir="ltr" className="font-mono-num mt-1 text-right text-base font-extrabold text-emerald-700">
                      {formatAED(inspectedStats.totalCollected)}
                    </div>
                    <div className="text-[10px] text-[#C8232C]">
                      المتبقي: {formatAED(inspectedStats.remaining)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                    <div className="font-bold text-slate-600">
                      حصة شركة ساعد ({activeInspectingAuction.saaedSharePercent}%)
                    </div>
                    <div dir="ltr" className="font-mono-num mt-0.5 text-right text-sm font-extrabold text-[#0A2C52]">
                      {formatAED(inspectedStats.saaedShare)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-red-100 bg-red-50/70 p-3">
                    <div className="font-bold text-slate-600">
                      حصة الطرف الثالث ({activeInspectingAuction.thirdPartySharePercent}%)
                    </div>
                    <div dir="ltr" className="font-mono-num mt-0.5 text-right text-sm font-extrabold text-[#C8232C]">
                      {formatAED(inspectedStats.thirdShare)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="font-bold text-slate-600">إجمالي رسوم الخدمات المرتبطة</div>
                    <div dir="ltr" className="font-mono-num mt-0.5 text-right text-sm font-extrabold text-[#0B4F93]">
                      {formatAED(inspectedStats.servicesSum)}
                    </div>
                  </div>
                </div>

                {activeInspectingAuction.notes && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1 font-extrabold text-[#0A2C52]">ملاحظات تشغيلية:</div>
                    <div className="text-slate-700">{activeInspectingAuction.notes}</div>
                  </div>
                )}

                {/* Complete Linked Vehicles Section with Independent Vertical Scrollbar */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#0A2C52]">
                        جميع المركبات المرتبطة بهذا المزاد ({formatNumber(inspectedStats.totalCount)} مركبة)
                      </span>
                      {modalVehicleSearch.trim() !== '' && (
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono-num text-[10.5px] font-bold text-[#0B4F93]">
                          نتائج البحث: {formatNumber(filteredModalVehicles.length)} من{' '}
                          {formatNumber(inspectedStats.totalCount)}
                        </span>
                      )}
                    </div>

                    {inspectedStats.totalCount > 0 && (
                      <div className="flex items-center gap-2">
                        {tableScrollTop > 180 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (vehiclesScrollRef.current) {
                                vehiclesScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                              setTableScrollTop(0);
                            }}
                            title="العودة إلى أعلى قائمة المركبات"
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50/90 px-2 py-1 text-[10.5px] font-bold text-[#0B4F93] transition hover:bg-blue-100"
                          >
                            <ArrowUp className="h-3 w-3" />
                            <span>أعلى القائمة</span>
                          </button>
                        )}
                        <div className="relative">
                          <Search className="pointer-events-none absolute right-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={modalVehicleSearch}
                            onChange={(e) => {
                              setModalVehicleSearch(e.target.value);
                              setTableScrollTop(0);
                              if (vehiclesScrollRef.current) {
                                vehiclesScrollRef.current.scrollTop = 0;
                              }
                            }}
                            placeholder="بحث برقم اللوت أو المركبة أو السنة..."
                            aria-label="بحث داخل مركبات المزاد"
                            className="w-52 rounded-lg border border-slate-200 bg-slate-50/90 py-1 pr-7 pl-6 text-[11px] font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#0B4F93] focus:bg-white focus:outline-none"
                          />
                          {modalVehicleSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalVehicleSearch('');
                                setTableScrollTop(0);
                                if (vehiclesScrollRef.current) {
                                  vehiclesScrollRef.current.scrollTop = 0;
                                }
                              }}
                              aria-label="مسح البحث"
                              className="absolute left-1.5 top-1.5 rounded text-slate-400 hover:text-slate-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    ref={vehiclesScrollRef}
                    onScroll={(e) => setTableScrollTop(e.currentTarget.scrollTop)}
                    className="saaed-auction-vehicles-scroll rounded-lg border border-slate-200 bg-white"
                  >
                    <table className="w-full min-w-[540px] border-collapse text-right text-[11px]">
                      <thead>
                        <tr className="bg-[#edf3fa] font-extrabold text-[#0A2C52]">
                          <th className="whitespace-nowrap px-2.5 py-2">رقم اللوت</th>
                          <th className="whitespace-nowrap px-2.5 py-2">المركبة</th>
                          <th className="whitespace-nowrap px-2.5 py-2">التقديرية</th>
                          <th className="whitespace-nowrap px-2.5 py-2">سعر البيع</th>
                          <th className="whitespace-nowrap px-2.5 py-2">المحصل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspectedStats.totalCount === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center font-semibold text-slate-400">
                              لا توجد مركبات مرتبطة بهذا المزاد حالياً.
                            </td>
                          </tr>
                        ) : filteredModalVehicles.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center font-semibold text-slate-400">
                              لا توجد مركبات مطابقة لعبارة البحث داخل هذا المزاد.
                            </td>
                          </tr>
                        ) : (
                          <>
                            {virtualWindow.topSpacerHeight > 0 && (
                              <tr
                                aria-hidden="true"
                                style={{ height: `${virtualWindow.topSpacerHeight}px` }}
                              >
                                <td colSpan={5} className="border-0 p-0" />
                              </tr>
                            )}
                            {virtualWindow.visibleRows.map((v, localIdx) => {
                              const absoluteIdx = virtualWindow.startIndex + localIdx;
                              const rowBg =
                                absoluteIdx % 2 === 0 ? 'bg-white' : 'bg-[#f6f9fe]';
                              return (
                                <tr
                                  key={v.id}
                                  className={`h-9 transition-colors hover:bg-blue-50/70 ${rowBg}`}
                                >
                                  <td className="font-mono-num tabular-nums whitespace-nowrap px-2.5 py-1.5 font-bold text-[#0B4F93]">
                                    {v.lotNumber}
                                  </td>
                                  <td className="whitespace-nowrap px-2.5 py-1.5 font-bold text-slate-900">
                                    {v.make} {v.model} ({v.modelYear})
                                  </td>
                                  <td
                                    dir="ltr"
                                    className="font-mono-num tabular-nums whitespace-nowrap px-2.5 py-1.5 text-right text-slate-800"
                                  >
                                    {formatAED(v.estimatedValue)}
                                  </td>
                                  <td
                                    dir="ltr"
                                    className="font-mono-num tabular-nums whitespace-nowrap px-2.5 py-1.5 text-right font-bold text-[#C8232C]"
                                  >
                                    {formatAED(v.salePrice)}
                                  </td>
                                  <td
                                    dir="ltr"
                                    className="font-mono-num tabular-nums whitespace-nowrap px-2.5 py-1.5 text-right font-bold text-emerald-700"
                                  >
                                    {formatAED(v.collectedAmount)}
                                  </td>
                                </tr>
                              );
                            })}
                            {virtualWindow.bottomSpacerHeight > 0 && (
                              <tr
                                aria-hidden="true"
                                style={{ height: `${virtualWindow.bottomSpacerHeight}px` }}
                              >
                                <td colSpan={5} className="border-0 p-0" />
                              </tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setInspectingAuction(null)}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    إغلاق
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAuctionFilter(activeInspectingAuction.id);
                      setInspectingAuction(null);
                    }}
                    className="rounded-lg bg-[#0B4F93] px-4 py-2 font-bold text-white hover:bg-[#083c72]"
                  >
                    تصفية لوحة المعلومات على هذا المزاد
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

/* ============================================================================
   TAB 4: المركبات المعروضة والمبيعة
============================================================================ */
interface VehiclesLedgerViewProps {
  vehicles: Vehicle[];
  auctions: Auction[];
  filter: FilterState;
  canEdit: boolean;
  isDemoMode?: boolean;
  onAddVehicle: () => void;
  onEditVehicle: (v: Vehicle) => void;
  onUpdateSaleDate?: (v: Vehicle, newSaleDate: string) => Promise<void>;
  onDeleteVehicle: (v: Vehicle) => void;
  onOpenImport: () => void;
}

const PAGE_SIZE = 50;

export const VehiclesLedgerView: React.FC<VehiclesLedgerViewProps> = ({
  vehicles,
  auctions,
  filter,
  canEdit,
  isDemoMode = false,
  onAddVehicle,
  onEditVehicle,
  onUpdateSaleDate,
  onDeleteVehicle,
  onOpenImport,
}) => {
  const { showToast } = useSmartDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [headerThumbFailed, setHeaderThumbFailed] = useState(false);
  const [editingSaleDateVehicle, setEditingSaleDateVehicle] = useState<Vehicle | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const vehiclesTableRef = useRef<HTMLTableElement | null>(null);

  const auctionsById = useMemo(() => buildAuctionLookupMap(auctions), [auctions]);

  const anomalySummary = useMemo(() => {
    let unlinkedCount = 0;
    let unavailableCount = 0;
    for (const v of vehicles) {
      const linkInfo = resolveVehicleAuction(v, auctionsById);
      if (linkInfo.status === 'unlinked') unlinkedCount += 1;
      else if (linkInfo.status === 'unavailable') unavailableCount += 1;
    }
    return { unlinkedCount, unavailableCount };
  }, [vehicles, auctionsById]);

  const lastAnomalySigRef = useRef('');
  useEffect(() => {
    const totalAnomalies = anomalySummary.unlinkedCount + anomalySummary.unavailableCount;
    if (totalAnomalies === 0) {
      lastAnomalySigRef.current = '';
      return;
    }
    const sig = `${anomalySummary.unlinkedCount}:${anomalySummary.unavailableCount}`;
    if (lastAnomalySigRef.current !== sig) {
      lastAnomalySigRef.current = sig;
      console.info(
        `[SAAED Audit] سجل المركبات: ${anomalySummary.unlinkedCount} غير مرتبط بمزاد، ${anomalySummary.unavailableCount} مرتبط بمزاد غير متاح.`
      );
    }
  }, [anomalySummary]);

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) => {
      const auctionInfo = resolveVehicleAuction(v, auctionsById);
      return (
        v.id.toLowerCase().includes(q) ||
        v.lotNumber.toLowerCase().includes(q) ||
        auctionInfo.label.toLowerCase().includes(q) ||
        (auctionInfo.auctionCode || '').toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.vin || '').toLowerCase().includes(q) ||
        (v.buyerName || '').toLowerCase().includes(q)
      );
    });
  }, [vehicles, searchTerm, auctionsById]);

  const inventoryBreakdown = useMemo(() => {
    let soldCount = 0;
    let pendingCount = 0;
    let unsoldCount = 0;
    for (const v of visible) {
      if (v.status === 'sold') soldCount += 1;
      else if (v.status === 'pending') pendingCount += 1;
      else unsoldCount += 1;
    }
    return { soldCount, pendingCount, unsoldCount };
  }, [visible]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [safePage, visible]
  );

  return (
    <div className="space-y-4 p-4">
      {/* Header Toolbar Preserving Title, Search, Export, Import, and Add Controls */}
      <div className="saaed-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {!headerThumbFailed ? (
            <div className="hidden h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-[#0A2C52]/5 shadow-2xs sm:block">
              <img
                src={kpiWhiteSuvImg}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setHeaderThumbFailed(true)}
                className="h-full w-full object-cover object-center select-none"
              />
            </div>
          ) : null}
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A2C52] text-white shadow-xs"
          >
            <Car className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-[#0A2C52]">
              المركبات المعروضة والمبيعة ({formatNumber(visible.length)})
            </h2>
            <p className="text-xs text-slate-600">
              سجل المركبات التفصيلي شامل المعرّف، القيمة التقديرية، سعر البيع، تاريخ البيع، التحصيل، ورسوم الخدمات
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="بحث بالمعرف / اللوت / اسم المزاد / النوع..."
              className="w-64 rounded-lg border border-slate-300 bg-white py-1.5 pr-8 pl-3 text-xs font-semibold focus:border-[#0B4F93] focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={visible.length === 0 || exportingExcel}
            onClick={async () => {
              if (exportingExcel || visible.length === 0) return;
              setExportingExcel(true);
              try {
                const report = await exportVehiclesToXlsx(
                  visible,
                  `SAAED_Vehicles_${filter.year}_${filter.month}`,
                  isDemoMode,
                  auctionsById
                );
                if (report) {
                  showToast({
                    variant: 'success',
                    title: 'تم تصدير تقرير Excel التنفيذي بنجاح',
                    description: `تم استخراج ${formatNumber(report.vehicleRowCount)} سجل مركبة بـ ${report.columnCount} عموداً مع الملخص التنفيذي والشعار المضمّن.`,
                  });
                }
              } catch (err) {
                showToast({
                  variant: 'error',
                  title: 'تعذر تصدير ملف Excel',
                  description:
                    err instanceof Error
                      ? err.message
                      : 'حدث خطأ أثناء إنشاء ملف التقرير. يرجى المحاولة مرة أخرى.',
                });
              } finally {
                setExportingExcel(false);
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-700" />
            <span>{exportingExcel ? 'جاري تجهيز Excel...' : 'تصدير Excel'}</span>
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={onOpenImport}
                className="flex items-center gap-1.5 rounded-lg bg-[#0B4F93] px-3 py-2 text-xs font-bold text-white shadow hover:bg-[#083c72]"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>استيراد Excel/CSV</span>
              </button>
              <button
                type="button"
                onClick={onAddVehicle}
                className="flex items-center gap-1.5 rounded-lg bg-[#C8232C] px-3 py-2 text-xs font-bold text-white shadow hover:bg-[#a81b23]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة مركبة</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dedicated Panoramic Banner Below Controls & Above Vehicle Ledger Table */}
      <VehicleInventoryBanner
        displayedCount={visible.length}
        soldCount={inventoryBreakdown.soldCount}
        pendingCount={inventoryBreakdown.pendingCount}
        unsoldCount={inventoryBreakdown.unsoldCount}
      />

      {/* Enhanced High-Performance Vehicle Inventory Table (All Columns Preserved) */}
      <div className="saaed-card overflow-hidden rounded-xl">
        <div ref={tableScrollRef} className="saaed-smart-scroll-host">
          <table
            id="saaed-vehicles-ledger-table"
            ref={vehiclesTableRef}
            className="w-full min-w-[1220px] text-right text-xs"
          >
            <thead>
              <tr className="saaed-card-header whitespace-nowrap text-white">
                <th className="px-3 py-3 font-extrabold">المعرف / اللوت</th>
                <th className="px-3 py-3 font-extrabold">اسم المزاد</th>
                <th className="px-3 py-3 font-extrabold">المركبة والطراز</th>
                <th className="px-3 py-3 font-extrabold">سنة الصنع</th>
                <th className="px-3 py-3 font-extrabold">الساحة</th>
                <th className="px-3 py-3 font-extrabold">تاريخ البيع</th>
                <th className="px-3 py-3 font-extrabold">التقديرية (AED)</th>
                <th className="px-3 py-3 font-extrabold">سعر البيع (AED)</th>
                <th className="px-3 py-3 font-extrabold">المحصل (AED)</th>
                <th className="px-3 py-3 font-extrabold">رسوم الخدمات</th>
                <th className="px-3 py-3 font-extrabold">الحالة</th>
                {canEdit && <th className="px-3 py-3 text-center font-extrabold">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/85">
              {pageItems.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={canEdit ? 12 : 11} className="py-10 text-center text-xs font-semibold text-slate-400">
                    لا توجد مركبات مطابقة للبحث أو الفترة المحددة.
                  </td>
                </tr>
              ) : (
                pageItems.map((v, idx) => {
                  const feesSum = v.platformFee + v.adminFee + v.forkliftFee + v.recoveryFee;
                  const exceededEstimate =
                    v.status === 'sold' && v.estimatedValue > 0 && v.salePrice > v.estimatedValue;
                  const rowStripe = idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f9fe]';
                  const auctionInfo = resolveVehicleAuction(v, auctionsById);

                  return (
                    <tr key={v.id} className={`transition-colors hover:bg-blue-50/75 ${rowStripe}`}>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-mono-num tabular-nums font-extrabold text-[#0B4F93]">
                          {v.lotNumber}
                        </div>
                        <div className="font-mono-num tabular-nums text-[10px] text-slate-500">
                          {v.id}
                        </div>
                      </td>
                      <td className="max-w-[230px] px-3 py-2.5">
                        <span
                          title={auctionInfo.label}
                          tabIndex={0}
                          className={`block w-full truncate rounded text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F93]/50 ${
                            auctionInfo.status === 'linked'
                              ? 'font-bold text-[#0A2C52]'
                              : auctionInfo.status === 'unlinked'
                                ? 'font-semibold text-slate-500'
                                : 'font-semibold text-amber-700'
                          }`}
                        >
                          {auctionInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900">
                          {v.make} {v.model}
                        </div>
                        {v.buyerName && (
                          <div className="text-[10.5px] text-slate-500">المزايد: {v.buyerName}</div>
                        )}
                      </td>
                      <td className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                        {v.modelYear}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                        <div className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                          <span>{v.location}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                        {canEdit && onUpdateSaleDate ? (
                          <button
                            type="button"
                            onClick={() => setEditingSaleDateVehicle(v)}
                            title={
                              v.saleDate
                                ? `تعديل تاريخ البيع (${v.saleDate})`
                                : 'تحديد تاريخ البيع'
                            }
                            className="group inline-flex cursor-pointer items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 font-mono-num tabular-nums transition hover:border-blue-200 hover:bg-blue-50/90 hover:text-[#0B4F93] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F93]/50"
                          >
                            <Calendar
                              className="h-3.5 w-3.5 shrink-0 text-[#0B4F93] transition-transform group-hover:scale-110"
                              aria-hidden="true"
                            />
                            <span>{v.saleDate || '—'}</span>
                          </button>
                        ) : v.saleDate ? (
                          <div className="inline-flex items-center gap-1 font-mono-num tabular-nums">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <span>{v.saleDate}</span>
                          </div>
                        ) : (
                          <span className="font-mono-num">—</span>
                        )}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 text-right font-bold text-slate-700"
                      >
                        {formatAED(v.estimatedValue)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 text-right font-extrabold text-[#C8232C]"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>{formatAED(v.salePrice)}</span>
                          {exceededEstimate && (
                            <span title="تجاوز القيمة التقديرية">
                              <Award className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 text-right font-extrabold text-emerald-700"
                      >
                        {formatAED(v.collectedAmount)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 text-right font-bold text-slate-700"
                      >
                        {formatAED(feesSum)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                            v.status === 'sold'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : v.status === 'pending'
                                ? 'border-amber-200 bg-amber-50 text-amber-800'
                                : 'border-red-200 bg-red-50 text-[#C8232C]'
                          }`}
                        >
                          {v.status === 'sold' ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                          ) : v.status === 'pending' ? (
                            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          ) : (
                            <MinusCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>
                            {v.status === 'sold'
                              ? 'مبيعة'
                              : v.status === 'pending'
                                ? 'قيد التحصيل'
                                : 'غير مبيعة'}
                          </span>
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditVehicle(v)}
                              title="تعديل المركبة"
                              className="rounded border border-slate-200 bg-white p-1 text-slate-600 transition hover:bg-slate-100"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteVehicle(v)}
                              title="حذف المركبة"
                              className="rounded border border-red-200 bg-white p-1 text-[#C8232C] transition hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <SmartFloatingTableScrollbar
          scrollContainerRef={tableScrollRef}
          tableRef={vehiclesTableRef}
          tableId="saaed-vehicles-ledger-table"
          isExternalModalOpen={Boolean(editingSaleDateVehicle)}
          storageKey="saaed_vehicles_ledger_scroll_v1"
          ariaLabel="شريط التمرير الأفقي الذكي لجدول المركبات المعروضة والمبيعة"
        />

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
            <span className="font-bold text-slate-600">
              عرض {(safePage - 1) * PAGE_SIZE + 1} – {Math.min(safePage * PAGE_SIZE, visible.length)} من أصل{' '}
              {formatNumber(visible.length)} مركبة
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                <span>السابق</span>
              </button>
              <span className="font-mono-num tabular-nums px-2 font-extrabold text-[#0A2C52]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-700 disabled:opacity-40"
              >
                <span>التالي</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <SaleDatePickerModal
        isOpen={Boolean(editingSaleDateVehicle)}
        vehicle={editingSaleDateVehicle}
        auctionLabel={
          editingSaleDateVehicle
            ? resolveVehicleAuction(editingSaleDateVehicle, auctionsById).label
            : ''
        }
        onClose={() => setEditingSaleDateVehicle(null)}
        onSaveSaleDate={async (targetVehicle, newDate) => {
          if (!onUpdateSaleDate) return;
          try {
            await onUpdateSaleDate(targetVehicle, newDate);
            showToast({
              variant: 'success',
              title: 'تم تحديث تاريخ البيع بنجاح',
              description: `تم حفظ تاريخ بيع المركبة ${targetVehicle.make} ${targetVehicle.model} (لوت ${targetVehicle.lotNumber}) إلى ${newDate}.`,
            });
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : 'تعذر حفظ تاريخ البيع في قاعدة البيانات.';
            showToast({
              variant: 'error',
              title: 'فشل تحديث تاريخ البيع',
              description: msg,
            });
            throw err;
          }
        }}
      />
    </div>
  );
};

/* ============================================================================
   TAB 5: التحصيلات المالية
============================================================================ */
interface CollectionsViewProps {
  collections: CollectionRecord[];
  vehicles: Vehicle[];
  metrics: ComputedFinancialMetrics;
  canEdit: boolean;
  onAddCollection: () => void;
  onUpdateCollectionDate?: (c: CollectionRecord, newCollectionDate: string) => Promise<void>;
  onDeleteCollection: (c: CollectionRecord) => void;
}

const METHOD_LABELS: Record<CollectionRecord['method'], string> = {
  bank_transfer: 'تحويل بنكي',
  card: 'بطاقة ائتمان',
  cheque: 'شيك مصرفي',
  cash: 'نقداً',
};

const PAY_STATUS_LABELS: Record<'paid' | 'partial' | 'unpaid', { label: string; cls: string }> = {
  paid: { label: 'مدفوعة بالكامل', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  partial: { label: 'مدفوعة جزئياً', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  unpaid: { label: 'غير مدفوعة', cls: 'border-red-200 bg-red-50 text-[#C8232C]' },
};

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  vehicles,
  metrics,
  canEdit,
  onAddCollection,
  onUpdateCollectionDate,
  onDeleteCollection,
}) => {
  const { showToast } = useSmartDialog();
  const [payFilter, setPayFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [failedKpiThumbs, setFailedKpiThumbs] = useState<Record<string, boolean>>({});
  const [editingPaymentDateRecord, setEditingPaymentDateRecord] = useState<CollectionRecord | null>(
    null
  );

  const unpaidVehicles = useMemo(
    () => vehicles.filter((v) => v.status !== 'unsold' && v.salePrice > v.collectedAmount),
    [vehicles]
  );

  const visibleCollections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return collections.filter((c) => {
      const derivedStatus =
        c.paymentStatus ||
        ((c.remainingAmount || 0) === 0 ? 'paid' : c.amount > 0 ? 'partial' : 'unpaid');
      if (payFilter !== 'all' && derivedStatus !== payFilter) return false;
      if (!q) return true;
      return (
        c.receiptNo.toLowerCase().includes(q) ||
        (c.vehicleId || '').toLowerCase().includes(q) ||
        (c.lotNumber || '').toLowerCase().includes(q) ||
        c.bidderName.toLowerCase().includes(q) ||
        (c.financialRef || '').toLowerCase().includes(q)
      );
    });
  }, [collections, payFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(visibleCollections.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => visibleCollections.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [safePage, visibleCollections]
  );

  return (
    <div className="space-y-4 p-4">
      {/* Header Toolbar */}
      <div className="saaed-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A2C52] text-white shadow-xs"
          >
            <Coins className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-[#0A2C52]">التحصيلات المالية من المزايدين</h2>
            <p className="text-xs text-slate-600">
              متابعة المبالغ المحصلة من بيع المركبات والذمم المتبقية وإصدار سندات التحصيل بصورة منفصلة عن رسوم الخدمات
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onAddCollection}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0B4F93] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#083c72]"
          >
            <Plus className="h-4 w-4" />
            <span>تسجيل سند تحصيل</span>
          </button>
        )}
      </div>

      {/* Dedicated Panoramic Collections Banner */}
      <FinancialCollectionsBanner
        receiptsCount={collections.length}
        collectionRate={metrics.collectionRate}
        unpaidVehiclesCount={unpaidVehicles.length}
      />

      {/* Enhanced 4 Summary KPI Cards Driven Directly by Live Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Sale Value */}
        <div className="saaed-kpi-card flex h-full items-center justify-between gap-3 rounded-xl p-3.5">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-xs font-bold text-slate-600">إجمالي قيمة البيع</div>
            <div
              dir="ltr"
              className="font-mono-num tabular-nums text-right text-lg font-extrabold text-[#0A2C52]"
            >
              {formatAED(metrics.totalSaleValue)}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              إجمالي مبيعات المركبات المعتمدة
            </div>
          </div>
          {!failedKpiThumbs.sale ? (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-[#0A2C52]/5 shadow-2xs">
              <img
                src={kpiAuctionGavelImg}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailedKpiThumbs((prev) => ({ ...prev, sale: true }))}
                className="h-full w-full object-cover object-center select-none"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0B4F93]">
              <Gavel className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Card 2: Total Collected */}
        <div className="saaed-kpi-card flex h-full items-center justify-between gap-3 rounded-xl p-3.5">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-xs font-bold text-slate-600">المبالغ المحصلة فعلياً</div>
            <div
              dir="ltr"
              className="font-mono-num tabular-nums text-right text-lg font-extrabold text-emerald-700"
            >
              {formatAED(metrics.totalCollected)}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700/90">
              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>سندات ومتحصلات مؤكدة</span>
            </div>
          </div>
          {!failedKpiThumbs.collected ? (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-emerald-200/80 bg-emerald-50 shadow-2xs">
              <img
                src={kpiGoldCoinsImg}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailedKpiThumbs((prev) => ({ ...prev, collected: true }))}
                className="h-full w-full object-cover object-center select-none"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Coins className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Card 3: Outstanding Receivables */}
        <div className="saaed-kpi-card flex h-full items-center justify-between gap-3 rounded-xl p-3.5">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-xs font-bold text-slate-600">الذمم المتبقية للتحصيل</div>
            <div
              dir="ltr"
              className="font-mono-num tabular-nums text-right text-lg font-extrabold text-[#C8232C]"
            >
              {formatAED(metrics.outstandingReceivables)}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Clock className="h-3 w-3 shrink-0 text-[#C8232C]" aria-hidden="true" />
              <span>متابعة مستحقات السداد</span>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-200/70 bg-red-50 text-[#C8232C] shadow-2xs"
          >
            <Receipt className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Card 4: Collection Rate */}
        <div className="saaed-kpi-card flex h-full items-center justify-between gap-3 rounded-xl p-3.5">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-xs font-bold text-slate-600">نسبة كفاءة التحصيل</div>
            <div className="font-mono-num tabular-nums text-lg font-extrabold text-[#0B4F93]">
              {formatPercent(metrics.collectionRate, 2)}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              نسبة المحصل إلى قيمة البيع
            </div>
          </div>
          <div
            aria-hidden="true"
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-200/80 bg-blue-50 text-[#0B4F93] shadow-2xs"
          >
            <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#dbeafe"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#0B4F93"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(100, Math.max(0, metrics.collectionRate ?? 0)) * 0.88} 88`}
              />
            </svg>
            <Percent className="absolute h-3.5 w-3.5 text-[#0A2C52]" />
          </div>
        </div>
      </div>

      {/* Enhanced Receipts Table */}
      <div className="saaed-card overflow-hidden rounded-xl">
        <div className="saaed-card-header flex flex-wrap items-center justify-between gap-2 border-b border-[#1d549c]/40 px-4 py-2.5 text-xs text-white">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-sky-200" aria-hidden="true" />
            <span className="font-extrabold">
              سجل عمليات التحصيل المسجلة ({formatNumber(visibleCollections.length)})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={payFilter}
              onChange={(e) => {
                setPayFilter(e.target.value as 'all' | 'paid' | 'partial' | 'unpaid');
                setPage(1);
              }}
              className="rounded border border-white/25 bg-white/10 px-2 py-1 text-[11px] font-bold text-white focus:outline-none"
            >
              <option value="all" className="text-slate-900">كل حالات السداد</option>
              <option value="paid" className="text-slate-900">مدفوعة بالكامل</option>
              <option value="partial" className="text-slate-900">مدفوعة جزئياً</option>
              <option value="unpaid" className="text-slate-900">غير مدفوعة</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute right-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="بحث برقم السند / المركبة / المرجع..."
                className="w-52 rounded border border-white/25 bg-white/95 py-1 pr-7 pl-2.5 text-[11px] font-semibold text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-right text-xs">
            <thead>
              <tr className="border-b border-[#c5d9f0] bg-[#e9f1fa] whitespace-nowrap font-extrabold text-[#0A2C52]">
                <th className="px-3 py-2.5">رقم العملية</th>
                <th className="px-3 py-2.5">المزاد / المركبة</th>
                <th className="px-3 py-2.5">المزايد</th>
                <th className="px-3 py-2.5">المبلغ المستحق</th>
                <th className="px-3 py-2.5">المبلغ المدفوع</th>
                <th className="px-3 py-2.5">الرصيد المتبقي</th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#0B4F93]/75" aria-hidden="true" />
                    <span>تاريخ الدفع</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">حالة السداد</th>
                <th className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5 text-[#0B4F93]/75" aria-hidden="true" />
                    <span>الطريقة / المرجع</span>
                  </span>
                </th>
                <th className="px-3 py-2.5">نوع التحصيل</th>
                {canEdit && <th className="px-3 py-2.5 text-center">حذف</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/85">
              {pageItems.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={canEdit ? 11 : 10} className="py-8 text-center text-slate-400">
                    لا توجد سندات تحصيل مسجلة في هذه الفترة.
                  </td>
                </tr>
              ) : (
                pageItems.map((c, idx) => {
                  const due = c.amountDue ?? c.amount;
                  const rem = c.remainingAmount ?? Math.max(0, due - c.amount);
                  const statusKey =
                    c.paymentStatus || (rem === 0 ? 'paid' : c.amount > 0 ? 'partial' : 'unpaid');
                  const badge = PAY_STATUS_LABELS[statusKey];
                  const rowStripe = idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f9fe]';

                  return (
                    <tr key={c.id} className={`transition-colors hover:bg-blue-50/75 ${rowStripe}`}>
                      <td className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 font-extrabold text-[#0B4F93]">
                        {c.receiptNo}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-mono-num tabular-nums text-[11px] font-bold text-slate-800">
                          {c.vehicleId || 'على مستوى المزاد'}
                        </div>
                        <div className="font-mono-num tabular-nums text-[10px] text-slate-500">
                          {c.auctionId}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">{c.bidderName}</td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 text-right font-bold text-slate-700"
                      >
                        {formatAED(due)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 text-right font-extrabold text-emerald-700"
                      >
                        {formatAED(c.amount)}
                      </td>
                      <td
                        dir="ltr"
                        className="font-mono-num tabular-nums whitespace-nowrap px-3 py-2.5 text-right font-extrabold text-[#C8232C]"
                      >
                        {formatAED(rem)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                        {canEdit && onUpdateCollectionDate ? (
                          <button
                            type="button"
                            onClick={() => setEditingPaymentDateRecord(c)}
                            title={
                              c.collectionDate
                                ? `تعديل تاريخ الدفع (${c.collectionDate})`
                                : 'تحديد تاريخ الدفع'
                            }
                            aria-label={`تعديل تاريخ الدفع لعملية ${c.receiptNo}`}
                            className="group inline-flex cursor-pointer items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 font-mono-num tabular-nums transition hover:border-blue-200 hover:bg-blue-50/90 hover:text-[#0B4F93] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4F93]/50"
                          >
                            <Calendar
                              className="h-3.5 w-3.5 shrink-0 text-[#0B4F93] transition-transform group-hover:scale-110"
                              aria-hidden="true"
                            />
                            <span>{c.collectionDate || '—'}</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 font-mono-num tabular-nums">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <span>{c.collectionDate || '—'}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${badge.cls}`}
                        >
                          {statusKey === 'paid' ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                          ) : statusKey === 'partial' ? (
                            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          ) : (
                            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{METHOD_LABELS[c.method]}</div>
                        {c.financialRef && (
                          <div className="font-mono-num tabular-nums text-[10px] text-slate-500">
                            {c.financialRef}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[11px] font-bold text-[#0A2C52]">
                        {c.collectionType === 'service_fee' ? 'رسوم خدمات' : 'بيع مركبة'}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onDeleteCollection(c)}
                            title="حذف سند التحصيل"
                            className="rounded border border-red-200 bg-white p-1 text-[#C8232C] transition hover:bg-red-50"
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
            <span className="font-bold text-slate-600">
              عرض {(safePage - 1) * PAGE_SIZE + 1} –{' '}
              {Math.min(safePage * PAGE_SIZE, visibleCollections.length)} من أصل{' '}
              {formatNumber(visibleCollections.length)} قيد تحصيل
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                <span>السابق</span>
              </button>
              <span className="font-mono-num tabular-nums px-2 font-extrabold text-[#0A2C52]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-bold text-slate-700 disabled:opacity-40"
              >
                <span>التالي</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Vehicles Receivables (Enhanced Follow-Up Header & Clear Financial Columns) */}
      {unpaidVehicles.length > 0 && (
        <div className="saaed-card overflow-hidden rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-linear-to-l from-amber-50 via-amber-50/80 to-white px-4 py-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-amber-800"
              >
                <Receipt className="h-4 w-4" />
              </span>
              <div>
                <div className="font-extrabold text-amber-950">
                  مركبات مبيعة ذات مبالغ متبقية للتحصيل ({formatNumber(unpaidVehicles.length)})
                </div>
                <div className="text-[11px] font-medium text-amber-800/85">
                  متابعة المستحقات القائمة وربط التسويات المتبقية بالسجل المالي
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
              <CalendarClock className="h-4 w-4 text-[#C8232C]" aria-hidden="true" />
              <span>جدولة متابعة الذمم</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#e9f1fa] whitespace-nowrap font-extrabold text-[#0A2C52]">
                  <th className="px-3.5 py-2.5">اللوت</th>
                  <th className="px-3.5 py-2.5">المركبة</th>
                  <th className="px-3.5 py-2.5">سعر البيع</th>
                  <th className="px-3.5 py-2.5">المحصل</th>
                  <th className="px-3.5 py-2.5">المتبقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/85">
                {unpaidVehicles.map((v, idx) => (
                  <tr
                    key={v.id}
                    className={`transition-colors hover:bg-amber-50/40 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fbff]'
                    }`}
                  >
                    <td className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-2.5 font-extrabold text-[#0B4F93]">
                      {v.lotNumber}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-900">
                      {v.make} {v.model}
                    </td>
                    <td
                      dir="ltr"
                      className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-2.5 text-right font-semibold text-slate-700"
                    >
                      {formatAED(v.salePrice)}
                    </td>
                    <td
                      dir="ltr"
                      className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-2.5 text-right font-bold text-emerald-700"
                    >
                      {formatAED(v.collectedAmount)}
                    </td>
                    <td
                      dir="ltr"
                      className="font-mono-num tabular-nums whitespace-nowrap px-3.5 py-2.5 text-right font-extrabold text-[#C8232C]"
                    >
                      {formatAED(v.salePrice - v.collectedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaymentDatePickerModal
        isOpen={Boolean(editingPaymentDateRecord)}
        record={editingPaymentDateRecord}
        onClose={() => setEditingPaymentDateRecord(null)}
        onSavePaymentDate={async (targetRecord, newDate) => {
          if (!onUpdateCollectionDate) return;
          try {
            await onUpdateCollectionDate(targetRecord, newDate);
            showToast({
              variant: 'success',
              title: 'تم تحديث تاريخ الدفع بنجاح',
              description: `تم حفظ تاريخ الدفع لعملية التحصيل ${targetRecord.receiptNo} (${targetRecord.bidderName}) إلى ${newDate}.`,
            });
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : 'تعذر حفظ تاريخ الدفع في قاعدة البيانات.';
            showToast({
              variant: 'error',
              title: 'فشل تحديث تاريخ الدفع',
              description: msg,
            });
            throw err;
          }
        }}
      />
    </div>
  );
};
