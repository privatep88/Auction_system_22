import {
  Auction,
  CollectionRecord,
  ComputedFinancialMetrics,
  FilterState,
  MonthlyTrendPoint,
  ServiceFeeRecord,
  SystemSettings,
  Vehicle,
} from '../types';
import { BRAND_CONFIG } from '../config/brand';
import { ARABIC_MONTHS, formatAED, formatNumber, formatPercent } from './uaeDate';

export function filterAuctions(auctions: Auction[], filter: FilterState): Auction[] {
  return auctions.filter((a) => {
    if (a.year !== filter.year) return false;
    if (filter.month !== 'all' && a.month !== filter.month) return false;
    if (filter.location !== 'all' && a.location !== filter.location) return false;
    if (filter.auctionId !== 'all' && a.id !== filter.auctionId) return false;
    return true;
  });
}

export function filterVehicles(vehicles: Vehicle[], filter: FilterState): Vehicle[] {
  return vehicles.filter((v) => {
    if (v.year !== filter.year) return false;
    if (filter.month !== 'all' && v.month !== filter.month) return false;
    if (filter.location !== 'all' && v.location !== filter.location) return false;
    if (filter.auctionId !== 'all' && v.auctionId !== filter.auctionId) return false;
    if (filter.status !== 'all' && v.status !== filter.status) return false;
    return true;
  });
}

export function filterCollections(
  collections: CollectionRecord[],
  filter: FilterState,
  filteredVehicles?: Vehicle[]
): CollectionRecord[] {
  const statusFilteredIds =
    filter.status !== 'all' && filteredVehicles
      ? new Set(filteredVehicles.map((v) => v.id))
      : null;

  return collections.filter((c) => {
    if (c.year !== filter.year) return false;
    if (filter.month !== 'all' && c.month !== filter.month) return false;
    if (filter.location !== 'all' && c.location && c.location !== filter.location) return false;
    if (filter.auctionId !== 'all' && c.auctionId !== filter.auctionId) return false;
    if (statusFilteredIds && (!c.vehicleId || !statusFilteredIds.has(c.vehicleId))) return false;
    return true;
  });
}

export function filterServiceRecords(
  serviceRecords: ServiceFeeRecord[],
  filter: FilterState,
  filteredVehicles?: Vehicle[]
): ServiceFeeRecord[] {
  const statusFilteredIds =
    filter.status !== 'all' && filteredVehicles
      ? new Set(filteredVehicles.map((v) => v.id))
      : null;

  return serviceRecords.filter((s) => {
    if (s.year !== filter.year) return false;
    if (filter.month !== 'all' && s.month !== filter.month) return false;
    if (filter.location !== 'all' && s.location !== filter.location) return false;
    if (filter.auctionId !== 'all' && s.auctionId !== filter.auctionId) return false;
    if (statusFilteredIds && (!s.vehicleId || !statusFilteredIds.has(s.vehicleId))) return false;
    return true;
  });
}

export function computeFinancialMetrics(
  vehicles: Vehicle[],
  auctions: Auction[],
  collections: CollectionRecord[],
  settings: SystemSettings,
  filter: FilterState,
  serviceRecords: ServiceFeeRecord[] = [],
  isDemoMode = false
): ComputedFinancialMetrics {
  const auctionMap = new Map<string, Auction>(auctions.map((a) => [a.id, a]));
  const selectedAuction =
    filter.auctionId !== 'all' ? auctionMap.get(filter.auctionId) : undefined;

  const displayedCount = vehicles.length;
  const soldVehicles = vehicles.filter((v) => v.status === 'sold');
  const soldCount = soldVehicles.length;
  const unsoldCount = vehicles.filter((v) => v.status === 'unsold').length;
  const pendingCount = vehicles.filter((v) => v.status === 'pending').length;

  // Distinguish: (1) estimated value of ALL displayed vehicles vs (2) estimated value of SOLD vehicles only
  const totalEstimatedValue = vehicles.reduce((sum, v) => sum + (v.estimatedValue || 0), 0);
  const soldEstimatedValue = soldVehicles.reduce((sum, v) => sum + (v.estimatedValue || 0), 0);
  const totalSaleValue = soldVehicles.reduce((sum, v) => sum + (v.salePrice || 0), 0);

  // Prevent double counting:
  // Vehicle.collectedAmount holds vehicle-level sale collections; unlinked sale receipts (without vehicleId)
  // are added separately. Service fee collections are kept completely separate unless explicitly requested.
  const vehicleCollected = vehicles.reduce((sum, v) => sum + (v.collectedAmount || 0), 0);
  const unlinkedCollected = collections
    .filter((c) => !c.vehicleId && c.collectionType !== 'service_fee')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const vehicleRevenueCollected = vehicleCollected + unlinkedCollected;
  const totalCollected = vehicleRevenueCollected;
  const outstandingReceivables = Math.max(0, totalSaleValue - totalCollected);

  // Top 5 highest priced sold vehicles
  const top5Vehicles = [...soldVehicles]
    .sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0))
    .slice(0, 5);
  const highestVehicle = top5Vehicles[0] || null;

  // Service and platform fees: use granular ServiceFeeRecord table when records exist for the dataset;
  // also include any unrecorded vehicle-level fee differences so direct Vehicle edits react immediately.
  const useServiceRecordsTable = serviceRecords.length > 0;
  let totalPlatformFees = 0;
  let totalAdminFees = 0;
  let totalForkliftFees = 0;
  let totalRecoveryFees = 0;

  if (useServiceRecordsTable) {
    for (const s of serviceRecords) {
      const amt = s.collectedAmount || 0;
      if (s.serviceType === 'platform') totalPlatformFees += amt;
      else if (s.serviceType === 'admin') totalAdminFees += amt;
      else if (s.serviceType === 'forklift') totalForkliftFees += amt;
      else if (s.serviceType === 'recovery') totalRecoveryFees += amt;
    }
    // Include fees for any vehicles that don't yet have linked ServiceFeeRecords (e.g. newly added/imported vehicles)
    const vehiclesWithServiceRecords = new Set(
      serviceRecords.map((s) => s.vehicleId).filter((id): id is string => Boolean(id))
    );
    for (const v of vehicles) {
      if (!vehiclesWithServiceRecords.has(v.id)) {
        totalPlatformFees += v.platformFee || 0;
        totalAdminFees += v.adminFee || 0;
        totalForkliftFees += v.forkliftFee || 0;
        totalRecoveryFees += v.recoveryFee || 0;
      }
    }
  } else {
    totalPlatformFees = vehicles.reduce((sum, v) => sum + (v.platformFee || 0), 0);
    totalAdminFees = vehicles.reduce((sum, v) => sum + (v.adminFee || 0), 0);
    totalForkliftFees = vehicles.reduce((sum, v) => sum + (v.forkliftFee || 0), 0);
    totalRecoveryFees = vehicles.reduce((sum, v) => sum + (v.recoveryFee || 0), 0);
  }

  const totalServiceFees =
    totalPlatformFees + totalAdminFees + totalForkliftFees + totalRecoveryFees;

  // Revenue Share calculation (by default based strictly on collected vehicle sales, excluding service fees)
  const includeServicesInShare = settings.excludeServicesFromShare === false;
  let saaedShareAmount = 0;
  let thirdPartyShareAmount = 0;

  for (const v of vehicles) {
    const collected = v.collectedAmount || 0;
    if (collected <= 0) continue;
    const auc = auctionMap.get(v.auctionId);
    const sPct = auc ? auc.saaedSharePercent : settings.defaultSaaedSharePercent;
    const tPct = auc ? auc.thirdPartySharePercent : settings.defaultThirdPartySharePercent;
    saaedShareAmount += collected * (sPct / 100);
    thirdPartyShareAmount += collected * (tPct / 100);
  }

  for (const c of collections.filter((r) => !r.vehicleId && r.collectionType !== 'service_fee')) {
    const collected = c.amount || 0;
    if (collected <= 0) continue;
    const auc = auctionMap.get(c.auctionId);
    const sPct = auc ? auc.saaedSharePercent : settings.defaultSaaedSharePercent;
    const tPct = auc ? auc.thirdPartySharePercent : settings.defaultThirdPartySharePercent;
    saaedShareAmount += collected * (sPct / 100);
    thirdPartyShareAmount += collected * (tPct / 100);
  }

  if (includeServicesInShare && totalServiceFees > 0) {
    const sPct = selectedAuction
      ? selectedAuction.saaedSharePercent
      : settings.defaultSaaedSharePercent;
    const tPct = selectedAuction
      ? selectedAuction.thirdPartySharePercent
      : settings.defaultThirdPartySharePercent;
    saaedShareAmount += totalServiceFees * (sPct / 100);
    thirdPartyShareAmount += totalServiceFees * (tPct / 100);
  }

  saaedShareAmount = Math.round(saaedShareAmount * 100) / 100;
  thirdPartyShareAmount = Math.round(thirdPartyShareAmount * 100) / 100;

  const shareBase = includeServicesInShare
    ? totalCollected + totalServiceFees
    : totalCollected;

  const saaedSharePercent =
    shareBase > 0
      ? (saaedShareAmount / shareBase) * 100
      : selectedAuction
        ? selectedAuction.saaedSharePercent
        : settings.defaultSaaedSharePercent;

  const thirdPartySharePercent =
    shareBase > 0
      ? (thirdPartyShareAmount / shareBase) * 100
      : selectedAuction
        ? selectedAuction.thirdPartySharePercent
        : settings.defaultThirdPartySharePercent;

  // Core Analytical KPIs
  // IMPORTANT: Sale-vs-Estimate comparison MUST compare sold vehicles' salePrice against the same sold vehicles' estimatedValue!
  const saleSuccessRate = displayedCount > 0 ? (soldCount / displayedCount) * 100 : null;
  const avgSalePrice = soldCount > 0 ? totalSaleValue / soldCount : null;
  const avgEstimatedValue = displayedCount > 0 ? totalEstimatedValue / displayedCount : null;

  const varianceAmount = totalSaleValue - soldEstimatedValue;
  const variancePercent =
    soldEstimatedValue > 0 ? (varianceAmount / soldEstimatedValue) * 100 : null;
  const allVarianceAmount = totalSaleValue - totalEstimatedValue;

  const collectionRate = totalSaleValue > 0 ? (totalCollected / totalSaleValue) * 100 : null;

  // Formal Arabic Executive Analysis generated dynamically strictly from real records
  const executivePoints: string[] = [];
  const executiveRecommendations: string[] = [];

  if (displayedCount === 0) {
    executivePoints.push(
      'لا توجد مركبات مسجلة ضمن الفترة المحددة حالياً لعرض النتائج التشغيلية والمالية.'
    );
    executiveRecommendations.push(
      'يوصى بإضافة سجل المزاد وإدراج بيانات المركبات أو استيرادها من ملف Excel / CSV لتفعيل التحليل التنفيذي.'
    );
  } else {
    const demoNote = isDemoMode ? ' (وفق سجلات بيئة العرض التجريبي Demo)' : '';
    const rateLabel =
      saleSuccessRate !== null && saleSuccessRate >= 80
        ? 'نسبة نجاح بيع مرتفعة'
        : saleSuccessRate !== null && saleSuccessRate >= 55
          ? 'نسبة نجاح بيع متوازنة'
          : 'انخفاض نسبي في معدل إغلاق المبيعات';
    executivePoints.push(
      `حقق المزاد ${rateLabel} بلغت ${formatPercent(saleSuccessRate, 2)} ببيع ${formatNumber(soldCount)} مركبة من أصل ${formatNumber(displayedCount)} مركبة معروضة${demoNote}.`
    );

    if (variancePercent !== null) {
      if (varianceAmount >= 0) {
        executivePoints.push(
          `ارتفعت قيمة البيع الفعلية للمركبات المبيعة (${formatAED(totalSaleValue)}) عن قيمتها التقديرية لنفس المجموعة (${formatAED(soldEstimatedValue)}) بفارق إيجابي قدره ${formatAED(varianceAmount)} (+${variancePercent.toFixed(2)}%)، فيما بلغ إجمالي تقديرات كافة المركبات المعروضة ${formatAED(totalEstimatedValue)}.`
        );
      } else {
        executivePoints.push(
          `انخفضت قيمة البيع الفعلية للمركبات المبيعة (${formatAED(totalSaleValue)}) عن قيمتها التقديرية لنفس المجموعة (${formatAED(soldEstimatedValue)}) بفارق ${formatAED(Math.abs(varianceAmount))} (${variancePercent.toFixed(2)}%).`
        );
      }
    }

    executivePoints.push(
      `بلغ إجمالي المبالغ المحصلة من بيع المركبات ${formatAED(totalCollected)} بنسبة تحصيل ${formatPercent(collectionRate, 2)}، مع ذمم متبقية للتحصيل قدرها ${formatAED(outstandingReceivables)}.`
    );

    executivePoints.push(
      `بلغت إيرادات رسوم المنصة والخدمات الإضافية ${formatAED(totalServiceFees)} (المنصة ${formatAED(totalPlatformFees)}، الإدارية ${formatAED(totalAdminFees)}، الفوركلفت ${formatAED(totalForkliftFees)}، ريكفري ${BRAND_CONFIG.nameAr} ${formatAED(totalRecoveryFees)}).`
    );

    executivePoints.push(
      `بلغ مستحق ${BRAND_CONFIG.companyNameAr} المحسوب ${formatAED(saaedShareAmount)} (${saaedSharePercent.toFixed(2)}%) ومستحق الطرف الثالث ${formatAED(thirdPartyShareAmount)} (${thirdPartySharePercent.toFixed(2)}%) من ${includeServicesInShare ? 'إجمالي المحصل والخدمات' : 'محصل مبيعات المركبات فقط'}.`
    );

    if (outstandingReceivables > 0) {
      executiveRecommendations.push(
        `متابعة تحصيل المبالغ المتبقية البالغة ${formatAED(outstandingReceivables)} من العقود الجزئية وغير المسددة لإغلاق الذمم المالية.`
      );
    } else if (totalCollected > 0) {
      executiveRecommendations.push(
        'الاستمرار في آلية التحصيل الحالية نظراً لاكتمال تحصيل 100% من مبيعات الفترة.'
      );
    }

    if (unsoldCount > 0) {
      executiveRecommendations.push(
        `مراجعة التسعير التقديري لعدد ${formatNumber(unsoldCount)} مركبة غير مبيعة وإعادة طرحها في جلسات المزادات القادمة.`
      );
    }

    if (varianceAmount < 0) {
      executiveRecommendations.push(
        'تحديث معايير التقييم الأولي في ساحة الحجز لمواءمة القيمة التقديرية مع مستويات الطلب السوقي الفعلي.'
      );
    }
  }

  return {
    displayedCount,
    soldCount,
    unsoldCount,
    pendingCount,
    totalEstimatedValue,
    soldEstimatedValue,
    totalSaleValue,
    totalCollected,
    vehicleRevenueCollected,
    outstandingReceivables,
    highestVehicle,
    top5Vehicles,
    saaedSharePercent,
    thirdPartySharePercent,
    saaedShareAmount,
    thirdPartyShareAmount,
    totalPlatformFees,
    totalAdminFees,
    totalForkliftFees,
    totalRecoveryFees,
    totalServiceFees,
    saleSuccessRate,
    avgSalePrice,
    avgEstimatedValue,
    varianceAmount,
    variancePercent,
    allVarianceAmount,
    collectionRate,
    executivePoints,
    executiveRecommendations,
  };
}

export function computeMonthlyTrend(
  vehicles: Vehicle[],
  collections: CollectionRecord[],
  year: number,
  location: string,
  auctionId: string
): MonthlyTrendPoint[] {
  return ARABIC_MONTHS.map((monthName, idx) => {
    const month = idx + 1;
    const mv = vehicles.filter(
      (v) =>
        v.year === year &&
        v.month === month &&
        (location === 'all' || v.location === location) &&
        (auctionId === 'all' || v.auctionId === auctionId)
    );
    const mc = collections.filter(
      (c) =>
        c.year === year &&
        c.month === month &&
        !c.vehicleId &&
        c.collectionType !== 'service_fee' &&
        (location === 'all' || !c.location || c.location === location) &&
        (auctionId === 'all' || c.auctionId === auctionId)
    );
    const sold = mv.filter((v) => v.status === 'sold');
    const estimatedValue = mv.reduce((s, v) => s + (v.estimatedValue || 0), 0);
    const saleValue = sold.reduce((s, v) => s + (v.salePrice || 0), 0);
    const collectedAmount =
      mv.reduce((s, v) => s + (v.collectedAmount || 0), 0) +
      mc.reduce((s, c) => s + (c.amount || 0), 0);

    return {
      month,
      monthName,
      estimatedValue,
      saleValue,
      collectedAmount,
      vehicleCount: mv.length,
      soldCount: sold.length,
    };
  });
}
