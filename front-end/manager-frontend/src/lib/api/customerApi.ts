import { apiFetch } from "./apiFetch";

const CUSTOMER_SERVICE = "http://localhost:8082";
const ORDER_SERVICE = "http://localhost:8083";

// ── Customers ──────────────────────────────────────────────────────────────────

export function fetchCustomers(params: {
  page?: number;
  size?: number;
  search?: string;
} = {}) {
  const q = new URLSearchParams();
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.size !== undefined) q.set("size", String(params.size));
  if (params.search) q.set("search", params.search);
  return apiFetch(`${CUSTOMER_SERVICE}/internal/customers?${q}`);
}

export function fetchCustomerById(customerId: string) {
  return apiFetch(`${CUSTOMER_SERVICE}/internal/customers/${customerId}`);
}

export function fetchCustomerProfile(userId: string) {
  return apiFetch(`${CUSTOMER_SERVICE}/internal/customers/profile/${userId}`);
}

export function deleteCustomer(customerId: string) {
  return apiFetch(`${CUSTOMER_SERVICE}/internal/customers/${customerId}`, {
    method: "DELETE",
  });
}

export function updateCustomerProfile(
  customerId: string,
  data: { gender?: string; date_of_birth?: string; profile_image_url?: string },
) {
  return apiFetch(`${CUSTOMER_SERVICE}/internal/updateCustomer/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── Addresses ─────────────────────────────────────────────────────────────────

export interface AddressPayload {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export function addCustomerAddress(customerId: string, data: AddressPayload) {
  return apiFetch(`${CUSTOMER_SERVICE}/internal/customers/${customerId}/address`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCustomerAddress(
  customerId: string,
  addressId: number,
  data: AddressPayload,
) {
  return apiFetch(
    `${CUSTOMER_SERVICE}/internal/customers/${customerId}/address/${addressId}`,
    { method: "PUT", body: JSON.stringify(data) },
  );
}

export function deleteCustomerAddress(customerId: string, addressId: number) {
  return apiFetch(
    `${CUSTOMER_SERVICE}/internal/customers/${customerId}/address/${addressId}`,
    { method: "DELETE" },
  );
}

// ── Orders (by customer userId) ───────────────────────────────────────────────

export function fetchOrdersByUser(params: {
  userId: string;
  page?: number;
  size?: number;
  status?: string;
}) {
  const q = new URLSearchParams();
  q.set("userId", params.userId);
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.size !== undefined) q.set("size", String(params.size));
  if (params.status) q.set("status", params.status);
  return apiFetch(`${ORDER_SERVICE}/order/all?${q}`);
}
