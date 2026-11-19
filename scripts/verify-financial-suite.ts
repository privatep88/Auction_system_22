import fs from 'node:fs';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import type { SystemSettings } from '../src/types';
import {
  buildAuctionLookupMap,
  filterAuctionModalVehicles,
  getAuctionLinkedVehicles,
  resolveVehicleAuction,
} from '../src/utils/auctionLink';
import { computeMonthlyTrend, filterCollections, filterVehicles } from '../src/utils/calculations';
import { extractVehicleRowsFromWorkbook } from '../src/utils/excelCsv';
import { ExcelExportService, ExcelValidationService } from '../src/utils/saaedExcelEngine';
import {
  generateDemoDataset,
  runFinancialValidationSuite,
} from '../src/utils/demoDataGenerator';
import {
  computeFloatingScrollbarGeometry,
  computeThumbLayout,
  getRtlScrollMetrics,
  progressToRtlScrollLeft,
} from '../src/utils/rtlScroll';
import {
  buildCalendarMonthGrid,
  formatIsoDateParts,
  isValidIsoCalendarDate,
  parseIsoDateParts,
} from '../src/utils/saleDate';

const demoSettings: SystemSettings = {
  id: 'demo_settings',
  defaultSaaedSharePercent: 70,
  defaultThirdPartySharePercent: 30,
  defaultPlatformFee: 100,
  defaultAdminFee: 200,
  defaultForkliftFee: 200,
  defaultRecoveryFee: 400,
  excludeServicesFromShare: true,
  ownerId: 'demo_workspace',
};

const dataset = generateDemoDataset('ci_verification');
const results = runFinancialValidationSuite({
  auctions: dataset.auctions,
  vehicles: dataset.vehicles,
  collections: dataset.collections,
  serviceRecords: dataset.serviceRecords,
  approvedReports: dataset.approvedReports,
  settings: demoSettings,
  isDemoMode: true,
});

let failedCount = 0;
for (const result of results) {
  const mark = result.passed ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${result.id}: ${result.name} (${result.actual})`);
  if (!result.passed) {
    failedCount += 1;
    console.error(`   Expected: ${result.expected} | Diff: ${result.diff}`);
  }
}

// Auction link column verification
const auctionsById = buildAuctionLookupMap(dataset.auctions);
const sampleLinkedVehicle = dataset.vehicles.find((v) => auctionsById.has(v.auctionId));
if (!sampleLinkedVehicle) {
  failedCount += 1;
  console.error('[FAIL] T13: No linked vehicle found in demo dataset.');
} else {
  const expectedTitle = auctionsById.get(sampleLinkedVehicle.auctionId)!.title;
  const resolved = resolveVehicleAuction(sampleLinkedVehicle, auctionsById);
  const unlinkedRes = resolveVehicleAuction({ auctionId: '' }, auctionsById);
  const generalRes = resolveVehicleAuction({ auctionId: 'general_auction' }, auctionsById);
  const unavailableRes = resolveVehicleAuction({ auctionId: 'NON_EXISTENT_AUC' }, auctionsById);

  const updatedAuctions = dataset.auctions.map((a) =>
    a.id === sampleLinkedVehicle.auctionId ? { ...a, title: 'مزاد محدث للاختبار' } : a
  );
  const updatedMap = buildAuctionLookupMap(updatedAuctions);
  const updatedRes = resolveVehicleAuction(sampleLinkedVehicle, updatedMap);

  const linkSuitePassed =
    resolved.status === 'linked' &&
    resolved.label === expectedTitle &&
    unlinkedRes.status === 'unlinked' &&
    unlinkedRes.label === 'غير مرتبط بمزاد' &&
    generalRes.status === 'unlinked' &&
    generalRes.label === 'غير مرتبط بمزاد' &&
    unavailableRes.status === 'unavailable' &&
    unavailableRes.label === 'مزاد غير متاح' &&
    updatedRes.label === 'مزاد محدث للاختبار';

  if (linkSuitePassed) {
    console.log(
      `[PASS] T13: ربط عمود اسم المزاد وتحديثه التلقائي وحالات عدم الارتباط (${expectedTitle})`
    );
  } else {
    failedCount += 1;
    console.error('[FAIL] T13: Vehicle-to-auction resolution mismatch.');
  }
}

// Sale date editing & live report synchronization verification
const novSoldSample = dataset.vehicles.find(
  (v) => v.year === 2026 && v.month === 11 && v.status === 'sold'
);
const gridNov = buildCalendarMonthGrid(2026, 11);
const dateValidationOk =
  isValidIsoCalendarDate('2026-11-15') &&
  isValidIsoCalendarDate('2024-02-29') &&
  !isValidIsoCalendarDate('2026-02-29') &&
  !isValidIsoCalendarDate('2026-13-01') &&
  !isValidIsoCalendarDate('not-a-date') &&
  formatIsoDateParts(2026, 12, 5) === '2026-12-05' &&
  gridNov.length === 42 &&
  gridNov.filter((c) => c.isCurrentMonth).length === 30;

if (!novSoldSample || !dateValidationOk) {
  failedCount += 1;
  console.error('[FAIL] T14: Date calendar validation failed.');
} else {
  const newDate = '2026-10-25';
  const parsed = parseIsoDateParts(newDate)!;
  const modifiedVehicles = dataset.vehicles.map((v) =>
    v.id === novSoldSample.id
      ? { ...v, saleDate: newDate, year: parsed.year, month: parsed.month }
      : v
  );

  const octBefore = filterVehicles(dataset.vehicles, {
    month: 10,
    year: 2026,
    location: 'all',
    auctionId: 'all',
    status: 'all',
  });
  const octAfter = filterVehicles(modifiedVehicles, {
    month: 10,
    year: 2026,
    location: 'all',
    auctionId: 'all',
    status: 'all',
  });
  const trendBefore = computeMonthlyTrend(dataset.vehicles, dataset.collections, 2026, 'all', 'all');
  const trendAfter = computeMonthlyTrend(modifiedVehicles, dataset.collections, 2026, 'all', 'all');

  const annualSaleBefore = trendBefore.reduce((s, p) => s + p.saleValue, 0);
  const annualSaleAfter = trendAfter.reduce((s, p) => s + p.saleValue, 0);
  const annualCollectedBefore = trendBefore.reduce((s, p) => s + p.collectedAmount, 0);
  const annualCollectedAfter = trendAfter.reduce((s, p) => s + p.collectedAmount, 0);

  const octPointBefore = trendBefore.find((p) => p.month === 10)!;
  const octPointAfter = trendAfter.find((p) => p.month === 10)!;

  if (
    octAfter.length === octBefore.length + 1 &&
    octPointAfter.saleValue === octPointBefore.saleValue + novSoldSample.salePrice &&
    annualSaleBefore === annualSaleAfter &&
    annualCollectedBefore === annualCollectedAfter
  ) {
    console.log(
      `[PASS] T14: التحقق من تعديل تاريخ البيع والمزامنة الزمنية في التقارير الحية دون تغيير المجاميع السنوية`
    );
  } else {
    failedCount += 1;
    console.error('[FAIL] T14: Sale date period reclassification or financial invariance failed.');
  }
}

// T15: Payment date editing & financial invariance verification
const targetPaymentSample = dataset.collections.find(
  (c) => c.year === 2026 && c.month === 11 && !c.vehicleId
) || dataset.collections.find((c) => c.year === 2026 && c.month === 11);

if (!targetPaymentSample) {
  failedCount += 1;
  console.error('[FAIL] T15: No November 2026 collection record found for payment date test.');
} else {
  const newPaymentDate = '2026-10-19';
  const parsedPayDate = parseIsoDateParts(newPaymentDate)!;
  const modifiedCollections = dataset.collections.map((c) =>
    c.id === targetPaymentSample.id
      ? {
          ...c,
          collectionDate: newPaymentDate,
          year: parsedPayDate.year,
          month: parsedPayDate.month,
        }
      : c
  );

  const octCollectionsBefore = filterCollections(
    dataset.collections,
    { month: 10, year: 2026, location: 'all', auctionId: 'all', status: 'all' },
    dataset.vehicles
  );
  const octCollectionsAfter = filterCollections(
    modifiedCollections,
    { month: 10, year: 2026, location: 'all', auctionId: 'all', status: 'all' },
    dataset.vehicles
  );
  const novCollectionsBefore = filterCollections(
    dataset.collections,
    { month: 11, year: 2026, location: 'all', auctionId: 'all', status: 'all' },
    dataset.vehicles
  );
  const novCollectionsAfter = filterCollections(
    modifiedCollections,
    { month: 11, year: 2026, location: 'all', auctionId: 'all', status: 'all' },
    dataset.vehicles
  );

  const updatedCol = modifiedCollections.find((c) => c.id === targetPaymentSample.id)!;
  const fieldsPreserved =
    updatedCol.amount === targetPaymentSample.amount &&
    updatedCol.amountDue === targetPaymentSample.amountDue &&
    updatedCol.remainingAmount === targetPaymentSample.remainingAmount &&
    updatedCol.paymentStatus === targetPaymentSample.paymentStatus &&
    updatedCol.collectionType === targetPaymentSample.collectionType &&
    updatedCol.vehicleId === targetPaymentSample.vehicleId;

  const totalCollectedSumBefore = dataset.collections.reduce((s, c) => s + c.amount, 0);
  const totalCollectedSumAfter = modifiedCollections.reduce((s, c) => s + c.amount, 0);

  if (
    fieldsPreserved &&
    totalCollectedSumBefore === totalCollectedSumAfter &&
    octCollectionsAfter.some((c) => c.id === targetPaymentSample.id) &&
    !octCollectionsBefore.some((c) => c.id === targetPaymentSample.id) &&
    novCollectionsBefore.some((c) => c.id === targetPaymentSample.id) &&
    !novCollectionsAfter.some((c) => c.id === targetPaymentSample.id)
  ) {
    console.log(
      `[PASS] T15: التحقق من تعديل تاريخ الدفع في سجل التحصيلات والمزامنة الزمنية دون المساس بالمبالغ أو حالة السداد`
    );
  } else {
    failedCount += 1;
    console.error('[FAIL] T15: Payment date edit synchronization or amount invariance failed.');
  }
}

// T16: Complete Auction Vehicle List (All 450 / 320 / 280 / 200 vehicles per auction, zero truncation, zero duplicates)
const auc1Vehicles = getAuctionLinkedVehicles(dataset.vehicles, 'DEMO-AUC-2026-001');
const auc2Vehicles = getAuctionLinkedVehicles(dataset.vehicles, 'DEMO-AUC-2026-002');
const auc3Vehicles = getAuctionLinkedVehicles(dataset.vehicles, 'DEMO-AUC-2026-003');
const auc4Vehicles = getAuctionLinkedVehicles(dataset.vehicles, 'DEMO-AUC-2026-004');
const duplicatedInput = [...auc1Vehicles, auc1Vehicles[0]];
const dedupedCheck = getAuctionLinkedVehicles(duplicatedInput, 'DEMO-AUC-2026-001');
const lastAuc1Lot = auc1Vehicles[auc1Vehicles.length - 1]?.lotNumber || '';
const searchFiltered = filterAuctionModalVehicles(auc1Vehicles, lastAuc1Lot);

const completeListPassed =
  auc1Vehicles.length === 450 &&
  auc2Vehicles.length === 320 &&
  auc3Vehicles.length === 280 &&
  auc4Vehicles.length === 200 &&
  auc1Vehicles[0]?.lotNumber === 'DEMO-LOT-0001' &&
  Boolean(lastAuc1Lot) &&
  auc1Vehicles.every((v) => v.auctionId === 'DEMO-AUC-2026-001') &&
  auc2Vehicles.every((v) => v.auctionId === 'DEMO-AUC-2026-002') &&
  auc3Vehicles.every((v) => v.auctionId === 'DEMO-AUC-2026-003') &&
  auc4Vehicles.every((v) => v.auctionId === 'DEMO-AUC-2026-004') &&
  dedupedCheck.length === 450 &&
  searchFiltered.some((v) => v.lotNumber === lastAuc1Lot);

if (completeListPassed) {
  console.log(
    `[PASS] T16: عرض جميع المركبات المرتبطة بالمزاد بالكامل دون اقتصار على 12 مركبة (450 / 320 / 280 / 200 مركبة)`
  );
} else {
  failedCount += 1;
  console.error('[FAIL] T16: Auction details vehicle list completeness or isolation check failed.');
}

// T17: Mandatory DEMO_SAAED_Vehicles_2026_11.xlsx Enterprise Export & Round-Trip Verification
async function verifyEnterpriseExcelExport() {
  const novVehicles = filterVehicles(dataset.vehicles, {
    month: 11,
    year: 2026,
    location: 'all',
    auctionId: 'all',
    status: 'all',
  });

  const { workbook, validation } = await ExcelExportService.buildVehiclesEnterpriseWorkbook(
    novVehicles,
    {
      isDemoMode: true,
      auctionsById,
      periodLabel: 'نوفمبر 2026',
      locationLabel: 'جميع الساحات',
    }
  );

  const exportPath = '/tmp/DEMO_SAAED_Vehicles_2026_11.xlsx';
  const buffer = await workbook.xlsx.writeBuffer();
  fs.writeFileSync(exportPath, Buffer.from(buffer));

  // Re-open from disk via ExcelJS to verify zero corruption
  const reloadedWb = new ExcelJS.Workbook();
  await reloadedWb.xlsx.readFile(exportPath);
  const reloadedValidation = ExcelValidationService.validateVehiclesWorkbook(
    reloadedWb,
    novVehicles
  );

  // Also re-open via SheetJS (XLSX) and extract vehicle rows for round-trip compatibility
  const sheetJsWb = XLSX.read(fs.readFileSync(exportPath), { type: 'buffer' });
  const roundTripRows = extractVehicleRowsFromWorkbook(sheetJsWb).filter((r) =>
    typeof r['م'] === 'number'
  );

  const soldInNov = novVehicles.filter((v) => v.status === 'sold').length;
  const unsoldInNov = novVehicles.filter((v) => v.status === 'unsold').length;
  const novAuctionCount = new Set(novVehicles.map((v) => v.auctionId)).size;

  const excelSuitePassed =
    validation.valid &&
    reloadedValidation.valid &&
    reloadedValidation.sheetNames.includes('البيانات التفصيلية للمركبات') &&
    reloadedValidation.sheetNames.includes('التقرير التنفيذي والمخططات') &&
    reloadedValidation.vehicleRowCount === 1250 &&
    soldInNov === 1104 &&
    unsoldInNov === 146 &&
    novAuctionCount === 4 &&
    reloadedValidation.columnCount === 21 &&
    reloadedValidation.totalEstimated === 8450000 &&
    reloadedValidation.totalSale === 9200000 &&
    reloadedValidation.totalCollected === 8950000 &&
    reloadedValidation.totalPlatformFees === 58000 &&
    reloadedValidation.totalAdminFees === 125000 &&
    reloadedValidation.totalForkliftFees === 68500 &&
    reloadedValidation.totalRecoveryFees === 134000 &&
    reloadedValidation.embeddedMediaCount >= 2 &&
    reloadedValidation.hasFrozenHeader &&
    reloadedValidation.hasAutoFilter &&
    reloadedValidation.hasPrintSetup &&
    reloadedValidation.emptyUnsoldSaleDatesPreserved &&
    roundTripRows.length === 1250;

  if (excelSuitePassed) {
    console.log(
      `[PASS] T17: التحقق من تصدير وفحص ملف DEMO_SAAED_Vehicles_2026_11.xlsx (1,250 مركبة | 21 عموداً | ${reloadedValidation.embeddedMediaCount} صور مضمنة | أوراق متعددة | معادلات وفلاتر سليمة)`
    );
  } else {
    failedCount += 1;
    console.error('[FAIL] T17: Enterprise Excel export verification failed:', {
      errors: reloadedValidation.errors,
      reloadedValidation,
      roundTripCount: roundTripRows.length,
    });
  }

  // T18: Smart Floating Horizontal Scrollbar (RTL coordinates, overflow visibility, footer & modal isolation)
  const fitAllDesktop = getRtlScrollMetrics(1220, 1340, 0, 'negative');
  const smallLaptopStart = getRtlScrollMetrics(1220, 920, 0, 'negative');
  const smallLaptopEnd = getRtlScrollMetrics(1220, 920, -300, 'negative');
  const legacyWebkitMid = getRtlScrollMetrics(1220, 920, 150, 'default');
  const legacyEdgeMid = getRtlScrollMetrics(1220, 920, 150, 'reverse');

  const negBack = progressToRtlScrollLeft(0.5, 300, 'negative');
  const defBack = progressToRtlScrollLeft(0.5, 300, 'default');
  const revBack = progressToRtlScrollLeft(0.5, 300, 'reverse');

  const thumbAtStart = computeThumbLayout(800, 920, 1220, 0);
  const thumbAtEnd = computeThumbLayout(800, 920, 1220, 1);

  const midTableFloating = computeFloatingScrollbarGeometry({
    hasOverflow: true,
    isModalOpen: false,
    containerRect: { top: -400, bottom: 1600, left: 16, right: 936, width: 920, height: 2000 },
    dockRect: { top: 1600, bottom: 1640, left: 16, right: 936, width: 920, height: 40 },
    viewportWidth: 1280,
    viewportHeight: 800,
    footerTop: 1850,
  });

  const bottomReachedDocked = computeFloatingScrollbarGeometry({
    hasOverflow: true,
    isModalOpen: false,
    containerRect: { top: -1200, bottom: 680, left: 16, right: 936, width: 920, height: 1880 },
    dockRect: { top: 680, bottom: 720, left: 16, right: 936, width: 920, height: 40 },
    viewportWidth: 1280,
    viewportHeight: 800,
    footerTop: 742,
  });

  const footerCollisionAvoided = computeFloatingScrollbarGeometry({
    hasOverflow: true,
    isModalOpen: false,
    containerRect: { top: -500, bottom: 900, left: 16, right: 936, width: 920, height: 1400 },
    dockRect: { top: 900, bottom: 940, left: 16, right: 936, width: 920, height: 40 },
    viewportWidth: 1280,
    viewportHeight: 800,
    footerTop: 740,
  });

  const modalOpenHidden = computeFloatingScrollbarGeometry({
    hasOverflow: true,
    isModalOpen: true,
    containerRect: { top: 120, bottom: 1600, left: 16, right: 936, width: 920, height: 1480 },
    dockRect: { top: 1600, bottom: 1640, left: 16, right: 936, width: 920, height: 40 },
    viewportWidth: 1280,
    viewportHeight: 800,
  });

  const mobileFloating = computeFloatingScrollbarGeometry({
    hasOverflow: true,
    isModalOpen: false,
    containerRect: { top: 80, bottom: 1800, left: 16, right: 359, width: 343, height: 1720 },
    dockRect: { top: 1800, bottom: 1840, left: 16, right: 359, width: 343, height: 40 },
    viewportWidth: 375,
    viewportHeight: 667,
  });

  const mobileFractionalDpiEnd = getRtlScrollMetrics(1220.4, 375.2, -845.2, 'negative');
  const laptopTopEntryFloating = computeFloatingScrollbarGeometry({
    hasOverflow: true,
    isModalOpen: false,
    containerRect: { top: 670, bottom: 2670, left: 16, right: 1036, width: 1020, height: 2000 },
    dockRect: { top: 2670, bottom: 2710, left: 16, right: 1036, width: 1020, height: 40 },
    viewportWidth: 1366,
    viewportHeight: 768,
    footerTop: 2800,
    barHeight: 38,
    safeBottomGap: 14,
    headerGuardHeight: 56,
  });

  const smartScrollOk =
    !fitAllDesktop.hasOverflow &&
    smallLaptopStart.hasOverflow &&
    smallLaptopStart.progress === 0 &&
    smallLaptopEnd.progress === 1 &&
    Math.abs(mobileFractionalDpiEnd.progress - 1) < 0.001 &&
    Math.abs(legacyWebkitMid.progress - 0.5) < 0.001 &&
    Math.abs(legacyEdgeMid.progress - 0.5) < 0.001 &&
    negBack === -150 &&
    defBack === 150 &&
    revBack === 150 &&
    Math.abs(thumbAtStart.leftPx - thumbAtStart.maxTravel) < 0.01 &&
    thumbAtEnd.leftPx === 0 &&
    midTableFloating.mode === 'floating' &&
    midTableFloating.left === 16 &&
    midTableFloating.width === 920 &&
    laptopTopEntryFloating.mode === 'floating' &&
    bottomReachedDocked.mode === 'docked' &&
    footerCollisionAvoided.mode === 'floating' &&
    footerCollisionAvoided.bottom >= 74 &&
    modalOpenHidden.mode === 'hidden' &&
    mobileFloating.mode === 'floating' &&
    mobileFloating.width === 343;

  if (smartScrollOk) {
    console.log(
      '[PASS] T18: التحقق من شريط التمرير الأفقي الذكي العائم (RTL Chrome/WebKit/Edge، التثبيت، تجنب الفوتر والنوافذ، الجوال)'
    );
  } else {
    failedCount += 1;
    console.error('[FAIL] T18: Smart floating horizontal scrollbar geometry/RTL check failed:', {
      fitAllDesktop,
      smallLaptopStart,
      smallLaptopEnd,
      midTableFloating,
      bottomReachedDocked,
      footerCollisionAvoided,
      modalOpenHidden,
      mobileFloating,
    });
  }

  if (failedCount > 0) {
    console.error(`\nFinancial validation failed: ${failedCount} test(s) did not pass.`);
    process.exit(1);
  }

  console.log(`\nAll ${results.length + 6} financial & operational integrity tests passed.`);
}

verifyEnterpriseExcelExport().catch((err) => {
  console.error('Fatal error in verifyEnterpriseExcelExport:', err);
  process.exit(1);
});
