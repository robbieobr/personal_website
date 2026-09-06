"""Tests for the social card's layout, contrast and rendering."""

from __future__ import annotations

import io
from dataclasses import replace

import pytest
from PIL import Image

from tools.seo.og_image import (
    DOMAIN_LETTER_SPACING,
    NAME_MAX_SIZE,
    NAME_MIN_SIZE,
    OG_COLORS,
    OG_HEIGHT,
    OG_WIDTH,
    SAFE_MARGIN,
    SKILLS_SIZE,
    fit_font_size,
    fit_skills_line,
    fit_text,
    render_og_image,
    text_width,
    truncate_to_width,
)
from tools.seo.tests.conftest import jpeg_bytes
from tools.seo.tests.fixtures import METADATA


def luminance(hex_colour: str) -> float:
    """WCAG relative luminance of a #rrggbb colour."""
    channels = []
    for offset in (1, 3, 5):
        value = int(hex_colour[offset : offset + 2], 16) / 255
        channels.append(value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4)

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def contrast_ratio(foreground: str, background: str) -> float:
    """The WCAG contrast ratio between two #rrggbb colours."""
    light, dark = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (light + 0.05) / (dark + 0.05)


def drawn_bounds(png: bytes) -> tuple[int, int, int, int] | None:
    """Bounding box of every pixel that differs from the card background."""
    card = Image.open(io.BytesIO(png)).convert("RGB")
    ground = Image.new("RGB", card.size, OG_COLORS["background"])

    from PIL import ImageChops

    difference = ImageChops.difference(card, ground).convert("L")
    return difference.point(lambda value: 255 if value > 12 else 0).getbbox()


class TestColourContrast:
    @pytest.mark.parametrize("role", ["name", "role", "accent", "domain"])
    def test_clears_4_5_to_1_against_the_card_background(self, role):
        assert contrast_ratio(OG_COLORS[role], OG_COLORS["background"]) >= 4.5


class TestTextWidth:
    def test_is_zero_for_an_empty_string(self, fonts):
        assert text_width("", fonts.body(40)) == 0.0

    def test_grows_with_the_font_size(self, fonts):
        assert text_width("Sample", fonts.body(40)) > text_width("Sample", fonts.body(20))

    def test_gives_wide_glyphs_more_room_than_narrow_ones(self, fonts):
        font = fonts.body(40)

        assert text_width("mmmm", font) > text_width("llll", font)
        assert text_width("WWWW", font) > text_width("IIII", font)

    def test_adds_letter_spacing_between_glyphs_only(self, fonts):
        font = fonts.body(40)

        assert text_width("ab", font, 10) == pytest.approx(text_width("ab", font) + 10)


class TestFitFontSize:
    def test_keeps_the_largest_size_when_the_text_fits(self, fonts):
        assert fit_font_size("Sam", 1000, NAME_MAX_SIZE, NAME_MIN_SIZE, fonts.display) == 84

    def test_shrinks_text_that_does_not_fit(self, fonts):
        size = fit_font_size("Sam O'Toole", 300, NAME_MAX_SIZE, NAME_MIN_SIZE, fonts.display)

        assert NAME_MIN_SIZE <= size < NAME_MAX_SIZE

    def test_stops_at_the_smallest_size(self, fonts):
        assert fit_font_size("W" * 80, 300, NAME_MAX_SIZE, NAME_MIN_SIZE, fonts.display) == 44


class TestTruncateToWidth:
    def test_leaves_text_that_fits_alone(self, fonts):
        assert truncate_to_width("Sam", 1000, fonts.body(40)) == "Sam"

    def test_ends_overlong_text_with_an_ellipsis(self, fonts):
        font = fonts.body(40)
        clipped = truncate_to_width("Sam O'Toole of Northwind Platforms", 200, font)

        assert clipped.endswith("…")
        assert text_width(clipped, font) <= 200

    def test_keeps_at_least_one_character(self, fonts):
        assert truncate_to_width("abcdef", 1, fonts.body(40)) == "a…"

    def test_drops_a_trailing_space_before_the_ellipsis(self, fonts):
        assert not truncate_to_width("aaaa bbbb cccc", 60, fonts.body(40)).endswith(" …")

    def test_accounts_for_letter_spacing(self, fonts):
        font = fonts.body(24)

        assert len(truncate_to_width("abcdefgh", 100, font, 20)) < len(
            truncate_to_width("abcdefgh", 100, font)
        )


class TestFitText:
    def test_returns_the_text_and_the_size_it_is_drawn_at(self, fonts):
        fitted = fit_text("Sam", 1000, NAME_MAX_SIZE, NAME_MIN_SIZE, fonts.display)

        assert fitted.text == "Sam"
        assert fitted.font_size == NAME_MAX_SIZE

    def test_shortens_text_that_still_does_not_fit_at_the_smallest_size(self, fonts):
        fitted = fit_text("W" * 80, 400, NAME_MAX_SIZE, NAME_MIN_SIZE, fonts.display)

        assert fitted.font_size == NAME_MIN_SIZE
        assert text_width(fitted.text, fitted.font) <= 400


class TestFitSkillsLine:
    def test_joins_the_first_three_skills(self, fonts):
        line = fit_skills_line(METADATA.skills, 1000, fonts.body(SKILLS_SIZE))

        assert line == "Kubernetes · Go · Terraform"

    def test_drops_skills_that_do_not_fit(self, fonts):
        line = fit_skills_line(METADATA.skills, 200, fonts.body(SKILLS_SIZE))

        assert line == "Kubernetes"

    def test_returns_nothing_when_even_one_skill_does_not_fit(self, fonts):
        assert fit_skills_line(METADATA.skills, 10, fonts.body(SKILLS_SIZE)) == ""

    def test_returns_nothing_when_no_skill_is_seeded(self, fonts):
        assert fit_skills_line((), 1000, fonts.body(SKILLS_SIZE)) == ""


class TestRenderOgImage:
    def test_renders_a_1200x630_png(self, fonts):
        card = Image.open(io.BytesIO(render_og_image(METADATA, None, fonts)))

        assert card.format == "PNG"
        assert card.size == (OG_WIDTH, OG_HEIGHT)

    def test_draws_text_onto_the_background(self, fonts):
        card = Image.open(io.BytesIO(render_og_image(METADATA, None, fonts))).convert("L")

        assert sum(1 for value in card.getdata() if value > 120) > 1000

    def test_composites_the_photo_when_one_is_supplied(self, fonts):
        with_photo = render_og_image(METADATA, jpeg_bytes(), fonts)

        assert with_photo != render_og_image(METADATA, None, fonts)
        assert Image.open(io.BytesIO(with_photo)).convert("RGB").getpixel((240, 315))[0] > 200

    def test_falls_back_to_the_text_only_card_when_the_photo_cannot_be_decoded(self, fonts):
        broken = render_og_image(METADATA, b"not an image", fonts)

        assert broken == render_og_image(METADATA, None, fonts)

    @pytest.mark.parametrize("with_photo", [True, False], ids=["with a photo", "without a photo"])
    def test_keeps_every_drawn_pixel_inside_the_safe_margin(self, fonts, with_photo):
        card = render_og_image(METADATA, jpeg_bytes() if with_photo else None, fonts)
        box = drawn_bounds(card)

        assert box is not None
        left, top, right, bottom = box
        assert left >= SAFE_MARGIN
        assert top >= SAFE_MARGIN
        assert right <= OG_WIDTH - SAFE_MARGIN
        assert bottom <= OG_HEIGHT - SAFE_MARGIN

    @pytest.mark.parametrize("with_photo", [True, False], ids=["with a photo", "without a photo"])
    def test_keeps_overlong_values_inside_the_safe_margin(self, fonts, with_photo):
        metadata = replace(
            METADATA,
            name="Wilhelmina Wolfeschlegelsteinhausenbergerdorff-Wollemombi",
            job_title="Principal Distributed Systems and Developer Experience Engineer",
            skills=("A" * 40, "B" * 40, "C" * 40),
            host="an-extremely-long-hostname-for-a-personal-website.example-domain.test",
        )
        box = drawn_bounds(render_og_image(metadata, jpeg_bytes() if with_photo else None, fonts))

        assert box is not None
        left, top, right, bottom = box
        assert left >= SAFE_MARGIN
        assert top >= SAFE_MARGIN
        assert right <= OG_WIDTH - SAFE_MARGIN
        assert bottom <= OG_HEIGHT - SAFE_MARGIN

    def test_ellipsises_the_name_that_does_not_fit(self, fonts):
        metadata = replace(METADATA, name="Wilhelmina " + "Wolfeschlegelstein" * 4)
        fitted = fit_text(metadata.name, 680, NAME_MAX_SIZE, NAME_MIN_SIZE, fonts.display)

        assert fitted.text.endswith("…")

    def test_draws_the_domain_with_letter_spacing(self, fonts):
        font = fonts.body(24, weight=500)

        assert text_width(METADATA.host.upper(), font, DOMAIN_LETTER_SPACING) > text_width(
            METADATA.host.upper(), font
        )
