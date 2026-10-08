import { apiFetch } from "./apiFetch";

const ORDER_SERVICE = "http://localhost:8083";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Dealer {
  dealerId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  dealerType?: string;
  gstNumber?: string;
  notes?: string;
  createdByManagerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealerOrderItem {
  itemId: string;
  category: string;
  color: string;
  buttiName?: string;
  padarName?: string;
  zariName?: string;
  gondas: boolean;
  quantity: number;
  pricePerPiece: number;
  totalPrice: number;
}

export interface DealerPayment {
  paymentId: string;
  amount: number;
  paymentMode?: string;
  referenceNumber?: string;
  note?: string;
  recordedByManagerId: string;
  paidAt: string;
}

export interface DealerOrder {
  dealerOrderId: string;
  orderNumber: string;
  dealer: Dealer;
  createdByManagerId: string;
  status: "DRAFT" | "CONFIRMED" | "IN_PRODUCTION" | "READY" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  items: DealerOrderItem[];
  payments: DealerPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface DealerOrderListResponse {
  orders: DealerOrder[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

// ── Dealer CRUD ───────────────────────────────────────────────────────────────

export function fetchDealers(search?: string): Promise<Dealer[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`${ORDER_SERVICE}/dealers/all${q}`);
}

export function fetchDealerById(dealerId: string): Promise<Dealer> {
  return apiFetch(`${ORDER_SERVICE}/dealers/${dealerId}`);
}

export function createDealer(data: Partial<Dealer>): Promise<Dealer> {
  return apiFetch(`${ORDER_SERVICE}/dealers/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateDealer(dealerId: string, data: Partial<Dealer>): Promise<Dealer> {
  return apiFetch(`${ORDER_SERVICE}/dealers/update/${dealerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteDealer(dealerId: string): Promise<void> {
  return apiFetch(`${ORDER_SERVICE}/dealers/delete/${dealerId}`, { method: "DELETE" });
}

// ── Dealer Order CRUD ─────────────────────────────────────────────────────────

export function fetchDealerOrders(params: {
  page?: number;
  size?: number;
  status?: string;
  managerId?: string;
} = {}): Promise<DealerOrderListResponse> {
  const q = new URLSearchParams();
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.size !== undefined) q.set("size", String(params.size));
  if (params.status) q.set("status", params.status);
  if (params.managerId) q.set("managerId", params.managerId);
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/all?${q}`);
}

export function fetchDealerOrderById(orderId: string): Promise<DealerOrder> {
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/${orderId}`);
}

export function fetchDealerOrdersByDealer(dealerId: string): Promise<DealerOrderListResponse> {
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/by-dealer/${dealerId}`);
}

export function createDealerOrder(data: {
  dealerId: string;
  notes?: string;
  items: {
    category: string;
    color: string;
    buttiName?: string;
    padarName?: string;
    zariName?: string;
    gondas?: boolean;
    quantity: number;
    pricePerPiece: number;
  }[];
}): Promise<DealerOrder> {
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateDealerOrder(orderId: string, data: object): Promise<DealerOrder> {
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/update/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateDealerOrderStatus(orderId: string, status: string): Promise<DealerOrder> {
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/status/${orderId}?status=${status}`, {
    method: "PUT",
  });
}

export function deleteDealerOrder(orderId: string): Promise<void> {
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/delete/${orderId}`, { method: "DELETE" });
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function addDealerPayment(
  orderId: string,
  data: { amount: number; paymentMode?: string; referenceNumber?: string; note?: string }
): Promise<DealerOrder> {
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/${orderId}/payments/add`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteDealerPayment(orderId: string, paymentId: string): Promise<void> {
  return apiFetch(`${ORDER_SERVICE}/dealer-orders/${orderId}/payments/${paymentId}`, {
    method: "DELETE",
  });
}
