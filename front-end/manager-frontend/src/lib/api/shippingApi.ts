import { apiFetch } from "./apiFetch";

const BASE = "http://localhost:8089";

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ShipmentResponse {
  shipmentId: string;
  orderId: string;
  userId: string;
  provider: string;
  shipmentType: string;
  trackingNumber: string;
  awbNumber: string;
  courierName: string;
  trackingUrl: string;
  estimatedDelivery: string;
  shipmentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  trackingId: string;
  status: string;
  title: string;
  description: string;
  location: string;
  eventTime: string;
}

export interface TrackingResponse {
  shipment: ShipmentResponse;
  currentStatus: string;
  estimatedDelivery: string;
  timeline: TrackingEvent[];
}

export interface CreateShipmentPayload {
  orderId: string;
  shipmentType: "READYMADE" | "CUSTOM";
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientPincode: string;
  weightKg?: number;
}

export function getShipmentByOrderId(orderId: string): Promise<ShipmentResponse> {
  return apiFetch(`${BASE}/shipping/${orderId}`, { headers: authHeader() });
}

export function getTrackingInfo(trackingNumber: string): Promise<TrackingResponse> {
  return apiFetch(`${BASE}/shipping/tracking/${trackingNumber}`, { headers: authHeader() });
}

export function createShipment(data: CreateShipmentPayload): Promise<ShipmentResponse> {
  return apiFetch(`${BASE}/shipping/create`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  });
}

export function advanceMockStatus(shipmentId: string): Promise<ShipmentResponse> {
  return apiFetch(`${BASE}/shipping/mock/next-status`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ shipmentId }),
  });
}

export function cancelShipment(shipmentId: string, reason?: string): Promise<ShipmentResponse> {
  return apiFetch(`${BASE}/shipping/cancel`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ shipmentId, reason }),
  });
}
