"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./owner-data";

function splitList(value: FormDataEntryValue | null, limit: number) {
  return String(value ?? "")
    .split(/[\n,，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export async function updateProfileAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Isabella";
  const identity = String(formData.get("identity") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const visitorIntro = String(formData.get("visitor_intro") ?? "").trim();
  const privacyNotice = String(formData.get("privacy_notice") ?? "").trim();
  const abilityTags = splitList(formData.get("ability_tags"), 12);
  const recommendedQuestions = [
    formData.get("question_1"),
    formData.get("question_2"),
    formData.get("question_3"),
    formData.get("question_4"),
    formData.get("question_5"),
    formData.get("question_6"),
  ]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 6);

  if (!profileId) {
    redirect("/profile-generator?error=missing-profile");
  }

  const { supabase, user } = await getCurrentUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      title,
      identity,
      bio,
      visitor_intro: visitorIntro,
      privacy_notice: privacyNotice,
      ability_tags: abilityTags,
      recommended_questions: recommendedQuestions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/profile-generator?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile-generator");
  revalidatePath("/visitor/isabella");
  redirect("/profile-generator?saved=1");
}
