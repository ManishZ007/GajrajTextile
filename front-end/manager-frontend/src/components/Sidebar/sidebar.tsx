"use client";

import { featureMap } from "@/providers/SideBarData";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const baseRoute = "/" + pathname.split("/")[1];
  const features = featureMap[baseRoute] || [];

  return (
    <aside className="relative flex flex-col shrink-0 border-r border-transparent bg-transparent backdrop-blur-sm p-1">
      <nav className="flex flex-col items-center gap-1.5 pt-5 px-2 flex-1">
        {features.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.tooltip}
              className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "text-[#616a7c] hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <item.icon />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
