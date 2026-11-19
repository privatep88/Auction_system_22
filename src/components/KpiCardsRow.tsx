import React, { useState } from 'react';
import {
  Award,
  Car,
  Coins,
  Gavel,
  PackageOpen,
  PieChart,
  Truck,
} from 'lucide-react';
import kpiAuctionGavelImg from '../assets/images/kpi_auction_gavel_1794557321731.jpg';
import kpiCrownVehicleImg from '../assets/images/kpi_crown_vehicle_1794557319833.jpg';
import kpiGoldCoinsImg from '../assets/images/kpi_gold_coins_1794557319735.jpg';
import kpiRecoveryTruckImg from '../assets/images/kpi_recovery_truck_1794557321870.jpg';
import kpiWhiteSuvImg from '../assets/images/kpi_white_suv_1794557320051.jpg';
import kpiForkliftImg from '../assets/images/kpi_yellow_forklift_1794557320622.jpg';
import { ComputedFinancialMetrics, TabId } from '../types';
import { assetUrl, formatNumber } from '../utils/uaeDate';

interface KpiCardsRowProps {
  metrics: ComputedFinancialMetrics;
  onNavigateTab: (tab: TabId) => void;
}

/* Custom rich multi-tone SVG miniatures for icons not rendered as studio photos */
const PriceTagPercentIcon: React.FC = () => (
  <svg viewBox="0 0 64 44" className="h-10 w-14 drop-shadow-2xs" aria-hidden="true">
    <defs>
      <linearGradient id="kpiTagGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="55%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <g transform="translate(8, 3) rotate(-18 24 20)">
      <path
        d="M8 10 L30 10 L44 21 L30 32 L8 32 Q4 32 4 28 L4 14 Q4 10 8 10 Z"
        fill="url(#kpiTagGold)"
        stroke="#B45309"
        strokeWidth="1.2"
      />
      <circle cx="35" cy="21" r="2.8" fill="#FFFFFF" stroke="#B45309" strokeWidth="1" />
      <path d="M44 21 C50 18 52 13 48 9" fill="none" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />
      <text
        x="19"
        y="25.5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="13"
        fontWeight="900"
        fontFamily="Cairo, sans-serif"
      >
        %
      </text>
    </g>
  </svg>
);

const PieShare3DIcon: React.FC = () => (
  <svg viewBox="0 0 64 44" className="h-10 w-14 drop-shadow-2xs" aria-hidden="true">
    <defs>
      <linearGradient id="kpiPieBlue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#0A4585" />
      </linearGradient>
      <linearGradient id="kpiPieRed" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F87171" />
        <stop offset="100%" stopColor="#C8232C" />
      </linearGradient>
    </defs>
    <ellipse cx="32" cy="36" rx="14" ry="3.2" fill="#CBD5E1" opacity="0.55" />
    <circle cx="32" cy="21" r="15" fill="url(#kpiPieBlue)" />
    <path d="M32 21 L32 6 A15 15 0 0 1 46.2 26 Z" fill="url(#kpiPieRed)" stroke="#FFFFFF" strokeWidth="1.4" />
    <circle cx="38" cy="17" r="6.5" fill="url(#kpiPieRed)" opacity="0.92" />
    <text
      x="38"
      y="20.5"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="9.5"
      fontWeight="900"
      fontFamily="Cairo, sans-serif"
    >
      %
    </text>
  </svg>
);

const PlatformLaptopIcon: React.FC = () => (
  <svg viewBox="0 0 64 44" className="h-10 w-14 drop-shadow-2xs" aria-hidden="true">
    <defs>
      <linearGradient id="kpiLaptopScreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#082F5E" />
      </linearGradient>
    </defs>
    <rect x="13" y="6" width="38" height="24" rx="2.5" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />
    <rect x="15.5" y="8.5" width="33" height="19" rx="1" fill="url(#kpiLaptopScreen)" />
    <rect x="18" y="19" width="4" height="6" rx="0.5" fill="#60A5FA" />
    <rect x="24" y="15" width="4" height="10" rx="0.5" fill="#93C5FD" />
    <rect x="30" y="17" width="4" height="8" rx="0.5" fill="#38BDF8" />
    <circle cx="41.5" cy="16.5" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
    <path d="M41.5 16.5 L41.5 12 A4.5 4.5 0 0 1 45.8 18 Z" fill="#FACC15" />
    <path d="M8 31 L56 31 L59 35.5 Q59 37 56 37 L8 37 Q5 37 5 35.5 Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
    <rect x="26" y="32.5" width="12" height="2" rx="1" fill="#94A3B8" />
  </svg>
);

const AdminDocGearIcon: React.FC = () => (
  <svg viewBox="0 0 64 44" className="h-10 w-14 drop-shadow-2xs" aria-hidden="true">
    <rect x="14" y="5" width="26" height="33" rx="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.6" />
    <rect x="18.5" y="10.5" width="14" height="2.4" rx="1.2" fill="#93C5FD" />
    <rect x="18.5" y="16" width="17" height="2.2" rx="1.1" fill="#BFDBFE" />
    <rect x="18.5" y="21.5" width="15" height="2.2" rx="1.1" fill="#BFDBFE" />
    <rect x="18.5" y="27" width="10" height="2.2" rx="1.1" fill="#CBD5E1" />
    <g transform="translate(33, 20)">
      <circle cx="9" cy="9" r="8.5" fill="#EFF6FF" />
      <path
        d="M9 1.5 L10.6 3.5 L13.1 2.8 L13.6 5.3 L16 6.2 L15 8.6 L16.8 10.6 L14.6 12.2 L14.8 14.8 L12.3 15.1 L11.1 17.4 L9 16 L6.9 17.4 L5.7 15.1 L3.2 14.8 L3.4 12.2 L1.2 10.6 L3 8.6 L2 6.2 L4.4 5.3 L4.9 2.8 L7.4 3.5 Z"
        fill="#1D4ED8"
      />
      <circle cx="9" cy="9.5" r="3.2" fill="#FFFFFF" />
    </g>
  </svg>
);

interface StudioThumbProps {
  src: string;
  alt: string;
  FallbackIcon: React.ComponentType<{ className?: string }>;
  blendMultiply?: boolean;
  imgClassName?: string;
}

const StudioThumb: React.FC<StudioThumbProps> = ({
  src,
  alt,
  FallbackIcon,
  blendMultiply = true,
  imgClassName = 'h-10 w-16',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e3eef9] text-[#0B4F93]">
        <FallbackIcon className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${imgClassName} select-none object-contain transition-transform duration-200 group-hover:scale-105 ${
        blendMultiply ? 'mix-blend-multiply' : ''
      }`}
    />
  );
};

interface KpiCardConfig {
  id: string;
  title: string;
  isCurrency?: boolean;
  numericText: string;
  subtext?: string;
  subtextClassName?: string;
  targetTab: TabId;
  valueColor?: string;
  visual: React.ReactNode;
}

export const KpiCardsRow: React.FC<KpiCardsRowProps> = ({ metrics, onNavigateTab }) => {
  const saaedLogoPath = assetUrl('assets/aistudio/logo_1afd1154.png');

  const cards: KpiCardConfig[] = [
    {
      id: 'displayed',
      title: 'عدد المركبات المعروضة',
      numericText: formatNumber(metrics.displayedCount),
      subtext:
        metrics.displayedCount > 0 ? `${formatNumber(metrics.soldCount)} مبيعة` : 'لا توجد مركبات',
      subtextClassName: 'text-slate-600 font-bold',
      targetTab: 'vehicles',
      visual: (
        <StudioThumb
          src={kpiWhiteSuvImg}
          alt="عدد المركبات المعروضة"
          FallbackIcon={Car}
          imgClassName="h-10 w-16"
        />
      ),
    },
    {
      id: 'estimated',
      title: 'القيمة التقديرية الأولية',
      isCurrency: true,
      numericText: formatNumber(metrics.totalEstimatedValue),
      targetTab: 'vehicles',
      visual: <PriceTagPercentIcon />,
    },
    {
      id: 'sale_total',
      title: 'إجمالي قيمة البيع بالمزاد',
      isCurrency: true,
      numericText: formatNumber(metrics.totalSaleValue),
      targetTab: 'financial-report',
      visual: (
        <StudioThumb
          src={kpiAuctionGavelImg}
          alt="إجمالي قيمة البيع بالمزاد"
          FallbackIcon={Gavel}
          imgClassName="h-10 w-14"
        />
      ),
    },
    {
      id: 'highest_vehicle',
      title: 'المركبات الأعلى سعراً',
      isCurrency: true,
      numericText: formatNumber(metrics.highestVehicle ? metrics.highestVehicle.salePrice : 0),
      subtext: metrics.highestVehicle
        ? `${metrics.highestVehicle.make} ${metrics.highestVehicle.model}`
        : '—',
      subtextClassName: 'text-[#0B4F93] font-extrabold',
      targetTab: 'vehicles',
      valueColor: 'text-[#0B4F93]',
      visual: (
        <StudioThumb
          src={kpiCrownVehicleImg}
          alt="المركبات الأعلى سعراً"
          FallbackIcon={Award}
          imgClassName="h-10 w-16"
        />
      ),
    },
    {
      id: 'collected',
      title: 'المبالغ المحصلة من المزايدين',
      isCurrency: true,
      numericText: formatNumber(metrics.totalCollected),
      targetTab: 'collections',
      visual: (
        <StudioThumb
          src={kpiGoldCoinsImg}
          alt="المبالغ المحصلة من المزايدين"
          FallbackIcon={Coins}
          imgClassName="h-10 w-14"
        />
      ),
    },
    {
      id: 'saaed_share',
      title: 'نسبة شركة ساعد من المحصل',
      numericText: `${metrics.saaedSharePercent.toFixed(2)}%`,
      subtext: `AED ${formatNumber(metrics.saaedShareAmount)}`,
      subtextClassName: 'font-mono-num text-[#0B4F93] font-extrabold',
      targetTab: 'revenue-share',
      visual: (
        <StudioThumb
          src={saaedLogoPath}
          alt="شعار شركة ساعد"
          FallbackIcon={PieChart}
          blendMultiply={false}
          imgClassName="h-9 w-20"
        />
      ),
    },
    {
      id: 'third_party_share',
      title: 'نسبة الطرف الثالث من المحصل',
      numericText: `${metrics.thirdPartySharePercent.toFixed(2)}%`,
      subtext: `AED ${formatNumber(metrics.thirdPartyShareAmount)}`,
      subtextClassName: 'font-mono-num text-[#0B4F93] font-extrabold',
      targetTab: 'revenue-share',
      visual: <PieShare3DIcon />,
    },
    {
      id: 'platform_fees',
      title: 'رسوم المنصة للمركبات المبيعة',
      isCurrency: true,
      numericText: formatNumber(metrics.totalPlatformFees),
      targetTab: 'services-fees',
      visual: <PlatformLaptopIcon />,
    },
    {
      id: 'admin_fees',
      title: 'الرسوم الإدارية بعد البيع',
      isCurrency: true,
      numericText: formatNumber(metrics.totalAdminFees),
      targetTab: 'services-fees',
      visual: <AdminDocGearIcon />,
    },
    {
      id: 'recovery_fees',
      title: 'نقل المركبات (ريكفري ساعد)',
      isCurrency: true,
      numericText: formatNumber(metrics.totalRecoveryFees),
      targetTab: 'services-fees',
      visual: (
        <StudioThumb
          src={kpiRecoveryTruckImg}
          alt="نقل المركبات ريكفري ساعد"
          FallbackIcon={Truck}
          imgClassName="h-10 w-16"
        />
      ),
    },
    {
      id: 'forklift_fees',
      title: 'خدمات الفوركلفت المحصلة',
      isCurrency: true,
      numericText: formatNumber(metrics.totalForkliftFees),
      targetTab: 'services-fees',
      visual: (
        <StudioThumb
          src={kpiForkliftImg}
          alt="خدمات الفوركلفت المحصلة"
          FallbackIcon={PackageOpen}
          imgClassName="h-10 w-14"
        />
      ),
    },
  ];

  return (
    <section aria-label="المؤشرات المالية الأساسية للمزاد">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-11">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onNavigateTab(card.targetTab)}
            className="saaed-kpi-card group flex h-full min-w-0 flex-col items-center justify-between rounded-xl px-2 py-2.5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-[#0B4F93] hover:shadow-md"
          >
            {/* Visual Thumbnail Slot */}
            <div className="mb-1.5 flex h-10 w-full items-center justify-center overflow-hidden">
              {card.visual}
            </div>

            {/* Card Title */}
            <div className="flex min-h-[30px] w-full items-center justify-center px-0.5 text-[11px] font-extrabold leading-[1.28] text-[#0A2C52] line-clamp-2">
              {card.title}
            </div>

            {/* Subtle Separator */}
            <div className="my-1 h-px w-8 bg-[#c8d9ec]" />

            {/* Value Display (separated AED + tabular number) */}
            <div
              dir="ltr"
              className={`font-mono-num flex max-w-full items-baseline justify-center gap-1 whitespace-nowrap font-extrabold tracking-tight ${
                card.valueColor || 'text-[#C8232C]'
              }`}
            >
              {card.isCurrency && (
                <span className="text-[10.5px] font-extrabold opacity-90">AED</span>
              )}
              <span className="text-[14px] 2xl:text-[13px] min-[1740px]:text-[14px]">
                {card.numericText}
              </span>
            </div>

            {/* Subtext Slot (aligned rhythm across all 11 cards) */}
            <div className="mt-0.5 flex min-h-[16px] w-full items-center justify-center">
              {card.subtext ? (
                <span
                  dir={card.subtext.startsWith('AED') ? 'ltr' : 'rtl'}
                  className={`max-w-full truncate text-[10px] ${
                    card.subtextClassName || 'font-semibold text-slate-500'
                  }`}
                >
                  {card.subtext}
                </span>
              ) : (
                <span className="text-[10px] opacity-0" aria-hidden="true">
                  —
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
