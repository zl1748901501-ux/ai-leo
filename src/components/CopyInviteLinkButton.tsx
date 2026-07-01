"use client";

import { useState } from "react";
import { copyText } from "@/lib/client-copy";

export function CopyInviteLinkButton({
  link,
  label = "复制链接",
}: {
  link: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      const absoluteLink = new URL(link, window.location.origin).toString();
      await copyText(absoluteLink);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }

    window.setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        className="font-semibold text-blue-700 underline underline-offset-4"
      >
        {status === "copied" ? "已复制" : label}
      </button>
      {status !== "idle" ? (
        <span
          className={`absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold shadow-lg ${
            status === "copied"
              ? "bg-slate-950 text-white"
              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          }`}
        >
          {status === "copied" ? "链接已复制" : "复制失败，请手动复制"}
        </span>
      ) : null}
    </span>
  );
}
