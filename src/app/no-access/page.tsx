import Link from "next/link";

export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3fb] px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(124,58,237,0.16),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#edf4ff_52%,#e9ecff_100%)]" />
      <section className="relative w-full max-w-lg rounded-[32px] border border-white/80 bg-white/78 p-10 text-center shadow-[0_24px_80px_rgba(30,41,59,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 text-2xl font-bold text-white">
          !
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
          你没有访问此 AI 主页的权限
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {reason
            ? decodeURIComponent(reason)
            : "你没有访问权限或邀请已失效。"}
          请确认你已使用被邀请的账号登录，或联系资料主人重新发送邀请。
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            返回登录
          </Link>
          <Link
            href="/visitor/isabella"
            className="rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            查看访客预览
          </Link>
        </div>
      </section>
    </main>
  );
}
