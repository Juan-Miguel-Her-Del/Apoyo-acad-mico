"""Export the five legal-review Markdown drafts as readable A4 PDFs.

Run: python scripts/export_legal_drafts.py
Requires ReportLab. The Markdown files in docs/ remain the source of truth.
"""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
SOURCES = [
    DOCS / "31-politica-tratamiento-datos-borrador.md",
    DOCS / "32-autorizacion-representante-borrador.md",
    DOCS / "33-informacion-privacidad-menores-borrador.md",
    DOCS / "34-terminos-condiciones-borrador.md",
    DOCS / "35-protocolo-seguridad-incidentes-borrador.md",
]

pdfmetrics.registerFont(TTFont("ArialDraft", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("ArialDraft-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
pdfmetrics.registerFontFamily("ArialDraft", normal="ArialDraft", bold="ArialDraft-Bold")

INK = colors.HexColor("#263348")
MUTED = colors.HexColor("#53647b")
ACCENT = colors.HexColor("#145c8a")
LINE = colors.HexColor("#d8e0e8")

STYLES = {
    "title": ParagraphStyle("title", fontName="ArialDraft-Bold", fontSize=17.5, leading=22,
                            textColor=INK, spaceAfter=13, keepWithNext=True),
    "h2": ParagraphStyle("h2", fontName="ArialDraft-Bold", fontSize=11.7, leading=15,
                         textColor=ACCENT, spaceBefore=12, spaceAfter=5, keepWithNext=True),
    "h3": ParagraphStyle("h3", fontName="ArialDraft-Bold", fontSize=10, leading=13,
                         textColor=INK, spaceBefore=9, spaceAfter=4, keepWithNext=True),
    "body": ParagraphStyle("body", fontName="ArialDraft", fontSize=9.1, leading=13.4,
                           textColor=INK, spaceAfter=8, allowWidows=0, allowOrphans=0),
    "list": ParagraphStyle("list", fontName="ArialDraft", fontSize=9.1, leading=13.4,
                           textColor=INK, leftIndent=16, firstLineIndent=-11, spaceAfter=4),
    "quote": ParagraphStyle("quote", fontName="ArialDraft", fontSize=9.2, leading=14,
                            textColor=INK, leftIndent=13, rightIndent=8, spaceAfter=5),
    "cell": ParagraphStyle("cell", fontName="ArialDraft", fontSize=7.7, leading=10.6,
                           textColor=INK, alignment=TA_LEFT),
    "cellhead": ParagraphStyle("cellhead", fontName="ArialDraft-Bold", fontSize=7.7,
                               leading=10.6, textColor=INK),
}

LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
CODE_RE = re.compile(r"`([^`]+)`")
BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")


def inline(markdown: str) -> str:
    """Render only the inline Markdown used by these five controlled sources."""
    parts: list[str] = []
    pos = 0
    for match in LINK_RE.finditer(markdown):
        parts.append(_inline_plain(markdown[pos:match.start()]))
        label = html.escape(match.group(1))
        target = match.group(2)
        if target.endswith(".md"):
            target = Path(target).with_suffix(".pdf").as_posix()
        parts.append(f'<link href="{html.escape(target, quote=True)}" color="#145c8a">{label}</link>')
        pos = match.end()
    parts.append(_inline_plain(markdown[pos:]))
    return "".join(parts)


def _inline_plain(value: str) -> str:
    value = html.escape(value)
    value = CODE_RE.sub(lambda m: f'<font face="ArialDraft">{m.group(1)}</font>', value)
    value = BOLD_RE.sub(lambda m: f"<b>{m.group(1)}</b>", value)
    return value


def table_flowable(lines: list[str], width: float) -> Table:
    rows: list[list[str]] = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        rows.append(cells)
    if not rows:
        raise ValueError("Empty Markdown table")
    columns = len(rows[0])
    if any(len(row) != columns for row in rows):
        raise ValueError("Inconsistent Markdown table columns")
    if columns == 3:
        widths = [width * 0.18, width * 0.39, width * 0.43]
    elif columns == 5:
        widths = [width * 0.22, width * 0.18, width * 0.13, width * 0.25, width * 0.22]
    else:
        widths = [width / columns] * columns
    data = [
        [Paragraph(inline(cell), STYLES["cellhead" if row_index == 0 else "cell"])
         for cell in row]
        for row_index, row in enumerate(rows)
    ]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT", splitByRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf2f8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, ACCENT),
        ("LINEBELOW", (0, 1), (-1, -2), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def flowables(source: str, width: float) -> list:
    lines = source.splitlines()
    result: list = []
    paragraph: list[str] = []

    def flush() -> None:
        if paragraph:
            result.append(Paragraph(inline(" ".join(paragraph)), STYLES["body"]))
            paragraph.clear()

    index = 0
    while index < len(lines):
        line = lines[index].strip()
        if not line:
            flush()
            index += 1
            continue
        if line.startswith("| "):
            flush()
            table_lines = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            result.append(table_flowable(table_lines, width))
            result.append(Spacer(1, 9))
            continue
        if line.startswith("# "):
            flush()
            result.append(Paragraph(inline(line[2:]), STYLES["title"]))
        elif line.startswith("## "):
            flush()
            result.append(Paragraph(inline(line[3:]), STYLES["h2"]))
        elif line.startswith("### "):
            flush()
            result.append(Paragraph(inline(line[4:]), STYLES["h3"]))
        elif line.startswith(">"):
            flush()
            quote = []
            while index < len(lines) and lines[index].strip().startswith(">"):
                content = lines[index].strip()[1:].strip()
                if content:
                    quote.append(content)
                index += 1
            result.append(Paragraph(inline(" ".join(quote)), STYLES["quote"]))
            continue
        elif line.startswith("- ") or re.match(r"\d+\. ", line):
            flush()
            match = re.match(r"(\d+)\. (.*)", line)
            if match:
                marker, content = match.groups()
                marker += "."
            else:
                marker, content = "•", line[2:]
            if content.startswith("[ ] "):
                marker, content = "□", content[4:]
            result.append(Paragraph(f"{marker}  {inline(content)}", STYLES["list"]))
        else:
            paragraph.append(line)
        index += 1
    flush()
    return result


def draw_furniture(canvas, doc) -> None:
    canvas.saveState()
    page_width, page_height = A4
    canvas.setStrokeColor(LINE)
    canvas.line(44, page_height - 42, page_width - 44, page_height - 42)
    canvas.setFont("ArialDraft-Bold", 8.2)
    canvas.setFillColor(MUTED)
    canvas.drawString(45, page_height - 35, "APOYO_ACADEMICO  ·  REVISIÓN JURÍDICA")
    canvas.line(44, 42, page_width - 44, 42)
    canvas.setFont("ArialDraft", 8)
    canvas.drawString(45, 30, "BORRADOR · 16 octubre 2026 · No aprobado para publicación")
    canvas.drawRightString(page_width - 45, 30, str(doc.page))
    canvas.restoreState()


def export(path: Path) -> Path:
    destination = path.with_suffix(".pdf")
    document = SimpleDocTemplate(
        str(destination), pagesize=A4, rightMargin=45, leftMargin=45,
        topMargin=57, bottomMargin=58, title=path.stem.replace("-", " "),
        author="Apoyo_academico", subject="Borrador para revisión jurídica",
        pageCompression=0,
    )
    document.build(flowables(path.read_text(encoding="utf-8"), document.width),
                   onFirstPage=draw_furniture, onLaterPages=draw_furniture)
    return destination


if __name__ == "__main__":
    for path in SOURCES:
        if not path.is_file():
            raise FileNotFoundError(path)
        output = export(path)
        print(f"{output.relative_to(ROOT)} ({output.stat().st_size:,} bytes)")
