"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createUploadedAssetRecordAction } from "@/lib/asset-actions";
import { createClient } from "@/lib/supabase/client";

const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET || "assets";
const supportedAccept = ".pdf,.doc,.docx,.ppt,.pptx,.md,.txt,.png,.jpg,.jpeg,.webp,.mp4,.mov";

type SelectedUpload = {
  file: File;
  relativePath: string;
};

type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
};

type FileSystemFileEntryLike = FileSystemEntryLike & {
  file: (success: (file: File) => void, error?: (error: DOMException) => void) => void;
};

type FileSystemDirectoryReaderLike = {
  readEntries: (
    success: (entries: FileSystemEntryLike[]) => void,
    error?: (error: DOMException) => void,
  ) => void;
};

type FileSystemDirectoryEntryLike = FileSystemEntryLike & {
  createReader: () => FileSystemDirectoryReaderLike;
};

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

function getExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
}

function safeSegment(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || `asset-${crypto.randomUUID()}`
  );
}

function safeStoragePathName(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  const fileName = parts.pop() || normalized;
  const ext = getExtension(fileName);
  const base = fileName.replace(/\.[^/.]+$/, "");
  const safeFileName = `${safeSegment(base)}${ext ? `.${ext}` : ""}`;
  const safeFolders = parts.map(safeSegment).slice(-4);
  return [...safeFolders, safeFileName].join("/");
}

function getFriendlyError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "上传失败，请稍后重试。";
}

function uniqueUploads(files: SelectedUpload[]) {
  const seen = new Set<string>();
  return files.filter((item) => {
    const key = `${item.relativePath}-${item.file.size}-${item.file.lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getInputUploads(fileList: FileList | null) {
  if (!fileList) return [];
  return Array.from(fileList).map((file) => {
    const withPath = file as File & { webkitRelativePath?: string };
    return {
      file,
      relativePath: withPath.webkitRelativePath || file.name,
    };
  });
}

function readFileEntry(entry: FileSystemFileEntryLike, pathPrefix: string) {
  return new Promise<SelectedUpload>((resolve, reject) => {
    entry.file(
      (file) => {
        resolve({
          file,
          relativePath: `${pathPrefix}${file.name}`,
        });
      },
      (error) => reject(error),
    );
  });
}

async function readDirectoryEntry(entry: FileSystemDirectoryEntryLike, pathPrefix: string) {
  const reader = entry.createReader();
  const entries: FileSystemEntryLike[] = [];

  while (true) {
    const batch = await new Promise<FileSystemEntryLike[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) break;
    entries.push(...batch);
  }

  const nested = await Promise.all(entries.map((item) => readEntry(item, `${pathPrefix}${entry.name}/`)));
  return nested.flat();
}

async function readEntry(entry: FileSystemEntryLike, pathPrefix = ""): Promise<SelectedUpload[]> {
  if (entry.isFile) {
    return [await readFileEntry(entry as FileSystemFileEntryLike, pathPrefix)];
  }

  if (entry.isDirectory) {
    return readDirectoryEntry(entry as FileSystemDirectoryEntryLike, pathPrefix);
  }

  return [];
}

async function getDropUploads(dataTransfer: DataTransfer) {
  const items = Array.from(dataTransfer.items || []) as DataTransferItemWithEntry[];
  const entries = items.map((item) => item.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntryLike[];

  if (entries.length > 0) {
    const nested = await Promise.all(entries.map((entry) => readEntry(entry)));
    return uniqueUploads(nested.flat());
  }

  return uniqueUploads(getInputUploads(dataTransfer.files));
}

export function UploadDropzone() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<SelectedUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState("");

  function setSelectedFiles(nextUploads: SelectedUpload[]) {
    setUploads(uniqueUploads(nextUploads));
    setUploadedCount(0);
    setError("");
  }

  async function uploadSelectedFiles() {
    if (uploads.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadedCount(0);
    setError("");

    const uploadedStoragePaths: string[] = [];

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("登录状态已失效，请重新登录后再上传。");
      }

      const createdIds: string[] = [];
      const timestamp = Date.now();

      for (let index = 0; index < uploads.length; index += 1) {
        const item = uploads[index];
        const storagePath = `${user.id}/${timestamp}-${index + 1}-${safeStoragePathName(item.relativePath)}`;

        const { error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(storagePath, item.file, {
            contentType: item.file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        uploadedStoragePaths.push(storagePath);

        const result = await createUploadedAssetRecordAction({
          fileName: item.relativePath,
          storagePath,
          contentType: item.file.type,
        });

        createdIds.push(result.id);
        setUploadedCount(index + 1);
      }

      router.push(createdIds.length === 1 ? `/assets/${createdIds[0]}` : `/assets?uploaded=${createdIds.length}`);
      router.refresh();
    } catch (uploadError) {
      if (uploadedStoragePaths.length > 0) {
        const supabase = createClient();
        await supabase.storage.from(storageBucket).remove(uploadedStoragePaths);
      }

      setError(getFriendlyError(uploadError));
      setIsUploading(false);
    }
  }

  return (
    <div
      className="space-y-5"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDrop={async (event) => {
        event.preventDefault();
        setIsDragging(false);
        setSelectedFiles(await getDropUploads(event.dataTransfer));
      }}
    >
      <input
        ref={fileInputRef}
        name="file"
        type="file"
        multiple
        className="sr-only"
        accept={supportedAccept}
        onChange={(event) => setSelectedFiles(getInputUploads(event.currentTarget.files))}
      />
      <input
        ref={(node) => {
          folderInputRef.current = node;
          if (node) {
            node.setAttribute("webkitdirectory", "");
            node.setAttribute("directory", "");
          }
        }}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => setSelectedFiles(getInputUploads(event.currentTarget.files))}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
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
        onDrop={async (event) => {
          event.preventDefault();
          setIsDragging(false);
          setSelectedFiles(await getDropUploads(event.dataTransfer));
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
          点击加号选择文件，或把文件 / 文件夹拖到这里
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          支持 PDF、Word、PPT、Markdown、TXT、图片和视频。文件夹会被拆成多个资料逐个上传。
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            选择文件
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              folderInputRef.current?.click();
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            选择文件夹
          </button>
        </div>
        <div className="mt-5 max-h-28 w-full max-w-2xl overflow-auto rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left text-sm text-slate-600">
          {uploads.length === 0 ? (
            "尚未选择文件"
          ) : (
            <div className="space-y-1">
              <div className="font-semibold text-slate-900">已选择 {uploads.length} 个文件</div>
              {uploads.slice(0, 6).map((item) => (
                <div key={`${item.relativePath}-${item.file.size}`} className="truncate text-slate-500">
                  {item.relativePath}
                </div>
              ))}
              {uploads.length > 6 ? <div className="text-slate-400">还有 {uploads.length - 6} 个文件...</div> : null}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
          上传失败：{error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={uploadSelectedFiles}
        disabled={uploads.length === 0 || isUploading}
        className="w-full rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/12 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? `上传中 ${uploadedCount}/${uploads.length}` : "上传并生成 AI 解析"}
      </button>
    </div>
  );
}
