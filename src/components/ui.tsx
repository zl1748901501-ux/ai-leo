import Link from "next/link";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    slate: "border-slate-200/80 bg-white/70 text-slate-600",
    blue: "border-blue-200/80 bg-blue-50/80 text-blue-700",
    green: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
    amber: "border-amber-200/80 bg-amber-50/80 text-amber-700",
    red: "border-rose-200/80 bg-rose-50/80 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const cls =
    variant === "primary"
      ? "bg-gradient-to-r from-slate-950 to-indigo-950 text-white shadow-lg shadow-slate-900/12 hover:from-slate-800 hover:to-indigo-800"
      : "border border-slate-200/80 bg-white/78 text-slate-700 hover:bg-white";

  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${cls}`}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-white/70 bg-white/76 p-5 shadow-[0_18px_55px_rgba(30,41,59,0.08)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 overflow-hidden rounded-[32px] border border-white/70 bg-white/68 p-6 shadow-[0_20px_70px_rgba(30,41,59,0.08)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function AssetIcon({ type }: { type: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 text-xs font-bold text-slate-700">
      {type}
    </div>
  );
}
