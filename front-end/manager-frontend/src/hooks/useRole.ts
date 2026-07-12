"use client";

import { useState, useEffect } from "react";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setUserId(localStorage.getItem("user_id"));
  }, []);

  return {
    role,
    isOwner: role === "OWNER",
    isManager: role === "MANAGER",
    userId,
  };
}
