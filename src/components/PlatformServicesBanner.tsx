import React, { useState } from 'react';
import { FileText, Forklift, Monitor, Truck } from 'lucide-react';
import servicesBannerImg from '../assets/images/platform_services_seamless_1794567165789.jpg';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';
import { formatAED, formatNumber } from '../utils/uaeDate';
import styles from './SaaedBanner.module.css';

interface PlatformServicesBannerProps {
  totalServiceFees: number;
  recordsCount: number;
}

export const PlatformServicesBanner: React.FC<PlatformServicesBannerProps> = ({
  totalServiceFees,
  recordsCount,
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = getBrandLogoUrl();

  return (
    <section
      aria-label="الترويسة البصرية لرسوم المنصة والخدمات"
      className={`no-print ${styles.bannerShell}`}
    >
      {/* Top Corporate Crimson & Sky Hairline */}
      <div aria-hidden="true" className={styles.topHairline} />

      {/* Layer 1: Full-Width Luminous Atmospheric Bridge */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.ambientBridgeLayer}>
          <img
            src={servicesBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className={styles.ambientBridgeImg}
          />
        </div>
      )}

      {/* Layer 2A: Right Visual Stage — Yellow Forklift & Recovery Truck Carrying SUV */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.stageRight}>
          <div className={styles.stageRightMask}>
            <img
              src={servicesBannerImg}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className={`${styles.stageImgRight} object-[right_52%]`}
            />
          </div>
        </div>
      )}

      {/* Layer 2B: Left Visual Stage — Digital Auction Platform Screen & Admin Binders */}
      {!bannerFailed && (
        <div aria-hidden="true" className={styles.stageLeft}>
          <div className={styles.stageLeftMask}>
            <img
              src={servicesBannerImg}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              className={`${styles.stageImgLeft} object-[left_54%]`}
            />
          </div>
        </div>
      )}

      {/* Layer 3: Unified Blue Corporate Color Grading & Soft Vignette */}
      <div aria-hidden="true" className={styles.colorGradeOverlay} />

      {/* Layer 4: Center Sapphire Luminous Halo */}
      <div aria-hidden="true" className={styles.centerSapphireHalo} />

      {/* Layer 5: Delicate Ambient Horizon Curve Bridging Digital & Field Operations */}
      <svg
        aria-hidden="true"
        viewBox="0 0 800 144"
        preserveAspectRatio="none"
        className={styles.ambientDepthSvg}
      >
        <defs>
          <linearGradient id="srvBridgeArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="28%" stopColor="#7dd3fc" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.35" />
            <stop offset="72%" stopColor="#7dd3fc" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M150,106 Q400,58 650,94"
          fill="none"
          stroke="url(#srvBridgeArc)"
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
                منظومة رسوم المنصة والخدمات التشغيلية واللوجستية
              </h3>
              <p className={styles.englishSubtitle}>
                {BRAND_CONFIG.nameEn} Digital Platform, Post-Sale Admin, Forklift &amp; Recovery Services
              </p>
            </div>
          </div>

          <div className={styles.metricsRow}>
            <span className="inline-flex items-center gap-1 text-teal-200">
              <Monitor className="h-3.5 w-3.5" />
              <span>المنصة</span>
            </span>
            <span aria-hidden="true" className="text-sky-300/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-amber-200">
              <FileText className="h-3.5 w-3.5" />
              <span>الإدارية</span>
            </span>
            <span aria-hidden="true" className="text-sky-300/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-sky-200">
              <Forklift className="h-3.5 w-3.5" />
              <span>الفوركلفت</span>
            </span>
            <span aria-hidden="true" className="text-sky-300/60">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-rose-200">
              <Truck className="h-3.5 w-3.5" />
              <span>ريكفري {BRAND_CONFIG.nameAr}</span>
            </span>
            <span aria-hidden="true" className="text-sky-300/60">
              |
            </span>
            <span>
              الإجمالي:{' '}
              <strong dir="ltr" className="font-mono-num tabular-nums text-white">
                {formatAED(totalServiceFees)}
              </strong>
            </span>
            {recordsCount > 0 && (
              <>
                <span aria-hidden="true" className="text-sky-300/60">
                  ·
                </span>
                <span>
                  القيود:{' '}
                  <strong className="font-mono-num tabular-nums text-sky-200">
                    {formatNumber(recordsCount)}
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
