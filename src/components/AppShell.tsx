"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/lib/auth-actions";

const nav = [
  { href: "/dashboard", label: "Workspace" },
  { href: "/upload", label: "上传中心" },
  { href: "/assets/1", label: "资产详情" },
  { href: "/profile-generator", label: "AI 主页" },
  { href: "/share", label: "访问权限" },
  { href: "/visitor/isabella", label: "访客预览" },
  { href: "/no-access", label: "无权限页" },
];

export function AppShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#eef3fb] text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(124,58,237,0.14),transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef3fb_42%,#e9eef8_100%)]" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/70 bg-[#10182c] px-4 py-5 text-white shadow-[18px_0_60px_rgba(15,23,42,0.16)] lg:block">
        <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/20">
            S
          </div>
          <div>
            <p className="text-sm font-bold">Second AI</p>
            <p className="text-xs text-slate-400">Private AI Workspace</p>
          </div>
        </Link>

        <nav className="space-y-1">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href.startsWith("/assets") && pathname.startsWith("/assets"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-white">阶段二基础版</p>
            <span className="rounded-full bg-cyan-300/14 px-2 py-1 text-[11px] text-cyan-100">
              Auth + DB
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-400">
            已接入 Supabase Auth 和基础数据表，AI 解析、RAG、真实上传仍保持 mock。
          </p>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/72 backdrop-blur-2xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:h-16 lg:flex-nowrap lg:px-8 lg:py-0">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                S
              </div>
              <span className="text-sm font-bold text-slate-950">Second AI</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-900">
                受控访问 AI 主页生成器
              </p>
              <p className="text-xs text-slate-500">
                资料默认私密，回答必须基于授权内容
              </p>
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="hidden rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700 sm:inline-flex">
                Supabase
              </span>
              {userEmail ? (
                <span className="hidden max-w-[220px] truncate text-xs text-slate-500 md:inline">
                  {userEmail}
                </span>
              ) : null}
              <form action={signOutAction}>
                <button className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white">
                  登出
                </button>
              </form>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                I
              </div>
            </div>
          </div>
          <nav className="subtle-light-scrollbar flex gap-2 overflow-x-auto border-t border-white/70 px-4 py-2 lg:hidden">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href.startsWith("/assets") && pathname.startsWith("/assets"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-slate-950 text-white shadow-sm"
                      : "border border-slate-200/80 bg-white/70 text-slate-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
