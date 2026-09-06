"""Tests for the command line entry point."""

from __future__ import annotations

from pathlib import Path

import pytest

from tools.seo.cli import DEFAULT_BUILD_DIR, REPO_ROOT, build_parser, main
from tools.seo.generate import CADDYFILE_PATH, PROD_SEED_PATH
from tools.seo.tests.fixtures import CADDYFILE, SEED_SQL


class TestDefaults:
    def test_points_at_the_repository_root(self):
        assert (REPO_ROOT / "tools" / "seo" / "cli.py").is_file()

    def test_points_at_the_frontend_build_directory(self):
        assert DEFAULT_BUILD_DIR == REPO_ROOT / "frontend" / "build"

    def test_points_at_the_deployment_sources(self):
        options = build_parser().parse_args([])

        assert options.caddyfile == REPO_ROOT / CADDYFILE_PATH
        assert options.seed == REPO_ROOT / PROD_SEED_PATH
        assert options.last_modified is None


class TestArguments:
    def test_reads_every_path_from_the_command_line(self):
        options = build_parser().parse_args(
            [
                "--build-dir",
                "web",
                "--caddyfile",
                "conf/Caddyfile",
                "--seed",
                "db/seed.sql",
                "--last-modified",
                "2026-09-06",
            ]
        )

        assert options.build_dir == Path("web")
        assert options.caddyfile == Path("conf/Caddyfile")
        assert options.seed == Path("db/seed.sql")
        assert options.last_modified == "2026-09-06"

    def test_rejects_an_unknown_argument(self):
        with pytest.raises(SystemExit):
            build_parser().parse_args(["--nonsense"])


class TestMain:
    def test_generates_from_the_given_paths(self, build_dir, tmp_path, capsys):
        caddyfile = tmp_path / "Caddyfile"
        seed = tmp_path / "seed.sql"
        caddyfile.write_text(CADDYFILE, encoding="utf-8")
        seed.write_text(SEED_SQL, encoding="utf-8")

        status = main(
            ["--build-dir", str(build_dir), "--caddyfile", str(caddyfile), "--seed", str(seed)]
        )

        assert status == 0
        assert (build_dir / "og-image.png").is_file()
        assert "generating" in capsys.readouterr().out

    def test_succeeds_when_no_deployment_data_is_present(self, build_dir, tmp_path, capsys):
        status = main(
            [
                "--build-dir",
                str(build_dir),
                "--caddyfile",
                str(tmp_path / "absent"),
                "--seed",
                str(tmp_path / "absent.sql"),
            ]
        )

        assert status == 0
        assert not (build_dir / "og-image.png").exists()
        assert "omitting" in capsys.readouterr().out
