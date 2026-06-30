"use client";

import { useRef, useState } from "react";
import { uploadAssetAction } from "@/lib/asset-actions";

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function syncFileName() {
    const file = inputRef.current?.files?.[0];
    setFileName(file?.name ?? "");
  }

  function assignFiles(files: FileList) {
    if (!inputRef.current || files.length === 0) return;

    const transfer = new DataTransfer();
    Array.from(files).forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
    syncFileName();
  }

  return (
    <form
      action={uploadAssetAction}
      className="space-y-5"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        assignFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        name="file"
        type="file"
        required
        className="sr-only"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.md,.txt,.png,.jpg,.jpeg,.webp,.mp4,.mov"
        onChange={syncFileName}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          assignFiles(event.dataTransfer.files);
        }}
        className={`flex min-h-72 w-full cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed p-6 text-center transition ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/80 hover:border-blue-300 hover:bg-blue-50/70"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-bold text-white shadow-lg shadow-slate-900/15 transition hover:scale-105">
          +
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          点击加号选择文件，或直接拖拽到这里
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          支持 PDF、Word、PPT、Markdown、TXT、图片和视频。上传后会立即生成 mock AI 解析结果。
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm text-slate-600">
          {fileName || "尚未选择文件"}
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/12 transition hover:-translate-y-0.5"
      >
        上传并生成 mock 解析
      </button>
    </form>
  );
}
