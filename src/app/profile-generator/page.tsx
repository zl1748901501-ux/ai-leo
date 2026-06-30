import { AppShell } from "@/components/AppShell";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { visibilityLabel } from "@/lib/db-types";
import { getOwnerProfileData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function ProfileGeneratorPage() {
  const { profile, assets, userEmail } = await getOwnerProfileData();

  return (
    <AppShell userEmail={userEmail}>
      <PageHeader
        eyebrow="AI Profile Generator"
        title="AI 主页生成"
        description="配置访客看到的身份信息、推荐问题和可用于展示的资料。第二阶段从 Supabase profiles 和 assets 读取数据。"
        action={<ButtonLink href="/visitor/isabella">预览访客主页</ButtonLink>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-slate-950">主页基础信息</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">显示名称</span>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                  defaultValue="Isabella"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">主页地址</span>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                  defaultValue="second.ai/isabella"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">身份说明</span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                defaultValue={profile?.identity ?? ""}
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">个人简介</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200/80 bg-white/80 p-3 text-sm leading-6 outline-none focus:border-blue-300"
                defaultValue={profile?.bio ?? ""}
              />
            </label>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-slate-950">推荐问题</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(profile?.recommended_questions ?? []).map((question) => (
                <input
                  key={question}
                  className="h-11 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm outline-none focus:border-blue-300"
                  defaultValue={question}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-950">主页状态</h2>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">受控邀请模式</span>
                <Badge tone="blue">默认</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                访客必须登录并拥有邀请权限。默认不允许搜索引擎收录。
              </p>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">公开访问</span>
                <span className="text-xs text-slate-400">关闭</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                后续可手动开启，但公开资料仍受权限控制。
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-950">可展示资料</h2>
            <div className="mt-4 space-y-3">
              {assets
                .filter((asset) => asset.visibility !== "private")
                .map((asset) => (
                  <div key={asset.id} className="rounded-2xl border border-slate-200/80 bg-white/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {asset.ai_title ?? asset.file_name}
                      </p>
                      <span className="shrink-0 text-xs text-slate-500">
                        {visibilityLabel(asset.visibility)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {asset.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
