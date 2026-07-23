import { apiFetch } from "./apiFetch";

const BASE = "http://localhost:8085";

export interface OrderFlow {
  id: string;
  orderId: string;
  productStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  qualityCheck: "PENDING" | "APPROVED" | "REJECTED";
  shippingStatus: "NOT_READY" | "READY_FOR_SHIPPING" | "SHIPPED";
  addressId: string;
  handledBy?: string;
  note?: string;
  updatedAt: string;
  currentStage: string;
}

export interface OrderFlowListResponse {
  content: OrderFlow[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  totalOrders: number;
  notStartedCount: number;
  inProgressCount: number;
  completedCount: number;
  qcPendingCount: number;
  qcApprovedCount: number;
  qcRejectedCount: number;
  readyForShippingCount: number;
  shippedCount: number;
}

export function fetchOrderFlows(params: {
  page?: number;
  size?: number;
  productStatus?: string;
  qualityCheck?: string;
  shippingStatus?: string;
} = {}) {
  const q = new URLSearchParams();
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.size !== undefined) q.set("size", String(params.size));
  if (params.productStatus) q.set("productStatus", params.productStatus);
  if (params.qualityCheck) q.set("qualityCheck", params.qualityCheck);
  if (params.shippingStatus) q.set("shippingStatus", params.shippingStatus);
  return apiFetch(`${BASE}/manager/order-flow/all?${q}`);
}

export function fetchOrderFlow(orderId: string) {
  return apiFetch(`${BASE}/manager/order-flow/${orderId}`);
}

export function startProduction(orderId: string, handledBy: string) {
  return apiFetch(`${BASE}/manager/order-flow/start/${orderId}`, {
    method: "PUT",
    body: JSON.stringify({ handledBy }),
  });
}

export function completeProduction(orderId: string) {
  return apiFetch(`${BASE}/manager/order-flow/complete/${orderId}`, {
    method: "PUT",
  });
}

export function submitQualityCheck(orderId: string, result: "APPROVED" | "REJECTED", note?: string) {
  return apiFetch(`${BASE}/manager/order-flow/quality-check/${orderId}`, {
    method: "PUT",
    body: JSON.stringify({ result, note: note || undefined }),
  });
}

export function markReadyForShipping(orderId: string) {
  return apiFetch(`${BASE}/manager/order-flow/ready-shipping/${orderId}`, {
    method: "PUT",
  });
}

export function markShipped(orderId: string) {
  return apiFetch(`${BASE}/manager/order-flow/ship/${orderId}`, {
    method: "PUT",
  });
}
