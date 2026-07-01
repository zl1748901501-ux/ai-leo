import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { AssetRecord } from "./db-types";

const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET || "assets";
const imageExtensions = ["png", "jpg", "jpeg", "webp"];
const textExtensions = ["txt", "md", "markdown", "pdf", "docx", ...imageExtensions];

function extensionFromAsset(asset: AssetRecord) {
  const fileType = asset.file_type?.toLowerCase();
  if (fileType) return fileType;
  const parts = asset.file_name.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
}

async function blobToBuffer(blob: Blob) {
  return Buffer.from(await blob.arrayBuffer());
}

async function extractPdfText(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text || "";
}

async function renderPdfPagesAsImages(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getScreenshot({
      first: 3,
      desiredWidth: 1200,
      imageDataUrl: true,
      imageBuffer: false,
    });

    return result.pages
      .map((page) => page.dataUrl)
      .filter((dataUrl): dataUrl is string => typeof dataUrl === "string" && dataUrl.length > 0);
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 30000);
}

function getAiVisionClient() {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  if (provider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("缺少 DEEPSEEK_API_KEY，无法识别图片或扫描版 PDF。");
    }

    return {
      provider,
      model: process.env.AI_VISION_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      client: new OpenAI({
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      }),
    };
  }

  if (provider !== "openai") {
    throw new Error("AI_PROVIDER 只能设置为 openai 或 deepseek。");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY，无法识别图片或扫描版 PDF。");
  }

  return {
    provider,
    model: process.env.AI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
    client: new OpenAI({ apiKey }),
  };
}

function getMimeType(ext: string) {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function bufferToDataUrl(buffer: Buffer, ext: string) {
  return `data:${getMimeType(ext)};base64,${buffer.toString("base64")}`;
}

async function extractTextFromImagesWithAi(dataUrls: string[], fileName: string) {
  if (dataUrls.length === 0) return "";

  const { client, model, provider } = getAiVisionClient();

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是 Second AI 的 OCR 识别器。请只提取图片或扫描 PDF 页面中真实可见的文字，不要总结、不要补写、不要猜测。保留姓名、电话、邮箱、学校、项目名、日期等关键信息。",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `请提取文件「${fileName}」中的全部可见文字。若看不清，请标注“局部文字无法识别”。`,
            },
            ...dataUrls.map((dataUrl) => ({
              type: "image_url" as const,
              image_url: { url: dataUrl },
            })),
          ],
        },
      ],
      temperature: 0,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.warn("[Vision OCR] failed", {
      provider,
      model,
      fileName,
      error,
    });

    if (error instanceof OpenAI.APIError) {
      throw new Error(
        `图片/PDF 视觉识别失败：${error.status ?? ""} ${error.code ?? ""} ${error.message}`.trim(),
      );
    }

    if (error instanceof Error) {
      throw new Error(`图片/PDF 视觉识别失败：${error.message}`);
    }

    throw new Error("图片/PDF 视觉识别失败。");
  }
}

export async function extractTextFromStoredAsset(
  supabase: SupabaseClient,
  asset: AssetRecord,
) {
  if (!asset.file_url) return asset.raw_text ?? "";

  const ext = extensionFromAsset(asset);
  if (!textExtensions.includes(ext)) {
    return asset.raw_text ?? "";
  }

  const { data, error } = await supabase.storage.from(storageBucket).download(asset.file_url);
  if (error || !data) {
    console.warn("[Text Extraction] download failed", {
      assetId: asset.id,
      fileName: asset.file_name,
      message: error?.message,
    });
    return asset.raw_text ?? "";
  }

  const buffer = await blobToBuffer(data);
  let text = "";

  try {
    if (["txt", "md", "markdown"].includes(ext)) {
      text = buffer.toString("utf8");
    } else if (ext === "pdf") {
      text = await extractPdfText(buffer);
      if (normalizeExtractedText(text).length < 80) {
        const pageImages = await renderPdfPagesAsImages(buffer);
        const ocrText = await extractTextFromImagesWithAi(pageImages, asset.file_name);
        text = [text, ocrText].filter(Boolean).join("\n\n");
      }
    } else if (ext === "docx") {
      text = await extractDocxText(buffer);
    } else if (imageExtensions.includes(ext)) {
      text = await extractTextFromImagesWithAi([bufferToDataUrl(buffer, ext)], asset.file_name);
    }
  } catch (error) {
    console.warn("[Text Extraction] parse failed", {
      assetId: asset.id,
      fileName: asset.file_name,
      error,
    });

    if (error instanceof Error && error.message.includes("视觉识别失败")) {
      throw error;
    }
  }

  return normalizeExtractedText(text || asset.raw_text || "");
}
