"""Tests for the SEO generator: the path where it writes nothing, the values it
derives from a deployment's seed, and the social card's layout.
"""

from __future__ import annotations

import io
import json
import shutil
from pathlib import Path

import pytest
from PIL import Image, ImageChops

from generate_seo import main
from og_image import COLORS, HEIGHT, SAFE_MARGIN, WIDTH, render_card

PUBLIC_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public"

HOST = "sample-person.test"
PHOTO = "images/sam-profile.jpg"

SEED_SQL = f"""-- Production seed data
USE personal_website;

INSERT INTO users (name, title, profileImage, bio) VALUES
('Sam O''Toole', 'Staff Platform Engineer', '/{PHOTO}',
 'Sam builds resilient delivery platforms; previously a backend engineer.');

INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'phone', '(+353) 000 000 000', 1),
(1, 'email', 'sam@{HOST}', 2),
(1, 'website', 'https://www.{HOST}', 3),
(1, 'github', 'https://github.com/sample-person', 4);

INSERT INTO job_history (userId, company, position, startDate, endDate) VALUES
(1, 'Former Co', 'Engineer', '2016-01-01', '2020-12-31'),
(1, 'Petrichor Labs', 'Staff Platform Engineer', '2021-01-01', NULL);
INSERT INTO education (userId, institution, degree, startDate, endDate) VALUES
(1, 'Earlier College', 'Diploma', '2010-09-01', '2012-06-30'),
(1, 'Sample University', 'BSc', '2012-09-01', '2016-06-30');
INSERT INTO skills (userId, skill) VALUES
(1, 'Kubernetes'),
(1, 'Go'),
(1, 'Terraform');
"""

PLACEHOLDER_SEED_SQL = """INSERT INTO users (name, title, profileImage, bio) VALUES
('Your Name', 'Your Title', '/images/your-profile.png', 'A short bio about yourself.');

INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'email', 'you@example.com', 1);
"""

INDEX_HTML = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Personal Website</title>
  </head>
  <body><div id="root"></div></body>
</html>
"""


@pytest.fixture
def build_dir(tmp_path: Path) -> Path:
    """A built frontend: an index.html, the site's own webfonts and a profile photo."""
    root = tmp_path / "build"
    (root / "fonts").mkdir(parents=True)
    (root / "images").mkdir()

    (root / "index.html").write_text(INDEX_HTML, encoding="utf-8")
    for face in (PUBLIC_DIR / "fonts").glob("*.woff2"):
        shutil.copyfile(face, root / "fonts" / face.name)
    Image.new("RGB", (600, 400), "#a03c28").save(root / PHOTO)

    return root


@pytest.fixture
def seed(tmp_path: Path) -> Path:
    """A production seed naming an invented person."""
    path = tmp_path / "500_prod_seed.sql"
    path.write_text(SEED_SQL, encoding="utf-8")
    return path


def run(build_dir: Path, seed: Path, site_url: str = f"https://{HOST}") -> int:
    """Runs the generator over `build_dir` the way the image build does."""
    return main(["--build-dir", str(build_dir), "--seed", str(seed), "--site-url", site_url])


def drawn_bounds(png: bytes) -> tuple[int, int, int, int]:
    """Bounding box of every pixel that differs from the card background."""
    card = Image.open(io.BytesIO(png)).convert("RGB")
    ground = Image.new("RGB", card.size, COLORS["background"])
    difference = ImageChops.difference(card, ground).convert("L")
    bounds = difference.point(lambda value: 255 if value > 12 else 0).getbbox()
    assert bounds is not None, "card is blank: no pixel differs from the background"
    return bounds


class TestOmission:
    """Nothing is written and the run still succeeds when a source is unusable."""

    def assert_wrote_nothing(self, build_dir: Path, status: int) -> None:
        assert status == 0
        assert build_dir.joinpath("index.html").read_text(encoding="utf-8") == INDEX_HTML
        assert not build_dir.joinpath("robots.txt").exists()
        assert not build_dir.joinpath("sitemap.xml").exists()
        assert not build_dir.joinpath("og-image.png").exists()

    @pytest.mark.parametrize(
        "site_url",
        ["", "   ", "https://example.com", "www.example.org/", "yourdomain.com", "localhost"],
    )
    def test_omits_without_a_deployed_domain(self, build_dir, seed, site_url):
        self.assert_wrote_nothing(build_dir, run(build_dir, seed, site_url))

    def test_omits_when_the_seed_is_missing(self, build_dir, tmp_path):
        self.assert_wrote_nothing(build_dir, run(build_dir, tmp_path / "absent.sql"))

    def test_omits_while_the_seed_holds_the_template_placeholders(self, build_dir, seed):
        seed.write_text(PLACEHOLDER_SEED_SQL, encoding="utf-8")

        self.assert_wrote_nothing(build_dir, run(build_dir, seed))

    def test_reports_what_it_omitted(self, build_dir, seed, capsys):
        run(build_dir, seed, "")

        assert "omitting the SEO artefacts" in capsys.readouterr().out


class TestGeneratedArtefacts:
    def test_writes_the_head_the_crawler_files_and_the_card(self, build_dir, seed):
        assert run(build_dir, seed) == 0

        document = (build_dir / "index.html").read_text(encoding="utf-8")
        assert f'<link rel="canonical" href="https://{HOST}/" />' in document
        assert '<meta property="og:image" content="' in document
        assert "resilient delivery platforms" in document

        robots = (build_dir / "robots.txt").read_text(encoding="utf-8")
        assert robots.startswith("User-agent: *\nAllow: /\n")
        assert f"Sitemap: https://{HOST}/sitemap.xml" in robots

        assert f"<loc>https://{HOST}/</loc>" in (build_dir / "sitemap.xml").read_text("utf-8")
        assert Image.open(build_dir / "og-image.png").size == (WIDTH, HEIGHT)

    def test_describes_the_person_in_json_ld(self, build_dir, seed):
        run(build_dir, seed)

        document = (build_dir / "index.html").read_text(encoding="utf-8")
        payload = document.split('<script type="application/ld+json">')[1].split("</script>")[0]
        person = json.loads(payload.replace("\\u003c", "<"))["@graph"][0]

        assert person["name"] == "Sam O'Toole"
        assert person["jobTitle"] == "Staff Platform Engineer"
        assert person["email"] == f"mailto:sam@{HOST}"
        assert person["image"] == f"https://{HOST}/{PHOTO}"
        # The site's own address is the canonical URL, not a profile elsewhere.
        assert person["sameAs"] == ["https://github.com/sample-person"]
        # The open-ended role is the current one; the newest education row wins.
        assert person["worksFor"] == {"@type": "Organization", "name": "Petrichor Labs"}
        assert person["alumniOf"] == {
            "@type": "CollegeOrUniversity",
            "name": "Sample University",
        }

    def test_keeps_a_profile_whose_path_contains_the_site_host(self, build_dir, seed):
        """Only the site's own host is dropped from sameAs, not any URL mentioning it."""
        seed.write_text(
            SEED_SQL.replace(
                "'https://github.com/sample-person'",
                f"'https://github.com/sample-person/{HOST}-site'",
            ),
            encoding="utf-8",
        )
        run(build_dir, seed)

        document = (build_dir / "index.html").read_text(encoding="utf-8")
        payload = document.split('<script type="application/ld+json">')[1].split("</script>")[0]
        person = json.loads(payload.replace("\\u003c", "<"))["@graph"][0]
        assert person["sameAs"] == [f"https://github.com/sample-person/{HOST}-site"]

    @pytest.mark.parametrize("literal", ["'Sam O''Toole'", "'Sam O\\'Toole'"])
    def test_keeps_an_apostrophe_in_the_owner_name(self, build_dir, seed, literal):
        seed.write_text(SEED_SQL.replace("'Sam O''Toole'", literal), encoding="utf-8")
        run(build_dir, seed)

        document = (build_dir / "index.html").read_text(encoding="utf-8")
        assert "<title>Sam O'Toole | Staff Platform Engineer</title>" in document
        assert '<meta property="og:title" content="Sam O&#x27;Toole | Staff Platform Engineer"' in (
            document
        )

    def test_replaces_the_block_an_earlier_run_left(self, build_dir, seed):
        run(build_dir, seed)
        first = (build_dir / "index.html").read_text(encoding="utf-8")
        run(build_dir, seed)

        assert (build_dir / "index.html").read_text(encoding="utf-8") == first
        assert first.count("<!-- Generated by tools/seo -->") == 1
        assert first.count("<title>") == 1


class TestSocialCard:
    @pytest.mark.parametrize("with_photo", [True, False])
    def test_draws_inside_the_safe_margin(self, build_dir, with_photo):
        photo = (build_dir / PHOTO).read_bytes() if with_photo else None

        card = render_card(
            "Sam Fitzwilliam-Achterberg",
            "Principal Distributed Systems and Reliability Engineer",
            ("Kubernetes", "Go", "Terraform"),
            HOST,
            photo,
            build_dir,
        )

        left, top, right, bottom = drawn_bounds(card)
        assert left >= SAFE_MARGIN
        assert top >= SAFE_MARGIN
        assert right <= WIDTH - SAFE_MARGIN
        assert bottom <= HEIGHT - SAFE_MARGIN
