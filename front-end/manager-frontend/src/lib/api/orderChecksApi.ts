import { apiFetch } from "./apiFetch";
const base = "http://localhost:8083/manager/orders/checks";
export type CheckOrder = { orderId: string; orderNumber?: string; orderStatus: string; readyMadeQuality?: string; holdReason?: string; shipmentStarted?: boolean };
export type CheckRow = CheckOrder & { quality: string; orderDate: string };
export type CheckEvent = { id: string; action: string; note: string; actor: string; createdAt: string };
export type CheckPage<T> = { content: T[]; totalPages: number; totalElements: number };
export function listChecks(view: "holds" | "quality", quality: string, page: number): Promise<CheckPage<CheckRow>> {
  const params = new URLSearchParams({ view, page: String(page) });
  if (quality) params.set("quality", quality);
  return apiFetch(`${base}?${params}`);
}
export function checkHistory(id: string, page: number): Promise<CheckPage<CheckEvent>> {
  return apiFetch(`${base}/${id}/history?page=${page}`);
}
export function actOnCheck(id: string, action: string, note: string) {
  return apiFetch(`${base}/${id}`, { method: "POST", body: JSON.stringify({ action, note }) });
}
