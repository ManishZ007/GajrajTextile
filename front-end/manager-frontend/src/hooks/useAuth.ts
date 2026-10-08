"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/apiFetch";
import { adminRefresh } from "@/lib/api/auth";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let stopped = false;
    async function heartbeat() {
      if (stopped || !localStorage.getItem("access_token")) return;
      try {
        const me = await apiFetch("http://localhost:8081/auth/admin/session/heartbeat", { method: "POST" });
        localStorage.setItem("role", me.role); localStorage.setItem("user_id", me.user_id);
      } catch { /* The API helper handles session expiry; temporary outages expire presence naturally. */ }
    }
    const timer = setInterval(heartbeat, 30000);
    adminRefresh()
      .then(async () => { await heartbeat(); if (!stopped) setAuthenticated(true); })
      .catch(() => router.push("/login"))
      .finally(() => { if (!stopped) setLoading(false); });
    return () => { stopped = true; clearInterval(timer); };
  }, []);

  return { loading, authenticated };
}
