"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const owner = {
  name: "Isabella",
  role: "26届数字媒体艺术应届生",
  subRole: "AI 产品经理候选人 / Second AI 项目创建者",
  intro: "从数字媒体创作者出发，探索 AI 产品如何重新组织个人作品与能力表达。",
  tags: ["AI 产品设计", "原型设计", "视觉表达", "RAG", "权限系统"],
};

const identityLine =
  "26届数字媒体艺术应届生 · AI 产品经理候选人 · Second AI 项目创建者";

const quickQuestions = [
  "为什么想转 AI 产品经理？",
  "Second AI 解决了什么问题？",
  "这个项目体现了哪些产品能力？",
  "设计背景如何帮助 AI 产品？",
];

const messages = [
  {
    role: "user",
    text: "为什么 Isabella 适合 AI 产品经理？",
  },
  {
    role: "assistant",
    text:
      "根据已授权资料，Isabella 的匹配点主要有三点。第一，她具备数字媒体艺术和视觉设计背景，能够把抽象 AI 能力转成可理解的用户体验。第二，她通过 Second AI 项目完成了 PRD、权限机制、访客问答和证据卡片展示设计。第三，她对 RAG、上传解析、受控访问和下载审批有完整的产品闭环意识。",
  },
  {
    role: "user",
    text: "这个项目里最能体现产品能力的是哪一部分？",
  },
  {
    role: "assistant",
    text:
      "最核心的是“受控访问的 AI 作品主页”这个闭环。它把资料上传、AI 理解、访客提问、证据卡片和权限边界连接在一起，不只是聊天，而是让作品、经历和能力可以被自然地查询、解释与展示。",
  },
];

const evidence = [
  {
    id: "prd",
    title: "Second AI 产品 PRD",
    type: "PRD",
    permission: "可展示",
    summary: "面向个人展示场景的受控访问 AI 主页产品文档。",
    proof: "证明产品定位、MVP 拆解、权限设计和 AI 问答闭环能力。",
    tags: ["AI 产品设计", "RAG"],
  },
  {
    id: "prototype",
    title: "Second AI 原型设计说明",
    type: "原型文档",
    permission: "可展示",
    summary: "用于指导高保真原型设计的页面、交互和信息架构说明。",
    proof: "证明信息架构、交互流程、页面拆解和访客体验设计能力。",
    tags: ["交互设计", "访客体验"],
  },
  {
    id: "resume",
    title: "个人简历",
    type: "简历",
    permission: "仅回答",
    summary: "说明资料主人具备数字媒体艺术、视觉设计和 AI 产品方向背景。",
    proof: "证明数字媒体艺术背景、视觉表达能力和 AI 产品方向匹配度。",
    tags: ["数字媒体", "AI PM"],
  },
  {
    id: "demo",
    title: "AI 主页演示视频",
    type: "视频",
    permission: "可申请",
    summary: "展示访客通过 AI 主页了解资料主人并查看证据卡片的流程。",
    proof: "证明产品演示、用户路径表达和 AI 展示结果组织能力。",
    tags: ["演示", "AI 主页"],
  },
];

const glassPanel =
  "border border-white/18 bg-[#243852]/72 text-white shadow-[0_24px_90px_rgba(3,7,18,0.28)] backdrop-blur-2xl";

export default function VisitorProfilePage() {
  const [input, setInput] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const answerEvidence = useMemo(() => evidence.slice(0, 3), []);

  return (
    <main className="relative h-screen overflow-hidden bg-[#101a31] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.34),transparent_31%),radial-gradient(circle_at_70%_6%,rgba(124,58,237,0.36),transparent_32%),radial-gradient(circle_at_88%_80%,rgba(219,39,119,0.24),transparent_30%),linear-gradient(135deg,#101a31_0%,#1e2350_48%,#12374f_100%)]" />
      <div className="ambient-shift pointer-events-none absolute -left-40 -top-40 h-[640px] w-[760px] rounded-full bg-blue-400/18 blur-3xl" />
      <div className="ambient-shift pointer-events-none absolute -right-36 bottom-[-220px] h-[700px] w-[780px] rounded-full bg-fuchsia-400/18 blur-3xl [animation-delay:1.4s]" />
      <div className="ambient-shift pointer-events-none absolute left-[34%] top-[-18%] h-[460px] w-[520px] rounded-full bg-cyan-300/14 blur-3xl [animation-delay:2.6s]" />
      <div className="float-object pointer-events-none absolute left-[3%] top-[22%] h-24 w-24 rounded-[32px] border border-white/10 bg-white/[0.04] opacity-35 blur-sm" />
      <div className="float-object pointer-events-none absolute right-[8%] top-[18%] h-20 w-20 rounded-full border border-cyan-100/10 bg-cyan-100/[0.05] opacity-35 blur-sm [animation-delay:1.2s]" />
      <div className="float-object pointer-events-none absolute bottom-[7%] left-[28%] h-24 w-24 rounded-[34px] border border-fuchsia-100/10 bg-fuchsia-100/[0.04] opacity-35 blur-sm [animation-delay:2.4s]" />
      <div className="drift-dot pointer-events-none absolute left-[8%] top-[55%] h-1.5 w-1.5 rounded-full bg-blue-300/35 blur-[1px]" />
      <div className="drift-dot pointer-events-none absolute left-[58%] top-[14%] h-1.5 w-1.5 rounded-full bg-fuchsia-300/35 blur-[1px] [animation-delay:1.5s]" />
      <div className="drift-dot pointer-events-none absolute right-[5%] bottom-[22%] h-1.5 w-1.5 rounded-full bg-cyan-300/35 blur-[1px] [animation-delay:2.7s]" />
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
            <span className="text-cyan-100">受控访问中</span>
            <span className="mx-2 text-slate-400">·</span>
            当前访客 hr@company.com
          </div>
        </div>
      </header>

      <div
        className={`profile-enter relative z-10 mx-auto grid h-[calc(100vh-56px)] max-w-[1640px] gap-5 px-5 py-5 transition-[grid-template-columns] duration-500 ${
          panelOpen
            ? "grid-cols-[minmax(0,1fr)_430px]"
            : "grid-cols-[minmax(0,1fr)_58px]"
        }`}
      >
        <section className={`panel-rise flex min-h-0 flex-col rounded-[32px] p-5 ${glassPanel}`}>
          <div className="mb-5 flex shrink-0 items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/86">
                AI Conversation
              </p>
              <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight text-white">
                向 Isabella 提问
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-100/88">
                {identityLine}
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-200/70">
                {owner.intro}
              </p>
            </div>
            <p className="max-w-xs pt-8 text-right text-xs leading-5 text-slate-200/66">
              AI 只基于已授权资料回答，并给出对应证据。
            </p>
          </div>

          <section className="flex min-h-0 flex-1 flex-col rounded-[28px] bg-[#1b2d49]/68 p-5 ring-1 ring-white/12 backdrop-blur-2xl">
            <div className="subtle-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="space-y-5">
                {messages.map((message, index) =>
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
                      className="max-w-[76%] rounded-3xl bg-white/[0.10] p-5 ring-1 ring-white/[0.06]"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-200 text-[11px] font-bold text-slate-950">
                          AI
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Second AI 回答</p>
                          <p className="text-[11px] text-slate-300/76">
                            回答来自已授权资料
                          </p>
                        </div>
                      </div>
                      <p className="text-[15px] leading-8 text-slate-100/88">
                        {message.text}
                      </p>
                    </article>
                  ),
                )}

                <section className="rounded-3xl bg-white/[0.075] p-4 ring-1 ring-white/[0.055]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300/70">
                        Evidence
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-white">回答依据</h3>
                    </div>
                    <span className="rounded-full bg-cyan-300/12 px-2.5 py-1 text-[11px] text-cyan-100">
                      {answerEvidence.length} 份资料
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {answerEvidence.map((asset) => (
                      <div key={asset.id} className="rounded-2xl bg-white/[0.065] p-3">
                        <p className="text-xs font-semibold leading-5 text-slate-100">
                          {asset.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-300/76">
                          {asset.proof}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
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
                  className="h-14 flex-1 rounded-2xl bg-white/[0.12] px-5 text-sm text-white outline-none transition placeholder:text-slate-300/66 focus:bg-white/[0.16]"
                  placeholder="问任何关于项目、作品、能力或转型经历的问题"
                />
                <button className="rounded-2xl bg-cyan-200 px-8 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">
                  发送
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
                      I
                    </div>
                    <div>
                      <p className="text-xl font-semibold tracking-tight text-white">
                        {owner.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-200/70">{owner.role}</p>
                      <p className="mt-2 text-sm font-semibold leading-5 text-white">
                        {owner.subRole}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-slate-200/76">{owner.intro}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {owner.tags.map((tag) => (
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
                    <p>当前为受控访问，访客需要登录并获得邀请。</p>
                    <p>AI 只读取授权资料，未授权内容不会进入回答。</p>
                  </div>
                </section>

                <section>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                    Profile
                  </p>
                  <div className="space-y-3">
                    {evidence.map((asset) => (
                      <article
                        key={asset.id}
                        className="rounded-3xl bg-white/[0.11] p-4 ring-1 ring-white/12 backdrop-blur-xl"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold leading-5 text-white">
                              {asset.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-200/68">{asset.type}</p>
                          </div>
                          <span className="rounded-full bg-cyan-300/12 px-2 py-1 text-[11px] text-cyan-100 ring-1 ring-cyan-200/14">
                            {asset.permission}
                          </span>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-slate-200/76">
                          {asset.summary}
                        </p>
                        <div className="mt-3 rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/10">
                          <p className="text-[11px] font-semibold text-slate-300/70">
                            证明能力
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-100/82">
                            {asset.proof}
                          </p>
                        </div>
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
                        <button className="mt-3 w-full rounded-2xl bg-white/[0.10] px-3 py-2 text-xs font-semibold text-slate-100 ring-1 ring-white/12 transition hover:bg-white/[0.16]">
                          查看详情
                        </button>
                      </article>
                    ))}
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
    </main>
  );
}
