import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { visibilityLabel } from "@/lib/db-types";
import { getOwnerProfileData } from "@/lib/owner-data";
import { updateProfileAction } from "@/lib/profile-actions";

export const dynamic = "force-dynamic";

const fallbackQuestions = [
  "你可以介绍一下自己吗？",
  "有哪些项目或作品可以展示？",
  "哪些资料能证明你的能力？",
  "你的经历和优势是什么？",
];

export default async function ProfileGeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { profile, assets, userEmail } = await getOwnerProfileData();
  const questions =
    profile?.recommended_questions && profile.recommended_questions.length > 0
      ? profile.recommended_questions
      : fallbackQuestions;
  const publicAssets = assets.filter((asset) => asset.visibility !== "private");

  return (
    <AppShell userEmail={userEmail}>
      <PageHeader
        eyebrow="AI Profile Generator"
        title="AI 主页生成"
        description="配置访客看到的身份信息、推荐问题和可用于回答或展示的资料。保存后，访客预览页会同步更新。"
        action={<ButtonLink href="/visitor/isabella">预览访客主页</ButtonLink>}
      />

      {params.saved ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          AI 主页基础信息已保存。
        </div>
      ) : null}
      {params.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          保存失败：{decodeURIComponent(params.error)}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <form action={updateProfileAction} className="space-y-6">
          <input type="hidden" name="profileId" value={profile?.id ?? ""} />

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">主页基础信息</h2>
                <p className="mt-1 text-sm text-slate-500">
                  这些内容会出现在访客 AI Portfolio 右侧资料区和对话标题下方。
                </p>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
              >
                保存修改
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">显示名称</span>
                <input
                  name="title"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                  defaultValue={profile?.title ?? "Isabella"}
                  placeholder="例如 Isabella"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">主页地址</span>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 text-slate-500 outline-none"
                  defaultValue="second.ai/isabella"
                  disabled
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">身份说明</span>
              <input
                name="identity"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                defaultValue={profile?.identity ?? "26届数字媒体艺术应届生 · AI 产品经理候选人 · Second AI 项目创建者"}
                placeholder="例如 AI 产品经理候选人 / Second AI 项目创建者"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">个人简介</span>
              <textarea
                name="bio"
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200/80 bg-white/80 p-3 text-sm leading-6 outline-none focus:border-blue-300"
                defaultValue={
                  profile?.bio ??
                  "从数字媒体创作者出发，探索 AI 产品如何重新组织个人作品与能力表达。"
                }
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">访客引导文案</span>
              <textarea
                name="visitor_intro"
                className="mt-2 min-h-20 w-full rounded-xl border border-slate-200/80 bg-white/80 p-3 text-sm leading-6 outline-none focus:border-blue-300"
                defaultValue={
                  profile?.visitor_intro ??
                  "通过 AI 对话了解资料主人的项目、作品与能力证据。"
                }
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">能力标签</span>
              <input
                name="ability_tags"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                defaultValue={(profile?.ability_tags ?? ["AI 产品设计", "原型设计", "视觉表达"]).join("、")}
                placeholder="用顿号或逗号分隔，例如 AI 产品设计、原型设计"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">隐私提示</span>
              <input
                name="privacy_notice"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 outline-none focus:border-blue-300"
                defaultValue={
                  profile?.privacy_notice ??
                  "AI 只读取授权资料，未授权内容不会进入回答。"
                }
              />
            </label>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-slate-950">推荐问题</h2>
            <p className="mt-1 text-sm text-slate-500">
              访客进入页面后会看到这些快捷问题，最多展示 4-6 个。
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  name={`question_${index + 1}`}
                  className="h-11 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm outline-none focus:border-blue-300"
                  defaultValue={questions[index] ?? ""}
                  placeholder={`推荐问题 ${index + 1}`}
                />
              ))}
            </div>
          </Card>
        </form>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-950">主页状态</h2>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">受控邀请模式</span>
                <Badge tone="blue">默认</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                访客必须登录并获得邀请权限。资料默认私密，不会被搜索引擎收录。
              </p>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">公开访问</span>
                <span className="text-xs text-slate-400">关闭</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                后续可手动开启；当前版本优先使用邀请链接控制访问。
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">访客可用资料</h2>
              <Link href="/assets" className="text-sm font-semibold text-blue-700">
                管理资产
              </Link>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              私密资料不会出现在访客侧；仅回答可被 AI 使用，可展示可打开并下载。
            </p>
            <div className="mt-4 space-y-3">
              {publicAssets.length > 0 ? (
                publicAssets.map((asset) => (
                  <div key={asset.id} className="rounded-2xl border border-slate-200/80 bg-white/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {asset.ai_title ?? asset.file_name}
                      </p>
                      <span className="shrink-0 text-xs text-slate-500">
                        {visibilityLabel(asset.visibility)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                      {asset.one_sentence_summary ?? asset.file_name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {asset.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
                  还没有设置可给访客使用的资料。去资产详情里把权限改为“仅回答”或“可展示”。
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
