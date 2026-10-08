import { apiFetch } from "./apiFetch";
import { fetchAllOrders } from "./orderApi";
import { fetchDealerOrders, DealerOrder } from "./dealerApi";
import { WorkerEntry } from "./workerApi";
import { PaymentSummary } from "./paymentApi";

export interface CustomerOrder {
  orderId: string; orderNumber: string; orderStatus: string; totalAmount: number;
  orderDate: string; paymentMethod: string; codCollected: boolean; integrationPending?: boolean;
}
export interface DashboardOrder { id: string; number: string; type: "Customer" | "Dealer"; status: string; amount: number; date: string; href: string }
export interface Page<T> { content: T[]; totalPages: number; totalElements: number }
// Fetch every page, rather than presenting the first page as an organisation total.
export async function collectPages<T>(fetchPage: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; ; page++) {
    const result = await fetchPage(page);
    if (!Array.isArray(result.content) || !Number.isInteger(result.totalPages)) throw new Error("Invalid list response");
    rows.push(...result.content);
    if (page + 1 >= result.totalPages) return rows;
    if (page >= 999) throw new Error("Too many records to summarise in the browser.");
  }
}
export const customerOrders = () => collectPages<CustomerOrder>((page) => fetchAllOrders({page, size: 100}));
export const dealerOrders = () => collectPages<DealerOrder>(async (page) => {
  const r = await fetchDealerOrders({page, size: 100}); return {...r, content: r.orders};
});
export const dashboardWorkers = () => collectPages<WorkerEntry>(async (page) => {
  const r = await apiFetch(`http://localhost:8084/manger-worker/all?page=${page}&size=100`);
  return {...r, content: r.workers};
});
export async function dashboardPayments(orders: CustomerOrder[]) {
  const ids = orders.filter(o => o.paymentMethod !== "COD" && o.orderStatus !== "CANCELLED").map(o => o.orderId);
  const result: Record<string, PaymentSummary> = {};
  for (let i = 0; i < ids.length; i += 500) Object.assign(result, await apiFetch("http://localhost:8088/payment/manager/orders/summaries", {method: "POST", body: JSON.stringify(ids.slice(i, i + 500))}));
  return result;
}
export function finance(customers: CustomerOrder[], dealers: DealerOrder[], payments: Record<string, PaymentSummary> | null) {
  const retail = customers.filter(o => !["CANCELLED", "DRAFT"].includes(o.orderStatus));
  const bulk = dealers.filter(o => !["CANCELLED", "DRAFT"].includes(o.status));
  const value = retail.reduce((n,o) => n + Number(o.totalAmount),0) + bulk.reduce((n,o) => n + Number(o.totalAmount),0);
  const complete = retail.every(o => o.paymentMethod === "COD" ? !o.integrationPending : payments?.[o.orderId]?.amount != null && payments?.[o.orderId]?.status != null);
  const collected = complete ? retail.reduce((n,o) => n + (o.paymentMethod === "COD" ? (o.codCollected ? Number(o.totalAmount) : 0) : payments?.[o.orderId]?.status === "PAID" ? Number(payments[o.orderId].amount) : 0),0) + bulk.reduce((n,o) => n + Number(o.paidAmount),0) : null;
  return {value, collected, balance: collected === null ? null : Math.max(0,value-collected)};
}
