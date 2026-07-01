from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUT_DIR = Path(r"C:\Users\张龙\Desktop\AI产品经理简历")
OUT_PATH = OUT_DIR / "张龙_AI产品经理_简历.pdf"


def p(text: str, style: ParagraphStyle):
    return Paragraph(text.replace("\n", "<br/>"), style)


def bullet(text: str, style: ParagraphStyle):
    return p(f"• {text}", style)


def section(text: str, styles):
    return [Spacer(1, 4), p(text, styles["Section"]), Spacer(1, 2)]


def build_pdf():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))

    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=A4,
        rightMargin=13 * mm,
        leftMargin=13 * mm,
        topMargin=11 * mm,
        bottomMargin=10 * mm,
    )

    styles = getSampleStyleSheet()
    base = "STSong-Light"
    styles.add(
        ParagraphStyle(
            name="Name",
            fontName=base,
            fontSize=20,
            leading=23,
            alignment=1,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Sub",
            fontName=base,
            fontSize=9.5,
            leading=12,
            alignment=1,
            textColor=colors.HexColor("#1D4ED8"),
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Contact",
            fontName=base,
            fontSize=8.5,
            leading=10,
            alignment=1,
            textColor=colors.HexColor("#475569"),
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            fontName=base,
            fontSize=11,
            leading=13,
            textColor=colors.HexColor("#1D4ED8"),
            borderColor=colors.HexColor("#DBEAFE"),
            borderWidth=0,
            borderPadding=0,
            spaceBefore=3,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyCN",
            fontName=base,
            fontSize=8.4,
            leading=11.2,
            textColor=colors.HexColor("#1E293B"),
            spaceAfter=1.5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="LineTitle",
            fontName=base,
            fontSize=9.2,
            leading=11,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=1,
        )
    )

    story = [
        p("张龙", styles["Name"]),
        p("AI 产品经理 / AI 产品实习生 / 2026 届数字媒体艺术应届生", styles["Sub"]),
        p("电话：15937126737  |  微信：zllll_0216  |  邮箱：1748901501@qq.com  |  现居：河南郑州", styles["Contact"]),
    ]

    story += section("求职优势", styles)
    for item in [
        "数字媒体艺术背景，具备视觉表达、作品集包装、用户体验和内容呈现能力，正在转向 AI 产品经理方向。",
        "独立推进 Second AI 从产品定位、PRD、原型设计到可运行 MVP 的完整闭环，理解 AI SaaS 的资料上传、AI 解析、权限控制、访客问答和证据展示流程。",
        "熟悉用 AI 编程工具协作实现产品原型，能把需求拆成页面、状态、数据表、权限规则和验收标准，并持续根据体验问题迭代。",
    ]:
        story.append(bullet(item, styles["BodyCN"]))

    story += section("项目经历", styles)
    story.append(p("<b>Second AI - 隐私优先的个人 AI Workspace / 可被提问的 AI 作品主页</b>　2026.06 - 2026.07", styles["LineTitle"]))
    for item in [
        "项目定位：面向个人用户的 AI SaaS 原型，用户上传简历、PDF、Word、图片、视频和作品资料后，AI 进行理解、摘要、标签和问答；访客通过受控邀请进入 AI Profile，与 AI 对话了解资料主人。",
        "核心问题：传统网盘只存储不理解，普通聊天机器人缺少长期资料管理和受控展示；Second AI 将资料管理、AI 理解、作品集展示和访客问答组合成个人 AI 工作空间。",
        "主要工作：完成产品定位、MVP 范围、页面信息架构、Owner/Visitor 双端流程、权限规则、邀请 Token 校验、资料状态和 AI 问答边界设计。",
        "功能闭环：实现登录注册、Dashboard、上传中心、资产库、资产详情、AI 主页生成、访问权限、访客 AI 主页、无权限页等核心页面。",
        "AI 能力：接入 DeepSeek 进行资料解析和访客问答；设计 private / answer_only / show 三档权限，确保 AI 只基于授权资料回答，并展示来源引用和相关资料卡片。",
        "技术协作：使用 Next.js、TypeScript、Tailwind CSS、Supabase Auth/Database/Storage、DeepSeek API，借助 AI 编程工具完成可演示版本并进行多轮验收。",
    ]:
        story.append(bullet(item, styles["BodyCN"]))

    story.append(p("<b>数字媒体作品与三维场景实践</b>　2021 - 2026", styles["LineTitle"]))
    for item in [
        "围绕场景建模、场景原画、人物设计、剪辑、数字虚拟空间可视化等方向完成课程与作品实践。",
        "熟悉 3D 建模、PBR 流程、UE 场景搭建和视觉表达，能够将视觉叙事能力迁移到 AI 产品原型、作品展示和交互体验设计中。",
    ]:
        story.append(bullet(item, styles["BodyCN"]))

    story += section("教育背景", styles)
    edu_table = Table(
        [
            [p("<b>川音成都美术学院 | 数字媒体艺术 | 本科</b>", styles["BodyCN"]), p("2024.09 - 2026.06", styles["BodyCN"])],
            [p("主修：数字项目设计与制作、数字虚拟空间可视化、项目策划、数字产品创新型设计等。", styles["BodyCN"]), ""],
            [p("<b>四川华新现代职业技术学院 | 数字艺术 | 专科</b>", styles["BodyCN"]), p("2021.09 - 2024.06", styles["BodyCN"])],
            [p("主修：场景建模、场景原画、人物设计、剪辑等。", styles["BodyCN"]), ""],
        ],
        colWidths=[130 * mm, 35 * mm],
    )
    edu_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    story.append(edu_table)

    story += section("实践经历", styles)
    for item in [
        "校内实践：参与工作室 Logo、海报宣发、展板设计；参与创建校内比赛“鹦鹉螺杯”。",
        "活动执行：参与开学典礼、元旦晚会等活动策划、视觉物料、场景布置和人员分工。",
        "校外实践：参与四川省青少年语言艺术展示活动比赛项目会场执行；参与颂果传媒拍摄、剪辑、策划和人员分配工作。",
    ]:
        story.append(bullet(item, styles["BodyCN"]))

    story += section("技能", styles)
    for item in [
        "产品能力：PRD 撰写、信息架构、用户流程、权限设计、原型设计、功能验收、AI 产品场景拆解。",
        "AI/技术理解：DeepSeek API、Supabase Auth/Database/Storage、Next.js 原型协作、AI 解析、访客问答、OCR/视觉识别边界。",
        "设计与内容：作品集包装、视觉表达、交互原型、PS、AI、PR、AE。",
        "三维与引擎：3ds Max、ZBrush、TopoGun、Substance 3D、Marmoset Toolbag、Unreal Engine。",
    ]:
        story.append(bullet(item, styles["BodyCN"]))

    story += section("荣誉奖项", styles)
    for item in [
        "2023 香港大学生当代设计银奖、铜奖；2022-2023 第五届日本概念艺术设计银奖、铜奖。",
        "2023 ROCA 平面与空间设计金级、铜奖、优秀奖；2022-2023 国家励志奖学金。",
    ]:
        story.append(bullet(item, styles["BodyCN"]))

    doc.build(story)
    return OUT_PATH


if __name__ == "__main__":
    print(build_pdf())
