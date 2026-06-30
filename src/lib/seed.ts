import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssetRecord, InvitationRecord, Profile } from "./db-types";

function throwSupabaseError(context: string, error: { message?: string; code?: string; details?: string } | null) {
  if (!error) return;
  const details = [error.message, error.code, error.details].filter(Boolean).join(" · ");
  throw new Error(`${context}：${details || "Supabase 操作失败"}`);
}

const profileSeed = {
  title: "Isabella 的 Second AI 作品主页",
  identity: "26届数字媒体艺术应届生 · AI 产品经理候选人 · Second AI 项目创建者",
  bio: "从数字媒体创作者出发，探索 AI 产品如何重新组织个人作品与能力表达。",
  ability_tags: ["AI 产品设计", "原型设计", "视觉表达", "RAG", "权限系统"],
  recommended_questions: [
    "为什么想转 AI 产品经理？",
    "Second AI 解决了什么问题？",
    "这个项目体现了哪些产品能力？",
    "设计背景如何帮助 AI 产品？",
  ],
  visitor_intro: "通过 AI 对话了解 Isabella 的项目、作品与能力证据。",
  privacy_notice: "AI 只读取授权资料，未授权内容不会进入回答。",
  is_active: true,
};

const assetSeeds = [
  {
    file_name: "Second AI PRD.pdf",
    file_type: "PDF",
    ai_title: "Second AI 产品 PRD",
    asset_type: "PRD",
    one_sentence_summary: "面向个人展示场景的受控访问 AI 主页产品文档。",
    detailed_summary:
      "这份资料描述了 Second AI 的产品定位、目标用户、MVP 功能、AI 解析流程、受控邀请权限和访客问答体验。",
    tags: ["AI 产品设计", "RAG", "权限系统", "求职场景"],
    skills: ["产品定位", "MVP 拆解", "权限设计", "AI 问答闭环"],
    project_keywords: ["Second AI", "AI Workspace", "AI Portfolio"],
    answerable_questions: [
      "Second AI 解决了什么问题？",
      "Second AI 和普通作品集有什么区别？",
      "Second AI 的权限机制是怎么设计的？",
    ],
    card: {
      title: "Second AI 产品 PRD",
      proof: "证明产品定位、MVP 拆解、权限设计和 AI 问答闭环能力。",
    },
    source_quotes: [],
    visibility: "display",
    analysis_status: "done",
  },
  {
    file_name: "Second AI 原型设计说明.docx",
    file_type: "Word",
    ai_title: "Second AI 原型设计说明",
    asset_type: "原型文档",
    one_sentence_summary: "用于指导高保真原型设计的页面、交互和信息架构说明。",
    detailed_summary:
      "资料覆盖 Workspace、上传中心、资产详情、主页生成、分享权限、访客主页和无权限页面。",
    tags: ["交互设计", "访客体验", "SaaS", "主页生成"],
    skills: ["信息架构", "交互流程", "页面拆解", "访客体验"],
    project_keywords: ["原型设计", "AI Profile", "权限体验"],
    answerable_questions: [
      "这个原型包含哪些页面？",
      "访客主页应该如何展示相关资料？",
      "下载申请流程怎么走？",
    ],
    card: {
      title: "Second AI 原型设计说明",
      proof: "证明信息架构、交互流程、页面拆解和访客体验设计能力。",
    },
    source_quotes: [],
    visibility: "display",
    analysis_status: "done",
  },
  {
    file_name: "Isabella Resume.pdf",
    file_type: "PDF",
    ai_title: "Isabella Resume",
    asset_type: "简历",
    one_sentence_summary: "说明 Isabella 具备数字媒体艺术、视觉设计和 AI 产品方向背景。",
    detailed_summary:
      "这份简历用于回答访客关于教育背景、项目经历、能力匹配和求职方向的问题。",
    tags: ["数字媒体艺术", "AI 产品经理候选人", "视觉设计"],
    skills: ["视觉表达", "项目经历", "求职匹配"],
    project_keywords: ["Resume", "AI PM", "数字媒体"],
    answerable_questions: [
      "为什么适合 AI PM 岗位？",
      "她有哪些设计和视觉能力？",
      "她在这个项目中负责了哪些产品设计？",
    ],
    card: {
      title: "个人简历",
      proof: "证明数字媒体艺术背景、视觉表达能力和 AI 产品方向匹配度。",
    },
    source_quotes: [],
    visibility: "answer_only",
    analysis_status: "done",
  },
  {
    file_name: "second-ai-demo.mp4",
    file_type: "Video",
    ai_title: "AI 主页演示视频",
    asset_type: "视频",
    one_sentence_summary: "展示访客通过 AI 主页了解资料主人并查看相关资料的演示视频。",
    detailed_summary:
      "当前阶段使用 mock 数据模拟视频转写、关键帧识别和 AI 摘要。后续可接入真实视频理解流程。",
    tags: ["视频", "AI 主页", "关键帧"],
    skills: ["产品演示", "用户路径表达", "AI 展示组织"],
    project_keywords: ["Demo", "AI Profile", "访客体验"],
    answerable_questions: ["视频里展示了哪些能力？", "访客如何申请资料下载？"],
    card: {
      title: "AI 主页演示视频",
      proof: "证明产品演示、用户路径表达和 AI 展示结果组织能力。",
    },
    source_quotes: [],
    visibility: "private",
    analysis_status: "processing",
  },
];

const mockAssetFileNames = assetSeeds.map((asset) => asset.file_name);

async function removeDuplicateMockAssets(
  supabase: SupabaseClient,
  ownerId: string,
  assets: AssetRecord[],
) {
  const grouped = new Map<string, AssetRecord[]>();

  assets
    .filter((asset) => mockAssetFileNames.includes(asset.file_name) && !asset.file_url)
    .forEach((asset) => {
      const group = grouped.get(asset.file_name) ?? [];
      group.push(asset);
      grouped.set(asset.file_name, group);
    });

  const duplicateIds = Array.from(grouped.values()).flatMap((group) => {
    if (group.length <= 1) return [];
    const sorted = [...group].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return sorted.slice(1).map((asset) => asset.id);
  });

  if (duplicateIds.length === 0) {
    return assets;
  }

  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("owner_id", ownerId)
    .in("id", duplicateIds);

  throwSupabaseError("清理重复 mock assets 失败", error);

  return assets.filter((asset) => !duplicateIds.includes(asset.id));
}

export async function ensureSeedData(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<{ profile: Profile; assets: AssetRecord[]; invitations: InvitationRecord[] }> {
  const { data: existingProfiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("owner_id", ownerId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);

  if (profileError) {
    throwSupabaseError("读取 profile 失败", profileError);
  }

  let profile = ((existingProfiles ?? [])[0] as Profile | undefined) ?? null;

  if (!profile) {
    const { data: createdProfile, error } = await supabase
      .from("profiles")
      .insert({ ...profileSeed, owner_id: ownerId })
      .select("*")
      .single();

    throwSupabaseError("创建 profile 失败", error);
    profile = createdProfile as Profile;
  }

  const { data: existingAssets, error: assetsError } = await supabase
    .from("assets")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  throwSupabaseError("读取 assets 失败", assetsError);

  let assets = (existingAssets ?? []) as AssetRecord[];
  assets = await removeDuplicateMockAssets(supabase, ownerId, assets);

  if (assets.length === 0) {
    const { data: createdAssets, error } = await supabase
      .from("assets")
      .insert(assetSeeds.map((asset) => ({ ...asset, owner_id: ownerId })))
      .select("*")
      .order("created_at", { ascending: true });

    throwSupabaseError("创建 assets mock 数据失败", error);
    assets = (createdAssets ?? []) as AssetRecord[];
  }

  const { data: existingInvitations, error: invitationsError } = await supabase
    .from("invitations")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  throwSupabaseError("读取 invitations 失败", invitationsError);

  let invitations = (existingInvitations ?? []) as InvitationRecord[];

  if (invitations.length === 0) {
    const { data: createdInvitations, error } = await supabase
      .from("invitations")
      .insert([
        {
          profile_id: profile.id,
          owner_id: ownerId,
          visitor_email: "hr@company.com",
          invite_token: `hr-company-${ownerId.slice(0, 8)}`,
          status: "accepted",
          expires_at: "2026-07-15T00:00:00",
          used_at: new Date().toISOString(),
          last_access_at: new Date().toISOString(),
        },
        {
          profile_id: profile.id,
          owner_id: ownerId,
          visitor_email: "mentor@example.com",
          invite_token: `mentor-${ownerId.slice(0, 8)}`,
          status: "pending",
          expires_at: "2026-07-08T00:00:00",
        },
        {
          profile_id: profile.id,
          owner_id: ownerId,
          visitor_email: "client@studio.cn",
          invite_token: `client-${ownerId.slice(0, 8)}`,
          status: "revoked",
          expires_at: "2026-06-28T00:00:00",
        },
      ])
      .select("*")
      .order("created_at", { ascending: true });

    throwSupabaseError("创建 invitations mock 数据失败", error);
    invitations = (createdInvitations ?? []) as InvitationRecord[];
  }

  return { profile, assets, invitations };
}
