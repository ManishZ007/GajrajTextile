"use client";

import { usePageTitle } from "@/hooks/usePagetitle";

export default function DashboardOverview() {
  const title = usePageTitle();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h1>
    </div>
  );
}
