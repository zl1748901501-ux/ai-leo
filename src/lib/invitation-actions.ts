"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, getOwnerWorkspaceData } from "./owner-data";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createInviteToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function resolveExpiresAt(value: string) {
  const daysMap: Record<string, number | null> = {
    "1": 1,
    "3": 3,
    "7": 7,
    "30": 30,
    forever: null,
  };
  const days = daysMap[value] ?? 7;

  if (days === null) {
    return null;
  }

  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function createInvitationAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("visitor_email") ?? ""));
  const duration = String(formData.get("duration") ?? "7");

  if (!email || !email.includes("@")) {
    redirect("/share?error=请输入有效的访客邮箱。");
  }

  const { profile, userEmail } = await getOwnerWorkspaceData();
  if (!profile) {
    redirect("/share?error=没有找到当前用户的 AI 主页。");
  }

  const { supabase, user } = await getCurrentUser();
  const token = createInviteToken();
  const expiresAt = resolveExpiresAt(duration);

  const { error } = await supabase.from("invitations").insert({
    profile_id: profile.id,
    owner_id: user.id,
    visitor_email: email,
    invite_token: token,
    token,
    status: "active",
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/share?error=${encodeURIComponent(error.message)}`);
  }

  console.info("[Invitation] created", { owner: userEmail, visitor: email, profileId: profile.id });
  revalidatePath("/share");
  redirect(`/share?created=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
}

export async function revokeInvitationAction(formData: FormData) {
  const invitationId = String(formData.get("invitation_id") ?? "");

  if (!invitationId) {
    redirect("/share?error=没有找到要撤销的邀请。");
  }

  const { supabase, user } = await getCurrentUser();
  const { error } = await supabase
    .from("invitations")
    .update({
      status: "revoked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/share?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/share");
  redirect("/share?revoked=1");
}

export async function deleteInvitationAction(formData: FormData) {
  const invitationId = String(formData.get("invitation_id") ?? "");

  if (!invitationId) {
    redirect("/share?error=没有找到要删除的邀请。");
  }

  const { supabase, user } = await getCurrentUser();
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/share?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/share");
  redirect("/share?deleted=1");
}
