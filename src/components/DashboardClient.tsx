"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AssetRecord, InvitationRecord, Profile } from "@/lib/db-types";
import { analysisStatusLabel, isCompletedStatus, visibilityLabel } from "@/lib/db-types";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";

const downloadRequests = [
  {
    requester: "hr@company.com",
    asset: "个人简历",
    reason: "用于 AI 产品经理岗位初筛",
    status: "待审批",
  },
  {
    requester: "mentor@example.com",
    asset: "Second AI 产品 PRD",
    reason: "查看产品拆解深度并给出建议",
    status: "已同意",
  },
];

export function DashboardClient({
  assets,
  invitations,
  profile,
}: {
  assets: AssetRecord[];
  invitations: InvitationRecord[];
  profile: Profile | null;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredAssets = useMemo(() => {
    if (!normalizedQuery) return assets;
    return assets.filter((asset) => {
      const text = [
        asset.ai_title,
        asset.file_name,
        asset.file_type,
        asset.asset_type,
        asset.analysis_status,
        asset.visibility,
        asset.one_sentence_summary,
        asset.detailed_summary,
        ...asset.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [assets, normalizedQuery]);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Second AI 工作台"
        description="集中管理资料上传、AI 解析、资产权限、邀请访问和下载申请。第二阶段已接入 Supabase Auth 和基础数据库。"
        action={
          <>
            <ButtonLink href="/upload">上传资料</ButtonLink>
            <ButtonLink href="/visitor/isabella" variant="secondary">
              预览主页
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          [String(assets.length), "已上传资料", "资料池"],
          [String(assets.filter((asset) => isCompletedStatus(asset.analysis_status)).length), "AI 已解析", "可被问答"],
          [profile?.is_active ? "已启用" : "草稿", "AI 主页状态", "受控访问"],
          [String(invitations.length), "邀请记录", "访问可控"],
        ].map(([value, label, meta]) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-semibold text-slate-950">{value}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{label}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                {meta}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Next Step
            </p>
            <h2 className="mt-2 text-2xl font-semibold">继续完善你的 AI 作品主页</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              新增资料会进入解析队列，生成摘要、标签、推荐问题和相关资料卡片，最终用于访客 AI 问答。
            </p>
          </div>
          <div className="flex gap-3">
            <ButtonLink href="/profile-generator" variant="secondary">
              配置 AI 主页
            </ButtonLink>
            <ButtonLink href="/share">邀请访客</ButtonLink>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">资料查找</h2>
              <p className="mt-1 text-sm text-slate-500">
                Owner 端快速定位已上传资料，第一版使用前端 mock filter。
              </p>
            </div>
            <Badge tone="blue">
              {filteredAssets.length} / {assets.length} 份资料
            </Badge>
          </div>

          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm">
            <span className="text-sm text-slate-400">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="搜索你的项目、作品、经历或授权资料"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-200"
              >
                清空
              </button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="subtle-light-scrollbar max-h-[420px] overflow-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3">文件标题</th>
                    <th className="px-4 py-3">类型</th>
                    <th className="px-4 py-3">标签</th>
                    <th className="px-4 py-3">AI 解析状态</th>
                    <th className="px-4 py-3">权限状态</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="transition hover:bg-blue-50/30">
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {asset.ai_title ?? asset.file_name}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {asset.asset_type ?? asset.file_type}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {asset.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={isCompletedStatus(asset.analysis_status) ? "green" : "amber"}>
                          {analysisStatusLabel(asset.analysis_status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {visibilityLabel(asset.visibility)}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          className="font-semibold text-blue-700 underline underline-offset-4"
                          href={`/assets/${asset.id}`}
                        >
                          查看
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAssets.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                没有找到匹配资料。可以换一个关键词试试。
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-950">下载申请</h2>
            <div className="mt-4 space-y-3">
              {downloadRequests.map((request) => (
                <div
                  key={request.requester}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{request.asset}</p>
                    <Badge tone={request.status === "待审批" ? "amber" : "green"}>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {request.requester} · {request.reason}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-950">隐私边界</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              访客 AI 只会使用已授权资料。私密资料不会被读取、引用或展示。
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
