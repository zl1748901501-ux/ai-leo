from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


SRC_PDF = Path(r"J:\作品\简历\简历.pdf")
OUT_DIR = Path(r"C:\Users\张龙\Desktop\AI产品经理简历")
OUT_PDF = OUT_DIR / "张龙_AI产品经理_原版风格简历.pdf"
WORK_DIR = Path(r"G:\codex项目\Second AI\app\tmp\resume_original_style")
PAGE_W, PAGE_H = A4


def render_source() -> Path:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    pdf = pdfium.PdfDocument(str(SRC_PDF))
    page = pdf[0]
    bitmap = page.render(scale=2.5)
    image = bitmap.to_pil().convert("RGB")
    out = WORK_DIR / "source.png"
    image.save(out)
    return out


def crop_assets(source: Path) -> tuple[Path, Path]:
    image = Image.open(source).convert("RGB")
    photo = image.crop((70, 285, 434, 762))
    qr = image.crop((1148, 42, 1310, 257))
    photo_path = WORK_DIR / "photo.png"
    qr_path = WORK_DIR / "qr.png"
    photo.save(photo_path)
    qr.save(qr_path)
    return photo_path, qr_path


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("MSYH", r"C:\Windows\Fonts\msyh.ttc"))
    pdfmetrics.registerFont(TTFont("MSYHBD", r"C:\Windows\Fonts\msyhbd.ttc"))


def draw_text(c: canvas.Canvas, x: float, y: float, text: str, size=9, font="MSYH", color=colors.black):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, y, text)


def draw_wrapped(c: canvas.Canvas, x: float, y: float, text: str, max_chars: int, line_h: float, size=9, font="MSYH"):
    lines: list[str] = []
    current = ""
    for ch in text:
        current += ch
        if len(current) >= max_chars:
            lines.append(current)
            current = ""
    if current:
        lines.append(current)
    for line in lines:
        draw_text(c, x, y, line, size=size, font=font)
        y -= line_h
    return y


def section(c: canvas.Canvas, icon: str, cn: str, en: str, y: float):
    c.setStrokeColor(colors.black)
    c.setLineWidth(1.2)
    c.line(232, y + 17, 565, y + 17)
    c.setFillColor(colors.black)
    c.circle(220, y + 2, 8, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("MSYHBD", 7)
    c.drawCentredString(220, y - 0.5, icon)
    draw_text(c, 234, y - 6, cn, 16, "MSYHBD")
    draw_text(c, 338, y - 2, f"/ {en}", 7.5, "MSYHBD")


def build_pdf():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    source = render_source()
    photo_path, qr_path = crop_assets(source)
    register_fonts()

    c = canvas.Canvas(str(OUT_PDF), pagesize=A4)
    c.setFillColor(colors.white)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Left visual column, matching the original black sidebar.
    c.setFillColor(colors.black)
    c.rect(31, 0, 166, 496, stroke=0, fill=1)
    c.rect(31, 803, 166, 39, stroke=0, fill=1)

    draw_text(c, 32, 748, "ZHANGLONG", 37, "MSYHBD")
    draw_text(c, 32, 716, "张龙", 20, "MSYHBD")
    c.drawImage(str(photo_path), 31, 496, width=166, height=216, preserveAspectRatio=False, mask="auto")
    c.setFillColor(colors.black)
    c.rect(31, 454, 166, 42, stroke=0, fill=1)

    # Portfolio QR area.
    draw_text(c, 430, 779, "作", 17, "MSYHBD")
    draw_text(c, 430, 755, "品", 17, "MSYHBD")
    draw_text(c, 430, 731, "集", 17, "MSYHBD")
    c.line(457, 781, 457, 729)
    c.drawImage(str(qr_path), 465, 722, width=98, height=98, preserveAspectRatio=True, mask="auto")

    # Left sidebar content.
    white = colors.white
    muted = colors.HexColor("#F1F5F9")
    draw_text(c, 48, 457, "个人信息", 17, "MSYHBD", white)
    left_y = 420
    for label, value in [
        ("性别：", "男"),
        ("生日：", "2002.11.16"),
        ("毕业院校：", "川音成都美术学院"),
        ("研究方向：", "AI 产品与数字媒体"),
    ]:
        draw_text(c, 48, left_y, label, 10.5, "MSYHBD", muted)
        left_y -= 18
        draw_text(c, 48, left_y, value, 11, "MSYHBD", white)
        left_y -= 26
    c.setStrokeColor(white)
    c.setLineWidth(0.8)
    c.line(48, left_y + 8, 174, left_y + 8)
    left_y -= 28
    draw_text(c, 48, left_y, "联系方式", 17, "MSYHBD", white)
    left_y -= 36
    for label, value in [
        ("电话：", "15937126737"),
        ("地址：", "河南省郑州市"),
        ("微信：", "zllll_0216"),
        ("邮箱：", "1748901501@qq.com"),
    ]:
        draw_text(c, 48, left_y, label, 10.5, "MSYHBD", muted)
        left_y -= 18
        draw_text(c, 48, left_y, value, 11, "MSYH", white)
        left_y -= 27

    # Right column content.
    section(c, "学", "教育背景", "EDUCATIONAL BACKGROUND", 688)
    draw_text(c, 232, 651, "2021.9", 10, "MSYH")
    draw_text(c, 232, 634, "-", 10, "MSYH")
    draw_text(c, 232, 617, "2024.06", 10, "MSYH")
    c.line(286, 611, 286, 660)
    draw_text(c, 303, 650, "四川华新现代职业技术学院  数字艺术专业  专科", 11.5, "MSYHBD")
    draw_text(c, 303, 627, "主修课程：场景建模、场景原画、人物设计、剪辑等", 10.5, "MSYH")

    draw_text(c, 232, 585, "2024.9", 10, "MSYH")
    draw_text(c, 232, 568, "-", 10, "MSYH")
    draw_text(c, 232, 551, "2026.06", 10, "MSYH")
    c.line(286, 545, 286, 594)
    draw_text(c, 303, 584, "川音成都美术学院  数字媒体艺术专业  本科", 11.5, "MSYHBD")
    draw_text(c, 303, 561, "主修课程：数字项目设计与制作、项目策划、数字产品创新型设计等", 9.6, "MSYH")

    section(c, "项", "项目经历", "PROJECT EXPERIENCE", 512)
    draw_text(c, 232, 478, "2026.06", 9.5, "MSYH")
    draw_text(c, 232, 461, "-", 9.5, "MSYH")
    draw_text(c, 232, 444, "2026.07", 9.5, "MSYH")
    c.line(286, 397, 286, 487)
    draw_text(c, 303, 478, "Second AI 个人 AI Workspace / AI 作品主页", 11.2, "MSYHBD")
    y = 455
    project_lines = [
        "完成产品定位、PRD、原型设计和 MVP 验收，面向 AI 产品经理方向进行产品实践。",
        "设计资料上传、AI 解析、资产库、权限设置、邀请访问、访客问答与证据卡片闭环。",
        "梳理三档权限，控制资料进入回答、展示和下载边界，并用前端原型、Supabase、DeepSeek API 落地。",
    ]
    for item in project_lines:
        y = draw_wrapped(c, 303, y, f"· {item}", 36, 12, 8.0, "MSYH")
        y -= 1

    section(c, "技", "个人技能", "PERSONAL SKILL", 356)
    skill_y = 322
    skills = [
        "AI 产品能力：PRD 撰写、需求拆解、用户流程、信息架构、权限设计、原型验收",
        "AI 工具理解：DeepSeek API、AI 解析、访客问答、OCR/视觉识别边界、提示词约束",
        "产品技术协作：Next.js、TypeScript、Tailwind CSS、Supabase 数据库/存储",
        "视觉与内容能力：作品集包装、交互原型、PS、AI、PR、AE、三维场景与 UE 场景搭建",
    ]
    for item in skills:
        skill_y = draw_wrapped(c, 232, skill_y, item, 42, 13, 8.9, "MSYH")

    section(c, "荣", "个人荣誉", "PERSONAL HONOR", 205)
    draw_text(c, 232, 169, "2022", 9.8, "MSYH")
    draw_text(c, 232, 153, "-", 9.8, "MSYH")
    draw_text(c, 232, 137, "2026", 9.8, "MSYH")
    c.line(286, 125, 286, 179)
    honors = [
        "2023 香港大学生当代设计银奖和铜奖",
        "2023 第五届日本概念艺术设计一个银奖两个铜奖",
        "2023 ROCA 平面与空间设计两个金级铜奖一个优秀奖",
        "2022-2023 国家励志奖学金",
    ]
    honor_y = 169
    for item in honors:
        draw_text(c, 303, honor_y, item, 9.6, "MSYH")
        honor_y -= 14

    section(c, "岗", "意向岗位", "INTENDED POSITION", 74)
    draw_text(c, 232, 36, "AI 产品经理、AI 产品实习生、AIGC 产品助理", 11, "MSYHBD")

    c.showPage()
    c.save()
    return OUT_PDF


if __name__ == "__main__":
    print(build_pdf())
