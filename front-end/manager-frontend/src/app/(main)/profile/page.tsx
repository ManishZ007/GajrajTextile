"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WorkerActivity from "./WorkerActivity";
import { apiFetch } from "@/lib/api/apiFetch";
import { adminLogout } from "@/lib/api/auth";

type Profile = { fullName?: string; email?: string; phoneNumber?: string; role?: string; createdAt?: string };
type Orders = {
  customerOrders: number; completedCustomerOrders: number; bulkOrders: number; completedBulkOrders: number;
  totalPages: number; totalElements: number;
  items: { id: string; number: string; status: string; amount: number; date: string }[];
};
const card = "rounded-2xl border border-white/60 bg-white/50 p-6";
const date = (value?: string) => value ? new Date(value).toLocaleDateString("en-IN") : "Unavailable";

export default function ManagerProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Orders | null>(null);
  const [type, setType] = useState<"customer" | "bulk">("customer");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [profileError, setProfileError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setProfileError("");
    const token = localStorage.getItem("access_token");
    apiFetch("http://localhost:8081/auth/admin/me", { headers: { Authorization: `Bearer ${token ?? ""}` } })
      .then(data => { if (active) setProfile(data.auth); })
      .catch(() => { if (active) setProfileError("Could not load your account details."); });
    return () => { active = false; };
  }, [revision]);

  useEffect(() => {
    let active = true;
    setLoading(true); setOrderError(""); setOrders(null);
    apiFetch(`http://localhost:8083/manager/profile/orders?type=${type}&page=${page}`)
      .then(data => { if (active) setOrders(data); })
      .catch(() => { if (active) setOrderError("Could not load your orders. Please retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type, page, revision]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <header className="flex items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-widest text-gray-500">My account</p><h1 className="text-2xl font-semibold text-gray-800 mt-1">Manager profile</h1></div>
        <button onClick={() => setRevision(v => v + 1)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm">Refresh</button>
      </header>
      <section className={`${card} flex flex-wrap items-center gap-6`}>
        <div className="h-20 w-20 rounded-full bg-gray-800 text-white flex items-center justify-center text-2xl font-semibold" aria-hidden="true">{profile?.fullName?.trim().charAt(0).toUpperCase() || "M"}</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-800">{profile?.fullName || "Your profile"}</h2>
          {profileError ? <p role="alert" className="text-red-700 mt-2">{profileError}</p> : !profile ? <p className="text-gray-500">Loading account details...</p> : <>
            <p className="text-gray-600 break-all mt-1">{profile.email || "Email unavailable"}</p>
            <p className="text-sm text-gray-500 mt-1">{profile.phoneNumber || "Phone unavailable"}</p>
            <p className="text-xs text-gray-500 mt-2">{profile.role} · Joined {date(profile.createdAt)}</p>
          </>}
        </div>
        <button onClick={() => { void adminLogout().catch(e => alert(e instanceof Error ? e.message : "Logout failed. Retry.")); }} className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600">Log out</button>
      </section>
      <WorkerActivity revision={revision} />
      {orderError && <div role="alert" className="rounded-xl bg-red-50 text-red-700 p-4">{orderError}</div>}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Order statistics">
        {[
          ["Customer orders handled", orders?.customerOrders], ["Customer orders completed", orders?.completedCustomerOrders],
          ["Bulk orders created", orders?.bulkOrders], ["Bulk orders delivered", orders?.completedBulkOrders],
        ].map(([label, value]) => <div key={label} className={card}><p className="text-xs text-gray-500">{label}</p><p className="text-3xl font-semibold text-gray-800 mt-3">{value ?? "—"}</p></div>)}
      </section>
      <p className="text-xs text-gray-500">Customer orders are assigned to you. Completed includes completed or delivered customer orders. Bulk orders are dealer orders you created; delivered means finished.</p>
      <section className={`${card} !p-0 overflow-hidden`}>
        <div className="flex flex-wrap justify-between items-center gap-3 p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">My orders</h2>
          <div className="flex gap-2">{(["customer", "bulk"] as const).map(value => <button key={value} aria-pressed={type === value} onClick={() => { setType(value); setPage(0); }} className={`rounded-full px-4 py-2 text-sm ${type === value ? "bg-black text-white" : "bg-white/60 text-gray-600"}`}>{value === "customer" ? "Customer orders" : "Bulk orders"}</button>)}</div>
        </div>
        {loading ? <p role="status" className="p-8 text-gray-500">Loading orders...</p> : orders && orders.items.length === 0 ? <p className="p-8 text-gray-500">No {type} orders assigned to your profile yet.</p> : orders && <div className="overflow-x-auto"><table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-gray-500"><tr>{["Order", "Date", "Status", "Amount"].map(label => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
          <tbody>{orders.items.map(order => <tr key={order.id} className="border-t border-gray-200/70">
            <td className="px-5 py-4"><Link className="font-medium underline underline-offset-4" href={`${type === "bulk" ? "/dealers/orders" : "/orders"}/${order.id}`}>{order.number || order.id}</Link></td>
            <td className="px-5 py-4 text-gray-600">{date(order.date)}</td>
            <td className="px-5 py-4"><span className="rounded-full bg-white/70 px-2 py-1 text-xs">{order.status.replace(/_/g, " ")}</span></td>
            <td className="px-5 py-4">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(order.amount ?? 0)}</td>
          </tr>)}</tbody>
        </table></div>}
        {orders && orders.totalPages > 0 && <div className="p-5 flex items-center justify-between text-sm border-t border-gray-200">
          <span>{orders.totalElements} orders · Page {page + 1} of {orders.totalPages}</span>
          <div className="flex gap-3"><button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="disabled:opacity-30">Previous</button><button disabled={page + 1 >= orders.totalPages} onClick={() => setPage(p => p + 1)} className="disabled:opacity-30">Next</button></div>
        </div>}
      </section>
    </div>
  );
}
