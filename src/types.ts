export type TabId =
  | 'dashboard'
  | 'financial-report'
  | 'auctions'
  | 'vehicles'
  | 'collections'
  | 'revenue-share'
  | 'services-fees'
  | 'analysis'
  | 'comparisons'
  | 'archive'
  | 'settings';

export type WorkspaceMode = 'production' | 'demo';

export type UserRole = 'admin' | 'finance' | 'auditor' | 'viewer';

export type AuctionStatus = 'draft' | 'active' | 'closed' | 'approved';
export type VehicleStatus = 'sold' | 'unsold' | 'pending';
export type PaymentMethod = 'bank_transfer' | 'cheque' | 'card' | 'cash';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type ServiceType = 'platform' | 'admin' | 'forklift' | 'recovery';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Auction {
  id: string;
  title: string;
  auctionCode: string;
  location: string;
  year: number;
  month: number;
  auctionDate?: string;
  status: AuctionStatus;
  saaedSharePercent: number;
  thirdPartySharePercent: number;
  notes?: string;
  isDemo?: boolean;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Vehicle {
  id: string;
  auctionId: string;
  lotNumber: string;
  make: string;
  model: string;
  modelYear: number;
  vin?: string;
  location: string;
  year: number;
  month: number;
  estimatedValue: number;
  salePrice: number;
  collectedAmount: number;
  status: VehicleStatus;
  saleDate?: string;
  paymentStatus?: PaymentStatus;
  platformFee: number;
  adminFee: number;
  forkliftFee: number;
  recoveryFee: number;
  buyerName?: string;
  isDemo?: boolean;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CollectionRecord {
  id: string;
  auctionId: string;
  vehicleId?: string;
  lotNumber?: string;
  receiptNo: string;
  bidderName: string;
  amountDue?: number;
  amount: number;
  remainingAmount?: number;
  paymentStatus?: PaymentStatus;
  method: PaymentMethod;
  collectionDate: string;
  financialRef?: string;
  collectionType?: 'vehicle_sale' | 'service_fee';
  year: number;
  month: number;
  location?: string;
  notes?: string;
  isDemo?: boolean;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ServiceFeeRecord {
  id: string;
  serviceCode: string;
  serviceType: ServiceType;
  auctionId: string;
  vehicleId?: string;
  lotNumber?: string;
  serviceDate: string;
  amountDue: number;
  collectedAmount: number;
  collectionStatus: 'collected' | 'partial' | 'pending';
  referenceNo: string;
  beneficiary: string;
  year: number;
  month: number;
  location: string;
  notes?: string;
  isDemo?: boolean;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ApprovedReport {
  id: string;
  title: string;
  periodType: 'monthly' | 'annual' | 'auction';
  year: number;
  month: number;
  auctionId?: string;
  location?: string;
  totalVehicles: number;
  soldVehicles: number;
  totalEstimated: number;
  soldEstimated?: number;
  totalSale: number;
  totalCollected: number;
  outstandingReceivables?: number;
  saaedShareAmount: number;
  thirdPartyShareAmount: number;
  totalPlatformFees?: number;
  totalAdminFees?: number;
  totalForkliftFees?: number;
  totalRecoveryFees?: number;
  totalServices: number;
  highestVehicleLabel?: string;
  highestVehiclePrice?: number;
  approvedByName: string;
  approvedAt?: string;
  version?: number;
  status: 'draft' | 'under_review' | 'approved' | 'archived';
  notes?: string;
  isDemo?: boolean;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  actorName: string;
  year: number;
  month: number;
  isDemo?: boolean;
  ownerId: string;
  createdAt?: unknown;
}

export interface SystemSettings {
  id: string;
  defaultSaaedSharePercent: number;
  defaultThirdPartySharePercent: number;
  defaultPlatformFee: number;
  defaultAdminFee: number;
  defaultForkliftFee: number;
  defaultRecoveryFee: number;
  excludeServicesFromShare?: boolean;
  ownerId: string;
  updatedAt?: unknown;
}

export interface FilterState {
  month: number | 'all';
  year: number;
  location: string;
  auctionId: string;
  status: 'all' | VehicleStatus;
}

export interface MonthlyTrendPoint {
  month: number;
  monthName: string;
  estimatedValue: number;
  saleValue: number;
  collectedAmount: number;
  vehicleCount: number;
  soldCount: number;
}

export interface ComputedFinancialMetrics {
  displayedCount: number;
  soldCount: number;
  unsoldCount: number;
  pendingCount: number;
  totalEstimatedValue: number;
  soldEstimatedValue: number;
  totalSaleValue: number;
  totalCollected: number;
  vehicleRevenueCollected: number;
  outstandingReceivables: number;
  highestVehicle: Vehicle | null;
  top5Vehicles: Vehicle[];
  saaedSharePercent: number;
  thirdPartySharePercent: number;
  saaedShareAmount: number;
  thirdPartyShareAmount: number;
  totalPlatformFees: number;
  totalAdminFees: number;
  totalForkliftFees: number;
  totalRecoveryFees: number;
  totalServiceFees: number;
  saleSuccessRate: number | null;
  avgSalePrice: number | null;
  avgEstimatedValue: number | null;
  varianceAmount: number;
  variancePercent: number | null;
  allVarianceAmount: number;
  collectionRate: number | null;
  executivePoints: string[];
  executiveRecommendations: string[];
}

export interface ValidationTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  diff: string;
  details: string;
}

export interface DemoSeedSummary {
  auctionsCount: number;
  novemberVehiclesCount: number;
  novemberSoldCount: number;
  novemberUnsoldCount: number;
  totalVehiclesCount: number;
  collectionsCount: number;
  servicesCount: number;
  reportsCount: number;
  seededAt?: string;
}
