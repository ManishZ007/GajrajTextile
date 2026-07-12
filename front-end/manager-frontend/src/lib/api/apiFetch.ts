export async function apiFetch(path: string, options: RequestInit = {}) {
  let res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    try {
      const refreshRes = await fetch(
        "http://localhost:8081/auth/admin/refresh",
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!refreshRes.ok) {
        window.location.href = "/login";
        throw new Error("Session expired");
      }

      // Save new access_token for Bearer-based services (e.g. shipping)
      const refreshData = await refreshRes.json().catch(() => null);
      const newToken = refreshData?.access_token ?? refreshData?.accessToken ?? refreshData?.token;
      if (newToken && typeof window !== "undefined") {
        localStorage.setItem("access_token", newToken);
      }

      // Rebuild headers — replace stale Bearer token if we got a new one
      const retryHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      if (newToken && retryHeaders["Authorization"]) {
        retryHeaders["Authorization"] = `Bearer ${newToken}`;
      }

      res = await fetch(path, {
        ...options,
        credentials: "include",
        headers: retryHeaders,
      });
    } catch {
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? body ?? message;
    } catch {
      try { message = await res.text() || message; } catch {}
    }
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return res.json();
}
