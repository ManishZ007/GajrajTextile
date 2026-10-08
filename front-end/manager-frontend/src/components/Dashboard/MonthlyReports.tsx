"use client";
import { useState } from "react";
import { reportMonths, ReportType } from "@/lib/reports/monthlyReports";
export default function MonthlyReports() {
  const months = reportMonths();
  const [month, setMonth] = useState(months[0].value);
  const [basis, setBasis] = useState<"ordered" | "registered">("ordered");
  const [busy, setBusy] = useState<ReportType | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function download(type: ReportType) {
    setBusy(type);
    setError("");
    setMessage("Preparing Excel report…");
    try {
      const { exportMonthlyReport } =
        await import("@/lib/reports/monthlyReports");
      setMessage(await exportMonthlyReport(type, month, basis, setMessage));
    } catch (e) {
      setMessage("");
      setError(
        e instanceof Error
          ? e.message
          : "Report download failed. Please retry.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Monthly Excel reports</h2>
          <p className="mt-1 text-sm text-gray-500">
            All managers · last six months · current payment and delivery
            statuses
          </p>
        </div>
        <label className="text-sm">
          Report month
          <select
            disabled={busy !== null}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="ml-3 rounded-lg border bg-white p-2"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {(
          [
            [
              "customer-orders",
              "Customer orders",
              "Orders, payments, shipment details, items and manager names.",
            ],
            [
              "dealer-orders",
              "Dealer orders",
              "Dealer details, orders, payments, items and manager names.",
            ],
            [
              "customers",
              "Customer details",
              "Customer profiles, saved addresses and orders in the selected month.",
            ],
          ] as const
        ).map(([type, title, description]) => (
          <div
            key={type}
            className="flex flex-col rounded-xl border border-white bg-white/50 p-4"
          >
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 mb-4 text-sm text-gray-500">{description}</p>
            {type === "customers" && (
              <label className="mb-4 text-xs text-gray-500">
                Include customers who
                <select
                  aria-label="Customer report selection"
                  disabled={busy !== null}
                  value={basis}
                  onChange={(e) => setBasis(e.target.value as typeof basis)}
                  className="mt-1 w-full rounded-lg border bg-white p-2 text-sm"
                >
                  <option value="ordered">Placed orders this month</option>
                  <option value="registered">Registered this month</option>
                </select>
              </label>
            )}
            <button
              disabled={busy !== null}
              onClick={() => download(type)}
              className="mt-auto rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              {busy === type ? "Preparing…" : "Download Excel (.xlsx)"}
            </button>
          </div>
        ))}
      </div>
      {message && (
        <p role="status" className="mt-4 text-sm text-gray-600">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-gray-500">
        Current month is month-to-date. Customer reports contain personal
        information. Names reflect current records; the system does not
        separately record who completed an order.
      </p>
    </section>
  );
}
