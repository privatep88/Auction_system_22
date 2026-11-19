import React, { useState } from 'react';
import collectionsBannerImg from '../assets/images/financial_collections_banner_1794565252180.jpg';
import { assetUrl, formatNumber, formatPercent } from '../utils/uaeDate';

interface FinancialCollectionsBannerProps {
  receiptsCount: number;
  collectionRate: number | null;
  unpaidVehiclesCount: number;
}

export const FinancialCollectionsBanner: React.FC<FinancialCollectionsBannerProps> = ({
  receiptsCount,
  collectionRate,
  unpaidVehiclesCount,
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = assetUrl('assets/aistudio/logo_1afd1154.png');

  return (
    <section
      aria-label="الترويسة البصرية للتحصيلات المالية"
      className="no-print relative h-[116px] w-full overflow-hidden rounded-xl border border-[#1d549c]/45 bg-[#041838] text-white shadow-sm sm:h-[132px] lg:h-[144px]"
      style={{
        background:
          'linear-gradient(90deg, #041634 0%, #072858 36%, #0a3c7c 68%, #051d42 100%)',
      }}
    >
      {/* Top Corporate Blue & Crimson Hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(29,84,156,0.2) 0%, #C8232C 34%, #38bdf8 66%, rgba(29,84,156,0.2) 100%)',
        }}
      />

      {/* Right Visual Stage: Modern Vehicle Auction Yard & UAE Administrative Pavilion */}
      {!bannerFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden sm:w-[270px] lg:w-[325px]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to left, black 62%, rgba(0,0,0,0.48) 82%, transparent 100%)',
            maskImage:
              'linear-gradient(to left, black 62%, rgba(0,0,0,0.48) 82%, transparent 100%)',
          }}
        >
          <img
            src={collectionsBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover object-[86%_56%] select-none"
          />
        </div>
      )}

      {/* Left Visual Stage: Digital Payment Terminal + Receipt Slip + Coins + Small Auction Gavel */}
      {!bannerFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[235px] overflow-hidden md:block lg:w-[275px]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, black 62%, rgba(0,0,0,0.48) 82%, transparent 100%)',
            maskImage:
              'linear-gradient(to right, black 62%, rgba(0,0,0,0.48) 82%, transparent 100%)',
          }}
        >
          <img
            src={collectionsBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover object-[12%_74%] select-none"
          />
        </div>
      )}

      {/* Subtle Ambient Financial Lines Across Center */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 144"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
      >
        <path
          d="M170,114 Q300,68 430,96"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="1.4"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Mobile & Desktop Scrims for High Text Legibility */}
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
            'linear-gradient(90deg, rgba(4, 22, 52, 0.2) 0%, rgba(5, 29, 68, 0.88) 24%, rgba(6, 35, 78, 0.92) 52%, rgba(7, 37, 82, 0.52) 76%, rgba(4, 22, 52, 0.1) 100%)',
        }}
      />

      {/* Centered HTML Institutional Lockup Using Official SAAED Logo */}
      <div className="relative z-10 flex h-full items-center justify-center px-5 text-center sm:pr-[275px] sm:pl-6 md:px-[240px] lg:pr-[330px] lg:pl-[280px]">
        <div className="flex max-w-xl flex-col items-center space-y-1.5">
          <div className="flex items-center justify-center gap-3">
            {!logoFailed && (
              <div className="flex h-8.5 shrink-0 items-center justify-center rounded-lg bg-white/95 px-2.5 shadow-sm">
                <img
                  src={logoSrc}
                  alt="شعار شركة ساعد SAAED"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="h-5.5 w-auto object-contain"
                />
              </div>
            )}
            <div className="text-right">
              <h3 className="text-sm font-extrabold leading-snug tracking-tight text-white drop-shadow-[0_1px_6px_rgba(4,20,46,0.9)] sm:text-base lg:text-[17px]">
                إدارة التحصيلات المالية ومستحقات مزادات المركبات
              </h3>
              <p className="text-[11px] font-semibold tracking-wide text-blue-100/90 sm:text-xs">
                SAAED Vehicle Auction Collections &amp; Payment Management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-blue-100/95 sm:text-xs">
            <span>
              سندات التحصيل:{' '}
              <strong className="font-mono-num tabular-nums">{formatNumber(receiptsCount)}</strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              كفاءة التحصيل:{' '}
              <strong className="font-mono-num tabular-nums text-emerald-300">
                {formatPercent(collectionRate, 2)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              مركبات قيد المتابعة:{' '}
              <strong className="font-mono-num tabular-nums text-amber-200">
                {formatNumber(unpaidVehiclesCount)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Institutional Edge Line */}
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
