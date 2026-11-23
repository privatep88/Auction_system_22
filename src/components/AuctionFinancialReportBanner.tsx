import React, { useState } from 'react';
import reportBannerImg from '../assets/images/report_financial_banner_1794564228814.jpg';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';

interface AuctionFinancialReportBannerProps {
  periodLabel: string;
  locationLabel: string;
  auctionTitle?: string;
  auctionCode?: string;
  isDemoMode?: boolean;
}

export const AuctionFinancialReportBanner: React.FC<AuctionFinancialReportBannerProps> = ({
  periodLabel,
  locationLabel,
  auctionTitle,
  auctionCode,
  isDemoMode = false,
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = getBrandLogoUrl();

  return (
    <section
      aria-label="الترويسة البصرية للتقرير المالي للمزاد"
      className="no-print relative h-[138px] w-full overflow-hidden rounded-xl border border-[#1d549c]/45 bg-[#041838] text-white shadow-sm sm:h-[158px] lg:h-[172px]"
      style={{
        background:
          'linear-gradient(90deg, #041634 0%, #072858 38%, #0a3c7c 72%, #051d42 100%)',
      }}
    >
      {/* Top Crimson & Technical Blue Institutional Accent Hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(29,84,156,0.2) 0%, #C8232C 35%, #38bdf8 65%, rgba(29,84,156,0.2) 100%)',
        }}
      />

      {/* Right Visual Scene: Modern SAAED Auction Building + UAE Flag + Illuminated Vehicle Yard */}
      {!bannerFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden sm:w-auto sm:aspect-[16/9]"
          style={{
            WebkitMaskImage: 'linear-gradient(to left, black 64%, rgba(0,0,0,0.65) 80%, transparent 100%)',
            maskImage: 'linear-gradient(to left, black 64%, rgba(0,0,0,0.65) 80%, transparent 100%)',
          }}
        >
          <img
            src={reportBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover object-right select-none"
          />

          {/* Official SAAED Logo Composited Precisely on the Facility's Blank White Roof Fascia */}
          {!logoFailed && (
            <div className="hidden -rotate-[13.5deg] sm:block absolute left-[74%] top-[31.2%] -translate-x-1/2 -translate-y-1/2">
              <img
                src={logoSrc}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-auto w-[50px] object-contain opacity-95 drop-shadow-[0_1px_1px_rgba(4,24,56,0.2)] lg:w-[58px]"
              />
            </div>
          )}
        </div>
      )}

      {/* Left Visual Scene: Wooden Auction Gavel + Subtle Financial Trend Curves */}
      {!bannerFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[235px] overflow-hidden md:block lg:w-[272px]"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, black 58%, rgba(0,0,0,0.45) 78%, transparent 100%)',
            maskImage: 'linear-gradient(to right, black 58%, rgba(0,0,0,0.45) 78%, transparent 100%)',
          }}
        >
          <img
            src={reportBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover object-[8%_78%] select-none"
          />
        </div>
      )}

      {/* Subtle Ambient Financial Grid Texture Across Center Navy Corridor */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 172"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
      >
        <path
          d="M150,136 L220,114 L275,122 L340,86 L405,94 L465,52"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="1.6"
        />
        <circle cx="220" cy="114" r="2.5" fill="#bae6fd" />
        <circle cx="340" cy="86" r="2.5" fill="#bae6fd" />
        <circle cx="465" cy="52" r="2.8" fill="#ffffff" />
      </svg>

      {/* Mobile & Center Contrast Scrim for Guaranteed WCAG AA Text Legibility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 sm:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(4, 24, 56, 0.84) 0%, rgba(7, 37, 82, 0.78) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden sm:block"
        style={{
          background:
            'linear-gradient(90deg, rgba(4, 22, 52, 0.25) 0%, rgba(5, 29, 68, 0.86) 24%, rgba(6, 35, 78, 0.9) 52%, rgba(7, 37, 82, 0.45) 72%, rgba(4, 22, 52, 0.08) 100%)',
        }}
      />

      {/* Centered Institutional Lockup & Report Context (Unboxed, Zero Pill Clutter) */}
      <div className="relative z-10 flex h-full items-center justify-center px-5 text-center sm:pr-[285px] sm:pl-6 md:px-[245px] lg:pr-[315px] lg:pl-[280px]">
        <div className="flex max-w-xl flex-col items-center space-y-2">
          {/* Official White-Backed Emblem Crest + Report Heading */}
          <div className="flex items-center justify-center gap-3">
            {!logoFailed && (
              <div className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-white/95 px-2.5 shadow-sm">
                <img
                  src={logoSrc}
                  alt={BRAND_CONFIG.logoAlt}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="h-6.5 w-auto object-contain"
                />
              </div>
            )}
            <div className="text-right">
              <h3 className="text-sm font-extrabold leading-snug tracking-tight text-white drop-shadow-[0_1px_6px_rgba(4,20,46,0.9)] sm:text-base lg:text-[17px]">
                {auctionTitle
                  ? `التقرير المالي — ${auctionTitle}`
                  : 'البيان المالي التنفيذي لمزادات المركبات'}
              </h3>
              <p className="text-[11px] font-semibold tracking-wide text-blue-100/90 sm:text-xs">
                {BRAND_CONFIG.nameEn} Vehicle Auctions · Official Financial Statement
              </p>
            </div>
          </div>

          {/* Unboxed Typographic Metadata Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-blue-100/95 sm:text-xs">
            <span>الفترة: {periodLabel}</span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>الموقع: {locationLabel}</span>
            {auctionCode && (
              <>
                <span aria-hidden="true" className="text-sky-300/65">
                  ·
                </span>
                <span className="font-mono-num">الرمز: {auctionCode}</span>
              </>
            )}
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>العملة: AED</span>
            {isDemoMode && (
              <>
                <span aria-hidden="true" className="text-amber-300/80">
                  ·
                </span>
                <span className="font-bold text-amber-200">نسخة عرض تجريبية</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Crimson-Blue Accent Strip */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(14,165,233,0.15) 0%, rgba(56,189,248,0.65) 50%, rgba(200,35,44,0.65) 100%)',
        }}
      />
    </section>
  );
};
