import type { Auction, Vehicle } from '../types';

export type VehicleAuctionLinkStatus = 'linked' | 'unlinked' | 'unavailable';

export interface ResolvedVehicleAuction {
  status: VehicleAuctionLinkStatus;
  label: string;
  auctionCode?: string;
}

export function buildAuctionLookupMap(auctions: readonly Auction[]): Map<string, Auction> {
  const map = new Map<string, Auction>();
  for (const auction of auctions) {
    if (auction.id) {
      map.set(auction.id, auction);
    }
  }
  return map;
}

export function resolveVehicleAuction(
  vehicle: Pick<Vehicle, 'auctionId'>,
  auctionsById: ReadonlyMap<string, Auction>
): ResolvedVehicleAuction {
  const rawId = typeof vehicle.auctionId === 'string' ? vehicle.auctionId.trim() : '';
  if (!rawId || rawId === 'general_auction') {
    return {
      status: 'unlinked',
      label: 'غير مرتبط بمزاد',
    };
  }

  const matchedAuction = auctionsById.get(rawId);
  if (matchedAuction) {
    const cleanTitle = (matchedAuction.title || '').trim();
    return {
      status: 'linked',
      label: cleanTitle || matchedAuction.auctionCode || 'مزاد مسجل',
      auctionCode: matchedAuction.auctionCode,
    };
  }

  return {
    status: 'unavailable',
    label: 'مزاد غير متاح',
  };
}

/**
 * Returns all vehicles linked strictly by reference ID (`auctionId`) to the specified auction,
 * preserving canonical order and preventing any duplicate records or cross-auction leakage.
 */
export function getAuctionLinkedVehicles(
  vehicles: readonly Vehicle[],
  auctionId: string | null | undefined
): Vehicle[] {
  const targetId = typeof auctionId === 'string' ? auctionId.trim() : '';
  if (!targetId) return [];

  const seenIds = new Set<string>();
  const linked: Vehicle[] = [];

  for (const vehicle of vehicles) {
    if (vehicle.auctionId !== targetId) continue;
    if (vehicle.id && seenIds.has(vehicle.id)) continue;
    if (vehicle.id) seenIds.add(vehicle.id);
    linked.push(vehicle);
  }

  return linked;
}

/**
 * Local read-only search filter inside the Auction Details Modal vehicle table
 * (by lotNumber, make, model, or modelYear) without mutating global filters or metrics.
 */
export function filterAuctionModalVehicles(
  auctionVehicles: readonly Vehicle[],
  queryText: string
): Vehicle[] {
  const q = queryText.trim().toLowerCase();
  if (!q) return [...auctionVehicles];

  return auctionVehicles.filter((v) => {
    const lot = (v.lotNumber || '').toLowerCase();
    const make = (v.make || '').toLowerCase();
    const model = (v.model || '').toLowerCase();
    const fullTitle = `${make} ${model} (${v.modelYear})`.toLowerCase();
    const yearStr = String(v.modelYear || '');
    return (
      lot.includes(q) ||
      make.includes(q) ||
      model.includes(q) ||
      fullTitle.includes(q) ||
      yearStr.includes(q)
    );
  });
}

