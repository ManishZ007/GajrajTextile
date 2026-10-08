"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/apiFetch";
export default function ManagerPresence({ id }: { id: string }) {
  const [status,setStatus]=useState("CHECKING");
  useEffect(()=>{
    let live=true;
    const load=()=>apiFetch(`http://localhost:8081/auth/managers/${id}/presence`)
      .then(data=>{if(live)setStatus(data.status);}).catch(()=>{if(live)setStatus("UNAVAILABLE");});
    void load();const timer=setInterval(load,15000);
    return ()=>{live=false;clearInterval(timer);};
  },[id]);
  return <span title="Login presence; disconnected sessions expire within 2 minutes."
    className={`text-xs rounded-full px-2 py-1 ${status==="ACTIVE"?"bg-emerald-100 text-emerald-800":"bg-gray-100 text-gray-600"}`}>{status}</span>;
}
