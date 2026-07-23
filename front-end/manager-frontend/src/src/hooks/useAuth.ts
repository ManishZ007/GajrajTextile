"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8081/auth/admin/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  return { loading, authenticated };
}
