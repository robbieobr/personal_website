"""Draws the 1200x630 social card: circular photo on the left, name, role, a
skills line and the domain along the bottom.

The card is set in the site's own webfonts, read out of the built frontend.
Without a usable photo the text column takes the full width instead.
"""

from __future__ import annotations

import io
from collections.abc import Callable, Sequence
from functools import partial
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont, ImageOps

WIDTH = 1200
HEIGHT = 630

#: Distance every drawn element keeps from the edges.
SAFE_MARGIN = 60

COLORS = {
    "background": "#0d1f36",
    "name": "#f5f7fa",
    "role": "#c8d3e0",
    "accent": "#2ec4c6",
    "domain": "#8fa3bd",
}

#: Site faces, relative to the directory the built frontend serves them from.
DISPLAY_FONT_FILE = "fonts/cormorant-garamond-latin.woff2"
BODY_FONT_FILE = "fonts/dm-sans-latin.woff2"

#: The photo, and the factor its mask and ring are drawn at before being scaled
#: down, which smooths their edges.
PHOTO_DIAMETER, PHOTO_LEFT, PHOTO_TOP, RING_WIDTH = 300, 90, 165, 6
SUPERSAMPLE = 4

#: Where the text column starts, with a photo beside it and without one.
TEXT_LEFT_WITH_PHOTO, TEXT_LEFT_ALONE = 460, SAFE_MARGIN
TEXT_RIGHT = WIDTH - SAFE_MARGIN

#: Largest and smallest size the name and the role are set at.
NAME_SIZES, ROLE_SIZES = (84, 44), (40, 26)
SKILLS_SIZE, DOMAIN_SIZE, DOMAIN_TRACKING = 28, 24, 3

#: Baseline of the name, with a photo beside it and without one, and the
#: baselines of the lines below it.
NAME_BASELINE_WITH_PHOTO, NAME_BASELINE_ALONE = 258, 268
ROLE_OFFSET, SKILLS_OFFSET, DOMAIN_BASELINE = 60, 108, 552

#: Skills joined into the line under the role.
SKILLS_SHOWN, SKILLS_SEPARATOR = 3, " · "

ELLIPSIS = "…"

Font = ImageFont.FreeTypeFont


def truetype_bytes(path: Path) -> bytes | None:
    """The TrueType bytes of a woff2 file, which FreeType cannot read directly."""
    try:
        font = TTFont(io.BytesIO(path.read_bytes()))
        font.flavor = None
        buffer = io.BytesIO()
        font.save(buffer)
        return buffer.getvalue()
    except Exception:
        return None


def face(source: bytes | None, size: int, weight: int = 400) -> Font:
    """A face at `size`, instanced at `weight`, falling back to the font Pillow bundles."""
    if source is not None:
        try:
            font = ImageFont.truetype(io.BytesIO(source), size)
            font.set_variation_by_axes([weight])
            return font
        except OSError:
            pass

    return ImageFont.load_default(size=size)


def text_width(content: str, font: Font, tracking: int = 0) -> float:
    """The advance width of `content` in `font`, with `tracking` between glyphs."""
    if not content:
        return 0.0
    if tracking:
        return sum(font.getlength(char) for char in content) + tracking * (len(content) - 1)

    return font.getlength(content)


def shorten(content: str, max_width: float, font: Font, tracking: int = 0) -> str:
    """`content` cut back to a trailing ellipsis when it does not fit `max_width`."""
    if text_width(content, font, tracking) <= max_width:
        return content

    clipped = content
    while len(clipped) > 1 and text_width(clipped + ELLIPSIS, font, tracking) > max_width:
        clipped = clipped[:-1]

    return clipped.rstrip() + ELLIPSIS


def fit(content: str, max_width: float, sizes: tuple[int, int], load: Callable[..., Font]):
    """The text and the face to draw so a line fills `max_width` without passing it."""
    largest, smallest = sizes

    for size in range(largest, smallest, -1):
        font = load(size)
        if text_width(content, font) <= max_width:
            return content, font

    font = load(smallest)
    return shorten(content, max_width, font), font


def skills_line(skills: Sequence[str], max_width: float, font: Font) -> str:
    """As many leading skills as fit the width, or an empty string when none do."""
    for count in range(min(SKILLS_SHOWN, len(skills)), 0, -1):
        line = SKILLS_SEPARATOR.join(skills[:count])
        if text_width(line, font) <= max_width:
            return line

    return ""


def draw_tracked(
    draw: ImageDraw.ImageDraw, left: int, baseline: int, content: str, font: Font, fill: str
) -> None:
    """Draws `content` one glyph at a time so `DOMAIN_TRACKING` sits between them."""
    for index, char in enumerate(content):
        if index:
            left += DOMAIN_TRACKING
        draw.text((left, baseline), char, font=font, fill=fill, anchor="ls")
        left += font.getlength(char)


def circular_photo(photo: bytes) -> Image.Image | None:
    """The photo cropped to a circle of the card's diameter, inside the accent ring.

    Anything that is not a decodable image reads as no photo at all.
    """
    try:
        source = Image.open(io.BytesIO(photo))
        source.load()
        circle = ImageOps.fit(
            source.convert("RGB"), (PHOTO_DIAMETER, PHOTO_DIAMETER), Image.LANCZOS
        ).convert("RGBA")
    except Exception:
        return None

    size = PHOTO_DIAMETER * SUPERSAMPLE
    inset = RING_WIDTH * SUPERSAMPLE // 2
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse(
        (inset, inset, size - 1 - inset, size - 1 - inset),
        outline=COLORS["accent"],
        width=RING_WIDTH * SUPERSAMPLE,
    )

    scaled = (PHOTO_DIAMETER, PHOTO_DIAMETER)
    circle.putalpha(mask.resize(scaled, Image.LANCZOS))
    circle.alpha_composite(ring.resize(scaled, Image.LANCZOS))
    return circle


def render_card(
    name: str, role: str, skills: Sequence[str], host: str, photo: bytes | None, assets_dir: Path
) -> bytes:
    """Renders the card as a PNG, in the faces `assets_dir` serves."""
    display = partial(face, truetype_bytes(assets_dir / DISPLAY_FONT_FILE), weight=700)
    body = partial(face, truetype_bytes(assets_dir / BODY_FONT_FILE))
    circle = circular_photo(photo) if photo else None

    card = Image.new("RGBA", (WIDTH, HEIGHT), COLORS["background"])
    if circle is not None:
        card.alpha_composite(circle, (PHOTO_LEFT, PHOTO_TOP))

    left = TEXT_LEFT_WITH_PHOTO if circle is not None else TEXT_LEFT_ALONE
    width = TEXT_RIGHT - left
    top = NAME_BASELINE_WITH_PHOTO if circle is not None else NAME_BASELINE_ALONE
    draw = ImageDraw.Draw(card)

    name_text, name_font = fit(name, width, NAME_SIZES, display)
    draw.text((left, top), name_text, font=name_font, fill=COLORS["name"], anchor="ls")

    role_text, role_font = fit(role, width, ROLE_SIZES, body)
    draw.text(
        (left, top + ROLE_OFFSET), role_text, font=role_font, fill=COLORS["role"], anchor="ls"
    )

    skills_font = body(SKILLS_SIZE, weight=600)
    line = skills_line(skills, width, skills_font)
    if line:
        draw.text(
            (left, top + SKILLS_OFFSET), line, font=skills_font, fill=COLORS["accent"], anchor="ls"
        )

    domain_font = body(DOMAIN_SIZE, weight=500)
    domain = shorten(host.upper(), width, domain_font, DOMAIN_TRACKING)
    draw_tracked(draw, left, DOMAIN_BASELINE, domain, domain_font, COLORS["domain"])

    output = io.BytesIO()
    card.convert("RGB").save(output, format="PNG", optimize=True)
    return output.getvalue()
