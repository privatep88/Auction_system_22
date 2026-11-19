import React, { useState } from 'react';
import {
  Archive,
  BarChart3,
  Car,
  Coins,
  FileText,
  Gavel,
  Home,
  Layers,
  PieChart,
  Settings,
  TrendingUp,
  X,
} from 'lucide-react';
import navThumbCars from '../assets/images/nav_thumb_cars_1794561904217.jpg';
import navThumbCoins from '../assets/images/nav_thumb_coins_1794561905690.jpg';
import navThumbDashboard from '../assets/images/nav_thumb_dashboard_1794563337353.jpg';
import navThumbFinancial from '../assets/images/nav_thumb_financial_1794561904162.jpg';
import navThumbGavel from '../assets/images/nav_thumb_gavel_1794561904675.jpg';
import { TabId } from '../types';
import { SidebarDecorativeBackground } from './SidebarDecorativeBackground';

interface NavThumbProps {
  src: string;
  alt: string;
  isActive?: boolean;
}

const NavPhotoThumb: React.FC<NavThumbProps> = ({ src, alt, isActive = false }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div
      aria-hidden="true"
      className={`relative h-7 w-13 shrink-0 overflow-hidden rounded-md ${
        isActive ? 'border border-white/30 bg-[#06224a]/80 shadow-xs' : ''
      }`}
      style={
        isActive
          ? undefined
          : {
              WebkitMaskImage:
                'radial-gradient(ellipse 92% 90% at 50% 50%, black 58%, transparent 100%)',
              maskImage:
                'radial-gradient(ellipse 92% 90% at 50% 50%, black 58%, transparent 100%)',
            }
      }
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover object-center select-none transition-transform duration-200 group-hover:scale-105"
      />
    </div>
  );
};

/* Crisp 3D Glassy Vector Miniatures matching Reference Image 1 */

const Pie3DThumb: React.FC = () => (
  <svg viewBox="0 0 56 32" className="h-7 w-12 shrink-0 drop-shadow-xs" aria-hidden="true">
    <defs>
      <linearGradient id="sbPieBlue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="sbPieGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <ellipse cx="28" cy="24" rx="14" ry="4" fill="#0A3B7A" />
    <ellipse cx="28" cy="17" rx="14" ry="10.5" fill="url(#sbPieBlue)" stroke="#93C5FD" strokeWidth="0.6" />
    <path d="M28 17 L28 6.5 A14 10.5 0 0 1 41.5 19.5 Z" fill="url(#sbPieGold)" />
    <path d="M28 17 L41.5 19.5 A14 10.5 0 0 1 30 27.4 Z" fill="#38BDF8" />
  </svg>
);

const DigitalServicesThumb: React.FC = () => (
  <svg viewBox="0 0 56 32" className="h-7 w-12 shrink-0 drop-shadow-xs" aria-hidden="true">
    <defs>
      <linearGradient id="sbLaptopLid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      <linearGradient id="sbLaptopScreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1D6FD1" />
        <stop offset="100%" stopColor="#07224B" />
      </linearGradient>
      <linearGradient id="sbLaptopBase" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
    </defs>
    {/* Laptop Screen Bezel */}
    <rect x="10" y="3" width="36" height="21" rx="2.5" fill="url(#sbLaptopLid)" stroke="#CBD5E1" strokeWidth="0.6" />
    {/* Screen Display */}
    <rect x="12" y="5" width="32" height="17" rx="1.2" fill="url(#sbLaptopScreen)" />
    {/* Subtle UI Bars & Gear on Screen */}
    <rect x="14.5" y="8" width="6.5" height="2" rx="0.8" fill="#7DD3FC" opacity="0.85" />
    <rect x="14.5" y="11.5" width="4.5" height="1.8" rx="0.8" fill="#38BDF8" opacity="0.6" />
    <rect x="35" y="16" width="6.5" height="2.2" rx="0.8" fill="#FACC15" opacity="0.9" />
    <circle cx="28" cy="13.5" r="4.2" fill="none" stroke="#E0F2FE" strokeWidth="1.6" strokeDasharray="2.5 1.4" />
    <circle cx="28" cy="13.5" r="1.7" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.7" />
    {/* Silver Keyboard Deck / Base */}
    <path
      d="M7 24.2 L49 24.2 L53 28.4 C53.4 28.9 52.9 29.5 52.1 29.5 L3.9 29.5 C3.1 29.5 2.6 28.9 3 28.4 Z"
      fill="url(#sbLaptopBase)"
    />
    <rect x="23" y="24.8" width="10" height="1.2" rx="0.6" fill="#475569" opacity="0.7" />
  </svg>
);

const BarGrowthThumb: React.FC = () => (
  <svg viewBox="0 0 56 32" className="h-7 w-12 shrink-0 drop-shadow-xs" aria-hidden="true">
    <rect x="10" y="19" width="6" height="9" rx="1" fill="#38BDF8" />
    <rect x="19" y="15" width="6" height="13" rx="1" fill="#60A5FA" />
    <rect x="28" y="11" width="6" height="17" rx="1" fill="#F59E0B" />
    <rect x="37" y="7" width="6" height="21" rx="1" fill="#FDE047" />
    <path d="M9 17 L20 11 L29 13 L44 5" fill="none" stroke="#E0F2FE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <polygon points="46,4 40,4 44,9" fill="#E0F2FE" />
  </svg>
);

const Calendar3DThumb: React.FC = () => (
  <svg viewBox="0 0 56 32" className="h-7 w-12 shrink-0 drop-shadow-xs" aria-hidden="true">
    <rect x="11" y="5" width="34" height="23" rx="3" fill="#F8FAFC" stroke="#93C5FD" strokeWidth="1" />
    <rect x="11" y="5" width="34" height="7" rx="3" fill="#1D4ED8" />
    <rect x="17" y="3" width="3" height="4.5" rx="1" fill="#CBD5E1" />
    <rect x="36" y="3" width="3" height="4.5" rx="1" fill="#CBD5E1" />
    <rect x="15" y="15" width="5" height="3.5" rx="0.7" fill="#3B82F6" />
    <rect x="22" y="15" width="5" height="3.5" rx="0.7" fill="#CBD5E1" />
    <rect x="29" y="15" width="5" height="3.5" rx="0.7" fill="#EF4444" />
    <rect x="36" y="15" width="5" height="3.5" rx="0.7" fill="#3B82F6" />
    <rect x="15" y="21" width="5" height="3.5" rx="0.7" fill="#CBD5E1" />
    <rect x="22" y="21" width="5" height="3.5" rx="0.7" fill="#3B82F6" />
    <rect x="29" y="21" width="5" height="3.5" rx="0.7" fill="#CBD5E1" />
    <rect x="36" y="21" width="5" height="3.5" rx="0.7" fill="#10B981" />
  </svg>
);

const ArchiveBindersThumb: React.FC = () => (
  <svg viewBox="0 0 56 32" className="h-7 w-12 shrink-0 drop-shadow-xs" aria-hidden="true">
    <rect x="11" y="5" width="9" height="23" rx="1.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
    <rect x="23" y="5" width="9" height="23" rx="1.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.8" />
    <rect x="35" y="5" width="9" height="23" rx="1.5" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
    <rect x="13" y="8" width="5" height="5" rx="0.6" fill="#0B4F93" />
    <rect x="25" y="8" width="5" height="5" rx="0.6" fill="#C8232C" />
    <rect x="37" y="8" width="5" height="5" rx="0.6" fill="#0B4F93" />
    <circle cx="15.5" cy="22" r="1.6" fill="#475569" />
    <circle cx="27.5" cy="22" r="1.6" fill="#475569" />
    <circle cx="39.5" cy="22" r="1.6" fill="#475569" />
  </svg>
);

const SecurityShieldThumb: React.FC = () => (
  <svg viewBox="0 0 56 32" className="h-7 w-12 shrink-0 drop-shadow-xs" aria-hidden="true">
    <defs>
      <linearGradient id="sbShieldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
    <path
      d="M28 3 L41 7.5 L41 16 C41 22.5 35.5 27 28 29.5 C20.5 27 15 22.5 15 16 L15 7.5 Z"
      fill="url(#sbShieldGrad)"
      stroke="#CBD5E1"
      strokeWidth="0.8"
    />
    <path
      d="M28 5.5 L38 9 L38 15.8 C38 20.8 33.8 24.4 28 26.5 C22.2 24.4 18 20.8 18 15.8 L18 9 Z"
      fill="#0B3B75"
    />
    <circle cx="28" cy="15.5" r="5" fill="#10B981" />
    <path d="M25.5 15.5 L27.3 17.3 L30.8 13.7" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  renderThumb: (isActive: boolean) => React.ReactNode;
}

export const SIDEBAR_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'لوحة المعلومات التنفيذية',
    icon: Home,
    renderThumb: (isActive) => <NavPhotoThumb src={navThumbDashboard} alt="" isActive={isActive} />,
  },
  {
    id: 'financial-report',
    label: 'التقرير المالي للمزاد',
    icon: FileText,
    renderThumb: (isActive) => <NavPhotoThumb src={navThumbFinancial} alt="" isActive={isActive} />,
  },
  {
    id: 'auctions',
    label: 'سجل المزادات',
    icon: Gavel,
    renderThumb: (isActive) => <NavPhotoThumb src={navThumbGavel} alt="" isActive={isActive} />,
  },
  {
    id: 'vehicles',
    label: 'المركبات المعروضة والمبيعة',
    icon: Car,
    renderThumb: (isActive) => <NavPhotoThumb src={navThumbCars} alt="" isActive={isActive} />,
  },
  {
    id: 'collections',
    label: 'التحصيلات المالية',
    icon: Coins,
    renderThumb: (isActive) => <NavPhotoThumb src={navThumbCoins} alt="" isActive={isActive} />,
  },
  {
    id: 'revenue-share',
    label: 'توزيع نسب الإيرادات',
    icon: PieChart,
    renderThumb: () => <Pie3DThumb />,
  },
  {
    id: 'services-fees',
    label: 'رسوم المنصة والخدمات',
    icon: Layers,
    renderThumb: () => <DigitalServicesThumb />,
  },
  {
    id: 'analysis',
    label: 'التحليل المالي ومؤشرات الأداء',
    icon: BarChart3,
    renderThumb: () => <BarGrowthThumb />,
  },
  {
    id: 'comparisons',
    label: 'المقارنات الشهرية والسنوية',
    icon: TrendingUp,
    renderThumb: () => <Calendar3DThumb />,
  },
  {
    id: 'archive',
    label: 'التقارير المعتمدة والأرشيف',
    icon: Archive,
    renderThumb: () => <ArchiveBindersThumb />,
  },
  {
    id: 'settings',
    label: 'الإعدادات والصلاحيات',
    icon: Settings,
    renderThumb: () => <SecurityShieldThumb />,
  },
];

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const navContent = (
    <aside className="saaed-sidebar relative flex h-full min-h-0 w-[264px] flex-1 flex-col overflow-x-hidden overflow-y-auto border-l border-[#1d549c]/45 text-white shadow-xl">
      <div className="relative z-20 shrink-0 pt-2.5 pb-2">
        <div className="mb-2 flex items-center justify-between px-4 lg:hidden">
          <span className="text-xs font-bold text-blue-200">القائمة الرئيسية</span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="إغلاق القائمة"
            className="rounded-md p-1 text-white/80 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="التنقل الرئيسي للنظام" className="space-y-1.5 px-2.5">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const thumb = item.renderThumb(isActive);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`group relative flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-right transition-all duration-150 ${
                  isActive
                    ? 'saaed-nav-active border border-[#f87171]/55 text-white'
                    : 'border border-[#24599f]/55 bg-linear-to-l from-[#072652]/95 via-[#09326a]/90 to-[#06224a]/95 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-[#4b8be0]/80 hover:brightness-110'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 ${
                      isActive ? 'text-white' : 'text-blue-100 group-hover:text-white'
                    }`}
                  />
                  <span className="flex-1 text-center text-[12.5px] font-bold leading-tight text-white">
                    {item.label}
                  </span>
                </div>

                {thumb}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Unified Flexible Institutional Backdrop (Adapts to available space, never covers tabs) */}
      <SidebarDecorativeBackground />
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="no-print hidden min-h-0 shrink-0 lg:flex">{navContent}</div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div className="relative z-10 flex h-full min-h-0">{navContent}</div>
          <div
            onClick={onCloseMobile}
            className="flex-1 bg-slate-950/60 backdrop-blur-[1px]"
          />
        </div>
      )}
    </>
  );
};
