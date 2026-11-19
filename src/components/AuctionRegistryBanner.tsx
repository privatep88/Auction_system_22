import React, { useState } from 'react';
import auctionRegistryBannerImg from '../assets/images/auction_registry_banner_1794564774677.jpg';
import { assetUrl, formatNumber } from '../utils/uaeDate';

interface AuctionRegistryBannerProps {
  auctionCount: number;
  approvedCount: number;
  activeCount: number;
  totalVehiclesCount: number;
}

export const AuctionRegistryBanner: React.FC<AuctionRegistryBannerProps> = ({
  auctionCount,
  approvedCount,
  activeCount,
  totalVehiclesCount,
}) => {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = assetUrl('assets/aistudio/logo_1afd1154.png');

  return (
    <section
      aria-label="الترويسة البصرية لسجل المزادات"
      className="no-print relative h-[128px] w-full overflow-hidden rounded-xl border border-[#1d549c]/45 bg-[#041838] text-white shadow-sm sm:h-[144px] lg:h-[156px]"
      style={{
        background:
          'linear-gradient(90deg, #051c42 0%, #093570 32%, #072858 64%, #041634 100%)',
      }}
    >
      {/* Top Technical Blue & Crimson Accent Hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(56,189,248,0.2) 0%, #38bdf8 40%, #C8232C 78%, rgba(29,84,156,0.2) 100%)',
        }}
      />

      {/* Left Visual Scene: SAAED Building + Official Logo + UAE Flag + Organized Vehicle Lanes */}
      {!bannerFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-full overflow-hidden sm:w-auto sm:aspect-[16/9]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, black 64%, rgba(0,0,0,0.6) 82%, transparent 100%)',
            maskImage:
              'linear-gradient(to right, black 64%, rgba(0,0,0,0.6) 82%, transparent 100%)',
          }}
        >
          <img
            src={auctionRegistryBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover object-left select-none"
          />

          {/* Official SAAED Logo Composited Precisely on the Facility's Blank White Roof Sign Band */}
          {!logoFailed && (
            <div className="hidden rotate-[10.5deg] sm:block absolute left-[19.4%] top-[28.4%] -translate-x-1/2 -translate-y-1/2">
              <img
                src={logoSrc}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-auto w-[48px] object-contain opacity-95 drop-shadow-[0_1px_1px_rgba(4,24,56,0.2)] lg:w-[56px]"
              />
            </div>
          )}
        </div>
      )}

      {/* Right Visual Scene: Polished Walnut & Brass Auction Gavel + Digital Registry Grid */}
      {!bannerFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[210px] overflow-hidden md:block lg:w-[250px]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to left, black 62%, rgba(0,0,0,0.45) 82%, transparent 100%)',
            maskImage:
              'linear-gradient(to left, black 62%, rgba(0,0,0,0.45) 82%, transparent 100%)',
          }}
        >
          <img
            src={auctionRegistryBannerImg}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="h-full w-full object-cover object-[90%_72%] select-none"
          />
        </div>
      )}

      {/* Subtle Digital Registry Lines in Center Navy Corridor */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 156"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
      >
        <line x1="180" y1="38" x2="420" y2="38" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="165" y1="118" x2="435" y2="118" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
      </svg>

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
            'linear-gradient(90deg, rgba(4, 22, 52, 0.08) 0%, rgba(7, 37, 82, 0.45) 26%, rgba(6, 35, 78, 0.9) 48%, rgba(5, 29, 68, 0.86) 76%, rgba(4, 22, 52, 0.22) 100%)',
        }}
      />

      {/* Centered Operational Registry Lockup (Selectable HTML Text, Unboxed Metadata) */}
      <div className="relative z-10 flex h-full items-center justify-center px-5 text-center sm:pl-[255px] sm:pr-6 md:px-[225px] lg:pl-[285px] lg:pr-[255px]">
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
                إدارة جلسات مزادات المركبات والساحات المعتمدة
              </h3>
              <p className="text-[11px] font-semibold tracking-wide text-blue-100/90 sm:text-xs">
                SAAED Vehicle Auctions Registry · Live Operations Ledger
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-blue-100/95 sm:text-xs">
            <span>
              الجلسات المسجلة: <strong className="font-mono-num tabular-nums">{formatNumber(auctionCount)}</strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              معتمدة: <strong className="font-mono-num tabular-nums text-emerald-300">{formatNumber(approvedCount)}</strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              نشطة: <strong className="font-mono-num tabular-nums text-sky-200">{formatNumber(activeCount)}</strong>
            </span>
            <span aria-hidden="true" className="text-sky-300/65">
              ·
            </span>
            <span>
              المركبات المرتبطة: <strong className="font-mono-num tabular-nums">{formatNumber(totalVehiclesCount)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Subtle Institutional Border Highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(200,35,44,0.55) 0%, rgba(56,189,248,0.6) 50%, rgba(14,165,233,0.15) 100%)',
        }}
      />
    </section>
  );
};
