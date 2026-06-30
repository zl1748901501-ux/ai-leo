import Link from "next/link";
import { UploadDropzone } from "@/components/UploadDropzone";
import { AppShell } from "@/components/AppShell";
import { AssetIcon, Badge, Card, PageHeader } from "@/components/ui";
import { analysisStatusLabel, isCompletedStatus } from "@/lib/db-types";
import { getOwnerAssets } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

function uploadErrorMessage(error?: string) {
  if (!error) return null;
  const decoded = decodeURIComponent(error);
  if (decoded === "no-file") return "请选择一个文件后再上传。";
  if (decoded.toLowerCase().includes("body exceeded")) {
    return "文件太大，当前阶段建议上传 25MB 以内的文件。";
  }
  if (decoded.toLowerCase().includes("bucket")) {
    return "上传失败：请确认 Supabase Storage 里有 assets bucket，并且已执行 supabase/schema.sql 里的 storage policy。";
  }
  if (decoded.toLowerCase().includes("storage 上传失败")) {
    return `${decoded}。请确认 Supabase Storage 使用 assets bucket，且 authenticated 用户可以上传到 自己的用户ID/ 文件夹。`;
  }
  return decoded;
}

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { assets, userEmail } = await getOwnerAssets();
  const error = uploadErrorMessage(params.error);

  return (
    <AppShell userEmail={userEmail}>
      <PageHeader
        eyebrow="Upload Center"
        title="上传中心"
        description="选择文件后上传到 Supabase Storage，并在 assets 表创建真实记录。AI 解析结果暂时使用 mock 数据生成。"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="min-h-[380px]">
          <UploadDropzone />

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex gap-3">
            <input
              className="h-11 flex-1 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm outline-none focus:border-blue-300"
              placeholder="网页链接上传会在后续阶段接入"
              disabled
            />
            <button
              className="rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-400"
              disabled
            >
              添加链接
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">AI 解析流程</h2>
          <div className="mt-5 space-y-4">
            {[
              "上传到 Supabase Storage",
              "写入 assets 数据表",
              "生成 mock 标题、摘要和标签",
              "生成可回答问题和资料卡片",
              "状态标记为解析完成",
            ].map((step, index) => (
              <div key={step} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-bold text-white">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">上传队列</h2>
          <Badge tone="blue">{assets.length} 份资料</Badge>
        </div>
        <div className="mt-4 grid gap-3">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 transition hover:bg-blue-50/40 sm:flex-row sm:items-center"
          >
            <AssetIcon type={asset.asset_type ?? asset.file_type} />
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-950">{asset.file_name}</p>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {asset.one_sentence_summary}
                </p>
              </div>
              <Badge tone={isCompletedStatus(asset.analysis_status) ? "green" : "amber"}>
                {analysisStatusLabel(asset.analysis_status)}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
