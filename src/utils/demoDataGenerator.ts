import {
  ApprovedReport,
  Auction,
  CollectionRecord,
  FilterState,
  ServiceFeeRecord,
  SystemSettings,
  ValidationTestResult,
  Vehicle,
} from '../types';
import {
  computeFinancialMetrics,
  filterAuctions,
  filterCollections,
  filterServiceRecords,
  filterVehicles,
} from './calculations';
import { formatAED, formatNumber } from './uaeDate';

export interface DemoDataset {
  auctions: Auction[];
  vehicles: Vehicle[];
  collections: CollectionRecord[];
  serviceRecords: ServiceFeeRecord[];
  approvedReports: ApprovedReport[];
}

export const DEMO_PREVIEW_COUNTS = {
  novemberAuctions: 4,
  historicalAuctions: 2,
  novemberVehicles: 1250,
  novemberSold: 1104,
  novemberUnsold: 146,
  historicalVehicles: 400,
  novemberCollections: 1104,
  novemberServicesCount: 1757,
  novemberTotalEstimated: 8_450_000,
  novemberTotalSale: 9_200_000,
  novemberTotalCollected: 8_950_000,
  novemberOutstanding: 250_000,
  novemberSaaedShare: 6_265_000,
  novemberThirdPartyShare: 2_685_000,
  novemberPlatformFees: 58_000,
  novemberAdminFees: 125_000,
  novemberForkliftFees: 68_500,
  novemberRecoveryFees: 134_000,
  novemberTotalServices: 385_500,
};

const VEHICLE_CATALOG: Array<{ make: string; models: string[]; basePrice: number }> = [
  { make: 'تويوتا', models: ['كامري', 'كورولا', 'راف فور', 'فورتشنر', 'برادو'], basePrice: 8200 },
  { make: 'نيسان', models: ['ألتيما', 'إكس تريل', 'باثفايندر', 'صني', 'باترول'], basePrice: 7400 },
  { make: 'هوندا', models: ['أكورد', 'سيفيك', 'CR-V', 'بايلوت'], basePrice: 6800 },
  { make: 'هيونداي', models: ['سوناتا', 'إلنترا', 'توسان', 'سانتا في'], basePrice: 5900 },
  { make: 'كيا', models: ['سبورتاج', 'أوبتيما', 'سورينتو', 'سيراتو'], basePrice: 5600 },
  { make: 'فورد', models: ['إكسبلورر', 'تورس', 'إيدج', 'F-150'], basePrice: 7900 },
  { make: 'شيفروليه', models: ['تاهو', 'ماليبو', 'كابتيفا', 'ترافيرس'], basePrice: 7600 },
  { make: 'ميتسوبيشي', models: ['باجيرو', 'أوتلاندر', 'لانسر', 'ASX'], basePrice: 5300 },
  { make: 'لكزس', models: ['ES 350', 'RX 350', 'IS 300', 'GX 460'], basePrice: 12800 },
  { make: 'إنفينيتي', models: ['QX80', 'Q50', 'QX60'], basePrice: 10900 },
  { make: 'مرسيدس', models: ['C200', 'E300', 'GLE 450'], basePrice: 14500 },
  { make: 'بي إم دبليو', models: ['320i', '530i', 'X5'], basePrice: 13800 },
];

const TOP_5_LUXURY: Array<{
  make: string;
  model: string;
  modelYear: number;
  estimatedValue: number;
  salePrice: number;
}> = [
  { make: 'مرسيدس', model: 'S-Class S580', modelYear: 2024, estimatedValue: 295_000, salePrice: 345_000 },
  { make: 'لكزس', model: 'LX 600', modelYear: 2024, estimatedValue: 265_000, salePrice: 310_000 },
  { make: 'تويوتا', model: 'لاندكروزر VXR', modelYear: 2024, estimatedValue: 240_000, salePrice: 285_000 },
  { make: 'بي إم دبليو', model: 'X7 xDrive40i', modelYear: 2023, estimatedValue: 215_000, salePrice: 255_000 },
  { make: 'نيسان', model: 'باترول بلاتينيوم', modelYear: 2024, estimatedValue: 195_000, salePrice: 235_000 },
];

const DEMO_BIDDER_NAMES = [
  'مزايد تجريبي - شركة الأفق لتجارة المركبات',
  'مزايد تجريبي - مؤسسة الريادة للسيارات',
  'مزايد تجريبي - معرض النخبة الإماراتي',
  'مزايد تجريبي - شركة المسار المتقدم',
  'مزايد تجريبي - مركز الخليج للمركبات',
  'مزايد تجريبي - مجموعة الواحة للتجارة',
  'مزايد تجريبي - شركة الفجر للنقل والسيارات',
  'مزايد تجريبي - مؤسسة الساحل الذهبي',
];

const PAYMENT_METHODS: Array<'bank_transfer' | 'card' | 'cheque' | 'cash'> = [
  'bank_transfer',
  'card',
  'cheque',
  'cash',
];

function seededNoise(index: number, salt: number): number {
  const x = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Distributes exact positive integer sum across `count` items proportionally to `weights`,
 * guaranteeing exact integer total equal to `targetSum` and keeping values >= `minVal`.
 */
function allocateExactIntegers(
  weights: number[],
  targetSum: number,
  minVal = 1
): number[] {
  const count = weights.length;
  if (count === 0) return [];
  const totalWeight = weights.reduce((s, w) => s + Math.max(0.001, w), 0);
  const raw = weights.map((w) =>
    Math.max(minVal, Math.floor((targetSum * Math.max(0.001, w)) / totalWeight))
  );
  let current = raw.reduce((s, v) => s + v, 0);
  let diff = targetSum - current;
  let i = 0;
  let guard = 0;
  while (diff !== 0 && guard < count * 5000) {
    const idx = i % count;
    if (diff > 0) {
      raw[idx] += 1;
      diff -= 1;
    } else if (raw[idx] > minVal) {
      raw[idx] -= 1;
      diff += 1;
    }
    i++;
    guard++;
  }
  return raw;
}

function padNum(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function buildSyntheticVin(seq: number): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(seededNoise(seq + i * 17, 91 + i) * chars.length);
    suffix += chars[idx];
  }
  return `DEMO1SAAED26${padNum(seq, 4)}${suffix}`.slice(0, 17);
}

export function generateDemoDataset(ownerId = 'demo_workspace'): DemoDataset {
  const nowIso = new Date().toISOString();

  // 1. Auctions: 4 in November 2026 + 2 earlier historical auctions (Sep & Oct 2026)
  const novemberAuctionSpecs = [
    {
      id: 'DEMO-AUC-2026-001',
      auctionCode: 'DEMO-AUC-2026-001',
      title: 'مزاد مصفح التنفيذي الرئيسي (تجريبي) – نوفمبر 2026',
      location: 'ساحة الحجز – مصفح',
      auctionDate: '2026-11-05',
      status: 'approved' as const,
      total: 450,
      sold: 402,
      unsold: 48,
      notes: 'بيانات تجريبية – مزاد ساحة مصفح الرئيسي، يشمل المركبات الفاخرة والعامة.',
    },
    {
      id: 'DEMO-AUC-2026-002',
      auctionCode: 'DEMO-AUC-2026-002',
      title: 'مزاد العين الإقليمي (تجريبي) – نوفمبر 2026',
      location: 'ساحة الحجز – العين',
      auctionDate: '2026-11-12',
      status: 'closed' as const,
      total: 320,
      sold: 284,
      unsold: 36,
      notes: 'بيانات تجريبية – مزاد ساحة العين الإقليمي بانتظار المراجعة الختامية.',
    },
    {
      id: 'DEMO-AUC-2026-003',
      auctionCode: 'DEMO-AUC-2026-003',
      title: 'مزاد الشارقة للمركبات (تجريبي) – نوفمبر 2026',
      location: 'ساحة الحجز – الشارقة',
      auctionDate: '2026-11-19',
      status: 'active' as const,
      total: 280,
      sold: 246,
      unsold: 34,
      notes: 'بيانات تجريبية – جلسة المزاد الثالثة لشهر نوفمبر 2026.',
    },
    {
      id: 'DEMO-AUC-2026-004',
      auctionCode: 'DEMO-AUC-2026-004',
      title: 'مزاد الفجيرة والساحل الشرقي (تجريبي) – نوفمبر 2026',
      location: 'ساحة الحجز – الفجيرة',
      auctionDate: '2026-11-26',
      status: 'active' as const,
      total: 200,
      sold: 172,
      unsold: 28,
      notes: 'بيانات تجريبية – جلسة ختام نوفمبر 2026 في الساحل الشرقي.',
    },
  ];

  const auctions: Auction[] = [
    ...novemberAuctionSpecs.map((spec) => ({
      id: spec.id,
      title: spec.title,
      auctionCode: spec.auctionCode,
      location: spec.location,
      year: 2026,
      month: 11,
      auctionDate: spec.auctionDate,
      status: spec.status,
      saaedSharePercent: 70,
      thirdPartySharePercent: 30,
      notes: spec.notes,
      isDemo: true,
      ownerId,
      createdAt: nowIso,
      updatedAt: nowIso,
    })),
    {
      id: 'DEMO-AUC-2026-OCT',
      title: 'مزاد الشارقة الشهري (تجريبي) – أكتوبر 2026',
      auctionCode: 'DEMO-AUC-2026-000B',
      location: 'ساحة الحجز – الشارقة',
      year: 2026,
      month: 10,
      auctionDate: '2026-10-18',
      status: 'approved',
      saaedSharePercent: 70,
      thirdPartySharePercent: 30,
      notes: 'بيانات تجريبية تاريخية لأكتوبر 2026 لدعم المقارنات الشهرية.',
      isDemo: true,
      ownerId,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'DEMO-AUC-2026-SEP',
      title: 'مزاد مصفح الافتتاحي (تجريبي) – سبتمبر 2026',
      auctionCode: 'DEMO-AUC-2026-000A',
      location: 'ساحة الحجز – مصفح',
      year: 2026,
      month: 9,
      auctionDate: '2026-09-14',
      status: 'approved',
      saaedSharePercent: 70,
      thirdPartySharePercent: 30,
      notes: 'بيانات تجريبية تاريخية لسبتمبر 2026 لدعم المقارنات الشهرية.',
      isDemo: true,
      ownerId,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  // 2. Build November 2026 Vehicles (Exact 1,250 total = 1,104 sold + 146 unsold)
  interface DraftVehSlot {
    seq: number;
    auctionId: string;
    location: string;
    auctionDate: string;
    isSold: boolean;
    isTop5Index: number; // 0..4 or -1
    catalogIdx: number;
    modelIdx: number;
    modelYear: number;
    weight: number;
  }

  const slots: DraftVehSlot[] = [];
  let seqCounter = 1;
  let top5Idx = 0;

  for (const spec of novemberAuctionSpecs) {
    for (let j = 0; j < spec.sold; j++) {
      const catIdx = Math.floor(seededNoise(seqCounter, 11) * VEHICLE_CATALOG.length);
      const cat = VEHICLE_CATALOG[catIdx];
      const modIdx = Math.floor(seededNoise(seqCounter, 23) * cat.models.length);
      const yr = 2018 + Math.floor(seededNoise(seqCounter, 37) * 7); // 2018..2024
      const yearMult = 0.8 + (yr - 2018) * 0.08;
      const isLuxury = spec.id === 'DEMO-AUC-2026-001' && top5Idx < TOP_5_LUXURY.length;
      const assignedTop5 = isLuxury ? top5Idx++ : -1;

      slots.push({
        seq: seqCounter,
        auctionId: spec.id,
        location: spec.location,
        auctionDate: spec.auctionDate,
        isSold: true,
        isTop5Index: assignedTop5,
        catalogIdx: catIdx,
        modelIdx: modIdx,
        modelYear: assignedTop5 >= 0 ? TOP_5_LUXURY[assignedTop5].modelYear : yr,
        weight: cat.basePrice * yearMult * (0.72 + seededNoise(seqCounter, 41) * 0.65),
      });
      seqCounter++;
    }

    for (let j = 0; j < spec.unsold; j++) {
      const catIdx = Math.floor(seededNoise(seqCounter, 13) * VEHICLE_CATALOG.length);
      const cat = VEHICLE_CATALOG[catIdx];
      const modIdx = Math.floor(seededNoise(seqCounter, 29) * cat.models.length);
      const yr = 2016 + Math.floor(seededNoise(seqCounter, 43) * 7); // 2016..2022
      const yearMult = 0.72 + (yr - 2016) * 0.06;

      slots.push({
        seq: seqCounter,
        auctionId: spec.id,
        location: spec.location,
        auctionDate: spec.auctionDate,
        isSold: false,
        isTop5Index: -1,
        catalogIdx: catIdx,
        modelIdx: modIdx,
        modelYear: yr,
        weight: cat.basePrice * yearMult * (0.65 + seededNoise(seqCounter, 53) * 0.55),
      });
      seqCounter++;
    }
  }

  // Separate standard sold (1,099) & unsold (146) to compute exact integer financial allocations
  const standardSoldSlots = slots.filter((s) => s.isSold && s.isTop5Index === -1);
  const unsoldSlots = slots.filter((s) => !s.isSold);

  const top5SaleSum = TOP_5_LUXURY.reduce((s, v) => s + v.salePrice, 0); // 1,430,000
  const top5EstSum = TOP_5_LUXURY.reduce((s, v) => s + v.estimatedValue, 0); // 1,210,000

  // Target: Sold total sale = 9,200,000; Sold total est = 7,650,000; Unsold total est = 800,000 -> All Est = 8,450,000
  const remainingSaleTarget = 9_200_000 - top5SaleSum; // 7,770,000
  const remainingSoldEstTarget = 7_650_000 - top5EstSum; // 6,440,000
  const unsoldEstTarget = 800_000;

  const stdSoldSalePrices = allocateExactIntegers(
    standardSoldSlots.map((s) => s.weight * (1.06 + seededNoise(s.seq, 61) * 0.28)),
    remainingSaleTarget,
    2500
  );
  const stdSoldEstValues = allocateExactIntegers(
    standardSoldSlots.map((s) => s.weight),
    remainingSoldEstTarget,
    2200
  );
  const unsoldEstValues = allocateExactIntegers(
    unsoldSlots.map((s) => s.weight),
    unsoldEstTarget,
    2000
  );

  // Build maps by seq
  const soldPriceBySeq = new Map<number, number>();
  const estValueBySeq = new Map<number, number>();

  let stdIdx = 0;
  let unsIdx = 0;
  for (const slot of slots) {
    if (slot.isSold) {
      if (slot.isTop5Index >= 0) {
        const lux = TOP_5_LUXURY[slot.isTop5Index];
        soldPriceBySeq.set(slot.seq, lux.salePrice);
        estValueBySeq.set(slot.seq, lux.estimatedValue);
      } else {
        soldPriceBySeq.set(slot.seq, stdSoldSalePrices[stdIdx]);
        estValueBySeq.set(slot.seq, stdSoldEstValues[stdIdx]);
        stdIdx++;
      }
    } else {
      soldPriceBySeq.set(slot.seq, 0);
      estValueBySeq.set(slot.seq, unsoldEstValues[unsIdx]);
      unsIdx++;
    }
  }

  // 3. Allocate Collections & Outstanding Receivables = Exact 250,000 AED across sold vehicles
  // Select 12 unpaid vehicles & 28 partial vehicles from standard sold slots (so top5 are fully paid)
  const unpaidSlots = standardSoldSlots.slice(0, 12);
  const partialSlots = standardSoldSlots.slice(12, 40);
  const unpaidSeqSet = new Set(unpaidSlots.map((s) => s.seq));
  const partialSeqSet = new Set(partialSlots.map((s) => s.seq));

  const unpaidSum = unpaidSlots.reduce((s, slot) => s + (soldPriceBySeq.get(slot.seq) || 0), 0);
  const targetRemaining = 250_000;
  const partialRemainingTarget = targetRemaining - unpaidSum;

  const partialRemainingBySeq = new Map<number, number>();
  if (partialRemainingTarget > 0) {
    const partialMaxCap = partialSlots.map((slot) => (soldPriceBySeq.get(slot.seq) || 2000) - 500);
    const partialRemainings = allocateExactIntegers(
      partialSlots.map((slot, i) => Math.max(500, partialMaxCap[i] * (0.4 + seededNoise(slot.seq, 77) * 0.4))),
      partialRemainingTarget,
      300
    );
    // Clamp each to < salePrice while keeping exact sum
    let excess = 0;
    for (let i = 0; i < partialSlots.length; i++) {
      const cap = partialMaxCap[i];
      if (partialRemainings[i] > cap) {
        excess += partialRemainings[i] - cap;
        partialRemainings[i] = cap;
      }
    }
    let idx = 0;
    while (excess > 0 && idx < partialSlots.length * 10) {
      const pIdx = idx % partialSlots.length;
      if (partialRemainings[pIdx] < partialMaxCap[pIdx]) {
        const add = Math.min(excess, partialMaxCap[pIdx] - partialRemainings[pIdx]);
        partialRemainings[pIdx] += add;
        excess -= add;
      }
      idx++;
    }
    for (let i = 0; i < partialSlots.length; i++) {
      partialRemainingBySeq.set(partialSlots[i].seq, partialRemainings[i]);
    }
  }

  // 4. Allocate exact Service Fees across November 2026:
  // Platform = 58,000 | Admin = 125,000 | Forklift = 68,500 | Recovery = 134,000 | Total = 385,500
  const soldSlots = slots.filter((s) => s.isSold);
  const platformSlots = soldSlots.slice(0, 580); // 580 * 100 = 58,000
  const adminSlots = soldSlots.slice(0, 625); // 625 * 200 = 125,000
  const forkliftSlots = slots.slice(0, 342); // 340 * 200 + 2 * 250 = 68,500
  const recoverySlots = slots.slice(100, 435); // 335 * 400 = 134,000

  const platformFeeBySeq = new Map<number, number>();
  platformSlots.forEach((s) => platformFeeBySeq.set(s.seq, 100));

  const adminFeeBySeq = new Map<number, number>();
  adminSlots.forEach((s) => adminFeeBySeq.set(s.seq, 200));

  const forkliftFeeBySeq = new Map<number, number>();
  forkliftSlots.forEach((s, idx) => forkliftFeeBySeq.set(s.seq, idx < 340 ? 200 : 250));

  const recoveryFeeBySeq = new Map<number, number>();
  recoverySlots.forEach((s) => recoveryFeeBySeq.set(s.seq, 400));

  // Build final November Vehicle, CollectionRecord, and ServiceFeeRecord arrays
  const vehicles: Vehicle[] = [];
  const collections: CollectionRecord[] = [];
  const serviceRecords: ServiceFeeRecord[] = [];

  let paySeq = 1;
  let srvSeq = 1;

  for (const slot of slots) {
    const vehId = `DEMO-VEH-${padNum(slot.seq, 4)}`;
    const estVal = estValueBySeq.get(slot.seq) || 0;
    const salePrice = soldPriceBySeq.get(slot.seq) || 0;

    let collected = 0;
    let payStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (slot.isSold) {
      if (unpaidSeqSet.has(slot.seq)) {
        collected = 0;
        payStatus = 'unpaid';
      } else if (partialSeqSet.has(slot.seq)) {
        const rem = partialRemainingBySeq.get(slot.seq) || 0;
        collected = salePrice - rem;
        payStatus = 'partial';
      } else {
        collected = salePrice;
        payStatus = 'paid';
      }
    }

    const pFee = platformFeeBySeq.get(slot.seq) || 0;
    const aFee = adminFeeBySeq.get(slot.seq) || 0;
    const fFee = forkliftFeeBySeq.get(slot.seq) || 0;
    const rFee = recoveryFeeBySeq.get(slot.seq) || 0;

    const cat = VEHICLE_CATALOG[slot.catalogIdx];
    const isLux = slot.isTop5Index >= 0;
    const make = isLux ? TOP_5_LUXURY[slot.isTop5Index].make : cat.make;
    const model = isLux ? TOP_5_LUXURY[slot.isTop5Index].model : cat.models[slot.modelIdx];
    const buyerName = slot.isSold
      ? DEMO_BIDDER_NAMES[slot.seq % DEMO_BIDDER_NAMES.length]
      : undefined;

    vehicles.push({
      id: vehId,
      auctionId: slot.auctionId,
      lotNumber: `DEMO-LOT-${padNum(slot.seq, 4)}`,
      make,
      model,
      modelYear: slot.modelYear,
      vin: buildSyntheticVin(slot.seq),
      location: slot.location,
      year: 2026,
      month: 11,
      estimatedValue: estVal,
      salePrice,
      collectedAmount: collected,
      status: slot.isSold ? 'sold' : 'unsold',
      ...(slot.isSold ? { saleDate: slot.auctionDate, paymentStatus: payStatus } : {}),
      platformFee: pFee,
      adminFee: aFee,
      forkliftFee: fFee,
      recoveryFee: rFee,
      ...(buyerName ? { buyerName } : {}),
      isDemo: true,
      ownerId,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    if (slot.isSold) {
      const payId = `DEMO-PAY-${padNum(paySeq, 4)}`;
      const method = PAYMENT_METHODS[paySeq % PAYMENT_METHODS.length];
      collections.push({
        id: payId,
        auctionId: slot.auctionId,
        vehicleId: vehId,
        lotNumber: `DEMO-LOT-${padNum(slot.seq, 4)}`,
        receiptNo: payId,
        bidderName: buyerName || DEMO_BIDDER_NAMES[0],
        amountDue: salePrice,
        amount: collected,
        remainingAmount: salePrice - collected,
        paymentStatus: payStatus,
        method,
        collectionDate: slot.auctionDate,
        financialRef: `FIN-REF-202611-${padNum(paySeq, 4)}`,
        collectionType: 'vehicle_sale',
        year: 2026,
        month: 11,
        location: slot.location,
        notes:
          payStatus === 'paid'
            ? 'سداد كامل لثمن بيع المركبة (تجريبي)'
            : payStatus === 'partial'
              ? 'سداد جزئي – المتبقي قيد التحصيل (تجريبي)'
              : 'مبيعة – بانتظار السداد المالي (تجريبي)',
        isDemo: true,
        ownerId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      paySeq++;
    }

    // Create granular ServiceFeeRecord entries linked to this vehicle & auction
    const feeEntries: Array<{
      type: 'platform' | 'admin' | 'forklift' | 'recovery';
      amount: number;
      beneficiary: string;
    }> = [
      { type: 'platform', amount: pFee, beneficiary: 'شركة ساعد – رسوم المنصة الإلكترونية' },
      { type: 'admin', amount: aFee, beneficiary: 'شركة ساعد – الرسوم الإدارية' },
      { type: 'forklift', amount: fFee, beneficiary: 'شركة ساعد – تشغيل الرافعات الشوكية' },
      { type: 'recovery', amount: rFee, beneficiary: 'شركة ساعد – خدمات الريكفري والنقل' },
    ];

    for (const fe of feeEntries) {
      if (fe.amount <= 0) continue;
      const srvId = `DEMO-SRV-${padNum(srvSeq, 4)}`;
      serviceRecords.push({
        id: srvId,
        serviceCode: srvId,
        serviceType: fe.type,
        auctionId: slot.auctionId,
        vehicleId: vehId,
        lotNumber: `DEMO-LOT-${padNum(slot.seq, 4)}`,
        serviceDate: slot.auctionDate,
        amountDue: fe.amount,
        collectedAmount: fe.amount,
        collectionStatus: 'collected',
        referenceNo: `SRV-REF-202611-${padNum(srvSeq, 4)}`,
        beneficiary: fe.beneficiary,
        year: 2026,
        month: 11,
        location: slot.location,
        isDemo: true,
        ownerId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      srvSeq++;
    }
  }

  // 5. Add Historical Demo Months (Sep & Oct 2026) so Multi-Month Comparisons & Trend Charts are rich
  const historicalSpecs = [
    {
      auctionId: 'DEMO-AUC-2026-OCT',
      location: 'ساحة الحجز – الشارقة',
      month: 10,
      date: '2026-10-18',
      total: 220,
      sold: 192,
      seqOffset: 2001,
    },
    {
      auctionId: 'DEMO-AUC-2026-SEP',
      location: 'ساحة الحجز – مصفح',
      month: 9,
      date: '2026-09-14',
      total: 180,
      sold: 155,
      seqOffset: 3001,
    },
  ];

  for (const hSpec of historicalSpecs) {
    for (let k = 0; k < hSpec.total; k++) {
      const seq = hSpec.seqOffset + k;
      const vehId = `DEMO-VEH-${padNum(seq, 4)}`;
      const isSold = k < hSpec.sold;
      const cat = VEHICLE_CATALOG[seq % VEHICLE_CATALOG.length];
      const model = cat.models[seq % cat.models.length];
      const estVal = Math.round(cat.basePrice * (0.85 + seededNoise(seq, 9) * 0.6));
      const salePrice = isSold
        ? Math.round(estVal * (1.03 + seededNoise(seq, 19) * 0.22))
        : 0;
      const collected = isSold && k < hSpec.sold - 4 ? salePrice : isSold ? Math.round(salePrice * 0.6) : 0;
      const payStatus: 'paid' | 'partial' | 'unpaid' =
        collected === salePrice ? 'paid' : collected > 0 ? 'partial' : 'unpaid';
      const pFee = isSold && k % 2 === 0 ? 100 : 0;
      const aFee = isSold && k % 2 === 0 ? 200 : 0;
      const fFee = k % 4 === 0 ? 200 : 0;
      const rFee = k % 5 === 0 ? 350 : 0;
      const buyerName = isSold ? DEMO_BIDDER_NAMES[seq % DEMO_BIDDER_NAMES.length] : undefined;

      vehicles.push({
        id: vehId,
        auctionId: hSpec.auctionId,
        lotNumber: `DEMO-LOT-${padNum(seq, 4)}`,
        make: cat.make,
        model,
        modelYear: 2019 + (seq % 6),
        vin: buildSyntheticVin(seq),
        location: hSpec.location,
        year: 2026,
        month: hSpec.month,
        estimatedValue: estVal,
        salePrice,
        collectedAmount: collected,
        status: isSold ? 'sold' : 'unsold',
        ...(isSold ? { saleDate: hSpec.date, paymentStatus: payStatus } : {}),
        platformFee: pFee,
        adminFee: aFee,
        forkliftFee: fFee,
        recoveryFee: rFee,
        ...(buyerName ? { buyerName } : {}),
        isDemo: true,
        ownerId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      if (isSold) {
        const payId = `DEMO-PAY-${padNum(paySeq, 4)}`;
        collections.push({
          id: payId,
          auctionId: hSpec.auctionId,
          vehicleId: vehId,
          lotNumber: `DEMO-LOT-${padNum(seq, 4)}`,
          receiptNo: payId,
          bidderName: buyerName || DEMO_BIDDER_NAMES[0],
          amountDue: salePrice,
          amount: collected,
          remainingAmount: salePrice - collected,
          paymentStatus: payStatus,
          method: PAYMENT_METHODS[paySeq % PAYMENT_METHODS.length],
          collectionDate: hSpec.date,
          financialRef: `FIN-REF-2026${padNum(hSpec.month, 2)}-${padNum(paySeq, 4)}`,
          collectionType: 'vehicle_sale',
          year: 2026,
          month: hSpec.month,
          location: hSpec.location,
          notes: `تحصيل تاريخي تجريبي - شهر ${hSpec.month}`,
          isDemo: true,
          ownerId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        paySeq++;
      }

      const hFees: Array<{
        type: 'platform' | 'admin' | 'forklift' | 'recovery';
        amount: number;
        beneficiary: string;
      }> = [
        { type: 'platform', amount: pFee, beneficiary: 'شركة ساعد – رسوم المنصة الإلكترونية' },
        { type: 'admin', amount: aFee, beneficiary: 'شركة ساعد – الرسوم الإدارية' },
        { type: 'forklift', amount: fFee, beneficiary: 'شركة ساعد – تشغيل الرافعات الشوكية' },
        { type: 'recovery', amount: rFee, beneficiary: 'شركة ساعد – خدمات الريكفري والنقل' },
      ];
      for (const fe of hFees) {
        if (fe.amount <= 0) continue;
        const srvId = `DEMO-SRV-${padNum(srvSeq, 4)}`;
        serviceRecords.push({
          id: srvId,
          serviceCode: srvId,
          serviceType: fe.type,
          auctionId: hSpec.auctionId,
          vehicleId: vehId,
          lotNumber: `DEMO-LOT-${padNum(seq, 4)}`,
          serviceDate: hSpec.date,
          amountDue: fe.amount,
          collectedAmount: fe.amount,
          collectionStatus: 'collected',
          referenceNo: `SRV-REF-2026${padNum(hSpec.month, 2)}-${padNum(srvSeq, 4)}`,
          beneficiary: fe.beneficiary,
          year: 2026,
          month: hSpec.month,
          location: hSpec.location,
          isDemo: true,
          ownerId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        srvSeq++;
      }
    }
  }

  // 6. Seed Draft & Under-Review Demo Reports + Historical Approved Snapshot
  const octVehicles = vehicles.filter((v) => v.year === 2026 && v.month === 10);
  const octSold = octVehicles.filter((v) => v.status === 'sold');
  const octCollected = octVehicles.reduce((s, v) => s + v.collectedAmount, 0);
  const octServices = serviceRecords
    .filter((s) => s.year === 2026 && s.month === 10)
    .reduce((s, r) => s + r.collectedAmount, 0);

  const approvedReports: ApprovedReport[] = [
    {
      id: 'DEMO-REP-NOV-2026-REVIEW',
      title: 'التقرير المالي التنفيذي (تجريبي – قيد المراجعة) – نوفمبر 2026',
      periodType: 'monthly',
      year: 2026,
      month: 11,
      location: 'جميع الساحات',
      totalVehicles: 1250,
      soldVehicles: 1104,
      totalEstimated: 8_450_000,
      soldEstimated: 7_650_000,
      totalSale: 9_200_000,
      totalCollected: 8_950_000,
      outstandingReceivables: 250_000,
      saaedShareAmount: 6_265_000,
      thirdPartyShareAmount: 2_685_000,
      totalPlatformFees: 58_000,
      totalAdminFees: 125_000,
      totalForkliftFees: 68_500,
      totalRecoveryFees: 134_000,
      totalServices: 385_500,
      highestVehicleLabel: 'مرسيدس S-Class S580',
      highestVehiclePrice: 345_000,
      approvedByName: 'لجنة المراجعة المالية (تجريبي)',
      version: 1,
      status: 'under_review',
      notes: 'تقرير تجريبي خاضع للمراجعة المالية والتنفيذية.',
      isDemo: true,
      ownerId,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'DEMO-REP-NOV-2026-DRAFT',
      title: 'مسودة التقرير المالي لمزاد مصفح (تجريبي) – نوفمبر 2026',
      periodType: 'auction',
      year: 2026,
      month: 11,
      auctionId: 'DEMO-AUC-2026-001',
      location: 'ساحة الحجز – مصفح',
      totalVehicles: 450,
      soldVehicles: 402,
      totalEstimated: vehicles
        .filter((v) => v.auctionId === 'DEMO-AUC-2026-001')
        .reduce((s, v) => s + v.estimatedValue, 0),
      totalSale: vehicles
        .filter((v) => v.auctionId === 'DEMO-AUC-2026-001' && v.status === 'sold')
        .reduce((s, v) => s + v.salePrice, 0),
      totalCollected: vehicles
        .filter((v) => v.auctionId === 'DEMO-AUC-2026-001')
        .reduce((s, v) => s + v.collectedAmount, 0),
      saaedShareAmount: Math.round(
        vehicles
          .filter((v) => v.auctionId === 'DEMO-AUC-2026-001')
          .reduce((s, v) => s + v.collectedAmount, 0) * 0.7
      ),
      thirdPartyShareAmount: Math.round(
        vehicles
          .filter((v) => v.auctionId === 'DEMO-AUC-2026-001')
          .reduce((s, v) => s + v.collectedAmount, 0) * 0.3
      ),
      totalServices: serviceRecords
        .filter((s) => s.auctionId === 'DEMO-AUC-2026-001')
        .reduce((s, r) => s + r.collectedAmount, 0),
      approvedByName: 'مسودة إعداد النظام التجريبي',
      version: 1,
      status: 'draft',
      notes: 'مسودة أولية لمزاد مصفح في بيئة العرض التجريبي.',
      isDemo: true,
      ownerId,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'DEMO-REP-OCT-2026-APPROVED',
      title: 'التقرير المالي المعتمد (تجريبي) – أكتوبر 2026',
      periodType: 'monthly',
      year: 2026,
      month: 10,
      location: 'ساحة الحجز – الشارقة',
      totalVehicles: octVehicles.length,
      soldVehicles: octSold.length,
      totalEstimated: octVehicles.reduce((s, v) => s + v.estimatedValue, 0),
      totalSale: octSold.reduce((s, v) => s + v.salePrice, 0),
      totalCollected: octCollected,
      saaedShareAmount: Math.round(octCollected * 0.7),
      thirdPartyShareAmount: octCollected - Math.round(octCollected * 0.7),
      totalServices: octServices,
      approvedByName: 'خالد الهاشمي (اعتماد تجريبي)',
      approvedAt: '2026-10-31T16:30:00Z',
      version: 1,
      status: 'approved',
      notes: 'نسخة Snapshot ثابتة لشهر أكتوبر 2026 في بيئة Demo.',
      isDemo: true,
      ownerId,
      createdAt: '2026-10-31T16:30:00Z',
      updatedAt: '2026-10-31T16:30:00Z',
    },
  ];

  return {
    auctions,
    vehicles,
    collections,
    serviceRecords,
    approvedReports,
  };
}

/**
 * Automated 12-Point Financial & Integration Validation Suite
 * Evaluates actual live records without hardcoded PASS results.
 */
export function runFinancialValidationSuite(params: {
  auctions: Auction[];
  vehicles: Vehicle[];
  collections: CollectionRecord[];
  serviceRecords: ServiceFeeRecord[];
  approvedReports: ApprovedReport[];
  settings: SystemSettings;
  isDemoMode: boolean;
}): ValidationTestResult[] {
  const {
    auctions,
    vehicles,
    collections,
    serviceRecords,
    approvedReports,
    settings,
    isDemoMode,
  } = params;

  const novFilter: FilterState = {
    month: 11,
    year: 2026,
    location: 'all',
    auctionId: 'all',
    status: 'all',
  };

  const novAuctions = filterAuctions(auctions, novFilter);
  const novVehicles = filterVehicles(vehicles, novFilter);
  const novCollections = filterCollections(collections, novFilter, novVehicles);
  const novServices = filterServiceRecords(serviceRecords, novFilter, novVehicles);
  const novMetrics = computeFinancialMetrics(
    novVehicles,
    novAuctions,
    novCollections,
    settings,
    novFilter,
    novServices,
    isDemoMode
  );

  const results: ValidationTestResult[] = [];

  // Test 1: 1,250 Vehicles in November 2026
  const t1Diff = novVehicles.length - 1250;
  results.push({
    id: 'T01',
    name: '1. التحقق من وجود 1,250 مركبة في نوفمبر 2026',
    passed: novVehicles.length === 1250,
    expected: '1,250 مركبة',
    actual: `${formatNumber(novVehicles.length)} مركبة`,
    diff: `${t1Diff >= 0 ? '+' : ''}${t1Diff}`,
    details: 'مطابقة إجمالي سجلات المركبات المرتبطة بمزادات نوفمبر 2026.',
  });

  // Test 2: 1,104 Sold and 146 Unsold
  const t2Pass = novMetrics.soldCount === 1104 && novMetrics.unsoldCount === 146;
  results.push({
    id: 'T02',
    name: '2. التحقق من 1,104 مركبات مبيعة و146 غير مبيعة',
    passed: t2Pass,
    expected: '1,104 مبيعة / 146 غير مبيعة',
    actual: `${formatNumber(novMetrics.soldCount)} مبيعة / ${formatNumber(novMetrics.unsoldCount)} غير مبيعة`,
    diff: `فرق المبيعة: ${novMetrics.soldCount - 1104} | غير المبيعة: ${novMetrics.unsoldCount - 146}`,
    details: `نسبة نجاح البيع المحسوبة: ${novMetrics.saleSuccessRate?.toFixed(2) ?? '0.00'}% (المستهدف 88.32%).`,
  });

  // Test 3: Total Sale Value = 9,200,000 AED & Estimated = 8,450,000 AED
  const saleDiff = novMetrics.totalSaleValue - 9_200_000;
  const estDiff = novMetrics.totalEstimatedValue - 8_450_000;
  results.push({
    id: 'T03',
    name: '3. مطابقة إجمالي البيع (9,200,000) والقيمة التقديرية (8,450,000)',
    passed: saleDiff === 0 && estDiff === 0,
    expected: 'بيع AED 9,200,000 | تقديري AED 8,450,000',
    actual: `بيع ${formatAED(novMetrics.totalSaleValue)} | تقديري ${formatAED(novMetrics.totalEstimatedValue)}`,
    diff: `فرق البيع: ${formatAED(saleDiff)} | فرق التقديري: ${formatAED(estDiff)}`,
    details: `القيمة التقديرية للمبيعة فقط: ${formatAED(novMetrics.soldEstimatedValue)} (مقارنة على نفس المجموعة).`,
  });

  // Test 4: Total Collected = 8,950,000 AED
  const colFromReceipts = novCollections
    .filter((c) => c.collectionType !== 'service_fee')
    .reduce((s, c) => s + c.amount, 0);
  const colDiff = novMetrics.totalCollected - 8_950_000;
  const receiptMatch = Math.abs(colFromReceipts - novMetrics.totalCollected) < 0.01;
  results.push({
    id: 'T04',
    name: '4. التحقق من إجمالي التحصيل الفعلي 8,950,000 درهم',
    passed: Math.abs(colDiff) < 0.01 && receiptMatch,
    expected: 'AED 8,950,000',
    actual: `${formatAED(novMetrics.totalCollected)} (سندات: ${formatAED(colFromReceipts)})`,
    diff: formatAED(colDiff),
    details: `نسبة التحصيل: ${novMetrics.collectionRate?.toFixed(2) ?? '0.00'}% (تطابق السندات والمركبات: ${receiptMatch ? 'متطابق' : 'غير متطابق'}).`,
  });

  // Test 5: Outstanding Receivables = 250,000 AED
  const remDiff = novMetrics.outstandingReceivables - 250_000;
  results.push({
    id: 'T05',
    name: '5. التحقق من الرصيد المتبقي 250,000 درهم',
    passed: Math.abs(remDiff) < 0.01,
    expected: 'AED 250,000',
    actual: formatAED(novMetrics.outstandingReceivables),
    diff: formatAED(remDiff),
    details: 'إجمالي المتبقي من العقود المدفوعة جزئياً وغير المسددة.',
  });

  // Test 6: Saaed Share (6,265,000) + Third-Party Share (2,685,000) = 8,950,000
  const shareSum = novMetrics.saaedShareAmount + novMetrics.thirdPartyShareAmount;
  const shareEq =
    Math.abs(novMetrics.saaedShareAmount - 6_265_000) < 0.01 &&
    Math.abs(novMetrics.thirdPartyShareAmount - 2_685_000) < 0.01 &&
    Math.abs(shareSum - novMetrics.totalCollected) < 0.01;
  results.push({
    id: 'T06',
    name: '6. مطابقة حصة ساعد (6,265,000) والطرف الثالث (2,685,000)',
    passed: shareEq,
    expected: 'ساعد AED 6,265,000 + طرف 3 AED 2,685,000 = AED 8,950,000',
    actual: `ساعد ${formatAED(novMetrics.saaedShareAmount)} + طرف 3 ${formatAED(novMetrics.thirdPartyShareAmount)} = ${formatAED(shareSum)}`,
    diff: formatAED(shareSum - 8_950_000),
    details: `الأساس: ${settings.excludeServicesFromShare !== false ? 'محصل مبيعات المركبات فقط (الخدمات مستثناة)' : 'شامل الخدمات'}.`,
  });

  // Test 7: Services Total = 385,500 AED (58k + 125k + 68.5k + 134k)
  const srvDiff = novMetrics.totalServiceFees - 385_500;
  const srvBreakdownOk =
    novMetrics.totalPlatformFees === 58_000 &&
    novMetrics.totalAdminFees === 125_000 &&
    novMetrics.totalForkliftFees === 68_500 &&
    novMetrics.totalRecoveryFees === 134_000;
  results.push({
    id: 'T07',
    name: '7. مطابقة إجمالي رسوم الخدمات 385,500 درهم وتفاصيلها',
    passed: srvDiff === 0 && srvBreakdownOk,
    expected: 'AED 385,500 (58K + 125K + 68.5K + 134K)',
    actual: `${formatAED(novMetrics.totalServiceFees)} (${formatAED(novMetrics.totalPlatformFees)} + ${formatAED(novMetrics.totalAdminFees)} + ${formatAED(novMetrics.totalForkliftFees)} + ${formatAED(novMetrics.totalRecoveryFees)})`,
    diff: formatAED(srvDiff),
    details: `عدد قيود الخدمات المسجلة لشهر نوفمبر: ${formatNumber(novServices.length)} قيداً.`,
  });

  // Test 8: Dashboard vs Tabs Cross-Consistency
  const tabVehiclesSale = novVehicles
    .filter((v) => v.status === 'sold')
    .reduce((s, v) => s + v.salePrice, 0);
  const tabServicesSum = novServices.reduce((s, r) => s + r.collectedAmount, 0);
  const tabAuctionsVehiclesCount = novAuctions.reduce(
    (s, a) => s + novVehicles.filter((v) => v.auctionId === a.id).length,
    0
  );
  const t8Pass =
    tabVehiclesSale === novMetrics.totalSaleValue &&
    tabServicesSum === novMetrics.totalServiceFees &&
    tabAuctionsVehiclesCount === novMetrics.displayedCount;
  results.push({
    id: 'T08',
    name: '8. تطابق أرقام Dashboard مع جداول التبويبات',
    passed: t8Pass,
    expected: 'تطابق 100% بين اللوحة والمزادات والمركبات والتحصيل والخدمات',
    actual: t8Pass ? 'جميع الجداول متطابقة' : 'يوجد تباين بين التبويبات',
    diff: formatAED(tabVehiclesSale - novMetrics.totalSaleValue),
    details: `مجموع مركبات المزادات: ${formatNumber(tabAuctionsVehiclesCount)} | مجموع الخدمات: ${formatAED(tabServicesSum)}.`,
  });

  // Test 9: Reactive Recalculation Simulation (pure non-mutating check)
  const simExtraVehicle: Vehicle = {
    id: 'SIM-VEH-TEST',
    auctionId: novAuctions[0]?.id || 'DEMO-AUC-2026-001',
    lotNumber: 'SIM-1',
    make: 'تويوتا',
    model: 'كامري',
    modelYear: 2024,
    location: novAuctions[0]?.location || 'ساحة الحجز – مصفح',
    year: 2026,
    month: 11,
    estimatedValue: 10_000,
    salePrice: 12_000,
    collectedAmount: 12_000,
    status: 'sold',
    platformFee: 0,
    adminFee: 0,
    forkliftFee: 0,
    recoveryFee: 0,
    ownerId: 'sim',
  };
  const simMetrics = computeFinancialMetrics(
    [...novVehicles, simExtraVehicle],
    novAuctions,
    novCollections,
    settings,
    novFilter,
    novServices,
    isDemoMode
  );
  const t9Pass =
    simMetrics.displayedCount === novMetrics.displayedCount + 1 &&
    simMetrics.totalSaleValue === novMetrics.totalSaleValue + 12_000 &&
    simMetrics.totalCollected === novMetrics.totalCollected + 12_000;
  results.push({
    id: 'T09',
    name: '9. اختبار التحديث الفوري للمؤشرات عند تعديل البيانات',
    passed: t9Pass,
    expected: '+1 مركبة | +12,000 بيع | +12,000 تحصيل',
    actual: `+${simMetrics.displayedCount - novMetrics.displayedCount} مركبة | +${formatNumber(simMetrics.totalSaleValue - novMetrics.totalSaleValue)} بيع`,
    diff: t9Pass ? '0' : 'خلل في إعادة الاحتساب',
    details: 'محاكاة غير معدّلة للتحقق من استجابة المعادلات المركزية فور إضافة أو تعديل أي سجل.',
  });

  // Test 10: Filters Integrity (Month, Year, Location, Auction)
  const musaffahFilter: FilterState = {
    month: 11,
    year: 2026,
    location: 'ساحة الحجز – مصفح',
    auctionId: 'all',
    status: 'all',
  };
  const musaffahVehicles = filterVehicles(vehicles, musaffahFilter);
  const octVehicles = filterVehicles(vehicles, {
    month: 10,
    year: 2026,
    location: 'all',
    auctionId: 'all',
    status: 'all',
  });
  const auc1Filter: FilterState = {
    month: 11,
    year: 2026,
    location: 'all',
    auctionId: 'DEMO-AUC-2026-001',
    status: 'all',
  };
  const auc1Vehicles = filterVehicles(vehicles, auc1Filter);
  const t10Pass =
    musaffahVehicles.length === 450 &&
    auc1Vehicles.length === 450 &&
    octVehicles.length > 0 &&
    octVehicles.every((v) => v.month === 10);
  results.push({
    id: 'T10',
    name: '10. اختبار صحة الفلاتر (الشهر / السنة / الموقع / المزاد)',
    passed: t10Pass,
    expected: 'مصفح 450 | أكتوبر > 0 مستقلة',
    actual: `مصفح ${formatNumber(musaffahVehicles.length)} | مزاد 001: ${formatNumber(auc1Vehicles.length)} | أكتوبر: ${formatNumber(octVehicles.length)}`,
    diff: t10Pass ? '0' : 'تباين في الفلترة',
    details: 'التحقق من عزل الفترات الشهرية والمواقع والساحات والمزادات بدقة.',
  });

  // Test 11: Reports Consistency with Records
  const novReviewRep = approvedReports.find((r) => r.id === 'DEMO-REP-NOV-2026-REVIEW');
  const t11Pass = novReviewRep
    ? novReviewRep.totalVehicles === novMetrics.displayedCount &&
      novReviewRep.totalSale === novMetrics.totalSaleValue &&
      novReviewRep.totalCollected === novMetrics.totalCollected &&
      novReviewRep.totalServices === novMetrics.totalServiceFees
    : novVehicles.length > 0;
  results.push({
    id: 'T11',
    name: '11. مطابقة التقارير مع السجلات التفصيلية',
    passed: t11Pass,
    expected: 'تطابق إجماليات التقرير التنفيذي مع السجلات',
    actual: novReviewRep
      ? `بيع ${formatAED(novReviewRep.totalSale)} | خدمات ${formatAED(novReviewRep.totalServices)}`
      : 'لا يوجد تقرير نوفمبر للمطابقة',
    diff: novReviewRep ? formatAED(novReviewRep.totalSale - novMetrics.totalSaleValue) : '—',
    details: 'مقارنة التقرير المالي لشهر نوفمبر مع الحسابات اللحظية للمركبات والتحصيل والخدمات.',
  });

  // Test 12: Idempotency & Duplicate Check (Zero duplicate IDs across collections)
  const vehIdSet = new Set(vehicles.map((v) => v.id));
  const payIdSet = new Set(collections.map((c) => c.id));
  const srvIdSet = new Set(serviceRecords.map((s) => s.id));
  const aucIdSet = new Set(auctions.map((a) => a.id));
  const dupCount =
    vehicles.length -
    vehIdSet.size +
    (collections.length - payIdSet.size) +
    (serviceRecords.length - srvIdSet.size) +
    (auctions.length - aucIdSet.size);
  results.push({
    id: 'T12',
    name: '12. عدم وجود تكرار أو فقدان بيانات (Idempotent Integrity)',
    passed: dupCount === 0 && vehicles.length > 0,
    expected: '0 سجلات مكررة',
    actual: `${dupCount} سجلات مكررة`,
    diff: String(dupCount),
    details: 'فحص تفرد المعرفات across المزادات والمركبات والتحصيلات والخدمات.',
  });

  return results;
}
