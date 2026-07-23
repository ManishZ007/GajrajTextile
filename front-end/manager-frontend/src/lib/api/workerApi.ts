import { apiFetch } from "./apiFetch";

const AUTH_SERVICE = "http://localhost:8081";
const WORKER_SERVICE = "http://localhost:8084";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface WorkerVerification {
  id: string;
  oldStatus: VerificationStatus;
  newStatus: VerificationStatus;
  changeBy: string;
  changeAt: string;
  reason: string;
}

export interface WorkerEntry {
  worker: {
    workerId: string;
    workExperience: number;
    workerCode: number;
    userId: string;
    gender: string;
    dateOfBirth: string;
    createdAt: string;
    updatedAt: string;
    verification: WorkerVerification | null;
  };
  user: {
    auth: {
      userId: string;
      fullName: string;
      email: string;
      phoneNumber: string;
      role: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface WorkersPage {
  size: number;
  totalPages: number;
  currentPage: number;
  totalElements: number;
  workers: WorkerEntry[];
}

export function fetchAllWorkers(): Promise<WorkersPage> {
  return apiFetch(`${WORKER_SERVICE}/manger-worker/all`);
}

export interface WorkerDetail {
  authentication: {
    message: string;
    auth: {
      userId: string;
      fullName: string;
      email: string;
      phoneNumber: string;
      role: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  worker: {
    workerId: string;
    userId: string;
    workExperience: number;
    workerCode: number;
    gender: string;
    dateOfBirth: string;
    createdAt: string;
    updatedAt: string;
    verification: {
      id: string;
      oldStatus: string;
      newStatus: string;
      changeBy: string;
      changeAt: string;
      reason: string;
    } | null;
    assignments: {
      id: string;
      orderId: number;
      assignedBy: string;
      assignedDate: string;
      status: string;
      progress: { progressPercent: number; currentStep: string; updatedAt: string } | null;
      performance: { pointGet: number; penaltyPoints: number; evaluatedBy: string; evaluatedAt: string } | null;
      materialUsage: {
        orderId: string;
        materialId: string;
        reportedAt: string;
        material: { zari: number; silk: number; zariType: string } | null;
      } | null;
    }[];
  };
}

export function fetchWorkerDetail(userId: string): Promise<WorkerDetail> {
  return apiFetch(`${WORKER_SERVICE}/getWorker?userId=${userId}`);
}

export function createWorker(data: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  workExperience?: string;
  gender?: string;
  dateOfBirth?: string;
}): Promise<unknown> {
  const managerId = typeof window !== "undefined" ? (localStorage.getItem("user_id") ?? "") : "";
  return apiFetch(`${AUTH_SERVICE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      fullName: data.fullName,
      email: data.email,
      passwordHash: data.password,
      phoneNumber: data.phoneNumber,
      role: "WORKER",
      worker: {
        workExperience: data.workExperience ? parseInt(data.workExperience) : 0,
        gender: data.gender ?? "",
        dateOfBirth: data.dateOfBirth ?? "",
        managerId,
      },
    }),
  });
}

export function updateWorker(
  userId: string,
  workerId: string,
  data: { fullName?: string; email?: string; phoneNumber?: string; workExperience?: number; gender?: string; dateOfBirth?: string }
): Promise<unknown> {
  return apiFetch(`${AUTH_SERVICE}/auth/updateUser/${userId}/${workerId}`, {
    method: "PUT",
    body: JSON.stringify({
      userType: "WORKER",
      userInfo: {
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber,
      },
      worker: {
        worker_experience: data.workExperience,
        worker_profile_image: "",
        gender: data.gender,
        date_of_birth: data.dateOfBirth,
      },
    }),
  });
}

export function deleteWorker(workerId: string): Promise<{ message: string }> {
  return apiFetch(`${AUTH_SERVICE}/auth/deleteUser/${workerId}`, {
    method: "DELETE",
  });
}

export function verifyWorker(
  workerId: string,
  status: VerificationStatus,
  changeBy: string,
  reason?: string
): Promise<unknown> {
  const params = new URLSearchParams({ status, changeBy });
  if (reason) params.set("reason", reason);
  return apiFetch(`${WORKER_SERVICE}/manger-worker/verify/${workerId}?${params}`, {
    method: "PUT",
  });
}
