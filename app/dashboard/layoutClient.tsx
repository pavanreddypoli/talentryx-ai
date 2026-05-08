"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleSwitcher from "@/components/RoleSwitcher";

import {
  LayoutDashboard,
  Upload,
  History,
  Settings,
  CreditCard,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";

import { useTheme } from "next-themes";

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ EXISTING
  useEffect(() => setMounted(true), []);

  // 🔒 NEW: Client-side role guard
  // Ensures job seekers are redirected away from recruiter dashboard
  useEffect(() => {
    if (pathname.startsWith("/job-seeker")) return;
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.active_role === "job_seeker") {
          window.location.href = "/job-seeker/dashboard";
        }
      })
      .catch(() => {
        // fail silently — server guard still exists
      });
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-brand-canvas dark:bg-slate-900">

      {/* 🌟 MOBILE NAVBAR */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-amber" />
          <span className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg">
            Talentryx AI
          </span>
        </div>

        {/* 🔁 ROLE SWITCHER (mobile) */}
        <div className="flex items-center gap-3">
          <RoleSwitcher />
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-700 dark:text-slate-200"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 🌟 BACKDROP (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 🌟 SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-white dark:bg-slate-800
          border-r border-slate-200 dark:border-slate-700 shadow-sm
          flex flex-col
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static
        `}
      >
        {/* SIDEBAR HEADER */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-amber" />
              <h1 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">
                Talentryx AI
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Recruiter Intelligence Platform
            </p>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-700 dark:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 🔁 ROLE SWITCHER (desktop, sidebar header area) */}
        <div className="hidden md:flex px-6 py-3 border-b border-slate-200 dark:border-slate-700">
          <RoleSwitcher />
        </div>

        {/* NAV LINKS */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <SidebarLink closeSidebar={() => setSidebarOpen(false)} url="/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} />
          <SidebarLink closeSidebar={() => setSidebarOpen(false)} url="/dashboard/upload" label="Upload" icon={<Upload className="h-4 w-4" />} />
          <SidebarLink closeSidebar={() => setSidebarOpen(false)} url="/dashboard/history" label="History" icon={<History className="h-4 w-4" />} />
          <SidebarLink closeSidebar={() => setSidebarOpen(false)} url="/dashboard/settings" label="Settings" icon={<Settings className="h-4 w-4" />} />
          <SidebarLink closeSidebar={() => setSidebarOpen(false)} url="/dashboard/billing" label="Billing" icon={<CreditCard className="h-4 w-4" />} />
        </nav>

        {/* THEME BUTTON */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-brand-canvas dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  Light Mode
                </>
              )}
            </button>
          )}
        </div>

        {/* LOGOUT */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <form action="/logout" method="post">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-700 transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 pt-20 md:pt-6">
        {children}
      </main>
    </div>
  );
}

/* ------------------------------ */
/* Sidebar Link Component         */
/* ------------------------------ */

function SidebarLink({
  url,
  label,
  icon,
  closeSidebar,
}: {
  url: string;
  label: string;
  icon: any;
  closeSidebar: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === url;

  return (
    <Link
      href={url}
      onClick={() => closeSidebar()}
      className={`
        flex items-center gap-3 px-4 py-2 text-sm font-medium transition
        ${
          active
            ? "bg-brand-amber/10 text-brand-amber border-l-2 border-brand-amber rounded-r-md dark:bg-brand-amber/20 dark:text-brand-amber-light dark:border-brand-amber-light"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md"
        }
      `}
    >
      {icon}
      {label}
    </Link>
  );
}
