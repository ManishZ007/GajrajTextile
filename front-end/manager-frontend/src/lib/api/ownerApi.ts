import { apiFetch } from "./apiFetch";

const AUTH_SERVICE = "http://localhost:8081";
const ORDER_SERVICE = "http://localhost:8083";
const MANAGER_SERVICE = "http://localhost:8085";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ManagerUser {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  // fields from manager service DB
  managerId?: string;
  gender?: string;
  dateOfBirth?: string;
  roleType?: string;
  managerStatus?: string;
}

export interface ManagerStats {
  managerId: string;
  totalDealerOrders: number;
  totalCustomerOrders: number;
  totalDealers: number;
  totalOrderValue: number;
  totalCollected: number | null;
  totalBalance: number | null;
  activeOrders: number;
  deliveredOrders: number;
  financialAvailable: boolean;
  orders: ManagerOrderRow[];
  recentDealerOrders: {
    orderNumber: string;
    dealerName: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }[];
}

export interface CreateManagerPayload {
  fullName: string;
  email: string;
  passwordHash: string;
  phoneNumber?: string;
  role: "MANAGER";
}

// ── Manager CRUD ──────────────────────────────────────────────────────────────

export function fetchManagers(): Promise<ManagerUser[]> {
  return apiFetch(`${AUTH_SERVICE}/auth/managers`);
}

export function fetchManagerById(userId: string): Promise<ManagerUser> {
  return apiFetch(`${MANAGER_SERVICE}/internal/managers/${userId}`);
}

export function updateManagerProfile(
  userId: string,
  data: { gender?: string; dateOfBirth?: string; roleType?: string; managerStatus?: string },
): Promise<ManagerUser> {
  return apiFetch(`${MANAGER_SERVICE}/internal/managers/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function createManager(
  data: CreateManagerPayload,
): Promise<ManagerUser> {
  return apiFetch(`${AUTH_SERVICE}/auth/managers/register`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateManager(
  userId: string,
  data: { fullName?: string; email?: string; phoneNumber?: string },
): Promise<ManagerUser> {
  return apiFetch(`${AUTH_SERVICE}/auth/managers/${userId}`, {
    method: "PUT",
    body: JSON.stringify({
      userType: "MANAGER",
      userInfo: {
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber,
      },
    }),
  });
}

export function deleteManager(userId: string): Promise<void> {
  return apiFetch(`${AUTH_SERVICE}/auth/managers/${userId}`, {
    method: "DELETE",
  });
}

// ── Manager Stats ─────────────────────────────────────────────────────────────

export function changeManagerPassword(
  userId: string,
  password: string,
): Promise<void> {
  return apiFetch(`${AUTH_SERVICE}/auth/managers/${userId}/password`, {
    method: "PUT",
    body: JSON.stringify({ password }),
  });
}

export function fetchManagerStats(managerId: string): Promise<ManagerStats> {
  return apiFetch(`${ORDER_SERVICE}/internal/manager-stats/${managerId}`);
}

export function fetchManagerDealers(
  managerId: string,
): Promise<import("./dealerApi").Dealer[]> {
  return apiFetch(
    `${ORDER_SERVICE}/internal/manager-stats/${managerId}/dealers`,
  );
}

export interface ManagerOrderRow {
  id: string; type: "dealer" | "customer"; number: string; party: string; status: string;
  amount: number; collected: number | null; date: string; includedInFinancials: boolean;
}
export interface ManagerWorkerActivity {
  created: number; assignments: number;
  items: { workerId: string; userId?: string; code?: number; status: string; createdByManager: boolean;
    assignments: { id: string; orderId: string; status: string; task?: string; date?: string; source: string }[] }[];
}
export function fetchManagerWorkers(id: string): Promise<ManagerWorkerActivity> {
  return apiFetch(`${MANAGER_SERVICE}/owner/managers/${id}/workers`);
}
