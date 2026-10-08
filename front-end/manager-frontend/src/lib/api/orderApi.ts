import { apiFetch } from "./apiFetch";

const ORDER_SERVICE = "http://localhost:8083";

export async function fetchAllOrders(
  params: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    userId?: string;
    orderType?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.orderType) query.set("orderType", params.orderType);
  if (params.userId) query.set("userId", params.userId);
  return apiFetch(`${ORDER_SERVICE}/manager/orders/all?${query}`);
}

export async function fetchOrderById(orderId: string) {
  return apiFetch(`${ORDER_SERVICE}/manager/orders/${orderId}`);
}

export async function cancelOrder(orderId: string) {
  return apiFetch(`${ORDER_SERVICE}/manager/orders/${orderId}/cancel`, { method: "PUT" });
}

export async function updateOrderStatus(orderId: string, status: string) {
  return apiFetch(`${ORDER_SERVICE}/manager/orders/${orderId}/status?status=${status}`, {
    method: "PUT",
  });
}

export async function takeOrder(orderId: string) {
  return apiFetch(`${ORDER_SERVICE}/manager/orders/${orderId}/take`, { method: "PUT" });
}
