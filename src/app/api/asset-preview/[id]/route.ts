import mammoth from "mammoth";
import { NextResponse, type NextRequest } from "next/server";
import type { AssetRecord, InvitationRecord } from "@/lib/db-types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET || "assets";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeDocxHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

function renderDocumentPage({ title, body }: { title: string; body: string }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #eef4fb;
      color: #172033;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      line-height: 1.78;
    }
    .page {
      width: min(860px, calc(100vw - 40px));
      min-height: calc(100vh - 48px);
      margin: 24px auto;
      padding: 56px 64px;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
    }
    h1, h2, h3 { color: #07112a; line-height: 1.25; margin: 1.2em 0 0.55em; }
    h1 { font-size: 30px; }
    h2 { font-size: 24px; }
    h3 { font-size: 19px; }
    p { margin: 0 0 0.9em; }
    ul, ol { padding-left: 1.4em; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    td, th { border: 1px solid #d9e2ef; padding: 8px 10px; vertical-align: top; }
    img { max-width: 100%; height: auto; }
    @media (max-width: 720px) {
      .page { width: 100%; min-height: 100vh; margin: 0; padding: 32px 22px; border-radius: 0; }
    }
  </style>
</head>
<body>
  <main class="page">${body}</main>
</body>
</html>`;
}

function errorPage(message: string, status = 400) {
  return new NextResponse(
    renderDocumentPage({
      title: "文档预览不可用",
      body: `<h1>文档预览不可用</h1><p>${escapeHtml(message)}</p>`,
    }),
    {
      status,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

async function canPreviewAsset({
  request,
  asset,
}: {
  request: NextRequest;
  asset: AssetRecord;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;

  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return asset.owner_id === user.id;
  }

  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .or(`token.eq.${token},invite_token.eq.${token}`)
    .maybeSingle();

  if (!invitation) return false;

  const invite = invitation as InvitationRecord;
  const visitorEmail = user.email.trim().toLowerCase();
  const invitedEmail = invite.visitor_email.trim().toLowerCase();

  if (invite.owner_id !== asset.owner_id) return false;
  if (invitedEmail !== visitorEmail) return false;
  if (invite.status !== "active") return false;
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) return false;

  return asset.visibility === "answer_only" || asset.visibility === "show";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: assetData, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !assetData) {
    return errorPage("没有找到这份资料。", 404);
  }

  const asset = assetData as AssetRecord;
  const allowed = await canPreviewAsset({ request, asset });
  if (!allowed) {
    return errorPage("你没有权限预览这份资料。", 403);
  }

  if (!asset.file_url) {
    return errorPage("这份资料没有可预览的文件路径。");
  }

  if (asset.file_type.toLowerCase() !== "docx" && !asset.file_name.toLowerCase().endsWith(".docx")) {
    return errorPage("当前网页文档阅读器只支持 DOCX。");
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(storageBucket)
    .download(asset.file_url);

  if (downloadError || !fileBlob) {
    return errorPage("读取文档失败，请确认文件仍存在于 Storage。", 500);
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  const result = await mammoth.convertToHtml({ buffer });
  const html = sanitizeDocxHtml(result.value || "<p>这份 DOCX 没有可展示的正文。</p>");

  return new NextResponse(renderDocumentPage({ title: asset.ai_title || asset.file_name, body: html }), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, max-age=300",
    },
  });
}
