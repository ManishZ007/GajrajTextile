"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchManagerWorkers, ManagerWorkerActivity } from "@/lib/api/ownerApi";
export default function ManagerWorkers({ id }: { id: string }) {
  const [data,setData]=useState<ManagerWorkerActivity|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  async function load() {
    setLoading(true);setError("");
    try {setData(await fetchManagerWorkers(id));}
    catch {setError("Worker activity unavailable. Retry when Manager and Worker services are available.");}
    finally {setLoading(false);}
  }
  useEffect(()=>{void load();},[id]);
  return <section className="rounded-2xl border border-white/50 bg-white/40 p-5">
    <div className="flex justify-between mb-4"><h2 className="font-semibold">Worker operations</h2>
      <button onClick={load} disabled={loading} className="text-sm underline">Refresh</button></div>
    {loading ? <p>Loading worker activity…</p> : error ? <p role="alert" className="text-red-700">{error}</p> : data && <>
      <p className="mb-4 text-sm">Workers created: <b>{data.created}</b> · Assignments given: <b>{data.assignments}</b></p>
      {!data.items.length && <p className="text-sm text-gray-500">No worker activity recorded for this manager.</p>}
      {data.items.map(w=><details key={w.workerId} className="border-t py-3">
        <summary className="cursor-pointer">Worker {w.code || w.workerId} · {w.createdByManager ? "Created by this manager" : "Assigned by this manager"} · {w.assignments.length} assignments</summary>
        <div className="text-sm mt-3 space-y-2">
          {w.userId && <Link href={`/workers/${w.userId}`} className="underline">View worker profile</Link>}
          <p>Verification: {w.status}</p>
          {w.assignments.length===0 && <p>No assignments recorded.</p>}
          {w.assignments.map(a=><div key={a.source+a.id} className="border rounded-lg p-3">
            {a.source==="manager" ? <Link className="underline" href={`/orders/${a.orderId}`}>Order {a.orderId}</Link> : <span>Legacy order {a.orderId}</span>}
            <p>{a.task || "Assignment"} · {a.status || "Unknown"} · {a.date ? new Date(a.date).toLocaleString("en-IN") : "Date unavailable"}</p>
          </div>)}
        </div>
      </details>)}
    </>}
  </section>;
}
