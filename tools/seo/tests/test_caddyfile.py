"""Tests for reading the canonical host out of a Caddyfile."""

from __future__ import annotations

import pytest

from tools.seo.caddyfile import normalise_host, parse_site_host, read_blocks, strip_comment
from tools.seo.tests.fixtures import CADDYFILE, PLACEHOLDER_CADDYFILE


class TestStripComment:
    def test_drops_a_trailing_comment(self):
        assert strip_comment("example.test { # the site").rstrip() == "example.test {"

    def test_drops_a_whole_comment_line(self):
        assert strip_comment("# a note") == ""

    def test_keeps_a_hash_inside_a_quoted_token(self):
        line = 'header X-Test "a # b"'
        assert strip_comment(line) == line

    def test_keeps_a_hash_that_is_part_of_a_token(self):
        assert strip_comment("basicauth user pass#word") == "basicauth user pass#word"


class TestReadBlocks:
    def test_reads_the_addresses_and_body_of_each_site_block(self):
        blocks = read_blocks(CADDYFILE)

        assert [block.addresses for block in blocks] == [
            ("sample-person.test",),
            ("www.sample-person.test",),
            ("rugby.sample-person.test",),
        ]
        assert "reverse_proxy frontend:3000" in blocks[0].body

    def test_drops_snippet_definitions(self):
        assert read_blocks("(hardening) {\n    encode gzip\n}\n") == []

    def test_drops_the_global_options_block(self):
        assert read_blocks("{\n    email admin@sample-person.test\n}\n") == []

    def test_reads_a_block_written_on_one_line(self):
        blocks = read_blocks("a.test { reverse_proxy app:3000 }")

        assert blocks[0].addresses == ("a.test",)
        assert "reverse_proxy app:3000" in blocks[0].body

    def test_reads_several_addresses_on_one_header(self):
        blocks = read_blocks("a.test, b.test {\n    reverse_proxy app:3000\n}\n")

        assert blocks[0].addresses == ("a.test", "b.test")

    def test_counts_nested_braces(self):
        blocks = read_blocks(
            'a.test {\n    header {\n        X-Test "}"\n    }\n    reverse_proxy app:3000\n}\n'
        )

        assert len(blocks) == 1
        assert "reverse_proxy app:3000" in blocks[0].body

    def test_ignores_braces_inside_quoted_tokens(self):
        blocks = read_blocks('a.test {\n    respond "{"\n    reverse_proxy app:3000\n}\n')

        assert len(blocks) == 1


class TestNormaliseHost:
    @pytest.mark.parametrize(
        ("address", "expected"),
        [
            ("Sample-Person.test", "sample-person.test"),
            ("https://sample-person.test", "sample-person.test"),
            ("http://sample-person.test:8443", "sample-person.test"),
            ("sample-person.test:443", "sample-person.test"),
            ("sample-person.test/path", "sample-person.test"),
        ],
    )
    def test_reduces_an_address_to_a_bare_host(self, address, expected):
        assert normalise_host(address) == expected

    @pytest.mark.parametrize(
        "address",
        [
            "",
            "localhost",
            "*.sample-person.test",
            "192.168.0.1",
            "10.0.0.1:443",
            ".sample-person.test",
            "sample-person.test.",
            "-sample.test",
            "sample.test-",
            ":443",
        ],
    )
    def test_rejects_an_address_that_names_no_host(self, address):
        assert normalise_host(address) is None


class TestParseSiteHost:
    def test_returns_the_host_of_the_first_reverse_proxy_block(self):
        assert parse_site_host(CADDYFILE) == "sample-person.test"

    def test_rejects_the_template_placeholder_domain(self):
        assert parse_site_host(PLACEHOLDER_CADDYFILE) is None

    @pytest.mark.parametrize("placeholder", ["example.com", "example.org", "app.example.net"])
    def test_rejects_every_placeholder_family_domain(self, placeholder):
        assert parse_site_host(f"{placeholder} {{\n    reverse_proxy app:3000\n}}\n") is None

    def test_skips_a_block_that_only_redirects(self):
        caddyfile = (
            "old.test {\n    redir https://sample-person.test{uri} permanent\n}\n\n"
            "sample-person.test {\n    reverse_proxy frontend:3000\n}\n"
        )

        assert parse_site_host(caddyfile) == "sample-person.test"

    def test_skips_a_www_address_on_a_reverse_proxy_block(self):
        caddyfile = "www.sample-person.test, sample-person.test {\n    reverse_proxy app:3000\n}\n"

        assert parse_site_host(caddyfile) == "sample-person.test"

    def test_returns_none_when_only_www_is_proxied(self):
        assert parse_site_host("www.sample-person.test {\n    reverse_proxy app:3000\n}\n") is None

    def test_returns_none_when_nothing_is_proxied(self):
        assert parse_site_host('sample-person.test {\n    respond "hi"\n}\n') is None

    def test_returns_none_for_an_empty_file(self):
        assert parse_site_host("") is None

    def test_ignores_a_commented_out_site_block(self):
        caddyfile = (
            "# other.test {\n#     reverse_proxy app:3000\n# }\n\n"
            "sample-person.test {\n    reverse_proxy frontend:3000\n}\n"
        )

        assert parse_site_host(caddyfile) == "sample-person.test"

    def test_ignores_a_snippet_that_holds_a_reverse_proxy(self):
        caddyfile = (
            "(proxy) {\n    reverse_proxy app:3000\n}\n\n"
            "sample-person.test {\n    import proxy\n    reverse_proxy frontend:3000\n}\n"
        )

        assert parse_site_host(caddyfile) == "sample-person.test"

    def test_does_not_match_reverse_proxy_as_part_of_a_longer_word(self):
        assert parse_site_host("a.test {\n    no_reverse_proxying on\n}\n") is None
