"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/apiFetch";
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const [state,setState]=useState("loading");
  useEffect(()=>{ let active=true;
    apiFetch("http://localhost:8081/auth/admin/me").then(data=>{
      const role=data.auth?.role ?? data.role;
      if(active) setState(role==="OWNER" ? "allowed" : "denied");
    }).catch(()=>{if(active)setState("error");});
    return ()=>{active=false;};
  },[]);
  if(state==="loading") return <p>Checking access…</p>;
  if(state!=="allowed") return <p role="alert">{state==="denied" ? "Only owners can manage managers." : "Unable to verify access. Refresh to retry."}</p>;
  return <>{children}</>;
}
