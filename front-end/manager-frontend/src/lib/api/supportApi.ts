import { apiFetch } from "./apiFetch";

const MANAGER_SERVICE = "http://localhost:8085";

export const fetchSupportCases = (params: Record<string, string | number> = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  return apiFetch(`${MANAGER_SERVICE}/manager/support/all?${q}`);
};

export const fetchCaseById = (id: string) =>
  apiFetch(`${MANAGER_SERVICE}/manager/support/${id}`);

export const createCase = (data: object) =>
  apiFetch(`${MANAGER_SERVICE}/manager/support/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateCase = (id: string, data: object) =>
  apiFetch(`${MANAGER_SERVICE}/manager/support/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteCase = (id: string) =>
  apiFetch(`${MANAGER_SERVICE}/manager/support/delete/${id}`, {
    method: "DELETE",
  });

export const fetchSupportStats = () =>
  apiFetch(`${MANAGER_SERVICE}/manager/support/stats`);
