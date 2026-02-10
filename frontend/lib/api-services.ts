/**
 * MainTMS API Service Layer
 * Centralized API calls for all backend endpoints
 */

import { apiFetch, getToken } from "./api";

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const authApi = {
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    return apiFetch("/auth/token", {
      method: "POST",
      body: formData,
    });
  },

  getCurrentUser: async () => {
    return apiFetch("/auth/me", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  register: async (userData: any) => {
    return apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
  },
};

// ============================================================================
// CUSTOMERS
// ============================================================================

export const customersApi = {
  getAll: async () => {
    return apiFetch("/customers", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getById: async (id: number) => {
    return apiFetch(`/customers/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  create: async (customerData: any) => {
    return apiFetch("/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
    });
  },

  update: async (id: number, customerData: any) => {
    return apiFetch(`/customers/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
    });
  },

  delete: async (id: number) => {
    return apiFetch(`/customers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getLoads: async (id: number) => {
    return apiFetch(`/customers/${id}/loads`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getStats: async (id: number) => {
    return apiFetch(`/customers/${id}/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// LOADS
// ============================================================================

export const loadsApi = {
  getAll: async (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiFetch(`/loads${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getById: async (id: number) => {
    return apiFetch(`/loads/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  create: async (loadData: any) => {
    return apiFetch("/loads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loadData),
    });
  },

  update: async (id: number, loadData: any) => {
    return apiFetch(`/loads/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loadData),
    });
  },

  delete: async (id: number) => {
    return apiFetch(`/loads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// DISPATCH
// ============================================================================

export const dispatchApi = {
  getLoadsByStatus: async () => {
    return apiFetch("/dispatch/loads-by-status", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  assignLoad: async (loadId: number, driverId: number) => {
    return apiFetch("/dispatch/assign-load", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ load_id: loadId, driver_id: driverId }),
    });
  },

  updateLoadStatus: async (loadId: number, status: string) => {
    return apiFetch("/dispatch/update-load-status", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ load_id: loadId, status }),
    });
  },
};

// ============================================================================
// INVOICES
// ============================================================================

export const invoicesApi = {
  getAll: async (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiFetch(`/invoices${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getById: async (id: number) => {
    return apiFetch(`/invoices/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  create: async (invoiceData: any) => {
    return apiFetch("/invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });
  },

  update: async (id: number, invoiceData: any) => {
    return apiFetch(`/invoices/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });
  },

  sendInvoice: async (id: number) => {
    return apiFetch(`/invoices/${id}/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  recordPayment: async (id: number, paymentData: any) => {
    return apiFetch(`/invoices/${id}/record-payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });
  },

  downloadPDF: async (id: number) => {
    return fetch(`${apiFetch}/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.blob());
  },

  getStats: async () => {
    return apiFetch("/invoices/stats/summary", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// ACCOUNTING (NEW!)
// ============================================================================

export const accountingApi = {
  getReceivables: async () => {
    return apiFetch("/accounting/receivables", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getPayables: async () => {
    return apiFetch("/accounting/payables", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getProfitLoss: async (startDate: string, endDate: string) => {
    return apiFetch(
      `/accounting/profit-loss?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
  },

  getRevenueByCustomer: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString() ? `?${params}` : "";
    return apiFetch(`/accounting/revenue-by-customer${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getCashFlow: async (months: number = 6) => {
    return apiFetch(`/accounting/cash-flow?months=${months}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getIFTAReport: async (quarter: number, year: number) => {
    return apiFetch(`/accounting/ifta-report?quarter=${quarter}&year=${year}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// QUICKBOOKS (NEW!)
// ============================================================================

export const quickbooksApi = {
  getStatus: async () => {
    return apiFetch("/quickbooks/status", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  initiateOAuth: async () => {
    return apiFetch("/quickbooks/auth", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  refreshToken: async () => {
    return apiFetch("/quickbooks/refresh-token", {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  disconnect: async () => {
    return apiFetch("/quickbooks/disconnect", {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  syncCustomers: async () => {
    return apiFetch("/quickbooks/sync/customers", {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  syncInvoices: async () => {
    return apiFetch("/quickbooks/sync/invoices", {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  testConnection: async () => {
    return apiFetch("/quickbooks/test-connection", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// COMMUNICATIONS (NEW!)
// ============================================================================

export const communicationsApi = {
  sendEmail: async (emailData: {
    to: string;
    subject: string;
    body: string;
    html?: string;
  }) => {
    return apiFetch("/communications/email/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });
  },

  sendSMS: async (smsData: { to: string; message: string }) => {
    return apiFetch("/communications/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsData),
    });
  },

  notifyLoadAssigned: async (loadId: number) => {
    return apiFetch("/communications/notify/load-assigned", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ load_id: loadId }),
    });
  },

  notifyInvoiceSent: async (invoiceId: number) => {
    return apiFetch("/communications/notify/invoice-sent", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
  },

  notifyPODSubmitted: async (loadId: number) => {
    return apiFetch("/communications/notify/pod-submitted", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ load_id: loadId }),
    });
  },

  getTemplates: async () => {
    return apiFetch("/communications/templates", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  testEmail: async () => {
    return apiFetch("/communications/test/email", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  testSMS: async (phoneNumber: string) => {
    return apiFetch(`/communications/test/sms?phone_number=${phoneNumber}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// LOAD BOARDS (NEW!)
// ============================================================================

export const loadboardsApi = {
  searchDAT: async (criteria: any) => {
    const params = new URLSearchParams(criteria);
    return apiFetch(`/loadboards/dat/search?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  searchTruckStop: async (criteria: any) => {
    const params = new URLSearchParams(criteria);
    return apiFetch(`/loadboards/truckstop/search?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  searchAll: async (criteria: any) => {
    const params = new URLSearchParams(criteria);
    return apiFetch(`/loadboards/search-all?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getDATRates: async (originState: string, destState: string, equipmentType: string) => {
    return apiFetch(
      `/loadboards/dat/rates?origin_state=${originState}&destination_state=${destState}&equipment_type=${equipmentType}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
  },

  postTruck: async (truckData: any) => {
    return apiFetch("/loadboards/truckstop/post-truck", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(truckData),
    });
  },

  importLoad: async (loadBoardId: string, source: string, loadData: any) => {
    return apiFetch(`/loadboards/import-to-tms/${loadBoardId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source, ...loadData }),
    });
  },

  getStatus: async () => {
    return apiFetch("/loadboards/status", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// MOTIVE ELD (NEW!)
// ============================================================================

export const motiveApi = {
  getDriverLocation: async (driverId: number) => {
    return apiFetch(`/motive/location/${driverId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getAllDriverLocations: async () => {
    return apiFetch("/motive/locations/all", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getLocationHistory: async (driverId: number, startDate: string, endDate: string) => {
    return apiFetch(
      `/motive/location/history/${driverId}?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
  },

  getHOSStatus: async (driverId: number) => {
    return apiFetch(`/motive/hos/${driverId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getHOSViolations: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString() ? `?${params}` : "";
    return apiFetch(`/motive/hos/violations${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getVehicleData: async (vehicleId: string) => {
    return apiFetch(`/motive/vehicle/${vehicleId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getAllVehicles: async () => {
    return apiFetch("/motive/vehicles/all", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getDriverTrips: async (driverId: number, startDate: string, endDate: string) => {
    return apiFetch(
      `/motive/trips/${driverId}?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
  },

  getIFTAMileage: async (startDate: string, endDate: string) => {
    return apiFetch(`/motive/ifta/mileage?start_date=${startDate}&end_date=${endDate}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getStatus: async () => {
    return apiFetch("/motive/status", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// DOCUMENTS
// ============================================================================

export const documentsApi = {
  generateRateCon: async (loadId: number) => {
    return fetch(`${apiFetch}/documents/rate-confirmation/${loadId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.blob());
  },

  generateBOL: async (loadId: number) => {
    return fetch(`${apiFetch}/documents/bill-of-lading/${loadId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.blob());
  },

  generateInvoice: async (invoiceId: number) => {
    return fetch(`${apiFetch}/documents/invoice/${invoiceId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.blob());
  },
};

// ============================================================================
// DRIVERS
// ============================================================================

export const driversApi = {
  getAll: async () => {
    return apiFetch("/drivers", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getById: async (id: number) => {
    return apiFetch(`/drivers/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  create: async (driverData: any) => {
    return apiFetch("/drivers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(driverData),
    });
  },

  update: async (id: number, driverData: any) => {
    return apiFetch(`/drivers/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(driverData),
    });
  },

  delete: async (id: number) => {
    return apiFetch(`/drivers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// EQUIPMENT
// ============================================================================

export const equipmentApi = {
  getAllTrucks: async () => {
    return apiFetch("/equipment/trucks", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getAllTrailers: async () => {
    return apiFetch("/equipment/trailers", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getTruckById: async (id: number) => {
    return apiFetch(`/equipment/trucks/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getTrailerById: async (id: number) => {
    return apiFetch(`/equipment/trailers/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// ANALYTICS
// ============================================================================

export const analyticsApi = {
  getDashboardStats: async () => {
    return apiFetch("/analytics/dashboard", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  getRevenueChart: async (days: number = 30) => {
    return apiFetch(`/analytics/revenue?days=${days}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },
};

// ============================================================================
// PAYROLL
// ============================================================================

export const payrollApi = {
  getSettlements: async () => {
    return apiFetch("/payroll/settlements", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  createSettlement: async (settlementData: any) => {
    return apiFetch("/payroll/settlements", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settlementData),
    });
  },
};

// ============================================================================
// EXPENSES
// ============================================================================

export const expensesApi = {
  getAll: async () => {
    return apiFetch("/expenses", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  create: async (expenseData: any) => {
    return apiFetch("/expenses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expenseData),
    });
  },
};

// ============================================================================
// MAINTENANCE
// ============================================================================

export const maintenanceApi = {
  getAll: async () => {
    return apiFetch("/maintenance", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  create: async (maintenanceData: any) => {
    return apiFetch("/maintenance", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(maintenanceData),
    });
  },
};
