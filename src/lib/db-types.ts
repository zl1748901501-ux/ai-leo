export type Profile = {
  id: string;
  owner_id: string;
  title: string | null;
  identity: string | null;
  bio: string | null;
  avatar_url: string | null;
  ability_tags: string[];
  recommended_questions: string[];
  visitor_intro: string | null;
  privacy_notice: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AssetRecord = {
  id: string;
  owner_id: string;
  file_name: string;
  file_url: string | null;
  file_type: string;
  raw_text: string | null;
  ai_title: string | null;
  asset_type: string | null;
  one_sentence_summary: string | null;
  detailed_summary: string | null;
  tags: string[];
  skills: string[];
  project_keywords: string[];
  answerable_questions: string[];
  card: Record<string, unknown> | null;
  source_quotes: string[];
  visibility: "private" | "answer_only" | "display" | string;
  analysis_status: "waiting" | "processing" | "done" | "completed" | string;
  created_at: string;
  updated_at: string;
};

export type InvitationRecord = {
  id: string;
  profile_id: string;
  owner_id: string;
  visitor_email: string;
  invite_token: string;
  status: "pending" | "accepted" | "revoked" | string;
  note: string | null;
  expires_at: string | null;
  created_at: string;
  used_at: string | null;
  last_access_at: string | null;
};

export type OwnerWorkspaceData = {
  profile: Profile | null;
  assets: AssetRecord[];
  invitations: InvitationRecord[];
};

export function visibilityLabel(visibility: string) {
  const labels: Record<string, string> = {
    private: "私密",
    answer_only: "仅回答",
    display: "可展示",
  };
  return labels[visibility] ?? visibility;
}

export function analysisStatusLabel(status: string) {
  const labels: Record<string, string> = {
    waiting: "等待处理",
    processing: "AI 分析中",
    analyzing: "AI 解析中",
    done: "解析完成",
    completed: "解析完成",
    failed: "解析失败",
  };
  return labels[status] ?? status;
}

export function invitationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待接受",
    accepted: "已接受",
    revoked: "已撤销",
  };
  return labels[status] ?? status;
}

export function isCompletedStatus(status: string) {
  return status === "done" || status === "completed";
}
