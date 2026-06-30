import { redirect } from "next/navigation";
import type { AssetRecord, InvitationRecord, OwnerWorkspaceData, Profile } from "./db-types";
import { ensureSeedData } from "./seed";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";

function throwSupabaseError(context: string, error: { message?: string; code?: string; details?: string } | null) {
  if (!error) return;
  const details = [error.message, error.code, error.details].filter(Boolean).join(" · ");
  throw new Error(`${context}：${details || "Supabase 操作失败"}`);
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=supabase-not-configured");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getOwnerWorkspaceData(): Promise<
  OwnerWorkspaceData & { userEmail: string | null }
> {
  const { supabase, user } = await getCurrentUser();
  const seeded = await ensureSeedData(supabase, user.id);

  return {
    ...seeded,
    userEmail: user.email ?? null,
  };
}

export async function getOwnerAssets(): Promise<{ assets: AssetRecord[]; userEmail: string | null }> {
  const { supabase, user } = await getCurrentUser();
  await ensureSeedData(supabase, user.id);

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  throwSupabaseError("读取当前用户 assets 失败", error);

  return {
    assets: (data ?? []) as AssetRecord[],
    userEmail: user.email ?? null,
  };
}

export async function getOwnerAssetById(
  id: string,
): Promise<{ asset: AssetRecord | null; userEmail: string | null }> {
  const { supabase, user } = await getCurrentUser();
  const { assets } = await ensureSeedData(supabase, user.id);

  if (id === "1") {
    return { asset: assets[0] ?? null, userEmail: user.email ?? null };
  }

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("owner_id", user.id)
    .eq("id", id)
    .maybeSingle();

  throwSupabaseError("读取资产详情失败", error);

  return {
    asset: (data as AssetRecord | null) ?? null,
    userEmail: user.email ?? null,
  };
}

export async function getOwnerProfileData(): Promise<{
  profile: Profile | null;
  assets: AssetRecord[];
  userEmail: string | null;
}> {
  const data = await getOwnerWorkspaceData();
  return {
    profile: data.profile,
    assets: data.assets,
    userEmail: data.userEmail,
  };
}

export async function getOwnerInvitationData(): Promise<{
  invitations: InvitationRecord[];
  userEmail: string | null;
}> {
  const data = await getOwnerWorkspaceData();
  return {
    invitations: data.invitations,
    userEmail: data.userEmail,
  };
}
