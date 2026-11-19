import ExcelJS from 'exceljs';
import {
  ApprovedReport,
  Auction,
  CollectionRecord,
  ComputedFinancialMetrics,
  FilterState,
  MonthlyTrendPoint,
  ServiceFeeRecord,
  SystemSettings,
  Vehicle,
} from '../types';
import { buildAuctionLookupMap, resolveVehicleAuction } from './auctionLink';
import { ARABIC_MONTHS, assetUrl, getMonthLabel, getUaeCurrentDate } from './uaeDate';

const resolveAssetWebUrl = (fileName: string): string => {
  try {
    return new URL(`../assets/images/${fileName}`, import.meta.url).href;
  } catch {
    return assetUrl(`assets/images/${fileName}`);
  }
};

const auctionRegistryBannerUrl = resolveAssetWebUrl('auction_registry_banner_1794564774677.jpg');
const financialAnalyticsBannerUrl = resolveAssetWebUrl('financial_analytics_banner_1794566209396.jpg');
const financialCollectionsBannerUrl = resolveAssetWebUrl('financial_collections_banner_1794565252180.jpg');
const monthlyComparisonBannerUrl = resolveAssetWebUrl('monthly_annual_comparison_banner_1794566508484.jpg');
const platformServicesBannerUrl = resolveAssetWebUrl('platform_services_banner_1794565692794.jpg');
const reportFinancialBannerUrl = resolveAssetWebUrl('report_financial_banner_1794564228814.jpg');
const reportsArchiveBannerUrl = resolveAssetWebUrl('reports_archive_banner_1794566716111.jpg');
const revenueDistributionBannerUrl = resolveAssetWebUrl('revenue_distribution_banner_1794565474783.jpg');
const executiveBannerUrl = resolveAssetWebUrl('saaed_executive_banner_panoramic.jpg');
const vehicleInventoryBannerUrl = resolveAssetWebUrl('vehicle_inventory_banner_1794564934550.jpg');

/* ============================================================================
   1. ExcelThemeManager — SAAED Corporate Identity & Number Formats
============================================================================ */
export type ExcelReportDomain =
  | 'dashboard'
  | 'financial-report'
  | 'auctions'
  | 'vehicles'
  | 'collections'
  | 'revenue-share'
  | 'services-fees'
  | 'analytics'
  | 'comparisons'
  | 'approved-reports'
  | 'template';

export class ExcelThemeManager {
  static readonly COLORS = {
    navyDark: 'FF082A50',
    navyDeep: 'FF051C38',
    corporateBlue: 'FF1762A5',
    softBlueBg: 'FFEAF3FC',
    zebraBlueBg: 'FFF4F8FD',
    white: 'FFFFFFFF',
    crimsonRed: 'FFBD202B',
    crimsonSoftBg: 'FFFEF2F2',
    emeraldGreen: 'FF047857',
    emeraldSoftBg: 'FFECFDF5',
    amberGold: 'FFB45309',
    amberSoftBg: 'FFFFFBEB',
    slateText: 'FF0F172A',
    slateMuted: 'FF475569',
    borderLight: 'FFCBD5E1',
    borderBlue: 'FFB7D1EB',
    headerSubtleBg: 'FFDCEBFA',
    totalRowBg: 'FFE2EEF9',
  } as const;

  static readonly FORMATS = {
    currencyAED: '"AED "#,##0',
    integer: '#,##0',
    percent: '0.00%',
    dateIso: 'yyyy-mm-dd',
    text: '@',
  } as const;

  static font(options?: {
    size?: number;
    bold?: boolean;
    color?: string;
    name?: string;
  }): Partial<ExcelJS.Font> {
    return {
      name: options?.name || 'Cairo',
      size: options?.size ?? 10,
      bold: options?.bold ?? false,
      color: { argb: options?.color || ExcelThemeManager.COLORS.slateText },
      family: 2,
    };
  }

  static fill(argb: string): ExcelJS.FillPattern {
    return {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb },
    };
  }

  static border(color: string = ExcelThemeManager.COLORS.borderLight): Partial<ExcelJS.Borders> {
    const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: color } };
    return {
      top: side,
      bottom: side,
      left: side,
      right: side,
    };
  }

  static headerBorder(): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'medium', color: { argb: ExcelThemeManager.COLORS.navyDark } },
      bottom: { style: 'medium', color: { argb: ExcelThemeManager.COLORS.corporateBlue } },
      left: { style: 'thin', color: { argb: ExcelThemeManager.COLORS.corporateBlue } },
      right: { style: 'thin', color: { argb: ExcelThemeManager.COLORS.corporateBlue } },
    };
  }

  static totalBorder(): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'thin', color: { argb: ExcelThemeManager.COLORS.navyDark } },
      bottom: { style: 'double', color: { argb: ExcelThemeManager.COLORS.navyDark } },
      left: { style: 'thin', color: { argb: ExcelThemeManager.COLORS.borderBlue } },
      right: { style: 'thin', color: { argb: ExcelThemeManager.COLORS.borderBlue } },
    };
  }
}

/* ============================================================================
   2. ExcelImageManager — Embedded Official SAAED Logo, Domain Banners & Charts
============================================================================ */
interface LoadedImageAsset {
  base64: string;
  extension: 'png' | 'jpeg';
}

const DOMAIN_BANNER_PATHS: Record<ExcelReportDomain, { webUrl: string; diskPath: string }> = {
  dashboard: {
    webUrl: executiveBannerUrl,
    diskPath: 'src/assets/images/saaed_executive_banner_panoramic.jpg',
  },
  'financial-report': {
    webUrl: reportFinancialBannerUrl,
    diskPath: 'src/assets/images/report_financial_banner_1794564228814.jpg',
  },
  auctions: {
    webUrl: auctionRegistryBannerUrl,
    diskPath: 'src/assets/images/auction_registry_banner_1794564774677.jpg',
  },
  vehicles: {
    webUrl: vehicleInventoryBannerUrl,
    diskPath: 'src/assets/images/vehicle_inventory_banner_1794564934550.jpg',
  },
  collections: {
    webUrl: financialCollectionsBannerUrl,
    diskPath: 'src/assets/images/financial_collections_banner_1794565252180.jpg',
  },
  'revenue-share': {
    webUrl: revenueDistributionBannerUrl,
    diskPath: 'src/assets/images/revenue_distribution_banner_1794565474783.jpg',
  },
  'services-fees': {
    webUrl: platformServicesBannerUrl,
    diskPath: 'src/assets/images/platform_services_banner_1794565692794.jpg',
  },
  analytics: {
    webUrl: financialAnalyticsBannerUrl,
    diskPath: 'src/assets/images/financial_analytics_banner_1794566209396.jpg',
  },
  comparisons: {
    webUrl: monthlyComparisonBannerUrl,
    diskPath: 'src/assets/images/monthly_annual_comparison_banner_1794566508484.jpg',
  },
  'approved-reports': {
    webUrl: reportsArchiveBannerUrl,
    diskPath: 'src/assets/images/reports_archive_banner_1794566716111.jpg',
  },
  template: {
    webUrl: vehicleInventoryBannerUrl,
    diskPath: 'src/assets/images/vehicle_inventory_banner_1794564934550.jpg',
  },
};

export class ExcelImageManager {
  private static cache = new Map<string, LoadedImageAsset>();

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const sub = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...sub);
    }
    if (typeof btoa === 'function') {
      return btoa(binary);
    }
    return Buffer.from(buffer).toString('base64');
  }

  static async loadAsset(
    cacheKey: string,
    webUrl: string,
    diskRelativePath: string,
    extension: 'png' | 'jpeg'
  ): Promise<LoadedImageAsset | null> {
    const cached = ExcelImageManager.cache.get(cacheKey);
    if (cached) return cached;

    // 1. Browser fetch when running in Vite / GitHub Pages
    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const res = await fetch(webUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 0) {
            const asset: LoadedImageAsset = {
              base64: ExcelImageManager.arrayBufferToBase64(buf),
              extension,
            };
            ExcelImageManager.cache.set(cacheKey, asset);
            return asset;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // 2. Node.js / CLI verification environment fallback
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const fsMod = await import('node:fs');
        const pathMod = await import('node:path');
        const absPath = pathMod.resolve(process.cwd(), diskRelativePath);
        if (fsMod.existsSync(absPath)) {
          const buf = fsMod.readFileSync(absPath);
          const asset: LoadedImageAsset = {
            base64: buf.toString('base64'),
            extension,
          };
          ExcelImageManager.cache.set(cacheKey, asset);
          return asset;
        }
      } catch {
        // Ignore if fs is unavailable
      }
    }

    return null;
  }

  static async loadOfficialLogo(): Promise<LoadedImageAsset | null> {
    return ExcelImageManager.loadAsset(
      'saaed_official_logo',
      assetUrl('assets/aistudio/logo_1afd1154.png'),
      'public/assets/aistudio/logo_1afd1154.png',
      'png'
    );
  }

  static async loadDomainBanner(domain: ExcelReportDomain): Promise<LoadedImageAsset | null> {
    const spec = DOMAIN_BANNER_PATHS[domain] || DOMAIN_BANNER_PATHS.vehicles;
    return ExcelImageManager.loadAsset(
      `saaed_banner_${domain}`,
      spec.webUrl,
      spec.diskPath,
      'jpeg'
    );
  }
}

/* ============================================================================
   3. ExcelPrintConfigurator — Official A4 Print Setup & Footer
============================================================================ */
export class ExcelPrintConfigurator {
  static configureSheetPrint(
    sheet: ExcelJS.Worksheet,
    options: {
      reportTitle: string;
      orientation?: 'portrait' | 'landscape';
      headerRowIndex?: number;
      lastRowIndex: number;
      lastColIndex: number;
    }
  ): void {
    const lastColLetter = ExcelLayoutEngine.colNumberToName(Math.max(1, options.lastColIndex));
    const safeLastRow = Math.max(1, options.lastRowIndex);

    sheet.pageSetup = {
      paperSize: 9, // A4
      orientation: options.orientation || (options.lastColIndex > 8 ? 'landscape' : 'portrait'),
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0, // Never squash hundreds of rows vertically onto a single page
      horizontalCentered: true,
      verticalCentered: false,
      showGridLines: false,
      margins: {
        left: 0.35,
        right: 0.35,
        top: 0.55,
        bottom: 0.55,
        header: 0.25,
        footer: 0.25,
      },
      printArea: `A1:${lastColLetter}${safeLastRow}`,
      ...(options.headerRowIndex
        ? { printTitlesRow: `${options.headerRowIndex}:${options.headerRowIndex}` }
        : {}),
    };

    sheet.headerFooter = {
      differentFirst: false,
      oddHeader: `&R&"Cairo,Bold"&9شركة ساعد للأنظمة المرورية | SAAED&C&"Cairo,Bold"&9${options.reportTitle}&L&"Cairo,Regular"&8&D`,
      oddFooter:
        '&R&"Cairo,Bold"&9شركة ساعد | SAAED&C&"Cairo,Regular"&9إعداد وتصميم: خالد الهاشمي&L&"Cairo,Regular"&9صفحة &P من &N',
    };
  }
}

/* ============================================================================
   4. ExcelLayoutEngine — Adaptive Column Sizing, Corporate Headers & Tables
============================================================================ */
export interface CorporateHeaderMetadata {
  reportTitle: string;
  reportSubtitle: string;
  domain: ExcelReportDomain;
  periodLabel: string;
  locationLabel: string;
  auctionLabel?: string;
  isDemoMode: boolean;
  totalColumns: number;
  extractedAt?: string;
}

export interface ExecutiveKpiCardItem {
  label: string;
  value: number | string;
  format?: 'currency' | 'integer' | 'percent' | 'text';
  formula?: string;
  accent?: 'navy' | 'blue' | 'emerald' | 'crimson' | 'amber';
}

export class ExcelLayoutEngine {
  static colNumberToName(colNum: number): string {
    let n = Math.max(1, Math.floor(colNum));
    let name = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }

  static buildVisualProgressBar(ratio: number, width = 16): string {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
    const filled = Math.round(clamped * width);
    const empty = Math.max(0, width - filled);
    return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${(clamped * 100).toFixed(1)}%`;
  }

  /**
   * Renders the Unified SAAED Institutional Header Block at the top of a worksheet,
   * embedding the official SAAED logo and report-specific panoramic banner.
   * Returns the next available 1-based row index after the header block.
   */
  static async renderCorporateHeader(
    workbook: ExcelJS.Workbook,
    sheet: ExcelJS.Worksheet,
    meta: CorporateHeaderMetadata
  ): Promise<number> {
    const uae = getUaeCurrentDate();
    const extractedTimestamp = meta.extractedAt || uae.formattedDateTime;
    const totalCols = Math.max(6, meta.totalColumns);
    const lastColLetter = ExcelLayoutEngine.colNumberToName(totalCols);

    // Rows 1..4: Main Navy Institutional Banner Block
    for (let r = 1; r <= 4; r++) {
      const row = sheet.getRow(r);
      row.height = r === 1 ? 26 : r === 2 ? 24 : r === 3 ? 20 : 20;
      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c);
        cell.fill = ExcelThemeManager.fill(
          r <= 2 ? ExcelThemeManager.COLORS.navyDark : ExcelThemeManager.COLORS.corporateBlue
        );
      }
    }

    sheet.mergeCells(`A1:${lastColLetter}1`);
    sheet.mergeCells(`A2:${lastColLetter}2`);
    sheet.mergeCells(`A3:${lastColLetter}3`);
    sheet.mergeCells(`A4:${lastColLetter}4`);

    const titleCell1 = sheet.getCell('A1');
    titleCell1.value =
      'نظام التقرير المالي والتحليل التنفيذي لمزادات المركبات – شركة ساعد';
    titleCell1.font = ExcelThemeManager.font({
      size: 14,
      bold: true,
      color: ExcelThemeManager.COLORS.white,
    });
    titleCell1.alignment = { horizontal: 'center', vertical: 'middle' };

    const titleCell2 = sheet.getCell('A2');
    titleCell2.value =
      'SAAED Vehicle Auctions – Financial & Executive Analytics System';
    titleCell2.font = ExcelThemeManager.font({
      size: 10,
      bold: true,
      color: 'FFDCEBFA',
    });
    titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };

    const titleCell3 = sheet.getCell('A3');
    titleCell3.value = `${meta.reportTitle} — ${meta.reportSubtitle}`;
    titleCell3.font = ExcelThemeManager.font({
      size: 12,
      bold: true,
      color: ExcelThemeManager.COLORS.white,
    });
    titleCell3.alignment = { horizontal: 'center', vertical: 'middle' };

    const titleCell4 = sheet.getCell('A4');
    titleCell4.value = `الفترة: ${meta.periodLabel}   |   الموقع / الساحة: ${meta.locationLabel}${
      meta.auctionLabel ? `   |   المزاد: ${meta.auctionLabel}` : ''
    }   |   تاريخ الاستخراج: ${extractedTimestamp}`;
    titleCell4.font = ExcelThemeManager.font({
      size: 9.5,
      bold: true,
      color: ExcelThemeManager.COLORS.white,
    });
    titleCell4.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 5: Data Environment Notice Bar (Demo vs Production)
    const envRow = sheet.getRow(5);
    envRow.height = 22;
    sheet.mergeCells(`A5:${lastColLetter}5`);
    const envCell = sheet.getCell('A5');
    if (meta.isDemoMode) {
      envCell.value =
        'تنبيه بيئة البيانات: بيانات تجريبية — ليست بيانات مالية فعلية (DEMO WORKSPACE – FOR VERIFICATION & PREVIEW ONLY)';
      envCell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.amberSoftBg);
      envCell.font = ExcelThemeManager.font({
        size: 10,
        bold: true,
        color: ExcelThemeManager.COLORS.crimsonRed,
      });
      envCell.border = ExcelThemeManager.border(ExcelThemeManager.COLORS.amberGold);
    } else {
      envCell.value =
        'حالة البيانات: بيانات إنتاجية معتمدة — مستخرجة من السجلات المالية الرسمية لشركة ساعد';
      envCell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.emeraldSoftBg);
      envCell.font = ExcelThemeManager.font({
        size: 10,
        bold: true,
        color: ExcelThemeManager.COLORS.emeraldGreen,
      });
      envCell.border = ExcelThemeManager.border(ExcelThemeManager.COLORS.emeraldGreen);
    }
    envCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Embed Official SAAED Logo & Domain Panoramic Image
    const [logoAsset, bannerAsset] = await Promise.all([
      ExcelImageManager.loadOfficialLogo(),
      ExcelImageManager.loadDomainBanner(meta.domain),
    ]);

    if (logoAsset) {
      const logoImgId = workbook.addImage({
        base64: logoAsset.base64,
        extension: logoAsset.extension,
      });
      sheet.addImage(logoImgId, {
        tl: { col: 0.15, row: 0.15 },
        ext: { width: 135, height: 64 },
        editAs: 'oneCell',
      });
    }

    if (bannerAsset) {
      const bannerImgId = workbook.addImage({
        base64: bannerAsset.base64,
        extension: bannerAsset.extension,
      });
      const targetCol = Math.max(1, totalCols - 2);
      sheet.addImage(bannerImgId, {
        tl: { col: targetCol - 0.85, row: 0.12 },
        ext: { width: 185, height: 68 },
        editAs: 'oneCell',
      });
    }

    // Row 6 spacer
    sheet.getRow(6).height = 8;
    return 7;
  }

  /**
   * Renders a structured Executive KPI Cards block starting at `startRow`.
   * Returns the next available 1-based row index.
   */
  static renderExecutiveKpiGrid(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    sectionTitle: string,
    cards: ExecutiveKpiCardItem[],
    totalColumns: number
  ): number {
    const safeCols = Math.max(6, totalColumns);
    const lastColLetter = ExcelLayoutEngine.colNumberToName(safeCols);

    // Section Banner Row
    const titleRow = sheet.getRow(startRow);
    titleRow.height = 24;
    sheet.mergeCells(`A${startRow}:${lastColLetter}${startRow}`);
    const sectionCell = sheet.getCell(`A${startRow}`);
    sectionCell.value = sectionTitle;
    sectionCell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.navyDark);
    sectionCell.font = ExcelThemeManager.font({
      size: 11,
      bold: true,
      color: ExcelThemeManager.COLORS.white,
    });
    sectionCell.alignment = { horizontal: 'right', vertical: 'middle' };

    let currentRow = startRow + 1;
    const cardsPerRow = Math.min(5, Math.max(2, Math.floor(safeCols / 2)));
    const spanPerCard = Math.max(1, Math.floor(safeCols / cardsPerRow));

    for (let i = 0; i < cards.length; i += cardsPerRow) {
      const rowSlice = cards.slice(i, i + cardsPerRow);
      const labelRow = sheet.getRow(currentRow);
      const valRow = sheet.getRow(currentRow + 1);
      labelRow.height = 19;
      valRow.height = 25;

      rowSlice.forEach((card, cardIdx) => {
        const startCol = cardIdx * spanPerCard + 1;
        const endCol =
          cardIdx === rowSlice.length - 1
            ? safeCols
            : Math.min(safeCols, (cardIdx + 1) * spanPerCard);
        const cStart = ExcelLayoutEngine.colNumberToName(startCol);
        const cEnd = ExcelLayoutEngine.colNumberToName(endCol);

        if (endCol > startCol) {
          sheet.mergeCells(`${cStart}${currentRow}:${cEnd}${currentRow}`);
          sheet.mergeCells(`${cStart}${currentRow + 1}:${cEnd}${currentRow + 1}`);
        }

        const lCell = sheet.getCell(`${cStart}${currentRow}`);
        const vCell = sheet.getCell(`${cStart}${currentRow + 1}`);

        lCell.value = card.label;
        lCell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.softBlueBg);
        lCell.font = ExcelThemeManager.font({
          size: 9.5,
          bold: true,
          color: ExcelThemeManager.COLORS.navyDark,
        });
        lCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        if (card.formula) {
          vCell.value = {
            formula: card.formula,
            result: typeof card.value === 'number' ? card.value : 0,
          };
        } else {
          vCell.value = card.value;
        }

        const valueColor =
          card.accent === 'emerald'
            ? ExcelThemeManager.COLORS.emeraldGreen
            : card.accent === 'crimson'
              ? ExcelThemeManager.COLORS.crimsonRed
              : card.accent === 'amber'
                ? ExcelThemeManager.COLORS.amberGold
                : card.accent === 'blue'
                  ? ExcelThemeManager.COLORS.corporateBlue
                  : ExcelThemeManager.COLORS.navyDark;

        vCell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.white);
        vCell.font = ExcelThemeManager.font({
          size: 11.5,
          bold: true,
          color: valueColor,
        });

        if (card.format === 'currency') {
          vCell.numFmt = ExcelThemeManager.FORMATS.currencyAED;
          vCell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (card.format === 'integer') {
          vCell.numFmt = ExcelThemeManager.FORMATS.integer;
          vCell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (card.format === 'percent') {
          vCell.numFmt = ExcelThemeManager.FORMATS.percent;
          vCell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          vCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }

        for (let col = startCol; col <= endCol; col++) {
          sheet.getRow(currentRow).getCell(col).border = ExcelThemeManager.border(
            ExcelThemeManager.COLORS.borderBlue
          );
          sheet.getRow(currentRow + 1).getCell(col).border = ExcelThemeManager.border(
            ExcelThemeManager.COLORS.borderBlue
          );
        }
      });

      currentRow += 2;
    }

    sheet.getRow(currentRow).height = 10;
    return currentRow + 1;
  }

  /**
   * Automatically computes and applies optimal column widths based on header titles,
   * cell values, number formats, and explicit minimum/maximum bounds so no text or
   * date (`####`) is ever clipped.
   */
  static applyAdaptiveColumnWidths(
    sheet: ExcelJS.Worksheet,
    tableStartRow: number,
    tableEndRow: number,
    columnHeaders: string[],
    minWidths?: Record<number, number>
  ): void {
    columnHeaders.forEach((headerText, idx) => {
      const colIndex = idx + 1;
      let maxChars = Math.max(10, headerText.length + 5);

      const sampleStep =
        tableEndRow - tableStartRow > 400
          ? Math.max(1, Math.floor((tableEndRow - tableStartRow) / 250))
          : 1;

      for (let r = tableStartRow + 1; r <= tableEndRow; r += sampleStep) {
        const cell = sheet.getRow(r).getCell(colIndex);
        const rawVal = cell.value;
        let strLen = 0;

        if (rawVal === null || rawVal === undefined) {
          strLen = 0;
        } else if (typeof rawVal === 'object' && 'result' in rawVal) {
          const res = rawVal.result;
          strLen =
            typeof res === 'number'
              ? `AED ${res.toLocaleString('en-US')}`.length + 4
              : String(res ?? '').length;
        } else if (typeof rawVal === 'number') {
          const isCurrency = (cell.numFmt || '').includes('AED');
          strLen = isCurrency
            ? `AED ${rawVal.toLocaleString('en-US')}`.length + 4
            : String(rawVal).length + 3;
        } else {
          strLen = String(rawVal).length + 3;
        }

        if (strLen > maxChars) {
          maxChars = strLen;
        }
      }

      const explicitMin = minWidths?.[colIndex] ?? 13;
      const computedWidth = Math.min(48, Math.max(explicitMin, Math.ceil(maxChars * 1.18)));
      sheet.getColumn(colIndex).width = computedWidth;
    });
  }
}

/* ============================================================================
   5. ExcelValidationService — Pre/Post Export Data & Formula Integrity Verification
============================================================================ */
export interface ExcelExportValidationReport {
  valid: boolean;
  sheetNames: string[];
  vehicleRowCount: number;
  columnCount: number;
  totalEstimated: number;
  totalSale: number;
  totalCollected: number;
  totalPlatformFees: number;
  totalAdminFees: number;
  totalForkliftFees: number;
  totalRecoveryFees: number;
  embeddedMediaCount: number;
  hasFrozenHeader: boolean;
  hasAutoFilter: boolean;
  hasPrintSetup: boolean;
  emptyUnsoldSaleDatesPreserved: boolean;
  errors: string[];
}

export class ExcelValidationService {
  static validateVehiclesWorkbook(
    workbook: ExcelJS.Workbook,
    expectedVehicles: readonly Vehicle[]
  ): ExcelExportValidationReport {
    const errors: string[] = [];
    const sheetNames = workbook.worksheets.map((ws) => ws.name);

    const dataSheet =
      workbook.getWorksheet('البيانات التفصيلية للمركبات') ||
      workbook.worksheets.find((ws) => ws.name.includes('المركبات')) ||
      workbook.worksheets[0];

    if (!dataSheet) {
      return {
        valid: false,
        sheetNames,
        vehicleRowCount: 0,
        columnCount: 0,
        totalEstimated: 0,
        totalSale: 0,
        totalCollected: 0,
        totalPlatformFees: 0,
        totalAdminFees: 0,
        totalForkliftFees: 0,
        totalRecoveryFees: 0,
        embeddedMediaCount: 0,
        hasFrozenHeader: false,
        hasAutoFilter: false,
        hasPrintSetup: false,
        emptyUnsoldSaleDatesPreserved: false,
        errors: ['لم يتم العثور على ورقة بيانات المركبات داخل ملف Excel.'],
      };
    }

    // Locate the 21-column table header row
    let headerRowNumber = -1;
    let columnCount = 0;
    for (let r = 1; r <= Math.min(35, dataSheet.rowCount); r++) {
      const row = dataSheet.getRow(r);
      const c1 = String(row.getCell(1).value || '').trim();
      const c3 = String(row.getCell(3).value || '').trim();
      if (c1 === 'م' && c3 === 'رقم اللوت') {
        headerRowNumber = r;
        let cols = 0;
        for (let c = 1; c <= 30; c++) {
          if (String(row.getCell(c).value || '').trim()) cols++;
        }
        columnCount = cols;
        break;
      }
    }

    if (headerRowNumber === -1) {
      errors.push('تعذر العثور على صف عناوين الأعمدة الـ 21 في ورقة المركبات.');
    }
    if (columnCount !== 21) {
      errors.push(`عدد الأعمدة الفعلي (${columnCount}) لا يطابق العدد الإلزامي (21 عموداً).`);
    }

    let vehicleRowCount = 0;
    let totalEstimated = 0;
    let totalSale = 0;
    let totalCollected = 0;
    let totalPlatformFees = 0;
    let totalAdminFees = 0;
    let totalForkliftFees = 0;
    let totalRecoveryFees = 0;
    let emptyUnsoldSaleDatesPreserved = true;

    const extractNum = (v: ExcelJS.CellValue): number => {
      if (typeof v === 'number') return v;
      if (v && typeof v === 'object' && 'result' in v && typeof v.result === 'number') {
        return v.result;
      }
      return Number(v || 0);
    };

    if (headerRowNumber > 0) {
      for (let r = headerRowNumber + 1; r <= dataSheet.rowCount; r++) {
        const row = dataSheet.getRow(r);
        const seqVal = row.getCell(1).value;
        if (typeof seqVal !== 'number') break; // Reached summary/total row

        vehicleRowCount += 1;
        totalEstimated += extractNum(row.getCell(13).value);
        totalSale += extractNum(row.getCell(14).value);
        totalCollected += extractNum(row.getCell(15).value);
        totalPlatformFees += extractNum(row.getCell(17).value);
        totalAdminFees += extractNum(row.getCell(18).value);
        totalForkliftFees += extractNum(row.getCell(19).value);
        totalRecoveryFees += extractNum(row.getCell(20).value);

        const statusLabel = String(row.getCell(16).value || '').trim();
        const saleDateCell = String(row.getCell(10).value ?? '').trim();
        const sourceVehicle = expectedVehicles[vehicleRowCount - 1];
        if (sourceVehicle && !sourceVehicle.saleDate && statusLabel === 'غير مبيعة') {
          if (saleDateCell !== '') {
            emptyUnsoldSaleDatesPreserved = false;
          }
        }
      }
    }

    const expEst = expectedVehicles.reduce((s, v) => s + v.estimatedValue, 0);
    const expSale = expectedVehicles.reduce((s, v) => s + v.salePrice, 0);
    const expCol = expectedVehicles.reduce((s, v) => s + v.collectedAmount, 0);
    const expPlat = expectedVehicles.reduce((s, v) => s + v.platformFee, 0);
    const expAdmin = expectedVehicles.reduce((s, v) => s + v.adminFee, 0);
    const expFork = expectedVehicles.reduce((s, v) => s + v.forkliftFee, 0);
    const expRec = expectedVehicles.reduce((s, v) => s + v.recoveryFee, 0);

    if (vehicleRowCount !== expectedVehicles.length) {
      errors.push(
        `عدد سجلات المركبات المصدرة (${vehicleRowCount}) لا يطابق الأصل (${expectedVehicles.length}).`
      );
    }
    if (totalEstimated !== expEst) {
      errors.push(`إجمالي التقديري (${totalEstimated}) لا يطابق الأصل (${expEst}).`);
    }
    if (totalSale !== expSale) {
      errors.push(`إجمالي البيع (${totalSale}) لا يطابق الأصل (${expSale}).`);
    }
    if (totalCollected !== expCol) {
      errors.push(`إجمالي المحصل (${totalCollected}) لا يطابق الأصل (${expCol}).`);
    }
    if (totalPlatformFees !== expPlat || totalAdminFees !== expAdmin || totalForkliftFees !== expFork || totalRecoveryFees !== expRec) {
      errors.push('إجماليات رسوم الخدمات المصدرة لا تطابق السجلات الأصلية.');
    }
    if (!emptyUnsoldSaleDatesPreserved) {
      errors.push('تم العثور على تاريخ افتراضي غير صحيح لمركبة غير مبيعة تاريخها فارغ.');
    }

    const hasFrozenHeader = Boolean(
      dataSheet.views?.some((v) => v.state === 'frozen' && (v.ySplit || 0) >= headerRowNumber)
    );
    const hasAutoFilter = Boolean(dataSheet.autoFilter);
    const hasPrintSetup = Boolean(dataSheet.pageSetup?.printArea);
    const mediaList = (workbook as unknown as { media?: unknown[] }).media || [];
    const embeddedMediaCount = mediaList.length;

    return {
      valid: errors.length === 0,
      sheetNames,
      vehicleRowCount,
      columnCount,
      totalEstimated,
      totalSale,
      totalCollected,
      totalPlatformFees,
      totalAdminFees,
      totalForkliftFees,
      totalRecoveryFees,
      embeddedMediaCount,
      hasFrozenHeader,
      hasAutoFilter,
      hasPrintSetup,
      emptyUnsoldSaleDatesPreserved,
      errors,
    };
  }
}

/* ============================================================================
   6. ExcelExportService — Unified SAAED Enterprise Workbook Builders
============================================================================ */
export const VEHICLE_EXPORT_COLUMNS = [
  'م',
  'بيئة البيانات',
  'رقم اللوت',
  'اسم المزاد',
  'نوع المركبة',
  'الطراز',
  'سنة الصنع',
  'رقم الشاصي',
  'الموقع',
  'تاريخ البيع',
  'الشهر',
  'السنة',
  'القيمة التقديرية (AED)',
  'سعر البيع (AED)',
  'المبلغ المحصل (AED)',
  'الحالة',
  'رسوم المنصة (AED)',
  'الرسوم الإدارية (AED)',
  'رسوم الفوركلفت (AED)',
  'رسوم النقل ريكفري (AED)',
  'المشتري',
] as const;

export class ExcelExportService {
  /**
   * Triggers a clean browser download for an ArrayBuffer `.xlsx` file and releases memory.
   */
  static triggerBrowserDownload(buffer: ExcelJS.Buffer | ArrayBuffer | Uint8Array, safeFileName: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const finalName = safeFileName.endsWith('.xlsx') ? safeFileName : `${safeFileName}.xlsx`;
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = finalName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /**
   * Builds the complete multi-sheet Enterprise Vehicles Workbook (`ExcelJS.Workbook`)
   * preserving all 21 original columns, all 1,250+ records, corporate headers,
   * embedded logo & domain banner, executive summary cards, analytical charts/tables,
   * frozen headers, AutoFilter, and official print setup.
   */
  static async buildVehiclesEnterpriseWorkbook(
    vehicles: readonly Vehicle[],
    options?: {
      isDemoMode?: boolean;
      auctionsById?: ReadonlyMap<string, Auction>;
      periodLabel?: string;
      locationLabel?: string;
    }
  ): Promise<{ workbook: ExcelJS.Workbook; validation: ExcelExportValidationReport }> {
    const isDemoMode = Boolean(options?.isDemoMode || vehicles.some((v) => v.isDemo));
    const auctionsById = options?.auctionsById;

    const firstVeh = vehicles[0];
    const derivedPeriod =
      options?.periodLabel ||
      (firstVeh ? `${ARABIC_MONTHS[(firstVeh.month || 1) - 1]} ${firstVeh.year}` : 'جميع الفترات');
    const uniqueLocations = Array.from(new Set(vehicles.map((v) => v.location).filter(Boolean)));
    const derivedLocation =
      options?.locationLabel ||
      (uniqueLocations.length === 1 ? uniqueLocations[0] : `جميع الساحات (${uniqueLocations.length})`);

    // Aggregate exact live metrics from the exported vehicles list
    const totalDisplayed = vehicles.length;
    const soldVehicles = vehicles.filter((v) => v.status === 'sold');
    const unsoldVehicles = vehicles.filter((v) => v.status === 'unsold');
    const pendingVehicles = vehicles.filter((v) => v.status === 'pending');
    const soldCount = soldVehicles.length;
    const unsoldCount = unsoldVehicles.length;
    const successRatio = totalDisplayed > 0 ? soldCount / totalDisplayed : 0;

    const totalEstimated = vehicles.reduce((s, v) => s + v.estimatedValue, 0);
    const soldEstimated = soldVehicles.reduce((s, v) => s + v.estimatedValue, 0);
    const totalSale = vehicles.reduce((s, v) => s + v.salePrice, 0);
    const totalCollected = vehicles.reduce((s, v) => s + v.collectedAmount, 0);
    const totalRemaining = Math.max(0, totalSale - totalCollected);
    const totalPlatform = vehicles.reduce((s, v) => s + v.platformFee, 0);
    const totalAdmin = vehicles.reduce((s, v) => s + v.adminFee, 0);
    const totalForklift = vehicles.reduce((s, v) => s + v.forkliftFee, 0);
    const totalRecovery = vehicles.reduce((s, v) => s + v.recoveryFee, 0);
    const totalServices = totalPlatform + totalAdmin + totalForklift + totalRecovery;

    const linkedAuctionIds = new Set(
      vehicles
        .map((v) => v.auctionId)
        .filter((id) => Boolean(id) && id !== 'general_auction')
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'شركة ساعد للأنظمة المرورية | خالد الهاشمي';
    workbook.lastModifiedBy = 'SAAED Enterprise Excel Reporting Engine';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;

    /* ========================================================================
       SHEET 1: البيانات التفصيلية للمركبات (All 21 Original Columns + Header + KPIs)
       Placed first so any spreadsheet reader or round-trip importer immediately
       sees the complete 21-column dataset while also providing the Executive
       Dashboard & Charts on Sheet 2 and Auction/Service Breakdown on Sheet 3.
    ======================================================================== */
    const dataSheet = workbook.addWorksheet('البيانات التفصيلية للمركبات', {
      views: [{ rightToLeft: true }],
      properties: { tabColor: { argb: ExcelThemeManager.COLORS.navyDark }, defaultRowHeight: 20 },
    });

    const nextRowAfterHeader = await ExcelLayoutEngine.renderCorporateHeader(workbook, dataSheet, {
      reportTitle: 'سجل المركبات المعروضة والمبيعة التفصيلي',
      reportSubtitle: 'شامل المعرّف، اسم المزاد، التقييم، سعر البيع، التحصيل، ورسوم الخدمات',
      domain: 'vehicles',
      periodLabel: derivedPeriod,
      locationLabel: derivedLocation,
      isDemoMode,
      totalColumns: 21,
    });

    const tableHeaderRowIdx = ExcelLayoutEngine.renderExecutiveKpiGrid(
      dataSheet,
      nextRowAfterHeader,
      'الملخص التنفيذي لمؤشرات المركبات المعروضة والمبيعة',
      [
        {
          label: 'عدد المركبات المعروضة',
          value: totalDisplayed,
          format: 'integer',
          accent: 'navy',
        },
        {
          label: 'عدد المركبات المبيعة',
          value: soldCount,
          format: 'integer',
          accent: 'emerald',
        },
        {
          label: 'عدد المركبات غير المبيعة',
          value: unsoldCount,
          format: 'integer',
          accent: 'crimson',
        },
        {
          label: 'نسبة نجاح البيع',
          value: successRatio,
          format: 'percent',
          accent: 'blue',
        },
        {
          label: 'عدد المزادات المرتبطة',
          value: linkedAuctionIds.size,
          format: 'integer',
          accent: 'navy',
        },
        {
          label: 'إجمالي القيمة التقديرية',
          value: totalEstimated,
          format: 'currency',
          accent: 'blue',
        },
        {
          label: 'إجمالي قيمة البيع الفعلي',
          value: totalSale,
          format: 'currency',
          accent: 'crimson',
        },
        {
          label: 'إجمالي المبالغ المحصلة',
          value: totalCollected,
          format: 'currency',
          accent: 'emerald',
        },
        {
          label: 'المبالغ المتبقية للتحصيل',
          value: totalRemaining,
          format: 'currency',
          accent: 'amber',
        },
        {
          label: 'إجمالي رسوم الخدمات',
          value: totalServices,
          format: 'currency',
          accent: 'navy',
        },
      ],
      21
    );

    // Table Header Row (21 Columns)
    const headerRow = dataSheet.getRow(tableHeaderRowIdx);
    headerRow.height = 28;
    VEHICLE_EXPORT_COLUMNS.forEach((colTitle, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = colTitle;
      cell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.navyDark);
      cell.font = ExcelThemeManager.font({
        size: 10,
        bold: true,
        color: ExcelThemeManager.COLORS.white,
      });
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = ExcelThemeManager.headerBorder();
    });

    const firstDataRowIdx = tableHeaderRowIdx + 1;

    // Populate all vehicle rows (100% lossless across all 21 columns)
    vehicles.forEach((v, index) => {
      const rowNumber = firstDataRowIdx + index;
      const row = dataSheet.getRow(rowNumber);
      row.height = 21;

      const auctionName = auctionsById
        ? resolveVehicleAuction(v, auctionsById).label
        : v.auctionId && v.auctionId.trim() && v.auctionId !== 'general_auction'
          ? v.auctionId
          : 'غير مرتبط بمزاد';

      const statusText =
        v.status === 'sold' ? 'مبيعة' : v.status === 'pending' ? 'قيد التحصيل' : 'غير مبيعة';

      const envLabel =
        isDemoMode || v.isDemo ? 'بيانات تجريبية (Demo – ليست فعلية)' : 'إنتاج فعلي';

      // Preserve empty saleDate for unsold vehicles without injecting a fake date
      const cleanSaleDate = v.saleDate ? String(v.saleDate).trim() : '';

      const values: (string | number)[] = [
        index + 1, // 1: م
        envLabel, // 2: بيئة البيانات
        String(v.lotNumber || ''), // 3: رقم اللوت
        auctionName, // 4: اسم المزاد
        v.make, // 5: نوع المركبة
        v.model, // 6: الطراز
        v.modelYear, // 7: سنة الصنع
        v.vin ? String(v.vin) : '', // 8: رقم الشاصي
        v.location, // 9: الموقع
        cleanSaleDate, // 10: تاريخ البيع
        v.month, // 11: الشهر
        v.year, // 12: السنة
        v.estimatedValue, // 13: القيمة التقديرية (AED)
        v.salePrice, // 14: سعر البيع (AED)
        v.collectedAmount, // 15: المبلغ المحصل (AED)
        statusText, // 16: الحالة
        v.platformFee, // 17: رسوم المنصة (AED)
        v.adminFee, // 18: الرسوم الإدارية (AED)
        v.forkliftFee, // 19: رسوم الفوركلفت (AED)
        v.recoveryFee, // 20: رسوم النقل ريكفري (AED)
        v.buyerName || '', // 21: المشتري
      ];

      const rowBg =
        index % 2 === 0 ? ExcelThemeManager.COLORS.white : ExcelThemeManager.COLORS.zebraBlueBg;

      values.forEach((val, colIdx) => {
        const colNum = colIdx + 1;
        const cell = row.getCell(colNum);
        cell.value = val;
        cell.fill = ExcelThemeManager.fill(rowBg);
        cell.border = ExcelThemeManager.border();
        cell.font = ExcelThemeManager.font({ size: 9.5, bold: false });

        // Column-specific formatting & alignment
        if (colNum === 1 || colNum === 7 || colNum === 11 || colNum === 12) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum === 3) {
          // Lot Number — highlighted in Corporate Blue, preserved as text
          cell.numFmt = ExcelThemeManager.FORMATS.text;
          cell.font = ExcelThemeManager.font({
            size: 9.5,
            bold: true,
            color: ExcelThemeManager.COLORS.corporateBlue,
          });
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum === 8) {
          // VIN preserved as text
          cell.numFmt = ExcelThemeManager.FORMATS.text;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum === 10) {
          // Sale Date YYYY-MM-DD
          cell.numFmt = ExcelThemeManager.FORMATS.dateIso;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if ([13, 14, 15, 17, 18, 19, 20].includes(colNum)) {
          // Financial AED Columns — real numbers with AED format
          cell.numFmt = ExcelThemeManager.FORMATS.currencyAED;
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (colNum === 14) {
            cell.font = ExcelThemeManager.font({
              size: 9.5,
              bold: true,
              color: ExcelThemeManager.COLORS.crimsonRed,
            });
          } else if (colNum === 15) {
            cell.font = ExcelThemeManager.font({
              size: 9.5,
              bold: true,
              color: ExcelThemeManager.COLORS.emeraldGreen,
            });
          }
        } else if (colNum === 16) {
          // Vehicle Status badge styling
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          if (v.status === 'sold') {
            cell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.emeraldSoftBg);
            cell.font = ExcelThemeManager.font({
              size: 9.5,
              bold: true,
              color: ExcelThemeManager.COLORS.emeraldGreen,
            });
          } else if (v.status === 'pending') {
            cell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.amberSoftBg);
            cell.font = ExcelThemeManager.font({
              size: 9.5,
              bold: true,
              color: ExcelThemeManager.COLORS.amberGold,
            });
          } else {
            cell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.crimsonSoftBg);
            cell.font = ExcelThemeManager.font({
              size: 9.5,
              bold: true,
              color: ExcelThemeManager.COLORS.crimsonRed,
            });
          }
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
          if (colNum === 4 || colNum === 5) {
            cell.font = ExcelThemeManager.font({
              size: 9.5,
              bold: true,
              color: ExcelThemeManager.COLORS.navyDark,
            });
          }
        }
      });
    });

    const lastDataRowIdx = Math.max(firstDataRowIdx, firstDataRowIdx + vehicles.length - 1);
    const totalRowIdx = lastDataRowIdx + 1;

    if (vehicles.length > 0) {
      const totalRow = dataSheet.getRow(totalRowIdx);
      totalRow.height = 25;

      for (let c = 1; c <= 21; c++) {
        const cell = totalRow.getCell(c);
        cell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.totalRowBg);
        cell.border = ExcelThemeManager.totalBorder();
        cell.font = ExcelThemeManager.font({
          size: 10,
          bold: true,
          color: ExcelThemeManager.COLORS.navyDark,
        });
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      totalRow.getCell(2).value = 'الإجمالي العام للسجلات';
      totalRow.getCell(3).value = `${totalDisplayed} مركبة`;
      totalRow.getCell(4).value = `${soldCount} مبيعة / ${unsoldCount} غير مبيعة`;

      const sumColumns: Array<{ col: number; sum: number; color?: string }> = [
        { col: 13, sum: totalEstimated, color: ExcelThemeManager.COLORS.corporateBlue },
        { col: 14, sum: totalSale, color: ExcelThemeManager.COLORS.crimsonRed },
        { col: 15, sum: totalCollected, color: ExcelThemeManager.COLORS.emeraldGreen },
        { col: 17, sum: totalPlatform },
        { col: 18, sum: totalAdmin },
        { col: 19, sum: totalForklift },
        { col: 20, sum: totalRecovery },
      ];

      sumColumns.forEach(({ col, sum, color }) => {
        const colLetter = ExcelLayoutEngine.colNumberToName(col);
        const cell = totalRow.getCell(col);
        cell.value = {
          formula: `SUM(${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`,
          result: sum,
        };
        cell.numFmt = ExcelThemeManager.FORMATS.currencyAED;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (color) {
          cell.font = ExcelThemeManager.font({ size: 10, bold: true, color });
        }
      });
    }

    // Freeze panes below table header & enable AutoFilter across all 21 columns
    dataSheet.views = [
      {
        rightToLeft: true,
        state: 'frozen',
        xSplit: 0,
        ySplit: tableHeaderRowIdx,
        topLeftCell: `A${tableHeaderRowIdx + 1}`,
      },
    ];

    dataSheet.autoFilter = {
      from: { row: tableHeaderRowIdx, column: 1 },
      to: { row: lastDataRowIdx, column: 21 },
    };

    ExcelLayoutEngine.applyAdaptiveColumnWidths(
      dataSheet,
      tableHeaderRowIdx,
      totalRowIdx,
      [...VEHICLE_EXPORT_COLUMNS],
      {
        1: 8,
        2: 28,
        3: 18,
        4: 38,
        5: 16,
        6: 18,
        7: 12,
        8: 22,
        9: 22,
        10: 15,
        11: 9,
        12: 10,
        13: 20,
        14: 20,
        15: 20,
        16: 15,
        17: 18,
        18: 18,
        19: 18,
        20: 20,
        21: 24,
      }
    );

    ExcelPrintConfigurator.configureSheetPrint(dataSheet, {
      reportTitle: 'سجل المركبات المعروضة والمبيعة التفصيلي',
      orientation: 'landscape',
      headerRowIndex: tableHeaderRowIdx,
      lastRowIndex: totalRowIdx,
      lastColIndex: 21,
    });

    /* ========================================================================
       SHEET 2: التقرير التنفيذي والمخططات (Executive Summary & Visual Analytics)
    ======================================================================== */
    const execSheet = workbook.addWorksheet('التقرير التنفيذي والمخططات', {
      views: [{ rightToLeft: true }],
      properties: {
        tabColor: { argb: ExcelThemeManager.COLORS.corporateBlue },
        defaultRowHeight: 21,
      },
    });

    let execCursor = await ExcelLayoutEngine.renderCorporateHeader(workbook, execSheet, {
      reportTitle: 'التقرير التنفيذي والتحليل البياني لمزادات المركبات',
      reportSubtitle: 'ملخص الإدارة العليا للمركبات المعروضة والمبيعة والتحصيلات والخدمات',
      domain: 'dashboard',
      periodLabel: derivedPeriod,
      locationLabel: derivedLocation,
      isDemoMode,
      totalColumns: 8,
    });

    execCursor = ExcelLayoutEngine.renderExecutiveKpiGrid(
      execSheet,
      execCursor,
      'أولاً: بطاقات الأداء المالي والتشغيلي الرئيسية (Executive KPIs)',
      [
        {
          label: 'إجمالي المركبات المعروضة',
          value: totalDisplayed,
          format: 'integer',
          accent: 'navy',
        },
        {
          label: 'المركبات المبيعة / غير المبيعة',
          value: `${soldCount} مبيعة / ${unsoldCount} غير مبيعة`,
          format: 'text',
          accent: 'emerald',
        },
        {
          label: 'نسبة نجاح البيع بالمزاد',
          value: successRatio,
          format: 'percent',
          accent: 'blue',
        },
        {
          label: 'نسبة كفاءة التحصيل الفعلي',
          value: totalSale > 0 ? totalCollected / totalSale : 0,
          format: 'percent',
          accent: 'emerald',
        },
        {
          label: 'القيمة التقديرية لكافة المركبات',
          value: totalEstimated,
          format: 'currency',
          accent: 'blue',
        },
        {
          label: 'إجمالي قيمة البيع الفعلي',
          value: totalSale,
          format: 'currency',
          accent: 'crimson',
        },
        {
          label: 'إجمالي المبالغ المحصلة',
          value: totalCollected,
          format: 'currency',
          accent: 'emerald',
        },
        {
          label: 'الذمم المتبقية للتحصيل',
          value: totalRemaining,
          format: 'currency',
          accent: 'amber',
        },
      ],
      8
    );

    // Visual Analytical Chart Table 1: Sold vs Unsold Breakdown
    const renderAnalyticalSection = (
      title: string,
      headers: string[],
      rowsData: Array<{
        cells: (string | number)[];
        formats?: ('text' | 'currency' | 'integer' | 'percent')[];
      }>
    ) => {
      execSheet.mergeCells(`A${execCursor}:H${execCursor}`);
      const secCell = execSheet.getCell(`A${execCursor}`);
      secCell.value = title;
      secCell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.navyDark);
      secCell.font = ExcelThemeManager.font({
        size: 11,
        bold: true,
        color: ExcelThemeManager.COLORS.white,
      });
      secCell.alignment = { horizontal: 'right', vertical: 'middle' };
      execSheet.getRow(execCursor).height = 24;
      execCursor += 1;

      const hRow = execSheet.getRow(execCursor);
      hRow.height = 24;
      headers.forEach((h, i) => {
        const c = hRow.getCell(i + 1);
        c.value = h;
        c.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.corporateBlue);
        c.font = ExcelThemeManager.font({
          size: 10,
          bold: true,
          color: ExcelThemeManager.COLORS.white,
        });
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.border = ExcelThemeManager.headerBorder();
      });
      execCursor += 1;

      rowsData.forEach((rItem, rIdx) => {
        const dRow = execSheet.getRow(execCursor);
        dRow.height = 22;
        const bg =
          rIdx % 2 === 0 ? ExcelThemeManager.COLORS.white : ExcelThemeManager.COLORS.zebraBlueBg;
        rItem.cells.forEach((val, cIdx) => {
          const cell = dRow.getCell(cIdx + 1);
          cell.value = val;
          cell.fill = ExcelThemeManager.fill(bg);
          cell.border = ExcelThemeManager.border();
          cell.font = ExcelThemeManager.font({ size: 10, bold: cIdx === 0 });
          const fmt = rItem.formats?.[cIdx] || 'text';
          if (fmt === 'currency') {
            cell.numFmt = ExcelThemeManager.FORMATS.currencyAED;
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else if (fmt === 'integer') {
            cell.numFmt = ExcelThemeManager.FORMATS.integer;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (fmt === 'percent') {
            cell.numFmt = ExcelThemeManager.FORMATS.percent;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = {
              horizontal: cIdx === rItem.cells.length - 1 ? 'left' : 'right',
              vertical: 'middle',
            };
          }
        });
        execCursor += 1;
      });

      execSheet.getRow(execCursor).height = 10;
      execCursor += 1;
    };

    renderAnalyticalSection(
      'ثانياً: المخطط التحليلي لنسب المركبات المبيعة وغير المبيعة',
      [
        'تصنيف حالة المركبة',
        'عدد المركبات',
        'النسبة من الإجمالي',
        'القيمة التقديرية (AED)',
        'قيمة البيع الفعلي (AED)',
        'المبلغ المحصل (AED)',
        'الرصيد المتبقي (AED)',
        'المؤشر البياني البصري',
      ],
      [
        {
          cells: [
            'مركبات مبيعة (Sold)',
            soldCount,
            totalDisplayed > 0 ? soldCount / totalDisplayed : 0,
            soldEstimated,
            totalSale,
            totalCollected,
            totalRemaining,
            ExcelLayoutEngine.buildVisualProgressBar(
              totalDisplayed > 0 ? soldCount / totalDisplayed : 0
            ),
          ],
          formats: [
            'text',
            'integer',
            'percent',
            'currency',
            'currency',
            'currency',
            'currency',
            'text',
          ],
        },
        ...(pendingVehicles.length > 0
          ? [
              {
                cells: [
                  'مركبات قيد التحصيل (Pending)',
                  pendingVehicles.length,
                  totalDisplayed > 0 ? pendingVehicles.length / totalDisplayed : 0,
                  pendingVehicles.reduce((s, v) => s + v.estimatedValue, 0),
                  pendingVehicles.reduce((s, v) => s + v.salePrice, 0),
                  pendingVehicles.reduce((s, v) => s + v.collectedAmount, 0),
                  pendingVehicles.reduce((s, v) => s + (v.salePrice - v.collectedAmount), 0),
                  ExcelLayoutEngine.buildVisualProgressBar(
                    totalDisplayed > 0 ? pendingVehicles.length / totalDisplayed : 0
                  ),
                ] as (string | number)[],
                formats: [
                  'text',
                  'integer',
                  'percent',
                  'currency',
                  'currency',
                  'currency',
                  'currency',
                  'text',
                ] as ('text' | 'currency' | 'integer' | 'percent')[],
              },
            ]
          : []),
        {
          cells: [
            'مركبات غير مبيعة (Unsold)',
            unsoldCount,
            totalDisplayed > 0 ? unsoldCount / totalDisplayed : 0,
            unsoldVehicles.reduce((s, v) => s + v.estimatedValue, 0),
            0,
            0,
            0,
            ExcelLayoutEngine.buildVisualProgressBar(
              totalDisplayed > 0 ? unsoldCount / totalDisplayed : 0
            ),
          ],
          formats: [
            'text',
            'integer',
            'percent',
            'currency',
            'currency',
            'currency',
            'currency',
            'text',
          ],
        },
      ]
    );

    renderAnalyticalSection(
      'ثالثاً: المخطط التحليلي لإيرادات رسوم المنصة والخدمات المساندة',
      [
        'بند الخدمة / الرسوم',
        'عدد المركبات المشمولة',
        'الحصة من إجمالي الخدمات',
        'إجمالي الإيراد المحصل (AED)',
        'متوسط الرسم للمركبة (AED)',
        'تصنيف الإيراد',
        'حالة التحصيل',
        'المؤشر البياني للحصة',
      ],
      [
        {
          cells: [
            'رسوم المنصة الإلكترونية',
            vehicles.filter((v) => v.platformFee > 0).length,
            totalServices > 0 ? totalPlatform / totalServices : 0,
            totalPlatform,
            soldCount > 0 ? Math.round(totalPlatform / soldCount) : 0,
            'إيراد خدمات مباشر (100% ساعد)',
            'محصل بالكامل',
            ExcelLayoutEngine.buildVisualProgressBar(
              totalServices > 0 ? totalPlatform / totalServices : 0
            ),
          ],
          formats: ['text', 'integer', 'percent', 'currency', 'currency', 'text', 'text', 'text'],
        },
        {
          cells: [
            'الرسوم الإدارية للمزاد',
            vehicles.filter((v) => v.adminFee > 0).length,
            totalServices > 0 ? totalAdmin / totalServices : 0,
            totalAdmin,
            soldCount > 0 ? Math.round(totalAdmin / soldCount) : 0,
            'إيراد خدمات مباشر (100% ساعد)',
            'محصل بالكامل',
            ExcelLayoutEngine.buildVisualProgressBar(
              totalServices > 0 ? totalAdmin / totalServices : 0
            ),
          ],
          formats: ['text', 'integer', 'percent', 'currency', 'currency', 'text', 'text', 'text'],
        },
        {
          cells: [
            'خدمات الفوركلفت والمناولة',
            vehicles.filter((v) => v.forkliftFee > 0).length,
            totalServices > 0 ? totalForklift / totalServices : 0,
            totalForklift,
            soldCount > 0 ? Math.round(totalForklift / soldCount) : 0,
            'إيراد خدمات مباشر (100% ساعد)',
            'محصل بالكامل',
            ExcelLayoutEngine.buildVisualProgressBar(
              totalServices > 0 ? totalForklift / totalServices : 0
            ),
          ],
          formats: ['text', 'integer', 'percent', 'currency', 'currency', 'text', 'text', 'text'],
        },
        {
          cells: [
            'خدمات النقل وريكفري ساعد',
            vehicles.filter((v) => v.recoveryFee > 0).length,
            totalServices > 0 ? totalRecovery / totalServices : 0,
            totalRecovery,
            soldCount > 0 ? Math.round(totalRecovery / soldCount) : 0,
            'إيراد خدمات مباشر (100% ساعد)',
            'محصل بالكامل',
            ExcelLayoutEngine.buildVisualProgressBar(
              totalServices > 0 ? totalRecovery / totalServices : 0
            ),
          ],
          formats: ['text', 'integer', 'percent', 'currency', 'currency', 'text', 'text', 'text'],
        },
      ]
    );

    // Group vehicles by auction for Sheet 2 & Sheet 3
    const auctionGroups = new Map<
      string,
      { label: string; location: string; items: Vehicle[] }
    >();
    for (const v of vehicles) {
      const key = v.auctionId || 'general_auction';
      const resolved = auctionsById
        ? resolveVehicleAuction(v, auctionsById)
        : { label: key === 'general_auction' ? 'غير مرتبط بمزاد' : key };
      const existing = auctionGroups.get(key);
      if (existing) {
        existing.items.push(v);
      } else {
        auctionGroups.set(key, {
          label: resolved.label,
          location: v.location,
          items: [v],
        });
      }
    }

    const auctionBreakdownRows = Array.from(auctionGroups.entries()).map(([aucId, grp]) => {
      const gSold = grp.items.filter((x) => x.status === 'sold').length;
      const gEst = grp.items.reduce((s, x) => s + x.estimatedValue, 0);
      const gSale = grp.items.reduce((s, x) => s + x.salePrice, 0);
      const gCol = grp.items.reduce((s, x) => s + x.collectedAmount, 0);
      const gSrv = grp.items.reduce(
        (s, x) => s + x.platformFee + x.adminFee + x.forkliftFee + x.recoveryFee,
        0
      );
      return {
        cells: [
          grp.label,
          aucId,
          grp.items.length,
          gSold,
          gEst,
          gSale,
          gCol,
          gSrv,
        ] as (string | number)[],
        formats: [
          'text',
          'text',
          'integer',
          'integer',
          'currency',
          'currency',
          'currency',
          'currency',
        ] as ('text' | 'currency' | 'integer' | 'percent')[],
      };
    });

    renderAnalyticalSection(
      'رابعاً: التوزيع المالي والتشغيلي حسب المزادات المرتبطة',
      [
        'اسم المزاد',
        'معرّف المزاد',
        'المركبات المعروضة',
        'المركبات المبيعة',
        'القيمة التقديرية (AED)',
        'إجمالي البيع (AED)',
        'المبلغ المحصل (AED)',
        'رسوم الخدمات (AED)',
      ],
      auctionBreakdownRows
    );

    [34, 24, 18, 22, 22, 22, 22, 28].forEach((w, idx) => {
      execSheet.getColumn(idx + 1).width = w;
    });

    ExcelPrintConfigurator.configureSheetPrint(execSheet, {
      reportTitle: 'التقرير التنفيذي والتحليل البياني لمزادات المركبات',
      orientation: 'landscape',
      lastRowIndex: execCursor,
      lastColIndex: 8,
    });

    const validation = ExcelValidationService.validateVehiclesWorkbook(workbook, vehicles);
    return { workbook, validation };
  }

  /**
   * Builds a multi-sheet Enterprise Financial & Executive Workbook covering all
   * system domains (Executive Summary, Auctions Registry, Vehicles, Collections,
   * Revenue Share, Services & Fees, Monthly Comparisons, Approved Reports).
   */
  static async buildComprehensiveFinancialWorkbook(params: {
    metrics: ComputedFinancialMetrics;
    filter: FilterState;
    auctions: readonly Auction[];
    vehicles: readonly Vehicle[];
    collections: readonly CollectionRecord[];
    serviceRecords: readonly ServiceFeeRecord[];
    monthlyTrend: readonly MonthlyTrendPoint[];
    approvedReports: readonly ApprovedReport[];
    settings: SystemSettings;
    isDemoMode?: boolean;
  }): Promise<ExcelJS.Workbook> {
    const auctionsById = buildAuctionLookupMap(params.auctions);
    const periodLabel = `${getMonthLabel(params.filter.month)} ${params.filter.year}`;
    const locationLabel = params.filter.location === 'all' ? 'جميع الساحات' : params.filter.location;

    const { workbook } = await ExcelExportService.buildVehiclesEnterpriseWorkbook(params.vehicles, {
      isDemoMode: params.isDemoMode,
      auctionsById,
      periodLabel,
      locationLabel,
    });

    // Add Collections Sheet
    const colSheet = workbook.addWorksheet('سجل التحصيلات المالية', {
      views: [{ rightToLeft: true }],
      properties: { tabColor: { argb: ExcelThemeManager.COLORS.emeraldGreen }, defaultRowHeight: 20 },
    });

    const colStart = await ExcelLayoutEngine.renderCorporateHeader(workbook, colSheet, {
      reportTitle: 'سجل عمليات التحصيل المسجلة من المزايدين',
      reportSubtitle: 'بيان السندات المالية والمبالغ المحصلة والأرصدة المتبقية وتواريخ الدفع',
      domain: 'collections',
      periodLabel,
      locationLabel,
      isDemoMode: Boolean(params.isDemoMode),
      totalColumns: 10,
    });

    const colHeaders = [
      'م',
      'رقم العملية',
      'المرجع المالي',
      'المزاد',
      'المركبة / اللوت',
      'اسم المزايد',
      'المبلغ المستحق (AED)',
      'المبلغ المدفوع (AED)',
      'الرصيد المتبقي (AED)',
      'تاريخ الدفع',
    ];

    const colHeaderRow = colSheet.getRow(colStart);
    colHeaderRow.height = 26;
    colHeaders.forEach((h, i) => {
      const cell = colHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.fill = ExcelThemeManager.fill(ExcelThemeManager.COLORS.navyDark);
      cell.font = ExcelThemeManager.font({
        size: 10,
        bold: true,
        color: ExcelThemeManager.COLORS.white,
      });
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ExcelThemeManager.headerBorder();
    });

    params.collections.forEach((c, idx) => {
      const rIdx = colStart + 1 + idx;
      const row = colSheet.getRow(rIdx);
      row.height = 20;
      const due = c.amountDue ?? c.amount;
      const rem = c.remainingAmount ?? Math.max(0, due - c.amount);
      const cells: (string | number)[] = [
        idx + 1,
        c.receiptNo,
        c.financialRef || c.receiptNo,
        c.auctionId,
        c.lotNumber || c.vehicleId || 'على مستوى المزاد',
        c.bidderName,
        due,
        c.amount,
        rem,
        c.collectionDate || '',
      ];
      const bg = idx % 2 === 0 ? ExcelThemeManager.COLORS.white : ExcelThemeManager.COLORS.zebraBlueBg;
      cells.forEach((v, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = v;
        cell.fill = ExcelThemeManager.fill(bg);
        cell.border = ExcelThemeManager.border();
        cell.font = ExcelThemeManager.font({ size: 9.5, bold: cIdx === 1 || cIdx === 7 });
        if ([6, 7, 8].includes(cIdx)) {
          cell.numFmt = ExcelThemeManager.FORMATS.currencyAED;
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const colLastRow = Math.max(colStart + 1, colStart + params.collections.length);
    ExcelLayoutEngine.applyAdaptiveColumnWidths(colSheet, colStart, colLastRow, colHeaders);
    ExcelPrintConfigurator.configureSheetPrint(colSheet, {
      reportTitle: 'سجل عمليات التحصيل المسجلة',
      orientation: 'landscape',
      headerRowIndex: colStart,
      lastRowIndex: colLastRow,
      lastColIndex: 10,
    });

    return workbook;
  }
}
