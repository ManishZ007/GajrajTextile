"use client";
import Link from "next/link";
import type { ManagerOrderRow } from "@/lib/api/ownerApi";
export default function ManagerOrderDetails({ rows, view, onView }: { rows: ManagerOrderRow[]; view: string; onView: (v:string)=>void }) {
  const filtered=rows.filter(r=>{
    if(view==="dealer" || view==="customer")return r.type===view;
    if(view==="active")return !["DRAFT","CANCELLED","DELIVERED","COMPLETED"].includes(r.status);
    if(view==="delivered")return r.status==="DELIVERED";
    if(view==="value")return r.includedInFinancials;
    if(view==="collected")return r.includedInFinancials && r.collected!==null && r.collected>0;
    if(view==="balance")return r.includedInFinancials && r.collected!==null && r.amount>r.collected;
    return true;
  });
  const money=(n:number|null)=>n===null?"Unavailable":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(n);
  return <section id="manager-orders" className="rounded-2xl border border-white/50 bg-white/40 p-5">
    <div className="flex justify-between gap-3 mb-4"><h2 className="font-semibold">Orders and payments ({filtered.length})</h2>
      <select aria-label="Filter manager orders" value={view} onChange={e=>onView(e.target.value)} className="rounded border p-2 text-sm">
        {Object.entries({all:"All orders",dealer:"Dealer orders",customer:"Customer orders",active:"Active orders",delivered:"Delivered orders",value:"Financial orders",collected:"Collected payments",balance:"Pending balances"}).map(([v,label])=><option value={v} key={v}>{label}</option>)}
      </select>
    </div>
    <p className="text-xs text-gray-500 mb-3">Financial totals include customer and dealer orders, excluding cancelled orders and dealer drafts. Cancelled payments/refunds are outside this summary.</p>
    {filtered.some(r=>r.collected===null) && <p className="text-sm text-amber-700 mb-3">Some payment details are unavailable.</p>}
    <div className="overflow-x-auto"><table className="w-full text-sm text-left">
      <thead><tr>{["Order","Type","Status","Value","Collected","Balance"].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead>
      <tbody>{filtered.map(r=><tr key={r.type+r.id} className="border-t">
        <td className="p-2"><Link className="underline" href={r.type==="dealer"?`/dealers/orders/${r.id}`:`/orders/${r.id}`}>{r.number || r.id}</Link><p className="text-xs text-gray-500">{r.date ? new Date(r.date).toLocaleDateString("en-IN"):""}</p></td>
        <td className="p-2 capitalize">{r.type}</td><td className="p-2">{r.status}</td>
        <td className="p-2">{money(r.amount)}</td><td className="p-2">{money(r.collected)}</td>
        <td className="p-2">{r.includedInFinancials?money(r.collected===null?null:Math.max(0,r.amount-r.collected)):"Not included"}</td>
      </tr>)}</tbody>
    </table></div>
    {!filtered.length && <p className="py-6 text-gray-500">No matching orders.</p>}
  </section>;
}
