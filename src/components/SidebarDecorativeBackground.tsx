import React, { useState } from 'react';
import sidebarBottomFacilityImg from '../assets/images/sidebar_facility_uae_flag_1794568835315.jpg';
import { assetUrl } from '../utils/uaeDate';

/**
 * Clean, adaptive institutional backdrop for the right sidebar.
 * Strictly follows SAAED_Dashboard_with_UAE_Office_Facade reference:
 *   1. Deep navy-to-royal-blue seamless vertical gradient
 *   2. Luminous cyan upper curves + calm open center featuring ONLY the Official SAAED Logo Watermark (15% opacity)
 *   3. Bottom integrated architectural scene: SAAED facility + Official SAAED Logo on fascia + UAE National Flag on roofline flagpole + symmetrical vehicle rows + luminous cyan bottom waves
 *
 * Middle column contains ZERO standalone flags, gavels, or duplicate vehicle layers.
 */
export const SidebarDecorativeBackground: React.FC = () => {
  const [bottomFailed, setBottomFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const logoSrc = assetUrl('assets/aistudio/logo_1afd1154.png');

  return (
    <div
      aria-hidden="true"
      className="saaed-sidebar-deco pointer-events-none relative flex w-full select-none flex-col justify-between overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #041838 0%, #072c64 28%, #0a428b 56%, #073370 82%, #041b40 100%)',
      }}
    >
      {/* Ambient Radial Center Blue Glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 45% at 50% 38%, rgba(30, 122, 224, 0.24) 0%, rgba(12, 66, 142, 0.1) 56%, rgba(4, 24, 56, 0) 100%)',
        }}
      />

      {/* Top Luminous Cyan Curved Wave Sweeps Below Tab 11 */}
      <svg
        viewBox="0 0 264 136"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-[120px] w-full"
      >
        <defs>
          <linearGradient id="sbCleanTopFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.16" />
            <stop offset="48%" stopColor="#0ea5e9" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#041838" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sbCleanTopStroke" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="30%" stopColor="#7dd3fc" stopOpacity="0.72" />
            <stop offset="68%" stopColor="#e0f2fe" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.08" />
          </linearGradient>
          <filter id="sbCleanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M-8,124 C40,42 130,14 272,6 L272,82 C154,72 60,86 -8,132 Z"
          fill="url(#sbCleanTopFill)"
        />
        <path
          d="M-8,122 C44,44 134,16 270,8"
          fill="none"
          stroke="url(#sbCleanTopStroke)"
          strokeWidth="2.1"
          filter="url(#sbCleanGlow)"
        />
        <path
          d="M16,132 C76,72 162,42 272,24"
          fill="none"
          stroke="url(#sbCleanTopStroke)"
          strokeWidth="1.15"
          opacity="0.48"
        />
      </svg>

      {/* Calm Open Middle Zone: Subtle Monochrome Official SAAED Logo Watermark Only */}
      <div className="saaed-deco-watermark relative z-10 flex min-h-0 flex-1 items-center justify-center px-6 py-4">
        {!logoFailed && (
          <img
            src={logoSrc}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setLogoFailed(true)}
            className="saaed-deco-watermark-img h-auto w-[152px] max-w-full object-contain brightness-0 invert opacity-[0.15] select-none"
          />
        )}
      </div>

      {/* Bottom Integrated Institutional Scene: SAAED Building + Official Logo + UAE Flag on Flagpole + Symmetrical Cars */}
      <div className="saaed-deco-bottom-stage relative z-10 w-full shrink-0 overflow-hidden">
        {/* Aspect-Locked 3:4 Stage Anchored to Bottom for Zero Logo/Flag Alignment Drift */}
        <div
          className="saaed-deco-photo-layer absolute inset-x-0 bottom-0 aspect-[3/4] w-full overflow-hidden"
          style={{
            WebkitMaskImage:
              'linear-gradient(180deg, transparent 0%, transparent 4%, rgba(0,0,0,0.72) 11%, rgba(0,0,0,0.96) 17%, black 26%)',
            maskImage:
              'linear-gradient(180deg, transparent 0%, transparent 4%, rgba(0,0,0,0.72) 11%, rgba(0,0,0,0.96) 17%, black 26%)',
          }}
        >
          {!bottomFailed && (
            <img
              src={sidebarBottomFacilityImg}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBottomFailed(true)}
              className="h-full w-full object-cover object-center opacity-[0.94] saturate-[0.92] contrast-[1.03] select-none"
            />
          )}

          {/* Smooth Sky-to-Navy Upper Integration Wash */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(6, 40, 88, 0.36) 0%, rgba(11, 66, 136, 0.08) 28%, rgba(11, 66, 136, 0.02) 64%, rgba(4, 24, 58, 0.56) 92%, rgba(3, 18, 44, 0.82) 100%)',
            }}
          />

          {/* Official Authentic SAAED Logo Composited Directly on the Building's White Fascia */}
          {!bottomFailed && !logoFailed && (
            <div className="absolute left-[50%] top-[42.7%] -translate-x-1/2 -translate-y-1/2">
              <img
                src={logoSrc}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-auto w-[96px] max-w-full object-contain opacity-[0.96] drop-shadow-[0_1px_2px_rgba(4,24,56,0.2)]"
              />
            </div>
          )}
        </div>

        {/* Continuous Luminous Cyan-Blue Waves Along Bottom Edge */}
        <svg
          viewBox="0 0 264 78"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 z-10 h-[72px] w-full"
        >
          <defs>
            <linearGradient id="sbCleanBottomFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#041e44" stopOpacity="0.16" />
              <stop offset="52%" stopColor="#0f56ad" stopOpacity="0.52" />
              <stop offset="100%" stopColor="#031636" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="sbCleanBottomArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.06" />
              <stop offset="44%" stopColor="#bae6fd" stopOpacity="0.94" />
              <stop offset="82%" stopColor="#38bdf8" stopOpacity="0.64" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          <path
            d="M0,54 C74,40 164,28 264,8 L264,78 L0,78 Z"
            fill="url(#sbCleanBottomFill)"
          />
          <path
            d="M-8,58 C76,46 168,30 270,8"
            fill="none"
            stroke="url(#sbCleanBottomArc)"
            strokeWidth="2.1"
          />
          <path
            d="M-8,70 C86,58 176,44 270,22"
            fill="none"
            stroke="url(#sbCleanBottomArc)"
            strokeWidth="1.2"
            opacity="0.72"
          />
        </svg>
      </div>
    </div>
  );
};
