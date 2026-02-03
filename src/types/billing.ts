// Billing Types for XpressOps2026 B2B Corporate Accounts
import { BaseEntity, PaginatedResponse } from './common';

// ============================================================================
// INVOICE TYPES
// ============================================================================

export type InvoiceStatus =
  | 'draft'      // Being created
  | 'sent'       // Sent to customer
  | 'paid'       // Payment received
  | 'overdue'    // Past due date
  | 'void';      // Cancelled/void

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  tripId?: string;           // Link to trip if this line item is for a specific trip
  category?: string;         // e.g., 'ride', 'surcharge', 'discount', 'fee'
  metadata?: Record<string, unknown>;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  corporateAccountId: string;
  corporateAccountName?: string; // Denormalized for display

  // Dates
  issueDate: string;
  dueDate: string;
  paidDate?: string;

  // Billing period
  billingPeriodStart: string;
  billingPeriodEnd: string;

  // Amounts (in PHP/Pesos)
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;

  // Line items
  lineItems: InvoiceLineItem[];

  // Status and metadata
  status: InvoiceStatus;
  notes?: string;
  paymentTermsId?: string;
  termsAndConditions?: string;

  // Activity tracking
  sentDate?: string;
  sentTo?: string[];
  lastReminderDate?: string;
  reminderCount: number;

  // File attachments
  pdfUrl?: string;
  attachments?: string[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string; // Search invoice number
}

export interface InvoiceStats {
  totalBilled: number;
  outstanding: number;
  overdue: number;
  collected: number;
  invoiceCount: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    void: number;
  };
}

// ============================================================================
// CORPORATE ACCOUNT TYPES
// ============================================================================

export type CorporateAccountStatus =
  | 'active'      // Active account
  | 'suspended'   // Temporarily suspended
  | 'terminated'; // Permanently closed

export interface AuthorizedBooker {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  addedDate: string;
}

export interface BillingAddress {
  street: string;
  barangay?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string; // Default: 'Philippines'
}

export interface CorporateAccount extends BaseEntity {
  // Company information
  companyName: string;
  registrationNumber?: string; // DTI/SEC registration
  taxId?: string;               // TIN (Tax Identification Number)

  // Contact information
  billingAddress: BillingAddress;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;

  // Financial information
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;

  // Status
  status: CorporateAccountStatus;

  // Relationships
  paymentTermsId?: string;
  subscriptionId?: string;
  authorizedBookers: AuthorizedBooker[];

  // Accounting
  accountNumber?: string;
  currency: string; // Default: 'PHP'

  // Settings
  autoInvoicing: boolean;
  invoiceFrequency?: 'weekly' | 'monthly' | 'quarterly';
  billingDay?: number; // Day of month for billing

  // Metadata
  notes?: string;
  tags?: string[];
}

export interface CorporateAccountFilters {
  status?: CorporateAccountStatus[];
  search?: string;
  minCreditLimit?: number;
  maxCreditLimit?: number;
  hasOutstanding?: boolean;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export type SubscriptionPlanType =
  | 'monthly'
  | 'quarterly'
  | 'annual';

export type SubscriptionStatus =
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'expired';

export interface Subscription extends BaseEntity {
  corporateAccountId: string;

  // Plan details
  planType: SubscriptionPlanType;
  planName: string;

  // Dates
  startDate: string;
  endDate: string;
  renewalDate: string;
  cancelledDate?: string;

  // Pricing
  pricePerRide: number;
  monthlyMinimum?: number;      // Minimum monthly charge
  includedRides?: number;       // Rides included in base fee
  baseFee?: number;             // Monthly/quarterly/annual base fee

  // Discounts
  discountPercentage?: number;
  volumeDiscountTiers?: {
    ridesFrom: number;
    ridesTo: number;
    discountPercentage: number;
  }[];

  // Status
  status: SubscriptionStatus;
  autoRenew: boolean;

  // Billing
  billingCycle: SubscriptionPlanType;
  nextBillingDate: string;

  // Usage tracking
  currentPeriodRides: number;
  currentPeriodAmount: number;

  // Metadata
  notes?: string;
}

// ============================================================================
// PAYMENT TERMS TYPES
// ============================================================================

export interface PaymentTerms extends BaseEntity {
  name: string;
  description?: string;

  // Terms
  dueDays: number;              // Days until invoice is due (e.g., Net 30)
  gracePeriodDays: number;      // Grace period before late fees

  // Late payment fees
  lateFeeType: 'percentage' | 'fixed';
  lateFeeAmount: number;        // Percentage or fixed amount
  lateFeeCapPercentage?: number; // Maximum late fee as % of invoice

  // Discounts for early payment
  earlyPaymentDiscountDays?: number;
  earlyPaymentDiscountPercentage?: number;

  // Settings
  isDefault: boolean;
  isActive: boolean;

  // Metadata
  termsAndConditions?: string;
}

// ============================================================================
// RECONCILIATION TYPES
// ============================================================================

export type ReconciliationStatus =
  | 'pending'
  | 'reconciled'
  | 'discrepancy'
  | 'disputed';

export interface UnreconciledTransaction {
  id: string;
  date: string;
  transactionId: string;
  invoiceId?: string;
  accountId: string;
  accountName: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  status: ReconciliationStatus;
  paymentMethod: string;
  notes?: string;
  reconciledBy?: string;
  reconciledAt?: string;
}

export interface ReconciliationStats {
  unreconciledCount: number;
  unreconciledAmount: number;
  discrepancyCount: number;
  discrepancyAmount: number;
  reconciledToday: number;
  pendingReview: number;
}

// ============================================================================
// ACTIVITY AND HISTORY TYPES
// ============================================================================

export type InvoiceActivityType =
  | 'created'
  | 'sent'
  | 'viewed'
  | 'payment_received'
  | 'reminder_sent'
  | 'voided'
  | 'note_added'
  | 'status_changed';

export interface InvoiceActivity {
  id: string;
  invoiceId: string;
  type: InvoiceActivityType;
  description: string;
  performedBy: string;
  performedByName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentHistory {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
}

export interface CreditNote extends BaseEntity {
  creditNoteNumber: string;
  invoiceId: string;
  accountId: string;
  amount: number;
  reason: string;
  status: 'draft' | 'issued' | 'applied' | 'void';
  issueDate: string;
  appliedDate?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateInvoiceRequest {
  corporateAccountId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  lineItems: Omit<InvoiceLineItem, 'id'>[];
  notes?: string;
  templateId?: string;
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
  lineItems?: InvoiceLineItem[];
}

export interface CreateAccountRequest {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: BillingAddress;
  creditLimit: number;
  paymentTermsId?: string;
  subscriptionId?: string;
}

export interface CreateSubscriptionRequest {
  corporateAccountId: string;
  planType: SubscriptionPlanType;
  planName: string;
  startDate: string;
  pricePerRide: number;
  monthlyMinimum?: number;
  baseFee?: number;
  autoRenew: boolean;
}

export interface BulkInvoiceAction {
  invoiceIds: string[];
  action: 'send' | 'mark_paid' | 'void' | 'send_reminder';
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PAGINATED RESPONSE TYPES
// ============================================================================

export type PaginatedInvoices = PaginatedResponse<Invoice>;
export type PaginatedAccounts = PaginatedResponse<CorporateAccount>;
export type PaginatedSubscriptions = PaginatedResponse<Subscription>;
export type PaginatedPaymentTerms = PaginatedResponse<PaymentTerms>;

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface BillingKPI {
  label: string;
  value: number;
  formattedValue: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  comparisonPeriod?: string;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  accountName: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  daysUntilDue?: number;
  daysOverdue?: number;
}

export interface UpcomingInvoiceDue {
  id: string;
  invoiceNumber: string;
  accountName: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

export interface RevenueChartData {
  period: string; // e.g., '2026-01', 'Q1 2026'
  billed: number;
  collected: number;
  outstanding: number;
}
