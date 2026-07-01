import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AssetsTable } from "@/components/AssetsTable";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getOwnerAssets } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string; reanalyzed?: string; failed?: string; uploaded?: string }>;
}) {
  const params = await searchParams;
  const { assets, userEmail } = await getOwnerAssets();

  return (
    <AppShell userEmail={userEmail}>
      <PageHeader
        eyebrow="Asset Library"
        title="资产库"
        description="查看全部已上传和已写入的资料资产。支持搜索、多选、批量删除和批量重新 AI 解析。"
        action={
          <Link className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" href="/upload">
            上传资料
          </Link>
        }
      />

      {params.uploaded ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          已上传 {params.uploaded} 份资料。
        </div>
      ) : null}
      {params.deleted ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          已删除 {params.deleted === "1" ? "选中的" : params.deleted} 份资料。
        </div>
      ) : null}
      {params.reanalyzed ? (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          已重新解析 {params.reanalyzed} 份资料
          {params.failed && params.failed !== "0" ? `，${params.failed} 份解析失败` : ""}。
        </div>
      ) : null}
      {params.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">全部资产</h2>
          <Badge tone="blue">{assets.length} 份资料</Badge>
        </div>

        <AssetsTable assets={assets} />
      </Card>
    </AppShell>
  );
}
