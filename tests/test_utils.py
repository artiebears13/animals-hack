import pandas as pd
import pytest

from animals.backend.utils import BoundingBoxConverter


@pytest.fixture
def sample_data_yolo():
    # Sample data in YOLO format for testing
    return pd.DataFrame({
        "Bbox": ["100,100,50,50", "150,150,60,60", "200,200,70,70"]
    })

@pytest.fixture
def expected_coco():
    return pd.DataFrame({
        "COCO": ["75.0_75.0_50.0_50.0", "120.0_120.0_60.0_60.0", "165.0_165.0_70.0_70.0"]
    })

@pytest.fixture
def expected_pascal_voc():
    return pd.DataFrame({
        "PascalVOC": ["75.0_75.0_125.0_125.0", "120.0_120.0_180.0_180.0", "165.0_165.0_235.0_235.0"]
    })

@pytest.fixture
def expected_yolo():
    return pd.DataFrame({
        "YOLO": ["100.0_100.0_50.0_50.0", "150.0_150.0_60.0_60.0", "200.0_200.0_70.0_70.0"]
    })

def test_yolo_to_coco(sample_data_yolo, expected_coco):
    converter = BoundingBoxConverter(sample_data_yolo, input_format="YOLO")
    result = converter.convert("COCO")
    pd.testing.assert_frame_equal(result.reset_index(drop=True), expected_coco)

def test_yolo_to_pascal_voc(sample_data_yolo, expected_pascal_voc):
    converter = BoundingBoxConverter(sample_data_yolo, input_format="YOLO")
    result = converter.convert("PascalVOC")
    pd.testing.assert_frame_equal(result.reset_index(drop=True), expected_pascal_voc)

def test_yolo_to_yolo(sample_data_yolo, expected_yolo):
    converter = BoundingBoxConverter(sample_data_yolo, input_format="YOLO")
    result = converter.convert("YOLO")
    pd.testing.assert_frame_equal(result.reset_index(drop=True), expected_yolo)

def test_invalid_input_format(sample_data_yolo):
    with pytest.raises(ValueError, match="Unsupported input format"):
        BoundingBoxConverter(sample_data_yolo, input_format="INVALID")

def test_invalid_target_format(sample_data_yolo):
    converter = BoundingBoxConverter(sample_data_yolo, input_format="YOLO")
    with pytest.raises(ValueError, match="Unsupported target format"):
        converter.convert("INVALID")
