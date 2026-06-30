"use client";

import Link from "next/link";

function readableError(error: Error & { digest?: string }) {
  const message = error.message || "未知错误";

  if (message.includes("bucket") || message.includes("storage")) {
    return "Supabase Storage 的 assets bucket 或访问策略还没有配置完整。请重新执行 supabase/schema.sql 里的 Storage 部分。";
  }

  if (message.includes("row-level security") || message.includes("permission denied")) {
    return "Supabase 权限策略拦截了当前操作。请确认 schema.sql 已完整执行，并且当前账号已登录。";
  }

  if (message.includes("relation") || message.includes("does not exist")) {
    return "Supabase 数据表还没有创建完整。请先在 SQL Editor 执行 supabase/schema.sql。";
  }

  return message;
}

export default function UploadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef3fb] px-5">
      <section className="w-full max-w-xl rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(30,41,59,0.12)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
          Upload Error
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">上传中心加载失败</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">{readableError(error)}</p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
          建议检查：Supabase SQL Editor 是否完整执行了
          <br />
          <span className="font-semibold text-slate-700">supabase/schema.sql</span>
          <br />
          尤其是 Storage bucket: <span className="font-semibold">assets</span> 和 storage.objects
          policies。
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            重试
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            返回工作台
          </Link>
        </div>
      </section>
    </main>
  );
}
