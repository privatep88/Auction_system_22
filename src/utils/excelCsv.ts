import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { Auction, SystemSettings, Vehicle, VehicleStatus } from '../types';
import {
  ExcelExportService,
  ExcelExportValidationReport,
  ExcelLayoutEngine,
  ExcelPrintConfigurator,
  ExcelThemeManager,
} from './saaedExcelEngine';
import { generateSafeId } from './uaeDate';

export interface ParsedVehicleImportRow {
  lotNumber: string;
  make: string;
  model: string;
  modelYear: number;
  vin?: string;
  estimatedValue: number;
  salePrice: number;
  collectedAmount: number;
  status: VehicleStatus;
  platformFee: number;
  adminFee: number;
  forkliftFee: number;
  recoveryFee: number;
  buyerName?: string;
  location?: string;
}

function normalizeHeader(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function pickField(row: Record<string, unknown>, candidates: string[]): unknown {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const normCand = normalizeHeader(candidate);
    const foundKey = keys.find((k) => normalizeHeader(k) === normCand);
    if (foundKey !== undefined && row[foundKey] !== '' && row[foundKey] !== undefined) {
      return row[foundKey];
    }
  }
  return undefined;
}

function toNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0, val);
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  }
  return fallback;
}

function parseStatus(val: unknown, salePrice: number): VehicleStatus {
  const s = String(val || '').trim().toLowerCase();
  if (['sold', 'مبيعة', 'مباع', 'تم البيع', 'yes', '1'].includes(s)) return 'sold';
  if (['unsold', 'غير مبيعة', 'غير مباع', 'لم يباع', 'no', '0'].includes(s)) return 'unsold';
  if (['pending', 'قيد التحصيل', 'معلق'].includes(s)) return 'pending';
  return salePrice > 0 ? 'sold' : 'unsold';
}

/**
 * Extracts normalized row objects from a worksheet, automatically detecting
 * whether the header row is on row 1 or below an Enterprise Corporate Header block.
 */
export function extractVehicleRowsFromWorkbook(
  workbook: XLSX.WorkBook
): Record<string, unknown>[] {
  const targetSheetName =
    workbook.SheetNames.find((n) => n.includes('المركبات')) || workbook.SheetNames[0];
  if (!targetSheetName) return [];

  const sheet = workbook.Sheets[targetSheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(35, matrix.length); r++) {
    const rowCells = (matrix[r] || []).map((c) => normalizeHeader(String(c || '')));
    if (
      rowCells.includes(normalizeHeader('رقم اللوت')) ||
      rowCells.includes(normalizeHeader('نوع المركبة')) ||
      rowCells.includes('lotnumber')
    ) {
      headerRowIdx = r;
      break;
    }
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerRowIdx,
    defval: '',
  });
}

export async function parseVehiclesSpreadsheet(
  file: File,
  defaults: SystemSettings
): Promise<ParsedVehicleImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const rawRows = extractVehicleRowsFromWorkbook(workbook);

  return rawRows
    .map((row, idx): ParsedVehicleImportRow | null => {
      const make = String(
        pickField(row, ['نوع المركبة', 'الشركة المصنعة', 'make', 'brand', 'manufacturer']) || ''
      ).trim();
      const model = String(
        pickField(row, ['الطراز', 'الموديل', 'model', 'variant']) || ''
      ).trim();

      if (!make && !model) return null;

      const lotNumber = String(
        pickField(row, ['رقم اللوت', 'رقم المركبة', 'lot', 'lotnumber', 'lot_number', 'no']) ||
          `LOT-${idx + 1}`
      ).trim();

      const modelYear = Math.round(
        toNum(pickField(row, ['سنة الصنع', 'السنة', 'modelyear', 'year']), 2024)
      );
      const vin = String(pickField(row, ['رقم الشاصي', 'vin', 'chassis']) || '').trim();
      const estimatedValue = toNum(
        pickField(row, [
          'القيمة التقديرية (AED)',
          'القيمة التقديرية',
          'التقديري',
          'estimatedvalue',
          'estimated',
          'reserve',
        ]),
        0
      );
      const salePrice = toNum(
        pickField(row, [
          'سعر البيع (AED)',
          'سعر البيع',
          'قيمة البيع',
          'saleprice',
          'soldprice',
          'price',
        ]),
        0
      );
      const status = parseStatus(pickField(row, ['الحالة', 'status']), salePrice);
      const collectedAmount = toNum(
        pickField(row, [
          'المبلغ المحصل (AED)',
          'المبلغ المحصل',
          'المحصل',
          'collectedamount',
          'collected',
          'paid',
        ]),
        status === 'sold' ? salePrice : 0
      );
      const platformFee = toNum(
        pickField(row, ['رسوم المنصة (AED)', 'رسوم المنصة', 'platformfee', 'platform']),
        status === 'sold' ? defaults.defaultPlatformFee : 0
      );
      const adminFee = toNum(
        pickField(row, ['الرسوم الإدارية (AED)', 'الرسوم الإدارية', 'adminfee', 'admin']),
        status === 'sold' ? defaults.defaultAdminFee : 0
      );
      const forkliftFee = toNum(
        pickField(row, [
          'رسوم الفوركلفت (AED)',
          'رسوم الفوركلفت',
          'الفوركلفت',
          'forkliftfee',
          'forklift',
        ]),
        0
      );
      const recoveryFee = toNum(
        pickField(row, [
          'رسوم النقل ريكفري (AED)',
          'رسوم النقل',
          'ريكفري',
          'ريكفري ساعد',
          'recoveryfee',
          'recovery',
        ]),
        0
      );
      const buyerName = String(
        pickField(row, ['المشتري', 'اسم المزايد', 'buyer', 'buyername', 'bidder']) || ''
      ).trim();
      const location = String(
        pickField(row, ['الموقع', 'الساحة', 'location', 'yard']) || ''
      ).trim();

      return {
        lotNumber,
        make: make || 'غير محدد',
        model: model || 'غير محدد',
        modelYear: modelYear >= 1950 && modelYear <= 2100 ? modelYear : 2024,
        vin: vin || undefined,
        estimatedValue,
        salePrice: status === 'unsold' ? 0 : salePrice,
        collectedAmount: status === 'unsold' ? 0 : collectedAmount,
        status,
        platformFee,
        adminFee,
        forkliftFee,
        recoveryFee,
        buyerName: buyerName || undefined,
        location: location || undefined,
      };
    })
    .filter((r): r is ParsedVehicleImportRow => r !== null);
}

export async function downloadVehiclesTemplateXlsx(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'شركة ساعد للأنظمة المرورية | SAAED';
  const sheet = wb.addWorksheet('المركبات', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
  });

  const headers = [
    'رقم اللوت',
    'نوع المركبة',
    'الطراز',
    'سنة الصنع',
    'رقم الشاصي',
    'القيمة التقديرية',
    'سعر البيع',
    'المبلغ المحصل',
    'الحالة',
    'رسوم المنصة',
    'الرسوم الإدارية',
    'رسوم الفوركلفت',
    'رسوم النقل',
    'المشتري',
    'الموقع',
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 26;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
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

  const sampleRow = sheet.getRow(2);
  sampleRow.height = 22;
  const sampleValues: (string | number)[] = [
    'LOT-101',
    'مرسيدس',
    'S-Class',
    2024,
    '',
    0,
    0,
    0,
    'مبيعة',
    0,
    0,
    0,
    0,
    '',
    'ساحة الحجز – مصفح',
  ];

  sampleValues.forEach((v, idx) => {
    const cell = sampleRow.getCell(idx + 1);
    cell.value = v;
    cell.border = ExcelThemeManager.border();
    cell.font = ExcelThemeManager.font({ size: 10 });
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  ExcelLayoutEngine.applyAdaptiveColumnWidths(sheet, 1, 2, headers);
  ExcelPrintConfigurator.configureSheetPrint(sheet, {
    reportTitle: 'قالب استيراد المركبات القياسي – شركة ساعد',
    orientation: 'landscape',
    headerRowIndex: 1,
    lastRowIndex: 2,
    lastColIndex: headers.length,
  });

  const buffer = await wb.xlsx.writeBuffer();
  ExcelExportService.triggerBrowserDownload(buffer, 'SAAED_Vehicles_Import_Template.xlsx');
}

let isExportingVehiclesLock = false;

export async function exportVehiclesToXlsx(
  vehicles: Vehicle[],
  filename: string,
  isDemoMode = false,
  auctionsById?: ReadonlyMap<string, Auction>
): Promise<ExcelExportValidationReport | null> {
  if (isExportingVehiclesLock) return null;
  isExportingVehiclesLock = true;
  try {
    const { workbook, validation } = await ExcelExportService.buildVehiclesEnterpriseWorkbook(
      vehicles,
      {
        isDemoMode,
        auctionsById,
      }
    );

    const safeName = isDemoMode && !filename.startsWith('DEMO_') ? `DEMO_${filename}` : filename;
    const buffer = await workbook.xlsx.writeBuffer();
    ExcelExportService.triggerBrowserDownload(buffer, `${safeName}.xlsx`);
    return validation;
  } finally {
    isExportingVehiclesLock = false;
  }
}

export function buildVehicleFromImport(
  row: ParsedVehicleImportRow,
  params: {
    auctionId: string;
    year: number;
    month: number;
    defaultLocation: string;
    ownerId: string;
  }
): Omit<Vehicle, 'createdAt' | 'updatedAt'> {
  return {
    id: generateSafeId('veh'),
    auctionId: params.auctionId,
    lotNumber: row.lotNumber.slice(0, 64),
    make: row.make.slice(0, 80),
    model: row.model.slice(0, 80),
    modelYear: row.modelYear,
    ...(row.vin ? { vin: row.vin.slice(0, 64) } : {}),
    location: (row.location || params.defaultLocation).slice(0, 120),
    year: params.year,
    month: params.month,
    estimatedValue: row.estimatedValue,
    salePrice: row.salePrice,
    collectedAmount: row.collectedAmount,
    status: row.status,
    platformFee: row.platformFee,
    adminFee: row.adminFee,
    forkliftFee: row.forkliftFee,
    recoveryFee: row.recoveryFee,
    ...(row.buyerName ? { buyerName: row.buyerName.slice(0, 120) } : {}),
    ownerId: params.ownerId,
  };
}
