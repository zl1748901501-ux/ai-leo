"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  askVisitorQuestionAction,
  type VisitorChatCard,
  type VisitorChatSource,
} from "@/lib/visitor-chat-actions";

export type VisitorProfileInfo = {
  name: string;
  identity: string;
  bio: string;
  privacyNotice: string;
  abilityTags: string[];
  recommendedQuestions: string[];
};

export type VisitorRelatedAsset = {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  summary: string;
  tags: string[];
  visibility: "answer_only" | "show";
  previewUrl: string | null;
  rawText?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: VisitorChatSource[];
  cards?: VisitorChatCard[];
  followUps?: string[];
  isError?: boolean;
};

const defaultProfile: VisitorProfileInfo = {
  name: "Isabella",
  identity: "26届数字媒体艺术应届生 · AI 产品经理候选人 · Second AI 项目创建者",
  bio: "从数字媒体创作者出发，探索 AI 产品如何重新组织个人作品与能力表达。",
  privacyNotice: "AI 只读取授权资料，未授权内容不会进入回答。",
  abilityTags: ["AI 产品设计", "原型设计", "视觉表达", "RAG", "权限系统"],
  recommendedQuestions: [
    "为什么想转 AI 产品经理？",
    "Second AI 解决了什么问题？",
    "这个项目体现了哪些产品能力？",
    "设计背景如何帮助 AI 产品？",
  ],
};

const glassPanel =
  "border border-white/18 bg-[#243852]/72 text-white shadow-[0_24px_90px_rgba(3,7,18,0.28)] backdrop-blur-2xl";

function permissionText(visibility: VisitorRelatedAsset["visibility"]) {
  return visibility === "show" ? "可展示" : "仅回答";
}

function fileTypeLabel(type: string) {
  const value = type.toLowerCase();
  if (["png", "jpg", "jpeg", "webp"].includes(value)) return "图片";
  if (["mp4", "mov"].includes(value)) return "视频";
  if (value === "pdf") return "PDF";
  if (["doc", "docx"].includes(value)) return "Word";
  if (["ppt", "pptx"].includes(value)) return "PPT";
  if (["md", "txt"].includes(value)) return "文档";
  return type || "文件";
}

function isImageType(type: string) {
  return ["png", "jpg", "jpeg", "webp", "gif"].includes(type.toLowerCase());
}

function isVideoType(type: string) {
  return ["mp4", "mov", "webm"].includes(type.toLowerCase());
}

function isPdfType(type: string) {
  return type.toLowerCase() === "pdf";
}

function isDocxType(type: string, fileName: string) {
  return type.toLowerCase() === "docx" || fileName.toLowerCase().endsWith(".docx");
}

function previewText(asset: VisitorRelatedAsset) {
  return (asset.rawText || asset.summary || "").trim();
}

function AssetOpenButtons({
  asset,
  onOpen,
}: {
  asset: VisitorRelatedAsset;
  onOpen: (asset: VisitorRelatedAsset) => void;
}) {
  if (!asset.previewUrl && !previewText(asset)) {
    return (
      <span className="flex-1 rounded-2xl bg-white/[0.06] px-3 py-2 text-center text-xs text-slate-300/60 ring-1 ring-white/8">
        暂无预览
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onOpen(asset)}
        className="flex-1 rounded-2xl bg-cyan-200/15 px-3 py-2 text-center text-xs font-semibold text-cyan-100 ring-1 ring-cyan-200/18 transition hover:bg-cyan-200/22"
      >
        打开查看
      </button>
      {asset.visibility === "show" && asset.previewUrl ? (
        <a
          href={asset.previewUrl}
          target="_blank"
          rel="noreferrer"
          download={asset.fileName}
          className="flex-1 rounded-2xl bg-white/[0.10] px-3 py-2 text-center text-xs font-semibold text-slate-100 ring-1 ring-white/12 transition hover:bg-white/[0.16]"
        >
          下载资料
        </a>
      ) : null}
    </>
  );
}

function AssetPreviewModal({
  asset,
  token,
  onClose,
}: {
  asset: VisitorRelatedAsset;
  token?: string;
  onClose: () => void;
}) {
  const type = asset.fileType.toLowerCase();
  const text = previewText(asset);
  const previewPath = `/api/asset-preview/${asset.id}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur-xl">
      <section className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/16 bg-[#172844]/95 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
              Web Preview
            </p>
            <h3 className="mt-1 text-xl font-semibold">{asset.title}</h3>
            <p className="mt-1 text-xs text-slate-300">
              {fileTypeLabel(asset.fileType)} · {asset.fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/12 transition hover:bg-white/16"
          >
            关闭
          </button>
        </div>

        <div className="subtle-scrollbar min-h-0 flex-1 overflow-auto p-5">
          {asset.previewUrl && isImageType(type) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.previewUrl}
              alt={asset.title}
              className="mx-auto max-h-[68vh] max-w-full rounded-2xl object-contain"
            />
          ) : asset.previewUrl && isVideoType(type) ? (
            <video
              src={asset.previewUrl}
              controls
              className="mx-auto max-h-[68vh] w-full rounded-2xl bg-black"
            />
          ) : asset.previewUrl && isPdfType(type) ? (
            <iframe
              src={asset.previewUrl}
              title={asset.title}
              className="h-[68vh] w-full rounded-2xl border border-white/10 bg-white"
            />
          ) : isDocxType(type, asset.fileName) ? (
            <iframe
              src={previewPath}
              title={asset.title}
              className="h-[68vh] w-full rounded-2xl border border-white/10 bg-white"
            />
          ) : (
            <div className="rounded-2xl bg-white/[0.08] p-5 text-sm leading-8 text-slate-100/86 ring-1 ring-white/10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/78">
                文档网页预览
              </p>
              <p className="whitespace-pre-wrap">
                {text ||
                  "这份资料暂时没有可在网页中展示的正文。你可以在资产详情页重新解析，或上传 PDF / 图片 / 视频获得更完整预览。"}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function VisitorPortfolio({
  visitorEmail = "hr@company.com",
  token,
  ownerPreview = false,
  profile,
  relatedAssets = [],
}: {
  visitorEmail?: string;
  token?: string;
  ownerPreview?: boolean;
  profile?: VisitorProfileInfo;
  relatedAssets?: VisitorRelatedAsset[];
}) {
  const displayProfile = profile ?? defaultProfile;
  const assetById = useMemo(
    () => new Map(relatedAssets.map((asset) => [asset.id, asset])),
    [relatedAssets],
  );
  const quickQuestions = useMemo(
    () =>
      (displayProfile.recommendedQuestions.length > 0
        ? displayProfile.recommendedQuestions
        : defaultProfile.recommendedQuestions
      ).slice(0, 4),
    [displayProfile.recommendedQuestions],
  );
  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        role: "assistant",
        text: `你好，我是 ${displayProfile.name} 的 Second AI。你可以直接问我的项目、作品、经历或可公开资料。`,
        sources: [],
        cards: [],
      },
    ],
    [displayProfile.name],
  );

  const [input, setInput] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [openAssetId, setOpenAssetId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<VisitorRelatedAsset | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [isPending, startTransition] = useTransition();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = chatScrollRef.current;
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollTo({ top: target.scrollHeight, behavior: "smooth" });
    });
  }, [chatMessages.length, isPending]);

  function ask(questionValue = input) {
    const question = questionValue.trim();
    if (!question || isPending) return;

    setInput("");
    setChatMessages((current) => [...current, { role: "user", text: question }]);

    if (!token && !ownerPreview) {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "请通过有效邀请链接进入后再提问。",
          sources: [],
          cards: [],
          isError: true,
        },
      ]);
      return;
    }

    startTransition(async () => {
      const result = await askVisitorQuestionAction({ token, question, ownerPreview });
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.answer,
          sources: result.sources,
          cards: result.cards,
          followUps: result.follow_up_questions,
          isError: !result.ok,
        },
      ]);
    });
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#101a31] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.34),transparent_31%),radial-gradient(circle_at_70%_6%,rgba(124,58,237,0.36),transparent_32%),radial-gradient(circle_at_88%_80%,rgba(219,39,119,0.24),transparent_30%),linear-gradient(135deg,#101a31_0%,#1e2350_48%,#12374f_100%)]" />
      <div className="ambient-shift pointer-events-none absolute -left-40 -top-40 h-[640px] w-[760px] rounded-full bg-blue-400/18 blur-3xl" />
      <div className="ambient-shift pointer-events-none absolute -right-36 bottom-[-220px] h-[700px] w-[780px] rounded-full bg-fuchsia-400/18 blur-3xl [animation-delay:1.4s]" />
      <div className="ambient-shift pointer-events-none absolute left-[34%] top-[-18%] h-[460px] w-[520px] rounded-full bg-cyan-300/14 blur-3xl [animation-delay:2.6s]" />
      <div className="float-object pointer-events-none absolute left-[3%] top-[22%] h-24 w-24 rounded-[32px] border border-white/10 bg-white/[0.04] opacity-35 blur-sm" />
      <div className="float-object pointer-events-none absolute right-[8%] top-[18%] h-20 w-20 rounded-full border border-cyan-100/10 bg-cyan-100/[0.05] opacity-35 blur-sm [animation-delay:1.2s]" />
      <div className="float-object pointer-events-none absolute bottom-[7%] left-[28%] h-24 w-24 rounded-[34px] border border-fuchsia-100/10 bg-fuchsia-100/[0.04] opacity-35 blur-sm [animation-delay:2.4s]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.03)_1px,transparent_1px)] bg-[size:58px_58px]" />

      <header className="relative z-10 h-14 border-b border-white/10 bg-[#101a31]/54 backdrop-blur-2xl">
        <div className="mx-auto flex h-full max-w-[1640px] items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white ring-1 ring-white/15">
              S
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Second AI</p>
              <p className="text-[11px] text-slate-300/70">Askable AI Portfolio</p>
            </div>
          </Link>
          <div className="rounded-full border border-cyan-200/24 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-slate-200 shadow-sm backdrop-blur-xl">
            <span className="text-cyan-100">{ownerPreview ? "Owner 预览中" : "受控访问中"}</span>
            <span className="mx-2 text-slate-400">·</span>
            当前访客 {visitorEmail}
          </div>
        </div>
      </header>

      <div
        className={`profile-enter relative z-10 mx-auto grid h-[calc(100vh-56px)] max-w-[1640px] gap-5 px-5 py-5 transition-[grid-template-columns] duration-500 ${
          panelOpen ? "grid-cols-[minmax(0,1fr)_430px]" : "grid-cols-[minmax(0,1fr)_58px]"
        }`}
      >
        <section className={`panel-rise flex min-h-0 flex-col rounded-[32px] p-4 ${glassPanel}`}>
          <div className="hidden">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/86">
                AI Conversation
              </p>
              <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight text-white">
                向 {displayProfile.name} 提问
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-100/88">
                {displayProfile.identity}
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-200/70">
                {displayProfile.bio}
              </p>
            </div>
            <p className="max-w-xs pt-8 text-right text-xs leading-5 text-slate-200/66">
              AI 只基于已授权资料回答，并给出对应证据。
            </p>
          </div>

          <section className="flex min-h-0 flex-1 flex-col rounded-[28px] bg-[#1b2d49]/68 p-5 ring-1 ring-white/12 backdrop-blur-2xl">
            <div ref={chatScrollRef} className="subtle-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="space-y-5">
                {chatMessages.map((message, index) =>
                  message.role === "user" ? (
                    <div
                      key={`${message.role}-${index}`}
                      className="ml-auto max-w-[52%] rounded-2xl bg-cyan-300/16 px-4 py-3 text-sm leading-6 text-cyan-50 ring-1 ring-cyan-200/10"
                    >
                      {message.text}
                    </div>
                  ) : (
                    <article
                      key={`${message.role}-${index}`}
                      className="max-w-[78%] rounded-3xl bg-white/[0.10] p-5 ring-1 ring-white/[0.06]"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-200 text-[11px] font-bold text-slate-950">
                          AI
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Second AI 回答</p>
                          <p className="text-[11px] text-slate-300/76">回答来自授权资料</p>
                        </div>
                      </div>
                      <p
                        className={`whitespace-pre-wrap text-[15px] leading-8 ${
                          message.isError ? "text-rose-100" : "text-slate-100/88"
                        }`}
                      >
                        {message.text}
                      </p>

                      <div className="mt-5 rounded-2xl bg-white/[0.065] p-4 ring-1 ring-white/[0.06]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300/70">
                          Sources
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-white">来源引用</h3>
                        {message.sources && message.sources.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {message.sources.map((source) => (
                              <div
                                key={`${source.asset_id}-${source.asset_title}`}
                                className="rounded-2xl bg-white/[0.065] p-3 text-xs leading-5 text-slate-200/80"
                              >
                                <p className="font-semibold text-slate-50">{source.asset_title}</p>
                                <p className="mt-1">{source.quote || source.reason}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-300/70">暂无可引用来源。</p>
                        )}
                      </div>

                      {message.cards && message.cards.length > 0 ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {message.cards.map((card) => {
                            const asset = assetById.get(card.asset_id);

                            return (
                              <div
                                key={`${card.asset_id}-${card.title}`}
                                className="rounded-2xl bg-cyan-100/[0.07] p-3 ring-1 ring-cyan-100/10"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-semibold text-white">{card.title}</p>
                                    <p className="mt-1 text-[11px] text-cyan-100/72">
                                      {card.type || asset?.fileType}
                                    </p>
                                  </div>
                                  {asset ? (
                                    <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-1 text-[10px] text-cyan-100 ring-1 ring-white/10">
                                      {permissionText(asset.visibility)}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-slate-200/74">
                                  {card.summary || card.reason || asset?.summary}
                                </p>
                                {asset ? (
                                  <div className="mt-3 flex gap-2">
                                    <AssetOpenButtons asset={asset} onOpen={setPreviewAsset} />
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {message.followUps && message.followUps.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.followUps.map((question) => (
                            <button
                              key={question}
                              onClick={() => setInput(question)}
                              className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] text-slate-200 transition hover:bg-white/[0.14]"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ),
                )}

                {isPending ? (
                  <article className="max-w-[60%] rounded-3xl bg-white/[0.08] p-5 text-sm text-slate-200 ring-1 ring-white/[0.06]">
                    AI 正在根据授权资料生成回答...
                  </article>
                ) : null}
              </div>
            </div>

            <div className="mt-4 shrink-0 border-t border-white/10 pt-3">
              <div className="mb-2 flex items-center gap-2 overflow-hidden">
                <span className="mr-1 shrink-0 text-xs font-semibold text-cyan-100/90">
                  你可以这样问
                </span>
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => setInput(question)}
                    className="shrink-0 rounded-full bg-white/[0.10] px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-white/[0.18] hover:text-white"
                  >
                    {question}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pb-1">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") ask();
                  }}
                  className="h-14 flex-1 rounded-2xl bg-white/[0.12] px-5 text-sm text-white outline-none transition placeholder:text-slate-300/66 focus:bg-white/[0.16]"
                  placeholder="问任何关于项目、作品、能力或转型经历的问题"
                />
                <button
                  onClick={() => ask()}
                  disabled={isPending || !input.trim()}
                  className="rounded-2xl bg-cyan-200 px-8 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "生成中" : "发送"}
                </button>
              </div>
            </div>
          </section>
        </section>

        <aside className="panel-rise min-h-0 [animation-delay:160ms]">
          {panelOpen ? (
            <section className={`flex h-full flex-col rounded-[32px] p-5 ${glassPanel}`}>
              <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/85">
                    Card / Access / Profile
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">相关资料</h2>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="rounded-full bg-white/[0.10] px-3 py-1 text-xs text-slate-100 ring-1 ring-white/12 transition hover:bg-white/[0.16]"
                >
                  收起
                </button>
              </div>

              <div className="subtle-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <section className="rounded-3xl bg-white/[0.12] p-4 ring-1 ring-white/12 backdrop-blur-xl">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                    Card
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.12] text-lg font-semibold text-white ring-1 ring-white/16">
                      {displayProfile.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xl font-semibold tracking-tight text-white">
                        {displayProfile.name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-200/70">
                        {displayProfile.identity}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-slate-200/76">{displayProfile.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {displayProfile.abilityTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/[0.10] px-2 py-1 text-[11px] text-slate-100 ring-1 ring-white/12"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl bg-white/[0.09] p-4 ring-1 ring-white/12 backdrop-blur-xl">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                    Access
                  </p>
                  <p className="text-sm font-semibold text-white">访问与隐私</p>
                  <div className="mt-3 space-y-2 text-xs leading-5 text-slate-200/74">
                    <p>{ownerPreview ? "当前为资料主人预览模式。" : "当前为受控访问，访客需要登录并获得邀请。"}</p>
                    <p>{displayProfile.privacyNotice}</p>
                  </div>
                </section>

                <section>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                    Profile
                  </p>
                  <div className="space-y-3">
                    {relatedAssets.length > 0 ? (
                      relatedAssets.map((asset) => (
                        <article
                          key={asset.id}
                          className="rounded-3xl bg-white/[0.11] p-4 ring-1 ring-white/12 backdrop-blur-xl"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold leading-5 text-white">
                                {asset.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-200/68">
                                {fileTypeLabel(asset.fileType)} · {asset.fileName}
                              </p>
                            </div>
                            <span className="rounded-full bg-cyan-300/12 px-2 py-1 text-[11px] text-cyan-100 ring-1 ring-cyan-200/14">
                              {permissionText(asset.visibility)}
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-200/76">
                            {asset.summary}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {asset.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white/[0.09] px-2 py-1 text-[11px] text-slate-200/74 ring-1 ring-white/12"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {openAssetId === asset.id ? (
                            <div className="mt-3 rounded-2xl bg-white/[0.08] p-3 text-xs leading-5 text-slate-100/82 ring-1 ring-white/10">
                              <p className="font-semibold text-cyan-100">解析摘要</p>
                              <p className="mt-1">{asset.summary}</p>
                              <p className="mt-2 text-slate-300/72">
                                {asset.visibility === "show"
                                  ? "该资料已允许展示和下载。"
                                  : "该资料允许 AI 回答并可打开查看，但不提供下载。"}
                              </p>
                            </div>
                          ) : null}

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() =>
                                setOpenAssetId((current) => (current === asset.id ? null : asset.id))
                              }
                              className="flex-1 rounded-2xl bg-white/[0.10] px-3 py-2 text-xs font-semibold text-slate-100 ring-1 ring-white/12 transition hover:bg-white/[0.16]"
                            >
                              {openAssetId === asset.id ? "收起解析" : "查看详情"}
                            </button>
                            <AssetOpenButtons asset={asset} onOpen={setPreviewAsset} />
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-3xl bg-white/[0.08] p-4 text-sm leading-6 text-slate-200/72 ring-1 ring-white/10">
                        暂无已公开或授权给访客使用的资料。私密资料不会在这里展示。
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </section>
          ) : (
            <button
              onClick={() => setPanelOpen(true)}
              className={`flex h-full w-full flex-col items-center justify-center gap-3 rounded-[24px] transition hover:bg-[#344960]/82 ${glassPanel}`}
            >
              <span className="text-lg">›</span>
              <span className="text-xs font-semibold tracking-[0.2em] [writing-mode:vertical-rl]">
                相关资料
              </span>
            </button>
          )}
        </aside>
      </div>
      {previewAsset ? (
        <AssetPreviewModal asset={previewAsset} token={token} onClose={() => setPreviewAsset(null)} />
      ) : null}
    </main>
  );
}
