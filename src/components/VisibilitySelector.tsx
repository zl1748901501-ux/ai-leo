"use client";

import { useState } from "react";

const visibilityOptions = [
  ["private", "私密", "不读取、引用或展示"],
  ["answer_only", "仅回答", "回答但不展示卡片"],
  ["display", "可展示", "回答并展示作品卡片"],
] as const;

export function VisibilitySelector({ current }: { current: string }) {
  const [selected, setSelected] = useState(current);

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="visibility" value={selected} />
      {visibilityOptions.map(([value, title, desc]) => {
        const isSaved = current === value;
        const isDraft = selected === value && selected !== current;
        const hasUnsavedChange = selected !== current;
        const isPreviousSaved = isSaved && hasUnsavedChange;
        const textClass = isSaved
          ? isPreviousSaved
            ? "text-slate-500"
            : "text-slate-200"
          : isDraft
            ? "text-blue-700/75"
            : "text-slate-500";

        return (
          <button
            type="button"
            key={value}
            onClick={() => setSelected(value)}
            className={`relative cursor-pointer rounded-2xl border p-4 text-center transition duration-200 ${
              isSaved && !hasUnsavedChange
                ? "border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-950/14"
                : isDraft
                  ? "scale-[1.01] border-blue-300 bg-blue-50/85 text-blue-950 shadow-md shadow-blue-900/8"
                  : isPreviousSaved
                    ? "border-slate-300 bg-slate-50/90 text-slate-700"
                    : "border-slate-200/80 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/55"
            }`}
          >
            <span className="block text-sm font-semibold">{title}</span>
            <span className={`mt-2 block text-xs leading-5 ${textClass}`}>
              {desc}
            </span>
            {isDraft ? (
              <span className="mt-3 inline-flex rounded-full border border-blue-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                未保存
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
