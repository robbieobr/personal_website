"""Draws the 1200x630 social card: circular photo on the left, name, role, a
skills line and the domain along the bottom.

When no photo is available the text column takes the full width instead.
"""

from __future__ import annotations

import io
from collections.abc import Callable
from dataclasses import dataclass

from PIL import Image, ImageDraw, ImageOps

from .fonts import Font, FontBook
from .metadata import SiteMetadata

OG_WIDTH = 1200
OG_HEIGHT = 630

#: Distance every drawn element keeps from the edges.
SAFE_MARGIN = 60

OG_COLORS = {
    "background": "#0d1f36",
    "name": "#f5f7fa",
    "role": "#c8d3e0",
    "accent": "#2ec4c6",
    "domain": "#8fa3bd",
}

PHOTO_DIAMETER = 300
PHOTO_LEFT = 90
PHOTO_TOP = 165
PHOTO_RING_WIDTH = 6

TEXT_LEFT_WITH_PHOTO = 460
TEXT_LEFT_ALONE = SAFE_MARGIN
TEXT_RIGHT = OG_WIDTH - SAFE_MARGIN

NAME_MAX_SIZE = 84
NAME_MIN_SIZE = 44
ROLE_MAX_SIZE = 40
ROLE_MIN_SIZE = 26
SKILLS_SIZE = 28
DOMAIN_SIZE = 24
DOMAIN_LETTER_SPACING = 3
DOMAIN_BASELINE = 552

NAME_BASELINE_WITH_PHOTO = 258
NAME_BASELINE_ALONE = 268
ROLE_OFFSET = 60
SKILLS_OFFSET = 48

#: Skills joined into the line under the role.
SKILLS_SHOWN = 3
SKILLS_SEPARATOR = " · "

ELLIPSIS = "…"

#: Returns the face a line is set in at a requested size.
FaceLoader = Callable[[int], Font]

#: Factor the ring and the photo mask are drawn at before being scaled down, which
#: smooths their edges.
SUPERSAMPLE = 4


def text_width(content: str, font: Font, letter_spacing: int = 0) -> float:
    """The advance width of `content` in `font`, with `letter_spacing` between glyphs."""
    if not content:
        return 0.0

    if letter_spacing:
        glyphs = sum(font.getlength(char) for char in content)
        return glyphs + letter_spacing * (len(content) - 1)

    return font.getlength(content)


def fit_font_size(
    content: str, max_width: float, max_size: int, min_size: int, face: FaceLoader
) -> int:
    """The largest size in the range at which `content` fits `max_width`."""
    for size in range(max_size, min_size, -1):
        if text_width(content, face(size)) <= max_width:
            return size

    return min_size


def truncate_to_width(content: str, max_width: float, font: Font, letter_spacing: int = 0) -> str:
    """Shortens `content` with a trailing ellipsis until it fits `max_width`."""
    if text_width(content, font, letter_spacing) <= max_width:
        return content

    clipped = content
    while len(clipped) > 1 and text_width(clipped + ELLIPSIS, font, letter_spacing) > max_width:
        clipped = clipped[:-1]

    return clipped.rstrip() + ELLIPSIS


@dataclass(frozen=True)
class FittedText:
    """A line as it is drawn: the text that fits and the face it is set in."""

    text: str
    font: Font
    font_size: int


def fit_text(
    content: str, max_width: float, max_size: int, min_size: int, face: FaceLoader
) -> FittedText:
    """The text and size to draw so a line fills the available width without passing it."""
    size = fit_font_size(content, max_width, max_size, min_size, face)
    font = face(size)
    return FittedText(text=truncate_to_width(content, max_width, font), font=font, font_size=size)


def fit_skills_line(skills: tuple[str, ...] | list[str], max_width: float, font: Font) -> str:
    """Joins as many leading skills as fit the available width, or an empty string if none do."""
    for count in range(min(SKILLS_SHOWN, len(skills)), 0, -1):
        line = SKILLS_SEPARATOR.join(skills[:count])
        if text_width(line, font) <= max_width:
            return line

    return ""


def draw_tracked_text(
    draw: ImageDraw.ImageDraw,
    position: tuple[int, int],
    content: str,
    font: Font,
    fill: str,
    letter_spacing: int,
) -> None:
    """Draws `content` one glyph at a time so `letter_spacing` sits between them."""
    x, baseline = position

    for char in content:
        draw.text((x, baseline), char, font=font, fill=fill, anchor="ls")
        x += font.getlength(char) + letter_spacing


def circular_photo(photo: bytes) -> Image.Image:
    """Crops the photo to a circle of the card's photo diameter."""
    source = Image.open(io.BytesIO(photo))
    source.load()

    cropped = ImageOps.fit(
        source.convert("RGB"), (PHOTO_DIAMETER, PHOTO_DIAMETER), Image.LANCZOS, centering=(0.5, 0.5)
    )

    scale = PHOTO_DIAMETER * SUPERSAMPLE
    mask = Image.new("L", (scale, scale), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, scale - 1, scale - 1), fill=255)

    circle = cropped.convert("RGBA")
    circle.putalpha(mask.resize((PHOTO_DIAMETER, PHOTO_DIAMETER), Image.LANCZOS))
    return circle


def draw_photo_ring(card: Image.Image) -> None:
    """Draws the accent ring that sits on the edge of the photo."""
    scale = SUPERSAMPLE
    ring = Image.new("RGBA", (OG_WIDTH * scale, OG_HEIGHT * scale), (0, 0, 0, 0))
    inset = PHOTO_RING_WIDTH / 2

    ImageDraw.Draw(ring).ellipse(
        (
            int((PHOTO_LEFT + inset) * scale),
            int((PHOTO_TOP + inset) * scale),
            int((PHOTO_LEFT + PHOTO_DIAMETER - inset) * scale),
            int((PHOTO_TOP + PHOTO_DIAMETER - inset) * scale),
        ),
        outline=OG_COLORS["accent"],
        width=PHOTO_RING_WIDTH * scale,
    )

    card.alpha_composite(ring.resize((OG_WIDTH, OG_HEIGHT), Image.LANCZOS))


def render_og_image(metadata: SiteMetadata, photo: bytes | None, fonts: FontBook) -> bytes:
    """Renders the card as a PNG.

    A photo that cannot be decoded is dropped and the text-only layout is used.
    """
    circle: Image.Image | None = None
    if photo:
        try:
            circle = circular_photo(photo)
        # Any photo that is absent, not an image or truncated drops to the text-only card.
        except Exception:
            circle = None

    card = Image.new("RGBA", (OG_WIDTH, OG_HEIGHT), OG_COLORS["background"])

    if circle is not None:
        card.alpha_composite(circle, (PHOTO_LEFT, PHOTO_TOP))
        draw_photo_ring(card)

    left = TEXT_LEFT_WITH_PHOTO if circle is not None else TEXT_LEFT_ALONE
    width = TEXT_RIGHT - left
    draw = ImageDraw.Draw(card)

    name = fit_text(metadata.name, width, NAME_MAX_SIZE, NAME_MIN_SIZE, fonts.display)
    role = fit_text(metadata.job_title, width, ROLE_MAX_SIZE, ROLE_MIN_SIZE, fonts.body)

    name_baseline = NAME_BASELINE_WITH_PHOTO if circle is not None else NAME_BASELINE_ALONE
    role_baseline = name_baseline + ROLE_OFFSET
    skills_baseline = role_baseline + SKILLS_OFFSET

    draw.text((left, name_baseline), name.text, font=name.font, fill=OG_COLORS["name"], anchor="ls")
    draw.text((left, role_baseline), role.text, font=role.font, fill=OG_COLORS["role"], anchor="ls")

    skills_font = fonts.body(SKILLS_SIZE, weight=600)
    skills_line = fit_skills_line(metadata.skills, width, skills_font)
    if skills_line:
        draw.text(
            (left, skills_baseline),
            skills_line,
            font=skills_font,
            fill=OG_COLORS["accent"],
            anchor="ls",
        )

    domain_font = fonts.body(DOMAIN_SIZE, weight=500)
    draw_tracked_text(
        draw,
        (left, DOMAIN_BASELINE),
        truncate_to_width(metadata.host.upper(), width, domain_font, DOMAIN_LETTER_SPACING),
        domain_font,
        OG_COLORS["domain"],
        DOMAIN_LETTER_SPACING,
    )

    output = io.BytesIO()
    card.convert("RGB").save(output, format="PNG", optimize=True)
    return output.getvalue()
