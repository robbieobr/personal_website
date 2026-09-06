"""Command line entry point for the SEO generator."""

from __future__ import annotations

import argparse
from pathlib import Path

from .generate import CADDYFILE_PATH, PROD_SEED_PATH, generate

#: Repository root, from this file's location inside `tools/seo`.
REPO_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_BUILD_DIR = REPO_ROOT / "frontend" / "build"


def build_parser() -> argparse.ArgumentParser:
    """The argument parser, with defaults pointing at the repository's own layout."""
    parser = argparse.ArgumentParser(
        prog="python -m tools.seo",
        description=(
            "Writes the document head, robots.txt, sitemap.xml and og-image.png into a built "
            "frontend, using the deployment's Caddyfile and production seed. Writes nothing "
            "when either source is absent or still holds its template placeholders."
        ),
    )
    parser.add_argument(
        "--build-dir",
        type=Path,
        default=DEFAULT_BUILD_DIR,
        help="directory holding the built frontend (default: %(default)s)",
    )
    parser.add_argument(
        "--caddyfile",
        type=Path,
        default=REPO_ROOT / CADDYFILE_PATH,
        help="Caddy configuration naming the canonical domain (default: %(default)s)",
    )
    parser.add_argument(
        "--seed",
        type=Path,
        default=REPO_ROOT / PROD_SEED_PATH,
        help="production seed holding the site owner (default: %(default)s)",
    )
    parser.add_argument(
        "--last-modified",
        default=None,
        metavar="YYYY-MM-DD",
        help="date stamped into the sitemap (default: the day of the run)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Runs the generator and returns the process exit status."""
    options = build_parser().parse_args(argv)

    generate(
        build_dir=options.build_dir,
        caddyfile=options.caddyfile,
        seed=options.seed,
        last_modified=options.last_modified,
    )

    return 0
