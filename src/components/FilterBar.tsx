import React from 'react';
import { Calendar, RotateCcw, Search } from 'lucide-react';
import { Auction, FilterState, VehicleStatus } from '../types';
import { ARABIC_MONTHS, UAE_LOCATIONS } from '../utils/uaeDate';

interface FilterBarProps {
  filter: FilterState;
  auctions: Auction[];
  availableYears: number[];
  onFilterChange: (next: Partial<FilterState>) => void;
  onResetFilter: () => void;
  onApplySearch: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  auctions,
  availableYears,
  onFilterChange,
  onResetFilter,
  onApplySearch,
}) => {
  const periodAuctions = auctions.filter(
    (a) =>
      a.year === filter.year &&
      (filter.month === 'all' || a.month === filter.month) &&
      (filter.location === 'all' || a.location === filter.location)
  );

  return (
    <div className="no-print border-b border-[#cfdceb] bg-[#E8F0F8] px-3 py-2.5 sm:px-5">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Month */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#c3d4e7] bg-white px-2.5 py-1.5 text-xs shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-[#0B4F93]" />
          <span className="font-bold text-slate-600">الشهر:</span>
          <select
            aria-label="تصفية حسب الشهر"
            value={filter.month}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({ month: val === 'all' ? 'all' : Number(val), auctionId: 'all' });
            }}
            className="cursor-pointer bg-transparent font-bold text-[#0A2C52] focus:outline-none"
          >
            <option value="all">جميع الأشهر (سنوي)</option>
            {ARABIC_MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#c3d4e7] bg-white px-2.5 py-1.5 text-xs shadow-2xs">
          <span className="font-bold text-slate-600">السنة:</span>
          <select
            aria-label="تصفية حسب السنة"
            value={filter.year}
            onChange={(e) =>
              onFilterChange({ year: Number(e.target.value), auctionId: 'all' })
            }
            className="font-mono-num cursor-pointer bg-transparent font-bold text-[#0A2C52] focus:outline-none"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#c3d4e7] bg-white px-2.5 py-1.5 text-xs shadow-2xs">
          <span className="font-bold text-slate-600">الموقع:</span>
          <select
            aria-label="تصفية حسب الموقع"
            value={filter.location}
            onChange={(e) => onFilterChange({ location: e.target.value, auctionId: 'all' })}
            className="cursor-pointer bg-transparent font-bold text-[#0A2C52] focus:outline-none"
          >
            <option value="all">الكل</option>
            {UAE_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Auction */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#c3d4e7] bg-white px-2.5 py-1.5 text-xs shadow-2xs">
          <span className="font-bold text-slate-600">المزاد:</span>
          <select
            aria-label="تصفية حسب المزاد"
            value={filter.auctionId}
            onChange={(e) => onFilterChange({ auctionId: e.target.value })}
            className="max-w-[190px] cursor-pointer truncate bg-transparent font-bold text-[#0A2C52] focus:outline-none"
          >
            <option value="all">الكل ({periodAuctions.length})</option>
            {periodAuctions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.auctionCode} - {a.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#c3d4e7] bg-white px-2.5 py-1.5 text-xs shadow-2xs">
          <span className="font-bold text-slate-600">الحالة:</span>
          <select
            aria-label="تصفية حسب حالة المركبة"
            value={filter.status}
            onChange={(e) =>
              onFilterChange({ status: e.target.value as 'all' | VehicleStatus })
            }
            className="cursor-pointer bg-transparent font-bold text-[#0A2C52] focus:outline-none"
          >
            <option value="all">الكل</option>
            <option value="sold">مبيعة</option>
            <option value="unsold">غير مبيعة</option>
            <option value="pending">قيد التحصيل</option>
          </select>
        </div>

        {/* Search & Reset CTA */}
        <div className="mr-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onResetFilter}
            title="إعادة ضبط الفلاتر على الشهر والسنة الحاليين بتوقيت الإمارات"
            className="flex items-center gap-1 rounded-lg border border-[#c3d4e7] bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#0B4F93]" />
            <span>الشهر الحالي</span>
          </button>

          <button
            type="button"
            onClick={onApplySearch}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#cc242d] to-[#a11820] px-5 py-1.5 text-xs font-bold text-white shadow transition hover:from-[#b51d25] hover:to-[#8c131a] whitespace-nowrap"
          >
            <Search className="h-3.5 w-3.5" />
            <span>بحث</span>
          </button>
        </div>
      </div>
    </div>
  );
};
