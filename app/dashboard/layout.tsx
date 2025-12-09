"use client";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  History,
  Settings,
  CreditCard,
  Moon,
  Sun,
} from "lucide-react";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Client-side mount fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* LEFT SIDEBAR */}
      <aside
        className="
          w-64 fixed inset-y-0 left-0 z-40
          bg-white dark:bg-slate-800
          border-r dark:border-slate-700
          shadow-sm
          text-slate-800 dark:text-slate-100
          flex flex-col
        "
      >
        {/* LOGO */}
        <div className="p-6 border-b dark:border-slate-700">
          <h1 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
            TalentRank AI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
            Recruiter Intelligence Platform
          </p>
        </div>

        {/* NAV */}
        <nav className="p-4 space-y-1 flex-1">
          <SidebarLink url="/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} />
          <SidebarLink url="/dashboard/upload" label="Upload" icon={<Upload className="h-4 w-4" />} />
          <SidebarLink url="/dashboard/history" label="History" icon={<History className="h-4 w-4" />} />
          <SidebarLink url="/dashboard/settings" label="Settings" icon={<Settings className="h-4 w-4" />} />
          <SidebarLink url="/dashboard/billing" label="Billing" icon={<CreditCard className="h-4 w-4" />} />
        </nav>

        {/* THEME SWITCH */}
        <div className="p-4 border-t dark:border-slate-700">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md
                bg-slate-100 dark:bg-slate-700
                text-slate-700 dark:text-slate-200
                hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span className="text-sm">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">Light Mode</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* LOGOUT */}
        <div className="p-4 border-t dark:border-slate-700">
          <form action="/logout" method="post">
            <button
              type="submit"
              className="w-full p-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-6">{children}</main>
    </div>
  );
}

function SidebarLink({ url, label, icon }: any) {
  const pathname = usePathname();
  const active = pathname === url;

  return (
    <Link
      href={url}
      className={`
        flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition
        ${
          active
            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        }
      `}
    >
      {icon}
      {label}
    </Link>
  );
}
