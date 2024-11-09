import io
from datetime import datetime

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .config_report import DATE_FORMAT, EMAIL, Font, Logo

# Constants
PDF_MARGIN_TOP = 0.0 * inch
PDF_MARGIN_BOTTOM = 0.6 * inch
FOOTER_TEXT = f"При поддержке команды «AAA IT». Вопросы и предложения: {EMAIL}"
TITLE_TEXT = "Отчет по изображениям с фотоловушек"
BOUNDS_NOTE = "Ограничительная рамка в формате YOLO: x_center, y_center, width, height."

# Register font
pdfmetrics.registerFont(TTFont(Font.NAME, Font.PATH))


class ImageReportPDF:
    def __init__(self, file_path, data):
        self.file_path = file_path
        self.data = self.prepare_data(data)
        self.elements = []
        self.title_style, self.date_style, self.text_style, self.footer_style = self._setup_styles()

    @staticmethod
    def prepare_data(data):
        coords = data["Bbox"].str.split(",", expand=True).astype(float).round(3).astype(str)
        data["Bbox"] = coords[0] + ", " + coords[1] + ", " + coords[2] + ", " + coords[3]
        data.sort_values(by=["Name"], inplace=True)
        data = data[["Name", "Bbox", "Class"]]
        data["Class"] = data["Class"].map({0: "Вспомогательное", 1: "Пригодное для анализа"})
        data.columns = ["Название файла", "Ограничительная рамка", "Тип изображения"]
        return data

    @staticmethod
    def _setup_styles():
        title_style = ParagraphStyle(
            "Title", fontName=Font.NAME, fontSize=18, alignment=1, spaceAfter=12,
        )
        date_style = ParagraphStyle(
            "Date", fontName=Font.NAME, fontSize=10, alignment=2, spaceAfter=10,
        )
        text_style = ParagraphStyle(
            "BodyText", fontName=Font.NAME, fontSize=10, alignment=1,
        )
        footer_style = ParagraphStyle(
            "Footer", fontName=Font.NAME, fontSize=8, alignment=2,
        )
        return title_style, date_style, text_style, footer_style

    def add_logo(self):
        logo = Image(Logo.PATH, width=Logo.WIDTH, height=Logo.HEIGHT, hAlign=Logo.H_ALIGN)
        self.elements.append(logo)

    def add_title(self):
        title = Paragraph(TITLE_TEXT, self.title_style)
        self.elements.append(title)
        date_text = Paragraph(
            f"Время выгрузки документа: {datetime.today().strftime(DATE_FORMAT)}",
            self.date_style
        )
        self.elements.append(date_text)
        self.elements.append(Spacer(1, 0.2 * inch))

    def add_bounds_note_text(self):
        text = Paragraph(BOUNDS_NOTE, self.text_style)
        self.elements.append(text)
        self.elements.append(Spacer(1, 0.2 * inch))

    def add_table(self):
        table_data = [self.data.columns.tolist()] + self.data.values.tolist()
        table_width = A4[0] - 2 * inch
        col_width = table_width / len(self.data.columns)

        table = Table(table_data, colWidths=[col_width] * len(self.data.columns), repeatRows=1)
        table_style = TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
            ("FONTNAME", (0, 0), (-1, -1), Font.NAME),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ])

        for row_num, row in enumerate(table_data[1:], start=1):
            bg_color = colors.lightgoldenrodyellow if row[2] == "Пригодное для анализа" else colors.lightpink
            table_style.add("BACKGROUND", (0, row_num), (-1, row_num), bg_color)

        table.setStyle(table_style)
        self.elements.append(table)
        self.elements.append(Spacer(1, 0.5 * inch))

    @staticmethod
    def add_footer(canvas, doc):
        canvas.setFont(Font.NAME, 8)
        canvas.drawCentredString(doc.pagesize[0] / 2, 0.5 * inch, FOOTER_TEXT)

    def add_footer_later_pages(self, canvas, doc):
        canvas.saveState()
        canvas.translate(0, -0.3 * inch)
        self.add_footer(canvas, doc)

    def generate(self):
        pdf = SimpleDocTemplate(
            self.file_path, pagesize=A4,
            topMargin=PDF_MARGIN_TOP,
            bottomMargin=PDF_MARGIN_BOTTOM
        )

        self.add_logo()
        self.add_title()
        self.add_bounds_note_text()
        self.add_table()

        pdf.build(self.elements, onFirstPage=self.add_footer, onLaterPages=self.add_footer_later_pages)
        return  pdf