import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

ROOT = Path(os.path.abspath(__file__)).parents[2]
DATA_PATH = ROOT / "data"
SOURCE_PATH = ROOT / "animals"
BACKEND_PATH = SOURCE_PATH / "backend"

EMAIL = "donskoi.ae@gmail.com"
DATE_FORMAT = "%Y.%m.%d %H:%M:%S"

@dataclass
class Logo:
    PATH: Path = DATA_PATH / "logo.png"
    WIDTH: int = 1680 // 8
    HEIGHT: int = 701 // 8
    H_ALIGN: Literal["LEFT", "CENTER", "CENTRE", "RIGHT", 0, 1, 2] = "CENTER"


@dataclass
class Font:
    NAME: str = "DejaVuSans"
    PATH: Path = DATA_PATH / "DejaVuSans.ttf"

