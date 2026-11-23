import React, { useState } from 'react';
import vehicleInventoryBannerImg from '../assets/images/vehicle_inventory_banner_1794564934550.jpg';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';
import { formatNumber } from '../utils/uaeDate';

interface VehicleInventoryBannerProps {
  displayedCount: number;
  soldCount: number;
  pendingCount: number;
  unsoldCount: number;
}

export const VehicleInventoryBanner: React.FC<VehicleInventoryBannerProps> = ({
  displayedCount,
  soldCount,
  pendingCount,
  unsoldCount,
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = getBrandLogoUrl();

  return (
    <section
      aria-label="الترويسة البصرية للمركبات المعروضة والمبيعة"
      className="no-print relative h-[128px] w-full overflow-hidden rounded-xl border border-[#1d549c]/45 bg-[#041838] text-white shadow-sm sm:h-[144px] lg:h-[156px]"
      style={{
        background:
          'linear-gradient(90deg, #041634 0%, #072858 36%, #0a3c7c 68%, #051d42 100%)',
      }}
    >
      {/* Top Corporate Blue & Crimson Accent Strip */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(29,84,156,0.2) 0%, #C8232C 34%, #38bdf8 66%, rgba(29,84,156,0.2) 100%)',
        }}
      />

      {/* Right Visual Stage: Modern SAAED Auction Pavilion + UAE Flag + Diverse SUVs & Commercial Pickups */}
      {!bannerFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden sm:w-auto sm:aspect-[16/9]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to left, black 64%, rgba(0,0,0,0.58) 82%, transparent 100%)',
            maskImage:
              'linear-gradient(to left, black 64%, rgba(0,0,0,0.58) 82%, transparent 100%)',
          }}
        >
          <img
            src={vehicleInventoryBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover object-right select-none"
          />

          {/* Official SAAED Logo Composited Precisely on the Facility's Blank White Roof Fascia */}
          {!logoFailed && (
            <div className="hidden -rotate-[4.5deg] sm:block absolute left-[64.2%] top-[35.5%] -translate-x-1/2 -translate-y-1/2">
              <img
                src={logoSrc}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-auto w-[42px] object-contain opacity-95 drop-shadow-[0_1px_1px_rgba(4,24,56,0.22)] lg:w-[48px]"
              />
            </div>
          )}
        </div>
      )}

      {/* Left Visual Stage: Foreground Sedan Lanes & Technical Appraisal Silhouettes */}
      {!bannerFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[215px] overflow-hidden md:block lg:w-[258px]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, black 58%, rgba(0,0,0,0.45) 80%, transparent 100%)',
            maskImage:
              'linear-gradient(to right, black 58%, rgba(0,0,0,0.45) 80%, transparent 100%)',
          }}
        >
          <img
            src={vehicleInventoryBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover object-[14%_82%] select-none"
          />
        </div>
      )}

      {/* Mobile & Desktop Scrims for Clear Text Contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 sm:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(4, 24, 56, 0.85) 0%, rgba(7, 37, 82, 0.8) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden sm:block"
        style={{
          background:
            'linear-gradient(90deg, rgba(4, 22, 52, 0.22) 0%, rgba(5, 29, 68, 0.86) 24%, rgba(6, 35, 78, 0.9) 52%, rgba(7, 37, 82, 0.48) 74%, rgba(4, 22, 52, 0.08) 100%)',
        }}
      />

      {/* Centered HTML Content Lockup (Zero Image Text, Full Copy/Selectability) */}
      <div className="relative z-10 flex h-full items-center justify-center px-5 text-center sm:pr-[265px] sm:pl-6 md:px-[230px] lg:pr-[295px] lg:pl-[265px]">
        <div className="flex max-w-xl flex-col items-center space-y-1.5">
          <div className="flex items-center justify-center gap-3">
            {!logoFailed && (
              <div className="flex h-8.5 shrink-0 items-center justify-center rounded-lg bg-white/95 px-2.5 shadow-sm">
                <img
                  src={logoSrc}
                  alt={BRAND_CONFIG.logoAlt}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="h-6 w-auto object-contain"
                />
              </div>
            )}
            <div className="text-right">
              <h3 className="text-sm font-extrabold leading-snug tracking-tight text-white drop-shadow-[0_1px_6px_rgba(4,20,46,0.9)] sm:text-base lg:text-[17px]">
                معرض وسجل المركبات المعروضة والمبيعة
              </h3>
              <p className="text-[11px] font-semibold tracking-wide text-blue-100/90 sm:text-xs">
                {BRAND_CONFIG.nameEn} Vehicle Inventory · Valuation, Bidding &amp; Settlement Ledger
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-blue-100/95 sm:text-xs">
            <span>
              المعروضة بالعرض الحالي:{' '}
              <strong className="font-mono-num tabular-nums">{formatNumber(displayedCount)}</strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              مبيعة:{' '}
              <strong className="font-mono-num tabular-nums text-emerald-300">
                {formatNumber(soldCount)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              قيد التحصيل:{' '}
              <strong className="font-mono-num tabular-nums text-amber-200">
                {formatNumber(pendingCount)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              غير مبيعة:{' '}
              <strong className="font-mono-num tabular-nums text-red-200">
                {formatNumber(unsoldCount)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Accent Line */}
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
