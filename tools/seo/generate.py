"""Writes the SEO artefacts into a directory holding a built frontend.

The head of `index.html` is rewritten in place and `robots.txt`, `sitemap.xml`
and `og-image.png` are added beside it. When the Caddyfile or the production seed
is missing, unreadable or still holds its template placeholders, nothing is
written and the caller carries on.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .caddyfile import parse_site_host
from .fonts import FontBook
from .metadata import (
    INDEX_FILE,
    OG_IMAGE_FILE,
    ROBOTS_FILE,
    SITEMAP_FILE,
    SiteMetadata,
    build_metadata,
    inject_head,
    render_robots_txt,
    render_sitemap_xml,
)
from .og_image import render_og_image
from .seed import parse_site_owner

#: Path of the Caddy configuration, relative to the repository root.
CADDYFILE_PATH = "Caddyfile"

#: Path of the production seed, relative to the repository root.
PROD_SEED_PATH = "database/prod-initdb.d/500_prod_seed.sql"

Log = Callable[[str], None]


@dataclass(frozen=True)
class Result:
    """The outcome of a run: the files written, or the reason none were."""

    written: tuple[str, ...] = ()
    omitted: str | None = None

    @property
    def generated(self) -> bool:
        """Whether the run produced artefacts."""
        return self.omitted is None


def read_text(path: Path) -> str | None:
    """The text of a file, or None when it is absent or unreadable."""
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def read_profile_photo(assets_dir: Path, profile_image: str | None) -> bytes | None:
    """Reads the profile photo the seed names, resolved inside the assets directory."""
    if not profile_image:
        return None

    requested = profile_image.lstrip("/")
    if not requested or Path(requested).is_absolute():
        return None

    root = assets_dir.resolve()
    path = (root / requested).resolve()
    if root != path and root not in path.parents:
        return None

    try:
        return path.read_bytes()
    except OSError:
        return None


def write_artefacts(
    build_dir: Path, metadata: SiteMetadata, last_modified: str, log: Log
) -> tuple[str, ...]:
    """Rewrites the document head and writes the crawler files and the social card."""
    index = build_dir / INDEX_FILE
    index.write_text(inject_head(index.read_text(encoding="utf-8"), metadata), encoding="utf-8")

    (build_dir / ROBOTS_FILE).write_text(render_robots_txt(metadata), encoding="utf-8")
    (build_dir / SITEMAP_FILE).write_text(
        render_sitemap_xml(metadata, last_modified), encoding="utf-8"
    )

    photo = read_profile_photo(build_dir, metadata.profile_image_path)
    card = render_og_image(metadata, photo, FontBook.load(build_dir, log))
    (build_dir / OG_IMAGE_FILE).write_bytes(card)

    return (INDEX_FILE, ROBOTS_FILE, SITEMAP_FILE, OG_IMAGE_FILE)


def generate(
    build_dir: Path,
    caddyfile: Path,
    seed: Path,
    last_modified: str | None = None,
    log: Log = print,
) -> Result:
    """Generates the artefacts into `build_dir`, or reports why it wrote nothing."""

    def omit(reason: str) -> Result:
        log(f"seo: omitting the SEO artefacts — {reason}")
        return Result(omitted=reason)

    if not (build_dir / INDEX_FILE).is_file():
        return omit(f"{build_dir / INDEX_FILE} does not exist")

    caddyfile_text = read_text(caddyfile)
    if caddyfile_text is None:
        return omit(f"{caddyfile} is not readable")

    host = parse_site_host(caddyfile_text)
    if host is None:
        return omit(f"{caddyfile} names no deployed domain")

    seed_text = read_text(seed)
    if seed_text is None:
        return omit(f"{seed} is not readable")

    owner = parse_site_owner(seed_text)
    if owner is None:
        return omit(f"{seed} holds no usable person")

    metadata = build_metadata(owner, host)
    log(f"seo: generating the SEO artefacts for {metadata.host}")

    written = write_artefacts(build_dir, metadata, last_modified or date.today().isoformat(), log)
    log(f"seo: wrote {', '.join(written)}")

    return Result(written=written)
