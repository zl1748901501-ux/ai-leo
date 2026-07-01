"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { analyzeAssetsAction } from "@/lib/ai-analysis-actions";
import { deleteAssetAction, deleteAssetsAction } from "@/lib/asset-actions";
import type { AssetRecord } from "@/lib/db-types";
import { analysisStatusLabel, isCompletedStatus, visibilityLabel } from "@/lib/db-types";
import { AssetIcon, Badge } from "./ui";

export function AssetsTable({ assets }: { assets: AssetRecord[] }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredAssets = useMemo(() => {
    if (!normalizedQuery) return assets;

    return assets.filter((asset) => {
      const text = [
        asset.ai_title,
        asset.file_name,
        asset.file_type,
        asset.asset_type,
        asset.one_sentence_summary,
        asset.detailed_summary,
        asset.visibility,
        asset.analysis_status,
        ...asset.tags,
        ...asset.skills,
        ...asset.project_keywords,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(normalizedQuery);
    });
  }, [assets, normalizedQuery]);

  const filteredIds = filteredAssets.map((asset) => asset.id);
  const selectedSet = new Set(selectedIds);
  const visibleSelectedCount = filteredIds.filter((id) => selectedSet.has(id)).length;
  const allVisibleSelected = filteredIds.length > 0 && visibleSelectedCount === filteredIds.length;

  function toggleAsset(assetId: string) {
    setSelectedIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId],
    );
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const currentSet = new Set(current);
      if (allVisibleSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }

      filteredIds.forEach((id) => currentSet.add(id));
      return Array.from(currentSet);
    });
  }

  function selectedHiddenInputs() {
    return selectedIds.map((id) => <input key={id} type="hidden" name="assetIds" value={id} />);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/78 p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-400">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-8 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="搜索资产标题、文件名、标签、类型或能力"
            />
          </div>
          <Badge tone="blue">
            {filteredAssets.length} / {assets.length} 份资料
          </Badge>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-slate-50/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-slate-600">
            已选择 <span className="font-semibold text-slate-950">{selectedIds.length}</span> 份资料
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleAllVisible}
              disabled={filteredAssets.length === 0}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allVisibleSelected ? "取消当前页选择" : "一键选择当前结果"}
            </button>
            <form action={analyzeAssetsAction}>
              {selectedHiddenInputs()}
              <button
                disabled={selectedIds.length === 0}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                批量重新解析
              </button>
            </form>
            <form action={deleteAssetsAction}>
              {selectedHiddenInputs()}
              <button
                disabled={selectedIds.length === 0}
                onClick={(event) => {
                  if (!confirm(`确定删除选中的 ${selectedIds.length} 份资料吗？此操作不可恢复。`)) {
                    event.preventDefault();
                  }
                }}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                批量删除
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="subtle-light-scrollbar overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="选择当前搜索结果"
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                </th>
                <th className="px-4 py-3">文件标题</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">标签</th>
                <th className="px-4 py-3">AI 状态</th>
                <th className="px-4 py-3">权限</th>
                <th className="px-4 py-3">创建时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className={`transition ${
                    selectedSet.has(asset.id) ? "bg-blue-50/70" : "hover:bg-blue-50/30"
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(asset.id)}
                      onChange={() => toggleAsset(asset.id)}
                      aria-label={`选择 ${asset.ai_title ?? asset.file_name}`}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <AssetIcon type={asset.asset_type ?? asset.file_type} />
                      <div className="min-w-0">
                        <p className="max-w-[280px] truncate font-semibold text-slate-950">
                          {asset.ai_title ?? asset.file_name}
                        </p>
                        <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500">
                          {asset.file_name}
                        </p>
                      </div>
                    </div>
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
                  <td className="px-4 py-4 text-slate-600">
                    {new Date(asset.created_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        className="font-semibold text-blue-700 underline underline-offset-4"
                        href={`/assets/${asset.id}`}
                      >
                        查看
                      </Link>
                      <form action={deleteAssetAction}>
                        <input type="hidden" name="assetId" value={asset.id} />
                        <button
                          className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          title="删除资产"
                          onClick={(event) => {
                            if (!confirm("确定删除这份资料吗？此操作不可恢复。")) {
                              event.preventDefault();
                            }
                          }}
                        >
                          删除
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAssets.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            没有找到匹配资产。
          </div>
        ) : null}
      </div>
    </>
  );
}
