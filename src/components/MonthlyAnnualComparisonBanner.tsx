import React, { useState } from 'react';
import { CalendarDays, CalendarRange, TrendingUp } from 'lucide-react';
import comparisonBannerImg from '../assets/images/monthly_comparison_seamless_1794567166105.jpg';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';
import { formatNumber } from '../utils/uaeDate';
import styles from './SaaedBanner.module.css';

interface MonthlyAnnualComparisonBannerProps {
  year: number;
  activeMonthsCount: number;
  yearsCount: number;
}

export const MonthlyAnnualComparisonBanner: React.FC<MonthlyAnnualComparisonBannerProps> = ({
  year,
  activeMonthsCount,
  yearsCount,
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = getBrandLogoUrl();

  return (
    <section
      aria-label="الترويسة البصرية للمقارنات الشهرية والسنوية"
      className={`no-print ${styles.bannerShell}`}
    >
      {/* Top Corporate Crimson & Sky Hairline */}
      <div aria-hidden="true" className={styles.topHairline} />

      {/* Layer 1: Full-Width Luminous Atmospheric Bridge */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.ambientBridgeLayer}>
          <img
            src={comparisonBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className={styles.ambientBridgeImg}
          />
        </div>
      )}

      {/* Layer 2A: Right Visual Stage — Organized Vehicle Yard & Dubai Twilight Skyline */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.stageRight}>
          <div className={styles.stageRightMask}>
            <img
              src={comparisonBannerImg}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className={`${styles.stageImgRight} object-[right_52%]`}
            />
          </div>
        </div>
      )}

      {/* Layer 2B: Left Visual Stage — Glass Calendar Block & Ascending Time-Series Bars */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.stageLeft}>
          <div className={styles.stageLeftMask}>
            <img
              src={comparisonBannerImg}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className={`${styles.stageImgLeft} object-[left_50%]`}
            />
          </div>
        </div>
      )}

      {/* Layer 3: Unified Blue Corporate Color Grading & Soft Vignette */}
      <div aria-hidden="true" className={styles.colorGradeOverlay} />

      {/* Layer 4: Center Sapphire Luminous Halo */}
      <div aria-hidden="true" className={styles.centerSapphireHalo} />

      {/* Layer 5: Delicate Ambient Time-Series Trend Arc Across Center */}
      <svg
        aria-hidden="true"
        viewBox="0 0 800 144"
        preserveAspectRatio="none"
        className={styles.ambientDepthSvg}
      >
        <defs>
          <linearGradient id="cmpBridgeArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="28%" stopColor="#7dd3fc" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.35" />
            <stop offset="72%" stopColor="#7dd3fc" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M150,108 Q400,52 650,88"
          fill="none"
          stroke="url(#cmpBridgeArc)"
          strokeWidth="1.25"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Layer 6: Centered Institutional HTML Lockup Using Official SAAED Logo */}
      <div className={styles.contentContainer}>
        <div className={styles.lockupStack}>
          <div className={styles.titleRow}>
            {!logoFailed && (
              <div className={styles.logoPlate}>
                <img
                  src={logoSrc}
                  alt={BRAND_CONFIG.logoAlt}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className={styles.logoImg}
                />
              </div>
            )}
            <div className={styles.titleBlock}>
              <h3 className={styles.arabicHeading}>
                تحليل الأداء المالي للمزادات عبر الأشهر والسنوات
              </h3>
              <p className={styles.englishSubtitle}>
                Monthly &amp; Annual Auction Performance Analysis
              </p>
            </div>
          </div>

          <div className={styles.metricsRow}>
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5 text-sky-300" />
              <span>السنة المحددة:</span>
              <strong className="font-mono-num tabular-nums text-white">{year}</strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-300" />
              <span>الأشهر النشطة:</span>
              <strong className="font-mono-num tabular-nums text-emerald-300">
                {formatNumber(activeMonthsCount)} / 12
              </strong>
            </span>
            {yearsCount > 0 && (
              <>
                <span aria-hidden="true" className="text-sky-300/60">
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-300" />
                  <span>السنوات المسجلة:</span>
                  <strong className="font-mono-num tabular-nums text-amber-200">
                    {formatNumber(yearsCount)}
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Institutional Edge Line */}
      <div aria-hidden="true" className={styles.bottomHairline} />
    </section>
  );
};
