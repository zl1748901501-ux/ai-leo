"use client";

import { useEffect, useState } from "react";
import { copyText } from "@/lib/client-copy";
import { CopyInviteLinkButton } from "./CopyInviteLinkButton";

export function AutoCopyInviteLink({ link }: { link: string }) {
  const [status, setStatus] = useState<"copied" | "failed" | "pending">("pending");

  useEffect(() => {
    const absoluteLink = new URL(link, window.location.origin).toString();
    copyText(absoluteLink)
      .then(() => setStatus("copied"))
      .catch(() => setStatus("failed"));
  }, [link]);

  return (
    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">
        {status === "copied"
          ? "邀请链接已自动复制"
          : status === "failed"
            ? "浏览器拦截了自动复制，请点再次复制"
            : "正在复制邀请链接..."}
      </p>
      <p className="mt-2 break-all text-xs leading-5 text-slate-500">{link}</p>
      <div className="mt-3">
        <CopyInviteLinkButton link={link} label="再次复制" />
      </div>
    </div>
  );
}
