import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { FilterState, TabId, UserRole } from '../types';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';
import {
  ARABIC_MONTHS,
  UAE_LOCATIONS,
  getMonthLabel,
  getUaeCurrentDate,
} from '../utils/uaeDate';
import styles from './TopBar.module.css';

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  type: 'info' | 'warning' | 'success';
  targetTab?: TabId;
}

interface TopBarProps {
  filter: FilterState;
  onFilterChange: (next: Partial<FilterState>) => void;
  user: User | null;
  actorName: string;
  activeRole: UserRole;
  isCloudMode: boolean;
  firebaseOnline: boolean;
  hasUnsyncedLocalData: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSyncLocal: () => void;
  onOpenPrintPreview?: () => void;
  onToggleMobileMenu: () => void;
  notifications: NotificationItem[];
  onDismissNotification: (id: string) => void;
  onClearNotifications: () => void;
  onNavigateTab: (tab: TabId) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير النظام',
  finance: 'الإدارة المالية',
  auditor: 'مدقق داخلي',
  viewer: 'مستعرض تنفيذي',
};

export const TopBar: React.FC<TopBarProps> = ({
  filter,
  onFilterChange,
  user,
  actorName,
  activeRole,
  isCloudMode,
  firebaseOnline,
  hasUnsyncedLocalData,
  onSignIn,
  onSignOut,
  onSyncLocal,
  onToggleMobileMenu,
  notifications,
  onDismissNotification,
  onClearNotifications,
  onNavigateTab,
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const logoSrc = getBrandLogoUrl();

  const quickYears = useMemo(() => {
    const currentYear = getUaeCurrentDate().year;
    const set = new Set<number>([
      currentYear - 2,
      currentYear - 1,
      currentYear,
      currentYear + 1,
      filter.year,
    ]);
    return Array.from(set).sort((a, b) => b - a);
  }, [filter.year]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotif(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotif(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const renderPeriodFilterPill = (compact = false) => (
    <div
      className={`${styles.filterPill} ${
        compact ? 'w-full justify-between px-2.5 text-[11px]' : 'gap-2.5 px-3 text-[12.5px]'
      }`}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Calendar className="h-4 w-4 shrink-0 text-[#0B4F93]" />
        <select
          aria-label="الشهر السريع"
          value={filter.month}
          onChange={(e) => {
            const val = e.target.value;
            onFilterChange({ month: val === 'all' ? 'all' : Number(val), auctionId: 'all' });
          }}
          className="cursor-pointer appearance-none bg-transparent pl-1 font-extrabold text-[#07244B] focus:outline-none"
        >
          <option value="all">كل الأشهر</option>
          {ARABIC_MONTHS.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-slate-300/80" />

      <div className="relative flex shrink-0 items-center">
        <select
          aria-label="السنة السريعة"
          value={filter.year}
          onChange={(e) => onFilterChange({ year: Number(e.target.value), auctionId: 'all' })}
          className="font-mono-num tabular-nums cursor-pointer appearance-none bg-transparent pl-5 pr-1 font-extrabold text-[#07244B] focus:outline-none"
        >
          {quickYears.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute left-0 h-3.5 w-3.5 text-[#0A2C52]/80"
        />
      </div>
    </div>
  );

  const renderLocationFilterPill = (compact = false) => (
    <div
      className={`${styles.filterPill} relative ${
        compact ? 'w-full px-2.5 text-[11px]' : 'gap-2 px-3 text-[12.5px]'
      }`}
    >
      <MapPin className="h-4 w-4 shrink-0 text-[#0B4F93]" />
      <select
        aria-label="الموقع السريع"
        value={filter.location}
        onChange={(e) => onFilterChange({ location: e.target.value, auctionId: 'all' })}
        className={`cursor-pointer appearance-none truncate bg-transparent pl-5 font-extrabold text-[#07244B] focus:outline-none ${
          compact ? 'w-full' : 'max-w-[165px] lg:max-w-[195px] xl:max-w-[225px]'
        }`}
      >
        <option value="all">جميع المواقع والساحات</option>
        {UAE_LOCATIONS.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#0A2C52]/80"
      />
    </div>
  );

  return (
    <header className={`no-print ${styles.topbarRoot}`}>
      {/* Clipped Decorative Corporate Waves & Subtle Light Streaks */}
      <div aria-hidden="true" className={styles.backdropClip}>
        <svg
          viewBox="0 0 1440 68"
          preserveAspectRatio="none"
          className={styles.corporateWavesSvg}
        >
          <defs>
            <linearGradient id="saaedTopWaveA" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="45%" stopColor="#1d6fd6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#08306b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="saaedTopWaveB" x1="100%" y1="100%" x2="10%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.24" />
              <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#041838" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,48 C320,16 680,62 1060,24 C1220,10 1340,14 1440,28 L1440,68 L0,68 Z"
            fill="url(#saaedTopWaveA)"
          />
          <path
            d="M0,20 C280,52 640,6 1020,42 C1200,56 1340,42 1440,14 L1440,0 L0,0 Z"
            fill="url(#saaedTopWaveB)"
          />
        </svg>
        <div className={styles.logoAmbientGlow} />
      </div>

      {/* Main Single-Row Top Bar: Right Transparent SAAED Logo | Exact Center Period & Location Buttons | Left Actions & User */}
      <div className="relative z-10 flex h-[50px] w-full items-center justify-between gap-2 px-3 sm:px-5 lg:grid lg:h-[54px] lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4 lg:px-6">
        {/* Right (RTL Start): Mobile Drawer Toggle + Transparent Official SAAED Logo (No White Background) */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:justify-self-start">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="فتح القائمة الجانبية"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dashboard')}
            aria-label={`الانتقال إلى لوحة المؤشرات الرئيسية – ${BRAND_CONFIG.companyNameAr}`}
            className="group relative flex shrink-0 items-center rounded-md py-0.5 transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80"
          >
            {!logoFailed ? (
              <img
                src={logoSrc}
                alt={BRAND_CONFIG.logoAlt}
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-9 w-auto max-w-[132px] object-contain brightness-110 contrast-105 drop-shadow-[0_0_5px_rgba(255,255,255,0.82)] drop-shadow-[0_2px_10px_rgba(125,211,252,0.45)] sm:h-10 sm:max-w-[155px] lg:h-[42px] lg:max-w-[170px]"
              />
            ) : (
              <span className="text-base font-extrabold tracking-tight text-white">
                {BRAND_CONFIG.nameEn} <span className="text-rose-400">{BRAND_CONFIG.nameAr}</span>
              </span>
            )}
          </button>
        </div>

        {/* Exact Center of Top Bar: Period ("نوفمبر 2026") & Locations ("جميع المواقع والساحات") */}
        <div className="hidden min-w-0 items-center justify-center gap-2.5 md:mx-auto md:flex lg:mx-0 lg:justify-self-center lg:gap-3">
          {renderPeriodFilterPill(false)}
          {renderLocationFilterPill(false)}
        </div>

        {/* Left Cluster (RTL End): Sync, Notifications Bell & User Profile */}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:justify-self-end lg:gap-3.5">
            {hasUnsyncedLocalData && (
              <button
                type="button"
                onClick={onSyncLocal}
                className="flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1.5 text-[11px] font-extrabold text-slate-950 shadow-xs transition hover:bg-amber-300 whitespace-nowrap"
              >
                <Cloud className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">مزامنة البيانات</span>
                <span className="xl:hidden">مزامنة</span>
              </button>
            )}

            {/* Notifications Bell */}
            <div ref={notifRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowNotif((prev) => !prev);
                  setShowUserMenu(false);
                }}
                aria-label="الإشعارات والتنبيهات"
                aria-expanded={showNotif}
                className={styles.bellBtn}
              >
                <Bell className="h-5 w-5 fill-white text-white" />
                {notifications.length > 0 && (
                  <span className="font-mono-num tabular-nums absolute top-0.5 left-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-[#051d42] bg-[#DC2626] px-1 text-[10px] font-extrabold leading-none text-white shadow-sm">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute left-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-2xl sm:w-80">
                  <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-[#0A2C52]">
                      إشعارات النظام ({getMonthLabel(filter.month)} {filter.year})
                    </span>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={onClearNotifications}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[#0B4F93] transition hover:bg-red-50 hover:text-[#C8232C]"
                          title="مسح جميع الإشعارات"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>مسح الإشعارات</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotif(false)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      لا توجد إشعارات غير مقروءة حالياً.
                    </div>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="group flex items-start gap-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-right transition hover:bg-blue-50"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onDismissNotification(n.id);
                              if (n.targetTab) onNavigateTab(n.targetTab);
                              setShowNotif(false);
                            }}
                            className="flex min-w-0 flex-1 items-start gap-2 text-right"
                          >
                            {n.type === 'warning' ? (
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            ) : n.type === 'success' ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            ) : (
                              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#0B4F93]" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-800">{n.title}</div>
                              <div className="text-[11px] text-slate-600">{n.detail}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDismissNotification(n.id)}
                            aria-label={`تحديد إشعار "${n.title}" كمقروء وإخفاؤه`}
                            title="تمت القراءة (إخفاء)"
                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-white hover:text-slate-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <span aria-hidden="true" className={`${styles.verticalDivider} hidden sm:block`} />

            {/* User Profile Dropdown (Name + Role on Right, Circular Avatar Ring on Far Left) */}
            <div ref={userMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu((prev) => !prev);
                  setShowNotif(false);
                }}
                aria-expanded={showUserMenu}
                className="flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-1 text-right transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 sm:pr-2"
              >
                <div className="hidden text-left sm:block">
                  <div className="flex items-center justify-end gap-1.5">
                    <ChevronDown className="h-3.5 w-3.5 text-sky-200/85" />
                    <span className="max-w-[130px] truncate text-[12.5px] font-extrabold leading-tight text-white lg:max-w-[165px]">
                      {actorName}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[10.5px] font-medium text-blue-100/85">
                    <span className={isCloudMode ? 'text-emerald-300' : 'text-amber-300'}>
                      {isCloudMode ? 'سحابي' : 'محلي'}
                    </span>
                    <span aria-hidden="true" className="text-sky-300/60">
                      ·
                    </span>
                    <span>{ROLE_LABELS[activeRole]}</span>
                  </div>
                </div>

                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={actorName}
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 shrink-0 rounded-full border-2 border-sky-200/75 object-cover shadow-xs"
                  />
                ) : (
                  <div className={styles.circleIconBtn}>
                    <UserIcon className="h-4.5 w-4.5 text-white" />
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute left-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-2xl">
                  <div className="mb-2 border-b border-slate-100 pb-2">
                    <div className="text-xs font-bold text-[#0A2C52]">{actorName}</div>
                    <div className="text-[11px] text-slate-500">
                      {user?.email || 'جلسة محلية — سجل الدخول للحفظ السحابي الدائم'}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold">
                      {isCloudMode && firebaseOnline ? (
                        <>
                          <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">متصل بقاعدة بيانات Firebase</span>
                        </>
                      ) : (
                        <>
                          <CloudOff className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-amber-700">تخزين محلي مؤقت بالمتصفح</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {user ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSignOut();
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSignIn();
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B4F93] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#083c72]"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>تسجيل الدخول بحساب Google (Firebase)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('settings');
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      إدارة الصلاحيات وسجل التعديلات
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Responsive Mobile/Small-Tablet Filter Strip (shown only below md so filters stay reachable on all viewports) */}
      <div className="relative z-10 grid grid-cols-2 gap-2 border-t border-sky-400/20 px-3 py-2 md:hidden">
        {renderPeriodFilterPill(true)}
        {renderLocationFilterPill(true)}
      </div>

      {/* Luminous Corporate Blue Bottom Border Hairline */}
      <div aria-hidden="true" className={styles.bottomGlowLine} />
    </header>
  );
};
