// Earnings Module Type Definitions

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'gcash' | 'bank_transfer' | 'cash';
export type SettlementStatus = 'pending' | 'completed';
export type DeductionType = 'commission' | 'bond' | 'promo' | 'adjustment';
export type TransactionType =
  | 'trip_revenue'
  | 'tip'
  | 'bonus'
  | 'surge'
  | 'referral'
  | 'commission'
  | 'bond_deduction'
  | 'promo_redemption'
  | 'adjustment';

export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pendingPayout: number;
  nextPayoutDate: string;
}

export interface EarningsBreakdown {
  tripRevenue: {
    baseFare: number;
    distance: number;
    time: number;
    total: number;
  };
  tips: number;
  bonuses: number;
  surgeEarnings: number;
  referralBonuses: number;
  grossEarnings: number;
  deductions: {
    platformFee: number;
    bondDeductions: number;
    promoRedemptions: number;
    otherAdjustments: number;
    total: number;
  };
  netEarnings: number;
  period: {
    start: string;
    end: string;
  };
}

export interface EarningsTrendData {
  date: string;
  amount: number;
  trips: number;
}

export interface DriverPayout {
  id: string;
  driverId: string;
  driverName?: string;
  amount: number;
  status: PayoutStatus;
  payoutMethod: PayoutMethod;
  payoutDate: string;
  payoutReference?: string;
  processedDate?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  driverId: string;
  driverName?: string;
  settlementDate: string;
  status: SettlementStatus;
  totalRevenue: number;
  totalDeductions: number;
  netAmount: number;
  tripCount: number;
  trips?: SettlementTrip[];
  createdAt: string;
  updatedAt: string;
}

export interface SettlementTrip {
  id: string;
  tripNumber: string;
  revenue: number;
  commission: number;
  netAmount: number;
  completedAt: string;
}

export interface Deduction {
  id: string;
  driverId: string;
  type: DeductionType;
  amount: number;
  reason: string;
  relatedTripId?: string;
  relatedIncidentId?: string;
  deductionDate: string;
  createdAt: string;
  canDispute: boolean;
}

export interface Transaction {
  id: string;
  driverId: string;
  type: TransactionType;
  amount: number;
  date: string;
  reference?: string;
  description?: string;
  relatedTripId?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  disputedEntityType: 'payout' | 'settlement' | 'deduction';
  disputedEntityId: string;
  disputedAmount: number;
  reason: string;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  raisedBy: string;
  raisedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface DriverEarningsProfile {
  driverId: string;
  driverName: string;
  lifetimeEarnings: number;
  averageDailyEarnings: number;
  averageWeeklyEarnings: number;
  totalPayouts: number;
  totalDeductions: number;
  currentBalance: number;
  lastPayoutDate?: string;
  nextPayoutDate?: string;
  earningsTrend: EarningsTrendData[];
  performanceMetrics: {
    totalTrips: number;
    completionRate: number;
    averageRating: number;
    acceptanceRate: number;
  };
}

export interface TopDriver {
  driverId: string;
  driverName: string;
  earnings: number;
  trips: number;
  rank: number;
}

// Date range filter
export interface DateRange {
  start: string;
  end: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
