import { AppShell } from "@/components/AppShell";
import { Badge, Card, PageHeader } from "@/components/ui";
import { invitationStatusLabel } from "@/lib/db-types";
import { getOwnerInvitationData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

function invitationTone(status: string) {
  if (status === "revoked") return "red";
  if (status === "pending") return "amber";
  return "green";
}

export default async function SharePage() {
  const { invitations, userEmail } = await getOwnerInvitationData();

  return (
    <AppShell userEmail={userEmail}>
      <PageHeader
        eyebrow="Share Permissions"
        title="访问权限"
        description="生成受控邀请并绑定访客账号。访客无法二次分享链接，未被邀请的账号无法访问 AI 主页。"
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="text-xl font-semibold text-slate-950">邀请访客</h2>
          <label className="mt-5 block">
            <span className="text-sm font-medium text-slate-700">访客邮箱</span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
              placeholder="hr@company.com"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">有效期</span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
              defaultValue="2026-07-15"
            />
          </label>
          <button className="mt-5 w-full rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/12">
            生成邀请链接
          </button>
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-slate-600">
            https://second.ai/invite/hr-company-8291
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-slate-950">访问校验说明</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["登录校验", "访客必须登录后才能进入 AI 主页。"],
                ["账号绑定", "邀请绑定邮箱和访客账号，转发链接无效。"],
                ["随时撤销", "资料主人可以撤销访问或调整有效期。"],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                  <p className="font-semibold text-slate-950">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-slate-950">邀请列表</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">访客邮箱</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">有效期</th>
                    <th className="px-4 py-3">最近访问</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invitations.map((invite) => (
                    <tr key={invite.id} className="transition hover:bg-blue-50/30">
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {invite.visitor_email}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={invitationTone(invite.status)}>
                          {invitationStatusLabel(invite.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {invite.expires_at
                          ? new Date(invite.expires_at).toLocaleDateString("zh-CN")
                          : "未设置"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {invite.last_access_at
                          ? new Date(invite.last_access_at).toLocaleString("zh-CN")
                          : "未访问"}
                      </td>
                      <td className="px-4 py-4">
                        <button className="font-semibold text-blue-700 underline underline-offset-4">
                          撤销
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
