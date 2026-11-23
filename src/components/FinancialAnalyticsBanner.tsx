import React, { useState } from 'react';
import { BarChart3, Gauge, TrendingUp } from 'lucide-react';
import analyticsBannerImg from '../assets/images/financial_analytics_seamless_1794567167119.jpg';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';
import { formatPercent } from '../utils/uaeDate';
import styles from './SaaedBanner.module.css';

interface FinancialAnalyticsBannerProps {
  saleSuccessRate: number | null;
  collectionRate: number | null;
  variancePercent: number | null;
}

export const FinancialAnalyticsBanner: React.FC<FinancialAnalyticsBannerProps> = ({
  saleSuccessRate,
  collectionRate,
  variancePercent,
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = getBrandLogoUrl();

  return (
    <section
      aria-label="الترويسة البصرية للتحليل المالي ومؤشرات الأداء"
      className={`no-print ${styles.bannerShell}`}
    >
      {/* Top Corporate Crimson & Sky Hairline */}
      <div aria-hidden="true" className={styles.topHairline} />

      {/* Layer 1: Full-Width Luminous Atmospheric Bridge */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.ambientBridgeLayer}>
          <img
            src={analyticsBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className={styles.ambientBridgeImg}
          />
        </div>
      )}

      {/* Layer 2A: Right Visual Stage — Luxury Vehicle Fleet & Ascending Performance Bars */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.stageRight}>
          <div className={styles.stageRightMask}>
            <img
              src={analyticsBannerImg}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className={`${styles.stageImgRight} object-[right_54%]`}
            />
          </div>
        </div>
      )}

      {/* Layer 2B: Left Visual Stage — Glass KPI Monitor, Compass & Financial Coins */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.stageLeft}>
          <div className={styles.stageLeftMask}>
            <img
              src={analyticsBannerImg}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className={`${styles.stageImgLeft} object-[left_48%]`}
            />
          </div>
        </div>
      )}

      {/* Layer 3: Unified Blue Corporate Color Grading & Soft Vignette */}
      <div aria-hidden="true" className={styles.colorGradeOverlay} />

      {/* Layer 4: Center Sapphire Luminous Halo */}
      <div aria-hidden="true" className={styles.centerSapphireHalo} />

      {/* Layer 5: Delicate Ambient Analytics Trajectory Across Center */}
      <svg
        aria-hidden="true"
        viewBox="0 0 800 144"
        preserveAspectRatio="none"
        className={styles.ambientDepthSvg}
      >
        <defs>
          <linearGradient id="anaBridgeArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="28%" stopColor="#7dd3fc" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.35" />
            <stop offset="72%" stopColor="#7dd3fc" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M150,108 Q400,54 650,90"
          fill="none"
          stroke="url(#anaBridgeArc)"
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
                لوحة التحليل المالي التنفيذي ومؤشرات الأداء
              </h3>
              <p className={styles.englishSubtitle}>
                {BRAND_CONFIG.nameEn} Executive Financial Analytics &amp; Auction Performance KPIs
              </p>
            </div>
          </div>

          <div className={styles.metricsRow}>
            <span className="inline-flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5 text-sky-300" />
              <span>نجاح البيع:</span>
              <strong className="font-mono-num tabular-nums text-white">
                {formatPercent(saleSuccessRate, 2)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-emerald-300" />
              <span>كفاءة التحصيل:</span>
              <strong className="font-mono-num tabular-nums text-emerald-300">
                {formatPercent(collectionRate, 2)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-amber-300" />
              <span>فارق التقدير:</span>
              <strong dir="ltr" className="font-mono-num tabular-nums text-amber-200">
                {formatPercent(variancePercent, 2)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Institutional Edge Line */}
      <div aria-hidden="true" className={styles.bottomHairline} />
    </section>
  );
};
