import Link from "next/link";
import { notFound } from "next/navigation";
import { analyzeAssetAction } from "@/lib/ai-analysis-actions";
import { updateAssetVisibilityAction } from "@/lib/asset-actions";
import { AppShell } from "@/components/AppShell";
import { AssetIcon, Badge, Card, PageHeader } from "@/components/ui";
import { VisibilitySelector } from "@/components/VisibilitySelector";
import { analysisStatusLabel, isCompletedStatus, visibilityLabel } from "@/lib/db-types";
import { getOwnerAssetById } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

function isImage(type: string) {
  return ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(type.toLowerCase());
}

function isVideo(type: string) {
  return ["mp4", "mov", "webm"].includes(type.toLowerCase());
}

function isInlineDocument(type: string) {
  return ["pdf", "txt", "md", "markdown"].includes(type.toLowerCase());
}

function AssetPreview({
  fileName,
  fileType,
  assetType,
  previewUrl,
  fileUrl,
  createdAt,
}: {
  fileName: string;
  fileType: string;
  assetType: string | null;
  previewUrl: string | null;
  fileUrl: string | null;
  createdAt: string;
}) {
  const normalizedType = fileType.toLowerCase();

  return (
    <Card className="order-2 min-h-[520px] min-w-0 overflow-hidden bg-gradient-to-br from-white/82 via-blue-50/70 to-violet-50/70 p-0 lg:order-1">
      <div className="flex items-center justify-between border-b border-white/70 bg-white/56 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <AssetIcon type={assetType ?? fileType} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{fileName}</p>
            <p className="mt-1 text-xs text-slate-500">
              {fileType} · {new Date(createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
        </div>
        {previewUrl ? (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
          >
            打开文件
          </a>
        ) : null}
      </div>

      <div className="flex min-h-[460px] items-center justify-center p-5">
        {!previewUrl ? (
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white bg-white/80 shadow-lg shadow-slate-900/8">
              <AssetIcon type={assetType ?? fileType} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">{fileName}</h2>
            <p className="mx-auto mt-4 max-w-md break-all rounded-2xl bg-white/70 p-3 text-xs leading-5 text-slate-500">
              Storage path: {fileUrl ?? "未保存文件路径"}
            </p>
          </div>
        ) : isImage(normalizedType) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={fileName}
            className="max-h-[680px] w-full max-w-full rounded-3xl object-contain shadow-2xl shadow-slate-900/12"
          />
        ) : isVideo(normalizedType) ? (
          <video
            src={previewUrl}
            controls
            className="max-h-[680px] w-full rounded-3xl bg-slate-950 shadow-2xl shadow-slate-900/12"
          />
        ) : isInlineDocument(normalizedType) ? (
          <iframe
            src={previewUrl}
            title={fileName}
            className="h-[680px] w-full rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
          />
        ) : (
          <div className="max-w-lg text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white bg-white/80 shadow-lg shadow-slate-900/8">
              <AssetIcon type={assetType ?? fileType} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">{fileName}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              当前浏览器不能直接内嵌预览这种文档格式。你仍然可以在右侧查看 AI 解析结果，或点击右上角“打开文件”查看原文件。
            </p>
            <p className="mx-auto mt-4 max-w-md break-all rounded-2xl bg-white/70 p-3 text-xs leading-5 text-slate-500">
              Storage path: {fileUrl ?? "未保存文件路径"}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; analyzed?: string; error?: string }>;
}) {
  const { id } = await params;
  const pageParams = await searchParams;
  const { asset, userEmail, previewUrl } = await getOwnerAssetById(id);
  if (!asset) notFound();

  return (
    <AppShell userEmail={userEmail}>
      <Link
        href="/assets"
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/78 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white"
      >
        <span aria-hidden>←</span>
        返回资产库
      </Link>

      <PageHeader
        eyebrow="Asset Detail"
        title={asset.ai_title ?? asset.file_name}
        description="查看已上传文件内容、AI 理解结果，并设置它在访客 AI 主页中的可见范围。"
        action={
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            返回工作台
          </Link>
        }
      />

      {pageParams.saved ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          权限设置已保存。
        </div>
      ) : null}

      {pageParams.analyzed ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          AI 解析已完成，资料理解结果已更新。
        </div>
      ) : null}

      {pageParams.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {decodeURIComponent(pageParams.error)}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)]">
        <AssetPreview
          fileName={asset.file_name}
          fileType={asset.file_type}
          assetType={asset.asset_type}
          previewUrl={previewUrl}
          fileUrl={asset.file_url}
          createdAt={asset.created_at}
        />

        <div className="order-1 min-w-0 space-y-6 lg:order-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">AI 理解结果</h2>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    asset.analysis_status === "failed"
                      ? "red"
                      : isCompletedStatus(asset.analysis_status)
                        ? "green"
                        : "amber"
                  }
                >
                  {analysisStatusLabel(asset.analysis_status)}
                </Badge>
                <form action={analyzeAssetAction}>
                  <input type="hidden" name="assetId" value={asset.id} />
                  <button className="rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                    重新 AI 解析
                  </button>
                </form>
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">AI 标题</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {asset.ai_title ?? asset.file_name}
            </h3>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              一句话摘要
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {asset.one_sentence_summary}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              详细摘要
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {asset.detailed_summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {asset.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-950">可回答问题</h2>
            <div className="mt-4 space-y-3">
              {asset.answerable_questions.map((question) => (
                <div
                  key={question}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm text-slate-700"
                >
                  {question}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-950">作品卡片预览</h2>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-violet-50/70 p-5">
              <p className="text-base font-semibold text-slate-950">
                {asset.ai_title ?? asset.file_name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {asset.asset_type ?? asset.file_type} · {asset.tags.slice(0, 2).join(" / ")}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {asset.one_sentence_summary}
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-950">
              这份资料如何被访客 AI 使用？
            </h2>
            <form action={updateAssetVisibilityAction}>
              <input type="hidden" name="assetId" value={asset.id} />
              <VisibilitySelector current={asset.visibility} />
              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-4 py-2.5 text-sm font-semibold text-white">
                  保存设置
                </button>
                <span className="text-xs text-slate-500">
                  当前权限：{visibilityLabel(asset.visibility)}
                </span>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
