// Client-side API utilities for Xpress Ops Tower
// Type-safe client functions for interacting with restored API endpoints

import { ApiResponse, ApiError } from '@/types/api';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
}

// Default configuration
const defaultConfig: ApiClientConfig = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://xpress-ops-tower.vercel.app/api' 
    : '/api',
  timeout: 10000,
  retries: 2
};

// Generic API client class
export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    let lastError: Error | null = null;
    const maxRetries = this.config.retries || 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error((data as ApiError).error?.message || `HTTP ${response.status}`);
        }

        return data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('HTTP 4')) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    )}` : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create default client instance
export const apiClient = new ApiClient();

// Specific API endpoint functions
export const driversApi = {
  // Get all drivers with filtering and pagination
  getAll: (params?: {
    status?: string;
    region?: string;
    search?: string;
    services?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => apiClient.get('/drivers', params),

  // Get driver by ID
  getById: (id: string) => apiClient.get(`/drivers/${id}`),

  // Create new driver
  create: (driver: {
    driverCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    regionId: string;
    services: string[];
    primaryService: string;
  }) => apiClient.post('/drivers', driver),

  // Update driver (full replacement)
  update: (id: string, driver: any) => apiClient.put(`/drivers/${id}`, driver),

  // Partial update driver
  patch: (id: string, updates: any) => apiClient.patch(`/drivers/${id}`, updates),

  // Delete driver
  delete: (id: string) => apiClient.delete(`/drivers/${id}`),
};

export const bookingsApi = {
  // Get all bookings with filtering and pagination
  getAll: (params?: {
    status?: string;
    serviceType?: string;
    driverId?: string;
    customerId?: string;
    regionId?: string;
    createdFrom?: string;
    createdTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => apiClient.get('/bookings', params),

  // Get booking by ID
  getById: (id: string) => apiClient.get(`/bookings/${id}`),

  // Create new booking
  create: (booking: {
    serviceType: string;
    customerId: string;
    customerInfo: any;
    pickupLocation: { latitude: number; longitude: number; };
    pickupAddress: string;
    regionId: string;
    dropoffLocation?: { latitude: number; longitude: number; };
    dropoffAddress?: string;
    estimatedFare?: number;
    specialInstructions?: string;
  }) => apiClient.post('/bookings', booking),

  // Update booking status and details
  patch: (id: string, updates: {
    status?: string;
    driverId?: string;
    estimatedArrival?: string;
    actualFare?: number;
    notes?: string;
  }) => apiClient.patch(`/bookings/${id}`, updates),

  // Cancel booking
  delete: (id: string) => apiClient.delete(`/bookings/${id}`),
};

export const locationsApi = {
  // Get driver locations with filtering
  getAll: (params?: {
    regionId?: string;
    isAvailable?: boolean;
    status?: string;
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  }) => apiClient.get('/locations', params),

  // Update driver location
  update: (location: {
    driverId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    bearing?: number;
    accuracy?: number;
  }) => apiClient.post('/locations', location),
};

export const analyticsApi = {
  // Get analytics data with time range filtering
  getMetrics: (params?: {
    timeRange?: '1h' | '24h' | '7d' | '30d';
    regionId?: string;
  }) => apiClient.get('/analytics', params),
};

export const alertsApi = {
  // Get all alerts/incidents with filtering and pagination
  getAll: (params?: {
    priority?: string;
    status?: string;
    regionId?: string;
    driverId?: string;
    incidentType?: string;
    createdFrom?: string;
    createdTo?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get('/alerts', params),

  // Get alert by ID
  getById: (id: string) => apiClient.get(`/alerts/${id}`),

  // Create new alert/incident
  create: (alert: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    incidentType: string;
    reporterType: 'driver' | 'passenger' | 'system' | 'operator';
    reporterId: string;
    title: string;
    description: string;
    driverId?: string;
    bookingId?: string;
    location?: { latitude: number; longitude: number; };
    address?: string;
  }) => apiClient.post('/alerts', alert),

  // Update alert status and details
  patch: (id: string, updates: {
    status?: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string;
    resolutionNotes?: string;
    escalatedTo?: string;
  }) => apiClient.patch(`/alerts/${id}`, updates),

  // Close/archive resolved alert
  delete: (id: string) => apiClient.delete(`/alerts/${id}`),
};

export const healthApi = {
  // Get system health status
  check: () => apiClient.get('/health'),
};

// Billing API endpoints for B2B corporate accounts
export const billingApi = {
  // Invoices
  invoices: {
    // Get all invoices with filtering and pagination
    getAll: (params?: {
      status?: string[];
      dateFrom?: string;
      dateTo?: string;
      accountId?: string;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => apiClient.get('/billing/invoices', params),

    // Get invoice by ID
    getById: (id: string) => apiClient.get(`/billing/invoices/${id}`),

    // Create new invoice
    create: (invoice: {
      corporateAccountId: string;
      billingPeriodStart: string;
      billingPeriodEnd: string;
      dueDate: string;
      lineItems: any[];
      notes?: string;
      templateId?: string;
    }) => apiClient.post('/billing/invoices', invoice),

    // Update invoice
    update: (id: string, updates: {
      status?: string;
      dueDate?: string;
      notes?: string;
      lineItems?: any[];
    }) => apiClient.put(`/billing/invoices/${id}`, updates),

    // Delete/void invoice
    delete: (id: string) => apiClient.delete(`/billing/invoices/${id}`),

    // Send invoice to customer
    send: (id: string, recipients?: string[]) =>
      apiClient.post(`/billing/invoices/${id}/send`, { recipients }),

    // Mark invoice as paid
    markPaid: (id: string, paymentDetails?: {
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      referenceNumber?: string;
      notes?: string;
    }) => apiClient.post(`/billing/invoices/${id}/mark-paid`, paymentDetails),

    // Send reminder for invoice
    sendReminder: (id: string) =>
      apiClient.post(`/billing/invoices/${id}/send-reminder`, {}),

    // Get invoice statistics
    getStats: (params?: {
      dateFrom?: string;
      dateTo?: string;
      accountId?: string;
    }) => apiClient.get('/billing/invoices/stats', params),

    // Bulk actions on invoices
    bulk: (action: {
      invoiceIds: string[];
      action: 'send' | 'mark_paid' | 'void' | 'send_reminder';
      metadata?: any;
    }) => apiClient.post('/billing/invoices/bulk', action),
  },

  // Corporate Accounts
  accounts: {
    // Get all accounts with filtering and pagination
    getAll: (params?: {
      status?: string[];
      search?: string;
      minCreditLimit?: number;
      maxCreditLimit?: number;
      hasOutstanding?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => apiClient.get('/billing/accounts', params),

    // Get account by ID
    getById: (id: string) => apiClient.get(`/billing/accounts/${id}`),

    // Create new account
    create: (account: {
      companyName: string;
      contactPerson: string;
      contactEmail: string;
      contactPhone: string;
      billingAddress: any;
      creditLimit: number;
      paymentTermsId?: string;
      subscriptionId?: string;
    }) => apiClient.post('/billing/accounts', account),

    // Update account
    update: (id: string, updates: any) => apiClient.put(`/billing/accounts/${id}`, updates),

    // Delete account
    delete: (id: string) => apiClient.delete(`/billing/accounts/${id}`),

    // Get account billing history
    getBillingHistory: (id: string, params?: {
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }) => apiClient.get(`/billing/accounts/${id}/billing-history`, params),

    // Get account outstanding invoices
    getOutstandingInvoices: (id: string) =>
      apiClient.get(`/billing/accounts/${id}/outstanding-invoices`),
  },

  // Subscriptions
  subscriptions: {
    // Get all subscriptions
    getAll: (params?: {
      accountId?: string;
      status?: string[];
      planType?: string[];
      page?: number;
      limit?: number;
    }) => apiClient.get('/billing/subscriptions', params),

    // Get subscription by ID
    getById: (id: string) => apiClient.get(`/billing/subscriptions/${id}`),

    // Create new subscription
    create: (subscription: {
      corporateAccountId: string;
      planType: string;
      planName: string;
      startDate: string;
      pricePerRide: number;
      monthlyMinimum?: number;
      baseFee?: number;
      autoRenew: boolean;
    }) => apiClient.post('/billing/subscriptions', subscription),

    // Update subscription
    update: (id: string, updates: any) => apiClient.put(`/billing/subscriptions/${id}`, updates),

    // Cancel subscription
    cancel: (id: string, cancelDate?: string) =>
      apiClient.post(`/billing/subscriptions/${id}/cancel`, { cancelDate }),

    // Renew subscription
    renew: (id: string) => apiClient.post(`/billing/subscriptions/${id}/renew`, {}),
  },

  // Payment Terms
  paymentTerms: {
    // Get all payment terms
    getAll: (params?: {
      isActive?: boolean;
      page?: number;
      limit?: number;
    }) => apiClient.get('/billing/payment-terms', params),

    // Get payment terms by ID
    getById: (id: string) => apiClient.get(`/billing/payment-terms/${id}`),

    // Create payment terms
    create: (terms: {
      name: string;
      description?: string;
      dueDays: number;
      gracePeriodDays: number;
      lateFeeType: 'percentage' | 'fixed';
      lateFeeAmount: number;
      isDefault?: boolean;
    }) => apiClient.post('/billing/payment-terms', terms),

    // Update payment terms
    update: (id: string, updates: any) => apiClient.put(`/billing/payment-terms/${id}`, updates),

    // Delete payment terms
    delete: (id: string) => apiClient.delete(`/billing/payment-terms/${id}`),
  },

  // Reconciliation
  reconciliation: {
    // Get unreconciled transactions
    getUnreconciled: (params?: {
      dateFrom?: string;
      dateTo?: string;
      accountId?: string;
      status?: string[];
      page?: number;
      limit?: number;
    }) => apiClient.get('/billing/reconciliation/unreconciled', params),

    // Get reconciliation statistics
    getStats: () => apiClient.get('/billing/reconciliation/stats'),

    // Reconcile transaction
    reconcile: (transactionId: string, data: {
      invoiceId?: string;
      notes?: string;
    }) => apiClient.post(`/billing/reconciliation/${transactionId}/reconcile`, data),

    // Mark discrepancy
    markDiscrepancy: (transactionId: string, data: {
      reason: string;
      notes?: string;
    }) => apiClient.post(`/billing/reconciliation/${transactionId}/discrepancy`, data),

    // Export reconciliation report
    exportReport: (params?: {
      dateFrom?: string;
      dateTo?: string;
      format?: 'csv' | 'xlsx' | 'pdf';
    }) => apiClient.get('/billing/reconciliation/export', params),
  },

  // Dashboard
  dashboard: {
    // Get billing KPIs
    getKPIs: (params?: {
      dateFrom?: string;
      dateTo?: string;
    }) => apiClient.get('/billing/dashboard/kpis', params),

    // Get recent invoices
    getRecentInvoices: (limit?: number) =>
      apiClient.get('/billing/dashboard/recent-invoices', { limit }),

    // Get upcoming due invoices
    getUpcomingDue: (days?: number) =>
      apiClient.get('/billing/dashboard/upcoming-due', { days }),

    // Get overdue accounts
    getOverdueAccounts: () => apiClient.get('/billing/dashboard/overdue-accounts'),

    // Get revenue chart data
    getRevenueChart: (params?: {
      period: 'monthly' | 'quarterly';
      months?: number;
    }) => apiClient.get('/billing/dashboard/revenue-chart', params),
  },
};

// Utility functions for common operations
export const apiUtils = {
  // Format error messages from API responses
  formatError: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  },

  // Check if response indicates success
  isSuccess: <T>(response: ApiResponse<T> | ApiError): response is ApiResponse<T> => {
    return response.success === true;
  },

  // Extract error details from API error response
  getErrorDetails: (error: ApiError): { code: string; message: string; details?: any } => ({
    code: error.error.code,
    message: error.error.message,
    details: error.error.details,
  }),

  // Retry function with exponential backoff
  retry: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  },
};

// Export everything for easy importing
export default {
  apiClient,
  driversApi,
  bookingsApi,
  locationsApi,
  analyticsApi,
  alertsApi,
  healthApi,
  billingApi,
  apiUtils,
};