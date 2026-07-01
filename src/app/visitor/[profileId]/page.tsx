import { redirect } from "next/navigation";
import { VisitorPortfolio, type VisitorProfileInfo, type VisitorRelatedAsset } from "@/components/VisitorPortfolio";
import type { AssetRecord, InvitationRecord, Profile } from "@/lib/db-types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET || "assets";

function deny(reason: string) {
  redirect(`/no-access?reason=${encodeURIComponent(reason)}`);
}

function normalizeStringArray(value: unknown, limit = 8) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, limit)
    : [];
}

function toProfileInfo(profile: Profile): VisitorProfileInfo {
  return {
    name: profile.title || "Isabella",
    identity:
      profile.identity ||
      "26届数字媒体艺术应届生 · AI 产品经理候选人 · Second AI 项目创建者",
    bio:
      profile.bio ||
      profile.visitor_intro ||
      "从数字媒体创作者出发，探索 AI 产品如何重新组织个人作品与能力表达。",
    privacyNotice:
      profile.privacy_notice ||
      "AI 只读取授权资料，未授权内容不会进入回答。",
    abilityTags:
      profile.ability_tags && profile.ability_tags.length > 0
        ? profile.ability_tags
        : ["AI 产品设计", "原型设计", "视觉表达", "RAG", "权限系统"],
    recommendedQuestions:
      profile.recommended_questions && profile.recommended_questions.length > 0
        ? profile.recommended_questions
        : [
            "为什么想转 AI 产品经理？",
            "Second AI 解决了什么问题？",
            "这个项目体现了哪些产品能力？",
            "设计背景如何帮助 AI 产品？",
          ],
  };
}

async function toRelatedAssets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assets: AssetRecord[],
): Promise<VisitorRelatedAsset[]> {
  return Promise.all(
    assets.map(async (asset) => {
      let previewUrl: string | null = null;

      if (asset.file_url) {
        const { data } = await supabase.storage
          .from(storageBucket)
          .createSignedUrl(asset.file_url, 60 * 30);
        previewUrl = data?.signedUrl ?? null;
      }

      return {
        id: asset.id,
        title: asset.ai_title || asset.file_name,
        fileName: asset.file_name,
        fileType: asset.file_type,
        summary: asset.one_sentence_summary || asset.detailed_summary || asset.file_name,
        tags: normalizeStringArray(asset.tags, 5),
        visibility: asset.visibility === "show" ? "show" : "answer_only",
        previewUrl,
        rawText: asset.raw_text ? asset.raw_text.slice(0, 8000) : undefined,
      };
    }),
  );
}

async function readAuthorizedAssets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
) {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("analysis_status", "completed")
    .in("visibility", ["answer_only", "show"])
    .order("visibility", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("[Visitor Page] read authorized assets failed", error);
    return [];
  }

  return (data ?? []) as AssetRecord[];
}

export default async function VisitorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { profileId } = await params;
  const { token } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!token && user) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("owner_id", user.id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownerProfile) {
      const assets = await readAuthorizedAssets(supabase, user.id);
      return (
        <VisitorPortfolio
          visitorEmail={user.email ?? "owner"}
          ownerPreview
          profile={toProfileInfo(ownerProfile as Profile)}
          relatedAssets={await toRelatedAssets(supabase, assets)}
        />
      );
    }
  }

  if (!token) {
    deny("邀请不存在");
  }

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/visitor/${profileId}?token=${token}`)}`);
  }

  const visitorEmail = user.email?.trim().toLowerCase();
  if (!visitorEmail) {
    deny("当前账号没有邮箱");
  }

  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("*")
    .or(`token.eq.${token},invite_token.eq.${token}`)
    .maybeSingle();

  if (error || !invitation) {
    deny("邀请不存在");
  }

  const invite = invitation as InvitationRecord;
  const invitedEmail = invite.visitor_email?.trim().toLowerCase();

  if (invitedEmail !== visitorEmail) {
    deny("当前登录邮箱不是被邀请邮箱");
  }

  if (invite.status !== "active") {
    deny(invite.status === "revoked" ? "邀请已撤销" : "邀请已失效");
  }

  // Server-side access validation needs the current time to reject expired invitations.
  // eslint-disable-next-line react-hooks/purity
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) {
    deny("邀请已过期");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", invite.profile_id)
    .maybeSingle();

  if (!profile) {
    deny("主页不存在");
  }

  const assets = await readAuthorizedAssets(supabase, invite.owner_id);

  return (
    <VisitorPortfolio
      visitorEmail={visitorEmail}
      token={token}
      profile={toProfileInfo(profile as Profile)}
      relatedAssets={await toRelatedAssets(supabase, assets)}
    />
  );
}
