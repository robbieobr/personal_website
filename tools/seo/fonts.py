"""Loads the site's own webfonts for the social card.

The site self-hosts its faces as woff2. FreeType does not read woff2, so
fontTools decompresses each file to a TrueType font in memory and Pillow renders
from that. Both faces are variable on a single `wght` axis, so a face is
instanced at the weight it is drawn at. A face that cannot be read falls back to
a system sans, then to the font Pillow bundles.
"""

from __future__ import annotations

import io
from collections.abc import Callable
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import ImageFont

#: Site faces, relative to the directory the built frontend serves them from.
DISPLAY_FONT_FILE = "fonts/cormorant-garamond-latin.woff2"
BODY_FONT_FILE = "fonts/dm-sans-latin.woff2"

#: System sans faces tried when a site face is unreadable.
FALLBACK_FONT_FILES = (
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/Library/Fonts/Arial.ttf",
)

Font = ImageFont.FreeTypeFont


def decompress_woff2(data: bytes) -> bytes:
    """Returns the TrueType bytes of a woff2 file."""
    font = TTFont(io.BytesIO(data))
    font.flavor = None

    buffer = io.BytesIO()
    font.save(buffer)
    return buffer.getvalue()


def _fallback_face(size: int) -> Font:
    for path in FALLBACK_FONT_FILES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue

    return ImageFont.load_default(size=size)


class FontBook:
    """Serves the card's faces at a requested size and weight.

    `display` is the face the site sets headings in and `body` is the face it
    sets everything else in.
    """

    def __init__(self, display: bytes | None, body: bytes | None) -> None:
        self._sources = {"display": display, "body": body}
        self._cache: dict[tuple[str, int, int], Font] = {}

    @classmethod
    def load(cls, assets_dir: Path, log: Callable[[str], None] = lambda _message: None) -> FontBook:
        """Reads the site's faces out of the directory the built frontend serves them from."""

        def read(name: str, relative: str) -> bytes | None:
            # Any face that is absent, not woff2 or not decompressible falls back.
            try:
                return decompress_woff2((assets_dir / relative).read_bytes())
            except Exception as error:
                log(f"{relative} is not usable as a {name} face ({error}); falling back")
                return None

        return cls(read("display", DISPLAY_FONT_FILE), read("body", BODY_FONT_FILE))

    def _face(self, role: str, size: int, weight: int) -> Font:
        key = (role, size, weight)
        cached = self._cache.get(key)
        if cached is not None:
            return cached

        source = self._sources[role]
        face: Font | None = None

        if source is not None:
            try:
                face = ImageFont.truetype(io.BytesIO(source), size)
                face.set_variation_by_axes([weight])
            except OSError:
                face = face or _fallback_face(size)

        self._cache[key] = face or _fallback_face(size)
        return self._cache[key]

    def display(self, size: int, weight: int = 700) -> Font:
        """The heading face at `size`, instanced at `weight`."""
        return self._face("display", size, weight)

    def body(self, size: int, weight: int = 400) -> Font:
        """The body face at `size`, instanced at `weight`."""
        return self._face("body", size, weight)
