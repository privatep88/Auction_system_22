import { assetUrl } from '../utils/uaeDate';

export const BRAND_CONFIG = {
  /** Short Arabic corporate brand name */
  nameAr: 'ساهر',
  /** Arabic corporate entity name */
  companyNameAr: 'شركة ساهر',
  /** Full Arabic corporate name */
  companyFullAr: 'شركة ساهر للخدمات الإلكترونية',
  /** Official English brand name */
  nameEn: 'SAHER',
  /** Official bilingual lockup label */
  bilingualArEn: 'شركة ساهر | SAHER',
  /** Official compact bilingual badge */
  compactBilingual: 'SAHER ساهر',
  /** Official Arabic system headline */
  systemTitleAr: 'نظام التقرير المالي والتحليل التنفيذي لمزادات المركبات',
  /** Full Arabic system title with company name */
  systemFullTitleAr:
    'نظام التقرير المالي والتحليل التنفيذي لمزادات المركبات – شركة ساهر للخدمات الإلكترونية',
  /** Official English system subtitle */
  systemSubtitleEn: 'SAHER Vehicle Auctions – Financial & Executive Analytics System',
  /** Accessible alt text for the official transparent logo */
  logoAlt: 'شعار شركة ساهر SAHER',
  /** Vite/GitHub-Pages-safe relative asset path for transparent PNG logo */
  logoAssetPath: 'assets/brand/saher-logo.png',
  /** Original uploaded lossless WebP asset path */
  logoOriginalWebpPath:
    'assets/aistudio/file_0000000001a481f8bd40283a6ec526f6_54a6e944.webp',
  /** Disk path for Node/CI ExcelJS embedding */
  logoDiskPath: 'public/assets/brand/saher-logo.png',
  /** Rounded white-backed PNG logo for dark-navy ExcelJS worksheet headers */
  logoExcelAssetPath: 'assets/brand/saher-logo-excel.png',
  /** Disk path for Node/CI ExcelJS dark-navy header badge */
  logoExcelDiskPath: 'public/assets/brand/saher-logo-excel.png',
  /** Favicon relative asset path */
  faviconAssetPath: 'assets/brand/saher-favicon.png',
} as const;

/** Resolves the official transparent SAHER logo URL with Vite base path support. */
export function getBrandLogoUrl(): string {
  return assetUrl(BRAND_CONFIG.logoAssetPath);
}

/** Resolves the official SAHER favicon URL with Vite base path support. */
export function getBrandFaviconUrl(): string {
  return assetUrl(BRAND_CONFIG.faviconAssetPath);
}
