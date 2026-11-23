import React, { useState } from 'react';
import { PenLine } from 'lucide-react';
import gavelWatermarkImg from '../assets/images/sidebar_auction_gavel_1794556796342.jpg';
import vehiclesWatermarkImg from '../assets/images/financial_analytics_seamless_1794567167119.jpg';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  const [logoFailed, setLogoFailed] = useState(false);
  const [gavelFailed, setGavelFailed] = useState(false);
  const [vehiclesFailed, setVehiclesFailed] = useState(false);

  const logoSrc = getBrandLogoUrl();

  return (
    <footer
      aria-label={`تذييل نظام ${BRAND_CONFIG.nameAr} لمزادات المركبات`}
      className={`no-print ${styles.footerRoot}`}
    >
      {/* Top & Bottom Luminous Corporate Hairlines */}
      <div aria-hidden="true" className={styles.topHairline} />
      <div aria-hidden="true" className={styles.bottomGlowLine} />

      {/* Subtle Ambient Sapphire Aura Behind Transparent Left Logo */}
      <div aria-hidden="true" className={styles.logoLeftAura} />

      {/* Cinematic Flowing Waves & Ascending Financial Analytics Watermark */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className={styles.wavesSvg}
      >
        <defs>
          <linearGradient id="saaedFooterWaveLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#1d6fd6" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#05214d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="saaedFooterWaveRight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.24" />
            <stop offset="55%" stopColor="#1d6fd6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#05214d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="saaedFooterRibbonLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
            <stop offset="14%" stopColor="#60a5fa" stopOpacity="0.52" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="86%" stopColor="#60a5fa" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* Left sweeping logo halo curve & gentle horizontal bottom ripple */}
        <path
          d="M0,18 C40,4 115,4 195,28 C335,66 640,48 920,54 C1140,58 1310,36 1440,50 L1440,60 L0,60 Z"
          fill="url(#saaedFooterWaveLeft)"
        />
        <path
          d="M0,52 C220,38 520,58 840,46 C1120,36 1300,52 1440,42 L1440,60 L0,60 Z"
          fill="url(#saaedFooterWaveRight)"
        />
        <path
          d="M8,36 C55,6 130,10 215,32 C370,70 670,46 955,54 C1165,58 1315,36 1438,48"
          fill="none"
          stroke="url(#saaedFooterRibbonLine)"
          strokeWidth="1.25"
        />
      </svg>

      {/* Low-Opacity Blue-Graded Auction Gavel Watermark (Left of Center, clear of Logo & Title) */}
      {!gavelFailed && (
        <div aria-hidden="true" className={styles.gavelWatermarkWrap}>
          <img
            src={gavelWatermarkImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setGavelFailed(true)}
            className={styles.gavelWatermarkImg}
          />
        </div>
      )}

      {/* Low-Opacity Blue-Graded Vehicle Rows Watermark (Right of Center, clear of Text) */}
      {!vehiclesFailed && (
        <div aria-hidden="true" className={styles.vehiclesWatermarkWrap}>
          <img
            src={vehiclesWatermarkImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setVehiclesFailed(true)}
            className={styles.vehiclesWatermarkImg}
          />
        </div>
      )}

      {/* Ascending Financial Growth Bars & Arrow Watermark Near Vehicle Rows */}
      <svg
        aria-hidden="true"
        viewBox="0 0 92 54"
        className="pointer-events-none absolute bottom-1 right-[215px] z-[3] hidden h-12 w-24 opacity-[0.15] lg:block xl:right-[240px]"
      >
        <defs>
          <linearGradient id="footerGrowthBar" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect x="8" y="36" width="11" height="14" rx="1.5" fill="url(#footerGrowthBar)" />
        <rect x="24" y="29" width="11" height="21" rx="1.5" fill="url(#footerGrowthBar)" />
        <rect x="40" y="21" width="11" height="29" rx="1.5" fill="url(#footerGrowthBar)" />
        <rect x="56" y="13" width="11" height="37" rx="1.5" fill="url(#footerGrowthBar)" />
        <path
          d="M6,32 Q38,24 68,6"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M61,5 L69,5.5 L67,13"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Main Three-Zone Content Layout (Physical LTR placement matching Reference Image) */}
      <div
        dir="ltr"
        className="relative z-10 flex min-h-[58px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 md:flex-nowrap md:py-1.5"
      >
        {/* Left Zone: Transparent Official SAHER Logo Directly on Corporate Navy */}
        <div className="order-1 flex shrink-0 items-center">
          {!logoFailed ? (
            <img
              src={logoSrc}
              alt={BRAND_CONFIG.logoAlt}
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
              className="h-10 w-auto max-w-[140px] object-contain brightness-110 contrast-105 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)] sm:h-11 sm:max-w-[160px]"
            />
          ) : (
            <span className="text-sm font-extrabold tracking-wide text-white">
              {BRAND_CONFIG.nameEn} <span className="text-rose-400">{BRAND_CONFIG.nameAr}</span>
            </span>
          )}
        </div>

        {/* Center Zone: Official English Title + Vertical Dividers + Luminous Underline */}
        <div className="order-3 flex w-full flex-1 items-center justify-center gap-5 md:order-2 md:w-auto lg:gap-8">
          <span aria-hidden="true" className={`${styles.verticalDivider} hidden md:block`} />

          <div className="flex flex-col items-center text-center">
            <span
              dir="ltr"
              className="text-[11px] font-semibold tracking-[0.015em] text-white/95 drop-shadow-[0_1px_4px_rgba(2,16,38,0.8)] sm:text-xs lg:text-[13px]"
            >
              {BRAND_CONFIG.systemSubtitleEn}
            </span>
            <span aria-hidden="true" className={styles.centerTitleGlowBar} />
          </div>

          <span aria-hidden="true" className={`${styles.verticalDivider} hidden md:block`} />
        </div>

        {/* Right Zone: Designer Credit in Arabic (RTL) + Small Blue Outline Pen Icon */}
        <div
          dir="rtl"
          className="order-2 flex shrink-0 items-center gap-2 text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(2,16,38,0.8)] md:order-3 lg:text-[13px]"
        >
          <PenLine aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-400" />
          <span className="whitespace-nowrap">إعداد وتصميم: خالد الهاشمي</span>
        </div>
      </div>
    </footer>
  );
};
