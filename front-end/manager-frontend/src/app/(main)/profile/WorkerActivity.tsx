"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api/apiFetch";

type Activity = { managerId: string; created: number; approved: number; totalPages: number; items: {
  workerId: string; userId: string; code: number; creator?: string; status: string; approver?: string; createdAt?: string;
}[] };
export default function WorkerActivity({ revision }: { revision: number }) {
  const [data, setData] = useState<Activity | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true; setData(null); setError("");
    apiFetch(`http://localhost:8084/manager/profile/workers?page=${page}`, { headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` } })
      .then(result => { if (active) setData(result); })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError) {
          const hint = error.status === 404 ? "Restart Worker Service from your IDE to load the new endpoint."
            : error.status === 403 ? "Your session does not have manager access. Sign in again."
            : error.status >= 500 ? "Check the Worker Service console for the database/server error."
            : "Refresh and retry.";
          setError(`Worker activity failed (HTTP ${error.status}): ${error.message}. ${hint}`);
        } else setError(error instanceof TypeError ? "Cannot reach Worker Service on port 8084. Check the service and browser Network error." : error instanceof Error ? error.message : "Worker activity unavailable.");
      });
    return () => { active = false; };
  }, [page, revision]);
  const person = (id?: string) => !id ? "Unknown" : id === data?.managerId ? "You" : id;
  return <section className="rounded-2xl border border-white/60 bg-white/50 overflow-hidden">
    <div className="p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold text-gray-800">My worker activity</h2>
      <div className="flex gap-4 text-sm"><Link href="/workers" className="underline">Manage workers</Link><Link href="/workers/verification" className="underline">Verify workers</Link></div>
    </div>
    <div className="p-5 flex gap-10"><div><p className="text-xs text-gray-500">Workers created by you</p><p className="text-3xl font-semibold mt-2">{data?.created ?? "—"}</p></div><div><p className="text-xs text-gray-500">Currently approved by you</p><p className="text-3xl font-semibold mt-2">{data?.approved ?? "—"}</p></div></div>
    <p className="px-5 pb-4 text-xs text-gray-500">Creation and approval are separate actions. Earlier overwritten creator records cannot be recovered. Approval shows the current decision.</p>
    {error ? <p role="alert" className="px-5 pb-5 text-red-700">{error}</p> : !data ? <p role="status" className="p-5 text-gray-500">Loading workers...</p> : !data.items.length ? <p className="p-5 text-gray-500">No workers recorded as created or currently approved by you.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left">
      <thead className="text-xs uppercase text-gray-500"><tr>{["Worker", "Created by", "Status", "Approved by", "Action"].map(v => <th key={v} className="px-5 py-3">{v}</th>)}</tr></thead>
      <tbody>{data.items.map(w => <tr key={w.workerId} className="border-t border-gray-200">
        <td className="px-5 py-4"><Link className="underline" href={`/workers/${w.userId}`}>Worker #{w.code}</Link></td>
        <td className="px-5 py-4 break-all">{person(w.creator)}</td>
        <td className="px-5 py-4">{w.status}</td>
        <td className="px-5 py-4 break-all">{w.status === "APPROVED" ? person(w.approver) : "Not approved"}</td>
        <td className="px-5 py-4"><Link className="underline" href={`/workers/verification/${w.userId}`}>{w.status === "APPROVED" ? "View verification" : "Review worker"}</Link></td>
      </tr>)}</tbody>
    </table></div>}
    {data && data.totalPages > 0 && <div className="p-5 flex justify-between text-sm border-t border-gray-200"><span>Page {page + 1} of {data.totalPages}</span><div className="flex gap-4"><button disabled={!page} className="disabled:opacity-30" onClick={() => setPage(p => p - 1)}>Previous</button><button disabled={page + 1 >= data.totalPages} className="disabled:opacity-30" onClick={() => setPage(p => p + 1)}>Next</button></div></div>}
  </section>;
}
