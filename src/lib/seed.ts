import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssetRecord, InvitationRecord, Profile } from "./db-types";

function throwSupabaseError(context: string, error: { message?: string; code?: string; details?: string } | null) {
  if (!error) return;
  const details = [error.message, error.code, error.details].filter(Boolean).join(" · ");
  throw new Error(`${context}: ${details || "Supabase 操作失败"}`);
}

const profileSeed = {
  title: "我的 Second AI 主页",
  identity: "",
  bio: "",
  ability_tags: [],
  recommended_questions: [
    "你可以介绍一下自己吗？",
    "有哪些项目或作品可以展示？",
    "哪些资料能证明你的能力？",
    "你的经历和优势是什么？",
  ],
  visitor_intro: "通过 AI 对话了解资料主人的项目、作品与能力证据。",
  privacy_notice: "AI 只读取授权资料，未授权内容不会进入回答。",
  is_active: true,
};

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

  throwSupabaseError("读取 profile 失败", profileError);

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

  const { data: existingInvitations, error: invitationsError } = await supabase
    .from("invitations")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  throwSupabaseError("读取 invitations 失败", invitationsError);

  return {
    profile,
    assets: (existingAssets ?? []) as AssetRecord[],
    invitations: (existingInvitations ?? []) as InvitationRecord[],
  };
}
