"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dealers", href: "/dealers" },
  { label: "All orders", href: "/dealers/orders" },
];

export default function DealersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const showTabs = pathname === "/dealers" || pathname === "/dealers/orders";

  return (
    <div className="flex flex-col gap-4">
      {showTabs && (
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                pathname === tab.href
                  ? "bg-black text-white"
                  : "text-[#616a7c] hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
