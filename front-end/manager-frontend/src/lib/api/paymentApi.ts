import { apiFetch } from "./apiFetch";

export interface PaymentSummary {
  status?: string;
  paymentMethod?: string;
  amount?: number;
  currency?: string;
  paymentId?: string;
  updatedAt?: string;
}

export function fetchOrderPayment(orderId: string): Promise<PaymentSummary> {
  const token = localStorage.getItem("access_token");
  return apiFetch(`http://localhost:8088/payment/manager/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
}
