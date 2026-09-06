"""Tests for writing the artefacts into a build directory, and for omitting them."""

from __future__ import annotations

import io
from pathlib import Path

import pytest
from PIL import Image

from tools.seo.generate import generate, read_profile_photo
from tools.seo.tests.conftest import jpeg_bytes
from tools.seo.tests.fixtures import (
    CADDYFILE,
    HOST,
    PLACEHOLDER_CADDYFILE,
    PLACEHOLDER_SEED_SQL,
    SEED_SQL,
)

ARTEFACTS = ("robots.txt", "sitemap.xml", "og-image.png")


@pytest.fixture
def sources(tmp_path: Path) -> tuple[Path, Path]:
    """A Caddyfile and a production seed holding real deployment values."""
    caddyfile = tmp_path / "Caddyfile"
    seed = tmp_path / "500_prod_seed.sql"
    caddyfile.write_text(CADDYFILE, encoding="utf-8")
    seed.write_text(SEED_SQL, encoding="utf-8")
    return caddyfile, seed


def run(build_dir: Path, caddyfile: Path, seed: Path, **kwargs):
    """Runs the generator, collecting the lines it logs."""
    logs: list[str] = []
    result = generate(build_dir, caddyfile, seed, log=logs.append, **kwargs)
    return result, logs


class TestGenerate:
    def test_writes_every_artefact(self, build_dir, sources):
        result, _ = run(build_dir, *sources)

        assert result.generated
        for name in ARTEFACTS:
            assert (build_dir / name).is_file()

    def test_names_the_host_it_generated_for(self, build_dir, sources):
        _, logs = run(build_dir, *sources)

        assert any(HOST in line for line in logs)

    def test_rewrites_the_document_head(self, build_dir, sources):
        run(build_dir, *sources)
        document = (build_dir / "index.html").read_text(encoding="utf-8")

        assert "<title>Sam O'Toole | Staff Platform Engineer</title>" in document
        assert f'<link rel="canonical" href="https://{HOST}/" />' in document
        assert "application/ld+json" in document

    def test_stamps_the_given_date_into_the_sitemap(self, build_dir, sources):
        run(build_dir, *sources, last_modified="2026-09-06")

        assert "<lastmod>2026-09-06</lastmod>" in (build_dir / "sitemap.xml").read_text()

    def test_stamps_the_day_of_the_run_by_default(self, build_dir, sources):
        from datetime import date

        run(build_dir, *sources)

        assert (
            f"<lastmod>{date.today().isoformat()}</lastmod>"
            in (build_dir / "sitemap.xml").read_text()
        )

    def test_renders_a_1200x630_card(self, build_dir, sources):
        run(build_dir, *sources)
        card = Image.open(io.BytesIO((build_dir / "og-image.png").read_bytes()))

        assert card.size == (1200, 630)

    def test_draws_the_seeded_photo_onto_the_card(self, build_dir, sources):
        run(build_dir, *sources)
        with_photo = (build_dir / "og-image.png").read_bytes()

        (build_dir / "images" / "sam-profile.jpg").unlink()
        run(build_dir, *sources)

        assert (build_dir / "og-image.png").read_bytes() != with_photo

    def test_leaves_the_same_output_on_a_rerun(self, build_dir, sources):
        run(build_dir, *sources, last_modified="2026-09-06")
        once = (build_dir / "index.html").read_text(encoding="utf-8")

        run(build_dir, *sources, last_modified="2026-09-06")

        assert (build_dir / "index.html").read_text(encoding="utf-8") == once


class TestOmission:
    def assert_omitted(self, build_dir: Path, result, logs: list[str]) -> None:
        assert not result.generated
        assert any("omitting" in line for line in logs)
        for name in ARTEFACTS:
            assert not (build_dir / name).exists()

    def test_omits_when_the_caddyfile_is_absent(self, build_dir, sources, tmp_path):
        _, seed = sources
        self.assert_omitted(build_dir, *run(build_dir, tmp_path / "nothing", seed))

    def test_omits_when_the_seed_is_absent(self, build_dir, sources, tmp_path):
        caddyfile, _ = sources
        self.assert_omitted(build_dir, *run(build_dir, caddyfile, tmp_path / "nothing"))

    def test_omits_when_the_caddyfile_is_a_placeholder(self, build_dir, sources, tmp_path):
        _, seed = sources
        caddyfile = tmp_path / "Caddyfile.placeholder"
        caddyfile.write_text(PLACEHOLDER_CADDYFILE, encoding="utf-8")

        self.assert_omitted(build_dir, *run(build_dir, caddyfile, seed))

    def test_omits_when_the_seed_is_a_placeholder(self, build_dir, sources, tmp_path):
        caddyfile, _ = sources
        seed = tmp_path / "seed.placeholder.sql"
        seed.write_text(PLACEHOLDER_SEED_SQL, encoding="utf-8")

        self.assert_omitted(build_dir, *run(build_dir, caddyfile, seed))

    def test_omits_when_the_caddyfile_is_a_directory(self, build_dir, sources, tmp_path):
        _, seed = sources
        unreadable = tmp_path / "as-a-directory"
        unreadable.mkdir()

        self.assert_omitted(build_dir, *run(build_dir, unreadable, seed))

    def test_omits_when_the_seed_is_not_utf8(self, build_dir, sources, tmp_path):
        caddyfile, _ = sources
        seed = tmp_path / "binary.sql"
        seed.write_bytes(b"\xff\xfe\x00binary")

        self.assert_omitted(build_dir, *run(build_dir, caddyfile, seed))

    def test_omits_when_the_build_holds_no_index(self, build_dir, sources):
        (build_dir / "index.html").unlink()

        self.assert_omitted(build_dir, *run(build_dir, *sources))

    def test_leaves_the_document_untouched(self, build_dir, sources, tmp_path):
        _, seed = sources
        before = (build_dir / "index.html").read_text(encoding="utf-8")

        run(build_dir, tmp_path / "nothing", seed)

        assert (build_dir / "index.html").read_text(encoding="utf-8") == before


class TestReadProfilePhoto:
    def test_reads_a_photo_the_build_holds(self, build_dir):
        assert read_profile_photo(build_dir, "images/sam-profile.jpg") == jpeg_bytes()

    def test_reads_a_photo_named_with_a_leading_slash(self, build_dir):
        assert read_profile_photo(build_dir, "/images/sam-profile.jpg") == jpeg_bytes()

    def test_returns_nothing_when_the_seed_names_no_photo(self, build_dir):
        assert read_profile_photo(build_dir, None) is None
        assert read_profile_photo(build_dir, "") is None

    def test_returns_nothing_when_the_photo_is_missing(self, build_dir):
        assert read_profile_photo(build_dir, "images/absent.jpg") is None

    @pytest.mark.parametrize("requested", ["../outside.jpg", "images/../../outside.jpg"])
    def test_refuses_a_path_outside_the_build(self, build_dir, requested):
        (build_dir.parent / "outside.jpg").write_bytes(jpeg_bytes())

        assert read_profile_photo(build_dir, requested) is None

    def test_refuses_a_symlink_that_leaves_the_build(self, build_dir):
        outside = build_dir.parent / "outside.jpg"
        outside.write_bytes(jpeg_bytes())
        (build_dir / "images" / "linked.jpg").symlink_to(outside)

        assert read_profile_photo(build_dir, "images/linked.jpg") is None
