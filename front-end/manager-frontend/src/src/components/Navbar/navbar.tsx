"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { adminLogout } from "@/lib/api/auth";
import { useRole } from "@/hooks/useRole";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Products", href: "/products" },
  { label: "Orders", href: "/orders" },
  { label: "Workers", href: "/workers" },
  { label: "Customers", href: "/customers" },
  { label: "Support", href: "/support" },
  { label: "Reports", href: "/reports" },
  { label: "Inventory", href: "/inventory" },
];

export default function Navbar() {
  const pathname = usePathname();
  const baseRouet = "/" + pathname.split("/")[1];
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { role } = useRole();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    adminLogout();
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-transparent backdrop-blur-sm border-b border-transparent">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="text-[18px] tracking-wide font-semibold text-gray-800 shrink-0"
      >
        Gajraj<span className="font-normal text-gray-400">console</span>
      </Link>

      {/* Nav links — absolutely centered */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              baseRouet === item.href
                ? "bg-black text-white"
                : "text-[#616a7c] hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Search */}
        <button
          aria-label="Search"
          className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        {/* Messages / mail */}
        <button
          aria-label="Messages"
          className="p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 7l10 7 10-7"
            />
          </svg>
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.73 21a2 2 0 01-3.46 0"
            />
          </svg>
          {/* badge */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Role badge */}
        {role && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            role === "OWNER"
              ? "bg-amber-100 text-amber-700"
              : "bg-blue-100 text-blue-700"
          }`}>
            {role}
          </span>
        )}

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            aria-label="Profile"
            onClick={() => setProfileOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-300 flex items-center justify-center text-white text-[11px] font-semibold tracking-wide hover:border-gray-400 transition-colors"
          >
            M
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800 truncate">{role ?? "Manager"}</p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">GajrajConsole</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
