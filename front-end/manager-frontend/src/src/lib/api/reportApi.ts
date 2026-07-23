import { apiFetch } from "./apiFetch";

const MANAGER_SERVICE = "http://localhost:8085";

// ── Reports ────────────────────────────────────────────────────────────────────

export async function fetchAllReports(
  params: {
    page?: number;
    size?: number;
    reportType?: string;
    readStatus?: string;
    approvalStatus?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.reportType) query.set("reportType", params.reportType);
  if (params.readStatus) query.set("readStatus", params.readStatus);
  if (params.approvalStatus) query.set("approvalStatus", params.approvalStatus);
  return apiFetch(`${MANAGER_SERVICE}/manager/reports/all?${query}`);
}

export async function fetchReportById(reportId: string) {
  return apiFetch(`${MANAGER_SERVICE}/manager/reports/${reportId}`);
}

export async function createReport(data: {
  reportType: string;
  description: string;
  reportedBy: string;
}) {
  return apiFetch(`${MANAGER_SERVICE}/manager/reports/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReport(
  reportId: string,
  data: { reportType: string; description: string; reportedBy: string },
) {
  return apiFetch(`${MANAGER_SERVICE}/manager/reports/update/${reportId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteReport(reportId: string) {
  return apiFetch(`${MANAGER_SERVICE}/manager/reports/delete/${reportId}`, {
    method: "DELETE",
  });
}

// ── Price Changes ──────────────────────────────────────────────────────────────

export async function fetchAllPriceChanges(
  params: {
    page?: number;
    size?: number;
    approvalStatus?: string;
    productId?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.approvalStatus) query.set("approvalStatus", params.approvalStatus);
  if (params.productId) query.set("productId", params.productId);
  return apiFetch(`${MANAGER_SERVICE}/manager/price-changes/all?${query}`);
}

export async function createPriceChange(data: {
  productId: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  updatedBy: string;
}) {
  return apiFetch(`${MANAGER_SERVICE}/manager/price-changes/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function approvePriceChange(
  priceChangeId: string,
  approved: boolean,
) {
  return apiFetch(
    `${MANAGER_SERVICE}/manager/price-changes/approve/${priceChangeId}?approved=${approved}`,
    { method: "PUT" },
  );
}

export async function deletePriceChange(priceChangeId: string) {
  return apiFetch(
    `${MANAGER_SERVICE}/manager/price-changes/delete/${priceChangeId}`,
    {
      method: "DELETE",
    },
  );
}

// ── Owner ──────────────────────────────────────────────────────────────────────

const OWNER_SERVICE = "http://localhost:8086";

export async function ownerApproveReport(reportId: string) {
  return apiFetch(`${OWNER_SERVICE}/owner/reports/approve/${reportId}`, {
    method: "PUT",
  });
}

export async function ownerRejectReport(reportId: string) {
  return apiFetch(`${OWNER_SERVICE}/owner/reports/reject/${reportId}`, {
    method: "PUT",
  });
}

export async function ownerApprovePriceChange(priceChangeId: string) {
  return apiFetch(
    `${OWNER_SERVICE}/owner/price-changes/approve/${priceChangeId}`,
    { method: "PUT" },
  );
}

export async function ownerRejectPriceChange(priceChangeId: string) {
  return apiFetch(
    `${OWNER_SERVICE}/owner/price-changes/reject/${priceChangeId}`,
    { method: "PUT" },
  );
}

export async function fetchOwnerDashboard() {
  return apiFetch(`${OWNER_SERVICE}/owner/dashboard`);
}
