const AUTH_SERVICE = "http://localhost:8081";

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${AUTH_SERVICE}/auth/admin/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Login failed");
  }

  const data = await res.json();
  if (data.role) localStorage.setItem("role", data.role);
  if (data.user_id) localStorage.setItem("user_id", data.user_id);
  // Save token for services that need Bearer header (e.g. shipping service)
  const token = data.token ?? data.accessToken ?? data.access_token;
  if (token) localStorage.setItem("access_token", token);
  return data;
}

export async function adminRefresh() {
  const res = await fetch(`${AUTH_SERVICE}/auth/admin/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Session expired");
  const data = await res.json();
  const token = data.token ?? data.accessToken ?? data.access_token;
  if (token) localStorage.setItem("access_token", token);
  return data;
}

export async function adminLogout() {
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("access_token");
  window.location.href = "/login";
}
