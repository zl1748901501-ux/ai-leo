export type AssetPermission = "私密" | "仅回答" | "可展示";

export type Asset = {
  id: string;
  title: string;
  filename: string;
  type: "PRD" | "原型文档" | "简历" | "视频" | "图片";
  status: "解析完成" | "AI 分析中" | "等待处理";
  permission: AssetPermission;
  summary: string;
  detail: string;
  proof: string;
  citationReason: string;
  tags: string[];
  questions: string[];
};

export const owner = {
  name: "Isabella",
  role: "26届数字媒体艺术应届生",
  subRole: "AI 产品经理候选人 / Second AI 项目创建者",
  email: "owner@second.ai",
  bio: "从数字媒体创作者出发，探索 AI 产品如何重新组织个人作品与能力表达。",
  longBio:
    "具备数字媒体艺术、视觉设计、UE 场景、建模和剪辑背景，正在通过 Second AI 项目探索 AI 产品设计与落地能力。",
  tags: ["AI 产品设计", "原型设计", "视觉表达", "RAG", "权限系统"],
};

export const assets: Asset[] = [
  {
    id: "prd",
    title: "Second AI 产品 PRD",
    filename: "Second AI PRD.pdf",
    type: "PRD",
    status: "解析完成",
    permission: "可展示",
    summary: "面向个人展示场景的受控访问 AI 主页产品文档。",
    detail:
      "这份资料描述了 Second AI 的产品定位、目标用户、MVP 功能、AI 解析流程、受控邀请权限和访客问答体验。",
    proof: "证明产品定位、MVP 拆解、权限设计和 AI 问答闭环能力。",
    citationReason: "用于证明产品定位、MVP 拆解和权限设计能力。",
    tags: ["AI 产品设计", "RAG", "权限系统", "求职场景"],
    questions: [
      "Second AI 解决了什么问题？",
      "Second AI 和普通作品集有什么区别？",
      "Second AI 的权限机制是怎么设计的？",
      "这个项目体现了哪些 AI 产品能力？",
    ],
  },
  {
    id: "prototype",
    title: "Second AI 原型设计说明",
    filename: "Second AI 原型设计说明.docx",
    type: "原型文档",
    status: "解析完成",
    permission: "可展示",
    summary: "用于指导高保真原型设计的页面、交互和信息架构说明。",
    detail:
      "资料覆盖 Workspace、上传中心、资产详情、主页生成、分享权限、访客主页和无权限页面。",
    proof: "证明信息架构、交互流程、页面拆解和访客体验设计能力。",
    citationReason: "用于证明交互设计、页面规划和 AI Profile 体验能力。",
    tags: ["交互设计", "访客体验", "SaaS", "主页生成"],
    questions: [
      "这个原型包含哪些页面？",
      "访客主页应该如何展示证据卡片？",
      "下载申请流程怎么走？",
    ],
  },
  {
    id: "resume",
    title: "个人简历",
    filename: "Isabella Resume.pdf",
    type: "简历",
    status: "解析完成",
    permission: "仅回答",
    summary: "说明资料主人具备数字媒体艺术、视觉设计和 AI 产品经理候选人背景。",
    detail:
      "这份简历用于回答访客关于教育背景、项目经历、能力匹配和求职方向的问题。默认不直接展示原文件，需要申请下载。",
    proof: "证明数字媒体艺术背景、视觉表达能力和 AI 产品方向匹配度。",
    citationReason: "用于回答转型经历、能力匹配和求职方向问题。",
    tags: ["数字媒体艺术", "AI 产品经理候选人", "视觉设计"],
    questions: [
      "为什么适合 AI PM 岗位？",
      "她有哪些设计和视觉能力？",
      "她在这个项目中负责了哪些产品设计？",
    ],
  },
  {
    id: "demo-video",
    title: "AI 主页演示视频",
    filename: "second-ai-demo.mp4",
    type: "视频",
    status: "AI 分析中",
    permission: "私密",
    summary: "展示访客通过 AI 主页了解资料主人并查看证据卡片的演示视频。",
    detail:
      "当前阶段使用假数据模拟视频转写、关键帧识别和 AI 摘要。后续可接入真实视频理解流程。",
    proof: "证明产品演示、用户路径表达和 AI 展示结果组织能力。",
    citationReason: "用于说明访客如何通过 AI 主页查看资料和申请下载。",
    tags: ["视频", "AI 主页", "关键帧"],
    questions: ["视频里展示了哪些能力？", "访客如何申请资料下载？"],
  },
];

export const invitations = [
  {
    email: "hr@company.com",
    status: "已接受",
    expires: "2026-07-15",
    lastSeen: "今天 14:20",
  },
  {
    email: "mentor@example.com",
    status: "待接受",
    expires: "2026-07-08",
    lastSeen: "未访问",
  },
  {
    email: "client@studio.cn",
    status: "已撤销",
    expires: "2026-06-28",
    lastSeen: "昨天 18:10",
  },
];

export const downloadRequests = [
  {
    requester: "hr@company.com",
    asset: "个人简历",
    reason: "用于 AI 产品经理岗位初筛",
    status: "待审批",
    time: "今天 14:31",
  },
  {
    requester: "mentor@example.com",
    asset: "Second AI 产品 PRD",
    reason: "查看产品拆解深度并给出建议",
    status: "已同意",
    time: "昨天 20:18",
  },
];

export const visitorMessages = [
  {
    role: "user",
    text: "为什么 Isabella 适合 AI 产品经理？",
  },
  {
    role: "assistant",
    text:
      "根据已授权资料，Isabella 的匹配点主要有三点。第一，她具备数字媒体艺术和视觉设计背景，能够把抽象 AI 能力转成可理解的用户体验。第二，她通过 Second AI 项目完成了 PRD、权限机制、访客问答和证据卡片展示设计。第三，她对 RAG、上传解析、受控访问和下载审批有完整的产品闭环意识。",
  },
];
