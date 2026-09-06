"""Shared fixtures: a build directory holding a frontend and the site's own faces."""

from __future__ import annotations

import io
import shutil
from pathlib import Path

import pytest
from PIL import Image

from tools.seo.fonts import BODY_FONT_FILE, DISPLAY_FONT_FILE, FontBook
from tools.seo.tests.fixtures import INDEX_HTML

#: Directory the repository serves its self-hosted webfonts from.
PUBLIC_FONTS = Path(__file__).resolve().parents[3] / "frontend" / "public" / "fonts"


@pytest.fixture(scope="session")
def fonts() -> FontBook:
    """The card's faces, loaded from the repository's own font files."""
    return FontBook.load(PUBLIC_FONTS.parent)


@pytest.fixture
def build_dir(tmp_path: Path) -> Path:
    """A build directory holding an index.html, the webfonts and a profile photo."""
    root = tmp_path / "build"
    (root / "fonts").mkdir(parents=True)
    (root / "images").mkdir()

    (root / "index.html").write_text(INDEX_HTML, encoding="utf-8")
    for name in (DISPLAY_FONT_FILE, BODY_FONT_FILE):
        shutil.copyfile(PUBLIC_FONTS.parent / name, root / name)

    (root / "images" / "sam-profile.jpg").write_bytes(jpeg_bytes())
    return root


def jpeg_bytes(color: str = "#ff0000", size: tuple[int, int] = (600, 400)) -> bytes:
    """A solid JPEG, standing in for the deployment's profile photo."""
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format="JPEG")
    return buffer.getvalue()
