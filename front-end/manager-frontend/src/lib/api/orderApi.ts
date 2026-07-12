import { apiFetch } from "./apiFetch";

const ORDER_SERVICE = "http://localhost:8083";

export async function fetchAllOrders(
  params: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    orderType?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.orderType) query.set("orderType", params.orderType);
  return apiFetch(`${ORDER_SERVICE}/order/all?${query}`);
}

export async function fetchOrderById(orderId: string) {
  return apiFetch(`${ORDER_SERVICE}/order/${orderId}`);
}

export async function cancelOrder(orderId: string) {
  return apiFetch(`${ORDER_SERVICE}/order/cancel/${orderId}`, { method: "PUT" });
}

export async function updateOrderStatus(orderId: string, status: string) {
  return apiFetch(`${ORDER_SERVICE}/order/status/${orderId}?status=${status}`, {
    method: "PUT",
  });
}

