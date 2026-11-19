import React, { useState } from 'react';
import { BarChart3, Car, FileSpreadsheet, Gavel, Plus, Upload } from 'lucide-react';
import heroReferencePanoramic from '../assets/images/hero_saaed_dual_flags_v3_1795122279509.jpg';
import { TabId } from '../types';
import styles from './HeroBanner.module.css';

interface HeroBannerProps {
  canEdit: boolean;
  onAddAuction: () => void;
  onAddVehicle: () => void;
  onOpenImport: () => void;
  onOpenPrintPreview: () => void;
  onNavigateTab?: (tab: TabId) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  canEdit,
  onAddAuction,
  onAddVehicle,
  onOpenImport,
  onOpenPrintPreview,
  onNavigateTab,
}) => {
  const [sceneFailed, setSceneFailed] = useState(false);

  return (
    <section className={`no-print ${styles.heroRoot}`}>
      <div className={styles.heroStage}>
        {/* Panoramic Scene Layer: Wooden Gavel & Brass Plaque (Left) + Luxury Car Rows + UAE Flag & SAAED Flag + SAAED Building (Center) */}
        <div aria-hidden="true" className={styles.scenicWrapper}>
          {!sceneFailed ? (
            <img
              src={heroReferencePanoramic}
              alt="مبنى شركة ساعد وعلم الإمارات وعلم شركة ساعد وساحة مزادات المركبات ومطرقة المزاد"
              referrerPolicy="no-referrer"
              onError={() => setSceneFailed(true)}
              className={styles.scenicImage}
            />
          ) : (
            <div className="h-full w-full bg-linear-to-l from-[#04193B] via-[#0A3470] to-[#06224C]" />
          )}
        </div>

        {/* Seamless Right-to-Left Corporate Navy Blend Overlays */}
        <div aria-hidden="true" className={`${styles.navyFadeMobile} lg:hidden`} />
        <div aria-hidden="true" className={`${styles.navyFadeDesktop} hidden lg:block`} />

        {/* Subtle Bottom Vignette behind Action Controls */}
        <div aria-hidden="true" className={styles.bottomVignette} />

        {/* Refined Translucent Corporate Light Curves in Right Navy Zone */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 274"
          preserveAspectRatio="none"
          className={styles.waveOverlaySvg}
        >
          <defs>
            <linearGradient id="saaedHeroArcA" x1="100%" y1="0%" x2="55%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#1d6fd6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#04193b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M840,274 C930,190 1055,155 1200,148 L1200,274 Z"
            fill="url(#saaedHeroArcA)"
          />
          <path
            d="M865,274 C955,200 1075,168 1200,162"
            fill="none"
            stroke="rgba(125, 211, 252, 0.28)"
            strokeWidth="1.25"
          />
        </svg>

        {/* Interactive React Foreground Layer: Right Titles & Executive Icons + Bottom Action Bar */}
        <div className="relative z-10 flex h-full min-h-[184px] flex-col justify-between px-4 py-2.5 sm:min-h-[192px] sm:px-6 lg:min-h-[202px] lg:px-7 lg:py-3 xl:min-h-[212px] 2xl:min-h-[218px]">
          {/* Upper-Right Executive Title Block & 3 Feature Icons */}
          <div className="flex flex-1 items-center justify-start">
            <div className="flex max-w-full flex-col items-start text-right lg:max-w-[40%] xl:max-w-[38%]">
              <h1
                className={`${styles.heroTitle} text-[16px] min-[480px]:text-[18px] sm:text-[19.5px] lg:text-[19px] xl:text-[22px] 2xl:text-[24px]`}
              >
                <span className="block">نظام التقرير المالي والتحليل التنفيذي</span>
                <span className="block">لمزادات المركبات – شركة ساعد</span>
              </h1>
              <p
                className={`${styles.heroSubtitle} mt-0.5 text-[10px] sm:text-[11px] xl:text-[12px]`}
              >
                SAAED Vehicle Auctions – Financial &amp; Executive Analytics System
              </p>

              {/* 3 Executive Vector Icons below Subtitle */}
              <div
                aria-hidden="true"
                className="mt-1.5 hidden items-center gap-3.5 text-white/95 sm:flex"
              >
                <BarChart3 className="h-5.5 w-5.5 drop-shadow-[0_2px_6px_rgba(2,14,36,0.65)] xl:h-6 xl:w-6" />
                <Gavel className="h-5.5 w-5.5 drop-shadow-[0_2px_6px_rgba(2,14,36,0.65)] xl:h-6 xl:w-6" />
                <Car className="h-5.5 w-5.5 drop-shadow-[0_2px_6px_rgba(2,14,36,0.65)] xl:h-6 xl:w-6" />
              </div>
            </div>
          </div>

          {/* Bottom Action Controls Bar (RTL Order: + إضافة مزاد -> + إضافة مركبة -> استيراد Excel/CSV -> تقرير PDF/A4 -> 3 Glass Icon Shortcuts) */}
          <div className="mt-2 flex flex-wrap items-center justify-start gap-1.5 sm:gap-2 lg:mt-0 lg:pl-[185px] xl:pl-[225px]">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={onAddAuction}
                  className={styles.btnPrimaryRed}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>إضافة مزاد</span>
                </button>

                <button
                  type="button"
                  onClick={onAddVehicle}
                  className={styles.btnPrimaryBlue}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>إضافة مركبة</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenImport}
                  className={styles.btnWhiteSurface}
                >
                  <Upload className="h-4 w-4 shrink-0 text-[#0B4F93]" />
                  <span>استيراد Excel / CSV</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onOpenPrintPreview}
              className={styles.btnDarkGlass}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-sky-200" />
              <span>تقرير PDF / A4</span>
            </button>

            {/* 3 Functional Quick-Navigation Glass Icons (matching reference bottom-left icon cluster) */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => onNavigateTab?.('vehicles')}
                title="المركبات المعروضة والمبيعة"
                aria-label="الانتقال إلى المركبات المعروضة والمبيعة"
                className={styles.iconSquareBtn}
              >
                <Car className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab?.('auctions')}
                title="سجل المزادات"
                aria-label="الانتقال إلى سجل المزادات"
                className={styles.iconSquareBtn}
              >
                <Gavel className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab?.('analysis')}
                title="التحليل المالي ومؤشرات الأداء"
                aria-label="الانتقال إلى التحليل المالي ومؤشرات الأداء"
                className={styles.iconSquareBtn}
              >
                <BarChart3 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
