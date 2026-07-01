import { AppShell } from "@/components/AppShell";
import { AutoCopyInviteLink } from "@/components/AutoCopyInviteLink";
import { CopyInviteLinkButton } from "@/components/CopyInviteLinkButton";
import { Badge, Card, PageHeader } from "@/components/ui";
import { invitationStatusLabel } from "@/lib/db-types";
import {
  createInvitationAction,
  deleteInvitationAction,
  revokeInvitationAction,
} from "@/lib/invitation-actions";
import { getOwnerInvitationData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

function invitationTone(status: string) {
  if (status === "revoked") return "red";
  if (status === "pending" || status === "expired") return "amber";
  return "green";
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    token?: string;
    revoked?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
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
          {params.error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {decodeURIComponent(params.error)}
            </div>
          ) : null}
          {params.created ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              已为 {decodeURIComponent(params.created)} 生成邀请。
            </div>
          ) : null}
          {params.token ? (
            <AutoCopyInviteLink link={`/visitor/isabella?token=${params.token}`} />
          ) : null}
          {params.revoked ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              邀请已撤销。
            </div>
          ) : null}
          {params.deleted ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              邀请记录已删除。
            </div>
          ) : null}
          <form action={createInvitationAction}>
            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-700">访客邮箱</span>
              <input
                name="visitor_email"
                type="email"
                required
                className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                placeholder="hr@company.com"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">有效期</span>
              <select
                name="duration"
                defaultValue="7"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
              >
                <option value="1">1 天</option>
                <option value="3">3 天</option>
                <option value="7">7 天（默认）</option>
                <option value="30">30 天</option>
                <option value="forever">永久</option>
              </select>
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              访客必须使用被邀请邮箱登录，永久邀请可手动撤销。
            </p>
            <button className="mt-5 w-full rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/12">
              生成邀请链接
            </button>
          </form>
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
                    <th className="px-4 py-3">创建时间</th>
                    <th className="px-4 py-3">有效期</th>
                    <th className="px-4 py-3">邀请链接</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invitations.map((invite) => {
                    const token = invite.token || invite.invite_token;
                    const inviteLink = `/visitor/isabella?token=${token}`;

                    return (
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
                          {new Date(invite.created_at).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {invite.expires_at
                            ? new Date(invite.expires_at).toLocaleDateString("zh-CN")
                            : "永久"}
                        </td>
                        <td className="px-4 py-4">
                          {token ? (
                            <div className="max-w-[220px] truncate text-xs text-slate-500">
                              {inviteLink}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">旧邀请无 token</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {token ? <CopyInviteLinkButton link={inviteLink} /> : null}
                            {invite.status !== "revoked" ? (
                              <form action={revokeInvitationAction}>
                                <input type="hidden" name="invitation_id" value={invite.id} />
                                <button className="font-semibold text-rose-700 underline underline-offset-4">
                                  撤销
                                </button>
                              </form>
                            ) : null}
                            <form action={deleteInvitationAction}>
                              <input type="hidden" name="invitation_id" value={invite.id} />
                              <button
                                className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                title="删除邀请记录"
                              >
                                删除
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
