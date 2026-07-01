"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import OpenAI from "openai";
import type { AssetRecord } from "./db-types";
import { getCurrentUser } from "./owner-data";
import { extractTextFromStoredAsset } from "./text-extraction";

type AiAnalysis = {
  ai_title: string;
  one_sentence_summary: string;
  detailed_summary: string;
  tags: string[];
  skills: string[];
  project_keywords: string[];
  answerable_questions: string[];
  card: {
    title: string;
    subtitle: string;
    summary: string;
    display_reason: string;
    card_type: string;
  };
  source_quotes: Array<{
    quote: string;
    why_it_matters: string;
  }>;
  suggested_visibility: "private" | "answer_only" | "show";
};

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
}

function normalizeAnalysis(value: unknown): AiAnalysis {
  if (!value || typeof value !== "object") {
    throw new Error("AI 返回内容不是 JSON 对象。");
  }

  const record = value as Record<string, unknown>;
  const card = record.card && typeof record.card === "object" ? (record.card as Record<string, unknown>) : {};
  const sourceQuotes = Array.isArray(record.source_quotes)
    ? record.source_quotes
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          quote: typeof item.quote === "string" ? item.quote : "",
          why_it_matters: typeof item.why_it_matters === "string" ? item.why_it_matters : "",
        }))
        .filter((item) => item.quote || item.why_it_matters)
        .slice(0, 5)
    : [];

  const suggestedVisibility =
    record.suggested_visibility === "answer_only" || record.suggested_visibility === "show"
      ? record.suggested_visibility
      : "private";

  return {
    ai_title: typeof record.ai_title === "string" ? record.ai_title : "",
    one_sentence_summary:
      typeof record.one_sentence_summary === "string" ? record.one_sentence_summary : "",
    detailed_summary: typeof record.detailed_summary === "string" ? record.detailed_summary : "",
    tags: normalizeStringArray(record.tags),
    skills: normalizeStringArray(record.skills),
    project_keywords: normalizeStringArray(record.project_keywords),
    answerable_questions: normalizeStringArray(record.answerable_questions),
    card: {
      title: typeof card.title === "string" ? card.title : "",
      subtitle: typeof card.subtitle === "string" ? card.subtitle : "",
      summary: typeof card.summary === "string" ? card.summary : "",
      display_reason: typeof card.display_reason === "string" ? card.display_reason : "",
      card_type: typeof card.card_type === "string" ? card.card_type : "",
    },
    source_quotes: sourceQuotes,
    suggested_visibility: suggestedVisibility,
  };
}

function extractJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI 返回内容不是合法 JSON。");
    return JSON.parse(match[0]);
  }
}

function getAiClient() {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  if (provider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("缺少 DEEPSEEK_API_KEY。请先在 .env.local 中填写后重启项目。");
    }

    const baseURL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

    return {
      provider,
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      baseURL,
      client: new OpenAI({
        apiKey,
        baseURL,
      }),
    };
  }

  if (provider !== "openai") {
    throw new Error("AI_PROVIDER 只能设置为 openai 或 deepseek。");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 OPENAI_API_KEY。请先在 .env.local 中填写后重启项目。");
  }

  return {
    provider,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    baseURL: "https://api.openai.com/v1",
    client: new OpenAI({ apiKey }),
  };
}

function getAiErrorMessage(error: unknown) {
  if (error instanceof OpenAI.APIError) {
    const parts = [
      error.status ? `状态码 ${error.status}` : "",
      error.code ? `错误码 ${error.code}` : "",
      error.message,
    ].filter(Boolean);
    return parts.join(" · ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "AI 解析失败。";
}

function buildPrompt(asset: AssetRecord) {
  const hasRawText = !!asset.raw_text?.trim();

  return `
请为 Second AI 的资料资产做真实 AI 解析，并返回严格 JSON。
用户身份：Isabella，26届数字媒体艺术应届生，正在转向 AI 产品经理。
产品背景：Second AI 是一个可控访问的 AI 作品主页生成工具。用户上传资料后，AI 需要理解资料能证明什么能力、适合回答哪些问题、是否适合在访客主页中展示。

资料信息：
- file_name: ${asset.file_name}
- file_type: ${asset.file_type}
- original_text/raw_text: ${asset.raw_text || "当前没有提取到正文。只能根据文件名、文件类型和已有摘要谨慎描述，不要编造具体经历、联系方式、时间或能力。"}
- existing_ai_title: ${asset.ai_title || ""}
- existing_summary: ${asset.one_sentence_summary || ""}
- existing_tags: ${(asset.tags ?? []).join(", ")}

返回格式必须是严格 JSON，不要 Markdown，不要解释：
{
  "ai_title": "",
  "one_sentence_summary": "",
  "detailed_summary": "",
  "tags": [],
  "skills": [],
  "project_keywords": [],
  "answerable_questions": [],
  "card": {
    "title": "",
    "subtitle": "",
    "summary": "",
    "display_reason": "",
    "card_type": ""
  },
  "source_quotes": [
    {
      "quote": "",
      "why_it_matters": ""
    }
  ],
  "suggested_visibility": "private"
}

约束：
- ${hasRawText ? "当前有正文，必须优先基于正文解析。" : "当前没有正文，不要写“资料中明确提到”这类确定性表述。"}
- 不要编造正文里不存在的联系方式、时间、学校、公司、项目经历或能力。
- 如果正文包含手机号、邮箱等联系方式，可以进入 source_quotes，但不要主动建议公开隐私信息。
- answerable_questions 用中文，3 到 5 个。
- tags、skills、project_keywords 每项不超过 8 个。
- suggested_visibility 只能是 private、answer_only、show。`;
}

async function runOpenAiAnalysis(asset: AssetRecord) {
  const { client, model, provider, baseURL } = getAiClient();

  console.info("[AI Analysis] start", {
    provider,
    model,
    baseURL,
    assetId: asset.id,
    fileName: asset.file_name,
    hasRawText: !!asset.raw_text?.trim(),
  });

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "你是 Second AI 的资料解析器。你只返回严格 JSON，不返回 Markdown。必须基于文件正文解析，不编造正文中不存在的具体事实。",
      },
      {
        role: "user",
        content: buildPrompt(asset),
      },
    ],
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(`${provider} 返回格式异常，没有找到 message.content。`);
  }

  return normalizeAnalysis(extractJson(content));
}

export async function analyzeAssetAction(formData: FormData) {
  const assetId = String(formData.get("assetId") ?? "");
  if (!assetId) redirect("/dashboard");

  const { supabase, user } = await getCurrentUser();
  const { data: asset, error: readError } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (readError || !asset) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(readError?.message || "没有找到这份资料。")}`);
  }

  await supabase
    .from("assets")
    .update({ analysis_status: "analyzing", updated_at: new Date().toISOString() })
    .eq("id", assetId)
    .eq("owner_id", user.id);

  let redirectTo = `/assets/${assetId}?analyzed=1`;

  try {
    const extractedText = await extractTextFromStoredAsset(supabase, asset as AssetRecord);
    const assetForAnalysis = {
      ...(asset as AssetRecord),
      raw_text: extractedText || asset.raw_text,
    };
    const analysis = await runOpenAiAnalysis(assetForAnalysis);
    const nextVisibility = asset.visibility || analysis.suggested_visibility;

    const { error: updateError } = await supabase
      .from("assets")
      .update({
        raw_text: extractedText || asset.raw_text,
        ai_title: analysis.ai_title || asset.ai_title,
        one_sentence_summary: analysis.one_sentence_summary || asset.one_sentence_summary,
        detailed_summary: analysis.detailed_summary || asset.detailed_summary,
        tags: analysis.tags.length > 0 ? analysis.tags : asset.tags,
        skills: analysis.skills.length > 0 ? analysis.skills : asset.skills,
        project_keywords:
          analysis.project_keywords.length > 0 ? analysis.project_keywords : asset.project_keywords,
        answerable_questions:
          analysis.answerable_questions.length > 0
            ? analysis.answerable_questions
            : asset.answerable_questions,
        card: analysis.card,
        source_quotes: analysis.source_quotes,
        visibility: nextVisibility,
        analysis_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assetId)
      .eq("owner_id", user.id);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/dashboard");
    revalidatePath("/upload");
    revalidatePath(`/assets/${assetId}`);
  } catch (error) {
    const message = getAiErrorMessage(error);
    console.error("[AI Analysis] failed", {
      assetId,
      provider: process.env.AI_PROVIDER || "openai",
      message,
      error,
    });

    await supabase
      .from("assets")
      .update({ analysis_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", assetId)
      .eq("owner_id", user.id);

    revalidatePath(`/assets/${assetId}`);
    redirectTo = `/assets/${assetId}?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}

export async function analyzeAssetsAction(formData: FormData) {
  const assetIds = formData
    .getAll("assetIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (assetIds.length === 0) {
    redirect("/assets?error=请选择要重新解析的资产。");
  }

  const { supabase, user } = await getCurrentUser();
  const { data: assets, error: readError } = await supabase
    .from("assets")
    .select("*")
    .eq("owner_id", user.id)
    .in("id", assetIds);

  if (readError) {
    redirect(`/assets?error=${encodeURIComponent(readError.message)}`);
  }

  let successCount = 0;
  let failedCount = 0;

  for (const asset of (assets ?? []) as AssetRecord[]) {
    await supabase
      .from("assets")
      .update({ analysis_status: "analyzing", updated_at: new Date().toISOString() })
      .eq("id", asset.id)
      .eq("owner_id", user.id);

    try {
      const extractedText = await extractTextFromStoredAsset(supabase, asset);
      const assetForAnalysis = {
        ...asset,
        raw_text: extractedText || asset.raw_text,
      };
      const analysis = await runOpenAiAnalysis(assetForAnalysis);
      const nextVisibility = asset.visibility || analysis.suggested_visibility;

      const { error: updateError } = await supabase
        .from("assets")
        .update({
          raw_text: extractedText || asset.raw_text,
          ai_title: analysis.ai_title || asset.ai_title,
          one_sentence_summary: analysis.one_sentence_summary || asset.one_sentence_summary,
          detailed_summary: analysis.detailed_summary || asset.detailed_summary,
          tags: analysis.tags.length > 0 ? analysis.tags : asset.tags,
          skills: analysis.skills.length > 0 ? analysis.skills : asset.skills,
          project_keywords:
            analysis.project_keywords.length > 0 ? analysis.project_keywords : asset.project_keywords,
          answerable_questions:
            analysis.answerable_questions.length > 0
              ? analysis.answerable_questions
              : asset.answerable_questions,
          card: analysis.card,
          source_quotes: analysis.source_quotes,
          visibility: nextVisibility,
          analysis_status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", asset.id)
        .eq("owner_id", user.id);

      if (updateError) throw new Error(updateError.message);
      successCount += 1;
      revalidatePath(`/assets/${asset.id}`);
    } catch (error) {
      failedCount += 1;
      console.error("[AI Analysis] batch item failed", {
        assetId: asset.id,
        provider: process.env.AI_PROVIDER || "openai",
        message: getAiErrorMessage(error),
        error,
      });

      await supabase
        .from("assets")
        .update({ analysis_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", asset.id)
        .eq("owner_id", user.id);
    }
  }

  revalidatePath("/assets");
  revalidatePath("/dashboard");
  revalidatePath("/upload");
  revalidatePath("/profile-generator");
  redirect(`/assets?reanalyzed=${successCount}&failed=${failedCount}`);
}
