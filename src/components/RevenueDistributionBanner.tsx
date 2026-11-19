import React, { useState } from 'react';
import revenueBannerImg from '../assets/images/revenue_share_seamless_1794567164146.jpg';
import { assetUrl, formatNumber, formatPercent } from '../utils/uaeDate';
import styles from './SaaedBanner.module.css';

interface RevenueDistributionBannerProps {
  auctionsCount: number;
  saaedSharePercent: number;
  thirdPartySharePercent: number;
}

export const RevenueDistributionBanner: React.FC<RevenueDistributionBannerProps> = ({
  auctionsCount,
  saaedSharePercent,
  thirdPartySharePercent,
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = assetUrl('assets/aistudio/logo_1afd1154.png');
  const safeSaaedPct = Math.min(100, Math.max(0, saaedSharePercent));
  const safeThirdPct = Math.min(100, Math.max(0, thirdPartySharePercent));

  return (
    <section
      aria-label="الترويسة البصرية لتوزيع نسب الإيرادات"
      className={`no-print ${styles.bannerShell}`}
    >
      {/* Top Corporate Crimson & Sky Hairline */}
      <div aria-hidden="true" className={styles.topHairline} />

      {/* Layer 1: Full-Width Luminous Atmospheric Bridge */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.ambientBridgeLayer}>
          <img
            src={revenueBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className={styles.ambientBridgeImg}
          />
        </div>
      )}

      {/* Layer 2A: Right Visual Stage — SAAED Pavilion, UAE Flag & Auction Vehicles */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.stageRight}>
          <div className={styles.stageRightMask}>
            <img
              src={revenueBannerImg}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className={`${styles.stageImgRight} object-[right_52%]`}
            />
          </div>
        </div>
      )}

      {/* Layer 2B: Left Visual Stage — Revenue Share Pie, Coins, Statement & Auction Gavel */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.stageLeft}>
          <div className={styles.stageLeftMask}>
            <img
              src={revenueBannerImg}
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

      {/* Layer 5: Delicate Ambient Depth Lines Linking Financial & Vehicle Sides */}
      <svg
        aria-hidden="true"
        viewBox="0 0 800 144"
        preserveAspectRatio="none"
        className={styles.ambientDepthSvg}
      >
        <defs>
          <linearGradient id="revBridgeArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="28%" stopColor="#7dd3fc" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.35" />
            <stop offset="72%" stopColor="#7dd3fc" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M150,104 Q400,56 650,96"
          fill="none"
          stroke="url(#revBridgeArc)"
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
                  alt="شعار شركة ساعد SAAED"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className={styles.logoImg}
                />
              </div>
            )}
            <div className={styles.titleBlock}>
              <h3 className={styles.arabicHeading}>
                توزيع نسب الإيرادات والشراكة المالية للمزادات
              </h3>
              <p className={styles.englishSubtitle}>
                SAAED &amp; Third-Party Auction Revenue Share Distribution
              </p>
            </div>
          </div>

          <div className={styles.metricsRow}>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-xs bg-sky-400" />
              حصة ساعد:{' '}
              <strong className="font-mono-num tabular-nums text-sky-200">
                {formatPercent(safeSaaedPct, 2)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-xs bg-[#ef4444]" />
              حصة الطرف الثالث:{' '}
              <strong className="font-mono-num tabular-nums text-rose-200">
                {formatPercent(safeThirdPct, 2)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              المزادات:{' '}
              <strong className="font-mono-num tabular-nums text-white">
                {formatNumber(auctionsCount)}
              </strong>
            </span>
          </div>

          {/* Proportional Visual Split Bar */}
          <div
            aria-hidden="true"
            className="flex h-1.5 w-52 overflow-hidden rounded-full bg-white/15 sm:w-64"
          >
            <div
              className="h-full bg-sky-400 transition-all duration-300"
              style={{ width: `${safeSaaedPct}%` }}
            />
            <div
              className="h-full bg-[#ef4444] transition-all duration-300"
              style={{ width: `${safeThirdPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Institutional Edge Line */}
      <div aria-hidden="true" className={styles.bottomHairline} />
    </section>
  );
};
