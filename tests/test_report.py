from datetime import datetime
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest
from reportlab.lib.units import inch
from reportlab.platypus import Image, Paragraph, Table

from animals.backend.config import Font
from animals.backend.report import ImageReportPDF


@pytest.fixture
def sample_data():
    return pd.DataFrame({
        "Bbox": ["10,20,30,40", "50,60,70,80"],
        "Name": ["img1", "img2"],
        "Class": [0, 1]
    })

@pytest.fixture
def pdf_report(tmp_path, sample_data):
    print(tmp_path)
    file_path = tmp_path / "test_report.pdf"
    return ImageReportPDF(file_path, sample_data)

def test_prepare_data(sample_data):
    processed_data = ImageReportPDF.prepare_data(sample_data)
    assert "Название файла" in processed_data.columns
    assert "Ограничительная рамка" in processed_data.columns
    assert "Тип изображения" in processed_data.columns
    assert processed_data["Ограничительная рамка"][0] == "10.0, 20.0, 30.0, 40.0"
    assert processed_data["Тип изображения"].iloc[0] == "Вспомогательное"
    assert processed_data["Тип изображения"].iloc[1] == "Пригодное для анализа"

def test_setup_styles(pdf_report):
    pdf_report._setup_styles()
    assert pdf_report.title_style.name == "Title"
    assert pdf_report.title_style.fontName == Font.NAME
    assert pdf_report.title_style.fontSize == 18
    assert pdf_report.footer_style.fontSize == 8

def test_add_logo(pdf_report):
    pdf_report.add_logo()
    assert any(isinstance(element, Image) for element in pdf_report.elements)

def test_add_title(pdf_report):
    with patch("animals.backend.report.datetime") as mock_datetime:
        mock_datetime.today.return_value = datetime(2024, 1, 1)
        pdf_report.add_title()
        assert any(isinstance(element, Paragraph) for element in pdf_report.elements)
        assert pdf_report.elements[1].text == "Время выгрузки документа: 2024.01.01 00:00:00"

def test_add_bounds_note_text(pdf_report):
    pdf_report.add_bounds_note_text()
    # Ensure at least one Paragraph element was added for bounds note text
    assert any(
        isinstance(element, Paragraph) and
        element.text == "Ограничительная рамка в формате YOLO: x_center, y_center, width, height."
        for element in pdf_report.elements
    )


def test_add_table(pdf_report):
    pdf_report.add_table()
    table = next((el for el in pdf_report.elements if isinstance(el, Table)), None)
    assert table is not None
    assert len(table._cellvalues) > 0
    assert table._cellvalues[0] == ["Название файла", "Ограничительная рамка", "Тип изображения"]


def test_add_footer(pdf_report):
    canvas_mock = MagicMock()
    doc_mock = MagicMock()
    doc_mock.pagesize = (100, 200)  # Set a mock pagesize to prevent AttributeError
    pdf_report.add_footer(canvas_mock, doc_mock)
    canvas_mock.setFont.assert_called_with(Font.NAME, 8)
    canvas_mock.drawCentredString.assert_called_once_with(
        doc_mock.pagesize[0] / 2, 0.5 * inch,
        "При поддержке команды «AAA IT». Вопросы и предложения: donskoi.ae@gmail.com"
    )


def test_generate(pdf_report):
    with patch("animals.backend.report.SimpleDocTemplate.build") as mock_build:
        pdf_report.generate()
        assert mock_build.called
