import { clearLocalAuthAction, signInAction, signUpAction } from "@/lib/auth-actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

function translateAuthError(error?: string) {
  if (!error) return null;

  const decoded = decodeURIComponent(error);
  const map: Record<string, string> = {
    "supabase-not-configured": "请先配置 Supabase 环境变量。",
    "Email not confirmed": "邮箱还没有确认，请先到邮箱里点击确认链接后再登录。",
    "Invalid login credentials": "邮箱或密码不正确，请检查后重试。",
    "email rate limit exceeded": "邮箱发送频率已达到上限，请稍后再试。",
    "User already registered": "这个邮箱已经注册过，请直接登录。",
  };

  return map[decoded] ?? decoded;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const error = translateAuthError(params.error);

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#eef3fb] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative flex items-center justify-center overflow-hidden px-6 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_78%_20%,rgba(124,58,237,0.18),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#edf4ff_52%,#e9ecff_100%)]" />
        <div className="relative w-full max-w-xl">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-400 text-sm font-bold text-slate-950 shadow-lg shadow-blue-950/10">
              S
            </div>
            <div>
              <p className="font-bold text-slate-950">Second AI</p>
              <p className="text-sm text-slate-500">Privacy-first AI workspace</p>
            </div>
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Askable AI Portfolio
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            生成一个受控访问的 AI 作品主页
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
            上传 PRD、原型说明、简历和作品资料，让访客通过 AI 了解你。资料默认私密，下载必须申请。
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["默认私密", "邀请访问", "相关资料"].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/80 bg-white/72 p-4 text-sm font-semibold text-slate-700 shadow-[0_18px_55px_rgba(30,41,59,0.08)] backdrop-blur-xl"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white/72 px-6 py-10 backdrop-blur-xl">
        <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(30,41,59,0.12)] backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-slate-950">登录 Workspace</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            第二阶段已接入 Supabase Auth。注册或登录后会自动创建一组 Second AI mock data。
          </p>

          {!configured ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              请在 `.env.local` 配置 `NEXT_PUBLIC_SUPABASE_URL` 和
              `NEXT_PUBLIC_SUPABASE_ANON_KEY` 后重启开发服务。
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
              {error}
            </div>
          ) : null}

          {params.message ? (
            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-700">
              {params.message}
            </div>
          ) : null}

          <form className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">邮箱</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                placeholder="输入你的邮箱"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">密码</span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                placeholder="输入密码"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                formAction={signInAction}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 text-sm font-semibold text-white shadow-lg shadow-slate-900/12 disabled:opacity-50"
                disabled={!configured}
              >
                登录
              </button>
              <button
                formAction={signUpAction}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white text-sm font-semibold text-slate-700 disabled:opacity-50"
                disabled={!configured}
              >
                注册
              </button>
            </div>
          </form>

          <form action={clearLocalAuthAction} className="mt-4">
            <button
              className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800"
              type="submit"
            >
              Chrome 登不上？清理当前浏览器登录缓存
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            本阶段只接入 Auth 和基础数据库，不接 OpenAI、不做真实上传。
          </p>
        </div>
      </section>
    </main>
  );
}
