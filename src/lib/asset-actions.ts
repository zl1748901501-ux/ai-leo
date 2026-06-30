"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./owner-data";

const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET || "assets";

function getExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
}

function inferFileType(fileName: string) {
  const ext = getExtension(fileName);
  const map: Record<string, string> = {
    pdf: "pdf",
    doc: "doc",
    docx: "docx",
    ppt: "ppt",
    pptx: "pptx",
    md: "md",
    txt: "txt",
    png: "png",
    jpg: "jpg",
    jpeg: "jpg",
    webp: "webp",
    mp4: "mp4",
    mov: "mov",
  };
  return map[ext] ?? (ext || "file");
}

function inferAssetType(fileName: string) {
  const ext = getExtension(fileName);
  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "Word";
  if (["ppt", "pptx"].includes(ext)) return "PPT";
  if (["md", "txt"].includes(ext)) return "文档";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "图片";
  if (["mp4", "mov"].includes(ext)) return "视频";
  return "文件";
}

function displayTitleFromFileName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() || fileName;
}

function safeStorageFileName(fileName: string) {
  const ext = getExtension(fileName);
  const base = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const safeBase = base || `asset-${crypto.randomUUID()}`;
  return `${safeBase}${ext ? `.${ext}` : ""}`;
}

function buildMockAnalysis(fileName: string) {
  const title = displayTitleFromFileName(fileName);
  const assetType = inferAssetType(fileName);

  return {
    ai_title: title,
    asset_type: assetType,
    one_sentence_summary: `这份资料《${title}》已完成 mock AI 解析，可用于资料管理和访客展示判断。`,
    detailed_summary:
      "第三阶段暂不接入 OpenAI，因此系统根据文件名和类型生成模拟解析结果。后续接入真实解析后，这里会展示文档摘要、关键内容、引用片段和可回答问题。",
    tags: ["AI 产品设计", "作品集", "RAG"],
    skills: ["资料整理", "作品表达", "AI Workspace 管理"],
    project_keywords: [title, assetType, "Second AI"],
    answerable_questions: [
      "这份资料说明了什么？",
      "它能证明哪些能力？",
      "它适合展示给访客吗？",
    ],
    card: {
      title,
      type: assetType,
      summary: `上传文件 ${fileName} 的 mock 资料卡片。`,
      proof: "证明资料已进入 Second AI 工作空间，并具备后续 AI 解析与展示的基础结构。",
    },
    source_quotes: [],
  };
}

export async function uploadAssetAction(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/upload?error=no-file");
  }

  const { supabase, user } = await getCurrentUser();
  const originalName = file.name;
  const storagePath = `${user.id}/${Date.now()}-${safeStorageFileName(originalName)}`;
  const fileBuffer = await file.arrayBuffer();
  const contentType = file.type || "application/octet-stream";

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    redirect(`/upload?error=${encodeURIComponent(`Storage 上传失败：${uploadError.message}`)}`);
  }

  const mock = buildMockAnalysis(originalName);
  const { data, error: insertError } = await supabase
    .from("assets")
    .insert({
      owner_id: user.id,
      file_name: originalName,
      file_url: storagePath,
      file_type: inferFileType(originalName),
      raw_text: null,
      ...mock,
      visibility: "private",
      analysis_status: "completed",
    })
    .select("id")
    .single();

  if (insertError) {
    await supabase.storage.from(storageBucket).remove([storagePath]);
    redirect(`/upload?error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/upload");
  revalidatePath(`/assets/${data.id}`);
  redirect(`/assets/${data.id}`);
}

export async function updateAssetVisibilityAction(formData: FormData) {
  const assetId = String(formData.get("assetId") ?? "");
  const visibility = String(formData.get("visibility") ?? "private");
  const allowed = ["private", "answer_only", "display"];

  if (!assetId || !allowed.includes(visibility)) {
    redirect("/dashboard");
  }

  const { supabase, user } = await getCurrentUser();
  const { error } = await supabase
    .from("assets")
    .update({
      visibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile-generator");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}?saved=1`);
}
