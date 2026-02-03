// Payment Types for XpressOps2026

export type PaymentMethodType = 'gcash' | 'paymaya' | 'card' | 'cash';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed' | 'failed';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  accountNumber?: string;
  phoneNumber?: string;
  cardLast4?: string;
  cardBrand?: string;
  expiryDate?: string;
  isDefault: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  transactionId: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;
  paymentMethodId: string;
  description: string;
  userId: string;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export interface Refund {
  id: string;
  refundId: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  requestedBy: string;
  approvedBy?: string;
  processedBy?: string;
  createdAt: string;
  approvedAt?: string;
  processedAt?: string;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
}

export interface ReconciliationItem {
  id: string;
  date: string;
  transactionId: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  status: 'pending' | 'reconciled' | 'discrepancy';
  paymentMethod: PaymentMethodType;
  notes?: string;
  reconciledBy?: string;
  reconciledAt?: string;
}

export interface PaymentStats {
  totalProcessed: number;
  totalAmount: number;
  successRate: number;
  avgTransactionValue: number;
  failedCount: number;
  refundedCount: number;
  pendingCount: number;
}

export interface PaymentMethodDistribution {
  method: PaymentMethodType;
  count: number;
  amount: number;
  percentage: number;
}

export interface GCashPaymentRequest {
  amount: number;
  description: string;
  referenceNumber: string;
  successUrl: string;
  failureUrl: string;
}

export interface PayMayaPaymentRequest {
  amount: number;
  description: string;
  referenceNumber: string;
  successUrl: string;
  failureUrl: string;
}

export interface PaymentCallback {
  status: 'success' | 'failed';
  transactionId: string;
  referenceNumber: string;
  amount: number;
  timestamp: string;
  signature?: string;
}
